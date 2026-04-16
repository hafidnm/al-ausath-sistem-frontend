"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const fallbackJenjangOptions = [
  "PAUD", "TK", "SD", "MI", "MTS", "MA", "MTQU", "MUTAWASITHAH", "ALIYAH",
]

export type PpdbStatus = "Menunggu" | "Terverifikasi" | "Diterima" | "Ditolak"

export const statusOptions: PpdbStatus[] = [
  "Menunggu", "Terverifikasi", "Diterima", "Ditolak",
]

export type PpdbFormState = {
  name: string
  programPendaftaran: string
  jenjang: string
  asalSekolah: string
  tanggalDaftar: string
  wali: string
  phone: string
  status: PpdbStatus
  jenisKelamin: string
  tempatLahir: string
  tanggalLahir: string
  nikCalonSantri: string
  alamatLengkap: string
  riwayatPenyakit: string
  namaAyah: string
  penghasilanAyah: string
  noHpCalon: string
  namaIbu: string
  noHpIbu: string
  email: string
}

export const emptyPendaftarForm: PpdbFormState = {
  name: "",
  programPendaftaran: "",
  jenjang: "",
  asalSekolah: "",
  tanggalDaftar: new Date().toISOString().slice(0, 16),
  wali: "",
  phone: "",
  status: "Menunggu",
  jenisKelamin: "",
  tempatLahir: "",
  tanggalLahir: "",
  nikCalonSantri: "",
  alamatLengkap: "",
  riwayatPenyakit: "",
  namaAyah: "",
  penghasilanAyah: "",
  noHpCalon: "",
  namaIbu: "",
  noHpIbu: "",
  email: "",
}

interface PpdbFormFieldsProps {
  idPrefix: string
  form: PpdbFormState
  programOptions: string[]
  onChange: (patch: Partial<PpdbFormState>) => void
  showStatus?: boolean
}

export function PpdbFormFields({
  idPrefix,
  form,
  programOptions,
  onChange,
  showStatus = true,
}: PpdbFormFieldsProps) {
  return (
    <div className="grid gap-4">
      {/* Nama + Program */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-nama`}>Nama Lengkap</Label>
          <Input
            id={`${idPrefix}-nama`}
            placeholder="Nama calon murid"
            value={form.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-program`}>Program Pendaftaran</Label>
          <Select
            value={form.programPendaftaran}
            onValueChange={(val) => onChange({ programPendaftaran: val })}
          >
            <SelectTrigger id={`${idPrefix}-program`}>
              <SelectValue placeholder="Pilih program" />
            </SelectTrigger>
            <SelectContent>
              {(programOptions.length > 0 ? programOptions : fallbackJenjangOptions).map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Jenjang + Asal Sekolah */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-jenjang`}>Jenjang Tujuan</Label>
          <Select
            value={form.jenjang}
            onValueChange={(val) => onChange({ jenjang: val })}
          >
            <SelectTrigger id={`${idPrefix}-jenjang`}>
              <SelectValue placeholder="Pilih jenjang" />
            </SelectTrigger>
            <SelectContent>
              {fallbackJenjangOptions.map((j) => (
                <SelectItem key={j} value={j}>{j}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-asal`}>Asal Sekolah/Kota</Label>
          <Input
            id={`${idPrefix}-asal`}
            placeholder="Nama sekolah / kota asal"
            value={form.asalSekolah}
            onChange={(e) => onChange({ asalSekolah: e.target.value })}
          />
        </div>
      </div>

      {/* Tanggal Daftar + Wali */}
      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor={`${idPrefix}-wali`}>Nomor Umi / Wali</Label>
          <Input
            id={`${idPrefix}-wali`}
            placeholder="Nomor Umi / Nama Wali"
            value={form.wali}
            onChange={(e) => onChange({ wali: e.target.value })}
          />
        </div>
      </div>

      {/* Phone + Email */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-phone`}>No. Telepon Wali</Label>
          <Input
            id={`${idPrefix}-phone`}
            placeholder="08xxxxxxxxxx"
            value={form.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
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
      </div>

      {/* Jenis Kelamin + Tanggal Lahir */}
      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor={`${idPrefix}-tgl-lahir`}>Tanggal Lahir</Label>
          <Input
            id={`${idPrefix}-tgl-lahir`}
            type="date"
            value={form.tanggalLahir}
            onChange={(e) => onChange({ tanggalLahir: e.target.value })}
          />
        </div>
      </div>

      {/* Tempat Lahir + NIK */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-tempat`}>Tempat Lahir</Label>
          <Input
            id={`${idPrefix}-tempat`}
            value={form.tempatLahir}
            onChange={(e) => onChange({ tempatLahir: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-nik`}>NIK Calon Santri</Label>
          <Input
            id={`${idPrefix}-nik`}
            value={form.nikCalonSantri}
            onChange={(e) => onChange({ nikCalonSantri: e.target.value })}
          />
        </div>
      </div>

      {/* Alamat */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-alamat`}>Alamat Lengkap</Label>
        <Textarea
          id={`${idPrefix}-alamat`}
          value={form.alamatLengkap}
          onChange={(e) => onChange({ alamatLengkap: e.target.value })}
        />
      </div>

      {/* Riwayat Penyakit */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-riwayat`}>Riwayat Penyakit</Label>
        <Textarea
          id={`${idPrefix}-riwayat`}
          value={form.riwayatPenyakit}
          onChange={(e) => onChange({ riwayatPenyakit: e.target.value })}
        />
      </div>

      {/* Nama Ayah + Penghasilan */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-ayah`}>Nama Ayah</Label>
          <Input
            id={`${idPrefix}-ayah`}
            value={form.namaAyah}
            onChange={(e) => onChange({ namaAyah: e.target.value })}
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

      {/* Nama Ibu + No HP Calon */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-ibu`}>Nama Ibu</Label>
          <Input
            id={`${idPrefix}-ibu`}
            value={form.namaIbu}
            onChange={(e) => onChange({ namaIbu: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-hp-calon`}>No. HP Calon</Label>
          <Input
            id={`${idPrefix}-hp-calon`}
            value={form.noHpCalon}
            onChange={(e) => onChange({ noHpCalon: e.target.value })}
          />
        </div>
      </div>

      {/* Status — opsional */}
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
  )
}
