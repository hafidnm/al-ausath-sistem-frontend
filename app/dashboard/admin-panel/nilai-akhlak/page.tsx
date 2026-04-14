"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NilaiAkhlakFilters } from "./components/nilai-akhlak-filters"
import { NilaiAkhlakHeader } from "./components/nilai-akhlak-header"
import { NilaiAkhlakTable } from "./components/nilai-akhlak-table"
import { NilaiAkhlakItem, nilaiAkhlakService } from "@/lib/services/nilai-akhlak.service"

export default function NilaiAkhlakPage() {
  const router = useRouter()
  const [nomorInduk, setNomorInduk] = useState("")
  const [tahunAjaran, setTahunAjaran] = useState("all")
  const [semester, setSemester] = useState("all")
  const [aspek, setAspek] = useState("all")
  const [perPage, setPerPage] = useState("10")
  const [items, setItems] = useState<NilaiAkhlakItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchNilaiAkhlak = useCallback(async () => {
    try {
      setIsLoading(true)
      setError("")

      const sharedParams = {
        tahun_ajaran: tahunAjaran === "all" ? undefined : tahunAjaran,
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
  }, [aspek, nomorInduk, perPage, semester, tahunAjaran])

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
        tahunAjaran={tahunAjaran}
        onTahunAjaranChange={setTahunAjaran}
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
        isLoading={isLoading}
        error={error}
        onDelete={handleDelete}
      />
    </div>
  )
}
