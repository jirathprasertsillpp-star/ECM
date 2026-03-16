const db = require('../config/database');
const pdfService = require('../services/pdfService');
const excelService = require('../services/excelService');

exports.exportPDF = async (req, res) => {
    try {
        const { id } = req.params;

        const claimResult = await db.query(
            `SELECT ec.*, u.name as user_name, u.email as user_email, u.department
       FROM expense_claims ec
       JOIN users u ON ec.user_id = u.id
       WHERE ec.id = $1`,
            [id]
        );

        if (claimResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบ Claim' });
        }

        const claim = claimResult.rows[0];

        const itemsResult = await db.query(
            `SELECT ei.*, fd.odometer_start, fd.odometer_end, fd.distance_km,
        fd.origin_address, fd.destination_address, fd.maps_distance_km,
        fd.project_task, fd.work_category, fd.ai_verified
       FROM expense_items ei
       LEFT JOIN fuel_details fd ON fd.item_id = ei.id
       WHERE ei.claim_id = $1
       ORDER BY ei.item_date`,
            [id]
        );

        const logsResult = await db.query(
            `SELECT al.*, u.name as performed_by_name
       FROM approval_logs al
       JOIN users u ON al.performed_by = u.id
       WHERE al.claim_id = $1
       ORDER BY al.created_at ASC`,
            [id]
        );

        const pdfBuffer = await pdfService.generateClaimPDF(claim, itemsResult.rows, logsResult.rows);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=ECMS-${claim.claim_number}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('PDF export error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้าง PDF' });
    }
};

exports.exportExcel = async (req, res) => {
    try {
        const { month, project } = req.query;

        let query = `
      SELECT ec.*, u.name as user_name, u.department,
        ei.item_date, ei.category, ei.description as item_description, ei.amount as item_amount, ei.is_fuel,
        fd.origin_address, fd.destination_address, fd.distance_km, fd.ai_verified
      FROM expense_claims ec
      JOIN users u ON ec.user_id = u.id
      LEFT JOIN expense_items ei ON ei.claim_id = ec.id
      LEFT JOIN fuel_details fd ON fd.item_id = ei.id
      WHERE 1=1
    `;
        const params = [];

        if (month) {
            params.push(month);
            query += ` AND ec.claim_month = $${params.length}`;
        }
        if (project) {
            params.push(`%${project}%`);
            query += ` AND ec.project_name ILIKE $${params.length}`;
        }

        query += ' ORDER BY ec.claim_number, ei.item_date';

        const result = await db.query(query, params);
        const buffer = await excelService.generateReport(result.rows);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=ECMS-Report.xlsx');
        res.send(buffer);
    } catch (err) {
        console.error('Excel export error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้าง Excel' });
    }
};
