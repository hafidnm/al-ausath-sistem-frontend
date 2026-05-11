"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { BobotNilaiItem, bobotNilaiService } from "@/lib/services/bobot-nilai.service"
import { BobotForm } from "../../components/bobot-form"
import type { BobotFormValues } from "../../components/bobot-form"

export default function BobotEditPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = Number(Array.isArray(params.id) ? params.id[0] : params.id)
  const [item, setItem] = useState<BobotNilaiItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBobot = async () => {
      if (!Number.isFinite(id) || id <= 0) {
        setError("ID bobot tidak valid")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const data = await bobotNilaiService.getById(id)
        setItem(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal memuat data bobot"
        setError(message)
        toast({
          title: "Gagal memuat bobot",
          description: message,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void loadBobot()
  }, [id, toast])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Memuat data bobot...</p>
      </div>
    )
  }

  if (!item || error) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-muted-foreground">{error || "Bobot nilai tidak ditemukan"}</p>
        <Button variant="outline" className="bg-transparent" onClick={() => router.push("/dashboard/admin-panel/bobot")}>
          Kembali ke daftar
        </Button>
      </div>
    )
  }

  const initialData: BobotFormValues = {
    tahunAjaran: item.tahun_ajaran,
    semester: item.semester,
    bobotHarian: item.bobot_harian,
    bobotUts: item.bobot_uts,
    bobotUas: item.bobot_uas,
  }

  const handleSubmit = async (data: BobotFormValues) => {
    try {
      setIsSubmitting(true)
      await bobotNilaiService.update(id, {
        tahun_ajaran: data.tahunAjaran,
        semester: data.semester,
        bobot_harian: data.bobotHarian,
        bobot_uts: data.bobotUts,
        bobot_uas: data.bobotUas,
      })
      toast({
        title: "Bobot berhasil diperbarui",
        description: "Perubahan bobot sudah disimpan ke database.",
      })
      router.push("/dashboard/admin-panel/bobot")
    } catch (error) {
      toast({
        title: "Gagal memperbarui bobot",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat memperbarui data bobot",
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
        <h1 className="text-2xl font-bold text-foreground">Edit Bobot Nilai</h1>
        <p className="text-muted-foreground">Ubah konfigurasi bobot penilaian ID #{id}</p>
      </div>

      <BobotForm
        isEdit
        isSubmitting={isSubmitting}
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
