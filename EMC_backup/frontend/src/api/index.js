import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - add JWT token
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    lineLogin: (data) => api.post('/auth/line-login', data),
    me: () => api.get('/auth/me'),
    logout: () => api.post('/auth/logout'),
};

// Claims API
export const claimsAPI = {
    list: (params) => api.get('/claims', { params }),
    create: (data) => api.post('/claims', data),
    get: (id) => api.get(`/claims/${id}`),
    update: (id, data) => api.put(`/claims/${id}`, data),
    delete: (id) => api.delete(`/claims/${id}`),
    addItem: (claimId, data) => api.post(`/claims/${claimId}/items`, data),
    updateItem: (claimId, itemId, data) => api.put(`/claims/${claimId}/items/${itemId}`, data),
    deleteItem: (claimId, itemId) => api.delete(`/claims/${claimId}/items/${itemId}`),
    submit: (id, data) => api.post(`/claims/${id}/submit`, data),
    approve: (id, data) => api.post(`/claims/${id}/approve`, data),
    reject: (id, data) => api.post(`/claims/${id}/reject`, data),
    getLogs: (id) => api.get(`/claims/${id}/logs`),
};

// Fuel API
export const fuelAPI = {
    save: (itemId, data) => api.post(`/items/${itemId}/fuel`, data),
    get: (itemId) => api.get(`/items/${itemId}/fuel`),
};

// Receipts API
export const receiptsAPI = {
    list: (itemId) => api.get(`/items/${itemId}/receipts`),
    upload: (itemId, file) => {
        const formData = new FormData();
        formData.append('receipt', file);
        return api.post(`/items/${itemId}/receipts`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    delete: (receiptId) => api.delete(`/items/receipts/${receiptId}`),
    ocr: (receiptId) => api.post(`/items/receipts/${receiptId}/ocr`),
};

// Dashboard API
export const dashboardAPI = {
    stats: () => api.get('/dashboard/stats'),
    chart: () => api.get('/dashboard/chart'),
    recent: () => api.get('/dashboard/recent'),
};

// Export API
export const exportAPI = {
    pdf: (claimId) => api.get(`/export/claims/${claimId}/pdf`, { responseType: 'blob' }),
    excel: (params) => api.get('/export/excel', { params, responseType: 'blob' }),
};

// AI API
export const aiAPI = {
    chat: (message) => api.post('/ai/chat', { message }),
    verifyFuel: (fuelId) => api.post(`/ai/verify-fuel/${fuelId}`),
    anomalies: () => api.post('/ai/anomalies'),
};
