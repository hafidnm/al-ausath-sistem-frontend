"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, UploadCloud, CheckCircle2, Loader2, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalDashboard } from '@/hooks/ppdb/santri';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';

export default function PpdbPembayaranSppPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, loading, fetchDashboard } = usePpdbPortalDashboard();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      data.step !== 'pembayaran-spp' &&
      data.step !== 'gagal-bayar-spp'
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
        bukti_spp: file,
      });

      toast({
        title: 'Berhasil',
        description: 'Bukti pembayaran SPP Bulan Pertama berhasil diunggah. Status menunggu verifikasi admin.',
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

  const status = data?.statusSpp || 'menunggu';
  const isVerified = status === 'lunas';
  const isPendingVerification = status === 'menunggu_verifikasi';
  const isGagal = status === 'gagal' || data?.step === 'gagal-bayar-spp';

  // Nominal SPP: SMP 650k, SMA/default 700k
  const isSmp = data?.jenjang?.toLowerCase() === 'smp' || data?.program?.toLowerCase() === 'smp';
  const nominal = isSmp ? 650000 : 700000;

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
                  Batas waktu pembayaran SPP Bulan Pertama telah terlewati.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-destructive-foreground/90 leading-relaxed">
              Pesantren menetapkan kebijakan pembayaran SPP Bulan Pertama selambat-lambatnya 1 bulan setelah dinyatakan diterima. Karena batas waktu telah terlewati tanpa pembayaran yang diverifikasi, status kelulusan Anda dinyatakan <strong>Tidak Diterima</strong>. Silahkan hubungi panitia PPDB untuk informasi lebih lanjut.
            </CardContent>
          </Card>
        )}

        {!isGagal && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Pembayaran SPP Bulan Pertama
              </CardTitle>
              <CardDescription>
                {isVerified
                  ? 'Pembayaran SPP Bulan Pertama Anda telah berhasil diverifikasi.'
                  : 'Silahkan lakukan transfer SPP Bulan Pertama.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status Pembayaran</p>
                    <p className="font-semibold mt-1">
                      {isVerified ? (
                        <span className="text-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Terverifikasi / Lunas
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
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-2">
                  <div>
                    <span className="text-muted-foreground">Batas Waktu Pembayaran:</span>
                    <p className="font-semibold text-rose-600 mt-0.5">
                      {data?.batasBayarSpp
                        ? new Date(data.batasBayarSpp).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rekening Transfer:</span>
                    <p className="font-semibold mt-0.5">Bank Syariah Indonesia (BSI)</p>
                    <p className="text-primary font-bold">714-888-9990 a.n. PPTQ Al-Ausath</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Instruksi Pembayaran:</p>
                  <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1 leading-relaxed">
                    <li>Transfer nominal SPP di atas ke rekening pesantren.</li>
                    <li>Pastikan Anda menyimpan bukti transfer / struk pembayaran.</li>
                    <li>Unggah bukti transfer pada form di bawah untuk dilakukan verifikasi oleh admin.</li>
                  </ol>
                </div>
              </div>

              {data?.buktiSppUrl && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <p className="text-sm font-semibold mb-2">Bukti Pembayaran yang Terkirim:</p>
                  <div className="max-w-xs border rounded overflow-hidden">
                    {data.buktiSppUrl.endsWith('.pdf') ? (
                      <div className="p-4 bg-muted flex items-center justify-center text-sm">
                        Dokumen Bukti (PDF)
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={data.buktiSppUrl}
                        alt="Bukti pembayaran SPP"
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
                          <p>Anda sudah mengunggah bukti bayar. Jika ada kesalahan, Anda dapat mengunggah file baru.</p>
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
                          'Kirim Bukti Pembayaran SPP'
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
