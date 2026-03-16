const db = require('../config/database');

exports.saveFuel = async (req, res) => {
    try {
        const { itemId } = req.params;
        const {
            odometer_start, odometer_end, origin_address, origin_lat, origin_lng,
            destination_address, destination_lat, destination_lng, maps_distance_km,
            work_type, project_task, work_category
        } = req.body;

        if (!odometer_start || !odometer_end || !origin_address || !destination_address || !project_task) {
            return res.status(400).json({ error: 'กรุณากรอกข้อมูลค่าน้ำมันให้ครบถ้วน' });
        }

        const distance_km = odometer_end - odometer_start;

        // Check if existing fuel detail
        const existing = await db.query('SELECT id FROM fuel_details WHERE item_id = $1', [itemId]);

        let result;
        if (existing.rows.length > 0) {
            result = await db.query(
                `UPDATE fuel_details SET 
          odometer_start=$1, odometer_end=$2, distance_km=$3,
          origin_address=$4, origin_lat=$5, origin_lng=$6,
          destination_address=$7, destination_lat=$8, destination_lng=$9,
          maps_distance_km=$10, work_type=$11, project_task=$12, work_category=$13
         WHERE item_id=$14 RETURNING *`,
                [odometer_start, odometer_end, distance_km, origin_address, origin_lat, origin_lng,
                    destination_address, destination_lat, destination_lng, maps_distance_km,
                    work_type, project_task, work_category, itemId]
            );
        } else {
            result = await db.query(
                `INSERT INTO fuel_details (item_id, odometer_start, odometer_end, distance_km,
          origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng,
          maps_distance_km, work_type, project_task, work_category)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
                [itemId, odometer_start, odometer_end, distance_km, origin_address, origin_lat, origin_lng,
                    destination_address, destination_lat, destination_lng, maps_distance_km,
                    work_type, project_task, work_category]
            );
        }

        res.json({ fuel: result.rows[0] });
    } catch (err) {
        console.error('Save fuel error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลค่าน้ำมัน' });
    }
};

exports.getFuel = async (req, res) => {
    try {
        const { itemId } = req.params;
        const result = await db.query('SELECT * FROM fuel_details WHERE item_id = $1', [itemId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลค่าน้ำมัน' });
        }

        res.json({ fuel: result.rows[0] });
    } catch (err) {
        console.error('Get fuel error:', err);
        res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
    }
};
