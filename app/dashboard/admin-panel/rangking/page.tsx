"use client"

import Link from "next/link"
import { ArrowLeft, Crown, Medal, Sparkles, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const rankingData = [
  { rank: 1, nama: "Ahmad Fauzi", nomorInduk: "2025001", kelas: "MA-10A", poin: 98.75, status: "Teratas" },
  { rank: 2, nama: "Siti Rahmah", nomorInduk: "2025007", kelas: "MA-10B", poin: 97.2, status: "Stabil" },
  { rank: 3, nama: "Muhammad Iqbal", nomorInduk: "2025012", kelas: "MA-10A", poin: 96.55, status: "Naik" },
  { rank: 4, nama: "Nadia Putri", nomorInduk: "2025004", kelas: "MA-10C", poin: 95.8, status: "Naik" },
  { rank: 5, nama: "Rizky Ramadhan", nomorInduk: "2025010", kelas: "MA-10B", poin: 95.1, status: "Turun" },
]

const summaryCards = [
  { label: "Santri Masuk Ranking", value: "128", icon: <Trophy className="h-5 w-5" /> },
  { label: "Rata-rata Nilai", value: "94.8", icon: <Sparkles className="h-5 w-5" /> },
  { label: "Kelas Terbaik", value: "MA-10A", icon: <Medal className="h-5 w-5" /> },
  { label: "Juara Bertahan", value: "3 Bulan", icon: <Crown className="h-5 w-5" /> },
]

export default function RangkingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/admin-panel" className="inline-flex items-center gap-2 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Panel Admin
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Rangking Santri</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Halaman dummy frontend untuk preview ranking santri berdasarkan total poin nilai dan performa kelas.
          </p>
        </div>

        <Button className="gap-2 self-start">
          <Trophy className="h-4 w-4" />
          Generate Ranking
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Card key={item.label} className="border-border/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">{item.icon}</div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold text-foreground">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Leaderboard Mingguan</CardTitle>
            <CardDescription>Urutan sementara berdasarkan dummy data frontend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rankingData.map((item) => (
              <div
                key={item.rank}
                className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {item.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{item.nama}</h3>
                      {item.rank <= 3 && <Badge variant="secondary">Top {item.rank}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.nomorInduk} • {item.kelas}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 md:text-right">
                  <div>
                    <p className="text-sm text-muted-foreground">Poin</p>
                    <p className="text-xl font-bold text-foreground">{item.poin}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-border/60 bg-background/60 text-foreground"
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Catatan Dummy</CardTitle>
            <CardDescription>Komponen placeholder untuk FE ranking yang bisa dihubungkan ke backend nanti</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4">
              Filter, sorting, dan export PDF akan ditambahkan saat endpoint backend siap.
            </div>
            <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4">
              Saat ini data ditampilkan dari array dummy agar layout, spacing, dan alur navigasi bisa divalidasi lebih dulu.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}