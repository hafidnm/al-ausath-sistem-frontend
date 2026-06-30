"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CalendarDays,
  FileUp,
  GraduationCap,
  Info,
  Loader2,
  Percent,
  UploadCloud,
} from "lucide-react"
import type { PpdbPortalBillingInfo } from "@/types/ppdb/portal"

export const PROGRAM_OPTIONS = ["PAUD", "TK", "MI", "MTS", "MA"] as const

export type PpdbStatus = "Menunggu" | "Terverifikasi" | "Diterima" | "Ditolak"

export const statusOptions: PpdbStatus[] = [
  "Menunggu", "Terverifikasi", "Diterima", "Ditolak",
]

export type PpdbAdminFileState = {
  dokumenAkta: File | null
  dokumenKk: File | null
  dokumenRekomendasiUstadz: File | null
  dokumenSuratPernyataan: File | null
  buktiOrtuGuru: File | null
}

export const emptyPpdbAdminFiles: PpdbAdminFileState = {
  dokumenAkta: null,
  dokumenKk: null,
  dokumenRekomendasiUstadz: null,
  dokumenSuratPernyataan: null,
  buktiOrtuGuru: null,
}

export type PpdbFormState = {
  name: string
  program: string
  programPendaftaran: string
  jenjang: string
  asalSekolah: string
  tanggalDaftar: string
  jenisKelamin: string
  tempatLahir: string
  tanggalLahir: string
  nikCalonSantri: string
  alamatLengkap: string
  riwayatPenyakit: string
  suratPernyataanText: string
  namaAyah: string
  noHpAyah: string
  penghasilanAyah: string
  namaIbu: string
  noHpIbu: string
  email: string
  wali: string
  phone: string
  noHpCalon: string
  status: PpdbStatus
  pilihanUangGedung: 1 | 2
  pilihanInfaqBulanan: 1 | 2
  isAnakGuru: boolean
}

export const emptyPendaftarForm: PpdbFormState = {
  name: "",
  program: "",
  programPendaftaran: "",
  jenjang: "",
  asalSekolah: "",
  tanggalDaftar: new Date().toISOString().slice(0, 16),
  jenisKelamin: "",
  tempatLahir: "",
  tanggalLahir: "",
  nikCalonSantri: "",
  alamatLengkap: "",
  riwayatPenyakit: "",
  suratPernyataanText: "",
  namaAyah: "",
  noHpAyah: "",
  penghasilanAyah: "",
  namaIbu: "",
  noHpIbu: "",
  email: "",
  wali: "",
  phone: "",
  noHpCalon: "",
  status: "Menunggu",
  pilihanUangGedung: 1,
  pilihanInfaqBulanan: 1,
  isAnakGuru: false,
}

const requiresAsalSekolah = (program: string) =>
  ["mi", "mts", "ma"].includes((program || "").trim().toLowerCase())

export const isAdminPpdbFormIncomplete = (form: PpdbFormState): boolean => {
  const program = (form.program || form.programPendaftaran || form.jenjang || "").trim()
  return (
    !program ||
    !form.name.trim() ||
    !form.jenisKelamin ||
    !form.nikCalonSantri.trim() ||
    !form.alamatLengkap.trim() ||
    !form.tempatLahir.trim() ||
    !form.tanggalLahir ||
    !form.namaAyah.trim() ||
    !form.noHpAyah.trim() ||
    !form.namaIbu.trim() ||
    !form.noHpIbu.trim() ||
    (requiresAsalSekolah(program) && !form.asalSekolah.trim())
  )
}

interface PpdbFormFieldsProps {
  idPrefix: string
  form: PpdbFormState
  programOptions?: string[]
  onChange: (patch: Partial<PpdbFormState>) => void
  showStatus?: boolean
  showAdminMeta?: boolean
  showDocuments?: boolean
  showInfaq?: boolean
  files?: PpdbAdminFileState
  onFileChange?: (key: keyof PpdbAdminFileState, file: File | null) => void
  billingInfo?: PpdbPortalBillingInfo | null
  billingLoading?: boolean
}

export function PpdbFormFields({
  idPrefix,
  form,
  programOptions = [...PROGRAM_OPTIONS],
  onChange,
  showStatus = true,
  showAdminMeta = true,
  showDocuments = false,
  showInfaq = false,
  files = emptyPpdbAdminFiles,
  onFileChange,
  billingInfo = null,
  billingLoading = false,
}: PpdbFormFieldsProps) {
  const program = form.program || form.programPendaftaran || form.jenjang
  const uangGedungOptions = billingInfo?.uangGedungOptions ?? []
  const infaqOptions = billingInfo?.infaqBulananOptions ?? []

  const handleProgramChange = (value: string) => {
    onChange({
      program: value,
      programPendaftaran: value,
      jenjang: value,
      pilihanUangGedung: 1,
      pilihanInfaqBulanan: 1,
    })
  }

  return (
    <div className="grid gap-5">
      {/* Program + Asal Sekolah */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-program`}>Program yang Ingin Didaftar</Label>
          <Select value={program} onValueChange={handleProgramChange}>
            <SelectTrigger id={`${idPrefix}-program`}>
              <SelectValue placeholder="Pilih program" />
            </SelectTrigger>
            <SelectContent>
              {programOptions.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {requiresAsalSekolah(program) && (
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-asal`}>
              Asal Sekolah <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${idPrefix}-asal`}
              placeholder="Nama sekolah asal calon santri"
              value={form.asalSekolah}
              onChange={(e) => onChange({ asalSekolah: e.target.value })}
            />
          </div>
        )}
      </div>

      {/* Identitas */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-nama`}>Nama Lengkap</Label>
          <Input
            id={`${idPrefix}-nama`}
            placeholder="Nama calon santri"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-jk`}>Jenis Kelamin</Label>
          <Select value={form.jenisKelamin} onValueChange={(val) => onChange({ jenisKelamin: val })}>
            <SelectTrigger id={`${idPrefix}-jk`}>
              <SelectValue placeholder="Pilih jenis kelamin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="L">Laki-laki</SelectItem>
              <SelectItem value="P">Perempuan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-tempat`}>Tempat Lahir</Label>
          <Input
            id={`${idPrefix}-tempat`}
            value={form.tempatLahir}
            onChange={(e) => onChange({ tempatLahir: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-tgl-lahir`}>Tanggal Lahir</Label>
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CalendarDays className="w-4 h-4" />
              <span className="text-xs">Pilih tanggal lahir calon santri</span>
            </div>
            <Input
              id={`${idPrefix}-tgl-lahir`}
              type="date"
              value={form.tanggalLahir}
              onChange={(e) => onChange({ tanggalLahir: e.target.value })}
              className="bg-background"
            />
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`${idPrefix}-nik`}>NIK Calon Santri</Label>
          <Input
            id={`${idPrefix}-nik`}
            placeholder="16 digit NIK"
            value={form.nikCalonSantri}
            onChange={(e) => onChange({ nikCalonSantri: e.target.value })}
          />
        </div>
      </div>

      {/* Orang tua */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-ayah`}>
            Nama Ayah <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-ayah`}
            placeholder="Nama lengkap ayah kandung"
            value={form.namaAyah}
            onChange={(e) => onChange({ namaAyah: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-hp-ayah`}>
            No. Telepon Ayah <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-hp-ayah`}
            placeholder="08xxxxxxxxxx"
            value={form.noHpAyah}
            onChange={(e) => onChange({ noHpAyah: e.target.value, noHpCalon: e.target.value, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-ibu`}>
            Nama Ibu <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-ibu`}
            placeholder="Nama lengkap ibu kandung"
            value={form.namaIbu}
            onChange={(e) => onChange({ namaIbu: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-hp-ibu`}>
            No. Telepon Ibu <span className="text-destructive">*</span>
          </Label>
          <Input
            id={`${idPrefix}-hp-ibu`}
            placeholder="08xxxxxxxxxx"
            value={form.noHpIbu}
            onChange={(e) => onChange({ noHpIbu: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-penghasilan`}>Penghasilan Ayah</Label>
          <Input
            id={`${idPrefix}-penghasilan`}
            value={form.penghasilanAyah}
            onChange={(e) => onChange({ penghasilanAyah: e.target.value })}
          />
        </div>
      </div>

      {/* Alamat & kesehatan */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-alamat`}>Alamat Lengkap</Label>
        <Textarea
          id={`${idPrefix}-alamat`}
          value={form.alamatLengkap}
          onChange={(e) => onChange({ alamatLengkap: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-riwayat`}>Riwayat Penyakit</Label>
        <Textarea
          id={`${idPrefix}-riwayat`}
          placeholder="Kosongkan jika tidak ada"
          value={form.riwayatPenyakit}
          onChange={(e) => onChange({ riwayatPenyakit: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-surat-text`}>Surat Pernyataan</Label>
        <Textarea
          id={`${idPrefix}-surat-text`}
          placeholder="Isi pernyataan komitmen orang tua/wali"
          value={form.suratPernyataanText}
          onChange={(e) => onChange({ suratPernyataanText: e.target.value })}
        />
      </div>

      {/* Upload berkas */}
      {showDocuments && onFileChange && (
        <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/30">
          <p className="font-medium text-foreground inline-flex items-center gap-2">
            <FileUp className="w-4 h-4" />
            Upload Berkas Wajib
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {([
              ["dokumenAkta", "Akta", ".pdf,.jpg,.jpeg,.png,.doc,.docx"],
              ["dokumenKk", "KK", ".pdf,.jpg,.jpeg,.png,.doc,.docx"],
              ["dokumenRekomendasiUstadz", "Surat Rekomendasi Ustadz", ".pdf,.jpg,.jpeg,.png,.doc,.docx"],
              ["dokumenSuratPernyataan", "File Surat Pernyataan", ".pdf"],
            ] as const).map(([key, label, accept]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`${idPrefix}-${key}`}>{label}</Label>
                <Input
                  id={`${idPrefix}-${key}`}
                  type="file"
                  accept={accept}
                  onChange={(e) => onFileChange(key, e.target.files?.[0] || null)}
                />
                {files[key] && (
                  <p className="text-xs text-muted-foreground truncate">{files[key]?.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infaq */}
      {showInfaq && program && (
        <div className="rounded-lg border border-border p-4 space-y-4 bg-muted/20">
          <p className="font-medium text-sm flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            Pilihan Infaq Pendidikan
            <span className="text-xs font-normal text-muted-foreground">— Jenjang {program}</span>
          </p>

          {billingLoading ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat pilihan infaq...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-sm">Pilihan Uang Gedung</Label>
                <div className="flex gap-3">
                  {(uangGedungOptions.length > 0 ? uangGedungOptions : [
                    { value: 1 as const, label: "Pilihan A", display: "Pilihan A" },
                    { value: 2 as const, label: "Pilihan B", display: "Pilihan B" },
                  ]).map((opsi) => (
                    <button
                      key={opsi.value}
                      type="button"
                      onClick={() => onChange({ pilihanUangGedung: opsi.value })}
                      className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                        form.pilihanUangGedung === opsi.value
                          ? "border-primary bg-primary text-primary-foreground shadow-md"
                          : "border-border bg-background hover:border-primary/60"
                      }`}
                    >
                      <span className="block text-xs font-normal mb-0.5 opacity-80">{opsi.label}</span>
                      {opsi.display}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Pilihan Infaq Bulanan / SPP</Label>
                <div className="flex gap-3">
                  {(infaqOptions.length > 0 ? infaqOptions : [
                    { value: 1 as const, label: "Pilihan A", display: "Pilihan A" },
                    { value: 2 as const, label: "Pilihan B", display: "Pilihan B" },
                  ]).map((opsi) => (
                    <button
                      key={opsi.value}
                      type="button"
                      onClick={() => onChange({ pilihanInfaqBulanan: opsi.value })}
                      className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all ${
                        form.pilihanInfaqBulanan === opsi.value
                          ? "border-amber-500 bg-amber-500 text-white shadow-md"
                          : "border-border bg-background hover:border-amber-400"
                      }`}
                    >
                      <span className="block text-xs font-normal mb-0.5 opacity-80">{opsi.label}</span>
                      {opsi.display}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-amber-600" />
                  Anak Guru / Pengajar Pondok?
                </Label>
                <div className="flex gap-6">
                  {([
                    { label: "Ya", val: true },
                    { label: "Tidak", val: false },
                  ]).map(({ label, val }) => (
                    <label key={label} className="flex items-center gap-2.5 cursor-pointer select-none">
                      <div
                        role="radio"
                        aria-checked={form.isAnakGuru === val}
                        tabIndex={0}
                        onClick={() => onChange({ isAnakGuru: val })}
                        onKeyDown={(e) => e.key === "Enter" && onChange({ isAnakGuru: val })}
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center cursor-pointer ${
                          form.isAnakGuru === val
                            ? "border-amber-500 bg-amber-500"
                            : "border-muted-foreground/40 hover:border-amber-400"
                        }`}
                      >
                        {form.isAnakGuru === val && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </label>
                  ))}
                </div>

                {form.isAnakGuru && onFileChange && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3 mt-2">
                    <p className="text-xs font-semibold text-amber-900 flex items-center gap-2">
                      <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                      Upload Bukti Anak Guru
                    </p>
                    <Input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) => onFileChange("buktiOrtuGuru", e.target.files?.[0] || null)}
                    />
                    {files.buktiOrtuGuru && (
                      <p className="text-xs text-muted-foreground">{files.buktiOrtuGuru.name}</p>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                <Info className="inline w-3 h-3 mr-1 text-primary" />
                Pilihan infaq disimpan bersama data pendaftaran.
              </p>
            </>
          )}
        </div>
      )}

      {/* Admin meta */}
      {showAdminMeta && (
        <div className="rounded-lg border border-dashed border-border p-4 space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Informasi Admin</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-tgl-daftar`}>Tanggal Daftar</Label>
              <Input
                id={`${idPrefix}-tgl-daftar`}
                type="datetime-local"
                value={form.tanggalDaftar}
                onChange={(e) => onChange({ tanggalDaftar: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-email`}>Email</Label>
              <Input
                id={`${idPrefix}-email`}
                type="email"
                placeholder="email@contoh.com"
                value={form.email}
                onChange={(e) => onChange({ email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-umi`}>Nomor Umi / Wali</Label>
              <Input
                id={`${idPrefix}-umi`}
                placeholder="Nomor Umi / Nama Wali"
                value={form.wali}
                onChange={(e) => onChange({ wali: e.target.value })}
              />
            </div>
          </div>
          {showStatus && (
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-status`}>Status Pendaftaran</Label>
              <Select
                value={form.status}
                onValueChange={(val) => onChange({ status: val as PpdbStatus })}
              >
                <SelectTrigger id={`${idPrefix}-status`}>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
