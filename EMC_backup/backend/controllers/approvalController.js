const db = require('../config/database');
const lineNotify = require('../services/lineNotifyService');
const emailSvc = require('../services/emailService');
const sheetsSvc = require('../services/googleSheetsService');

async function approve(req, res) {
  try {
    const { id } = req.params;
    const approver = req.user;

    const { rows } = await db.query('SELECT * FROM expense_claims WHERE id = $1', [id]);
    const claim = rows[0];
    if (!claim) return res.status(404).json({ error: 'ไม่พบ Claim' });

    const canApprove =
      (claim.status === 'pending_accounting' && approver.role === 'accounting') ||
      (claim.status === 'pending_pco' && approver.role === 'pco');
    if (!canApprove) return res.status(403).json({ error: 'ไม่มีสิทธิ์อนุมัติ' });

    const nextStatus = claim.status === 'pending_accounting' ? 'pending_pco' : 'approved';

    await db.query(
      `UPDATE expense_claims SET status=$1, updated_at=NOW() WHERE id=$2`,
      [nextStatus, id]
    );

    const from_status = claim.status;
    await db.query(
      `INSERT INTO approval_logs (claim_id, action, performed_by, performed_via, from_status, to_status)
       VALUES ($1, 'approved', $2, 'web', $3, $4)`,
      [id, approver.id, from_status, nextStatus]
    );

    // Sync Sheets
    await sheetsSvc.syncApprovalLog(claim.claim_number, 'approved', approver.name, 'Web', nextStatus);

    // แจ้ง PM ผ่าน Line + Email
    const emailRes = await db.query('SELECT email FROM users WHERE id = $1', [claim.user_id]);
    const ownerEmail = emailRes.rows[0]?.email;
    const updatedClaim = { ...claim, status: nextStatus };

    await lineNotify.notifyClaimOwner(updatedClaim, nextStatus);
    if(ownerEmail) emailSvc.notifyClaimResult(updatedClaim, ownerEmail, nextStatus);

    // ถ้า pending_pco → แจ้ง PCO
    if (nextStatus === 'pending_pco') {
      await lineNotify.notifyApprovers(updatedClaim, 'pco');
    }

    res.json({ message: 'อนุมัติสำเร็จ', success: true, status: nextStatus });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
}

async function reject(req, res) {
  try {
    const { id } = req.params;
    const { reason, note } = req.body;
    const rejectionReason = reason || note;
    const approver = req.user;

    if (!rejectionReason) {
       return res.status(400).json({ error: 'กรุณาระบุเหตุผลในการปฏิเสธ' });
    }

    const { rows } = await db.query('SELECT * FROM expense_claims WHERE id = $1', [id]);
    const claim = rows[0];
    if (!claim) return res.status(404).json({ error: 'ไม่พบ Claim' });

    await db.query(
      `UPDATE expense_claims SET status='rejected', rejection_reason=$1, updated_at=NOW() WHERE id=$2`,
      [rejectionReason, id]
    );

    const from_status = claim.status;
    await db.query(
      `INSERT INTO approval_logs (claim_id, action, performed_by, performed_via, from_status, to_status, note)
       VALUES ($1, 'rejected', $2, 'web', $3, 'rejected', $4)`,
      [id, approver.id, from_status, rejectionReason]
    );

    await sheetsSvc.syncApprovalLog(claim.claim_number, 'rejected', approver.name, 'Web', 'rejected');

    const updatedClaim = { ...claim, rejection_reason: rejectionReason, status: 'rejected' };
    await lineNotify.notifyClaimOwner(updatedClaim, 'rejected');

    const emailRes = await db.query('SELECT email FROM users WHERE id = $1', [claim.user_id]);
    if(emailRes.rows[0]?.email) emailSvc.notifyClaimResult(updatedClaim, emailRes.rows[0].email, 'rejected');

    res.json({ message: 'ปฏิเสธ Claim สำเร็จ', success: true, status: 'rejected' });
  } catch(err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
}

// Retaining getLogs logic as it was required
async function getLogs(req, res) {
  try {
      const { id } = req.params;
      const result = await db.query(
          `SELECT al.*, u.name as performed_by_name
     FROM approval_logs al
     JOIN users u ON al.performed_by = u.id
     WHERE al.claim_id = $1
     ORDER BY al.created_at ASC`,
          [id]
      );
      res.json({ logs: result.rows });
  } catch (err) {
      console.error('Get logs error:', err);
      res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
}

// Equivalent of getQueue from prompt
async function getQueue(req, res) {
  try {
    const approver = req.user;
    const targetStatus = approver.role === 'pco' ? 'pending_pco' : 'pending_accounting';

    const { rows } = await db.query(
      `SELECT c.*, u.name as submitter_name
       FROM expense_claims c
       JOIN users u ON c.user_id = u.id
       WHERE c.status = $1
       ORDER BY c.created_at ASC`,
      [targetStatus]
    );
    res.json({ claims: rows });
  } catch(err) {
     console.error('Get queue error:', err);
     res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
}

// Re-map the original exports
module.exports = { approve, reject, getLogs, getQueue, submit: async (req, res) => {
    // Moved to claimsController per SECTION 13? In original codebase, perhaps it was here. Let's keep it here but adapt since the route might point here.
    const claimsController = require('./claimsController');
    return claimsController.submitClaim(req, res);
}};
