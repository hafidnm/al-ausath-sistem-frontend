"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Info,
  Loader2, RefreshCw, LogIn, KeyRound,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalDashboard } from '@/hooks/ppdb/santri';
import { formatAnnouncementDate, getCorrectFrontendStep } from '@/lib/ppdb/santri/dashboard';

// POIN 18: Alur baru — halaman pengumuman menampilkan DITERIMA atau DITOLAK
// berdasarkan status verifikasi backend.

export default function PpdbPengumumanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, loading, fetchDashboard } = usePpdbPortalDashboard();

  useEffect(() => {
    void fetchDashboard().catch((error) => {
      const message = error instanceof Error ? error.message : 'Gagal memuat status pendaftaran';
      toast({
        title: 'Gagal memuat status',
        description: message,
        variant: 'destructive',
      });
    });
  }, [fetchDashboard, toast]);

  useEffect(() => {
    if (!data) return;

    const correctStep = getCorrectFrontendStep(data);
    if (correctStep !== 'pengumuman' && correctStep !== 'menunggu-pengumuman') {
      if (correctStep === 'lengkapi-form') {
        router.replace('/ppdb/dashboard');
      } else if (correctStep === 'infaq') {
        router.replace('/ppdb/dashboard/infaq');
      } else if (correctStep === 'tes') {
        router.replace('/ppdb/tes');
      } else if (correctStep === 'pembayaran-ppdb') {
        router.replace('/ppdb/dashboard/pembayaran');
      } else if (correctStep === 'siap-menjadi-santri') {
        router.replace('/ppdb/dashboard/siap-menjadi-santri');
      }
      return;
    }
  }, [data, router]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat status pengumuman...
        </span>
      </div>
    );
  }

  const statusVerifikasi = (data?.statusVerifikasi || data?.status || '').toLowerCase();
  const isDiterima =
    statusVerifikasi === 'diterima' ||
    statusVerifikasi === 'accepted' ||
    statusVerifikasi === 'lulus';
  const isDitolak =
    statusVerifikasi === 'ditolak' ||
    statusVerifikasi === 'rejected' ||
    statusVerifikasi === 'tidak_diterima' ||
    statusVerifikasi === 'tidak diterima';
  const isMenunggu = !isDiterima && !isDitolak;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          href="/ppdb/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard PPDB
        </Link>

        {/* ── DITERIMA ─────────────────────────────────────────────────── */}
        {isDiterima && (
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <CardHeader className="text-center pb-2 pt-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-9 h-9 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-emerald-800">
                Selamat, Anda Diterima! 🎉
              </CardTitle>
              <CardDescription className="text-emerald-700 text-sm mt-1">
                Pendaftaran Anda telah diterima oleh panitia PPDB Al Ausath.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
              <div className="rounded-lg border border-emerald-200 bg-white p-4 space-y-3">
                <p className="text-sm font-semibold text-emerald-800">
                  Langkah selanjutnya:
                </p>
                <ol className="text-sm text-emerald-700 space-y-2 list-decimal list-inside">
                  <li>Login ke portal santri menggunakan <strong>email dan password</strong> yang Anda daftarkan.</li>
                  <li>Setelah login, tagihan <strong>infaq, SPP, dan tagihan lainnya</strong> akan muncul di dashboard Anda.</li>
                  <li>Selesaikan pembayaran sesuai batas waktu yang ditentukan.</li>
                </ol>
              </div>

              {/* Info login */}
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-4">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Info Login Portal
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{data?.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Password</p>
                    <p className="font-medium text-foreground italic text-muted-foreground">
                      Password yang Anda daftarkan
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Tagihan SPP dan infaq hanya muncul setelah Anda login ke portal administrasi santri.
              </p>
            </CardContent>
            <CardFooter className="pt-4 pb-6 flex flex-col gap-2">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" asChild>
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login ke Portal Santri
                </Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => void fetchDashboard()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ── DITOLAK ──────────────────────────────────────────────────── */}
        {isDitolak && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="text-center pb-2 pt-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
                <XCircle className="w-9 h-9 text-destructive" />
              </div>
              <CardTitle className="text-2xl font-bold text-destructive">
                Maaf, Belum Diterima
              </CardTitle>
              <CardDescription className="text-destructive/80 text-sm mt-1">
                Mohon maaf, pendaftaran Anda belum dapat kami terima pada gelombang ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
              <div className="rounded-lg border border-destructive/20 bg-background p-4 space-y-2">
                <p className="text-sm text-foreground">
                  Kami menghargai minat dan semangat Anda untuk bergabung bersama kami.
                  Jangan menyerah — Anda dapat mendaftar kembali pada gelombang pendaftaran berikutnya.
                </p>
                <p className="text-sm text-muted-foreground">
                  Untuk informasi lebih lanjut, silakan hubungi panitia PPDB melalui kontak yang tersedia.
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-4 pb-6 flex flex-col gap-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/">Kembali ke Beranda</Link>
              </Button>
              <Button variant="ghost" className="w-full text-sm" onClick={() => void fetchDashboard()}>
                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                Refresh Status
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ── MENUNGGU ─────────────────────────────────────────────────── */}
        {isMenunggu && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Menunggu Pengumuman
              </CardTitle>
              <CardDescription>
                Pendaftaran Anda sudah berhasil dikirim dan sedang diproses oleh admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-background p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Silakan tunggu pengumuman selanjutnya dan cek website secara berkala.
                </p>
                {data?.pengumumanDate ? (
                  <p className="text-sm text-muted-foreground">
                    📅 Estimasi pengumuman:{' '}
                    <span className="font-semibold text-foreground">
                      {formatAnnouncementDate(data.pengumumanDate)}
                    </span>
                  </p>
                ) : null}
                <div className="flex items-start gap-2 mt-2 rounded-md bg-amber-50 border border-amber-100 p-3">
                  <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Jika sudah diterima, Anda akan mendapatkan informasi login (email &amp; password) untuk mengakses portal administrasi santri dan melihat tagihan.
                  </p>
                </div>
              </div>

              <Button variant="outline" onClick={() => void fetchDashboard()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
