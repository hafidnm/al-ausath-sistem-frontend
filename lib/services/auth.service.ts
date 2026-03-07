import api, { getCsrfToken } from '../axios';

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
}

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    await getCsrfToken();
    
    const response = await api.post<LoginResponse>('/login', data);
    
    return response.data;
  },

  logout: async (): Promise<void> => {
    await getCsrfToken()
    await api.post('/logout')
    
    localStorage.clear()
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