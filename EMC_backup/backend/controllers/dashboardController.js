const db = require('../config/database');

exports.getStats = async (req, res) => {
    try {
        const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status IN ('pending_accounting', 'pending_pco')) as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COALESCE(SUM(total_amount) FILTER (WHERE status = 'approved'), 0) as total_approved_amount,
        COALESCE(SUM(total_amount) FILTER (
          WHERE claim_month >= date_trunc('month', CURRENT_DATE)
          AND claim_month < date_trunc('month', CURRENT_DATE) + interval '1 month'
        ), 0) as this_month_amount
      FROM expense_claims
    `);

        res.json({ stats: statsResult.rows[0] });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

exports.getChart = async (req, res) => {
    try {
        const chartResult = await db.query(`
      SELECT 
        TO_CHAR(claim_month, 'YYYY-MM') as month,
        TO_CHAR(claim_month, 'Mon YYYY') as label,
        COALESCE(SUM(total_amount), 0) as total,
        COUNT(*) as count
      FROM expense_claims
      WHERE claim_month >= NOW() - INTERVAL '12 months'
      GROUP BY claim_month
      ORDER BY claim_month ASC
    `);

        res.json({ chart: chartResult.rows });
    } catch (err) {
        console.error('Chart error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};

exports.getRecent = async (req, res) => {
    try {
        const result = await db.query(`
      SELECT ec.*, u.name as user_name
      FROM expense_claims ec
      JOIN users u ON ec.user_id = u.id
      ORDER BY ec.created_at DESC
      LIMIT 5
    `);

        res.json({ recent: result.rows });
    } catch (err) {
        console.error('Recent error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};
