import { useCallback, useEffect, useMemo, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { kelasService } from "@/lib/services/kelas.service"
import { rangkingKelasService } from "@/lib/services/rangking-kelas.service"
import type { KelasOption, RankingItem } from "../types"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"

const defaultTahunAjaran = "2025/2026"

export function useRangkingKelas() {
  const { toast } = useToast()
  const { selectedTahunAjaran } = useTahunAjaran()

  const tahunAjaran = selectedTahunAjaran?.nama_tahun || defaultTahunAjaran

  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>([])
  const [selectedClassCode, setSelectedClassCode] = useState("")
  const [semester, setSemester] = useState("1")
  const [rankedData, setRankedData] = useState<RankingItem[]>([])
  const [isLoadingKelas, setIsLoadingKelas] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const loadKelasOptions = useCallback(async () => {
    try {
      setIsLoadingKelas(true)
      const rows = await kelasService.getAll({
        per_page: "100",
        status: "AKTIF",
      })

      const mapped: KelasOption[] = rows.map((row) => ({
        id: row.id,
        kodeKelas: row.kode_kelas,
        namaKelas: row.nama_kelas,
        tahunAjaran: row.tahun_ajaran,
      }))

      const dedupedByKode = Array.from(new Map(mapped.map((item) => [item.kodeKelas, item])).values())
      setKelasOptions(dedupedByKode)
    } catch (error: any) {
      setKelasOptions([])
      toast({
        title: "Gagal memuat kelas",
        description: error?.response?.data?.message || "Tidak bisa mengambil data kelas dari server",
        variant: "destructive",
      })
    } finally {
      setIsLoadingKelas(false)
    }
  }, [toast])

  useEffect(() => {
    void loadKelasOptions()
  }, [loadKelasOptions])

  const selectedClass = useMemo(() => {
    return kelasOptions.find((item) => item.kodeKelas === selectedClassCode)
  }, [kelasOptions, selectedClassCode])

  const generateRanking = useCallback(async (showSuccessToast: boolean) => {
    if (!selectedClassCode) {
      setRankedData([])
      return
    }

    try {
      setIsGenerating(true)
      const effectiveTahunAjaran = tahunAjaran?.trim() || selectedClass?.tahunAjaran || defaultTahunAjaran
      const payload = {
        kode_kelas: String(selectedClassCode).trim().toUpperCase(),
        tahun_ajaran: effectiveTahunAjaran,
        semester: Number(semester || "1"),
      }

      // Inform user that generate started
      if (showSuccessToast) {
        toast({ title: "Memulai generate", description: `Meng-generate ranking ${payload.kode_kelas}...` })
      }

      const response = await rangkingKelasService.generate(payload)

      const mappedRows: RankingItem[] = response.ranking.map((item) => ({
        rank: item.peringkat_kelas,
        nama: item.nama_lengkap_santri,
        nomorInduk: item.nomor_induk,
        poin: item.rata_rata,
        totalNilai: item.jumlah_nilai,
      }))

      setRankedData(mappedRows)

      if (!response.ranking || response.ranking.length === 0) {
        // backend may return a message when no data available
        toast({ title: "Tidak ada data", description: "Data raport untuk kelas dan semester ini belum tersedia.", variant: "destructive" })
      } else if (showSuccessToast) {
        toast({
          title: "Generate berhasil",
          description: `Ranking kelas ${response.kode_kelas} berhasil diperbarui`,
        })
      }
    } catch (error: any) {
      setRankedData([])
      toast({
        title: "Generate gagal",
        description: error?.response?.data?.message || "Tidak bisa mengambil data ranking kelas",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }, [selectedClass?.tahunAjaran, selectedClassCode, semester, tahunAjaran, toast])

  const handleGenerate = useCallback(async () => {
    if (!selectedClassCode) {
      toast({
        title: "Pilih kelas dulu",
        description: "Silakan pilih kelas yang ingin ditampilkan ranking-nya",
        variant: "destructive",
      })
      return
    }

    await generateRanking(true)
  }, [generateRanking, selectedClassCode, toast])

  const averageScore = useMemo(() => {
    if (rankedData.length === 0) {
      return 0
    }

    const total = rankedData.reduce((acc, item) => acc + item.poin, 0)
    return total / rankedData.length
  }, [rankedData])

  return {
    classOptions: kelasOptions,
    selectedClassCode,
    setSelectedClassCode,
    tahunAjaran,
    semester,
    setSemester,
    isLoadingKelas,
    isGenerating,
    rankedData,
    averageScore,
    handleGenerate,
  }
}
