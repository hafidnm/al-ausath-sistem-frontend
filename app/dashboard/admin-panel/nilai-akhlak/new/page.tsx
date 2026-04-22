"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { NilaiAkhlakForm } from "../components/nilai-akhlak-form"
import { nilaiAkhlakService } from "@/lib/services/nilai-akhlak.service"

export default function NilaiAkhlakNewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const nomorInduk = searchParams.get("nomor_induk") || ""

  const handleSubmit = async (data: {
    nomor_induk: string
    tahun_ajaran: string
    semester: number
    nilai_angka: number
    aspek?: string
    deskripsi?: string
    id_petugas_input?: number
  }) => {
    await nilaiAkhlakService.upsert(data)
    router.push("/dashboard/admin-panel/nilai-akhlak")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Input Nilai Akhlak</h1>
        <p className="text-muted-foreground">Masukkan nilai akhlak santri dengan format angka sederhana</p>
      </div>

      <NilaiAkhlakForm
        initialData={{ nomor_induk: nomorInduk, aspek: "AKHLAK" }}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  )
}
