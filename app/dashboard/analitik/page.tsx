"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  LineChart,
  TrendingUp,
  Users,
} from "lucide-react"

const highlights = [
  {
    label: "Rata-rata Kelas Tertinggi",
    value: "91,4",
    description: "Kelas 12 IPA - Semester Ganjil",
    icon: Award,
  },
  {
    label: "Santri Perlu Bimbingan",
    value: "8",
    description: "Nilai di bawah KKM atau tren menurun",
    icon: Brain,
  },
  {
    label: "Santri Berprestasi",
    value: "14",
    description: "Rata-rata nilai konsisten di atas 90",
    icon: Users,
  },
  {
    label: "Mapel Dengan Kenaikan",
    value: "5",
    description: "Perbandingan antar semester menunjukkan tren naik",
    icon: TrendingUp,
  },
]

const semesterTrend = [
  { semester: "Ganjil 2024/2025", nilai: 84 },
  { semester: "Genap 2024/2025", nilai: 87 },
  { semester: "Ganjil 2025/2026", nilai: 89 },
]

const focusAreas = [
  "Pantau perkembangan nilai per semester untuk tiap kelas.",
  "Identifikasi santri dengan peningkatan konsisten atau penurunan tajam.",
  "Gunakan hasil analitik sebagai dasar pembinaan dan tindak lanjut wali kelas.",
]

export default function AnalitikPage() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-linear-to-r from-sidebar to-sidebar-accent text-sidebar-foreground">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-sidebar-foreground/70">
                <LineChart className="h-4 w-4" />
                Dashboard Analitik
              </div>
              <h1 className="text-2xl font-bold">Ringkasan Perkembangan Nilai</h1>
              <p className="mt-2 max-w-2xl text-sm text-sidebar-foreground/80">
                Halaman dummy ini disiapkan sebagai titik awal analitik nilai, grafik tren semester,
                dan deteksi santri berprestasi atau yang perlu bimbingan.
              </p>
            </div>
            <Badge className="w-fit bg-sidebar-primary/20 text-sidebar-primary-foreground border-0 px-3 py-1">
              Draft UI
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map((item) => (
          <Card key={item.label} className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <LineChart className="h-5 w-5 text-primary" />
              Tren Nilai Per Semester
            </CardTitle>
            <CardDescription>Contoh visual sederhana untuk melihat arah perkembangan nilai.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-5">
              {semesterTrend.map((item) => (
                <div key={item.semester} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.semester}</span>
                    <span className="text-muted-foreground">{item.nilai}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-linear-to-r from-primary to-accent"
                      style={{ width: `${item.nilai}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="rounded-full border border-border/60 px-3 py-1">Naik 5 poin vs semester sebelumnya</div>
              <div className="rounded-full border border-border/60 px-3 py-1">Data contoh, belum terhubung backend</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-foreground">
              <BookOpen className="h-5 w-5 text-primary" />
              Area Fokus
            </CardTitle>
            <CardDescription>Output analitik yang nantinya bisa dikembangkan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {focusAreas.map((item) => (
              <div key={item} className="rounded-xl border border-border/60 bg-background p-4 text-sm text-foreground">
                {item}
              </div>
            ))}

            <Button className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Lihat Detail Analitik
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}