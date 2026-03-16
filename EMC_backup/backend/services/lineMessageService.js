// services/lineMessageService.js

const BRAND_COLOR = '#1E3A5F';
const ACCENT      = '#2563EB';
const SUCCESS     = '#16A34A';
const DANGER      = '#E11D48';
const WARNING     = '#D97706';

// ─── STATUS COLORS ────────────────────────────────────────
const STATUS = {
  draft:               { label: 'ร่าง',              color: '#9CA3AF' },
  pending_accounting:  { label: 'รอบัญชีตรวจสอบ',    color: WARNING   },
  pending_pco:         { label: 'รอ PCO ลงนาม',       color: ACCENT    },
  approved:            { label: 'อนุมัติแล้ว',         color: SUCCESS   },
  rejected:            { label: 'ถูกส่งกลับ',           color: DANGER    },
};

// ─── 1. WELCOME ───────────────────────────────────────────
function welcomeMessage(displayName) {
  return {
    type: 'flex',
    altText: `ยินดีต้อนรับสู่ ECMS, ${displayName}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: BRAND_COLOR, paddingAll: '20px',
        contents: [
          { type: 'text', text: 'ECMS', color: '#FFFFFF', size: 'xxl', weight: 'bold' },
          { type: 'text', text: 'Expense Claim Management', color: '#93C5FD', size: 'sm' }
        ]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
        contents: [
          { type: 'text', text: `สวัสดีครับ ${displayName}`, weight: 'bold', size: 'lg' },
          { type: 'text', text: 'เชื่อม Line กับบัญชี ECMS เพื่อเริ่มใช้งานครับ', size: 'sm', color: '#6B7280', wrap: true },
          {
            type: 'button', style: 'primary', color: ACCENT, margin: 'lg',
            action: { type: 'uri', label: 'เชื่อมบัญชี ECMS', uri: `${process.env.APP_URL}/line-link` }
          }
        ]
      }
    }
  };
}

// ─── 2. MAIN MENU ─────────────────────────────────────────
function mainMenuMessage() {
  return {
    type: 'flex',
    altText: 'เมนู ECMS',
    contents: {
      type: 'bubble',
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
        contents: [
          { type: 'text', text: 'เมนูหลัก', weight: 'bold', size: 'lg', margin: 'none' },
          { type: 'separator', margin: 'md' },
          menuRow('📄', 'ส่งรูปใบเสร็จ', 'ถ่ายรูปใบเสร็จส่งได้เลย'),
          menuRow('🔍', 'เช็ค Status', 'พิมพ์ "สถานะ" หรือเลข Claim'),
          menuRow('📊', 'เปิดระบบเต็ม', 'เปิดใน Browser', true),
        ]
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px',
        contents: [{
          type: 'button', style: 'primary', color: ACCENT,
          action: { type: 'uri', label: 'เปิด ECMS', uri: process.env.APP_URL }
        }]
      }
    }
  };
}

function menuRow(icon, title, subtitle, isLink = false) {
  return {
    type: 'box', layout: 'horizontal', margin: 'md', spacing: 'md',
    contents: [
      { type: 'text', text: icon, size: 'xl', flex: 0 },
      {
        type: 'box', layout: 'vertical', flex: 1,
        contents: [
          { type: 'text', text: title, weight: 'bold', size: 'sm' },
          { type: 'text', text: subtitle, size: 'xs', color: '#9CA3AF' }
        ]
      }
    ]
  };
}

// ─── 3. OCR RESULT ────────────────────────────────────────
function ocrResultMessage(ocr) {
  const confidence = Math.round((ocr.confidence || 0.85) * 100);
  const confColor  = confidence >= 80 ? SUCCESS : confidence >= 60 ? WARNING : DANGER;

  return {
    type: 'flex',
    altText: `AI อ่านใบเสร็จได้ ${confidence}%`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'horizontal', backgroundColor: '#EFF6FF', paddingAll: '14px',
        contents: [
          { type: 'text', text: 'AI อ่านใบเสร็จ', weight: 'bold', color: BRAND_COLOR, flex: 1 },
          { type: 'text', text: `${confidence}%`, color: confColor, weight: 'bold', align: 'end' }
        ]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
        contents: [
          ocrRow('ร้าน',     ocr.vendor_name    || '-'),
          ocrRow('วันที่',   ocr.date           || '-'),
          ocrRow('จำนวนเงิน', `฿${Number(ocr.total_amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`),
          ocrRow('ประเภท',   ocr.category_th    || 'อื่นๆ'),
          { type: 'separator', margin: 'md' },
          { type: 'text', text: 'ข้อมูลถูกต้องหรือไม่?', size: 'sm', color: '#6B7280', margin: 'md' }
        ]
      },
      footer: {
        type: 'box', layout: 'horizontal', spacing: 'sm', paddingAll: '12px',
        contents: [
          {
            type: 'button', style: 'primary', color: SUCCESS, flex: 1,
            action: { type: 'postback', label: 'ยืนยัน', data: 'action=confirm_ocr' }
          },
          {
            type: 'button', style: 'secondary', flex: 1,
            action: { type: 'uri', label: 'แก้ไขใน Web', uri: `${process.env.APP_URL}/claims/new` }
          }
        ]
      }
    }
  };
}

function ocrRow(label, value) {
  return {
    type: 'box', layout: 'horizontal', spacing: 'sm',
    contents: [
      { type: 'text', text: label, size: 'sm', color: '#9CA3AF', flex: 2 },
      { type: 'text', text: value, size: 'sm', weight: 'bold',   flex: 3, wrap: true }
    ]
  };
}

// ─── 4. CLAIM LIST ────────────────────────────────────────
function claimListMessage(claims) {
  if (!claims.length) {
    return { type: 'text', text: 'ยังไม่มี Claim ในระบบครับ' };
  }

  const bubbles = claims.map(c => {
    const st = STATUS[c.status] || STATUS.draft;
    return {
      type: 'bubble', size: 'kilo',
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '14px',
        contents: [
          {
            type: 'box', layout: 'horizontal',
            contents: [
              { type: 'text', text: c.claim_number, size: 'sm', weight: 'bold', flex: 1 },
              {
                type: 'box', layout: 'vertical', flex: 0,
                backgroundColor: st.color + '22',
                paddingAll: '4px', cornerRadius: '8px',
                contents: [{ type: 'text', text: st.label, size: 'xxs', color: st.color, weight: 'bold' }]
              }
            ]
          },
          { type: 'text', text: c.project_name, size: 'xs', color: '#6B7280', wrap: true },
          { type: 'text', text: `฿${Number(c.total_amount || 0).toLocaleString('th-TH')}`, size: 'md', weight: 'bold', color: BRAND_COLOR }
        ]
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '8px',
        contents: [{
          type: 'button', style: 'link', height: 'sm',
          action: { type: 'postback', label: 'ดูรายละเอียด', data: `action=view_detail&claimId=${c.id}` }
        }]
      }
    };
  });

  return {
    type: 'flex',
    altText: `Claim ล่าสุด ${claims.length} รายการ`,
    contents: { type: 'carousel', contents: bubbles }
  };
}

// ─── 5. CLAIM DETAIL ─────────────────────────────────────
function claimDetailMessage(claim) {
  const st = STATUS[claim.status] || STATUS.draft;

  return {
    type: 'flex',
    altText: `${claim.claim_number} — ${st.label}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: BRAND_COLOR, paddingAll: '16px',
        contents: [
          { type: 'text', text: claim.claim_number, color: '#FFFFFF', weight: 'bold', size: 'lg' },
          { type: 'text', text: claim.project_name, color: '#93C5FD', size: 'sm' }
        ]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
        contents: [
          {
            type: 'box', layout: 'horizontal', spacing: 'sm',
            contents: [
              { type: 'text', text: 'สถานะ', size: 'sm', color: '#9CA3AF', flex: 1 },
              { type: 'text', text: st.label, size: 'sm', weight: 'bold', color: st.color, flex: 2 }
            ]
          },
          {
            type: 'box', layout: 'horizontal', spacing: 'sm',
            contents: [
              { type: 'text', text: 'ยอดรวม', size: 'sm', color: '#9CA3AF', flex: 1 },
              {
                type: 'text',
                text: `฿${Number(claim.total_amount || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
                size: 'sm', weight: 'bold', color: BRAND_COLOR, flex: 2
              }
            ]
          },
          {
            type: 'box', layout: 'horizontal', spacing: 'sm',
            contents: [
              { type: 'text', text: 'วันที่ยื่น', size: 'sm', color: '#9CA3AF', flex: 1 },
              {
                type: 'text',
                text: new Date(claim.created_at).toLocaleDateString('th-TH'),
                size: 'sm', flex: 2
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px',
        contents: [{
          type: 'button', style: 'primary', color: ACCENT,
          action: { type: 'uri', label: 'เปิดใน ECMS', uri: `${process.env.APP_URL}/claims/${claim.id}` }
        }]
      }
    }
  };
}

// ─── 6. APPROVAL REQUEST (ส่งให้บัญชี/PCO) ───────────────
function approvalRequestMessage(claim, approver) {
  const roleLabel = approver.role === 'pco' ? 'PCO' : 'บัญชี';

  return {
    type: 'flex',
    altText: `[ECMS] มี Claim รอ${roleLabel}ตรวจสอบ`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: WARNING, paddingAll: '14px',
        contents: [
          { type: 'text', text: `รอ${roleLabel}อนุมัติ`, color: '#FFFFFF', weight: 'bold' },
          { type: 'text', text: claim.claim_number, color: '#FEF3C7', size: 'sm' }
        ]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
        contents: [
          ocrRow('โครงการ',  claim.project_name),
          ocrRow('ยอดรวม',  `฿${Number(claim.total_amount || 0).toLocaleString('th-TH')}`),
          ocrRow('ยื่นโดย',  claim.submitter_name || 'PM'),
          { type: 'separator', margin: 'md' },
          { type: 'text', text: 'กรุณาตรวจสอบและดำเนินการครับ', size: 'xs', color: '#9CA3AF', margin: 'md', wrap: true }
        ]
      },
      footer: {
        type: 'box', layout: 'horizontal', spacing: 'sm', paddingAll: '12px',
        contents: [
          {
            type: 'button', style: 'primary', color: SUCCESS, flex: 1,
            action: { type: 'postback', label: 'อนุมัติ', data: `action=approve&claimId=${claim.id}` }
          },
          {
            type: 'button', style: 'primary', color: DANGER, flex: 1,
            action: { type: 'postback', label: 'ส่งกลับ', data: `action=reject&claimId=${claim.id}` }
          },
          {
            type: 'button', style: 'secondary', flex: 1,
            action: { type: 'uri', label: 'ดูเต็ม', uri: `${process.env.APP_URL}/claims/${claim.id}` }
          }
        ]
      }
    }
  };
}

// ─── 7. STATUS NOTIFICATION (แจ้ง PM) ────────────────────
function statusNotifyMessage(claim, status) {
  const st     = STATUS[status] || STATUS.draft;
  const isGood = status === 'approved';

  return {
    type: 'flex',
    altText: `[ECMS] ${claim.claim_number} — ${st.label}`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: isGood ? SUCCESS : DANGER,
        paddingAll: '14px',
        contents: [
          { type: 'text', text: isGood ? 'อนุมัติแล้ว!' : 'ถูกส่งกลับ', color: '#FFFFFF', weight: 'bold', size: 'lg' },
          { type: 'text', text: claim.claim_number, color: isGood ? '#BBF7D0' : '#FECDD3', size: 'sm' }
        ]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
        contents: [
          ocrRow('โครงการ', claim.project_name),
          ocrRow('ยอดรวม',  `฿${Number(claim.total_amount || 0).toLocaleString('th-TH')}`),
          ocrRow('สถานะ',   st.label),
          {
            type: 'text',
            text: isGood ? 'เอกสารผ่านการอนุมัติเรียบร้อยแล้วครับ' : 'กรุณาตรวจสอบและแก้ไขเอกสารครับ',
            size: 'xs', color: '#9CA3AF', margin: 'md', wrap: true
          }
        ]
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px',
        contents: [{
          type: 'button', style: 'primary', color: ACCENT,
          action: { type: 'uri', label: 'ดูใน ECMS', uri: `${process.env.APP_URL}/claims/${claim.id}` }
        }]
      }
    }
  };
}

// ─── UTILITY MESSAGES ─────────────────────────────────────
function loadingMessage(text) {
  return { type: 'text', text };
}

function notLinkedMessage() {
  return {
    type: 'flex',
    altText: 'กรุณาเชื่อม Line กับ ECMS ก่อน',
    contents: {
      type: 'bubble',
      body: {
        type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
        contents: [
          { type: 'text', text: 'ยังไม่ได้เชื่อมบัญชี', weight: 'bold', size: 'lg' },
          { type: 'text', text: 'กรุณาเข้าสู่ระบบ ECMS แล้วเชื่อม Line Account ก่อนใช้งานครับ', size: 'sm', color: '#6B7280', wrap: true }
        ]
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px',
        contents: [{
          type: 'button', style: 'primary', color: ACCENT,
          action: { type: 'uri', label: 'เชื่อมบัญชี ECMS', uri: `${process.env.APP_URL}/line-link` }
        }]
      }
    }
  };
}

function approveSuccessMessage(claimNumber, nextStatus) {
  const isFullApproved = nextStatus === 'approved';
  return {
    type: 'text',
    text: isFullApproved
      ? `อนุมัติ ${claimNumber} เรียบร้อยแล้วครับ ระบบจะสร้าง PDF และแจ้ง PM ทันทีครับ`
      : `อนุมัติ ${claimNumber} แล้ว ส่งต่อให้ PCO ลงนามครับ`
  };
}

function rejectSuccessMessage(claimNumber) {
  return { type: 'text', text: `ส่ง ${claimNumber} กลับไปให้ PM แก้ไขแล้วครับ` };
}

function confirmOCRSuccessMessage(claimNumber) {
  return {
    type: 'text',
    text: `บันทึก ${claimNumber} เรียบร้อยแล้วครับ!\nกรุณาเปิด ECMS เพื่อกรอกรายละเอียดเพิ่มเติมและส่งให้บัญชีครับ`
  };
}

module.exports = {
  welcomeMessage, mainMenuMessage, ocrResultMessage,
  claimListMessage, claimDetailMessage, approvalRequestMessage,
  statusNotifyMessage, loadingMessage, notLinkedMessage,
  approveSuccessMessage, rejectSuccessMessage, confirmOCRSuccessMessage
};
