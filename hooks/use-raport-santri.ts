import { useCallback, useEffect, useRef } from 'react'
import api from '@/lib/axios'
import { getCachedUser } from '@/lib/auth-cache'
import { useAsyncQuery } from './shared/use-async-request'

interface RaportData {
  id?: string
  id_raport?: number
  nomor_induk: string
  tahun_ajaran: string
  semester: number
  status_raport: 'DRAFT' | 'TERBIT'
  raport?: any
  santri?: any
  nilai_mapel?: any[]
  nilai_akhlak?: any[]
  [key: string]: any
}

interface UseRaportSantriParams {
  tahunAjaran?: string
  semester?: number
}

const getRaportDirect = async (params: any): Promise<RaportData | null> => {
  try {
    const response = await api.get("/akademik/raport/self", { params })
    
    console.log('Raw raport response:', response.data)
    
    // Extract the nested data structure
    const apiData = response.data?.data
    if (!apiData || !apiData.raport) {
      console.log('No raport data in response')
      return null
    }

    // Flatten the structure into one object for easier use
    const raport = apiData.raport
    const data: RaportData = {
      ...raport,
      status_raport: raport.status_raport,
      santri: apiData.santri,
      nilai_mapel: apiData.nilai_mapel,
      nilai_akhlak: apiData.nilai_akhlak,
    }
    
    console.log('Extracted raport data:', data)
    console.log('Raport status_raport:', data.status_raport)
    
    return data
  } catch (error) {
    console.error('Error fetching raport:', error)
    return null
  }
}

export function useRaportSantri({ tahunAjaran, semester }: UseRaportSantriParams = {}) {
  const query = useCallback(async () => {
    const authData = await getCachedUser()
    const user = authData?.user
    if (!user?.nomor_induk) {
      throw new Error('Data santri tidak ditemukan. Silakan login kembali.')
    }

    const params: any = {}
    if (tahunAjaran) params.tahun_ajaran = tahunAjaran
    if (semester) params.semester = semester

    const raport = await getRaportDirect(params)
    
    console.log('Full raport object:', raport)
    
    // Check if status_raport is TERBIT (case-insensitive)
    const status = raport?.status_raport?.toUpperCase?.() || ''
    console.log('Checking status_raport:', status, 'equals TERBIT?', status === 'TERBIT')
    
    // Only return raport if status_raport is TERBIT
    if (raport && status === 'TERBIT') {
      console.log('Raport is TERBIT, returning:', raport)
      return raport
    }
    
    console.log('Raport is not TERBIT or null, returning null')
    return null
  }, [tahunAjaran, semester])

  const { data, loading, error, run } = useAsyncQuery(query, null as RaportData | null, {
    fallbackError: 'Gagal memuat data raport',
    logLabel: 'Error fetching raport santri:',
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

// Hook to download or preview raport PDF
export async function downloadRaportPDF(tahunAjaran?: string, semester?: number, previewOnly?: boolean): Promise<Blob | void> {
  try {
    const params: any = {}
    if (tahunAjaran) params.tahun_ajaran = tahunAjaran
    if (semester) params.semester = semester

    const response = await api.get("/akademik/raport/self/pdf", {
      params,
      responseType: 'blob'
    })

    const blob = new Blob([response.data], { type: 'application/pdf' })

    // If previewOnly, return blob for external handling
    if (previewOnly) {
      return blob
    }

    // Otherwise, trigger download
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Raport_${tahunAjaran}_Semester_${semester}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading raport PDF:', error)
    throw new Error('Gagal mengunduh raport')
  }
}
