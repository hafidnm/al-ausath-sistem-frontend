import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true, // ✅ Ini sudah benar!
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

// 🔥 TAMBAHAN 1: Response Interceptor untuk Handle Error
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Kalau dapat 401 (Unauthorized), redirect ke login
        if (error.response?.status === 401) {
            window.location.href = '/login';
        }
        
        // Kalau dapat 419 (CSRF Token Mismatch), refresh CSRF token
        if (error.response?.status === 419) {
            return getCsrfToken().then(() => {
                return api.request(error.config);
            });
        }
        
        return Promise.reject(error);
    }
);

// 🔥 TAMBAHAN 2: Function untuk Get CSRF Token (PENTING!)
export const getCsrfToken = async () => {
    try {
        // Laravel Sanctum butuh hit endpoint ini dulu sebelum login
        await axios.get(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/sanctum/csrf-cookie`, {
            withCredentials: true
        });
    } catch (error) {
        console.error('Error getting CSRF token:', error);
    }
};

export default api;