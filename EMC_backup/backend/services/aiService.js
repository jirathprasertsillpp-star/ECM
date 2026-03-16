const Anthropic = require('@anthropic-ai/sdk');

let anthropic;
try {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
} catch (e) {
    console.warn('⚠️  Anthropic API not configured. AI features will use fallback mode.');
}

const CATEGORY_LABELS = {
    fuel: 'ค่าน้ำมัน (Fuel)',
    meal: 'ค่าอาหาร (Meal)',
    transport: 'ค่าเดินทาง (Transport)',
    accommodation: 'ค่าที่พัก (Accommodation)',
    other: 'อื่นๆ (Other)'
};

async function ocrReceipt(imageBase64, mimeType) {
    if (!anthropic || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key') {
        const now = new Date().toISOString().split('T')[0];
        return {
            vendor_name: 'AI Not Configured',
            date: now,
            total_amount: 0,
            category_key: 'other',
            category_th: 'อื่นๆ',
            description: 'กรุณากรอกข้อมูลด้วยตนเอง',
            confidence: 0.0
        };
    }

    const response = await anthropic.messages.create({
        model: "claude-3-sonnet-20240229", // Recommended model for OCR
        max_tokens: 1000,
        messages: [{
            role: "user",
            content: [
                {
                    type: "image",
                    source: { type: "base64", media_type: mimeType, data: imageBase64 }
                },
                {
                    type: "text",
                    text: `Extract information from this receipt and return ONLY valid JSON:
          {
            "vendor_name": "ชื่อร้านหรือบริษัท",
            "date": "YYYY-MM-DD",
            "total_amount": 0.00,
            "category_key": "fuel|meal|transport|accommodation|other",
            "description": "รายละเอียดสั้นๆ เช่น ค่าอาหารเที่ยง, ค่าน้ำมันรถยนต์",
            "confidence": 0.95
          }
          Rules:
          1. Use YYYY-MM-DD for date.
          2. Use absolute number for total_amount.
          3. Pick best category_key.
          4. If you cannot read clearly, set confidence below 0.7.`
                }
            ]
        }]
    });

    try {
        const text = response.content[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
        
        // Add Thai category label
        data.category_th = CATEGORY_LABELS[data.category_key] || 'อื่นๆ';
        return data;
    } catch (err) {
        console.error('OCR Parse Error:', err);
        throw new Error('Failed to parse AI response');
    }
}

async function validateReceipt(receiptData, claimData) {
    if (!anthropic || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key') {
        return { isValid: true, confidence: 0.5, issues: [], suggestions: ['AI ไม่ได้ตั้งค่า ไม่สามารถตรวจสอบได้'] };
    }

    const prompt = `Validate this expense receipt for a Thai company expense claim system.
  Receipt data: ${JSON.stringify(receiptData)}
  Claim period: ${claimData.claim_month}
  Check: 1. Date is within claim month 2. Amount seems reasonable for category 3. All required fields are present 4. No suspicious patterns
  Return ONLY valid JSON: { "isValid": true/false, "confidence": 0.95, "issues": [], "suggestions": [] }`;

    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }]
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
}

async function verifyFuelTrip(fuelData, mapsDistance) {
    if (!anthropic || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key') {
        const odoDiff = fuelData.odometer_end - fuelData.odometer_start;
        const variance = mapsDistance ? Math.abs(odoDiff - mapsDistance) / mapsDistance * 100 : 0;
        return {
            isVerified: variance <= 20,
            confidence: 0.5,
            distanceVariance: parseFloat(variance.toFixed(1)),
            issues: [],
            note: 'AI ไม่ได้ตั้งค่า — ตรวจสอบเบื้องต้นจากระยะทางเท่านั้น'
        };
    }

    const odoDiff = fuelData.odometer_end - fuelData.odometer_start;
    const prompt = `Verify this fuel expense for a Thai company:
  Odometer: ${fuelData.odometer_start} → ${fuelData.odometer_end} (${odoDiff} km)
  Google Maps distance: ${mapsDistance} km
  Route: ${fuelData.origin_address} → ${fuelData.destination_address}
  Work purpose: ${fuelData.project_task}
  Work category: ${fuelData.work_category}
  Verify: 1. Odometer difference vs Maps distance (allow 20% variance) 2. Route makes sense 3. Distance is reasonable
  Return ONLY valid JSON: { "isVerified": true/false, "confidence": 0.95, "distanceVariance": 5.2, "issues": [], "note": "..." }`;

    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }]
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
}

async function chat(message, userContext) {
    if (!anthropic || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key') {
        return 'ขออภัย ระบบ AI ยังไม่ได้ตั้งค่า กรุณาตั้งค่า ANTHROPIC_API_KEY ในไฟล์ .env';
    }

    const systemPrompt = `You are an AI assistant for ECMS (Expense Claim Management System).
  You help Thai users with their expense claims.
  Current user: ${userContext.name} (${userContext.role})
  ${userContext.recentClaims ? `Current claims data: ${JSON.stringify(userContext.recentClaims)}` : ''}
  Answer in Thai language. Be concise and helpful.`;

    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: message }]
    });
    return response.content[0].text;
}

async function detectAnomalies(claims) {
    if (!anthropic || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your-anthropic-api-key') {
        return { anomalies: [], summary: 'AI ไม่ได้ตั้งค่า ไม่สามารถตรวจสอบความผิดปกติได้' };
    }

    const prompt = `Analyze these expense claims for anomalies: ${JSON.stringify(claims)}
  Check for: 1. Duplicate receipts 2. Unusually high amounts 3. Suspicious patterns 4. Missing information
  Return ONLY valid JSON: { "anomalies": [{ "claimId": 1, "type": "...", "severity": "high|medium|low", "description": "..." }], "summary": "..." }`;

    const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
}

module.exports = { ocrReceipt, validateReceipt, verifyFuelTrip, chat, detectAnomalies };
