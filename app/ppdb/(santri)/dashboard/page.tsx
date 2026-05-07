"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  FileCheck,
  Download,
  FileUp,
  FileText,
  CalendarDays,
  Loader2,
  Paperclip,
  RefreshCw,
  UserCircle2,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  usePpdbPortalDashboard,
  usePpdbPortalUpdateForm,
} from '@/hooks/ppdb/santri';
import {
  buildPpdbUpdatePayload,
  formatAnnouncementDate,
  formatDateTime,
  isPpdbFormIncomplete,
  mapDashboardToForm,
  SURAT_PERNYATAAN_TEMPLATE_URL,
  wait,
} from '@/lib/ppdb/santri/dashboard';
import {
  initialPpdbDashboardFiles,
  initialPpdbDashboardForm,
  type PpdbDashboardFileState,
  type PpdbDashboardFormState,
} from '@/types/ppdb/santri/dashboard';

const AUTO_SAVE_DELAY_MS = 1500;

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const fileSignature = (file: File | null): string =>
  file ? `${file.name}:${file.size}:${file.lastModified}` : '';

const buildAutosaveSignature = (
  form: PpdbDashboardFormState,
  files: PpdbDashboardFileState,
): string =>
  JSON.stringify({
    ...form,
    _files: {
      dokumenAkta: fileSignature(files.dokumenAkta),
      dokumenKk: fileSignature(files.dokumenKk),
      dokumenRekomendasiUstadz: fileSignature(files.dokumenRekomendasiUstadz),
      dokumenSuratPernyataan: fileSignature(files.dokumenSuratPernyataan),
    },
  });

export default function PpdbDashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const {
    data,
    loading,
    fetchDashboard,
  } = usePpdbPortalDashboard();
  const { updateForm, loading: updateLoading } = usePpdbPortalUpdateForm();

  const [form, setForm] = useState(initialPpdbDashboardForm);

  const [files, setFiles] = useState(initialPpdbDashboardFiles);

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastAutoSaveAt, setLastAutoSaveAt] = useState<Date | null>(null);

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHydratedFromServerRef = useRef(false);
  const lastSavedSignatureRef = useRef('');

  // Isu 8: Preview URL untuk file yang baru dipilih (belum upload)
  const [filePreviewUrls, setFilePreviewUrls] = useState<{
    akta?: string;
    kk?: string;
    rekomendasi?: string;
    suratPernyataan?: string;
  }>({});

  const clearAutoSaveTimer = useCallback(() => {
    if (!autoSaveTimerRef.current) return;
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = null;
  }, []);

  const resetPendingFiles = useCallback(() => {
    setFiles(initialPpdbDashboardFiles);
    setFilePreviewUrls((prev) => {
      Object.values(prev).forEach((url) => {
        if (url?.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });

      return {};
    });
  }, []);

  const handleFileChange = (
    key: keyof typeof initialPpdbDashboardFiles,
    previewKey: 'akta' | 'kk' | 'rekomendasi' | 'suratPernyataan',
    file: File | null,
  ) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setFilePreviewUrls((prev) => {
      const currentUrl = prev[previewKey];
      if (currentUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }

      return {
        ...prev,
        [previewKey]: file ? URL.createObjectURL(file) : undefined,
      };
    });
  };

  useEffect(() => () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    Object.values(filePreviewUrls).forEach((url) => {
      if (url?.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  }, [filePreviewUrls]);



  useEffect(() => {
    void (async () => {
      let lastError: unknown;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await fetchDashboard();
          return;
        } catch (error) {
          lastError = error;
          await wait(300 * (attempt + 1));
        }
      }

      const message = lastError instanceof Error ? lastError.message : 'Gagal memuat dashboard PPDB';
      toast({
        title: 'Akses dashboard gagal',
        description: message,
        variant: 'destructive',
      });
    })();
  }, [fetchDashboard, toast]);

  useEffect(() => {
    if (!data) return;

    const mappedForm = mapDashboardToForm(data);
    setForm(mappedForm);
    lastSavedSignatureRef.current = buildAutosaveSignature(mappedForm, initialPpdbDashboardFiles);
    hasHydratedFromServerRef.current = true;
    setAutoSaveStatus('idle');

    // Auto-redirect ke halaman tes sesuai flow
    const hasSubmittedTesAnswer = Boolean((data.soalJawab || '').trim());
    const shouldGoTes = data.step === 'tes' && !hasSubmittedTesAnswer;

    if (shouldGoTes) {
      router.replace('/ppdb/tes');
      return;
    }

    if (data.step === 'pembayaran-ppdb' || data.step === 'siap-menjadi-santri') {
      router.replace('/ppdb/dashboard/pembayaran');
      return;
    }

    // Redirect ke pengumuman HANYA jika sudah benar-benar selesai:
    // - step menunggu-pengumuman/pengumuman, ATAU
    // - formCompleted DAN semua dokumen wajib sudah ada
    const allDocsUploaded = Boolean(
      data.berkasAktaUrl &&
      data.berkasKkUrl &&
      data.berkasRekomendasiUstadzUrl &&
      data.berkasSuratPernyataanUrl
    );

    const shouldGoPengumuman = Boolean(
      !shouldGoTes
      && (
        data.step === 'menunggu-pengumuman'
        || (data.step === 'pengumuman' && data.statusVerifikasi !== 'diterima' && data.statusVerifikasi !== 'lulus' && data.statusVerifikasi !== 'accepted')
        || (data.formCompleted && allDocsUploaded && data.step === 'menunggu-pengumuman')
      ),
    );

    if (shouldGoPengumuman) {
      router.replace('/ppdb/dashboard/pengumuman');
      return;
    }
  }, [data, router]);

  useEffect(() => {
    if (!data || !hasHydratedFromServerRef.current) return;

    const currentSignature = buildAutosaveSignature(form, files);
    if (currentSignature === lastSavedSignatureRef.current) {
      return;
    }

    const hasPendingFiles = Boolean(
      files.dokumenAkta
      || files.dokumenKk
      || files.dokumenRekomendasiUstadz
      || files.dokumenSuratPernyataan,
    );

    clearAutoSaveTimer();

    autoSaveTimerRef.current = setTimeout(() => {
      void (async () => {
        setAutoSaveStatus('saving');

        try {
          await updateForm(buildPpdbUpdatePayload(form, files, data));
          lastSavedSignatureRef.current = currentSignature;
          setLastAutoSaveAt(new Date());
          setAutoSaveStatus('saved');

          if (hasPendingFiles) {
            resetPendingFiles();
            await fetchDashboard();
          }
        } catch {
          setAutoSaveStatus('error');
        }
      })();
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      clearAutoSaveTimer();
    };
  }, [clearAutoSaveTimer, data, fetchDashboard, files, form, resetPendingFiles, updateForm]);

  const handleSaveForm = async () => {
    if (isPpdbFormIncomplete(form)) {
      toast({
        title: 'Form belum lengkap',
        description:
          'Lengkapi minimal data identitas calon santri serta data ayah/ibu terlebih dahulu.',
        variant: 'destructive',
      });
      return;
    }

    // Validasi: semua dokumen wajib harus sudah terupload
    const allDocsUploaded = Boolean(
      data?.berkasAktaUrl &&
      data?.berkasKkUrl &&
      data?.berkasRekomendasiUstadzUrl &&
      data?.berkasSuratPernyataanUrl
    );

    if (!allDocsUploaded) {
      toast({
        title: 'Dokumen belum lengkap',
        description:
          'Upload semua dokumen wajib terlebih dahulu: Akta, KK, Rekomendasi Ustadz, dan Surat Pernyataan.',
        variant: 'destructive',
      });
      return;
    }

    const hasPendingFiles = Boolean(
      files.dokumenAkta
      || files.dokumenKk
      || files.dokumenRekomendasiUstadz
      || files.dokumenSuratPernyataan,
    );

    clearAutoSaveTimer();
    setAutoSaveStatus('saving');

    try {
      await updateForm(buildPpdbUpdatePayload(form, files, data));

      if (hasPendingFiles) {
        resetPendingFiles();
      }

      const refreshedDashboard = await fetchDashboard();
      const refreshedForm = refreshedDashboard ? mapDashboardToForm(refreshedDashboard) : form;

      lastSavedSignatureRef.current = buildAutosaveSignature(
        refreshedForm,
        initialPpdbDashboardFiles,
      );
      setLastAutoSaveAt(new Date());
      setAutoSaveStatus('saved');

      toast({
        title: 'Form berhasil disimpan',
        description: 'Data pendaftar sudah diperbarui.',
      });

      const hasSubmittedTesAnswer = Boolean((refreshedDashboard?.soalJawab || '').trim());
      const shouldGoTes = Boolean(
        refreshedDashboard?.step === 'tes' && !hasSubmittedTesAnswer,
      );

      if (shouldGoTes) {
        router.replace('/ppdb/tes');
        return;
      }

      if (refreshedDashboard?.step === 'pembayaran-ppdb' || refreshedDashboard?.step === 'siap-menjadi-santri') {
        router.replace('/ppdb/dashboard/pembayaran');
        return;
      }

      // Cek semua dokumen wajib sudah terupload
      const allDocsUploaded = Boolean(
        refreshedDashboard?.berkasAktaUrl &&
        refreshedDashboard?.berkasKkUrl &&
        refreshedDashboard?.berkasRekomendasiUstadzUrl &&
        refreshedDashboard?.berkasSuratPernyataanUrl
      );

      const shouldGoPengumuman = Boolean(
        !shouldGoTes
        && (
          refreshedDashboard?.step === 'menunggu-pengumuman'
          || refreshedDashboard?.step === 'pengumuman'
          || refreshedDashboard?.pendaftaranSelesai
          || (refreshedDashboard?.formCompleted && allDocsUploaded)
        ),
      );

      if (shouldGoPengumuman) {
        router.replace('/ppdb/dashboard/pengumuman');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan form PPDB';
      setAutoSaveStatus('error');
      toast({
        title: 'Simpan form gagal',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const autoSaveDescription = useMemo(() => {
    if (autoSaveStatus === 'saving') {
      return 'Menyimpan otomatis...';
    }

    if (autoSaveStatus === 'error') {
      return 'Simpan otomatis gagal. Gunakan tombol Simpan Form PPDB.';
    }

    if (autoSaveStatus === 'saved' && lastAutoSaveAt) {
      return `Tersimpan otomatis pada ${formatDateTime(lastAutoSaveAt.toISOString())}.`;
    }

    return 'Simpan otomatis aktif. Perubahan akan disimpan otomatis.';
  }, [autoSaveStatus, lastAutoSaveAt]);



  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat dashboard pendaftar...
        </span>
      </div>
    );
  }

  const hasSubmittedTesAnswer = Boolean((data?.soalJawab || '').trim());
  const shouldShowTesSection = data?.step === 'tes' && !hasSubmittedTesAnswer;
  const shouldShowWaitingSection = Boolean(
    !shouldShowTesSection
      && (
        data?.step === 'menunggu-pengumuman'
        || (data?.step === 'pengumuman' && data?.statusVerifikasi !== 'diterima' && data?.statusVerifikasi !== 'lulus' && data?.statusVerifikasi !== 'accepted')
        || data?.formCompleted
        || hasSubmittedTesAnswer
      )
      && data?.step !== 'pembayaran-ppdb'
      && data?.step !== 'siap-menjadi-santri'
  );

  return (
    <div className="min-h-screen bg-background py-6 px-4 md:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Pendaftar PPDB</h1>
            <p className="text-muted-foreground">
              Lengkapi data dan ikuti tahapan tes (jika ada). Setelah selesai, silakan tunggu pengumuman selanjutnya.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void fetchDashboard()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link href="/ppdb/login">
              <Button variant="outline">Ganti Akun</Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-1 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Waktu Pendaftaran</p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {formatDateTime(data?.waktuPendaftaran || '')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="w-5 h-5 text-primary" />
              Form Data Pendaftar
            </CardTitle>
            <CardDescription>
              Setelah akun dibuat, lengkapi data profil pendaftar sesuai field PPDB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Program yang Ingin Didaftar</Label>
                <Select
                  value={form.program}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, program: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAUD">PAUD</SelectItem>
                    <SelectItem value="TK">TK</SelectItem>
                    <SelectItem value="MI">MI</SelectItem>
                    <SelectItem value="MTS">MTs</SelectItem>
                    <SelectItem value="MA">MA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Isu 7: Asal Sekolah — hanya untuk MI ke atas */}
              {['mi', 'mts', 'ma'].includes((form.program || '').trim().toLowerCase()) && (
                <div className="space-y-2">
                  <Label>
                    Asal Sekolah <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={form.asalSekolah}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, asalSekolah: event.target.value }))
                    }
                    placeholder="Nama sekolah asal calon santri"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input
                  value={form.namaLengkap}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, namaLengkap: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Lahir</Label>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-xs">Pilih tanggal lahir calon santri</span>
                  </div>
                  <Input
                    type="date"
                    value={form.tanggalLahir}
                    onChange={(event) => setForm((prev) => ({ ...prev, tanggalLahir: event.target.value }))}
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {form.tanggalLahir ? formatAnnouncementDate(form.tanggalLahir) : 'Belum dipilih'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select
                  value={form.jenisKelamin}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, jenisKelamin: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tempat Lahir</Label>
                <Input
                  value={form.tempatLahir}
                  onChange={(event) => setForm((prev) => ({ ...prev, tempatLahir: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>NIK Calon Santri</Label>
                <Input
                  value={form.nikCalonSantri}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, nikCalonSantri: event.target.value }))
                  }
                  placeholder="16 digit NIK"
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Ayah</Label>
                <Input
                  value={form.namaAyah}
                  onChange={(event) => setForm((prev) => ({ ...prev, namaAyah: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Penghasilan Ayah</Label>
                <Input
                  value={form.penghasilanAyah}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, penghasilanAyah: event.target.value }))
                  }
                  placeholder="Contoh: 2.500.000 / bulan"
                />
              </div>
              <div className="space-y-2">
                <Label>No HP</Label>
                <Input
                  value={form.noHpAyah}
                  onChange={(event) => setForm((prev) => ({ ...prev, noHpAyah: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Ibu</Label>
                <Input
                  value={form.namaIbu}
                  onChange={(event) => setForm((prev) => ({ ...prev, namaIbu: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>No HP Ibu</Label>
                <Input
                  value={form.noHpIbu}
                  onChange={(event) => setForm((prev) => ({ ...prev, noHpIbu: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Alamat Lengkap</Label>
              <Textarea
                value={form.alamatLengkap}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, alamatLengkap: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Riwayat Penyakit</Label>
              <Textarea
                value={form.riwayatPenyakit}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, riwayatPenyakit: event.target.value }))
                }
                placeholder="Kosongkan jika tidak ada"
              />
            </div>

            <div className="space-y-2">
              <Label>Surat Pernyataan</Label>
              <Textarea
                value={form.suratPernyataanText}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, suratPernyataanText: event.target.value }))
                }
                placeholder="Isi pernyataan komitmen orang tua/wali"
              />
            </div>

            <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/30">
              <p className="font-medium text-foreground inline-flex items-center gap-2">
                <FileUp className="w-4 h-4" />
                Upload Berkas Wajib
              </p>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="akta">Akta</Label>
                  <Input
                    id="akta"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(event) =>
                      handleFileChange('dokumenAkta', 'akta', event.target.files?.[0] || null)
                    }
                  />
                  {/* Preview file baru dipilih (isu 8) */}
                  {filePreviewUrls.akta && (
                    <div className="space-y-1">
                      {filePreviewUrls.akta.startsWith('blob:') && files.dokumenAkta?.type === 'application/pdf' ? (
                        <iframe src={filePreviewUrls.akta} className="w-full h-36 rounded border border-border/50" title="Preview Akta" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={filePreviewUrls.akta} alt="Preview Akta" className="max-h-28 rounded border border-border/50 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      )}
                    </div>
                  )}
                  {/* Link ke berkas yang sudah tersimpan */}
                  {data?.berkasAktaUrl && !filePreviewUrls.akta ? (
                    <a href={data.berkasAktaUrl} target="_blank" rel="noreferrer" download
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      Lihat Akta Tersimpan
                    </a>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kk">KK</Label>
                  <Input
                    id="kk"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(event) =>
                      handleFileChange('dokumenKk', 'kk', event.target.files?.[0] || null)
                    }
                  />
                  {filePreviewUrls.kk && (
                    <div className="space-y-1">
                      {files.dokumenKk?.type === 'application/pdf' ? (
                        <iframe src={filePreviewUrls.kk} className="w-full h-36 rounded border border-border/50" title="Preview KK" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={filePreviewUrls.kk} alt="Preview KK" className="max-h-28 rounded border border-border/50 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      )}
                    </div>
                  )}
                  {data?.berkasKkUrl && !filePreviewUrls.kk ? (
                    <a href={data.berkasKkUrl} target="_blank" rel="noreferrer" download
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      Lihat KK Tersimpan
                    </a>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="surat-rekomendasi">Surat Rekomendasi Ustadz</Label>
                  <Input
                    id="surat-rekomendasi"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(event) =>
                      handleFileChange('dokumenRekomendasiUstadz', 'rekomendasi', event.target.files?.[0] || null)
                    }
                  />
                  {filePreviewUrls.rekomendasi && (
                    <div className="space-y-1">
                      {files.dokumenRekomendasiUstadz?.type === 'application/pdf' ? (
                        <iframe src={filePreviewUrls.rekomendasi} className="w-full h-36 rounded border border-border/50" title="Preview Rekomendasi" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={filePreviewUrls.rekomendasi} alt="Preview Rekomendasi" className="max-h-28 rounded border border-border/50 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      )}
                    </div>
                  )}
                  {data?.berkasRekomendasiUstadzUrl && !filePreviewUrls.rekomendasi ? (
                    <a href={data.berkasRekomendasiUstadzUrl} target="_blank" rel="noreferrer" download
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      Lihat Rekomendasi Tersimpan
                    </a>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="surat-pernyataan">File Surat Pernyataan</Label>
                    <a
                      href={SURAT_PERNYATAAN_TEMPLATE_URL}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download Template
                    </a>
                  </div>
                  <Input
                    id="surat-pernyataan"
                    type="file"
                    accept=".pdf"
                    onChange={(event) =>
                      handleFileChange('dokumenSuratPernyataan', 'suratPernyataan', event.target.files?.[0] || null)
                    }
                  />
                  {filePreviewUrls.suratPernyataan && (
                    <iframe src={filePreviewUrls.suratPernyataan} className="w-full h-36 rounded border border-border/50" title="Preview Surat Pernyataan" />
                  )}
                  {data?.berkasSuratPernyataanUrl && !filePreviewUrls.suratPernyataan ? (
                    <a href={data.berkasSuratPernyataanUrl} target="_blank" rel="noreferrer" download
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      Lihat Surat Pernyataan Tersimpan
                    </a>
                  ) : null}
                </div>
              </div>

              {[
                { label: 'Akta', value: data?.berkasAktaUrl },
                { label: 'KK', value: data?.berkasKkUrl },
                { label: 'Akta/KK', value: data?.berkasAktaKkUrl },
                { label: 'Rekomendasi Ustadz', value: data?.berkasRekomendasiUstadzUrl },
                { label: 'Surat Pernyataan', value: data?.berkasSuratPernyataanUrl },
              ].some((item) => Boolean(item.value)) ? (
                <div className="rounded-lg border border-border p-4 bg-background space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Preview Berkas Terkumpul</p>
                    <p className="text-xs text-muted-foreground">
                      Klik buka untuk melihat file yang sudah tersimpan di sistem.
                    </p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { label: 'Akta', value: data?.berkasAktaUrl },
                      { label: 'KK', value: data?.berkasKkUrl },
                      { label: 'Akta/KK', value: data?.berkasAktaKkUrl },
                      { label: 'Rekomendasi Ustadz', value: data?.berkasRekomendasiUstadzUrl },
                      { label: 'Surat Pernyataan', value: data?.berkasSuratPernyataanUrl },
                    ]
                      .filter((item) => Boolean(item.value))
                      .map((item) => (
                        <div key={item.label} className="rounded-md border border-border/70 p-3 space-y-2">
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-medium text-foreground break-all">{item.value}</p>
                          <a
                            href={item.value || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <Paperclip className="w-3 h-3" />
                            Buka preview
                          </a>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Button 
                  onClick={() => void handleSaveForm()} 
                  disabled={updateLoading || !Boolean(
                    data?.berkasAktaUrl &&
                    data?.berkasKkUrl &&
                    data?.berkasRekomendasiUstadzUrl &&
                    data?.berkasSuratPernyataanUrl
                  )}
                >
                  {updateLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  Simpan Form PPDB
                </Button>
                {!Boolean(
                  data?.berkasAktaUrl &&
                  data?.berkasKkUrl &&
                  data?.berkasRekomendasiUstadzUrl &&
                  data?.berkasSuratPernyataanUrl
                ) && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span>⚠️ Upload semua dokumen wajib sebelum submit</span>
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{autoSaveDescription}</p>
            </div>
          </CardContent>
        </Card>

        {shouldShowTesSection ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                Tahap Tes Seleksi
              </CardTitle>
              <CardDescription>
                Admin PPDB telah mengaktifkan tes. Silakan lanjut ke halaman tes soal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {data.tesDescription || 'Kerjakan tes sesuai instruksi. Pastikan koneksi stabil sebelum mulai.'}
              </p>
              <Link href="/ppdb/tes">
                <Button>
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Buka Halaman Tes Soal
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : shouldShowWaitingSection ? (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Pendaftaran Berhasil Dikirim
              </CardTitle>
              <CardDescription>
                Form Anda sudah berhasil dikirimkan dan sedang dalam proses seleksi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-primary/20 p-4 bg-background space-y-3">
                <p className="text-sm font-medium text-foreground">
                  ✅ Silakan tunggu pengumuman selanjutnya.
                </p>
                <p className="text-sm text-muted-foreground">
                  Silakan cek website kami secara berkala untuk mendapatkan informasi terbaru hasil seleksi PPDB.
                </p>
                {data?.pengumumanDate ? (
                  <p className="text-sm text-muted-foreground">
                    📅 Estimasi Pengumuman:{' '}
                    <span className="font-medium text-foreground">
                      {formatAnnouncementDate(data.pengumumanDate)}
                    </span>
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
