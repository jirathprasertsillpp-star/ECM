const ExcelJS = require('exceljs');

const CATEGORIES = {
    fuel: 'ค่าน้ำมัน',
    meal: 'ค่าอาหาร',
    transport: 'ค่าเดินทาง',
    accommodation: 'ค่าที่พัก',
    other: 'อื่นๆ'
};

const STATUS_LABELS = {
    draft: 'แบบร่าง',
    pending_accounting: 'รอบัญชีตรวจสอบ',
    pending_pco: 'รอ PCO ลงนาม',
    approved: 'อนุมัติแล้ว',
    rejected: 'ถูกส่งกลับ'
};

async function generateReport(data) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ECMS';
    workbook.created = new Date();

    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
        { header: 'เลขที่ Claim', key: 'claim_number', width: 18 },
        { header: 'โครงการ', key: 'project_name', width: 30 },
        { header: 'เดือน', key: 'claim_month', width: 15 },
        { header: 'ผู้ยื่น', key: 'user_name', width: 20 },
        { header: 'แผนก', key: 'department', width: 20 },
        { header: 'สถานะ', key: 'status', width: 18 },
        { header: 'ยอดรวม (บาท)', key: 'total_amount', width: 18 },
    ];

    // Style header
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A5F' } };

    // Get unique claims
    const claimsMap = new Map();
    data.forEach(row => {
        if (!claimsMap.has(row.claim_number)) {
            claimsMap.set(row.claim_number, {
                claim_number: row.claim_number,
                project_name: row.project_name,
                claim_month: row.claim_month ? new Date(row.claim_month).toLocaleDateString('th-TH') : '-',
                user_name: row.user_name,
                department: row.department || '-',
                status: STATUS_LABELS[row.status] || row.status,
                total_amount: Number(row.total_amount) || 0,
            });
        }
    });

    claimsMap.forEach(claim => {
        summarySheet.addRow(claim);
    });

    // Sheet 2: Detail
    const detailSheet = workbook.addWorksheet('Detail');
    detailSheet.columns = [
        { header: 'เลขที่ Claim', key: 'claim_number', width: 18 },
        { header: 'วันที่', key: 'item_date', width: 15 },
        { header: 'โครงการ', key: 'project_name', width: 25 },
        { header: 'ประเภท', key: 'category', width: 15 },
        { header: 'รายละเอียด', key: 'description', width: 35 },
        { header: 'จำนวนเงิน (บาท)', key: 'amount', width: 18 },
        { header: 'สถานะ', key: 'status', width: 18 },
    ];

    detailSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    detailSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2E75B6' } };

    data.forEach(row => {
        if (row.item_date) {
            detailSheet.addRow({
                claim_number: row.claim_number,
                item_date: new Date(row.item_date).toLocaleDateString('th-TH'),
                project_name: row.project_name,
                category: CATEGORIES[row.category] || row.category || '-',
                description: row.item_description || '-',
                amount: Number(row.item_amount) || 0,
                status: STATUS_LABELS[row.status] || row.status,
            });
        }
    });

    // Sheet 3: Fuel Report
    const fuelSheet = workbook.addWorksheet('Fuel Report');
    fuelSheet.columns = [
        { header: 'เลขที่ Claim', key: 'claim_number', width: 18 },
        { header: 'วันที่', key: 'item_date', width: 15 },
        { header: 'เส้นทาง', key: 'route', width: 40 },
        { header: 'ระยะทาง (km)', key: 'distance', width: 15 },
        { header: 'จำนวนเงิน (บาท)', key: 'amount', width: 18 },
        { header: 'AI Verified', key: 'verified', width: 15 },
    ];

    fuelSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    fuelSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0D6E4A' } };

    data.filter(row => row.is_fuel && row.origin_address).forEach(row => {
        fuelSheet.addRow({
            claim_number: row.claim_number,
            item_date: row.item_date ? new Date(row.item_date).toLocaleDateString('th-TH') : '-',
            route: `${row.origin_address || '-'} → ${row.destination_address || '-'}`,
            distance: Number(row.distance_km) || 0,
            amount: Number(row.item_amount) || 0,
            verified: row.ai_verified ? '✅ Verified' : '⏳ Pending',
        });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}

module.exports = { generateReport };
