const PDFDocument = require('pdfkit');

const CATEGORIES = {
    fuel: 'ค่าน้ำมัน',
    meal: 'ค่าอาหาร',
    transport: 'ค่าเดินทาง',
    accommodation: 'ค่าที่พัก',
    other: 'อื่นๆ'
};

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function formatMoney(amount) {
    return Number(amount).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function generateClaimPDF(claim, items, logs) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(20).text('ECMS', { align: 'center' });
        doc.fontSize(10).text('Expense Claim Management System', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(16).text('ใบเบิกค่าใช้จ่าย', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(12).text(`เลขที่: ${claim.claim_number}`, { align: 'center' });
        doc.moveDown(1);

        // Divider
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        // Info section
        doc.fontSize(11);
        const infoY = doc.y;
        doc.text(`ผู้ยื่น: ${claim.user_name}`, 50, infoY);
        doc.text(`แผนก: ${claim.department || '-'}`, 300, infoY);
        doc.text(`โครงการ: ${claim.project_name}`, 50, infoY + 18);
        doc.text(`รหัสโครงการ: ${claim.project_code || '-'}`, 300, infoY + 18);
        doc.text(`เดือนที่เบิก: ${formatDate(claim.claim_month)}`, 50, infoY + 36);
        doc.text(`สถานะ: ${claim.status}`, 300, infoY + 36);
        doc.moveDown(3);

        // Items table header
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.3);

        const tableTop = doc.y;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('#', 50, tableTop, { width: 25 });
        doc.text('Date', 80, tableTop, { width: 70 });
        doc.text('Category', 155, tableTop, { width: 70 });
        doc.text('Description', 230, tableTop, { width: 210 });
        doc.text('Amount', 445, tableTop, { width: 100, align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.3);

        // Items
        doc.font('Helvetica');
        items.forEach((item, i) => {
            const y = doc.y;
            if (y > 700) {
                doc.addPage();
            }
            doc.text(`${i + 1}`, 50, doc.y, { width: 25 });
            const rowY = doc.y - doc.currentLineHeight();
            doc.text(formatDate(item.item_date), 80, rowY, { width: 70 });
            doc.text(CATEGORIES[item.category] || item.category, 155, rowY, { width: 70 });
            doc.text(item.description, 230, rowY, { width: 210 });
            doc.text(`${formatMoney(item.amount)}`, 445, rowY, { width: 100, align: 'right' });
            doc.moveDown(0.3);
        });

        // Total
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(`รวมทั้งสิ้น: ${formatMoney(claim.total_amount)} บาท`, { align: 'right' });
        doc.moveDown(1);

        // Fuel details if any
        const fuelItems = items.filter(i => i.is_fuel && i.origin_address);
        if (fuelItems.length > 0) {
            doc.font('Helvetica-Bold').fontSize(13).text('ตารางการเดินทาง');
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(9);

            fuelItems.forEach((item, i) => {
                if (doc.y > 700) doc.addPage();
                doc.text(`${i + 1}. ${formatDate(item.item_date)} | ${item.origin_address} → ${item.destination_address}`);
                doc.text(`   ระยะทาง: ${item.distance_km || '-'} km | Maps: ${item.maps_distance_km || '-'} km | AI: ${item.ai_verified ? 'Verified' : 'Pending'}`);
                doc.moveDown(0.5);
            });
            doc.moveDown(0.5);
        }

        // Approval section
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(12).text('ลงนามอนุมัติ');
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(10);

        const signatureWidth = 150;
        const signatureY = doc.y + 40;

        // PM signature
        doc.text('________________________', 50, signatureY);
        doc.text('ผู้ยื่น (PM)', 50, signatureY + 15);
        doc.text(claim.user_name, 50, signatureY + 28);

        // Accounting signature
        doc.text('________________________', 220, signatureY);
        doc.text('บัญชี', 220, signatureY + 15);
        const accLog = logs.find(l => l.action === 'approved_accounting');
        doc.text(accLog ? accLog.performed_by_name : '.....................', 220, signatureY + 28);

        // PCO signature
        doc.text('________________________', 390, signatureY);
        doc.text('PCO', 390, signatureY + 15);
        const pcoLog = logs.find(l => l.action === 'approved_pco');
        doc.text(pcoLog ? pcoLog.performed_by_name : '.....................', 390, signatureY + 28);

        // Footer
        doc.fontSize(8).text(
            `Generated by ECMS | ${new Date().toLocaleString('th-TH')}`,
            50, 770, { align: 'center', width: 495 }
        );

        doc.end();
    });
}

module.exports = { generateClaimPDF };
