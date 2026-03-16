const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
        }

        // Temporary bypass for 'sa' user
        if (email === 'sa' && password === 'sa') {
            const token = jwt.sign(
                { userId: 999, email: 'sa@ecms.com', role: 'pco' },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );

            return res.json({
                token,
                user: {
                    id: 999,
                    name: 'Super Admin',
                    email: 'sa@ecms.com',
                    role: 'pco',
                    department: 'Management'
                }
            });
        }

        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
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
        console.error('Login error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
};

exports.logout = (req, res) => {
    res.json({ message: 'ออกจากระบบสำเร็จ' });
};

exports.getProfile = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, email, role, department, phone, position, signature_url FROM users WHERE id = $1',
            [req.user.id]
        );
        res.json({ user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, position, password } = req.body;
        let query = 'UPDATE users SET name = $1, phone = $2, position = $3';
        let params = [name, phone, position, req.user.id];

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            query += ', password_hash = $4 WHERE id = $5';
            params = [name, phone, position, hash, req.user.id];
        } else {
            query += ' WHERE id = $4';
        }

        await db.query(query, params);
        res.json({ message: 'โปรไฟล์ถูกอัพเดทเรียบร้อยแล้ว' });
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัพเดทโปรไฟล์' });
    }
};

exports.me = (req, res) => {
    res.json({ user: req.user });
};
