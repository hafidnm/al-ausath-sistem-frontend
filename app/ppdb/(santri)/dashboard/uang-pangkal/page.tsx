"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, UploadCloud, CheckCircle2, Loader2, Info, AlertTriangle, Landmark } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalDashboard } from '@/hooks/ppdb/santri';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';
import api from '@/lib/axios';

interface RekeningBank {
  id_rekening: number;
  nama_rekening: string;
  nama_bank: string;
  nomor_rekening: string;
  nama_pemilik: string;
  peruntukan?: string;
  cabang_bank?: string;
  aktif: boolean;
}

export default function PpdbPembayaranUangPangkalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, loading, fetchDashboard } = usePpdbPortalDashboard();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [rekeningList, setRekeningList] = useState<RekeningBank[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load rekening bank aktif
    api.get("/administrasi/rekening?status=AKTIF")
      .then((res) => {
        if (res.data && Array.isArray(res.data.data)) {
          setRekeningList(res.data.data);
        }
      })
      .catch(() => {/* silently fail - rekening not critical */});
  }, []);

  useEffect(() => {
    void fetchDashboard().catch(() => {
      toast({
        title: 'Gagal memuat data',
        description: 'Tidak dapat memuat status pembayaran',
        variant: 'destructive',
      });
    });
  }, [fetchDashboard, toast]);

  useEffect(() => {
    if (!data) return;

    // Redirect if they shouldn't be here
    if (
      data.step !== 'pembayaran-uang-pangkal' &&
      data.step !== 'gagal-bayar-uang-pangkal'
    ) {
      router.replace('/ppdb/dashboard');
    }
  }, [data, router]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      toast({
        title: 'File terlalu besar',
        description: 'Ukuran maksimal file adalah 5MB',
        variant: 'destructive',
      });
      return;
    }

    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      await ppdbPortalApi.updateForm({
        bukti_uang_pangkal: file,
      });

      toast({
        title: 'Berhasil',
        description: 'Bukti pembayaran Uang Pangkal berhasil diunggah. Status menunggu verifikasi admin.',
      });

      setFile(null);
      setPreviewUrl(null);
      await fetchDashboard();
    } catch (error: any) {
      toast({
        title: 'Gagal mengunggah',
        description: error.response?.data?.message || 'Terjadi kesalahan saat mengunggah bukti pembayaran',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat status pembayaran...
        </span>
      </div>
    );
  }

  const status = data?.statusUangPangkal || 'menunggu';
  const isVerified = status === 'lunas' || status === 'dp';
  const isPendingVerification = status === 'menunggu_verifikasi';
  const isGagal = status === 'gagal' || data?.step === 'gagal-bayar-uang-pangkal';

  // Infaq info discount logic
  const isAnakGuru = data?.isAnakGuru;
  const baseUangPangkal = 2625000;
  const nominal = isAnakGuru ? baseUangPangkal * 0.5 : baseUangPangkal;
  const dpNominal = nominal * 0.5;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href="/ppdb/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard PPDB
        </Link>

        {isGagal && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="flex flex-row items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-destructive flex-shrink-0" />
              <div>
                <CardTitle className="text-destructive">Pendaftaran Dibatalkan ("Tidak Diterima")</CardTitle>
                <CardDescription className="text-destructive/80">
                  Batas waktu pembayaran Uang Pangkal telah terlewati.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-destructive-foreground/90 leading-relaxed">
              Pesantren menetapkan kebijakan pembayaran Uang Pangkal (minimal 50% Down Payment) selambat-lambatnya 2 bulan setelah dinyatakan diterima. Karena batas waktu telah terlewati tanpa pembayaran yang diverifikasi, status kelulusan Anda dinyatakan <strong>Tidak Diterima</strong>. Silahkan hubungi panitia PPDB untuk informasi lebih lanjut.
            </CardContent>
          </Card>
        )}

        {!isGagal && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Pembayaran Uang Pangkal
              </CardTitle>
              <CardDescription>
                {isVerified
                  ? 'Pembayaran Uang Pangkal Anda telah berhasil diverifikasi.'
                  : 'Silahkan lakukan transfer Uang Pangkal (dapat diangsur minimal 50% DP).'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status Pembayaran</p>
                    <p className="font-semibold mt-1">
                      {status === 'lunas' ? (
                        <span className="text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Lunas (100%)
                        </span>
                      ) : status === 'dp' ? (
                        <span className="text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Diterima (DP 50% Terbayar)
                        </span>
                      ) : isPendingVerification ? (
                        <span className="text-amber-600">Menunggu Verifikasi Admin</span>
                      ) : (
                        <span className="text-rose-600">Menunggu Pembayaran</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Nominal Pembayaran</p>
                    <p className="font-bold text-2xl text-primary mt-1">
                      Rp {nominal.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Minimal DP 50%: Rp {dpNominal.toLocaleString('id-ID')})
                    </p>
                    {isAnakGuru && (
                      <span className="inline-block mt-2 text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                        Diskon Anak Guru 50% Terapan
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-2">
                  <div>
                    <span className="text-muted-foreground">Batas Waktu Pembayaran:</span>
                    <p className="font-semibold text-rose-600 mt-0.5">
                      {data?.batasBayarUangPangkal
                        ? new Date(data.batasBayarUangPangkal).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-3">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1.5 text-xs uppercase tracking-wider">
                    <Landmark className="w-3.5 h-3.5 text-primary" />
                    Rekening Tujuan Transfer:
                  </span>
                  {rekeningList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                      {rekeningList.map((rek) => (
                        <div key={rek.id_rekening} className="rounded-lg border border-border bg-background p-3 text-sm shadow-sm">
                          <p className="font-bold text-foreground">{rek.nama_bank}{rek.cabang_bank ? ` - ${rek.cabang_bank}` : ""}</p>
                          <p className="font-mono text-base font-bold text-primary tracking-wider mt-0.5">{rek.nomor_rekening}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">a.n. {rek.nama_pemilik}</p>
                          {rek.peruntukan && <p className="text-xs text-muted-foreground/70 italic mt-0.5">{rek.peruntukan}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-background p-3 text-sm shadow-sm max-w-sm">
                      <p className="font-bold text-foreground">Bank Syariah Indonesia (BSI)</p>
                      <p className="font-mono text-base font-bold text-primary tracking-wider mt-0.5">714-888-9990</p>
                      <p className="text-xs text-muted-foreground mt-0.5">a.n. PPTQ Al-Ausath</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Instruksi Pembayaran:</p>
                  <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1 leading-relaxed">
                    <li>Transfer minimal 50% dari total nominal (Rp {dpNominal.toLocaleString('id-ID')}) ke salah satu rekening di atas.</li>
                    <li>Pastikan Anda menyimpan bukti transfer / struk pembayaran.</li>
                    <li>Unggah bukti transfer pada form di bawah untuk dilakukan verifikasi oleh admin.</li>
                  </ol>
                </div>
              </div>

              {data?.buktiUangPangkalUrl && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <p className="text-sm font-semibold mb-2">Bukti Pembayaran yang Terkirim:</p>
                  <div className="max-w-xs border rounded overflow-hidden">
                    {data.buktiUangPangkalUrl.endsWith('.pdf') ? (
                      <div className="p-4 bg-muted flex items-center justify-center text-sm">
                        Dokumen Bukti (PDF)
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={data.buktiUangPangkalUrl}
                        alt="Bukti pembayaran uang pangkal"
                        className="w-full h-auto object-contain max-h-48"
                      />
                    )}
                  </div>
                </div>
              )}

              {!isVerified && (
                <div className="space-y-4 border rounded-lg p-6 bg-muted/10">
                  <div>
                    <Label className="text-base font-semibold">Unggah Bukti Pembayaran Baru</Label>
                    <p className="text-sm text-muted-foreground">
                      Format file yang didukung: JPG, JPEG, PNG, PDF (Maks. 5MB)
                    </p>
                  </div>

                  <div className="space-y-4">
                    {isPendingVerification && !file && (
                      <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex gap-2">
                        <Info className="w-4 h-4 mt-0.5" />
                        <div>
                          <p className="font-medium">Bukti pembayaran sedang direview</p>
                          <p>Anda sudah mengunggah bukti bayar. Jika ada kesalahan atau Anda ingin mengunggah bukti pelunasan sisa, Anda dapat mengunggah file baru.</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Pilih File Bukti
                      </Button>
                      <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={handleFileChange}
                      />
                      <span className="text-sm text-muted-foreground line-clamp-1">
                        {file ? file.name : 'Tidak ada file terpilih'}
                      </span>
                    </div>

                    {previewUrl && file?.type.startsWith('image/') && (
                      <div className="mt-4 border rounded-lg p-2 max-w-xs bg-muted/50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Preview bukti pembayaran"
                          className="w-full h-auto rounded object-contain max-h-64"
                        />
                      </div>
                    )}

                    {file && (
                      <Button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Mengunggah...
                          </>
                        ) : (
                          'Kirim Bukti Pembayaran Uang Pangkal'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            {isVerified && (
              <CardFooter className="bg-emerald-50/50 border-t flex justify-between items-center py-4">
                <span className="text-sm text-emerald-800 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pembayaran Berhasil! Silahkan lanjut ke langkah berikutnya.
                </span>
                <Button asChild>
                  <Link href="/ppdb/dashboard">
                    Lanjut ke Dashboard
                  </Link>
                </Button>
              </CardFooter>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
