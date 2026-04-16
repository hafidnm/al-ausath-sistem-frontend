"use client"

import { Card, CardContent } from "@/components/ui/card"
import { UserPlus, Clock3, CheckCircle2, XCircle } from "lucide-react"

interface PpdbStatsCardsProps {
  totalPendaftar: number
  totalMenunggu: number
  totalDiterima: number
  totalDitolak: number
}

export function PpdbStatsCards({
  totalPendaftar,
  totalMenunggu,
  totalDiterima,
  totalDitolak,
}: PpdbStatsCardsProps) {
  const stats = [
    {
      label: "Total Pendaftar",
      value: totalPendaftar,
      icon: UserPlus,
      colorBg: "bg-primary/10",
      colorIcon: "text-primary",
    },
    {
      label: "Menunggu",
      value: totalMenunggu,
      icon: Clock3,
      colorBg: "bg-chart-3/20",
      colorIcon: "text-chart-4",
    },
    {
      label: "Diterima",
      value: totalDiterima,
      icon: CheckCircle2,
      colorBg: "bg-primary/10",
      colorIcon: "text-primary",
    },
    {
      label: "Ditolak",
      value: totalDitolak,
      icon: XCircle,
      colorBg: "bg-destructive/10",
      colorIcon: "text-destructive",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.colorBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.colorIcon}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
