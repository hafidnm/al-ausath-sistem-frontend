"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { NilaiAkhlakFilters } from "./components/nilai-akhlak-filters"
import { NilaiAkhlakHeader } from "./components/nilai-akhlak-header"
import { NilaiAkhlakTable } from "./components/nilai-akhlak-table"
import { NilaiAkhlakItem, nilaiAkhlakService } from "@/lib/services/nilai-akhlak.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"

export default function NilaiAkhlakPage() {
  const router = useRouter()
  const { selectedTahunAjaran, isLoading: isTahunLoading } = useTahunAjaran()

  const [nomorInduk, setNomorInduk] = useState("")
  const [semester, setSemester] = useState("all")
  const [aspek, setAspek] = useState("all")
  const [perPage, setPerPage] = useState("10")
  const [items, setItems] = useState<NilaiAkhlakItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchNilaiAkhlak = useCallback(async () => {
    if (isTahunLoading) return
    try {
      setIsLoading(true)
      setError("")

      const tahunAjaran = selectedTahunAjaran?.nama_tahun || undefined

      const sharedParams = {
        tahun_ajaran: tahunAjaran,
        semester: semester === "all" ? undefined : semester,
        aspek: aspek === "all" ? undefined : aspek,
        per_page: perPage,
      }

      const data = nomorInduk.trim()
        ? await nilaiAkhlakService.getAll({
          ...sharedParams,
          nomor_induk: nomorInduk.trim(),
        })
        : await nilaiAkhlakService.getAllBar(sharedParams)

      setItems(data)
    } catch (err: any) {
      setItems([])
      setError(err?.response?.data?.message || "Gagal memuat data nilai akhlak")
    } finally {
      setIsLoading(false)
    }
  }, [aspek, nomorInduk, perPage, semester, selectedTahunAjaran, isTahunLoading])

  useEffect(() => {
    fetchNilaiAkhlak()
  }, [fetchNilaiAkhlak])

  const handleDelete = async (id: number) => {
    try {
      await nilaiAkhlakService.remove(id)
      await fetchNilaiAkhlak()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menghapus nilai akhlak")
    }
  }

  return (
    <div className="space-y-6">
      <NilaiAkhlakHeader
        onAdd={() => router.push("/dashboard/admin-panel/nilai-akhlak/new")}
        onRefresh={fetchNilaiAkhlak}
      />

      <NilaiAkhlakFilters
        nomorInduk={nomorInduk}
        onNomorIndukChange={setNomorInduk}
        semester={semester}
        onSemesterChange={setSemester}
        aspek={aspek}
        onAspekChange={setAspek}
        perPage={perPage}
        onPerPageChange={setPerPage}
        onApply={fetchNilaiAkhlak}
      />

      <NilaiAkhlakTable
        items={items}
        isLoading={isLoading || isTahunLoading}
        error={error}
        onDelete={handleDelete}
        onUpdate={fetchNilaiAkhlak}
      />
    </div>
  )
}
