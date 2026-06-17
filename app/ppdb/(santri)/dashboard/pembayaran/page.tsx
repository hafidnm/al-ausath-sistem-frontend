"use client";

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, UploadCloud, CheckCircle2, Loader2, Info, Download, Landmark } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalPembayaranStatus } from '@/hooks/ppdb/santri';
import api from '@/lib/axios';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';
import type { PpdbPortalBillingInfo } from '@/types/ppdb/portal';

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

export default function PpdbPembayaranPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, loading, fetchPembayaranStatus } = usePpdbPortalPembayaranStatus();
  const [billingInfo, setBillingInfo] = useState<PpdbPortalBillingInfo | null>(null);

  // POIN 17: Dropdown jenjang & kelas dihapus dari halaman pembayaran santri.
  // Pengaturan jenjang dan kelas hanya dilakukan oleh admin.

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
    void fetchPembayaranStatus().catch(() => {
      toast({
        title: 'Gagal memuat data',
        description: 'Tidak dapat memuat status pembayaran',
        variant: 'destructive',
      });
    });
  }, [fetchPembayaranStatus, toast]);

  useEffect(() => {
    void ppdbPortalApi.getBillingInfo()
      .then(setBillingInfo)
      .catch(() => {
        setBillingInfo(null);
      });
  }, []);

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
      await fetchPembayaranStatus();
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
  const pilihanInfaqBulanan = data?.pilihanInfaqBulanan;
  const selectedInfaq = billingInfo?.selectedInfaqBulanan;
  const isPpdbAccepted = data?.statusVerifikasi?.toLowerCase() === 'diterima' || data?.step === 'siap-menjadi-santri';
  const infaqSummary = selectedInfaq
    ? `${selectedInfaq.label} - ${selectedInfaq.display}`
    : pilihanInfaqBulanan
      ? `Pilihan infaq bulanan: Rp ${Number(pilihanInfaqBulanan).toLocaleString('id-ID')}`
      : 'Pilihan infaq belum tersimpan';
  
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status PPDB</p>
                <p className="mt-1 font-semibold">{isPpdbAccepted ? 'Diterima' : (data?.statusVerifikasi || 'Menunggu')}</p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50/70 p-3">
                <p className="text-xs uppercase tracking-wide text-purple-700 font-semibold">Infaq Bulanan (Sumbangan)</p>
                <p className="mt-1 font-semibold text-purple-900">{infaqSummary}</p>
              </div>
            </div>

            {/* Issue 9: Uang Gedung + SPP Bundling Info */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-emerald-900">
                  <p className="font-semibold">Tagihan Awal: Uang Gedung + SPP Bulan Pertama (Tergabung)</p>
                  <p className="text-xs mt-1">Saat pembayaran awal, Uang Gedung dan SPP bulan pertama akan dijadikan satu tagihan untuk kemudahan. Tagihan SPP bulan-bulan berikutnya terpisah dan disesuaikan dengan kalender akademik.</p>
                </div>
              </div>
            </div>

            {/* POIN 17: Pilih jenjang & kelas dihapus dari halaman pembayaran santri */}

            {!paymentInfo?.has_tagihan ? (
              <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 flex gap-3">
                <Info className="w-5 h-5 text-warning flex-shrink-0" />
                <p className="text-sm text-warning-foreground">
                  {isPpdbAccepted
                    ? 'Tagihan pembayaran belum tersedia. Admin akan segera menerbitkan tagihan Anda.'
                    : 'Tagihan infaq akan muncul setelah pendaftaran Anda dinyatakan diterima.'}
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
                    <p className="text-sm font-medium">Instruksi Pembayaran:</p>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                      <li>Transfer sesuai nominal di atas ke salah satu rekening di atas.</li>
                      <li>Simpan struk / bukti transfer (format JPG, PNG, atau PDF).</li>
                      <li>Unggah bukti transfer pada form di bawah ini.</li>
                    </ol>
                    <p className="text-xs text-muted-foreground">
                      Infaq yang Anda pilih saat pendaftaran disimpan di backend dan dipakai sebagai tagihan setelah status PPDB diterima.
                    </p>
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
