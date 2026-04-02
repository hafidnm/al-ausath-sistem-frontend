"use client"

import { useRouter } from "next/navigation"
import { KkmForm } from "../components/kkm-form"
import { kkmService } from "@/lib/services/kkm.service"

export default function KkmNewPage() {
  const router = useRouter()

  const handleSubmit = async (data: {
    kode_mapel: string
    tahun_ajaran: string
    semester: number
    nilai_kkm: number
    kode_unit?: string
    keterangan?: string
  }) => {
    try {
      await kkmService.create(data)
      router.push("/dashboard/admin-panel/kkm")
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tambah KKM Mapel</h1>
        <p className="text-muted-foreground">Buat data KKM baru untuk mapel dan semester tertentu</p>
      </div>

      <KkmForm onSubmit={handleSubmit} onCancel={() => router.back()} />
    </div>
  )
}
