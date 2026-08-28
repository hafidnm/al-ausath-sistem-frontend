import api from "@/lib/axios"

export interface ProfilWeb {
  id_profil: number
  tipe: string
  nama: string
  lama_pendidikan: string
  visi: string
  misi: string[]
  sejarah: string
  program_unggulan: string[]
  fasilitas: string[]
  artikel_url?: string  // URL website artikel pesantren yang sudah ada
}

export const profilWebService = {
  getAll: async () => {
    const response = await api.get('/profil-web')
    return response.data.data as ProfilWeb[]
  },
  
  update: async (id: number, data: Partial<ProfilWeb>) => {
    const response = await api.put(`/administrasi/profil-web/${id}`, data)
    return response.data
  },

  create: async (data: Omit<ProfilWeb, 'id_profil'>) => {
    const response = await api.post('/administrasi/profil-web', data)
    return response.data
  },

  delete: async (id: number) => {
    const response = await api.delete(`/administrasi/profil-web/${id}`)
    return response.data
  }
}
