const nodemailer = require('nodemailer');

let transporter;
try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
} catch (e) {
  console.warn('⚠️ Email Service (SMTP) is not configured.');
}

async function notifyAccountingNewClaim(claim, accountingEmails) {
  if (!transporter || !process.env.SMTP_USER || accountingEmails.length === 0) {
    console.log('[EmailService Stub] notifyAccountingNewClaim:', claim.claim_number);
    return;
  }
  
  try {
    await transporter.sendMail({
      from: `"ECMS System" <${process.env.SMTP_USER}>`,
      to: accountingEmails.join(','),
      subject: `[ECMS] Claim ใหม่รอตรวจสอบ — ${claim.claim_number}`,
      html: `
        <h2>มี Claim ใหม่รอการตรวจสอบ</h2>
        <p><strong>Claim:</strong> ${claim.claim_number}</p>
        <p><strong>โครงการ:</strong> ${claim.project_name}</p>
        <p><strong>ยอดรวม:</strong> ฿${Number(claim.total_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
        <p><a href="${process.env.FRONTEND_URL}/claims/${claim.id}">คลิกเพื่อตรวจสอบ</a></p>
      `
    });
  } catch (error) {
    console.error('Email Error:', error);
  }
}

async function notifyClaimResult(claim, ownerEmail, status) {
  if (!transporter || !process.env.SMTP_USER || !ownerEmail) {
     console.log('[EmailService Stub] notifyClaimResult:', claim.claim_number, status);
     return;
  }

  const isOK = status === 'approved';
  try {
    await transporter.sendMail({
      from: `"ECMS System" <${process.env.SMTP_USER}>`,
      to: ownerEmail,
      subject: `[ECMS] ${claim.claim_number} — ${isOK ? 'อนุมัติแล้ว' : 'ถูกส่งกลับ'}`,
      html: `
        <h2>${isOK ? '✅ Claim ได้รับการอนุมัติ' : '⚠️ Claim ถูกส่งกลับ'}</h2>
        <p><strong>Claim:</strong> ${claim.claim_number}</p>
        <p><strong>ยอดรวม:</strong> ฿${Number(claim.total_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
        ${!isOK && claim.rejection_reason ? `<p><strong>เหตุผล:</strong> ${claim.rejection_reason}</p>` : ''}
        <p><a href="${process.env.FRONTEND_URL}/claims/${claim.id}">ดูรายละเอียด</a></p>
      `
    });
  } catch (error) {
    console.error('Email Error:', error);
  }
}

module.exports = { notifyAccountingNewClaim, notifyClaimResult };
