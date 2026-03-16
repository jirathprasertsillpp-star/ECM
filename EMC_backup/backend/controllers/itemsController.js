const db = require('../config/database');

exports.addItem = async (req, res) => {
    try {
        const { id } = req.params; // claim_id
        const { item_date, category, description, amount, is_fuel, vendor_name } = req.body;

        if (!item_date || !category || !description || !amount) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // Check claim is draft
        const claim = await db.query('SELECT status FROM expense_claims WHERE id = $1', [id]);
        if (claim.rows.length === 0) return res.status(404).json({ error: 'ไม่พบ Claim' });
        if (claim.rows[0].status !== 'draft') {
            return res.status(400).json({ error: 'เพิ่มรายการได้เฉพาะ Claim แบบร่างเท่านั้น' });
        }

        const result = await db.query(
            `INSERT INTO expense_items (claim_id, item_date, category, description, amount, is_fuel, vendor_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [id, item_date, category, description, amount, is_fuel || category === 'fuel', vendor_name]
        );

        // Update claim total
        await db.query(
            `UPDATE expense_claims SET total_amount = (
        SELECT COALESCE(SUM(amount), 0) FROM expense_items WHERE claim_id = $1
      ), updated_at = NOW() WHERE id = $1`,
            [id]
        );

        res.status(201).json({ item: result.rows[0] });
    } catch (err) {
        console.error('Add item error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเพิ่มรายการ' });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { id, itemId } = req.params;
        const { item_date, category, description, amount, is_fuel, vendor_name } = req.body;

        const result = await db.query(
            `UPDATE expense_items SET 
        item_date = COALESCE($1, item_date), category = COALESCE($2, category),
        description = COALESCE($3, description), amount = COALESCE($4, amount),
        is_fuel = COALESCE($5, is_fuel), vendor_name = COALESCE($8, vendor_name)
       WHERE id = $6 AND claim_id = $7 RETURNING *`,
            [item_date, category, description, amount, is_fuel, itemId, id, vendor_name]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบรายการ' });
        }

        // Update claim total
        await db.query(
            `UPDATE expense_claims SET total_amount = (
        SELECT COALESCE(SUM(amount), 0) FROM expense_items WHERE claim_id = $1
      ), updated_at = NOW() WHERE id = $1`,
            [id]
        );

        res.json({ item: result.rows[0] });
    } catch (err) {
        console.error('Update item error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไขรายการ' });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const { id, itemId } = req.params;

        const result = await db.query(
            'DELETE FROM expense_items WHERE id = $1 AND claim_id = $2 RETURNING id',
            [itemId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบรายการ' });
        }

        // Update claim total
        await db.query(
            `UPDATE expense_claims SET total_amount = (
        SELECT COALESCE(SUM(amount), 0) FROM expense_items WHERE claim_id = $1
      ), updated_at = NOW() WHERE id = $1`,
            [id]
        );

        res.json({ message: 'ลบรายการสำเร็จ' });
    } catch (err) {
        console.error('Delete item error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบรายการ' });
    }
};
