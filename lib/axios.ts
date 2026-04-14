import axios, { AxiosHeaders } from 'axios';
import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';

export const PPDB_AUTH_TOKEN_STORAGE_KEY = 'ppdb_portal_auth_token';
export const PPDB_AUTH_COOKIE_NAME = 'ppdb_auth';

const isBrowser = typeof window !== 'undefined';

const setCookie = (name: string, value: string, maxAgeSeconds: number) => {
    if (typeof document === 'undefined') return;

    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
};

const clearCookie = (name: string) => {
    if (typeof document === 'undefined') return;

    document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
};

export const setPpdbAuthMarker = () => {
    setCookie(PPDB_AUTH_COOKIE_NAME, '1', 60 * 60 * 24 * 14);
};

export const clearPpdbAuthMarker = () => {
    clearCookie(PPDB_AUTH_COOKIE_NAME);
};

export const getStoredPpdbToken = (): string => {
    if (!isBrowser) return '';

    return (
        window.localStorage.getItem(PPDB_AUTH_TOKEN_STORAGE_KEY) ||
        window.sessionStorage.getItem(PPDB_AUTH_TOKEN_STORAGE_KEY) ||
        ''
    ).trim();
};

export const setStoredPpdbToken = (token: string) => {
    if (!isBrowser) return;

    const value = token.trim();
    if (!value) return;

    window.localStorage.setItem(PPDB_AUTH_TOKEN_STORAGE_KEY, value);
    setPpdbAuthMarker();
};

export const clearStoredPpdbToken = () => {
    if (!isBrowser) return;

    window.localStorage.removeItem(PPDB_AUTH_TOKEN_STORAGE_KEY);
    window.sessionStorage.removeItem(PPDB_AUTH_TOKEN_STORAGE_KEY);
    clearPpdbAuthMarker();
};

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const headers =
            config.headers instanceof AxiosHeaders
                ? config.headers
                : AxiosHeaders.from(config.headers);
        const token = getCookieValue('XSRF-TOKEN');
        if (token) {
            headers.set('X-XSRF-TOKEN', decodeURIComponent(token));
        }

        const bearerToken = getStoredPpdbToken();
        if (bearerToken && !headers.get('Authorization')) {
            headers.set('Authorization', `Bearer ${bearerToken}`);
        }

        config.headers = headers;

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

        if (error.response?.status === 401) {
            if (isBrowser) {
                const currentPath = window.location.pathname || '';
                const isPpdbRoute = currentPath.startsWith('/ppdb');
                const isLoginPage = currentPath === '/login' || currentPath.startsWith('/ppdb/login');

                if (isPpdbRoute) {
                    // Avoid redirect loop and token wipe while PPDB session/token propagation is in progress.
                    return Promise.reject(error);
                }

                if (!isLoginPage) {
                    window.location.href = '/login';
                }
            }

            return Promise.reject(error);
        }

        if (error.response?.status === 419 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                await getCsrfToken();
                
                const newToken = getCookieValue('XSRF-TOKEN');
                if (newToken) {
                    const headers =
                        originalRequest.headers instanceof AxiosHeaders
                            ? originalRequest.headers
                            : AxiosHeaders.from(originalRequest.headers);

                    headers.set('X-XSRF-TOKEN', decodeURIComponent(newToken));
                    originalRequest.headers = headers;
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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const baseUrl = apiUrl.replace(/\/api\/?$/, '');

        if (!baseUrl) {
            throw new Error('NEXT_PUBLIC_API_URL belum diatur');
        }
        
        const response = await axios.get(`${baseUrl}/sanctum/csrf-cookie`, {
            withCredentials: true
        });
        
        return response;
    } catch (error) {
        throw error;
    }
};

export default api;