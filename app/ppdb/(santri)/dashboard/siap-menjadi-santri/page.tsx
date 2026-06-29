"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, User, Landmark, GraduationCap, ArrowRight, BookOpen, Loader2, LogIn } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalDashboard } from '@/hooks/ppdb/santri';
import { getCorrectFrontendStep } from '@/lib/ppdb/santri/dashboard';

export default function SiapMenjadiSantriPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, loading, fetchDashboard } = usePpdbPortalDashboard();

  useEffect(() => {
    void fetchDashboard().catch(() => {
      toast({
        title: 'Gagal memuat data',
        description: 'Tidak dapat memuat status kelulusan santri',
        variant: 'destructive',
      });
    });
  }, [fetchDashboard, toast]);

  useEffect(() => {
    if (!data) return;

    // Redirect jika tidak seharusnya berada di halaman ini
    const correctStep = getCorrectFrontendStep(data);
    if (correctStep !== 'siap-menjadi-santri') {
      if (correctStep === 'lengkapi-form') {
        router.replace('/ppdb/dashboard');
      } else if (correctStep === 'infaq') {
        router.replace('/ppdb/dashboard/infaq');
      } else if (correctStep === 'tes') {
        router.replace('/ppdb/tes');
      } else if (correctStep === 'pembayaran-ppdb') {
        router.replace('/ppdb/dashboard/pembayaran');
      } else if (correctStep === 'pengumuman' || correctStep === 'menunggu-pengumuman') {
        router.replace('/ppdb/dashboard/pengumuman');
      }
    }
  }, [data, router]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat status kelulusan...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-2 relative animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
          <Sparkles className="w-6 h-6 absolute -top-1 -right-1 text-amber-500 animate-pulse" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Selamat, Anda Resmi Diterima!
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          Seluruh rangkaian pendaftaran dan administrasi PPDB telah berhasil diverifikasi. Selamat bergabung dengan keluarga besar pondok pesantren kami!
        </p>

        <Card className="border-emerald-200/50 shadow-lg text-left overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-primary/10 border-b border-emerald-100 py-6">
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
              Informasi Kelulusan & Identitas Santri
            </CardTitle>
            <CardDescription className="text-emerald-700/80">
              Simpan informasi identitas santri baru Anda di bawah ini:
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Nama Lengkap Santri
                </span>
                <p className="text-lg font-bold text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  {data?.namaLengkap || data?.namaCalon || '-'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Nomor Induk Santri (NIS)
                </span>
                <div className="mt-0.5">
                  {data?.nomorIndukGenerated ? (
                    <p className="text-xl font-mono font-bold text-primary flex items-center gap-2 bg-primary/5 px-2.5 py-1 rounded w-fit border border-primary/10">
                      {data.nomorIndukGenerated}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-amber-600 flex items-center gap-2">
                        <span className="animate-pulse">⏳</span> Sedang Diproses
                      </p>
                      <button
                        onClick={() => void fetchDashboard()}
                        className="text-xs text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
                      >
                        Klik untuk refresh status NIS
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Program Pendidikan
                </span>
                <p className="text-base font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  {data?.program?.toUpperCase() || data?.jenjang?.toUpperCase() || '-'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Kelas Diterima
                </span>
                <p className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                  {data?.kodeKelasDiterima || 'Ditentukan Kemudian'}
                </p>
              </div>
            </div>

            <div className="border-t pt-4 text-xs text-muted-foreground leading-relaxed">
              <strong>Catatan:</strong> NIS di atas akan digunakan sebagai ID login santri pada Portal Akademik Pesantren setelah tahun ajaran baru dimulai. Informasi tanggal masuk asrama dan perlengkapan santri akan diumumkan lebih lanjut melalui WhatsApp dan website resmi pesantren.
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t py-4 flex flex-col sm:flex-row gap-3 justify-between">
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/login" className="inline-flex items-center gap-1.5">
                <LogIn className="w-4 h-4" />
                Login ke Portal Santri
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/" className="inline-flex items-center gap-1">
                Buka Website Utama
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
