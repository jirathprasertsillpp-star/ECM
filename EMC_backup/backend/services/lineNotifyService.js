// services/lineNotifyService.js
// ไฟล์นี้ให้ Controller อื่น (claimsController, approvalController)
// import แล้วเรียกใช้เพื่อ push notification ผ่าน Line

const line = require('./lineClientService');
const msg  = require('./lineMessageService');
const db   = require('../config/database');

/**
 * แจ้งเตือน Approver ว่ามีงานรอ
 * เรียกจาก claimsController เมื่อ PM submit
 */
async function notifyApprovers(claim, targetRole) {
  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE role = $1 AND line_user_id IS NOT NULL',
      [targetRole]
    );
    for (const approver of rows) {
      await line.push(approver.line_user_id, msg.approvalRequestMessage(claim, approver));
    }
  } catch (error) {
    console.error('Line notifyApprovers error:', error);
  }
}

/**
 * แจ้ง PM เมื่อ Status เปลี่ยน
 * เรียกจาก approvalController
 */
async function notifyClaimOwner(claim, status) {
  try {
    const { rows } = await db.query(
      'SELECT * FROM users WHERE id = $1 AND line_user_id IS NOT NULL',
      [claim.user_id]
    );
    if (!rows[0]) return;
    await line.push(rows[0].line_user_id, msg.statusNotifyMessage(claim, status));
  } catch (error) {
    console.error('Line notifyClaimOwner error:', error);
  }
}

module.exports = { notifyApprovers, notifyClaimOwner };
