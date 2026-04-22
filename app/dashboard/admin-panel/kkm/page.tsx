"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { KkmFilters } from "./components/kkm-filters"
import { KkmHeader } from "./components/kkm-header"
import { KkmTable } from "./components/kkm-table"
import { KkmItem, kkmService } from "@/lib/services/kkm.service"

export default function KkmPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [tahunAjaran, setTahunAjaran] = useState("all")
  const [semester, setSemester] = useState("all")
  const [kodeUnit, setKodeUnit] = useState("all")
  const [perPage, setPerPage] = useState("10")
  const [items, setItems] = useState<KkmItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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

      if (!queryTrimmed) {
        const data = await kkmService.getAll(sharedParams)
        setItems(data)
        return
      }

      const normalizedQuery = queryTrimmed.toLowerCase()

      // 1) Coba backend yang mendukung q (search umum)
      let data = await kkmService.getAll({
        ...sharedParams,
        q: queryTrimmed,
      })

      // 2) Fallback backend yang hanya mendukung kode_mapel
      if (data.length === 0) {
        data = await kkmService.getAll({
          ...sharedParams,
          kode_mapel: queryTrimmed,
        })
      }

      // 3) Fallback terakhir: ambil dataset filter lain lalu cari di frontend
      if (data.length === 0) {
        data = await kkmService.getAll(sharedParams)
      }

      const filtered = data.filter((item) => (
        item.kode_mapel.toLowerCase().includes(normalizedQuery)
        || (item.mapel ?? "").toLowerCase().includes(normalizedQuery)
      ))

      setItems(filtered)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memuat data KKM")
    } finally {
      setIsLoading(false)
    }
  }, [kodeUnit, perPage, query, semester, tahunAjaran])

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
