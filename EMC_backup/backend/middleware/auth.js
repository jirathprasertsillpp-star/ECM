const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // Allow 'sa' super admin bypass
        if (decoded.userId === 999 || decoded.userId === '999') {
            req.user = { id: 999, name: 'Super Admin', email: 'sa@ecms.com', role: 'pco', department: 'Management' };
            return next();
        }

        const result = await db.query('SELECT id, name, email, role, department FROM users WHERE id = $1', [decoded.userId]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'ไม่พบผู้ใช้' });
        }

        req.user = result.rows[0];
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่' });
        }
        return res.status(401).json({ error: 'Token ไม่ถูกต้อง' });
    }
};

module.exports = auth;
