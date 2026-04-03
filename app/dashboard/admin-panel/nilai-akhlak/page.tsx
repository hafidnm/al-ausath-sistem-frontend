"use client"

import { useCallback, useState } from "react"
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
  const [perPage, setPerPage] = useState("10")
  const [items, setItems] = useState<NilaiAkhlakItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchNilaiAkhlak = useCallback(async () => {
    if (!nomorInduk.trim()) {
      setItems([])
      setError("Nomor induk wajib diisi untuk menampilkan data")
      return
    }

    try {
      setIsLoading(true)
      setError("")

      const data = await nilaiAkhlakService.getAll({
        nomor_induk: nomorInduk.trim(),
        tahun_ajaran: tahunAjaran === "all" ? undefined : tahunAjaran,
        semester: semester === "all" ? undefined : semester,
        per_page: perPage,
      })

      setItems(data)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memuat data nilai akhlak")
    } finally {
      setIsLoading(false)
    }
  }, [nomorInduk, perPage, semester, tahunAjaran])

  return (
    <div className="space-y-6">
      <NilaiAkhlakHeader
        onAdd={() => {
          const base = "/dashboard/admin-panel/nilai-akhlak/new"
          if (!nomorInduk.trim()) {
            router.push(base)
            return
          }

          router.push(`${base}?nomor_induk=${encodeURIComponent(nomorInduk.trim())}`)
        }}
        onRefresh={fetchNilaiAkhlak}
      />

      <NilaiAkhlakFilters
        nomorInduk={nomorInduk}
        onNomorIndukChange={setNomorInduk}
        tahunAjaran={tahunAjaran}
        onTahunAjaranChange={setTahunAjaran}
        semester={semester}
        onSemesterChange={setSemester}
        perPage={perPage}
        onPerPageChange={setPerPage}
        onApply={fetchNilaiAkhlak}
      />

      <NilaiAkhlakTable items={items} isLoading={isLoading} error={error} />
    </div>
  )
}
