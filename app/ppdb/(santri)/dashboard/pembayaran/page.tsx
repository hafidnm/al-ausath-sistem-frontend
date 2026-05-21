"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, UploadCloud, CheckCircle2, Loader2, Info, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalDashboard } from '@/hooks/ppdb/santri';
import api from '@/lib/axios';

export default function PpdbPembayaranPage() {
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

    if (data.step !== 'pembayaran-ppdb' && data.step !== 'siap-menjadi-santri') {
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
    if (!file || !data?.pembayaranPpdb?.id_pembayaran) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('bukti_bayar', file);

      await api.post(`/administrasi/pembayaran/${data.pembayaranPpdb.id_pembayaran}/upload-bukti`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: 'Berhasil',
        description: 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.',
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

  const handleDownloadKwitansi = async () => {
    if (!data?.pembayaranPpdb?.id_pembayaran) return;
    try {
      const response = await api.get(`/administrasi/spp/pembayaran/${data.pembayaranPpdb.id_pembayaran}/kwitansi`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Kwitansi-PPDB-${data.pembayaranPpdb.id_pembayaran}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Gagal',
        description: 'Kwitansi belum tersedia atau gagal diunduh',
        variant: 'destructive',
      });
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

  const paymentInfo = data?.pembayaranPpdb;
  const isVerified = paymentInfo?.status === 'terverifikasi';
  const isPendingVerification = paymentInfo?.status === 'menunggu_verifikasi';
  
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

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Pembayaran Administrasi PPDB
            </CardTitle>
            <CardDescription>
              {isVerified 
                ? 'Pembayaran Anda telah diverifikasi.' 
                : 'Silahkan selesaikan pembayaran dan unggah bukti transfer.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!paymentInfo?.has_tagihan ? (
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 flex gap-3">
                <Info className="w-5 h-5 text-warning flex-shrink-0" />
                <p className="text-sm text-warning-foreground">
                  Tagihan pembayaran belum tersedia. Admin akan segera menerbitkan tagihan Anda.
                </p>
              </div>
            ) : (
              <>
                <div className="bg-muted rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status Pembayaran</p>
                      <p className="font-semibold">
                        {isVerified ? (
                          <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Terverifikasi</span>
                        ) : isPendingVerification ? (
                          <span className="text-amber-600">Menunggu Verifikasi Admin</span>
                        ) : (
                          <span className="text-rose-600">Menunggu Pembayaran</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Tagihan</p>
                      <p className="font-bold text-2xl">
                        Rp {Number(paymentInfo.nominal_bayar || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium">Instruksi Pembayaran:</p>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                      <li>Transfer sesuai nominal di atas ke rekening pesantren.</li>
                      <li>Simpan struk / bukti transfer (format JPG, PNG, atau PDF).</li>
                      <li>Unggah bukti transfer pada form di bawah ini.</li>
                    </ol>
                  </div>
                </div>

                {!isVerified && (
                  <div className="space-y-4 border rounded-lg p-6">
                    <div>
                      <Label className="text-base font-semibold">Unggah Bukti Pembayaran</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Format file yang didukung: JPG, JPEG, PNG, PDF (Maks. 5MB)
                      </p>
                    </div>

                    <div className="space-y-4">
                      {isPendingVerification && !file && (
                        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex gap-2">
                          <Info className="w-4 h-4 mt-0.5" />
                          <div>
                            <p className="font-medium">Bukti pembayaran sedang direview</p>
                            <p>Anda sudah mengunggah bukti bayar. Jika ada kesalahan, Anda dapat mengunggah ulang dengan memilih file baru.</p>
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

                      <Button 
                        onClick={handleUpload} 
                        disabled={!file || uploading} 
                        className="w-full sm:w-auto"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Mengunggah...
                          </>
                        ) : (
                          'Kirim Bukti Pembayaran'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
          {isVerified && (
            <CardFooter className="bg-emerald-50 border-t border-emerald-100 flex justify-between p-6">
              <div>
                <p className="font-semibold text-emerald-800">Pembayaran Selesai</p>
                <p className="text-sm text-emerald-600">Terima kasih, Anda telah resmi menjadi santri.</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownloadKwitansi} variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Kwitansi
                </Button>
                <Button asChild variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-100">
                  <Link href="/ppdb/dashboard">Dashboard</Link>
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
