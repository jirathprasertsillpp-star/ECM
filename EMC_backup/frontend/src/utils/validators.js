import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email({ message: 'รูปแบบอีเมลไม่ถูกต้อง' }),
    password: z.string().min(6, { message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }),
});

export const claimSchema = z.object({
    project_name: z.string().min(1, { message: 'กรุณากรอกชื่อโครงการ' }),
    project_code: z.string().optional(),
    claim_month: z.string().min(1, { message: 'กรุณาเลือกเดือนที่เบิก' }),
    notes: z.string().optional(),
});

export const itemSchema = z.object({
    item_date: z.string().min(1, { message: 'กรุณาเลือกวันที่' }),
    category: z.string().min(1, { message: 'กรุณาเลือกประเภท' }),
    description: z.string().min(1, { message: 'กรุณากรอกรายละเอียด' }),
    amount: z.number().min(1, { message: 'จำนวนเงินต้องมากกว่า 0' }),
    is_fuel: z.boolean().optional(),
});

export const fuelSchema = z.object({
    odometer_start: z.number().min(0, { message: 'กรุณากรอกเลขไมล์เริ่มต้น' }),
    odometer_end: z.number().min(0, { message: 'กรุณากรอกเลขไมล์สิ้นสุด' }),
    origin_address: z.string().min(1, { message: 'กรุณาระบุจุดเริ่มต้น' }),
    destination_address: z.string().min(1, { message: 'กรุณาระบุจุดสิ้นสุด' }),
    project_task: z.string().min(1, { message: 'กรุณาระบุลักษณะงาน' }),
    work_type: z.string().optional(),
    work_category: z.string().optional(),
}).refine((data) => data.odometer_end >= data.odometer_start, {
    message: 'เลขไมล์สิ้นสุดต้องมากกว่าหรือเท่ากับเลขไมล์เริ่มต้น',
    path: ['odometer_end'],
});
