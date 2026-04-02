"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { KkmForm } from "../../components/kkm-form"
import { KkmItem, kkmService } from "@/lib/services/kkm.service"

export default function KkmEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const [selected, setSelected] = useState<KkmItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setIsLoading(true)
        const data = await kkmService.getById(id)
        setSelected(data)
      } catch (error) {
        setSelected(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (!Number.isNaN(id)) {
      fetchDetail()
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Memuat data KKM...
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Data KKM tidak ditemukan
      </div>
    )
  }

  const handleSubmit = async (data: {
    kode_mapel: string
    tahun_ajaran: string
    semester: number
    nilai_kkm: number
    kode_unit?: string
    keterangan?: string
  }) => {
    try {
      await kkmService.update(id, data)
      router.push("/dashboard/admin-panel/kkm")
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit KKM Mapel</h1>
        <p className="text-muted-foreground">Ubah data KKM untuk ID #{id}</p>
      </div>

      <KkmForm
        isEdit
        initialData={{
          kode_mapel: selected.kode_mapel,
          tahun_ajaran: selected.tahun_ajaran,
          semester: selected.semester,
          nilai_kkm: selected.nilai_kkm,
          kode_unit: selected.kode_unit,
          keterangan: selected.keterangan,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  )
}
