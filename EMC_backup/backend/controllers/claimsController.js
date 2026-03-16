const db = require('../config/database');

// Generate claim number
function generateClaimNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `EC-${year}-${random}`;
}

exports.list = async (req, res) => {
    try {
        const { status, month, user_id } = req.query;
        let query = `
      SELECT ec.*, u.name as user_name, u.email as user_email,
        (SELECT COUNT(*) FROM expense_items WHERE claim_id = ec.id) as item_count
      FROM expense_claims ec
      JOIN users u ON ec.user_id = u.id
      WHERE 1=1
    `;
        const params = [];

        if (status) {
            params.push(status);
            query += ` AND ec.status = $${params.length}`;
        }
        if (month) {
            params.push(month);
            query += ` AND ec.claim_month = $${params.length}`;
        }
        if (user_id) {
            params.push(user_id);
            query += ` AND ec.user_id = $${params.length}`;
        }

        query += ' ORDER BY ec.created_at DESC';

        const result = await db.query(query, params);
        res.json({ claims: result.rows });
    } catch (err) {
        console.error('List claims error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};

exports.create = async (req, res) => {
    try {
        const { project_name, project_code, claim_month, notes } = req.body;
        if (!project_name || !claim_month) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const claim_number = generateClaimNumber();
        const result = await db.query(
            `INSERT INTO expense_claims (claim_number, user_id, project_name, project_code, claim_month, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [claim_number, req.user.id, project_name, project_code, claim_month, notes]
        );

        res.status(201).json({ claim: result.rows[0] });
    } catch (err) {
        console.error('Create claim error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้าง Claim' });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;

        const claimResult = await db.query(
            `SELECT ec.*, u.name as user_name, u.email as user_email
       FROM expense_claims ec
       JOIN users u ON ec.user_id = u.id
       WHERE ec.id = $1`,
            [id]
        );

        if (claimResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบ Claim' });
        }

        const claim = claimResult.rows[0];

        // Get items with fuel details and receipts
        const { rows: itemRows } = await db.query(
            `SELECT ei.*, 
        json_agg(DISTINCT jsonb_build_object(
          'id', r.id, 'filename', r.filename, 'original_name', r.original_name,
          'file_path', r.file_path, 'file_url', '/' || r.file_path, 'mime_type', r.mime_type,
          'ai_extracted_data', r.ai_extracted_data, 'ai_confidence', r.ai_confidence
        )) FILTER (WHERE r.id IS NOT NULL) as receipts,
        json_agg(DISTINCT jsonb_build_object(
          'id', fd.id, 'odometer_start', fd.odometer_start, 'odometer_end', fd.odometer_end,
          'distance_km', fd.distance_km, 'origin_address', fd.origin_address,
          'destination_address', fd.destination_address, 'maps_distance_km', fd.maps_distance_km,
          'work_type', fd.work_type, 'project_task', fd.project_task,
          'work_category', fd.work_category, 'ai_verified', fd.ai_verified,
          'ai_verification_note', fd.ai_verification_note
        )) FILTER (WHERE fd.id IS NOT NULL) as fuel_details
       FROM expense_items ei
       LEFT JOIN receipts r ON r.item_id = ei.id
       LEFT JOIN fuel_details fd ON fd.item_id = ei.id
       WHERE ei.claim_id = $1
       GROUP BY ei.id
       ORDER BY ei.item_date`,
            [id]
        );

        // Map singular receipt for frontend compatibility
        const items = itemRows.map(item => ({
            ...item,
            receipt: item.receipts ? item.receipts[0] : null,
            fuel_detail: item.fuel_details ? item.fuel_details[0] : null
        }));

        // Get approval logs
        const logsResult = await db.query(
            `SELECT al.*, u.name as performed_by_name
       FROM approval_logs al
       JOIN users u ON al.performed_by = u.id
       WHERE al.claim_id = $1
       ORDER BY al.created_at ASC`,
            [id]
        );

        res.json({
            claim,
            items,
            logs: logsResult.rows
        });
    } catch (err) {
        console.error('Get claim error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { project_name, project_code, claim_month, notes } = req.body;

        // Check claim exists and is draft
        const claimCheck = await db.query('SELECT status FROM expense_claims WHERE id = $1', [id]);
        if (claimCheck.rows.length === 0) return res.status(404).json({ error: 'ไม่พบ Claim' });
        if (claimCheck.rows[0].status !== 'draft') {
            return res.status(400).json({ error: 'แก้ไขได้เฉพาะ Claim ที่เป็นแบบร่างเท่านั้น' });
        }

        const result = await db.query(
            `UPDATE expense_claims SET project_name = COALESCE($1, project_name), 
       project_code = COALESCE($2, project_code), claim_month = COALESCE($3, claim_month),
       notes = COALESCE($4, notes), updated_at = NOW()
       WHERE id = $5 RETURNING *`,
            [project_name, project_code, claim_month, notes, id]
        );

        res.json({ claim: result.rows[0] });
    } catch (err) {
        console.error('Update claim error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไข' });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        const claimCheck = await db.query('SELECT status FROM expense_claims WHERE id = $1', [id]);
        if (claimCheck.rows.length === 0) return res.status(404).json({ error: 'ไม่พบ Claim' });
        if (claimCheck.rows[0].status !== 'draft') {
            return res.status(400).json({ error: 'ลบได้เฉพาะ Claim ที่เป็นแบบร่างเท่านั้น' });
        }

        await db.query('DELETE FROM expense_claims WHERE id = $1', [id]);
        res.json({ message: 'ลบสำเร็จ' });
    } catch (err) {
        console.error('Delete claim error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบ' });
    }
};

const ai = require('../services/aiService');
const drive = require('../services/googleDriveService');
const sheets = require('../services/googleSheetsService');
const lineNotify = require('../services/lineNotifyService');
const emailSvc = require('../services/emailService');

exports.submitClaim = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM expense_claims WHERE id=$1', [id]);
    const claim = rows[0];

    if (!claim) return res.status(404).json({ error: 'ไม่พบ Claim' });
    if (claim.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'ไม่มีสิทธิ์' });
    if (claim.status !== 'draft') return res.status(400).json({ error: 'Claim นี้ไม่ใช่ Draft' });

    // AI Anomaly Check 
    const { rows: items } = await db.query('SELECT * FROM expense_items WHERE claim_id=$1', [id]);
    const anomaly = await ai.detectAnomalies(claim, items, {});

    // สร้าง Drive Folder
    const { folderId, folderUrl } = await drive.createClaimFolder(claim.claim_number, claim.created_at || new Date());

    // Upload Receipts
    const fs = require('fs');
    for (let item of items) {
       const rQuery = await db.query('SELECT * FROM receipts WHERE item_id=$1', [item.id]);
       if(rQuery.rows.length > 0) {
          const receipt = rQuery.rows[0];
          if(fs.existsSync(receipt.file_path)) {
             const buffer = fs.readFileSync(receipt.file_path);
             const driveRes = await drive.uploadReceipt(buffer, receipt.original_name, receipt.mime_type, claim.claim_number, claim.created_at);
             item.receipt_drive_link = driveRes.link;
             
             // Update receipt with drive link
             await db.query('UPDATE receipts SET drive_link=$1, drive_file_id=$2 WHERE id=$3', [driveRes.link, driveRes.fileId, receipt.id]);
          }
       }
    }

    await db.query(
      `UPDATE expense_claims SET status='pending_accounting', drive_folder_id=$1, drive_folder_url=$2,
       ai_anomaly_flagged=$3, ai_anomaly_reason=$4, updated_at=NOW() WHERE id=$5`,
      [folderId, folderUrl, anomaly.flagged || false, anomaly.recommendation || '', id]
    );

    const submitterRes = await db.query('SELECT name FROM users WHERE id=$1', [req.user.id]);
    const submitterName = submitterRes.rows[0]?.name;

    await db.query(
      `INSERT INTO approval_logs (claim_id, action, performed_by, from_status, to_status)
       VALUES ($1,'submitted',$2,'draft','pending_accounting')`,
      [id, req.user.id]
    );

    const updatedClaim = { ...claim, status: 'pending_accounting', drive_folder_url: folderUrl, submitter_name: submitterName || 'Unknown' };
    await sheets.syncClaim(updatedClaim, items);
    
    // แจ้ง Accounting ผ่าน Line + Email
    await lineNotify.notifyApprovers(updatedClaim, 'accounting');
    
    const accQuery = await db.query("SELECT email FROM users WHERE role='accounting'");
    const accEmails = accQuery.rows.map(r => r.email).filter(Boolean);
    if(accEmails.length > 0) emailSvc.notifyAccountingNewClaim(updatedClaim, accEmails);

    res.json({ success: true, message: 'ส่ง Claim สำเร็จ', status: 'pending_accounting' });
  } catch(error) {
     console.error('Submit Claim error:', error);
     res.status(500).json({ error: 'เกิดข้อผิดพลาดในการ Submit Claim' });
  }
};

exports.ocrReceipt = async (req, res) => {
  try {
    if (!req.file && !req.body.image) return res.status(400).json({ error: 'กรุณาแนบรูปภาพใบเสร็จ' });
    let base64 = '';
    let mimeType = 'image/jpeg';
    if(req.file) {
      const fs = require('fs');
      base64 = req.file.buffer ? req.file.buffer.toString('base64') : fs.readFileSync(req.file.path).toString('base64');
      mimeType = req.file.mimetype;
    } else {
      base64 = req.body.image.split(',')[1] || req.body.image;
    }
    const result = await ai.ocrReceipt(base64, mimeType);
    res.json(result);
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอ่านใบเสร็จ' });
  }
};
