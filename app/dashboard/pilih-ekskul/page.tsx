"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ekskulService, EkskulApiItem, PendaftaranApiItem } from "@/lib/services/ekskul.service"
import { CheckCircle2, Users, Lock, Trophy, Star, AlertTriangle } from "lucide-react"

export default function PilihEkskulPage() {
  const { toast } = useToast()
  const initCalledRef = useRef(false)

  const [ekskulList, setEkskulList] = useState<EkskulApiItem[]>([])
  const [pilihanSaya, setPilihanSaya] = useState<PendaftaranApiItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  // Inline confirmation state — true = tampilkan tombol konfirmasi di banner
  const [isKonfirmasi, setIsKonfirmasi] = useState(false)

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [ekskulRes, pilihanRes] = await Promise.all([
        ekskulService.getAll({ all: true, status: "AKTIF" }),
        ekskulService.getPilihanSaya(),
      ])
      setEkskulList(ekskulRes.data ?? ekskulRes)
      setPilihanSaya(pilihanRes.data ?? null)
    } catch {
      toast({ title: "Gagal memuat data ekskul", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (initCalledRef.current) return
    initCalledRef.current = true
    void fetchAll()
  }, [])

  const handleDaftar = async (ekskul: EkskulApiItem) => {
    setLoadingId(ekskul.id_ekskul)
    try {
      await ekskulService.daftar(ekskul.id_ekskul)
      toast({ title: `Berhasil mendaftar ke ${ekskul.nama_ekskul}!` })
      await fetchAll()
    } catch (e: any) {
      toast({
        title: "Gagal mendaftar",
        description: e?.response?.data?.message ?? "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setLoadingId(null)
    }
  }

  const handleBatalKonfirmasi = async () => {
    setIsKonfirmasi(false)
    setLoadingId(-1)
    try {
      await ekskulService.batal()
      toast({ title: "Pilihan ekskul berhasil dibatalkan" })
      await fetchAll()
    } catch (e: any) {
      toast({
        title: "Gagal membatalkan",
        description: e?.response?.data?.message ?? "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setLoadingId(null)
    }
  }

  const sudahDaftar = (id: number) => pilihanSaya?.id_ekskul === id

  const getKuotaInfo = (ekskul: EkskulApiItem) => {
    if (ekskul.kuota == null) return null
    const sisa = ekskul.kuota - (ekskul.jumlah_pendaftar ?? 0)
    return { total: ekskul.kuota, sisa: Math.max(0, sisa), penuh: sisa <= 0 }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pilih Ekstrakurikuler</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pilih satu ekskul yang ingin kamu ikuti. Kamu hanya dapat memilih 1 ekskul.
        </p>
      </div>

      {/* Banner: Ekskul Aktif */}
      {isLoading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : pilihanSaya ? (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 p-5 text-white shadow-lg">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
            <Trophy className="w-24 h-24" />
          </div>

          {/* Info ekskul + tombol */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-white/20 rounded-full p-2.5 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80">Ekskul pilihanmu saat ini</p>
              <p className="text-xl font-bold truncate">{pilihanSaya.ekskul?.nama_ekskul}</p>
              {pilihanSaya.ekskul?.deskripsi && (
                <p className="text-sm text-white/70 mt-0.5 line-clamp-1">{pilihanSaya.ekskul.deskripsi}</p>
              )}
            </div>
            {!isKonfirmasi && pilihanSaya.ekskul?.status_pendaftaran === "BUKA" && (
              <button
                type="button"
                disabled={loadingId === -1}
                onClick={() => setIsKonfirmasi(true)}
                className="shrink-0 text-xs bg-white/20 hover:bg-white/30 active:bg-white/40 text-white border border-white/30 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingId === -1 ? "Membatalkan..." : "Batalkan Pilihan"}
              </button>
            )}
          </div>

          {/* Konfirmasi inline — hanya tampil kalau pendaftaran masih BUKA */}
          {isKonfirmasi && pilihanSaya.ekskul?.status_pendaftaran === "BUKA" && (
            <div className="mt-3 relative z-10 flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/20">
              <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-200" />
              <p className="text-sm text-white flex-1">
                Yakin ingin membatalkan pilihan ekskul <strong>{pilihanSaya.ekskul?.nama_ekskul}</strong>?
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsKonfirmasi(false)}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white border border-white/20 rounded-md px-3 py-1.5 transition-colors"
                >
                  Tidak
                </button>
                <button
                  type="button"
                  onClick={handleBatalKonfirmasi}
                  className="text-xs bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-md px-3 py-1.5 transition-colors font-medium"
                >
                  Ya, Batalkan
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-muted p-5 text-center text-muted-foreground text-sm">
          <Star className="w-6 h-6 mx-auto mb-2 opacity-40" />
          Kamu belum memilih ekskul. Pilih salah satu di bawah ini!
        </div>
      )}

      {/* Grid Ekskul */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : ekskulList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Belum ada ekskul yang tersedia saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ekskulList.map(ekskul => {
            const kuota = getKuotaInfo(ekskul)
            const isMyChoice = sudahDaftar(ekskul.id_ekskul)
            const isTutup = ekskul.status_pendaftaran !== "BUKA"
            const isPenuh = kuota?.penuh === true
            const isBusy = loadingId === ekskul.id_ekskul
            // Santri sudah punya pilihan lain — tidak bisa daftar lagi sebelum batal
            const sudahAdaPilihan = pilihanSaya !== null && !isMyChoice

            return (
              <Card
                key={ekskul.id_ekskul}
                className={`relative transition-all duration-200 ${
                  isMyChoice
                    ? "ring-2 ring-emerald-500 shadow-md shadow-emerald-100 dark:shadow-emerald-900/20"
                    : "hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {isMyChoice && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-emerald-500 text-white gap-1 text-xs">
                      <CheckCircle2 className="w-3 h-3" /> Terpilih
                    </Badge>
                  </div>
                )}
                {isTutup && !isMyChoice && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Lock className="w-3 h-3" /> Ditutup
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-base leading-snug pr-20">{ekskul.nama_ekskul}</CardTitle>
                  {ekskul.unit && (
                    <p className="text-xs text-muted-foreground">{ekskul.unit.nama_unit}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm line-clamp-3 min-h-[3.75rem]">
                    {ekskul.deskripsi ?? "Tidak ada deskripsi."}
                  </CardDescription>

                  {/* Kuota info */}
                  {kuota && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {kuota.sisa > 0
                          ? <>{kuota.sisa} tempat tersisa dari {kuota.total}</>
                          : <span className="text-destructive font-medium">Kuota penuh</span>
                        }
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  {isMyChoice ? (
                    <Button variant="outline" className="w-full text-emerald-600 border-emerald-300" disabled>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Sudah Terpilih
                    </Button>
                  ) : sudahAdaPilihan ? (
                    <Button variant="secondary" className="w-full" disabled>
                      <Lock className="w-4 h-4 mr-2" /> Batalkan Pilihan Dulu
                    </Button>
                  ) : isTutup ? (
                    <Button variant="secondary" className="w-full" disabled>
                      <Lock className="w-4 h-4 mr-2" /> Pendaftaran Ditutup
                    </Button>
                  ) : isPenuh ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Kuota Penuh
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleDaftar(ekskul)}
                      disabled={isBusy}
                    >
                      {isBusy ? "Mendaftar..." : "Daftar Sekarang"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
