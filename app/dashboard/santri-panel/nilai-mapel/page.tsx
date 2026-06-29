"use client"

import { NilaiMapelList } from "../../shared/nilai-mapel-list"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useSemester } from "@/contexts/semester-context"

export default function NilaiMapelPage() {
  const { selectedKodeTahun } = useTahunAjaran()
  const { semester } = useSemester()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nilai Per Mata Pelajaran</h1>
        <p className="text-sm text-muted-foreground">Daftar nilai untuk setiap mata pelajaran yang Anda pelajari</p>
      </div>
      <NilaiMapelList tahunAjaran={selectedKodeTahun || ""} semester={semester} />
    </div>
  )
}
