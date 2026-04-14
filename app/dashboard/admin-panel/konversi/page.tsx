"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { KonversiFilters } from "./components/konversi-filters"
import { KonversiHeader } from "./components/konversi-header"
import { KonversiTable } from "./components/konversi-table"
import { KonversiItem, konversiService } from "@/lib/services/konversi.service"

export default function KonversiPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [kodeUnit, setKodeUnit] = useState("all")
  const [perPage, setPerPage] = useState("10")
  const [items, setItems] = useState<KonversiItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchKonversi = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")

      const queryTrimmed = query.trim()
      const normalizedQuery = queryTrimmed.toLowerCase()

      const data = await konversiService.getAll({
        // Beberapa backend tidak support q, jadi kita tetap filter di frontend.
        q: queryTrimmed || undefined,
        kode_unit: kodeUnit === "all" || kodeUnit === "global" ? undefined : kodeUnit,
        per_page: perPage,
      })

      const filtered = data.filter((item) => {
        const matchesUnit = kodeUnit === "all"
          ? true
          : kodeUnit === "global"
            ? !item.kode_unit || item.kode_unit.toLowerCase() === "global"
            : item.kode_unit?.toLowerCase() === kodeUnit.toLowerCase()

        if (!matchesUnit) return false
        if (!normalizedQuery) return true

        return (
          (item.nilai_huruf ?? "").toLowerCase().includes(normalizedQuery)
          || (item.predikat ?? "").toLowerCase().includes(normalizedQuery)
          || (item.keterangan ?? "").toLowerCase().includes(normalizedQuery)
          || (item.unit_nama ?? "").toLowerCase().includes(normalizedQuery)
          || (item.kode_unit ?? "").toLowerCase().includes(normalizedQuery)
        )
      })

      setItems(filtered)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memuat data konversi")
    } finally {
      setIsLoading(false)
    }
  }, [kodeUnit, perPage, query])

  useEffect(() => {
    fetchKonversi()
  }, [fetchKonversi])

  const handleDelete = async (id: number) => {
    try {
      await konversiService.remove(id)
      await fetchKonversi()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menghapus data konversi")
    }
  }

  return (
    <div className="space-y-6">
      <KonversiHeader
        onAdd={() => router.push("/dashboard/admin-panel/konversi/new")}
        onRefresh={fetchKonversi}
        onExport={() => console.log("Export konversi")}
      />

      <KonversiFilters
        query={query}
        onQueryChange={setQuery}
        kodeUnit={kodeUnit}
        onKodeUnitChange={setKodeUnit}
        perPage={perPage}
        onPerPageChange={setPerPage}
      />

      <KonversiTable
        items={items}
        isLoading={isLoading}
        error={error}
        onEdit={(id) => router.push(`/dashboard/admin-panel/konversi/${id}/edit`)}
        onDelete={handleDelete}
      />
    </div>
  )
}
