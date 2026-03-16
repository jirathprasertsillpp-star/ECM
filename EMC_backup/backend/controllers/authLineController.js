const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.lineLogin = async (req, res) => {
    try {
        const { lineUserId } = req.body;
        if (!lineUserId) {
            return res.status(400).json({ error: 'Missing Line User ID' });
        }

        const result = await db.query('SELECT * FROM users WHERE line_user_id = $1', [lineUserId]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'ไม่พบบัญชีที่เชื่อมต่อกับ Line นี้ กรุณาเข้าสู่ระบบด้วยอีเมลแล้วเชื่อมต่อบัญชี Line' });
        }

        const user = result.rows[0];
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (err) {
        console.error('Line Login error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Line' });
    }
};
