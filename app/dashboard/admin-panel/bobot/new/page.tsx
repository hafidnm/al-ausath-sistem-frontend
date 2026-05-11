"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { bobotNilaiService } from "@/lib/services/bobot-nilai.service"
import { BobotForm, type BobotFormValues } from "../components/bobot-form"

export default function BobotNewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: BobotFormValues) => {
    try {
      setIsSubmitting(true)
      await bobotNilaiService.create({
        tahun_ajaran: data.tahunAjaran,
        semester: data.semester,
        bobot_harian: data.bobotHarian,
        bobot_uts: data.bobotUts,
        bobot_uas: data.bobotUas,
      })
      toast({
        title: "Bobot berhasil dibuat",
        description: "Data bobot baru sudah disimpan ke database.",
      })
      router.push("/dashboard/admin-panel/bobot")
    } catch (error) {
      toast({
        title: "Gagal membuat bobot",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan data bobot",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tambah Bobot Nilai</h1>
        <p className="text-muted-foreground">Buat konfigurasi bobot penilaian baru</p>
      </div>

      <BobotForm
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
