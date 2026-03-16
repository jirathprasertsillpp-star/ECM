require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./config/database');
const aiService = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 3001;

// Security & middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting for AI endpoints
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: 'คำขอมากเกินไป กรุณารอสักครู่' }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/claims', require('./routes/claims'));
app.use('/api/items', require('./routes/fuel'));
app.use('/api/items', require('./routes/receipts'));
app.use('/api/claims', require('./routes/approval'));
app.use('/api/export', require('./routes/export'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/line', require('./routes/lineRoutes'));

// AI routes (with rate limit)
const auth = require('./middleware/auth');

app.post('/api/ai/chat', auth, aiLimiter, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'กรุณาพิมพ์ข้อความ' });

        const recentClaims = await db.query(
            'SELECT id, claim_number, project_name, status, total_amount FROM expense_claims ORDER BY created_at DESC LIMIT 5'
        );

        const response = await aiService.chat(message, {
            name: req.user.name,
            role: req.user.role,
            recentClaims: recentClaims.rows
        });

        res.json({ response });
    } catch (err) {
        console.error('AI chat error:', err);
        res.status(500).json({ error: 'AI ไม่สามารถตอบได้ในขณะนี้' });
    }
});

app.post('/api/ai/verify-fuel/:fuelId', auth, aiLimiter, async (req, res) => {
    try {
        const { fuelId } = req.params;
        const fuelResult = await db.query('SELECT * FROM fuel_details WHERE id = $1', [fuelId]);

        if (fuelResult.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลค่าน้ำมัน' });
        }

        const fuel = fuelResult.rows[0];
        const result = await aiService.verifyFuelTrip(fuel, fuel.maps_distance_km);

        // Update fuel record
        await db.query(
            'UPDATE fuel_details SET ai_verified = $1, ai_verification_note = $2 WHERE id = $3',
            [result.isVerified, result.note, fuelId]
        );

        res.json({ verification: result });
    } catch (err) {
        console.error('Fuel verify error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

app.post('/api/ai/anomalies', auth, aiLimiter, async (req, res) => {
    try {
        const claims = await db.query(
            `SELECT ec.id, ec.claim_number, ec.total_amount, ec.status,
        json_agg(json_build_object('date', ei.item_date, 'category', ei.category, 'amount', ei.amount, 'description', ei.description)) as items
       FROM expense_claims ec
       LEFT JOIN expense_items ei ON ei.claim_id = ec.id
       WHERE ec.status IN ('pending_accounting', 'pending_pco')
       GROUP BY ec.id
       ORDER BY ec.created_at DESC
       LIMIT 20`
        );

        const result = await aiService.detectAnomalies(claims.rows);
        res.json(result);
    } catch (err) {
        console.error('Anomaly detection error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)' });
    }
    res.status(500).json({ error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 ECMS Backend running on http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`💾 Database: ${process.env.DATABASE_URL}`);
    console.log(`🌐 Frontend: ${process.env.APP_URL}\n`);
});

module.exports = app;
