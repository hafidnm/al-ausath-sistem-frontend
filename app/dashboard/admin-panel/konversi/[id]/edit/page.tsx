"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { KonversiForm } from "../../components/konversi-form"
import { KonversiItem, konversiService } from "@/lib/services/konversi.service"

export default function KonversiEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const [selected, setSelected] = useState<KonversiItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setIsLoading(true)
        const data = await konversiService.getById(id)
        setSelected(data)
      } catch {
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
        Memuat data konversi...
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Data konversi tidak ditemukan
      </div>
    )
  }

  const handleSubmit = async (data: {
    nilai_min: number
    nilai_max: number
    nilai_huruf: string
    predikat: string
    kode_unit?: string
    keterangan?: string
    is_active?: boolean
  }) => {
    await konversiService.update(id, data)
    router.push("/dashboard/admin-panel/konversi")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Konversi Nilai</h1>
        <p className="text-muted-foreground">Ubah data konversi untuk ID #{id}</p>
      </div>

      <KonversiForm
        isEdit
        initialData={{
          nilai_min: selected.nilai_min,
          nilai_max: selected.nilai_max,
          nilai_huruf: selected.nilai_huruf,
          predikat: selected.predikat,
          kode_unit: selected.kode_unit,
          keterangan: selected.keterangan,
          is_active: selected.is_active,
        }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  )
}
