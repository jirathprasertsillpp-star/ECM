import { useState, useCallback } from 'react';
import { authAPI } from '../api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export function useAuth() {
    const [isLoading, setIsLoading] = useState(false);
    const { user, token, isAuthenticated, setAuth, logout: clearAuth } = useAuthStore();

    const login = useCallback(async (data) => {
        try {
            setIsLoading(true);
            const res = await authAPI.login(data);
            setAuth(res.data.user, res.data.token);
            toast.success('เข้าสู่ระบบสำเร็จ');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [setAuth]);

    const lineLogin = useCallback(async (lineUserId) => {
        try {
            setIsLoading(true);
            const res = await authAPI.lineLogin({ lineUserId });
            setAuth(res.data.user, res.data.token);
            toast.success('เข้าสู่ระบบสำเร็จด้วย LINE');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [setAuth]);

    const logout = useCallback(async () => {
        try {
            await authAPI.logout();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            clearAuth();
            toast.success('ออกจากระบบสำเร็จ');
        }
    }, [clearAuth]);

    return { user, token, isAuthenticated, isLoading, login, lineLogin, logout };
}
