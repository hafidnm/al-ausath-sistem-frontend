"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, BadgeCheck, CheckCircle2, Loader2, Megaphone, Receipt, Users, Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { administrasiService, type AdministrasiDashboardData } from "@/lib/services/administrasi.service"
import type { ComponentType } from "react"

type ModuleCard = {
  title: string
  href: string
  description: string
  icon: ComponentType<{ className?: string }>
  accent: string
  primaryLabel: string
  primaryValue: number
  details: Array<{ label: string; value: number }>
}

const formatNumber = (value: number): string => new Intl.NumberFormat("id-ID").format(value)

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value)

const flowBadgeClasses: Record<AdministrasiDashboardData['flow'][number]['status'], string> = {
  waiting: "bg-muted text-muted-foreground border-0",
  active: "bg-chart-3/20 text-chart-4 border-0",
  done: "bg-primary/10 text-primary border-0",
}

export default function AdministrasiPage() {
  const [data, setData] = useState<AdministrasiDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const dashboard = await administrasiService.getDashboard()
        if (!cancelled) {
          setData(dashboard)
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Gagal memuat dashboard administrasi"
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const moduleCards = useMemo<ModuleCard[]>(() => {
    if (!data) return []

    return [
      {
        title: "PPDB",
        href: "/dashboard/ppdb",
        description: "Verifikasi pendaftar, berkas, tes, dan alur integrasi santri.",
        icon: Users,
        accent: "bg-primary/10 text-primary",
        primaryLabel: "Pendaftar",
        primaryValue: data.ppdb.total_pendaftar,
        details: [
          { label: "Menunggu", value: data.ppdb.menunggu_verifikasi },
          { label: "Perlu integrasi", value: data.ppdb.perlu_integrasi_santri },
        ],
      },
      {
        title: "SPP",
        href: "/dashboard/spp",
        description: "Kelola golongan, setting tagihan, dan nominal pembayaran santri.",
        icon: Wallet,
        accent: "bg-accent/20 text-accent",
        primaryLabel: "Setting aktif",
        primaryValue: data.spp.total_setting,
        details: [
          { label: "Golongan", value: data.spp.total_golongan },
          { label: "Santri aktif", value: data.spp.total_santri },
        ],
      },
      {
        title: "Pengumuman",
        href: "/dashboard/pengumuman",
        description: "Atur info PPDB, akademik, dan pengumuman umum yang tampil di landing.",
        icon: Megaphone,
        accent: "bg-chart-3/20 text-chart-4",
        primaryLabel: "Aktif",
        primaryValue: data.pengumuman.aktif,
        details: [
          { label: "Pin", value: data.pengumuman.pinned },
          { label: "Berakhir 7 hari", value: data.pengumuman.akan_berakhir },
        ],
      },
      {
        title: "Pembayaran",
        href: "/dashboard/pembayaran",
        description: "Rekap gabungan transaksi PPDB dan SPP dalam satu tampilan.",
        icon: Receipt,
        accent: "bg-chart-2/20 text-chart-2",
        primaryLabel: "Transaksi",
        primaryValue: data.pembayaran.total,
        details: [
          { label: "PPDB", value: data.pembayaran.ppdb },
          { label: "SPP", value: data.pembayaran.spp },
        ],
      },
    ]
  }, [data])

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-card to-accent/10 shadow-sm">
        <CardContent className="relative p-6 lg:p-8">
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.55),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.4),transparent_28%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge className="w-fit bg-background/80 text-foreground border-border/50">Dashboard Administrasi</Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Alur terpadu PPDB, SPP, Pengumuman, dan Pembayaran
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Satu pintu untuk memantau pendaftar baru sampai menjadi santri aktif, lalu mengelola tagihan dan rekap pembayaran tanpa berpindah alur yang membingungkan.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <Link href="/dashboard/ppdb">
                  Buka PPDB
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 bg-background/70">
                <Link href="/dashboard/pembayaran">
                  Rekap Pembayaran
                  <BadgeCheck className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Memuat ringkasan administrasi...
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {moduleCards.map((module) => {
              const Icon = module.icon

              return (
                <Card key={module.title} className="border-border/60 shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`rounded-xl p-3 ${module.accent}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                        <Link href={module.href}>
                          Buka
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-foreground">{module.title}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{module.primaryLabel}</p>
                      <p className="text-3xl font-bold text-foreground">{formatNumber(module.primaryValue)}</p>
                    </div>
                    <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2">
                      {module.details.map((detail) => (
                        <div key={detail.label}>
                          <p className="text-xs text-muted-foreground">{detail.label}</p>
                          <p className="text-lg font-semibold text-foreground">{formatNumber(detail.value)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Alur Terpadu PPDB</CardTitle>
                <CardDescription>
                  Urutan ini mengikuti activity diagram Anda: registrasi sampai santri aktif dan pembayaran berjalan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {data.flow.map((step, index) => (
                    <div key={step.key} className="rounded-xl border border-border/60 bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Langkah {index + 1}</p>
                          <h3 className="font-semibold text-foreground">{step.label}</h3>
                        </div>
                        <Badge className={flowBadgeClasses[step.status]}>
                          {step.status === "waiting" ? "Menunggu" : step.status === "active" ? "Berjalan" : "Selesai"}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                      <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">Jumlah terkait</span>
                        <span className="font-semibold text-foreground">{formatNumber(step.count)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Aksi Cepat</CardTitle>
                  <CardDescription>Masuk ke modul yang paling sering dipakai tanpa mencari menu lagi.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.quick_actions.map((action) => (
                    <Button key={action.href} asChild variant="outline" className="h-auto w-full justify-start whitespace-normal bg-background p-4 text-left">
                      <Link href={action.href}>
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-primary/10 p-2 text-primary">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{action.label}</p>
                            <p className="text-xs leading-5 text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardHeader>
                  <CardTitle>Saran UX</CardTitle>
                  <CardDescription>Fitur kecil yang biasanya paling membantu petugas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3 rounded-lg bg-muted/20 p-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <p>Tampilkan status warna konsisten: menunggu, aktif, selesai, dan ditolak agar petugas cepat membaca prioritas.</p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/20 p-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <p>Gunakan satu halaman rekap pembayaran untuk PPDB dan SPP supaya audit transaksi tidak berpindah halaman.</p>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-muted/20 p-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <p>Tambahkan tombol aksi cepat ke verifikasi PPDB dan pembuatan tagihan PPDB setelah pendaftar diterima.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>PPDB siap integrasi</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{formatNumber(data.ppdb.perlu_integrasi_santri)}</p>
                <p className="text-xs text-muted-foreground">Pendaftar diterima yang belum masuk ke data santri.</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Tagihan PPDB</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{formatNumber(data.pembayaran.ppdb)}</p>
                <p className="text-xs text-muted-foreground">Transaksi PPDB yang sudah masuk rekap pembayaran.</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Pembayaran terverifikasi</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{formatNumber(data.pembayaran.terverifikasi)}</p>
                <p className="text-xs text-muted-foreground">Total transaksi yang sudah valid dan bisa diterbitkan kwitansi.</p>
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Nominal terverifikasi</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(data.pembayaran.nominal_terverifikasi)}</p>
                <p className="text-xs text-muted-foreground">Akumulasi nominal yang telah lolos verifikasi.</p>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}