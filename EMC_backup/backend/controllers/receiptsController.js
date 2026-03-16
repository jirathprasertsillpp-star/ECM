const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// Determine if file is image type for OCR
const isImageType = (mimeType) => {
    return mimeType && mimeType.startsWith('image/');
};

const isPdfType = (mimeType) => {
    return mimeType === 'application/pdf';
};

exports.uploadReceipt = async (req, res) => {
    try {
        const { itemId } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: 'กรุณาเลือกไฟล์' });
        }

        const result = await db.query(
            `INSERT INTO receipts (item_id, filename, original_name, file_path, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [itemId, req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype]
        );

        const receipt = result.rows[0];
        res.status(201).json({ 
            receipt: {
                ...receipt,
                file_url: '/' + receipt.file_path.replace(/\\/g, '/')
            }
        });
    } catch (err) {
        console.error('Upload receipt error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปโหลด' });
    }
};

exports.deleteReceipt = async (req, res) => {
    try {
        const { receiptId } = req.params;

        const receipt = await db.query('SELECT * FROM receipts WHERE id = $1', [receiptId]);
        if (receipt.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบใบเสร็จ' });
        }

        // Delete file
        const filePath = receipt.rows[0].file_path;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await db.query('DELETE FROM receipts WHERE id = $1', [receiptId]);
        res.json({ message: 'ลบใบเสร็จสำเร็จ' });
    } catch (err) {
        console.error('Delete receipt error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบ' });
    }
};

exports.ocrReceipt = async (req, res) => {
    try {
        const { receiptId } = req.params;

        const receipt = await db.query('SELECT * FROM receipts WHERE id = $1', [receiptId]);
        if (receipt.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบใบเสร็จ' });
        }

        const receiptData = receipt.rows[0];
        const filePath = receiptData.file_path;

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'ไม่พบไฟล์ใบเสร็จ' });
        }

        // Only images can be OCR'd with vision AI
        if (!isImageType(receiptData.mime_type) && !isPdfType(receiptData.mime_type)) {
            const mockResult = {
                vendor: 'ไม่สามารถอ่านไฟล์ประเภทนี้ด้วย OCR',
                date: new Date().toISOString().split('T')[0],
                amount: 0,
                category: 'other',
                description: `ไฟล์: ${receiptData.original_name} (กรุณากรอกข้อมูลด้วยตนเอง)`,
                confidence: 0.0,
                note: 'OCR รองรับเฉพาะไฟล์รูปภาพ (JPG, PNG, WebP)'
            };
            return res.json({ ocr: mockResult, warning: 'ไฟล์ประเภทนี้ไม่รองรับ OCR อัตโนมัติ' });
        }

        try {
            const aiService = require('../services/aiService');
            const fileBuffer = fs.readFileSync(filePath);
            const base64 = fileBuffer.toString('base64');

            // For images, use vision OCR; for PDF use text-based approach
            const mimeTypeForAi = isImageType(receiptData.mime_type) 
                ? receiptData.mime_type 
                : 'image/jpeg'; // PDF fallback

            const ocrResult = await aiService.ocrReceipt(base64, mimeTypeForAi);

            // Save OCR result
            await db.query(
                'UPDATE receipts SET ai_extracted_data = $1, ai_confidence = $2 WHERE id = $3',
                [JSON.stringify(ocrResult), ocrResult.confidence || 0.5, receiptId]
            );

            res.json({ 
                ocr: ocrResult,
                receipt: {
                    ...receiptData,
                    ai_extracted_data: ocrResult,
                    ai_confidence: ocrResult.confidence || 0.5,
                    file_url: '/' + receiptData.file_path.replace(/\\/g, '/')
                }
            });
        } catch (aiErr) {
            console.error('AI OCR error:', aiErr);
            // Return mock data if AI fails
            const mockResult = {
                vendor: 'ไม่สามารถอ่านได้อัตโนมัติ',
                date: new Date().toISOString().split('T')[0],
                amount: 0,
                category: 'other',
                description: 'กรุณากรอกข้อมูลด้วยตนเอง',
                confidence: 0.0
            };
            res.json({ ocr: mockResult, warning: 'AI ไม่สามารถอ่านใบเสร็จได้ กรุณากรอกข้อมูลด้วยตนเอง' });
        }
    } catch (err) {
        console.error('OCR error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอ่านใบเสร็จ' });
    }
};

// Get receipts for an item
exports.getReceipts = async (req, res) => {
    try {
        const { itemId } = req.params;
        const result = await db.query(
            'SELECT * FROM receipts WHERE item_id = $1 ORDER BY created_at DESC',
            [itemId]
        );
        
        const receipts = result.rows.map(r => ({
            ...r,
            file_url: '/' + r.file_path.replace(/\\/g, '/')
        }));

        res.json({ receipts });
    } catch (err) {
        console.error('Get receipts error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};
