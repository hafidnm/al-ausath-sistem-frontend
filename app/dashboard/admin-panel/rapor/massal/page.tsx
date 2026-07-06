"use client"

import { useRouter } from "next/navigation"
import { RaporMassalForm } from "../components/rapor-massal-form"

export default function RaporMassalPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Input Rapor Massal</h1>
        <p className="text-muted-foreground">Generate rapor massal dan input nilai keseharian beserta catatan wali untuk satu kelas</p>
      </div>

      <RaporMassalForm
        onCancel={() => router.back()}
      />
    </div>
  )
}
