"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { KkmFilters } from "./components/kkm-filters"
import { KkmHeader } from "./components/kkm-header"
import { KkmTable } from "./components/kkm-table"
import { KkmItem, kkmService } from "@/lib/services/kkm.service"
import { dataKelasMapelService } from "@/lib/services/kelas-mapel.service"
import { kelasService, KelasItem } from "@/lib/services/kelas.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"

export default function KkmPage() {
  const router = useRouter()
  const { selectedTahunAjaran, isLoading: isTahunLoading } = useTahunAjaran()
  const { selectedUnit, isLoading: isUnitLoading } = useUnit()

  const [query, setQuery] = useState("")
  const [semester, setSemester] = useState("all")
  const [kodeKelas, setKodeKelas] = useState("all")
  const [perPage, setPerPage] = useState("10")
  const [items, setItems] = useState<KkmItem[]>([])
  const [kelasList, setKelasList] = useState<KelasItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Track apakah ini fetch pertama setelah context ready
  const contextReadyRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)

  // Ambil daftar kelas untuk dropdown filter — hanya sekali, per_page kecil
  useEffect(() => {
    kelasService.getAll({ status: "AKTIF", per_page: "50" })
      .then(setKelasList)
      .catch(() => setKelasList([]))
  }, [])

  const fetchKkm = useCallback(async () => {
    // Jangan fetch jika context masih loading
    if (isTahunLoading || isUnitLoading) return

    // Batalkan request sebelumnya jika ada
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setIsLoading(true)
      setError("")

      const queryTrimmed = query.trim()
      const tahunAjaran = selectedTahunAjaran?.nama_tahun || undefined
      const kodeUnit = selectedUnit?.kode_unit || undefined

      const sharedParams = {
        tahun_ajaran: tahunAjaran,
        semester: semester === "all" ? undefined : semester,
        kode_unit: kodeUnit,
        per_page: perPage,
      }

      // Satu API call — filter query dilakukan client-side
      let data = await kkmService.getAll(sharedParams)

      if (queryTrimmed) {
        const normalizedQuery = queryTrimmed.toLowerCase()
        data = data.filter((item) =>
          item.kode_mapel.toLowerCase().includes(normalizedQuery)
          || (item.mapel ?? "").toLowerCase().includes(normalizedQuery)
        )
      }

      // Filter berdasarkan kelas jika dipilih (client-side via kelas-mapel)
      if (kodeKelas !== "all") {
        const kelasMapelRes = await dataKelasMapelService.getAll({
          kode_kelas: kodeKelas,
          tahun_ajaran: tahunAjaran,
          semester: semester === "all" ? undefined : Number(semester),
          per_page: 500,
        })
        const kodeMapelDiKelas = new Set(
          kelasMapelRes.data
            .map((km) => (km.kode_mapel ?? "").toUpperCase())
            .filter(Boolean)
        )
        data = data.filter((item) =>
          kodeMapelDiKelas.has(item.kode_mapel.toUpperCase())
        )
      }

      if (!controller.signal.aborted) {
        setItems(data)
      }
    } catch (err: any) {
      if (!abortRef.current?.signal.aborted) {
        setError(err?.response?.data?.message || "Gagal memuat data KKM")
      }
    } finally {
      if (!abortRef.current?.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [isTahunLoading, isUnitLoading, selectedTahunAjaran, selectedUnit, kodeKelas, perPage, query, semester])

  // Hanya trigger fetch ketika context sudah selesai loading
  useEffect(() => {
    if (isTahunLoading || isUnitLoading) return
    fetchKkm()
  }, [fetchKkm, isTahunLoading, isUnitLoading])

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data KKM ini?")) return
    try {
      await kkmService.remove(id)
      fetchKkm()
    } catch (err: any) {
      alert(err?.response?.data?.message || "Gagal menghapus data KKM")
    }
  }

  const handleEdit = (id: number) => {
    router.push(`/dashboard/admin-panel/kkm/${id}/edit`)
  }

  const contextLoading = isTahunLoading || isUnitLoading

  return (
    <div className="space-y-6">
      <KkmHeader
        onAdd={() => router.push("/dashboard/admin-panel/kkm/new")}
        onRefresh={fetchKkm}
        onExport={() => console.log("Export KKM")}
      />

      <KkmFilters
        query={query}
        onQueryChange={setQuery}
        semester={semester}
        onSemesterChange={setSemester}
        kodeKelas={kodeKelas}
        onKodeKelasChange={setKodeKelas}
        kelasList={kelasList}
        perPage={perPage}
        onPerPageChange={setPerPage}
      />

      <KkmTable
        items={items}
        isLoading={isLoading || contextLoading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
