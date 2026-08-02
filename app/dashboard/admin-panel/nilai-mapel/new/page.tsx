"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { NilaiMapelForm } from "../components/nilai-mapel-form"
import { nilaiMapelService } from "@/lib/services/nilai-mapel.service"

export default function NilaiMapelNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const nomorInduk = searchParams.get("nomor_induk") || ""

  const handleSubmit = async (data: Parameters<typeof nilaiMapelService.upsert>[0]) => {
    await nilaiMapelService.upsert(data)
    router.push(`/dashboard/admin-panel/nilai-mapel?nomor_induk=${encodeURIComponent(data.nomor_induk)}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Input Nilai Mapel</h1>
        <p className="text-muted-foreground">Simpan komponen tugas, ulangan, dan ujian akhir per mapel</p>
      </div>

      <NilaiMapelForm />
    </div>
  )
}
