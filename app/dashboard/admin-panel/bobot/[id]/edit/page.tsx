"use client"

import { useRouter, useParams } from "next/navigation"
import { BobotForm } from "../../components/bobot-form"
import { sampleBobotData } from "../../utils/constants"

export default function BobotEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  // Find bobot data
  const bobot = sampleBobotData.find(b => b.id === id)

  if (!bobot) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Bobot nilai tidak ditemukan</p>
      </div>
    )
  }

  const handleSubmit = async (data: { tugas: number; ulangan: number; ujianAkhir: number }) => {
    try {
      // Call PUT /api/akademik/bobot/{id}
      console.log("Update bobot:", id, data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to list
      router.push("/dashboard/admin-panel/bobot")
    } catch (error) {
      console.error("Error updating bobot:", error)
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
        initialData={bobot}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  )
}
