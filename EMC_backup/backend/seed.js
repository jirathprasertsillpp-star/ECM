const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('🌱 Seeding ECMS database...\n');

    try {
        // Clear existing data
        await db.query('DELETE FROM notifications');
        await db.query('DELETE FROM approval_logs');
        await db.query('DELETE FROM receipts');
        await db.query('DELETE FROM fuel_details');
        await db.query('DELETE FROM expense_items');
        await db.query('DELETE FROM expense_claims');
        await db.query('DELETE FROM users');

        // Reset sequences
        await db.query("ALTER SEQUENCE users_id_seq RESTART WITH 1");
        await db.query("ALTER SEQUENCE expense_claims_id_seq RESTART WITH 1");
        await db.query("ALTER SEQUENCE expense_items_id_seq RESTART WITH 1");
        await db.query("ALTER SEQUENCE fuel_details_id_seq RESTART WITH 1");
        await db.query("ALTER SEQUENCE receipts_id_seq RESTART WITH 1");
        await db.query("ALTER SEQUENCE approval_logs_id_seq RESTART WITH 1");
        await db.query("ALTER SEQUENCE notifications_id_seq RESTART WITH 1");

        console.log('  ✅ Cleared existing data');

        // Seed users
        const passwordHash = await bcrypt.hash('password123', 12);
        const users = [
            { name: 'สมชาย จัดโปรเจค', email: 'pm@ecms.com', role: 'pm', department: 'Project Management' },
            { name: 'สมศรี บัญชีดี', email: 'accounting@ecms.com', role: 'accounting', department: 'Finance' },
            { name: 'สมหมาย ลงนาม', email: 'pco@ecms.com', role: 'pco', department: 'Executive' },
        ];

        for (const u of users) {
            await db.query(
                'INSERT INTO users (name, email, password_hash, role, department) VALUES ($1, $2, $3, $4, $5)',
                [u.name, u.email, passwordHash, u.role, u.department]
            );
        }
        console.log('  ✅ Users seeded (3 users)');

        // Seed expense claims
        const claims = [
            // 2 draft
            { claim_number: 'EC-2026-001', user_id: 1, project_name: 'โครงการระบบ ERP บริษัท ABC', project_code: 'PRJ-001', claim_month: '2026-01-01', status: 'draft', total_amount: 3500.00 },
            { claim_number: 'EC-2026-002', user_id: 1, project_name: 'โครงการปรับปรุง Network บริษัท XYZ', project_code: 'PRJ-002', claim_month: '2026-02-01', status: 'draft', total_amount: 5200.00 },
            // 2 pending_accounting
            { claim_number: 'EC-2026-003', user_id: 1, project_name: 'โครงการติดตั้ง Server Farm', project_code: 'PRJ-003', claim_month: '2026-01-01', status: 'pending_accounting', total_amount: 8750.00, submitted_at: '2026-02-15' },
            { claim_number: 'EC-2026-004', user_id: 1, project_name: 'โครงการระบบ IoT โรงงาน DEF', project_code: 'PRJ-004', claim_month: '2026-02-01', status: 'pending_accounting', total_amount: 12300.00, submitted_at: '2026-02-20' },
            // 1 pending_pco
            { claim_number: 'EC-2026-005', user_id: 1, project_name: 'โครงการ Data Center Migration', project_code: 'PRJ-005', claim_month: '2026-01-01', status: 'pending_pco', total_amount: 15600.00, submitted_at: '2026-02-10' },
            // 3 approved
            { claim_number: 'EC-2025-010', user_id: 1, project_name: 'โครงการพัฒนา Mobile App', project_code: 'PRJ-010', claim_month: '2025-11-01', status: 'approved', total_amount: 9800.00, submitted_at: '2025-12-01' },
            { claim_number: 'EC-2025-011', user_id: 1, project_name: 'โครงการ Cloud Migration', project_code: 'PRJ-011', claim_month: '2025-12-01', status: 'approved', total_amount: 22450.00, submitted_at: '2026-01-05' },
            { claim_number: 'EC-2026-006', user_id: 1, project_name: 'โครงการระบบ CRM องค์กร', project_code: 'PRJ-006', claim_month: '2026-01-01', status: 'approved', total_amount: 7300.00, submitted_at: '2026-01-28' },
            // 1 rejected
            { claim_number: 'EC-2026-007', user_id: 1, project_name: 'โครงการสำรวจพื้นที่ GHI', project_code: 'PRJ-007', claim_month: '2026-02-01', status: 'rejected', total_amount: 4500.00, submitted_at: '2026-02-25' },
        ];

        for (const c of claims) {
            await db.query(
                `INSERT INTO expense_claims (claim_number, user_id, project_name, project_code, claim_month, status, total_amount, submitted_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [c.claim_number, c.user_id, c.project_name, c.project_code, c.claim_month, c.status, c.total_amount, c.submitted_at || null]
            );
        }
        console.log('  ✅ Expense claims seeded (9 claims)');

        // Seed expense items
        const items = [
            // Claim 1 (draft) items
            { claim_id: 1, item_date: '2026-01-05', category: 'fuel', description: 'เดินทางไปประชุมที่ บ.ABC สำนักงานใหญ่', amount: 850.00, is_fuel: true },
            { claim_id: 1, item_date: '2026-01-10', category: 'meal', description: 'ค่าอาหารกลางวัน ประชุมลูกค้า', amount: 650.00, is_fuel: false },
            { claim_id: 1, item_date: '2026-01-15', category: 'transport', description: 'ค่าแท็กซี่ไปสนามบิน', amount: 500.00, is_fuel: false },
            { claim_id: 1, item_date: '2026-01-20', category: 'other', description: 'ค่าจอดรถ อาคารจอดรถ สยามพารากอน', amount: 200.00, is_fuel: false },
            { claim_id: 1, item_date: '2026-01-22', category: 'fuel', description: 'เดินทางไปส่งอุปกรณ์ที่ไซต์งาน', amount: 1300.00, is_fuel: true },

            // Claim 2 (draft) items
            { claim_id: 2, item_date: '2026-02-03', category: 'accommodation', description: 'ค่าที่พัก โรงแรม จ.ชลบุรี 2 คืน', amount: 3200.00, is_fuel: false },
            { claim_id: 2, item_date: '2026-02-03', category: 'fuel', description: 'เดินทางไป จ.ชลบุรี ติดตั้ง Network', amount: 1200.00, is_fuel: true },
            { claim_id: 2, item_date: '2026-02-05', category: 'meal', description: 'ค่าอาหาร ระหว่างปฏิบัติงานนอกสถานที่', amount: 800.00, is_fuel: false },

            // Claim 3 (pending_accounting) items
            { claim_id: 3, item_date: '2026-01-08', category: 'fuel', description: 'เดินทางไปสำรวจพื้นที่ Data Center', amount: 1500.00, is_fuel: true },
            { claim_id: 3, item_date: '2026-01-12', category: 'transport', description: 'ค่า Grab ไปกลับ ออฟฟิศ-Data Center', amount: 750.00, is_fuel: false },
            { claim_id: 3, item_date: '2026-01-15', category: 'meal', description: 'ค่าอาหารเลี้ยงทีมหลังติดตั้ง', amount: 2500.00, is_fuel: false },
            { claim_id: 3, item_date: '2026-01-20', category: 'other', description: 'ค่าอุปกรณ์สำนักงาน', amount: 4000.00, is_fuel: false },

            // Claim 4 (pending_accounting)
            { claim_id: 4, item_date: '2026-02-05', category: 'fuel', description: 'เดินทางไปโรงงาน DEF จ.ระยอง', amount: 2800.00, is_fuel: true },
            { claim_id: 4, item_date: '2026-02-06', category: 'accommodation', description: 'ค่าที่พัก จ.ระยอง', amount: 4500.00, is_fuel: false },
            { claim_id: 4, item_date: '2026-02-07', category: 'meal', description: 'ค่าอาหาร 3 วัน', amount: 3000.00, is_fuel: false },
            { claim_id: 4, item_date: '2026-02-08', category: 'other', description: 'ค่าอุปกรณ์ IoT สำหรับทดสอบ', amount: 2000.00, is_fuel: false },

            // Claim 5 (pending_pco)
            { claim_id: 5, item_date: '2026-01-10', category: 'fuel', description: 'เดินทางไป Data Center บางนา', amount: 1800.00, is_fuel: true },
            { claim_id: 5, item_date: '2026-01-12', category: 'fuel', description: 'เดินทางกลับจาก Data Center', amount: 1800.00, is_fuel: true },
            { claim_id: 5, item_date: '2026-01-15', category: 'accommodation', description: 'ค่าที่พัก กรุงเทพ 3 คืน', amount: 7500.00, is_fuel: false },
            { claim_id: 5, item_date: '2026-01-18', category: 'meal', description: 'ค่าอาหาร 5 วัน', amount: 4500.00, is_fuel: false },

            // Claims 6-9 simple items
            { claim_id: 6, item_date: '2025-11-10', category: 'fuel', description: 'เดินทางไปทดสอบ App ที่ลูกค้า', amount: 2500.00, is_fuel: true },
            { claim_id: 6, item_date: '2025-11-15', category: 'meal', description: 'ค่าอาหารทีม', amount: 3800.00, is_fuel: false },
            { claim_id: 6, item_date: '2025-11-20', category: 'transport', description: 'ค่ารถ BTS/MRT', amount: 3500.00, is_fuel: false },

            { claim_id: 7, item_date: '2025-12-05', category: 'fuel', description: 'เดินทางไปประชุม Cloud Provider', amount: 5000.00, is_fuel: true },
            { claim_id: 7, item_date: '2025-12-10', category: 'accommodation', description: 'ค่าที่พัก จ.เชียงใหม่ Training', amount: 12000.00, is_fuel: false },
            { claim_id: 7, item_date: '2025-12-12', category: 'transport', description: 'ค่าเครื่องบิน กรุงเทพ-เชียงใหม่', amount: 5450.00, is_fuel: false },

            { claim_id: 8, item_date: '2026-01-05', category: 'fuel', description: 'เดินทางไปติดตั้ง CRM', amount: 3300.00, is_fuel: true },
            { claim_id: 8, item_date: '2026-01-10', category: 'meal', description: 'ค่าอาหาร Training', amount: 4000.00, is_fuel: false },

            { claim_id: 9, item_date: '2026-02-10', category: 'fuel', description: 'เดินทางสำรวจพื้นที่ GHI', amount: 2000.00, is_fuel: true },
            { claim_id: 9, item_date: '2026-02-12', category: 'meal', description: 'ค่าอาหาร', amount: 2500.00, is_fuel: false },
        ];

        for (const item of items) {
            await db.query(
                `INSERT INTO expense_items (claim_id, item_date, category, description, amount, is_fuel) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [item.claim_id, item.item_date, item.category, item.description, item.amount, item.is_fuel]
            );
        }
        console.log('  ✅ Expense items seeded (30 items)');

        // Seed fuel details for fuel items
        const fuelItems = await db.query("SELECT id, claim_id FROM expense_items WHERE is_fuel = true LIMIT 4");

        const fuelDetails = [
            {
                item_id: fuelItems.rows[0]?.id,
                odometer_start: 45230, odometer_end: 45312, distance_km: 82,
                origin_address: '123 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพ 10110',
                origin_lat: 13.7234, origin_lng: 100.5612,
                destination_address: '456 ถ.พหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพ 10900',
                destination_lat: 13.8200, destination_lng: 100.5570,
                maps_distance_km: 78.5, work_type: 'ติดตั้งระบบ', project_task: 'ติดตั้งระบบ ERP Phase 1', work_category: 'IT',
                ai_verified: true, ai_verification_note: 'การเดินทางสมเหตุสมผล ระยะทางตรงกับ Google Maps'
            },
            {
                item_id: fuelItems.rows[1]?.id,
                odometer_start: 45312, odometer_end: 45450, distance_km: 138,
                origin_address: '789 ถ.เพชรบุรี แขวงราชเทวี เขตราชเทวี กรุงเทพ 10400',
                origin_lat: 13.7500, origin_lng: 100.5350,
                destination_address: '321 ถ.มิตรภาพ อ.เมือง จ.นครราชสีมา 30000',
                destination_lat: 14.8800, destination_lng: 102.0200,
                maps_distance_km: 135.2, work_type: 'ส่งอุปกรณ์', project_task: 'ส่งอุปกรณ์เซิร์ฟเวอร์ไปไซต์งาน', work_category: 'Engineering',
                ai_verified: true, ai_verification_note: 'ระยะทางใกล้เคียง Maps (ส่วนต่าง 2.1%)'
            },
        ];

        for (const fd of fuelDetails) {
            if (!fd.item_id) continue;
            await db.query(
                `INSERT INTO fuel_details (item_id, odometer_start, odometer_end, distance_km, origin_address, origin_lat, origin_lng, destination_address, destination_lat, destination_lng, maps_distance_km, work_type, project_task, work_category, ai_verified, ai_verification_note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
                [fd.item_id, fd.odometer_start, fd.odometer_end, fd.distance_km, fd.origin_address, fd.origin_lat, fd.origin_lng, fd.destination_address, fd.destination_lat, fd.destination_lng, fd.maps_distance_km, fd.work_type, fd.project_task, fd.work_category, fd.ai_verified, fd.ai_verification_note]
            );
        }
        console.log('  ✅ Fuel details seeded (2 entries)');

        // Seed approval logs
        const approvalLogs = [
            { claim_id: 3, action: 'submitted', performed_by: 1, note: 'ส่งเบิกค่าใช้จ่ายประจำเดือน ม.ค.' },
            { claim_id: 4, action: 'submitted', performed_by: 1, note: 'ส่งเบิกค่าใช้จ่ายโครงการ IoT' },
            { claim_id: 5, action: 'submitted', performed_by: 1, note: null },
            { claim_id: 5, action: 'approved_accounting', performed_by: 2, note: 'ตรวจสอบแล้ว ถูกต้อง' },
            { claim_id: 6, action: 'submitted', performed_by: 1, note: null },
            { claim_id: 6, action: 'approved_accounting', performed_by: 2, note: 'OK' },
            { claim_id: 6, action: 'approved_pco', performed_by: 3, note: 'อนุมัติ' },
            { claim_id: 7, action: 'submitted', performed_by: 1, note: null },
            { claim_id: 7, action: 'approved_accounting', performed_by: 2, note: 'ตรวจสอบแล้ว' },
            { claim_id: 7, action: 'approved_pco', performed_by: 3, note: 'อนุมัติ' },
            { claim_id: 8, action: 'submitted', performed_by: 1, note: null },
            { claim_id: 8, action: 'approved_accounting', performed_by: 2, note: 'ผ่าน' },
            { claim_id: 8, action: 'approved_pco', performed_by: 3, note: 'อนุมัติ' },
            { claim_id: 9, action: 'submitted', performed_by: 1, note: null },
            { claim_id: 9, action: 'rejected', performed_by: 2, note: 'ใบเสร็จไม่ชัดเจน กรุณาส่งใหม่' },
        ];

        for (const log of approvalLogs) {
            await db.query(
                'INSERT INTO approval_logs (claim_id, action, performed_by, note) VALUES ($1, $2, $3, $4)',
                [log.claim_id, log.action, log.performed_by, log.note]
            );
        }
        console.log('  ✅ Approval logs seeded (15 entries)');

        console.log('\n🎉 Seed complete!');
        console.log('\n📋 Test Accounts:');
        console.log('   pm@ecms.com / password123 (Project Manager)');
        console.log('   accounting@ecms.com / password123 (บัญชี)');
        console.log('   pco@ecms.com / password123 (PCO)');

    } catch (err) {
        console.error('Seed error:', err);
    }

    process.exit(0);
}

seed();
