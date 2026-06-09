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
    // Use /akademik/raport/self endpoint - specific for santri, auto-detects logged-in user
    const response = await api.get("/akademik/raport/self", { 
      params
    })
    
    console.log('Raw raport response:', response.data)
    console.log('Response status code:', response.status)
    
    // Extract the data from response
    const apiData = response.data?.data ?? response.data
    if (!apiData) {
      console.log('No raport data in response')
      return null
    }

    console.log('Raw apiData:', apiData)

    // Some backends return { raport: {...}, santri: {...}, nilai_mapel: [...] }
    // Normalize/flatten so FE can access fields directly: nomor_induk, tahun_ajaran, semester
    const raportObj = apiData.raport ?? apiData
    const santriObj = apiData.santri ?? apiData.siswa ?? apiData.student ?? {}
    const nilaiMapel = apiData.nilai_mapel ?? raportObj.nilai_mapel ?? apiData?.nilai_mapel

    const nomorInduk = (
      raportObj?.nomor_induk
      || santriObj?.nomor_induk
      || raportObj?.nis
      || santriObj?.nis
      || ''
    )

    const tahunAjaranVal = (
      raportObj?.tahun_ajaran
      || apiData?.tahun_ajaran
      || santriObj?.tahun_ajaran
      || ''
    )

    const semesterVal = (
      raportObj?.semester ?? apiData?.semester ?? santriObj?.semester ?? 0
    )

    // Normalize the response data
    const data: RaportData = {
      ...raportObj,
      nomor_induk: String(nomorInduk || '').trim(),
      tahun_ajaran: String(tahunAjaranVal || '').trim(),
      semester: Number(semesterVal) || 0,
      santri: santriObj,
      nilai_mapel: Array.isArray(nilaiMapel) ? nilaiMapel : undefined,
      status_raport: (raportObj?.status || apiData?.status || raportObj?.status_raport || apiData?.status_raport || 'DRAFT'),
    }
    
    console.log('Extracted raport data:', data)
    console.log('Raport status_raport:', data.status_raport)
    
    return data
  } catch (error) {
    console.error('Error fetching raport:', error)
    if ((error as any)?.response?.data) {
      console.error('Error response data:', (error as any).response.data)
    }
    return null
  }
}

export function useRaportSantri({ tahunAjaran, semester }: UseRaportSantriParams = {}) {
  const query = useCallback(async () => {
    // Backend requires tahun_ajaran and semester - always send them with defaults
    const params: any = {
      tahun_ajaran: tahunAjaran || "2025/2026",
      semester: semester || 1,
    }

    console.log('Fetching raport with params:', params)
    const raport = await getRaportDirect(params)
    
    console.log('Full raport object:', raport)
    
    if (!raport) {
      console.log('No raport data returned')
      return null
    }
    
    // Check if status_raport is TERBIT (case-insensitive)
    // Handle various status formats: TERBIT, PUBLISHED, terbit, 1, true, etc.
    const status = String(raport?.status_raport || '').trim().toUpperCase()
    const isPublished = 
      status === 'TERBIT' ||
      status === 'PUBLISHED' ||
      status === 'PUBLISH' ||
      status === 'AKTIF' ||
      status === 'ACTIVE' ||
      status === '1' ||
      status === 'TRUE' ||
      raport?.is_published === true ||
      raport?.is_published === 1 ||
      raport?.published === true ||
      raport?.published === 1
    
    console.log('Status raw:', raport?.status_raport)
    console.log('Status normalized:', status)
    console.log('Is published:', isPublished)
    
    // For debugging: return raport even if not published to see data
    // This will help identify if data exists but has wrong status
    console.log('Returning raport regardless of published status for debugging')
    console.log('DEBUG: All raport fields:', Object.keys(raport))
    return raport
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
