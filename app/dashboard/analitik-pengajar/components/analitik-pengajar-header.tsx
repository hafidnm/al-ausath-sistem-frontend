"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export function AnalitikPengajarHeader() {
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-r from-sidebar to-sidebar-accent text-sidebar-foreground">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-sidebar-foreground/70">
              <BarChart3 className="h-4 w-4" />
              Dashboard Analitik Pengajar
            </div>
            <h1 className="text-2xl font-bold">Analitik Nilai Kelas Anda</h1>
            <p className="mt-2 max-w-3xl text-sm text-sidebar-foreground/80">
              Pantau performa dan distribusi nilai di seluruh kelas yang Anda ajar. Lihat statistik rata-rata, breakdown per mapel, dan analisis distribusi nilai santri.
            </p>
          </div>
          <Badge className="w-fit border-0 bg-sidebar-primary/20 px-3 py-1 text-sidebar-primary-foreground">
            Scope: Analitik Guru Pengajar
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
