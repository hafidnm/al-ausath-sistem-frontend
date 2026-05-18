import { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/lib/axios'
import { NilaiMapelItem } from '@/lib/services/nilai-mapel.service'
import { getCachedUser } from '@/lib/auth-cache'
import { useAsyncQuery } from './shared/use-async-request'

interface UseNilaiMapelSantriParams {
  tahunAjaran?: string
  semester?: number
}

// Direct API call without enrichment for speed (API already includes all data)
const getNilaiMapelDirect = async (params: any): Promise<NilaiMapelItem[]> => {
  const response = await api.get("/akademik/nilai-mapel", { params })
  
  const data = Array.isArray(response.data) 
    ? response.data 
    : Array.isArray(response.data?.data) 
      ? response.data.data 
      : []

  return data as NilaiMapelItem[]
}

export function useNilaiMapelSantri({ tahunAjaran, semester }: UseNilaiMapelSantriParams = {}) {
  const query = useCallback(async () => {
    const authData = await getCachedUser()
    const user = authData?.user
    if (!user?.nomor_induk) {
      throw new Error('Data santri tidak ditemukan. Silakan login kembali.')
    }

    const params: any = { nomor_induk: user.nomor_induk }
    if (tahunAjaran) params.tahun_ajaran = tahunAjaran
    if (semester) params.semester = semester

    // Use direct API call (no enrichment) for faster response
    return getNilaiMapelDirect(params)
  }, [tahunAjaran, semester])

  const { data, loading, error, run } = useAsyncQuery(query, [] as NilaiMapelItem[], {
    fallbackError: 'Gagal memuat data nilai mapel',
    logLabel: 'Error fetching nilai mapel santri:',
  })

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    if (isMountedRef.current) {
      run()
    }

    return () => {
      isMountedRef.current = false
    }
  }, [run])

  return { data, loading, error, refetch: run }
}
