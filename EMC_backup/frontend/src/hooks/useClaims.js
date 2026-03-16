import { useState, useCallback } from 'react';
import { claimsAPI, receiptsAPI, fuelAPI } from '../api';
import toast from 'react-hot-toast';

export function useClaims() {
    const [claims, setClaims] = useState([]);
    const [currentClaim, setCurrentClaim] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchClaims = useCallback(async (filters = {}) => {
        try {
            setLoading(true);
            const res = await claimsAPI.list(filters);
            setClaims(res.data.claims);
        } catch (err) {
            toast.error('ไม่สามารถดึงข้อมูลได้: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchClaimDetails = useCallback(async (id) => {
        try {
            setLoading(true);
            const res = await claimsAPI.get(id);
            setCurrentClaim(res.data);
            return res.data;
        } catch (err) {
            toast.error('ไม่สามารถดึงรายละเอียดได้: ' + (err.response?.data?.error || err.message));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createClaim = useCallback(async (data) => {
        try {
            setLoading(true);
            const res = await claimsAPI.create(data);
            toast.success('บันทึกร่างสำเร็จ');
            return res.data.claim;
        } catch (err) {
            toast.error('เกิดข้อผิดพลาด: ' + (err.response?.data?.error || err.message));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const submitClaim = useCallback(async (id, note) => {
        try {
            setLoading(true);
            await claimsAPI.submit(id, { note });
            toast.success('ส่งแบบขออนุมัติสำเร็จ');
            return true;
        } catch (err) {
            toast.error('เกิดข้อผิดพลาดในการส่ง: ' + (err.response?.data?.error || err.message));
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const approveClaim = useCallback(async (id, note) => {
        try {
            setLoading(true);
            await claimsAPI.approve(id, { note });
            toast.success('อนุมัติสำเร็จ');
            return true;
        } catch (err) {
            toast.error('เกิดข้อผิดพลาด: ' + (err.response?.data?.error || err.message));
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const rejectClaim = useCallback(async (id, note) => {
        try {
            setLoading(true);
            await claimsAPI.reject(id, { note });
            toast.success('ส่งกลับสำเร็จ');
            return true;
        } catch (err) {
            toast.error('เกิดข้อผิดพลาด: ' + (err.response?.data?.error || err.message));
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const addItem = useCallback(async (claimId, data) => {
        try {
            setLoading(true);
            const res = await claimsAPI.addItem(claimId, data);
            toast.success('เพิ่มรายการสำเร็จ');
            return res.data;
        } catch (err) {
            toast.error('เกิดข้อผิดพลาด: ' + (err.response?.data?.error || err.message));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteItem = useCallback(async (claimId, itemId) => {
        try {
            setLoading(true);
            await claimsAPI.deleteItem(claimId, itemId);
            toast.success('ลบรายการสำเร็จ');
            return true;
        } catch (err) {
            toast.error('เกิดข้อผิดพลาด: ' + (err.response?.data?.error || err.message));
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    const uploadReceipt = useCallback(async (itemId, file) => {
        try {
            setLoading(true);
            const res = await receiptsAPI.upload(itemId, file);
            toast.success('อัปโหลดไฟล์สำเร็จ');
            return res.data;
        } catch (err) {
            toast.error('เกิดข้อผิดพลาดในการอัปโหลด: ' + (err.response?.data?.error || err.message));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const performOcr = useCallback(async (receiptId) => {
        try {
            setLoading(true);
            const res = await receiptsAPI.ocr(receiptId);
            if (res.data.warning) {
                toast.error(res.data.warning);
            } else {
                toast.success('วิเคราะห์ใบเสร็จสำเร็จ');
            }
            return res.data;
        } catch (err) {
            toast.error('เกิดข้อผิดพลาดในการวิเคราะห์ AI: ' + (err.response?.data?.error || err.message));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const saveFuel = useCallback(async (itemId, data) => {
        try {
            setLoading(true);
            const res = await fuelAPI.save(itemId, data);
            toast.success('บันทึกการเดินทางเรียบร้อย');
            return res.data;
        } catch (err) {
            toast.error('เกิดข้อผิดพลาด: ' + (err.response?.data?.error || err.message));
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        claims,
        currentClaim,
        loading,
        fetchClaims,
        fetchClaimDetails,
        createClaim,
        submitClaim,
        approveClaim,
        rejectClaim,
        addItem,
        deleteItem,
        uploadReceipt,
        performOcr,
        saveFuel,
    };
}
