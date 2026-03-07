import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use(
    (config) => {
        const token = getCookieValue('XSRF-TOKEN');
        if (token) {
            config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
        } else {
            console.warn('No XSRF-TOKEN cookie found');
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
            return Promise.reject(error);
        }

        if (error.response?.status === 419 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                await getCsrfToken();
                
                const newToken = getCookieValue('XSRF-TOKEN');
                if (newToken) {
                    originalRequest.headers['X-XSRF-TOKEN'] = decodeURIComponent(newToken);
                }
                
                return api.request(originalRequest);
            } catch (csrfError) {
                return Promise.reject(error);
            }
        }
        
        return Promise.reject(error);
    }
);

function getCookieValue(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    
    return null;
}

export const getCsrfToken = async () => {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '');
        
        const response = await axios.get(`${baseUrl}/sanctum/csrf-cookie`, {
            withCredentials: true
        });
        
        return response;
    } catch (error) {
        throw error;
    }
};

export default api;