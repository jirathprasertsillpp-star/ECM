import { useState, useCallback } from 'react';
import { aiAPI } from '../api';
import toast from 'react-hot-toast';

export function useAI() {
    const [isTyping, setIsTyping] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const sendMessage = useCallback(async (message) => {
        try {
            setIsTyping(true);
            const res = await aiAPI.chat(message);
            return res.data.response;
        } catch (err) {
            toast.error('AI ไม่สามารถตอบสนองได้ชั่วคราว: ' + (err.response?.data?.error || err.message));
            return 'ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI กรุณาลองใหม่อีกครั้ง';
        } finally {
            setIsTyping(false);
        }
    }, []);

    const verifyFuel = useCallback(async (fuelId) => {
        try {
            setVerifying(true);
            const res = await aiAPI.verifyFuel(fuelId);
            toast.success('วิเคราะห์การเดินทางด้วย AI สำเร็จ');
            return res.data.verification;
        } catch (err) {
            toast.error('AI Verify Error: ' + (err.response?.data?.error || err.message));
            return null;
        } finally {
            setVerifying(false);
        }
    }, []);

    const checkAnomalies = useCallback(async () => {
        try {
            setVerifying(true);
            const res = await aiAPI.anomalies();
            // It returns { anomalies: [], summary: string }
            return res.data;
        } catch (err) {
            console.error('Anomaly check error:', err);
            return { anomalies: [], summary: 'ไม่สามารถตรวจสอบแบบเรียลไทม์ได้' };
        } finally {
            setVerifying(false);
        }
    }, []);

    return { isTyping, verifying, sendMessage, verifyFuel, checkAnomalies };
}
