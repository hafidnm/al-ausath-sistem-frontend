"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { NilaiMapelFilters } from "./components/nilai-mapel-filters"
import { NilaiMapelHeader } from "./components/nilai-mapel-header"
import { NilaiMapelTable } from "./components/nilai-mapel-table"
import { NilaiMapelItem, nilaiMapelService } from "@/lib/services/nilai-mapel.service"

export default function NilaiMapelPage() {
  const router = useRouter()
  const [nomorInduk, setNomorInduk] = useState("")
  const [kodeMapel, setKodeMapel] = useState("")
  const [kodeKelas, setKodeKelas] = useState("")
  const [tahunAjaran, setTahunAjaran] = useState("all")
  const [semester, setSemester] = useState("all")
  const [perPage, setPerPage] = useState("10")
  const [items, setItems] = useState<NilaiMapelItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchNilaiMapel = useCallback(async () => {
    if (!nomorInduk.trim()) {
      setItems([])
      setError("Nomor induk wajib diisi untuk menampilkan nilai mapel")
      return
    }

    try {
      setIsLoading(true)
      setError("")

      const data = await nilaiMapelService.getAll({
        nomor_induk: nomorInduk.trim(),
        kode_mapel: kodeMapel.trim() || undefined,
        kode_kelas: kodeKelas.trim() || undefined,
        tahun_ajaran: tahunAjaran === "all" ? undefined : tahunAjaran,
        semester: semester === "all" ? undefined : semester,
        per_page: perPage,
      })

      setItems(data)
    } catch (err: any) {
      setItems([])
      setError(err?.response?.data?.message || "Gagal memuat data nilai mapel")
    } finally {
      setIsLoading(false)
    }
  }, [kodeKelas, kodeMapel, nomorInduk, perPage, semester, tahunAjaran])

  const handleDetail = (item: NilaiMapelItem) => {
    const query = new URLSearchParams({
      nomor_induk: item.nomor_induk,
    })

    if (item.tahun_ajaran) query.set("tahun_ajaran", item.tahun_ajaran)
    if (item.semester) query.set("semester", String(item.semester))

    router.push(`/dashboard/admin-panel/nilai-mapel/${encodeURIComponent(item.kode_mapel)}?${query.toString()}`)
  }

  const handleDelete = async (id: number) => {
    try {
      setError("")
      await nilaiMapelService.remove(id)
      await fetchNilaiMapel()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menghapus data nilai mapel")
    }
  }

  return (
    <div className="space-y-6">
      <NilaiMapelHeader
        onAdd={() => router.push("/dashboard/admin-panel/nilai-mapel/new")}
        onRefresh={fetchNilaiMapel}
      />

      <NilaiMapelFilters
        nomorInduk={nomorInduk}
        onNomorIndukChange={setNomorInduk}
        kodeMapel={kodeMapel}
        onKodeMapelChange={setKodeMapel}
        kodeKelas={kodeKelas}
        onKodeKelasChange={setKodeKelas}
        tahunAjaran={tahunAjaran}
        onTahunAjaranChange={setTahunAjaran}
        semester={semester}
        onSemesterChange={setSemester}
        perPage={perPage}
        onPerPageChange={setPerPage}
        onApply={fetchNilaiMapel}
      />

      <NilaiMapelTable
        items={items}
        isLoading={isLoading}
        error={error}
        onDetail={handleDetail}
        onDelete={handleDelete}
      />
    </div>
  )
}
