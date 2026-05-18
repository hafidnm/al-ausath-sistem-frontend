"use client"

import { NilaiMapelList } from "../nilai-mapel-list"

export default function NilaiMapelPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nilai Per Mata Pelajaran</h1>
        <p className="text-sm text-muted-foreground">Daftar nilai untuk setiap mata pelajaran yang Anda pelajari</p>
      </div>
      <NilaiMapelList tahunAjaran="2025/2026" semester={1} />
    </div>
  )
}
