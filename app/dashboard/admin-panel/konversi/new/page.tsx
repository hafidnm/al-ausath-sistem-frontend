"use client"

import { useRouter } from "next/navigation"
import { KonversiForm } from "../components/konversi-form"
import { konversiService } from "@/lib/services/konversi.service"

export default function KonversiNewPage() {
  const router = useRouter()

  const handleSubmit = async (data: {
    nilai_min: number
    nilai_max: number
    nilai_huruf: string
    predikat: string
    kode_unit?: string
    keterangan?: string
    is_active?: boolean
  }) => {
    await konversiService.create(data)
    router.push("/dashboard/admin-panel/konversi")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tambah Konversi Nilai</h1>
        <p className="text-muted-foreground">Buat aturan konversi nilai numerik ke huruf dan predikat</p>
      </div>

      <KonversiForm onSubmit={handleSubmit} onCancel={() => router.back()} />
    </div>
  )
}
