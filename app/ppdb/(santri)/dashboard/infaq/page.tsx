"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, GraduationCap, Percent,
  Info, Loader2, BookOpen, Home, CalendarDays,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalDashboard } from '@/hooks/ppdb/santri';

export default function PpdbInfoInfaqPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, loading, fetchDashboard } = usePpdbPortalDashboard();
  const [isAnakGuru, setIsAnakGuru] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    void fetchDashboard().catch(() => {
      toast({ title: 'Gagal memuat data', variant: 'destructive' });
    });
  }, [fetchDashboard, toast]);

  useEffect(() => {
    if (!data) return;
    if (data.step === 'siap-menjadi-santri') {
      router.replace('/ppdb/dashboard/pembayaran');
      return;
    }
    if (data.step !== 'pembayaran-ppdb') {
      router.replace('/ppdb/dashboard');
    }
  }, [data, router]);

  const handleLanjut = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ppdb_infaq_acknowledged', '1');
      if (isAnakGuru) sessionStorage.setItem('ppdb_is_anak_guru', '1');
    }
    router.push('/ppdb/dashboard/pembayaran');
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const feeItems = [
    { label: 'Uang gedung dll', amount: 'Rp 1.500.000', alt: 'Rp 2.000.000', note: '' },
    { label: 'Meja belajar', amount: 'Rp 100.000', note: 'hak pakai 3 tahun' },
    { label: 'Papan sekat tidur', amount: 'Rp 100.000', note: 'hak pakai 3 tahun' },
    { label: 'Almari (pakaian & buku)', amount: 'Rp 300.000', note: 'hak pakai 3 tahun' },
    { label: 'Kasur', amount: 'Rp 375.000', note: 'hak milik' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Back link */}
        <Link href="/ppdb/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
        </Link>

        {/* Page title */}
        <div className="text-center py-3 space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-600">Langkah Berikutnya</p>
          <h1 className="text-2xl font-bold">Informasi Infaq Pendidikan</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Harap baca informasi di bawah sebelum melanjutkan ke halaman pembayaran administrasi PPDB.
          </p>
        </div>

        {/* Opening note */}
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex gap-3">
              <Info className="w-4 h-4 text-emerald-700 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-emerald-900 leading-relaxed">
                Biaya yang diserahkan kepada madrasah bersifat <strong>infaq</strong> — bukan sekadar
                pembayaran belaka. Kami memahami perbedaan kemampuan masing-masing wali santri.
                Apabila ada kelebihan, akan digunakan untuk mensubsidi santri yatim atau dari
                keluarga yang membutuhkan.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 1. Uang Pangkal */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              INFAQ UANG PANGKAL (Sarana &amp; Prasarana)
            </CardTitle>
            <CardDescription className="text-xs">Satu kali selama 3 tahun menjadi santri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y text-sm">
              {feeItems.map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2">
                  <div>
                    <span>{item.label}</span>
                    {item.note && <span className="text-xs text-muted-foreground ml-1.5">({item.note})</span>}
                  </div>
                  <div className="text-right font-medium text-primary">
                    {item.amount}
                    {item.alt && <span className="text-muted-foreground font-normal"> / {item.alt}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 2. Uang Modul */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center font-bold">2</span>
              INFAQ UANG MODUL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm">
              <span>Infaq modul semester ganjil</span>
              <span className="font-medium text-primary">Rp 250.000</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Bulanan */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              INFAQ BULANAN / SYAHRIYAH ASRAMA
            </CardTitle>
            <CardDescription className="text-xs">Pembayaran awal ketika santri sudah masuk KBM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Infaq bulanan santri asrama</span>
              <span className="font-medium text-primary">Rp 650.000 / Rp 700.000</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Jika dalam waktu 2 bulan berturutan infaq ini tidak ditunaikan, Madrasah bisa
              mengambil kebijakan yang disepakati bersama orang tua/wali santri.
            </p>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="shadow-sm bg-primary/5 border-primary/20">
          <CardContent className="pt-5 space-y-2">
            <p className="text-sm font-semibold">Jumlah Infaq Pendidikan Ananda:</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span>1. Uang Pangkal</span>
                <span className="font-medium">Rp 2.375.000</span>
              </div>
              <div className="flex justify-between">
                <span>2. Infaq Uang Modul</span>
                <span className="font-medium">Rp 250.000</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>JUMLAH</span>
                <span className="text-primary">Rp 2.625.000</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Pembayaran daftar ulang <strong>minimal 50%</strong> dan sisanya bisa diangsur,
              batas pelunasan sebelum mulai Kegiatan Belajar Mengajar (KBM).
            </p>
          </CardContent>
        </Card>

        {/* Anak Guru Discount */}
        <Card className="shadow-sm border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-600" />
              Informasi Diskon
            </CardTitle>
            <CardDescription className="text-xs">
              Apakah calon santri adalah anak dari guru / pengajar Pondok Pesantren Al Ausath?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => setIsAnakGuru((v) => !v)}
                className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors cursor-pointer ${
                  isAnakGuru ? 'bg-amber-500 border-amber-500' : 'border-muted-foreground/40 hover:border-amber-400'
                }`}
              >
                {isAnakGuru && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm">
                Ya, saya adalah putra/putri dari guru atau pengajar di Ponpes Al Ausath
              </span>
            </label>

            {isAnakGuru && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2">
                <Percent className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Diskon 50% untuk Anak Guru</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Admin akan memverifikasi status dan menyesuaikan nominal tagihan Anda.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation */}
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => setConfirmed((v) => !v)}
                className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors cursor-pointer ${
                  confirmed ? 'bg-primary border-primary' : 'border-muted-foreground/40 hover:border-primary/60'
                }`}
              >
                {confirmed && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Saya telah membaca dan memahami informasi infaq pendidikan di atas, serta bersedia
                memenuhi kewajiban infaq dengan niat lillahi ta&apos;ala.
              </p>
            </label>
          </CardContent>
          <CardFooter className="flex justify-between gap-3 border-t bg-muted/30 pt-4">
            <Button variant="outline" asChild>
              <Link href="/ppdb/dashboard">
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Kembali
              </Link>
            </Button>
            <Button onClick={handleLanjut} disabled={!confirmed} className="gap-2">
              Lanjut ke Pembayaran
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
