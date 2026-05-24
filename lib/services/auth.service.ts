import api, { getCsrfToken, setStoredPpdbToken } from '../axios';

export interface LoginRequest {
  role: 'petugas' | 'santri';
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  role: string;
  user: {
    id: number;
    nama_lengkap: string;
    email: string;
    nomor_induk?: string;
    peran_akun: string;
    pilihan_unit: string;
  };
  access_token?: string;
  api_token?: string;
  plainTextToken?: string;
  token?: string;
}

// Hapus cookie secara paksa dari sisi client
function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  // Coba hapus dengan berbagai kombinasi path/domain
  const paths = ['/', '/api', ''];
  paths.forEach((path) => {
    document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path};`;
    document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}; SameSite=Lax;`;
  });
}

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    await getCsrfToken();
    
    const response = await api.post<LoginResponse>('/login', data);
    const responseData = response.data;
    
    // Extract and store token from various possible fields
    const token = responseData.access_token || 
                  responseData.plainTextToken || 
                  responseData.api_token || 
                  responseData.token ||
                  response.headers['authorization']?.replace('Bearer ', '');
    
    if (token) {
      setStoredPpdbToken(token);
    }
    
    return responseData;
  },

  logout: async (): Promise<void> => {
    try {
      await getCsrfToken();
      await api.post('/logout');
    } finally {
      // Selalu bersihkan state lokal meskipun request gagal
      localStorage.clear();
      sessionStorage.clear();
      
      // Hapus cookie dari sisi client sebagai fallback
      const sessionCookieName = process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME || 'laravel-session';
      deleteCookie(sessionCookieName);
      deleteCookie('XSRF-TOKEN');
    }
  },

  me: async () => {
    try {
      const response = await api.get('/me')
      return response.data
    } catch (error) {
      return null
    }
  }
};