import api from "@/lib/axios"

export interface DataMasterInitOptions {
  unit: any[]
  kelas: any[]
  tahun_ajaran: any[]
  peran: string[]
  mapel: any[]
  petugas_list?: any[]
}

export const dataMasterService = {
  /**
   * Endpoint konsolidasi untuk mengambil opsi filter (dropdown)
   * secara serentak guna mencegah cascade-refetching pada halaman Data Master.
   */
  async getInitOptions(): Promise<DataMasterInitOptions> {
    const response = await api.get("/akademik/data-master/init")
    return response.data
  },
}
