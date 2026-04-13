"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck,
  FileCheck,
  Download,
  FileUp,
  FileText,
  Loader2,
  Paperclip,
  RefreshCw,
  UserCircle2,
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  usePpdbPortalAnnouncement,
  usePpdbPortalDashboard,
  usePpdbPortalUpdateForm,
} from '@/hooks/use-ppdb-portal';

const statusBadgeClass: Record<string, string> = {
  Menunggu: 'bg-chart-3/20 text-chart-4 border-0',
  Terverifikasi: 'bg-accent/20 text-accent border-0',
  Diterima: 'bg-primary/10 text-primary border-0',
  Ditolak: 'bg-destructive/10 text-destructive border-0',
};

const formatAnnouncementDate = (value: string): string => {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateTime = (value: string): string => {
  if (!value) return '-';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const SURAT_PERNYATAAN_TEMPLATE_URL = '/templates/SURAT%20PERNYATAAN%20ALIYAH.pdf';

const wait = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

export default function PpdbDashboardPage() {
  const { toast } = useToast();
  const {
    data,
    loading,
    fetchDashboard,
  } = usePpdbPortalDashboard();
  const { updateForm, loading: updateLoading } = usePpdbPortalUpdateForm();
  const {
    data: announcementResult,
    checkAnnouncement,
    loading: announcementLoading,
  } = usePpdbPortalAnnouncement();

  const [form, setForm] = useState({
    program: '',
    namaCalon: '',
    namaLengkap: '',
    jenjang: '',
    nomorUmi: '',
    asalKota: '',
    asalSekolah: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: '',
    nikCalonSantri: '',
    alamatLengkap: '',
    riwayatPenyakit: '',
    namaAyah: '',
    penghasilanAyah: '',
    noHpAyah: '',
    namaIbu: '',
    noHpIbu: '',
    soalJawab: '',
    suratPernyataanText: '',
  });

  const [files, setFiles] = useState({
    dokumenAkta: null as File | null,
    dokumenKk: null as File | null,
    dokumenRekomendasiUstadz: null as File | null,
    dokumenSuratPernyataan: null as File | null,
  });

  const [announcementId, setAnnouncementId] = useState('');

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

    setForm({
      program: data.program,
      namaCalon: data.namaCalon,
      namaLengkap: data.namaLengkap || data.namaCalon,
      jenjang: data.jenjang,
      nomorUmi: data.nomorUmi,
      asalKota: data.asalKota,
      asalSekolah: data.asalSekolah,
      tempatLahir: data.tempatLahir,
      tanggalLahir: data.tanggalLahir,
      jenisKelamin: data.jenisKelamin,
      nikCalonSantri: data.nikCalonSantri,
      alamatLengkap: data.alamatLengkap,
      riwayatPenyakit: data.riwayatPenyakit,
      namaAyah: data.namaAyah,
      penghasilanAyah: data.penghasilanAyah,
      noHpAyah: data.noHpAyah,
      namaIbu: data.namaIbu,
      noHpIbu: data.noHpIbu,
      soalJawab: data.soalJawab,
      suratPernyataanText: data.suratPernyataanText,
    });

    setAnnouncementId(data.noPendaftaran || data.idPendaftar || '');
  }, [data]);

  const currentStatus = useMemo(() => {
    if (announcementResult?.status) return announcementResult.status;
    return data?.status || 'Menunggu';
  }, [announcementResult?.status, data?.status]);

  const handleSaveForm = async () => {
    if (
      !form.namaLengkap.trim() ||
      !form.jenisKelamin ||
      !form.nikCalonSantri.trim() ||
      !form.alamatLengkap.trim() ||
      !form.tempatLahir.trim() ||
      !form.tanggalLahir ||
      !form.namaAyah.trim() ||
      !form.noHpAyah.trim() ||
      !form.namaIbu.trim() ||
      !form.noHpIbu.trim()
    ) {
      toast({
        title: 'Form belum lengkap',
        description:
          'Lengkapi minimal data identitas calon santri serta data ayah/ibu terlebih dahulu.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateForm({
        namaCalon: form.namaLengkap.trim(),
        namaLengkap: form.namaLengkap.trim(),
        program: form.program.trim(),
        jenjang: form.jenjang,
        nomorUmi: form.nomorUmi.trim(),
        asalKota: form.asalKota.trim(),
        asalSekolah: form.asalSekolah.trim(),
        tempatLahir: form.tempatLahir.trim(),
        tanggalLahir: form.tanggalLahir,
        jenisKelamin: form.jenisKelamin,
        nikCalonSantri: form.nikCalonSantri.trim(),
        alamatLengkap: form.alamatLengkap.trim(),
        riwayatPenyakit: form.riwayatPenyakit.trim(),
        namaAyah: form.namaAyah.trim(),
        penghasilanAyah: form.penghasilanAyah.trim(),
        noHpAyah: form.noHpAyah.trim(),
        namaIbu: form.namaIbu.trim(),
        noHpIbu: form.noHpIbu.trim(),
        soalJawab: data?.tesRequired ? form.soalJawab.trim() : undefined,
        suratPernyataanText: form.suratPernyataanText.trim(),
        dokumenAkta: files.dokumenAkta,
        dokumenKk: files.dokumenKk,
        dokumenRekomendasiUstadz: files.dokumenRekomendasiUstadz,
        dokumenSuratPernyataan: files.dokumenSuratPernyataan,
        emailPpdb: data?.email?.trim(),
      });

      await fetchDashboard();
      toast({
        title: 'Form berhasil disimpan',
        description: 'Data pendaftar sudah diperbarui.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan form PPDB';
      toast({
        title: 'Simpan form gagal',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleCheckAnnouncement = async () => {
    if (!announcementId.trim()) {
      toast({
        title: 'ID pendaftaran belum diisi',
        description: 'Masukkan ID atau nomor pendaftaran untuk cek hasil.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await checkAnnouncement(announcementId.trim());
      toast({
        title: 'Hasil pengumuman ditemukan',
        description: result.message || `Status Anda: ${result.status}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cek pengumuman gagal';
      toast({
        title: 'Cek pengumuman gagal',
        description: message,
        variant: 'destructive',
      });
    }
  };

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

  return (
    <div className="min-h-screen bg-background py-6 px-4 md:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Pendaftar PPDB</h1>
            <p className="text-muted-foreground">
              Lengkapi data, ikuti tahapan tes (jika ada), dan cek pengumuman hasil seleksi.
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

        <div className="grid md:grid-cols-3 gap-4">
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
              <p className="text-xs text-muted-foreground">ID Pendaftar</p>
              <p className="text-lg font-semibold text-foreground mt-1">{data?.idPendaftar || '-'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Nomor Pendaftaran</p>
              <p className="text-lg font-semibold text-foreground mt-1">{data?.noPendaftaran || '-'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Status Verifikasi</p>
              <Badge className={`mt-2 ${statusBadgeClass[currentStatus] || ''}`}>{currentStatus}</Badge>
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
              <div className="space-y-2">
                <Label>Nama Calon</Label>
                <Input
                  value={form.namaLengkap}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      namaLengkap: event.target.value,
                      namaCalon: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Jenjang</Label>
                <Select
                  value={form.jenjang}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, jenjang: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAUD">PAUD</SelectItem>
                    <SelectItem value="TK">TK</SelectItem>
                    <SelectItem value="MTQU">MTQU</SelectItem>
                    <SelectItem value="MUTAWASITHAH">MUTAWASITHAH</SelectItem>
                    <SelectItem value="ALIYAH">ALIYAH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nomor UMI</Label>
                <Input
                  value={form.nomorUmi}
                  onChange={(event) => setForm((prev) => ({ ...prev, nomorUmi: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Asal Kota</Label>
                <Input
                  value={form.asalKota}
                  onChange={(event) => setForm((prev) => ({ ...prev, asalKota: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Asal Sekolah</Label>
                <Input
                  value={form.asalSekolah}
                  onChange={(event) => setForm((prev) => ({ ...prev, asalSekolah: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tempat Lahir</Label>
                <Input
                  value={form.tempatLahir}
                  onChange={(event) => setForm((prev) => ({ ...prev, tempatLahir: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Lahir</Label>
                <Input
                  type="date"
                  value={form.tanggalLahir}
                  onChange={(event) => setForm((prev) => ({ ...prev, tanggalLahir: event.target.value }))}
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

            <div className="grid md:grid-cols-2 gap-4">
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
                <Label>No HP Ayah</Label>
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

            {data?.tesRequired ? (
              <div className="space-y-2">
                <Label>Soal Jawab</Label>
                <Textarea
                  value={form.soalJawab}
                  onChange={(event) => setForm((prev) => ({ ...prev, soalJawab: event.target.value }))}
                  placeholder="Isi jawaban jika admin memberi soal"
                />
              </div>
            ) : null}

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
                      setFiles((prev) => ({
                        ...prev,
                        dokumenAkta: event.target.files?.[0] || null,
                      }))
                    }
                  />
                  {data?.berkasAktaUrl ? (
                    <a
                      href={data.berkasAktaUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Paperclip className="w-3 h-3" />
                      Download Akta Tersimpan
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
                      setFiles((prev) => ({
                        ...prev,
                        dokumenKk: event.target.files?.[0] || null,
                      }))
                    }
                  />
                  {data?.berkasKkUrl ? (
                    <a
                      href={data.berkasKkUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Paperclip className="w-3 h-3" />
                      Download KK Tersimpan
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
                      setFiles((prev) => ({
                        ...prev,
                        dokumenRekomendasiUstadz: event.target.files?.[0] || null,
                      }))
                    }
                  />
                  {data?.berkasRekomendasiUstadzUrl ? (
                    <a
                      href={data.berkasRekomendasiUstadzUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Paperclip className="w-3 h-3" />
                      Download Rekomendasi Tersimpan
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
                      setFiles((prev) => ({
                        ...prev,
                        dokumenSuratPernyataan: event.target.files?.[0] || null,
                      }))
                    }
                  />
                  {data?.berkasSuratPernyataanUrl ? (
                    <a
                      href={data.berkasSuratPernyataanUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Paperclip className="w-3 h-3" />
                      Download Surat Pernyataan Tersimpan
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <Button onClick={() => void handleSaveForm()} disabled={updateLoading}>
              {updateLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              Simpan Form PPDB
            </Button>
          </CardContent>
        </Card>

        {data?.step === 'tes' ? (
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
        ) : null}

        {data?.step === 'menunggu-pengumuman' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                Menunggu Pengumuman
              </CardTitle>
              <CardDescription>
                Form Anda sudah lengkap. Silakan tunggu tanggal pengumuman hasil seleksi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tanggal Pengumuman: <span className="font-medium text-foreground">{formatAnnouncementDate(data.pengumumanDate)}</span>
              </p>
            </CardContent>
          </Card>
        ) : null}

        {data?.step === 'pengumuman' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                Form Pengumuman PPDB
              </CardTitle>
              <CardDescription>
                Masukkan ID pendaftaran untuk mengecek hasil: diterima, ditolak, atau masih diverifikasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>ID / Nomor Pendaftaran</Label>
                <Input
                  value={announcementId}
                  onChange={(event) => setAnnouncementId(event.target.value)}
                  placeholder="Masukkan ID atau nomor pendaftaran"
                />
              </div>
              <Button onClick={() => void handleCheckAnnouncement()} disabled={announcementLoading}>
                {announcementLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
                Cek Pengumuman
              </Button>

              {announcementResult ? (
                <div className="rounded-lg border border-border p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground">Nama Calon</p>
                  <p className="font-semibold text-foreground">{announcementResult.namaCalon || '-'}</p>
                  <div className="mt-3">
                    <Badge className={statusBadgeClass[announcementResult.status] || ''}>
                      {announcementResult.status}
                    </Badge>
                  </div>
                  {announcementResult.message ? (
                    <p className="text-sm text-muted-foreground mt-3">{announcementResult.message}</p>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
