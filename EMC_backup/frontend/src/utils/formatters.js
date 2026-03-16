export function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return `฿${num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

export function formatDateInput(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().split('T')[0];
}

export function formatMonth(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export const STATUS_MAP = {
    draft: { label: 'แบบร่าง', color: 'draft', icon: '📝' },
    pending_accounting: { label: 'รอบัญชีตรวจสอบ', color: 'pending', icon: '⏳' },
    pending_pco: { label: 'รอ PCO ลงนาม', color: 'pending', icon: '✍️' },
    approved: { label: 'อนุมัติแล้ว', color: 'approved', icon: '✅' },
    rejected: { label: 'ส่งกลับแก้ไข', color: 'rejected', icon: '❌' },
};

export const CATEGORY_MAP = {
    fuel: { label: 'ค่าน้ำมัน', icon: '⛽', color: '#F59E0B' },
    meal: { label: 'ค่าอาหาร', icon: '🍽️', color: '#10B981' },
    transport: { label: 'ค่าเดินทาง', icon: '🚗', color: '#3B82F6' },
    accommodation: { label: 'ค่าที่พัก', icon: '🏨', color: '#8B5CF6' },
    other: { label: 'อื่นๆ', icon: '📎', color: '#6B7280' },
};

export function getStatusBadgeClass(status) {
    const map = {
        draft: 'badge-draft',
        pending_accounting: 'badge-pending',
        pending_pco: 'badge-pending',
        approved: 'badge-approved',
        rejected: 'badge-rejected',
    };
    return map[status] || 'badge-draft';
}
