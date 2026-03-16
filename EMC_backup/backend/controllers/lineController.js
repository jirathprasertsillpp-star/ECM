// controllers/lineController.js
const path       = require('path');
const fs         = require('fs');
const line       = require('../services/lineClientService');
const msg        = require('../services/lineMessageService');
const ai         = require('../services/aiService');        // OCR
const drive      = require('../services/googleDriveService');
const sheets     = require('../services/googleSheetsService');
const db         = require('../config/database');

// ─────────────────────────────────────────────
// WEBHOOK ENTRY POINT
// ─────────────────────────────────────────────

async function handleWebhook(req, res) {
  res.status(200).json({ ok: true }); // ตอบ Line ก่อนเสมอ

  if (!req.body.events) return;

  for (const event of req.body.events) {
    try { await routeEvent(event); }
    catch (e) { console.error('[LINE]', e.message); }
  }
}

async function routeEvent(event) {
  const uid   = event.source.userId;
  const token = event.replyToken;

  if (event.type === 'follow')    return onFollow(token, uid);
  if (event.type === 'postback')  return onPostback(token, uid, event.postback.data);
  if (event.type !== 'message')   return;

  if (event.message.type === 'image') return onImage(token, uid, event.message.id);
  if (event.message.type === 'text')  return onText(token, uid, event.message.text);
}

// ─────────────────────────────────────────────
// FOLLOW — ผู้ใช้ add Line OA
// ─────────────────────────────────────────────

async function onFollow(token, lineUserId) {
  try {
    const profile = await line.getProfile(lineUserId);
    await line.reply(token, msg.welcomeMessage(profile.displayName));
  } catch (error) {
    console.error('onFollow error', error);
  }
}

// ─────────────────────────────────────────────
// FEATURE 1: รับรูปใบเสร็จ → AI OCR
// ─────────────────────────────────────────────

async function onImage(token, lineUserId, messageId) {
  // แจ้ง Processing ทันที
  await line.reply(token, msg.loadingMessage('กำลังอ่านใบเสร็จ...'));

  // ตรวจว่า Link account แล้วหรือยัง
  const user = await findUser(lineUserId);
  if (!user) {
    return line.push(lineUserId, msg.notLinkedMessage());
  }

  // ดาวน์โหลดรูปจาก Line
  const stream  = await line.getContent(messageId);
  const chunks  = [];
  for await (const chunk of stream) chunks.push(chunk);
  const imgBuf  = Buffer.concat(chunks);
  const base64  = imgBuf.toString('base64');

  // Claude OCR
  let ocr;
  try {
    ocr = await ai.ocrReceipt(base64, 'image/jpeg');
    ocr = {
      vendor_name: 'Unknown',
      date: new Date().toISOString().split('T')[0],
      total_amount: 0,
      category_th: 'อื่นๆ',
      confidence: 0.9,
      ...ocr
    };
  } catch (err) {
    console.error('OCR Error', err);
    return line.push(lineUserId, { type: 'text', text: 'เกิดข้อผิดพลาดในการอ่านใบเสร็จครับ' });
  }

  // เก็บ Session รอ User ยืนยัน
  await db.query(`
    INSERT INTO line_sessions (line_user_id, session_type, session_data)
    VALUES ($1, 'receipt_ocr', $2)
  `, [lineUserId, JSON.stringify({ ocr, base64 })]);

  // ส่งผล OCR พร้อมปุ่ม "ยืนยัน" / "แก้ไขใน Web"
  await line.push(lineUserId, msg.ocrResultMessage(ocr));
}

// ─────────────────────────────────────────────
// FEATURE 2: เช็ค Status (Text commands)
// ─────────────────────────────────────────────

async function onText(token, lineUserId, text) {
  const t = text.trim();

  // เช็ค Status ล่าสุด
  if (['สถานะ', 'status', 'เช็ค', 'check', 'ดู'].includes(t.toLowerCase())) {
    return showMyStatus(token, lineUserId);
  }

  // เช็คเฉพาะ Claim เช่น "EXP-2026-001"
  if (/^EXP-\d{4}-\d{3,}$/i.test(t)) {
    return showClaimDetail(token, lineUserId, t.toUpperCase());
  }

  // เมนูหลัก
  if (['เมนู', 'menu', 'help', '?'].includes(t.toLowerCase())) {
    return line.reply(token, msg.mainMenuMessage());
  }

  // Default
  await line.reply(token, msg.mainMenuMessage());
}

async function showMyStatus(token, lineUserId) {
  const user = await findUser(lineUserId);
  if (!user) return line.reply(token, msg.notLinkedMessage());

  const { rows } = await db.query(`
    SELECT id, claim_number, project_name, total_amount, status, created_at
    FROM expense_claims
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 5
  `, [user.id]);

  await line.reply(token, msg.claimListMessage(rows));
}

async function showClaimDetail(token, lineUserId, claimNumber) {
  const { rows } = await db.query(
    'SELECT * FROM expense_claims WHERE claim_number = $1',
    [claimNumber]
  );
  if (!rows[0]) {
    return line.reply(token, { type: 'text', text: `ไม่พบ Claim ${claimNumber} ครับ` });
  }
  await line.reply(token, msg.claimDetailMessage(rows[0]));
}

// ─────────────────────────────────────────────
// FEATURE 4: Approve / Reject ผ่าน Postback
// ─────────────────────────────────────────────

async function onPostback(token, lineUserId, data) {
  const p       = new URLSearchParams(data);
  const action  = p.get('action');
  const claimId = p.get('claimId');

  const user = await findUser(lineUserId);
  if (!user) return line.reply(token, msg.notLinkedMessage());

  if (action === 'approve') return doApprove(token, user, claimId);
  if (action === 'reject')  return doReject(token, user, claimId);
  if (action === 'confirm_ocr') return doConfirmOCR(token, user, lineUserId);
  if (action === 'view_detail') return showClaimDetailById(token, lineUserId, claimId);
  if (action === 'open_web') {
    return line.reply(token, {
      type: 'text',
      text: `เปิดระบบ ECMS: ${process.env.APP_URL}/claims/${claimId}`
    });
  }
}

async function showClaimDetailById(token, lineUserId, claimId) {
    const { rows } = await db.query('SELECT * FROM expense_claims WHERE id = $1', [claimId]);
    if (!rows[0]) return;
    await line.reply(token, msg.claimDetailMessage(rows[0]));
}

async function doApprove(token, approver, claimId) {
  const { rows } = await db.query('SELECT * FROM expense_claims WHERE id = $1', [claimId]);
  const claim    = rows[0];
  if (!claim) return;

  // ตรวจสิทธิ์
  const canApprove =
    (claim.status === 'pending_accounting' && approver.role === 'accounting') ||
    (claim.status === 'pending_pco'        && approver.role === 'pco');

  if (!canApprove) {
    return line.reply(token, { type: 'text', text: 'คุณไม่มีสิทธิ์อนุมัติ Claim นี้ในขณะนี้ครับ' });
  }

  // คำนวณ Status ถัดไป
  const nextStatus = claim.status === 'pending_accounting' ? 'pending_pco' : 'approved';

  await db.query(
    'UPDATE expense_claims SET status = $1, updated_at = NOW() WHERE id = $2',
    [nextStatus, claimId]
  );

  await db.query(`
    INSERT INTO approval_logs (claim_id, action, performed_by, note)
    VALUES ($1, 'approved', $2, 'อนุมัติผ่าน Line OA')
  `, [claimId, approver.id]);

  // Sync Google Sheets
  await sheets.syncApprovalLog(claim.claim_number, 'approved', approver.name, 'ผ่าน Line', nextStatus);

  // แจ้ง PM ไปแล้วใน notifyNext/notifyOwner แต่นี่เราทำเลย
  const lineNotify = require('../services/lineNotifyService');

  if (nextStatus === 'approved') {
    await lineNotify.notifyClaimOwner(claim, 'approved');
  } else {
    // แจ้ง PCO ว่ามีงานรอ
    await lineNotify.notifyApprovers(claim, 'pco');
    // อัปเดต owner
    await lineNotify.notifyClaimOwner(claim, nextStatus);
  }

  await line.reply(token, msg.approveSuccessMessage(claim.claim_number, nextStatus));
}

async function doReject(token, approver, claimId) {
  const { rows } = await db.query('SELECT * FROM expense_claims WHERE id = $1', [claimId]);
  const claim    = rows[0];
  if (!claim) return;

  await db.query(
    'UPDATE expense_claims SET status = $1, updated_at = NOW() WHERE id = $2',
    ['rejected', claimId]
  );

  await db.query(`
    INSERT INTO approval_logs (claim_id, action, performed_by, note)
    VALUES ($1, 'rejected', $2, 'ส่งกลับผ่าน Line OA')
  `, [claimId, approver.id]);

  await sheets.syncApprovalLog(claim.claim_number, 'rejected', approver.name, 'ผ่าน Line', 'rejected');

  // แจ้ง PM ว่าถูกส่งกลับ
  const lineNotify = require('../services/lineNotifyService');
  await lineNotify.notifyClaimOwner(claim, 'rejected');

  await line.reply(token, msg.rejectSuccessMessage(claim.claim_number));
}

async function doConfirmOCR(token, user, lineUserId) {
  // ดึง Session
  const { rows } = await db.query(`
    SELECT * FROM line_sessions
    WHERE line_user_id = $1 AND session_type = 'receipt_ocr'
    AND expires_at > NOW()
    ORDER BY created_at DESC LIMIT 1
  `, [lineUserId]);

  if (!rows[0]) {
    return line.reply(token, { type: 'text', text: 'Session หมดอายุแล้วครับ กรุณาส่งรูปใบเสร็จใหม่' });
  }

  const { ocr, base64 } = rows[0].session_data;
  const claimNumber = generateClaimNumber();

  // 1. สร้าง Claim Draft
  const { rows: claimRows } = await db.query(`
    INSERT INTO expense_claims
      (user_id, claim_number, project_name, total_amount, status, notes)
    VALUES ($1, $2, 'สร้างจาก Line (รอกรอกชื่อโครงการ)', $3, 'draft', 'สร้างจาก Line OA')
    RETURNING id, claim_number
  `, [user.id, claimNumber, ocr.total_amount || 0]);

  const claimId = claimRows[0].id;

  // 2. สร้าง Item
  const { rows: itemRows } = await db.query(`
    INSERT INTO expense_items (claim_id, item_date, category, description, amount, vendor_name, is_fuel)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `, [
    claimId, 
    ocr.date || new Date().toISOString().split('T')[0], 
    ocr.category_key || 'other', 
    ocr.description || `OCR: ${ocr.vendor_name || 'ใบเสร็จ'}`, 
    ocr.total_amount || 0,
    ocr.vendor_name,
    ocr.category_key === 'fuel'
  ]);

  const itemId = itemRows[0].id;

  // 3. เก็บไฟล์ลงเครื่อง (เพื่อให้ Web ดูได้)
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uploadDirRel = path.join('uploads', year, month);
  const uploadDirAbs = path.join(__dirname, '..', uploadDirRel);
  
  if (!fs.existsSync(uploadDirAbs)) {
    fs.mkdirSync(uploadDirAbs, { recursive: true });
  }

  const filename = `receipt_line_${Date.now()}.jpg`;
  const fileAbsPath = path.join(uploadDirAbs, filename);
  const fileRelPath = path.join(uploadDirRel, filename);
  
  fs.writeFileSync(fileAbsPath, Buffer.from(base64, 'base64'));

  // 4. สร้างบันทึก Receipt
  const { rows: receiptRows } = await db.query(`
    INSERT INTO receipts (item_id, filename, original_name, file_path, mime_type, ai_extracted_data, ai_confidence)
    VALUES ($1, $2, $3, $4, 'image/jpeg', $5, $6)
    RETURNING id
  `, [itemId, filename, filename, fileRelPath, JSON.stringify(ocr), ocr.confidence || 0.9]);

  // 5. อัปโหลดขึ้น Drive (Async)
  drive.uploadReceipt(
    Buffer.from(base64, 'base64'), 
    filename, 
    'image/jpeg', 
    claimNumber, 
    new Date()
  ).then(res => {
     db.query('UPDATE receipts SET drive_link=$1, drive_file_id=$2 WHERE id=$3', [res.link, res.fileId, receiptRows[0].id]);
  }).catch(console.error);

  // ลบ Session
  await db.query('DELETE FROM line_sessions WHERE line_user_id = $1', [lineUserId]);

  await line.reply(token, msg.confirmOCRSuccessMessage(claimNumber));
}

// ─────────────────────────────────────────────
// LINK ACCOUNT — เรียกจาก Web
// ─────────────────────────────────────────────

async function linkAccount(req, res) {
  const { userId, lineUserId, lineDisplayName } = req.body;
  if (!userId || !lineUserId) return res.status(400).json({ error: 'Missing data' });

  try {
      await db.query(`
        UPDATE users SET line_user_id = $1, line_display_name = $2
        WHERE id = $3
      `, [lineUserId, lineDisplayName, userId]);
      res.json({ success: true });
  } catch (err) {
      console.error('link account err', err);
      res.status(500).json({ error: 'DB Error' });
  }
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function findUser(lineUserId) {
  const { rows } = await db.query(
    'SELECT * FROM users WHERE line_user_id = $1', [lineUserId]
  );
  return rows[0] || null;
}

function generateClaimNumber() {
  const now = new Date();
  const yy  = now.getFullYear();
  const seq  = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `EXP-${yy}-${seq}`;
}

module.exports = { handleWebhook, linkAccount };
