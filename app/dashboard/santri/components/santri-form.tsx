"use client"

import { useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle } from "lucide-react"
import { dataKelasService } from "@/lib/services/kelas.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { useUnit } from "@/contexts/unit-context"
import { DataSantriApiItem, DataSantriPayload } from "@/lib/services/santri.service"

export interface SantriFormState {
  nomor_induk: string
  nama_lengkap_santri: string
  kode_kelas: string
  status: string
  tahun_masuk: string
  tahun_lulus: string
  jenis_kelamin: string
  tempat_lahir: string
  tanggal_lahir: string
  agama: string
  berat_badan: string
  tinggi_badan: string
  gol_darah: string
  provinsi: string
  kota_kabupaten: string
  kecamatan: string
  kelurahan: string
  alamat_tinggal: string
  hobi: string
  jumlah_saudara: number
  nomor_telepon: string
  alamat_email: string
  nama_ayah_kandung: string
  nama_ibu_kandung: string
  nama_wali: string
}

export interface SantriAccountState {
  create_account: boolean
  nama_akun: string
  password: string
  password_confirmation: string
  status_akun: "AKTIF" | "NONAKTIF"
}

export interface SantriFormSubmitValues extends SantriFormState, SantriAccountState {}

export interface SantriFormProps {
  mode: "create" | "edit"
  title: string
  description: string
  initialData?: Partial<SantriFormState>
  initialAccount?: Partial<SantriAccountState>
  showAccountSection?: boolean
  submitLabel: string
  onSubmit: (values: SantriFormSubmitValues) => Promise<void> | void
  onCancel: () => void
}

interface KelasOption {
  value: string
  label: string
}

const defaultState: SantriFormState = {
  nomor_induk: "",
  nama_lengkap_santri: "",
  kode_kelas: "",
  status: "AKTIF",
  tahun_masuk: "",
  tahun_lulus: "",
  jenis_kelamin: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  agama: "",
  berat_badan: "",
  tinggi_badan: "",
  gol_darah: "",
  provinsi: "",
  kota_kabupaten: "",
  kecamatan: "",
  kelurahan: "",
  alamat_tinggal: "",
  hobi: "",
  jumlah_saudara: 0,
  nomor_telepon: "",
  alamat_email: "",
  nama_ayah_kandung: "",
  nama_ibu_kandung: "",
  nama_wali: "",
}

const defaultAccountState: SantriAccountState = {
  create_account: false,
  nama_akun: "",
  password: "",
  password_confirmation: "",
  status_akun: "AKTIF",
}

const toText = (value: unknown): string => {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return ""
}

const toDateInputValue = (value: unknown): string => {
  const text = toText(value).trim()
  if (!text) return ""

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) {
    return text.slice(0, 10)
  }

  return date.toISOString().slice(0, 10)
}

const toSantriFormState = (initialData?: Partial<SantriFormState> | DataSantriApiItem): SantriFormState => ({
  nomor_induk: toText(initialData?.nomor_induk),
  nama_lengkap_santri: toText(initialData?.nama_lengkap_santri),
  kode_kelas: toText(initialData?.kode_kelas),
  status: toText(initialData?.status).toUpperCase() || "AKTIF",
  tahun_masuk: toText(initialData?.tahun_masuk),
  tahun_lulus: toText(initialData?.tahun_lulus),
  jenis_kelamin: toText(initialData?.jenis_kelamin).toUpperCase(),
  tempat_lahir: toText(initialData?.tempat_lahir),
  tanggal_lahir: toDateInputValue(initialData?.tanggal_lahir),
  agama: toText(initialData?.agama),
  berat_badan: toText(initialData?.berat_badan),
  tinggi_badan: toText(initialData?.tinggi_badan),
  gol_darah: toText(initialData?.gol_darah).toUpperCase(),
  provinsi: toText(initialData?.provinsi),
  kota_kabupaten: toText(initialData?.kota_kabupaten),
  kecamatan: toText(initialData?.kecamatan),
  kelurahan: toText(initialData?.kelurahan),
  alamat_tinggal: toText(initialData?.alamat_tinggal),
  hobi: toText(initialData?.hobi),
  jumlah_saudara: Number(toText(initialData?.jumlah_saudara)),
  nomor_telepon: toText(initialData?.nomor_telepon),
  alamat_email: toText(initialData?.alamat_email),
  nama_ayah_kandung: toText(initialData?.nama_ayah_kandung),
  nama_ibu_kandung: toText(initialData?.nama_ibu_kandung),
  nama_wali: toText(initialData?.nama_wali),
})

const toAccountState = (initialAccount?: Partial<SantriAccountState>): SantriAccountState => ({
  create_account: initialAccount?.create_account ?? false,
  nama_akun: toText(initialAccount?.nama_akun),
  password: toText(initialAccount?.password),
  password_confirmation: toText(initialAccount?.password_confirmation),
  status_akun: initialAccount?.status_akun ?? "AKTIF",
})

const createEmptyKelasOptions = (): KelasOption[] => []

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!error || typeof error !== "object") return fallback

  const err = error as {
    response?: {
      data?: {
        message?: string
        errors?: Record<string, string[]>
      }
    }
    message?: string
  }

  const errors = err.response?.data?.errors
  const firstError = errors ? Object.values(errors).flat().find(Boolean) : undefined

  return firstError || err.response?.data?.message || err.message || fallback
}

const toApiDateTime = (value: string): string | null => {
  const text = value.trim()
  if (!text) return null
  if (text.includes("T")) return text
  return `${text}T00:00:00Z`
}

export function santriFormToPayload(values: SantriFormState): DataSantriPayload {
  return {
    nomor_induk: values.nomor_induk.trim(),
    nama_lengkap_santri: values.nama_lengkap_santri.trim(),
    kode_kelas: values.kode_kelas.trim(),
    status: values.status || null,
    tahun_masuk: values.tahun_masuk.trim() ? Number(values.tahun_masuk) : null,
    tahun_lulus: values.tahun_lulus.trim() ? Number(values.tahun_lulus) : null,
    jenis_kelamin: values.jenis_kelamin.trim() || null,
    tempat_lahir: values.tempat_lahir.trim() || null,
    tanggal_lahir: toApiDateTime(values.tanggal_lahir),
    agama: values.agama.trim() || null,
    berat_badan: values.berat_badan.trim() ? Number(values.berat_badan) : null,
    tinggi_badan: values.tinggi_badan.trim() ? Number(values.tinggi_badan) : null,
    gol_darah: values.gol_darah.trim() || null,
    provinsi: values.provinsi.trim() || null,
    kota_kabupaten: values.kota_kabupaten.trim() || null,
    kecamatan: values.kecamatan.trim() || null,
    kelurahan: values.kelurahan.trim() || null,
    alamat_tinggal: values.alamat_tinggal.trim() || null,
    hobi: values.hobi.trim() || null,
    jumlah_saudara: values.jumlah_saudara ? Number(values.jumlah_saudara) : null,
    nomor_telepon: values.nomor_telepon.trim() || null,
    alamat_email: values.alamat_email.trim() || null,
    nama_ayah_kandung: values.nama_ayah_kandung.trim() || null,
    nama_ibu_kandung: values.nama_ibu_kandung.trim() || null,
    nama_wali: values.nama_wali.trim() || null,
  }
}

export function SantriForm({
  mode,
  title,
  description,
  initialData,
  initialAccount,
  showAccountSection = false,
  submitLabel,
  onSubmit,
  onCancel,
}: SantriFormProps) {
  const [formData, setFormData] = useState<SantriFormState>(() => ({ ...defaultState, ...toSantriFormState(initialData) }))
  const [accountData, setAccountData] = useState<SantriAccountState>(() => ({
    ...defaultAccountState,
    ...toAccountState(initialAccount),
  }))
  const [kelasOptions, setKelasOptions] = useState<KelasOption[]>(createEmptyKelasOptions)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { selectedKodeTahun } = useTahunAjaran()
  const { selectedKodeUnit } = useUnit()

  const isCreateMode = mode === "create"

  useEffect(() => {
    setFormData({ ...defaultState, ...toSantriFormState(initialData) })
  }, [initialData])

  useEffect(() => {
    setAccountData({ ...defaultAccountState, ...toAccountState(initialAccount) })
  }, [initialAccount])

  useEffect(() => {
    const loadOptions = async () => {
      if (!selectedKodeTahun) return
      
      try {
        const result = await dataKelasService.getAll({ 
          page: 1, 
          per_page: 300,
          tahun_ajaran: selectedKodeTahun,
          kode_unit: selectedKodeUnit || undefined,
          status: "AKTIF"
        })
        const seen = new Set<string>()
        const mapped: KelasOption[] = []

        for (const item of result.data) {
          const code = toText(item.kode_kelas).trim()
          if (!code || seen.has(code)) continue

          seen.add(code)
          mapped.push({
            value: code,
            label: toText(item.nama_kelas).trim() || code,
          })
        }

        setKelasOptions(mapped)
      } catch {
        setKelasOptions([])
      }
    }

    void loadOptions()
  }, [selectedKodeTahun, selectedKodeUnit])

  const updateField = (key: keyof SantriFormState, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setError("")
  }

  const updateAccountField = (key: keyof SantriAccountState, value: string | boolean) => {
    setAccountData((prev) => ({ ...prev, [key]: value } as SantriAccountState))
    setError("")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formData.nomor_induk.trim() || !formData.nama_lengkap_santri.trim() || !formData.kode_kelas.trim()) {
      setError("Nomor induk, nama lengkap, dan kelas wajib diisi.")
      return
    }

    if (showAccountSection && accountData.create_account) {
      if (!accountData.nama_akun.trim() || !accountData.password.trim()) {
        setError("Nama akun dan password wajib diisi jika akun akan dibuat.")
        return
      }

      if (accountData.password.trim().length < 6) {
        setError("Password minimal 6 karakter.")
        return
      }

      if (accountData.password !== accountData.password_confirmation) {
        setError("Konfirmasi password tidak sama.")
        return
      }
    }

    try {
      setIsSubmitting(true)
      setError("")

      await onSubmit({
        ...formData,
        ...accountData,
      })
    } catch (err) {
      setError(getErrorMessage(err, "Gagal menyimpan data santri."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert className="border-destructive/30 bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="ml-2 text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Identitas Santri</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nomor_induk">Nomor Induk *</Label>
                <Input id="nomor_induk" value={formData.nomor_induk} onChange={(event) => updateField("nomor_induk", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_lengkap_santri">Nama Lengkap *</Label>
                <Input id="nama_lengkap_santri" value={formData.nama_lengkap_santri} onChange={(event) => updateField("nama_lengkap_santri", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                <Select value={formData.jenis_kelamin || undefined} onValueChange={(value) => updateField("jenis_kelamin", value)}>
                  <SelectTrigger id="jenis_kelamin">
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Laki-laki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kode_kelas">Kelas *</Label>
                {kelasOptions.length > 0 ? (
                  <Select value={formData.kode_kelas || undefined} onValueChange={(value) => updateField("kode_kelas", value)}>
                    <SelectTrigger id="kode_kelas">
                      <SelectValue placeholder="Pilih kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {kelasOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input id="kode_kelas" value={formData.kode_kelas} onChange={(event) => updateField("kode_kelas", event.target.value)} placeholder="Kode kelas" />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempat_lahir">Tempat Lahir</Label>
                <Input id="tempat_lahir" value={formData.tempat_lahir} onChange={(event) => updateField("tempat_lahir", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_lahir">Tanggal Lahir</Label>
                <Input id="tanggal_lahir" type="date" value={formData.tanggal_lahir} onChange={(event) => updateField("tanggal_lahir", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agama">Agama</Label>
                <Input id="agama" value={formData.agama} onChange={(event) => updateField("agama", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gol_darah">Golongan Darah</Label>
                <Input id="gol_darah" value={formData.gol_darah} onChange={(event) => updateField("gol_darah", event.target.value)} placeholder="A / B / AB / O" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Data Akademik</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="CUTI">Cuti</SelectItem>
                    <SelectItem value="LULUS">Lulus</SelectItem>
                    <SelectItem value="KELUAR">Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tahun_masuk">Tahun Masuk</Label>
                <Input id="tahun_masuk" type="number" value={formData.tahun_masuk} onChange={(event) => updateField("tahun_masuk", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tahun_lulus">Tahun Lulus</Label>
                <Input id="tahun_lulus" type="number" value={formData.tahun_lulus} onChange={(event) => updateField("tahun_lulus", event.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Data Fisik</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="berat_badan">Berat Badan</Label>
                <Input id="berat_badan" type="number" value={formData.berat_badan} onChange={(event) => updateField("berat_badan", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tinggi_badan">Tinggi Badan</Label>
                <Input id="tinggi_badan" type="number" value={formData.tinggi_badan} onChange={(event) => updateField("tinggi_badan", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hobi">Hobi</Label>
                <Input id="hobi" value={formData.hobi} onChange={(event) => updateField("hobi", event.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Alamat Domisili</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="provinsi">Provinsi</Label>
                <Input id="provinsi" value={formData.provinsi} onChange={(event) => updateField("provinsi", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kota_kabupaten">Kota/Kabupaten</Label>
                <Input id="kota_kabupaten" value={formData.kota_kabupaten} onChange={(event) => updateField("kota_kabupaten", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kecamatan">Kecamatan</Label>
                <Input id="kecamatan" value={formData.kecamatan} onChange={(event) => updateField("kecamatan", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kelurahan">Kelurahan</Label>
                <Input id="kelurahan" value={formData.kelurahan} onChange={(event) => updateField("kelurahan", event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="alamat_tinggal">Alamat Tinggal</Label>
                <Textarea id="alamat_tinggal" rows={3} value={formData.alamat_tinggal} onChange={(event) => updateField("alamat_tinggal", event.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Kontak</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nomor_telepon">Nomor Telepon</Label>
                <Input id="nomor_telepon" value={formData.nomor_telepon} onChange={(event) => updateField("nomor_telepon", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alamat_email">Alamat Email</Label>
                <Input id="alamat_email" type="email" value={formData.alamat_email} onChange={(event) => updateField("alamat_email", event.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Orang Tua dan Wali</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nama_ayah_kandung">Nama Ayah Kandung</Label>
                <Input id="nama_ayah_kandung" value={formData.nama_ayah_kandung} onChange={(event) => updateField("nama_ayah_kandung", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nama_ibu_kandung">Nama Ibu Kandung</Label>
                <Input id="nama_ibu_kandung" value={formData.nama_ibu_kandung} onChange={(event) => updateField("nama_ibu_kandung", event.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nama_wali">Nama Wali</Label>
                <Input id="nama_wali" value={formData.nama_wali} onChange={(event) => updateField("nama_wali", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jumlah_saudara">Jumlah Saudara</Label>
                <Input id="jumlah_saudara" type="number" value={formData.jumlah_saudara} onChange={(event) => updateField("jumlah_saudara", event.target.value)} />
              </div> 
            </CardContent>
          </Card>

          {showAccountSection && isCreateMode && (
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Akun Santri</CardTitle>
                <CardDescription>Buat akun login santri langsung setelah data utama disimpan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 rounded-md border border-border/60 p-3">
                  <Checkbox
                    checked={accountData.create_account}
                    onCheckedChange={(checked) => updateAccountField("create_account", checked === true)}
                    id="create_account"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="create_account" className="text-sm font-medium">
                      Buat akun santri sekarang
                    </Label>
                    <p className="text-xs text-muted-foreground">Jika dicentang, sistem akan meminta nama akun dan password.</p>
                  </div>
                </div>

                {accountData.create_account && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="nama_akun">Nama Akun</Label>
                      <Input id="nama_akun" value={accountData.nama_akun} onChange={(event) => updateAccountField("nama_akun", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status_akun">Status Akun</Label>
                      <Select value={accountData.status_akun} onValueChange={(value) => updateAccountField("status_akun", value)}>
                        <SelectTrigger id="status_akun">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AKTIF">Aktif</SelectItem>
                          <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" value={accountData.password} onChange={(event) => updateAccountField("password", event.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
                      <Input id="password_confirmation" type="password" value={accountData.password_confirmation} onChange={(event) => updateAccountField("password_confirmation", event.target.value)} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 pt-4 backdrop-blur">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}