"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, GraduationCap, Percent,
  Info, Loader2, CheckCircle2, Paperclip, UploadCloud,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalDashboard } from '@/hooks/ppdb/santri';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';
import { buildPpdbUpdatePayload, mapDashboardToForm, getCorrectFrontendStep } from '@/lib/ppdb/santri/dashboard';
import { initialPpdbDashboardFiles } from '@/types/ppdb/santri/dashboard';
import type { PpdbPortalBillingInfo, PpdbPortalBillingOption } from '@/types/ppdb/portal';

const OPSI_UANG_GEDUNG = [
  { value: 1, label: 'Pilihan A', amount: 1_500_000, display: 'Rp 1.500.000' },
  { value: 2, label: 'Pilihan B', amount: 2_000_000, display: 'Rp 2.000.000' },
];

const OPSI_INFAQ_BULANAN = [
  { value: 1, label: 'Pilihan A', amount: 650_000, display: 'Rp 650.000' },
  { value: 2, label: 'Pilihan B', amount: 700_000, display: 'Rp 700.000' },
];

const FIXED_UANG_PANGKAL_ITEMS = [
  { label: 'Meja belajar', amount: 100_000, note: 'hak pakai 3 tahun' },
  { label: 'Papan sekat tidur', amount: 100_000, note: 'hak pakai 3 tahun' },
  { label: 'Almari (pakaian & buku)', amount: 300_000, note: 'hak pakai 3 tahun' },
  { label: 'Kasur', amount: 375_000, note: 'hak milik' },
];

const UANG_MODUL = 250_000;

const formatRupiah = (amount: number) =>
  'Rp ' + amount.toLocaleString('id-ID');

export default function PpdbInfoInfaqPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, loading, fetchDashboard } = usePpdbPortalDashboard();
  const [billingInfo, setBillingInfo] = useState<PpdbPortalBillingInfo | null>(null);

  const [pilihanUangGedung, setPilihanUangGedung] = useState<1 | 2>(1);
  const [pilihanInfaqBulanan, setPilihanInfaqBulanan] = useState<1 | 2>(1);
  const [isAnakGuru, setIsAnakGuru] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // POIN 4: Upload bukti anak guru — state file
  const [buktiAnakGuruFile, setBuktiAnakGuruFile] = useState<File | null>(null);
  const [buktiAnakGuruPreview, setBuktiAnakGuruPreview] = useState<string | null>(null);
  const buktiAnakGuruRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetchDashboard().catch(() => {
      toast({ title: 'Gagal memuat data', variant: 'destructive' });
    });
  }, [fetchDashboard, toast]);

  useEffect(() => {
    void ppdbPortalApi.getBillingInfo()
      .then(setBillingInfo)
      .catch(() => {
        setBillingInfo(null);
      });
  }, []);

  // Sync from backend data once loaded
  useEffect(() => {
    if (!data) return;
    
    // Jangan redirect jika sedang submitting untuk menghindari loop
    if (submitting) return;

    // Redirect guards: halaman ini hanya untuk step 'infaq'
    const correctStep = getCorrectFrontendStep(data);
    if (correctStep !== 'infaq') {
      if (correctStep === 'lengkapi-form') {
        router.replace('/ppdb/dashboard');
      } else if (correctStep === 'tes') {
        router.replace('/ppdb/tes');
      } else if (correctStep === 'pembayaran-ppdb') {
        router.replace('/ppdb/dashboard/pembayaran');
      } else if (correctStep === 'siap-menjadi-santri') {
        router.replace('/ppdb/dashboard/siap-menjadi-santri');
      } else if (correctStep === 'pengumuman' || correctStep === 'menunggu-pengumuman') {
        router.replace('/ppdb/dashboard/pengumuman');
      }
      return;
    }

    // Pre-fill from previously saved choices
    if (data.pilihanUangGedung === 1 || data.pilihanUangGedung === 2) {
      setPilihanUangGedung(data.pilihanUangGedung);
    }
    if (data.pilihanInfaqBulanan === 1 || data.pilihanInfaqBulanan === 2) {
      setPilihanInfaqBulanan(data.pilihanInfaqBulanan);
    }
    if (typeof data.isAnakGuru === 'boolean') {
      setIsAnakGuru(data.isAnakGuru);
    }
  }, [data, router, submitting]);

  useEffect(() => {
    if (!billingInfo) return;

    if (billingInfo.pilihanUangGedung === 1 || billingInfo.pilihanUangGedung === 2) {
      setPilihanUangGedung(billingInfo.pilihanUangGedung);
    }
    if (billingInfo.pilihanInfaqBulanan === 1 || billingInfo.pilihanInfaqBulanan === 2) {
      setPilihanInfaqBulanan(billingInfo.pilihanInfaqBulanan);
    }
    setIsAnakGuru(Boolean(billingInfo.isAnakGuru));
  }, [billingInfo]);

  // Computed totals
  const uangGedungOptions = (billingInfo?.uangGedungOptions?.length ? billingInfo.uangGedungOptions : OPSI_UANG_GEDUNG) as PpdbPortalBillingOption[];
  const infaqOptions = (billingInfo?.infaqBulananOptions?.length ? billingInfo.infaqBulananOptions : OPSI_INFAQ_BULANAN) as PpdbPortalBillingOption[];

  const gedungAmount = uangGedungOptions.find(o => o.value === pilihanUangGedung)?.amount ?? 0;
  const fixedTotal = FIXED_UANG_PANGKAL_ITEMS.reduce((s, i) => s + i.amount, 0);
  const totalUangPangkal = gedungAmount + fixedTotal; // e.g. 2.375.000 or 2.875.000
  const totalKeseluruhan = totalUangPangkal + UANG_MODUL;
  const infaqBulananDisplay = infaqOptions.find(o => o.value === pilihanInfaqBulanan)?.display ?? '-';

  const handleLanjut = async () => {
    // POIN 4: Validasi — jika anak guru, bukti wajib diupload
    if (isAnakGuru && !buktiAnakGuruFile && !data?.buktiOrtuGuruUrl) {
      toast({
        title: 'Bukti anak guru wajib',
        description: 'Silakan upload bukti bahwa calon santri adalah anak guru.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const existingPayload = data
        ? buildPpdbUpdatePayload(mapDashboardToForm(data), initialPpdbDashboardFiles, data)
        : {};

      await ppdbPortalApi.updateForm({
        ...existingPayload,
        is_anak_guru: isAnakGuru ? 1 : 0,
        pilihanUangGedung,
        pilihan_uang_gedung: pilihanUangGedung,
        pilihanInfaqBulanan,
        pilihan_infaq_bulanan: pilihanInfaqBulanan,
        ...(buktiAnakGuruFile ? { bukti_ortu_guru: buktiAnakGuruFile } : {}),
      });
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ppdb_infaq_acknowledged', '1');
        if (isAnakGuru) sessionStorage.setItem('ppdb_is_anak_guru', '1');
      }
      
      const shouldGoTes = data?.fiturSoalAktif && !Boolean((data?.soalJawab || '').trim());

      toast({
        title: 'Pilihan infaq berhasil disimpan',
        description: shouldGoTes ? 'Mengarahkan ke halaman tes...' : 'Mengarahkan ke halaman pembayaran...',
      });
      
      setTimeout(() => {
        router.push(shouldGoTes ? '/ppdb/tes' : '/ppdb/dashboard/pembayaran');
      }, 100);
    } catch (err) {
      toast({
        title: 'Gagal menyimpan pilihan',
        description: err instanceof Error ? err.message : 'Silahkan coba lagi',
        variant: 'destructive',
      });
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            Pilih opsi infaq sesuai kemampuan Anda, lalu lanjutkan ke pembayaran administrasi PPDB.
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

        {/* 1. Uang Pangkal dengan pilihan uang gedung */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
              INFAQ UANG PANGKAL (Sarana &amp; Prasarana)
            </CardTitle>
            <CardDescription className="text-xs">Satu kali selama 3 tahun menjadi santri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Uang Gedung — pilihan */}
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 space-y-2">
              <p className="text-sm font-medium">Uang gedung dll — pilih salah satu:</p>
              <div className="flex gap-4">
                {uangGedungOptions.map((opsi) => (
                  <button
                    key={opsi.value}
                    type="button"
                    onClick={() => setPilihanUangGedung(opsi.value as 1 | 2)}
                    className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all focus:outline-none ${
                      pilihanUangGedung === opsi.value
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                        : 'border-border bg-white text-foreground hover:border-blue-400'
                    }`}
                  >
                    <span className="block text-xs font-normal mb-0.5 opacity-80">{opsi.label}</span>
                    {opsi.display}
                    {pilihanUangGedung === opsi.value && (
                      <CheckCircle2 className="inline-block w-3.5 h-3.5 ml-1.5 -mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Fixed items */}
            <div className="divide-y text-sm">
              {FIXED_UANG_PANGKAL_ITEMS.map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2">
                  <div>
                    <span>{item.label}</span>
                    {item.note && <span className="text-xs text-muted-foreground ml-1.5">({item.note})</span>}
                  </div>
                  <span className="font-medium text-primary">{formatRupiah(item.amount)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 border-t text-sm font-semibold">
              <span>Subtotal Uang Pangkal</span>
              <span className="text-blue-700">{formatRupiah(totalUangPangkal)}</span>
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
              <span className="font-medium text-primary">{formatRupiah(UANG_MODUL)}</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Bulanan dengan pilihan */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">3</span>
              INFAQ BULANAN / SYAHRIYAH ASRAMA
            </CardTitle>
            <CardDescription className="text-xs">Pembayaran awal ketika santri sudah masuk KBM</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4">
              {infaqOptions.map((opsi) => (
                <button
                  key={opsi.value}
                  type="button"
                  onClick={() => setPilihanInfaqBulanan(opsi.value as 1 | 2)}
                  className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all focus:outline-none ${
                    pilihanInfaqBulanan === opsi.value
                      ? 'border-amber-600 bg-amber-600 text-white shadow-md'
                      : 'border-border bg-white text-foreground hover:border-amber-400'
                  }`}
                >
                  <span className="block text-xs font-normal mb-0.5 opacity-80">{opsi.label}</span>
                  {opsi.display}
                  {pilihanInfaqBulanan === opsi.value && (
                    <CheckCircle2 className="inline-block w-3.5 h-3.5 ml-1.5 -mt-0.5" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Jika dalam waktu 2 bulan berturutan infaq ini tidak ditunaikan, Madrasah bisa
              mengambil kebijakan yang disepakati bersama orang tua/wali santri.
            </p>
          </CardContent>
        </Card>

        {/* Summary dinamis */}
        <Card className="shadow-sm bg-primary/5 border-primary/20">
          <CardContent className="pt-5 space-y-2">
            <p className="text-sm font-semibold">Jumlah Infaq Pendidikan Ananda:</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span>1. Uang Pangkal</span>
                <span className="font-medium">{formatRupiah(totalUangPangkal)}</span>
              </div>
              <div className="flex justify-between">
                <span>2. Infaq Uang Modul</span>
                <span className="font-medium">{formatRupiah(UANG_MODUL)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>JUMLAH (tanpa SPP)</span>
                <span className="text-primary">{formatRupiah(totalKeseluruhan)}</span>
              </div>
            </div>
            <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-800 mt-1">
              Infaq bulanan / SPP: <span className="font-semibold">{infaqBulananDisplay}</span> per bulan
              (dibayarkan setelah masuk KBM)
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
              Informasi Diskon Anak Guru
            </CardTitle>
            <CardDescription className="text-xs">
              Apakah calon santri adalah anak dari guru / pengajar Pondok Pesantren Al Ausath?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-6">
              {/* Ya */}
              <label
                htmlFor="anak-guru-ya"
                className="flex items-center gap-2.5 cursor-pointer select-none"
              >
                <div
                  id="anak-guru-ya"
                  role="radio"
                  aria-checked={isAnakGuru === true}
                  tabIndex={0}
                  onClick={() => setIsAnakGuru(true)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsAnakGuru(true)}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer focus:outline-none ${
                    isAnakGuru === true
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-muted-foreground/40 hover:border-amber-400'
                  }`}
                >
                  {isAnakGuru === true && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-sm font-medium">Ya</span>
              </label>

              {/* Tidak */}
              <label
                htmlFor="anak-guru-tidak"
                className="flex items-center gap-2.5 cursor-pointer select-none"
              >
                <div
                  id="anak-guru-tidak"
                  role="radio"
                  aria-checked={isAnakGuru === false}
                  tabIndex={0}
                  onClick={() => setIsAnakGuru(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsAnakGuru(false)}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer focus:outline-none ${
                    isAnakGuru === false
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/40 hover:border-primary/60'
                  }`}
                >
                  {isAnakGuru === false && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-sm font-medium">Tidak</span>
              </label>
            </div>

            {isAnakGuru === true && (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2">
                  <Percent className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-800">Diskon 50% untuk Anak Guru</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Admin akan memverifikasi status dan menyesuaikan nominal tagihan administrasi PPDB Anda.
                    </p>
                  </div>
                </div>

                {/* POIN 4: Upload bukti anak guru — muncul hanya jika isAnakGuru = true */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                  <Label className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-amber-600" />
                    Upload Bukti Anak Guru <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-amber-700">
                    Upload surat keterangan atau bukti bahwa calon santri adalah anak dari guru / pengajar pondok. Format: JPG, PNG, PDF (maks. 5MB).
                  </p>

                  {/* Tampilkan bukti yang sudah tersimpan sebelumnya */}
                  {data?.buktiOrtuGuruUrl && !buktiAnakGuruPreview && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <a
                        href={data.buktiOrtuGuruUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Bukti tersimpan — klik untuk melihat
                      </a>
                      <span className="text-muted-foreground">(bisa diperbarui di bawah)</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2 border-amber-300 text-amber-800 hover:bg-amber-50"
                      onClick={() => buktiAnakGuruRef.current?.click()}
                      disabled={submitting}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      Pilih File
                    </Button>
                    <input
                      type="file"
                      ref={buktiAnakGuruRef}
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          toast({ title: 'File terlalu besar', description: 'Maksimal 5MB', variant: 'destructive' });
                          return;
                        }
                        if (buktiAnakGuruPreview) URL.revokeObjectURL(buktiAnakGuruPreview);
                        setBuktiAnakGuruFile(file);
                        setBuktiAnakGuruPreview(URL.createObjectURL(file));
                      }}
                    />
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {buktiAnakGuruFile ? buktiAnakGuruFile.name : 'Tidak ada file terpilih'}
                    </span>
                  </div>

                  {buktiAnakGuruPreview && (
                    <div className="max-w-xs border rounded overflow-hidden mt-2">
                      {buktiAnakGuruFile?.type === 'application/pdf' ? (
                        <div className="p-3 bg-muted text-xs text-center">PDF dipilih: {buktiAnakGuruFile.name}</div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={buktiAnakGuruPreview}
                          alt="Preview bukti anak guru"
                          className="w-full h-auto object-contain max-h-40"
                        />
                      )}
                    </div>
                  )}
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
                memenuhi kewajiban infaq sesuai pilihan saya, dengan niat lillahi ta&apos;ala.
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
            <Button onClick={handleLanjut} disabled={!confirmed || submitting} className="gap-2">
              {submitting ? 'Menyimpan...' : 'Lanjut ke Pembayaran'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>

      </div>
    </div>
  );
}
