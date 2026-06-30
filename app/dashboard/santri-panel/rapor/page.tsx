"use client"

import { FileText } from "lucide-react"
import { RaportDisplay } from "../raport-display"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useSemester } from "@/contexts/semester-context"

export default function SantriRaportPage() {
  const { selectedTahunAjaran } = useTahunAjaran()
  const { semester } = useSemester()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Raport Digital
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lihat dan unduh raport digital Anda ketika sudah diterbitkan
        </p>
      </div>

      {/* Raport Display */}
      <RaportDisplay tahunAjaran={selectedTahunAjaran?.nama_tahun || ""} semester={semester} />
    </div>
  )
}
