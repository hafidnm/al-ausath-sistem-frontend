"use client"

import { useRouter } from "next/navigation"
import { BobotForm } from "../components/bobot-form"

export default function BobotNewPage() {
  const router = useRouter()

  const handleSubmit = async (data: { tugas: number; ulangan: number; ujianAkhir: number }) => {
    try {
      // Call POST /api/akademik/bobot
      console.log("Create bobot:", data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to list
      router.push("/dashboard/admin-panel/bobot")
    } catch (error) {
      console.error("Error creating bobot:", error)
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
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
