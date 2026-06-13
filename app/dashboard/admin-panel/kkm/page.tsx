"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { KkmFilters } from "./components/kkm-filters"
import { KkmHeader } from "./components/kkm-header"
import { KkmTable } from "./components/kkm-table"
import { KkmItem, kkmService } from "@/lib/services/kkm.service"
import { dataKelasMapelService } from "@/lib/services/kelas-mapel.service"
import { kelasService, KelasItem } from "@/lib/services/kelas.service"

export default function KkmPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [tahunAjaran, setTahunAjaran] = useState("all")
  const [semester, setSemester] = useState("all")
  const [kodeUnit, setKodeUnit] = useState("all")
  const [kodeKelas, setKodeKelas] = useState("all")
  const [perPage, setPerPage] = useState("10")
  const [items, setItems] = useState<KkmItem[]>([])
  const [kelasList, setKelasList] = useState<KelasItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Ambil daftar kelas untuk opsi dropdown filter
  useEffect(() => {
    kelasService.getAll({ status: "AKTIF" })
      .then(setKelasList)
      .catch(() => setKelasList([]))
  }, [])

  const fetchKkm = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")

      const queryTrimmed = query.trim()
      const sharedParams = {
        tahun_ajaran: tahunAjaran === "all" ? undefined : tahunAjaran,
        semester: semester === "all" ? undefined : semester,
        kode_unit: kodeUnit === "all" ? undefined : kodeUnit,
        per_page: perPage,
      }

      let data: KkmItem[]

      if (!queryTrimmed) {
        data = await kkmService.getAll(sharedParams)
      } else {
        const normalizedQuery = queryTrimmed.toLowerCase()

        // 1) Coba backend yang mendukung q (search umum)
        data = await kkmService.getAll({ ...sharedParams, q: queryTrimmed })

        // 2) Fallback backend yang hanya mendukung kode_mapel
        if (data.length === 0) {
          data = await kkmService.getAll({ ...sharedParams, kode_mapel: queryTrimmed })
        }

        // 3) Fallback terakhir: ambil dataset filter lain lalu cari di frontend
        if (data.length === 0) {
          data = await kkmService.getAll(sharedParams)
        }

        data = data.filter((item) => (
          item.kode_mapel.toLowerCase().includes(normalizedQuery)
          || (item.mapel ?? "").toLowerCase().includes(normalizedQuery)
        ))
      }

      // Filter berdasarkan kelas jika dipilih (client-side via kelas-mapel)
      if (kodeKelas !== "all") {
        const kelasMapelRes = await dataKelasMapelService.getAll({
          kode_kelas: kodeKelas,
          tahun_ajaran: tahunAjaran === "all" ? undefined : tahunAjaran,
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

      setItems(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memuat data KKM")
    } finally {
      setIsLoading(false)
    }
  }, [kodeUnit, kodeKelas, perPage, query, semester, tahunAjaran])

  useEffect(() => {
    fetchKkm()
  }, [fetchKkm])

  const handleDelete = async (id: number) => {
    try {
      await kkmService.remove(id)
      await fetchKkm()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menghapus data KKM")
    }
  }

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
        tahunAjaran={tahunAjaran}
        onTahunAjaranChange={setTahunAjaran}
        semester={semester}
        onSemesterChange={setSemester}
        kodeUnit={kodeUnit}
        onKodeUnitChange={setKodeUnit}
        kodeKelas={kodeKelas}
        onKodeKelasChange={setKodeKelas}
        kelasList={kelasList}
        perPage={perPage}
        onPerPageChange={setPerPage}
      />

      <KkmTable
        items={items}
        isLoading={isLoading}
        error={error}
        onEdit={(id) => router.push(`/dashboard/admin-panel/kkm/${id}/edit`)}
        onDelete={handleDelete}
      />
    </div>
  )
}
