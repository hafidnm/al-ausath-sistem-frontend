"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, Bell, Calendar, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { pengumumanService, type Pengumuman } from "@/lib/services/pengumuman.service"

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateString
  }
}

const getCategoryBadgeColor = (kategori: string) => {
  switch (kategori?.toLowerCase()) {
    case "ppdb":
      return "bg-blue-100 text-blue-800 border-blue-300"
    case "akademik":
      return "bg-purple-100 text-purple-800 border-purple-300"
    case "kegiatan":
      return "bg-green-100 text-green-800 border-green-300"
    case "umum":
      return "bg-gray-100 text-gray-800 border-gray-300"
    default:
      return "bg-gray-100 text-gray-800 border-gray-300"
  }
}

export default function PengumumanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id

  const [pengumuman, setPengumuman] = useState<Pengumuman | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPengumuman = async () => {
      if (!idParam) return

      setLoading(true)
      setError(null)

      try {
        const result = await pengumumanService.getPublicDetail(Number(idParam))
        if (result) {
          setPengumuman(result)
        } else {
          setError("Pengumuman tidak ditemukan")
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal memuat pengumuman"
        setError(msg)
        toast({
          title: "Error",
          description: msg,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    void fetchPengumuman()
  }, [idParam, toast])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat pengumuman...
        </span>
      </div>
    )
  }

  if (error || !pengumuman) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </Link>
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error || "Pengumuman tidak ditemukan"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Check if announcement is still active
  const now = new Date()
  const isExpired = pengumuman.tanggal_selesai
    ? new Date(pengumuman.tanggal_selesai) < now
    : false
  const isActive = pengumuman.is_aktif && !isExpired

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Pengumuman</h1>
              </div>
            </Link>
            <Link href="/">
              <Button variant="outline">Kembali ke Beranda</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Status Warning */}
          {!isActive && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Pengumuman ini sudah tidak aktif atau sudah melewati tanggal berakhir.
              </p>
            </div>
          )}

          {/* Article Card */}
          <Card className="mb-6">
            <CardHeader className="space-y-4 pb-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <h1 className="text-4xl font-bold text-foreground leading-tight">
                      {pengumuman.judul}
                    </h1>
                  </div>
                  <Badge
                    className={`whitespace-nowrap ${getCategoryBadgeColor(
                      pengumuman.kategori
                    )}`}
                  >
                    {pengumuman.kategori}
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <time dateTime={pengumuman.created_at}>
                      {formatDate(pengumuman.created_at)}
                    </time>
                  </div>

                  {pengumuman.tanggal_selesai && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex items-center gap-2">
                        <span>Berakhir:</span>
                        <time dateTime={pengumuman.tanggal_selesai}>
                          {formatDate(pengumuman.tanggal_selesai)}
                        </time>
                      </div>
                    </>
                  )}

                  {pengumuman.is_pinned && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <Badge variant="secondary" className="w-fit">
                        📌 Dipinkan
                      </Badge>
                    </>
                  )}
                </div>

                {pengumuman.lampiran_url && (
                  <div className="pt-1">
                    <a
                      href={pengumuman.lampiran_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Paperclip className="w-4 h-4" />
                      {pengumuman.lampiran_nama_asli || "Lihat Lampiran"}
                    </a>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                {pengumuman.konten}
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="flex gap-3">
            <Link href="/#announcement" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar Pengumuman
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
