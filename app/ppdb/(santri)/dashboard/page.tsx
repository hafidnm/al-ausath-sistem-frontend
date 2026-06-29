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
  GraduationCap,
  CheckCircle2,
  Percent,
  UploadCloud,
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
  getCorrectFrontendStep,
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
  const isSavingRef = useRef(false);
  const hasHydratedFromServerRef = useRef(false);
  const lastSavedSignatureRef = useRef('');
  // Flag ini hanya true ketika user klik tombol "Simpan Form PPDB" secara manual.
  // Digunakan agar redirect ke pengumuman/payment tidak terpicu oleh autosave.
  const hasUserSubmittedRef = useRef(false);

  // Isu 8: Preview URL untuk file yang baru dipilih (belum upload)
  const [filePreviewUrls, setFilePreviewUrls] = useState<{
    akta?: string;
    kk?: string;
    rekomendasi?: string;
    suratPernyataan?: string;
    buktiOrtuGuru?: string;
  }>({});


  // Isu 5: Teacher proof upload file (moved to infaq section, use buktiAnakGuruFile below)

  // Infaq & Anak Guru state (now merged into main form)
  const [pilihanUangGedung, setPilihanUangGedung] = useState<1 | 2>(1);
  const [pilihanInfaqBulanan, setPilihanInfaqBulanan] = useState<1 | 2>(1);
  const [isAnakGuru, setIsAnakGuru] = useState<boolean>(false);
  const [buktiAnakGuruFile, setBuktiAnakGuruFile] = useState<File | null>(null);
  const [buktiAnakGuruPreview, setBuktiAnakGuruPreview] = useState<string | null>(null);
  const buktiOrtuGuruRef = useRef<HTMLInputElement>(null);


  // Isu 4: Multi-student selector (satu email untuk beberapa siswa)
  const [selectedPendaftaranId, setSelectedPendaftaranId] = useState<number | null>(null);

  const clearAutoSaveTimer = useCallback(() => {
    if (!autoSaveTimerRef.current) return;
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = null;
  }, []);

  const resetPendingFiles = useCallback(() => {
    setFiles(initialPpdbDashboardFiles);
    setBuktiAnakGuruFile(null);
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

    // Sync infaq/anak-guru choices from server data
    if (data.pilihanUangGedung === 1 || data.pilihanUangGedung === 2) {
      setPilihanUangGedung(data.pilihanUangGedung);
    }
    if (data.pilihanInfaqBulanan === 1 || data.pilihanInfaqBulanan === 2) {
      setPilihanInfaqBulanan(data.pilihanInfaqBulanan);
    }
    if (typeof data.isAnakGuru === 'boolean') {
      setIsAnakGuru(data.isAnakGuru);
    }

    // Auto-redirect ke halaman sesuai flow
    const correctStep = getCorrectFrontendStep(data);

    if (correctStep === 'infaq') {
      router.replace('/ppdb/dashboard/infaq');
      return;
    }
    if (correctStep === 'tes') {
      router.replace('/ppdb/tes');
      return;
    }
    if (correctStep === 'pembayaran-ppdb') {
      router.replace('/ppdb/dashboard/pembayaran');
      return;
    }
    if (correctStep === 'siap-menjadi-santri') {
      router.replace('/ppdb/dashboard/siap-menjadi-santri');
      return;
    }
    if (correctStep === 'pengumuman' || correctStep === 'menunggu-pengumuman') {
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

    if (isSavingRef.current) {
      // Skip scheduling another autosave while a save is in progress
      return;
    }

    clearAutoSaveTimer();

    // Snapshot files at scheduling time so we only clear files that were actually sent
    const snapshotFiles = { ...files };
    const snapshotForm = { ...form };

    autoSaveTimerRef.current = setTimeout(() => {
      void (async () => {
        setAutoSaveStatus('saving');
        isSavingRef.current = true;

        const hasPendingFiles = Boolean(
          snapshotFiles.dokumenAkta
          || snapshotFiles.dokumenKk
          || snapshotFiles.dokumenRekomendasiUstadz
          || snapshotFiles.dokumenSuratPernyataan,
        );

        try {
          await updateForm({
            ...buildPpdbUpdatePayload(snapshotForm, snapshotFiles, data),
            is_anak_guru: isAnakGuru ? 1 : 0,
            pilihanUangGedung,
            pilihan_uang_gedung: pilihanUangGedung,
            pilihanInfaqBulanan,
            pilihan_infaq_bulanan: pilihanInfaqBulanan,
          });

          if (hasPendingFiles) {
            // Only clear the specific files that were sent, not newer ones
            setFiles((prev) => ({
              dokumenAkta: prev.dokumenAkta === snapshotFiles.dokumenAkta ? null : prev.dokumenAkta,
              dokumenKk: prev.dokumenKk === snapshotFiles.dokumenKk ? null : prev.dokumenKk,
              dokumenRekomendasiUstadz: prev.dokumenRekomendasiUstadz === snapshotFiles.dokumenRekomendasiUstadz ? null : prev.dokumenRekomendasiUstadz,
              dokumenSuratPernyataan: prev.dokumenSuratPernyataan === snapshotFiles.dokumenSuratPernyataan ? null : prev.dokumenSuratPernyataan,
            }));
            // Fetch refreshed dashboard from server and compute canonical signature
            const refreshed = await fetchDashboard();
            const refreshedForm = refreshed ? mapDashboardToForm(refreshed) : form;
            lastSavedSignatureRef.current = buildAutosaveSignature(refreshedForm, initialPpdbDashboardFiles);
          } else {
            lastSavedSignatureRef.current = currentSignature;
          }

          setLastAutoSaveAt(new Date());
          setAutoSaveStatus('saved');
        } catch {
          setAutoSaveStatus('error');
        } finally {
          isSavingRef.current = false;
        }
      })();
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      clearAutoSaveTimer();
    };
  }, [clearAutoSaveTimer, data, fetchDashboard, files, form, updateForm]);

  const [manualSaving, setManualSaving] = useState(false);

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

    // Validasi: semua dokumen wajib harus sudah terupload atau dipilih
    const allDocsUploadedOrSelected = Boolean(
      (data?.berkasAktaUrl || files.dokumenAkta) &&
      (data?.berkasKkUrl || files.dokumenKk) &&
      (data?.berkasRekomendasiUstadzUrl || files.dokumenRekomendasiUstadz) &&
      (data?.berkasSuratPernyataanUrl || files.dokumenSuratPernyataan)
    );

    if (!allDocsUploadedOrSelected) {
      toast({
        title: 'Dokumen belum lengkap',
        description:
          'Pilih atau upload semua dokumen wajib terlebih dahulu: Akta, KK, Rekomendasi Ustadz, dan Surat Pernyataan.',
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

    // Cancel any in-progress auto-save and take over
    clearAutoSaveTimer();

    setManualSaving(true);
    isSavingRef.current = true;
    // Tandai bahwa user secara eksplisit menekan simpan — mengaktifkan redirect setelah save
    hasUserSubmittedRef.current = true;
    setAutoSaveStatus('saving');

    try {
      await updateForm({
        ...buildPpdbUpdatePayload(form, files, data),
        is_anak_guru: isAnakGuru ? 1 : 0,
        pilihanUangGedung,
        pilihan_uang_gedung: pilihanUangGedung,
        pilihanInfaqBulanan,
        pilihan_infaq_bulanan: pilihanInfaqBulanan,
        ...(buktiAnakGuruFile ? { bukti_ortu_guru: buktiAnakGuruFile } : {}),
      });

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

      const correctStep = getCorrectFrontendStep(refreshedDashboard);

      if (correctStep === 'infaq') {
        router.replace('/ppdb/dashboard/infaq');
        return;
      }
      if (correctStep === 'tes') {
        router.replace('/ppdb/tes');
        return;
      }
      if (correctStep === 'pembayaran-ppdb') {
        router.replace('/ppdb/dashboard/pembayaran');
        return;
      }
      if (correctStep === 'siap-menjadi-santri') {
        router.replace('/ppdb/dashboard/siap-menjadi-santri');
        return;
      }
      if (correctStep === 'pengumuman' || correctStep === 'menunggu-pengumuman') {
        router.replace('/ppdb/dashboard/pengumuman');
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan form PPDB';
      setAutoSaveStatus('error');
      // Reset flag jika save gagal agar tidak ada redirect salah
      hasUserSubmittedRef.current = false;
      toast({
        title: 'Simpan form gagal',
        description: message,
        variant: 'destructive',
      });
    } finally {
      isSavingRef.current = false;
      setManualSaving(false);
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

        {/* Multi-student selector (Isu 4) */}
        {data?.daftarPendaftaran && data.daftarPendaftaran.length > 1 && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="student-selector" className="text-sm font-medium mb-2 block">
                    Pilih Siswa/Calon Santri
                  </Label>
                  <Select
                    value={selectedPendaftaranId ? String(selectedPendaftaranId) : ''}
                    onValueChange={(v) => setSelectedPendaftaranId(v ? Number(v) : null)}
                  >
                    <SelectTrigger id="student-selector">
                      <SelectValue placeholder="Pilih siswa..." />
                    </SelectTrigger>
                    <SelectContent>
                      {data.daftarPendaftaran.map((pendaftar) => (
                        <SelectItem key={pendaftar.id_pendaftaran} value={String(pendaftar.id_pendaftaran)}>
                          {pendaftar.nama_calon || 'Calon Santri'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-6">
                  <Info className="w-4 h-4" />
                  <span>Satu email untuk {data.daftarPendaftaran.length} siswa</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-4">
              <p className="text-xs text-primary/80 font-medium animate-pulse">Gelombang Pendaftaran</p>
              <p className="text-lg font-semibold text-primary mt-1">
                {data?.namaGelombang || 'Gelombang Umum'}
              </p>
              <p className="text-xs text-muted-foreground">Tahun Ajaran: {data?.tahunAjaran || '2026/2027'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Waktu Pendaftaran</p>
              <p className="text-lg font-semibold text-foreground mt-1">
                {formatDateTime(data?.waktuPendaftaran || '')}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Status Verifikasi</p>
              <div className="mt-1.5">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  data?.status === 'Diterima'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : data?.status === 'Ditolak'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {data?.status || 'Menunggu'}
                </span>
              </div>
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
                <Label>Nama Ayah <span className="text-destructive">*</span></Label>
                <Input
                  value={form.namaAyah}
                  onChange={(event) => setForm((prev) => ({ ...prev, namaAyah: event.target.value }))}
                  placeholder="Nama lengkap ayah kandung"
                />
              </div>
              <div className="space-y-2">
                <Label>No. Telepon Ayah <span className="text-destructive">*</span></Label>
                <Input
                  value={form.noHpAyah}
                  onChange={(event) => setForm((prev) => ({ ...prev, noHpAyah: event.target.value }))}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label>Nama Ibu <span className="text-destructive">*</span></Label>
                <Input
                  value={form.namaIbu}
                  onChange={(event) => setForm((prev) => ({ ...prev, namaIbu: event.target.value }))}
                  placeholder="Nama lengkap ibu kandung"
                />
              </div>
              <div className="space-y-2">
                <Label>No. Telepon Ibu <span className="text-destructive">*</span></Label>
                <Input
                  value={form.noHpIbu}
                  onChange={(event) => setForm((prev) => ({ ...prev, noHpIbu: event.target.value }))}
                  placeholder="08xxxxxxxxxx"
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
                { label: 'Bukti Orang Tua/Guru', value: data?.buktiOrtuGuruUrl },
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
                      { label: 'Bukti Orang Tua/Guru', value: data?.buktiOrtuGuruUrl },
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

            {/* ── Pilihan Infaq & Anak Guru ──────────────────────────────── */}
            <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/20">
              <p className="font-medium text-foreground text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary" />
                Pilihan Infaq Pendidikan
              </p>

              {/* Uang Gedung */}
              <div className="space-y-2">
                <Label className="text-sm">Pilihan Uang Gedung</Label>
                <div className="flex gap-3">
                  {([
                    { value: 1 as const, label: 'Pilihan A', display: 'Rp 1.500.000' },
                    { value: 2 as const, label: 'Pilihan B', display: 'Rp 2.000.000' },
                  ]).map((opsi) => (
                    <button
                      key={opsi.value}
                      type="button"
                      onClick={() => setPilihanUangGedung(opsi.value)}
                      className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all focus:outline-none ${
                        pilihanUangGedung === opsi.value
                          ? 'border-primary bg-primary text-primary-foreground shadow-md'
                          : 'border-border bg-background text-foreground hover:border-primary/60'
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

              {/* Infaq Bulanan */}
              <div className="space-y-2">
                <Label className="text-sm">Pilihan Infaq Bulanan / SPP</Label>
                <div className="flex gap-3">
                  {([
                    { value: 1 as const, label: 'Pilihan A', display: 'Rp 650.000 / bln' },
                    { value: 2 as const, label: 'Pilihan B', display: 'Rp 700.000 / bln' },
                  ]).map((opsi) => (
                    <button
                      key={opsi.value}
                      type="button"
                      onClick={() => setPilihanInfaqBulanan(opsi.value)}
                      className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all focus:outline-none ${
                        pilihanInfaqBulanan === opsi.value
                          ? 'border-amber-500 bg-amber-500 text-white shadow-md'
                          : 'border-border bg-background text-foreground hover:border-amber-400'
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
                  Infaq bulanan dibayarkan setelah santri masuk KBM (dibayar via portal santri setelah diterima).
                </p>
              </div>

              {/* Anak Guru */}
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-600" />
                  Anak Guru / Pengajar Pondok?
                </Label>
                <div className="flex gap-6">
                  {[
                    { label: 'Ya', val: true },
                    { label: 'Tidak', val: false },
                  ].map(({ label, val }) => (
                    <label key={label} className="flex items-center gap-2.5 cursor-pointer select-none">
                      <div
                        role="radio"
                        aria-checked={isAnakGuru === val}
                        tabIndex={0}
                        onClick={() => setIsAnakGuru(val)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsAnakGuru(val)}
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer focus:outline-none ${
                          isAnakGuru === val
                            ? 'border-amber-500 bg-amber-500'
                            : 'border-muted-foreground/40 hover:border-amber-400'
                        }`}
                      >
                        {isAnakGuru === val && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Upload bukti anak guru — hanya muncul jika isAnakGuru = true */}
                {isAnakGuru && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3 mt-2">
                    <p className="text-xs font-semibold text-amber-900 flex items-center gap-2">
                      <Paperclip className="w-3.5 h-3.5 text-amber-600" />
                      Upload Bukti Anak Guru <span className="text-destructive">*</span>
                    </p>
                    <p className="text-xs text-amber-700">
                      Surat keterangan atau bukti bahwa orang tua / wali adalah guru / pengajar pondok.
                      Format: JPG, PNG, PDF (maks. 5MB).
                    </p>
                    {data?.buktiOrtuGuruUrl && !buktiAnakGuruPreview && (
                      <div className="flex items-center gap-2 text-xs text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <a href={data.buktiOrtuGuruUrl} target="_blank" rel="noreferrer" className="underline">
                          Bukti tersimpan — klik untuk melihat
                        </a>
                        <span className="text-muted-foreground">(bisa diperbarui)</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 border-amber-300 text-amber-800 hover:bg-amber-50"
                        onClick={() => buktiOrtuGuruRef.current?.click()}
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Pilih File
                      </Button>
                      <input
                        type="file"
                        ref={buktiOrtuGuruRef}
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
                          <div className="p-3 bg-muted text-xs text-center">PDF: {buktiAnakGuruFile.name}</div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={buktiAnakGuruPreview} alt="Preview bukti anak guru" className="w-full h-auto object-contain max-h-40" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                <Info className="inline w-3 h-3 mr-1 text-primary" />
                Pilihan infaq disimpan bersama form pendaftaran. Tagihan SPP dan infaq bulanan hanya muncul di portal santri setelah diterima.
              </p>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <Button 
                  onClick={() => void handleSaveForm()} 
                  disabled={manualSaving}
                >
                  {manualSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  Simpan Form PPDB
                </Button>
                {!Boolean(
                  (data?.berkasAktaUrl || files.dokumenAkta) &&
                  (data?.berkasKkUrl || files.dokumenKk) &&
                  (data?.berkasRekomendasiUstadzUrl || files.dokumenRekomendasiUstadz) &&
                  (data?.berkasSuratPernyataanUrl || files.dokumenSuratPernyataan)
                ) && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span>⚠️ Pilih/upload semua dokumen wajib sebelum submit</span>
                  </p>
                )}
              </div>
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
