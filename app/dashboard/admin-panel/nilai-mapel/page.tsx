"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { NilaiMapelFilters } from "./components/nilai-mapel-filters"
import { NilaiMapelHeader } from "./components/nilai-mapel-header"
import { NilaiMapelTable } from "./components/nilai-mapel-table"
import { NilaiMapelEditDialog } from "./components/nilai-mapel-edit-dialog"
import { NilaiMapelItem, nilaiMapelService, UpsertNilaiMapelPayload } from "@/lib/services/nilai-mapel.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"

export default function NilaiMapelPage() {
  const router = useRouter()
  const { selectedTahunAjaran, isLoading: isTahunLoading } = useTahunAjaran()

  const [nomorInduk, setNomorInduk] = useState("")
  const [kodeMapel, setKodeMapel] = useState("all")
  const [kodeKelas, setKodeKelas] = useState("all")
  const [semester, setSemester] = useState("all")
  const [perPage, setPerPage] = useState("10")
  const [items, setItems] = useState<NilaiMapelItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [editItem, setEditItem] = useState<NilaiMapelItem | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isEditLoading, setIsEditLoading] = useState(false)

  const fetchNilaiMapel = useCallback(async () => {
    if (isTahunLoading) return
    if (!nomorInduk.trim()) {
      setItems([])
      setError("Nomor induk wajib diisi untuk menampilkan nilai mapel")
      return
    }

    try {
      setIsLoading(true)
      setError("")

      const tahunAjaran = selectedTahunAjaran?.nama_tahun || undefined

      const data = await nilaiMapelService.getAll({
        nomor_induk: nomorInduk.trim(),
        kode_mapel: kodeMapel === "all" ? undefined : kodeMapel.trim(),
        kode_kelas: kodeKelas === "all" ? undefined : kodeKelas.trim(),
        tahun_ajaran: tahunAjaran,
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
  }, [kodeKelas, kodeMapel, nomorInduk, perPage, semester, selectedTahunAjaran, isTahunLoading])

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

  const handleEdit = async (item: NilaiMapelItem) => {
    try {
      setError("")
      setIsEditLoading(true)
      // Fetch detail item untuk memastikan data tugas dan ulangan lengkap
      const detailItem = await nilaiMapelService.getByKodeMapel(item.kode_mapel, {
        nomor_induk: item.nomor_induk,
        tahun_ajaran: item.tahun_ajaran,
        semester: String(item.semester),
      })
      setEditItem(detailItem)
      setIsEditOpen(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memuat detail nilai mapel untuk edit")
    } finally {
      setIsEditLoading(false)
    }
  }

  const handleEditSubmit = async (payload: UpsertNilaiMapelPayload) => {
    if (!editItem) return

    try {
      setError("")
      await nilaiMapelService.update(editItem.id, payload)
      await fetchNilaiMapel()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal memperbarui nilai mapel")
      throw err
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
        semester={semester}
        onSemesterChange={setSemester}
        perPage={perPage}
        onPerPageChange={setPerPage}
        onApply={fetchNilaiMapel}
      />

      <NilaiMapelTable
        items={items}
        isLoading={isLoading || isTahunLoading}
        error={error}
        onDetail={handleDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <NilaiMapelEditDialog
        item={editItem}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSubmit={handleEditSubmit}
        isLoading={isEditLoading}
      />
    </div>
  )
}
