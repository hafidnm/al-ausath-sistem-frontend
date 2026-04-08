"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  Users,
  GraduationCap,
  Clock,
  CheckCircle,
} from "lucide-react"
import { overviewStats } from "../utils/constants"

export function OverviewStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Santri Hadir</p>
              <p className="text-2xl font-bold text-primary mt-1">{overviewStats.santriHadir}</p>
              <p className="text-xs text-muted-foreground">{overviewStats.santriTidakHadir} tidak hadir</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Guru Hadir</p>
              <p className="text-2xl font-bold text-accent mt-1">{overviewStats.guruHadir}</p>
              <p className="text-xs text-muted-foreground">{overviewStats.guruTidakHadir} tidak hadir</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-accent" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 border-l-4 border-l-secondary">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Menunggu Validasi</p>
              <p className="text-2xl font-bold text-secondary-foreground mt-1">{overviewStats.pendingValidasi}</p>
              <p className="text-xs text-muted-foreground">perlu ditinjau</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Clock className="w-6 h-6 text-secondary-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Validasi Hari Ini</p>
              <p className="text-2xl font-bold text-chart-4 mt-1">{overviewStats.validasiHariIni}</p>
              <p className="text-xs text-muted-foreground">telah diproses</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-chart-3/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-chart-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
