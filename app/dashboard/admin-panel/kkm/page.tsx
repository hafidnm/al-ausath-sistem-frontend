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

      const data = await kkmService.getAll({
        q: query || undefined,
        tahun_ajaran: tahunAjaran === "all" ? undefined : tahunAjaran,
        semester: semester === "all" ? undefined : semester,
        kode_unit: kodeUnit === "all" ? undefined : kodeUnit,
        per_page: perPage,
      })

      setItems(data)
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
