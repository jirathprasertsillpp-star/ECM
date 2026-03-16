import { create } from 'zustand';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('ecms_user') || 'null'),
    token: localStorage.getItem('ecms_token') || null,
    isAuthenticated: !!localStorage.getItem('ecms_token'),

    setAuth: (user, token) => {
        localStorage.setItem('ecms_user', JSON.stringify(user));
        localStorage.setItem('ecms_token', token);
        set({ user, token, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('ecms_user');
        localStorage.removeItem('ecms_token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    updateUser: (userData) => {
        const updated = { ...JSON.parse(localStorage.getItem('ecms_user') || '{}'), ...userData };
        localStorage.setItem('ecms_user', JSON.stringify(updated));
        set({ user: updated });
    },
}));

export default useAuthStore;
