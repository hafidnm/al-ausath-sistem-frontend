import { useState, useCallback } from "react"
import { pembayaranService } from "@/lib/services/pembayaran.service"
import type { TagihanDetailResponse } from "@/lib/services/pembayaran.service"

export function useSantriAdministrasi() {
  const [data, setData] = useState<TagihanDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAdministrasi = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const response = await pembayaranService.getTagihanDetail(id)
      setData(response)
    } catch (err: any) {
      setError(err.message || "Gagal memuat data administrasi")
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetchAdministrasi }
}
