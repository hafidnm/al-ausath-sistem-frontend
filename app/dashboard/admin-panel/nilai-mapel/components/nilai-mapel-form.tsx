"use client"

import { useEffect, useMemo, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Plus, Trash2 } from "lucide-react"
import {
  NilaiMapelTugasItem,
  NilaiMapelUlanganItem,
  UpsertNilaiMapelPayload,
} from "@/lib/services/nilai-mapel.service"
import { authService } from "@/lib/services/auth.service"
import { semesterOptions, tahunAjaranOptions, jenisTugasOptions } from "../utils/constants"
import { calculateRaporRaw, normalizeRaporDisplay, statusKkm } from "../utils/helpers"

interface NilaiMapelFormProps {
  initialNomorInduk?: string
  onSubmit?: (data: UpsertNilaiMapelPayload) => Promise<void> | void
  onCancel?: () => void
}

const extractPetugasInputId = (me: any): number | undefined => {
  const candidates = [
    me?.user?.id_petugas,
    me?.user?.petugas_id,
    me?.user?.idDataPetugas,
    me?.user?.data_petugas?.id,
    me?.id_petugas,
    me?.petugas_id,
    me?.idDataPetugas,
    me?.data_petugas?.id,
    me?.user?.id,
    me?.id,
  ]

  for (const candidate of candidates) {
    const id = Number(candidate)
    if (Number.isFinite(id) && id > 0) {
      return id
    }
  }

  return undefined
}

const defaultTugas: NilaiMapelTugasItem[] = [
  { nilai: 0, jenis: "PR" },
  { nilai: 0, jenis: "TUGAS_PENGGANTI" },
  { nilai: 0, jenis: "MODUL_KOMPETENSI" },
]

const defaultUlangan: NilaiMapelUlanganItem[] = [
  { nilai: 0, soal_disusun_pengajar: true, diawasi_pengajar: true },
  { nilai: 0, soal_disusun_pengajar: true, diawasi_pengajar: true },
  { nilai: 0, soal_disusun_pengajar: true, diawasi_pengajar: true },
]

const toErrorMessage = (error: any): string => {
  const message = error?.response?.data?.message
  const errors = error?.response?.data?.errors

  if (typeof message === "string" && message) return message

  if (errors && typeof errors === "object") {
    const firstField = Object.keys(errors)[0]
    const firstValue = errors[firstField]

    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return String(firstValue[0])
    }

    if (typeof firstValue === "string") {
      return firstValue
    }
  }

  return "Gagal menyimpan nilai mapel"
}

export function NilaiMapelForm({ initialNomorInduk = "", onSubmit, onCancel }: NilaiMapelFormProps) {
  const [nomorInduk, setNomorInduk] = useState(initialNomorInduk)
  const [kodeMapel, setKodeMapel] = useState("")
  const [kodeKelas, setKodeKelas] = useState("")
  const [tahunAjaran, setTahunAjaran] = useState("")
  const [semester, setSemester] = useState("")
  const [keterangan, setKeterangan] = useState("")
  const [ujianAkhir, setUjianAkhir] = useState(0)
  const [tugas, setTugas] = useState<NilaiMapelTugasItem[]>(defaultTugas)
  const [ulangan, setUlangan] = useState<NilaiMapelUlanganItem[]>(defaultUlangan)
  const [petugasInputId, setPetugasInputId] = useState<number | undefined>(undefined)
  const [isUserReady, setIsUserReady] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const me = await authService.me()
      const id = extractPetugasInputId(me)
      setPetugasInputId(id)
      setIsUserReady(true)
    }

    loadUser()
  }, [])

  const preview = useMemo(() => {
    const raw = calculateRaporRaw(tugas, ulangan, ujianAkhir)
    const normalized = normalizeRaporDisplay(raw)
    const status = statusKkm(normalized.nilai)

    return {
      raw,
      nilai: normalized.nilai,
      isRed: normalized.isRed,
      status,
    }
  }, [tugas, ulangan, ujianAkhir])

  const updateTugas = (index: number, patch: Partial<NilaiMapelTugasItem>) => {
    setTugas((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)))
  }

  const updateUlangan = (index: number, patch: Partial<NilaiMapelUlanganItem>) => {
    setUlangan((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...patch } : item)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nomorInduk.trim() || !kodeMapel.trim() || !kodeKelas.trim() || !tahunAjaran || !semester) {
      setError("Nomor induk, kode mapel, kode kelas, tahun ajaran, dan semester wajib diisi")
      return
    }

    if (tugas.length < 3) {
      setError("Minimal 3 item tugas wajib diisi")
      return
    }

    if (ulangan.length < 3) {
      setError("Minimal 3 item ulangan wajib diisi")
      return
    }

    if (ulangan.some((item) => !item.soal_disusun_pengajar || !item.diawasi_pengajar)) {
      setError("Setiap ulangan wajib memiliki soal disusun pengajar dan diawasi pengajar")
      return
    }

    if (!isUserReady) {
      setError("Data user belum siap, tunggu sebentar lalu coba simpan lagi")
      return
    }

    if (!petugasInputId) {
      setError("ID petugas input tidak ditemukan dari akun login. Silakan refresh halaman atau cek data akun petugas")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      await onSubmit?.({
        nomor_induk: nomorInduk.trim(),
        kode_mapel: kodeMapel.trim(),
        kode_kelas: kodeKelas.trim(),
        tahun_ajaran: tahunAjaran,
        semester: Number(semester),
        id_petugas_input: petugasInputId,
        keterangan: keterangan.trim() || undefined,
        tugas,
        ulangan,
        ujian_akhir: ujianAkhir,
      })
    } catch (err) {
      setError(toErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Input Nilai Mapel</CardTitle>
        <CardDescription>Minimal 3 tugas dan 3 ulangan, serta validasi aturan nilai rapor</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <Alert className="bg-destructive/10 border-destructive/30">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <AlertDescription className="text-destructive ml-2">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nomor Induk</Label>
              <Input value={nomorInduk} onChange={(e) => setNomorInduk(e.target.value)} placeholder="2025001" />
            </div>
            <div className="space-y-2">
              <Label>Kode Mapel</Label>
              <Input value={kodeMapel} onChange={(e) => setKodeMapel(e.target.value)} placeholder="MATH-01" />
            </div>
            <div className="space-y-2">
              <Label>Kode Kelas</Label>
              <Input value={kodeKelas} onChange={(e) => setKodeKelas(e.target.value)} placeholder="KLS-10A" />
            </div>
            <div className="space-y-2">
              <Label>Tahun Ajaran</Label>
              <Select value={tahunAjaran} onValueChange={setTahunAjaran}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun ajaran" />
                </SelectTrigger>
                <SelectContent>
                  {tahunAjaranOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ujian Akhir</Label>
              <Input type="number" min={0} max={100} value={ujianAkhir} onChange={(e) => setUjianAkhir(Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Komponen Tugas</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-transparent"
                onClick={() => setTugas((prev) => [...prev, { nilai: 0, jenis: "PR" }])}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Tugas
              </Button>
            </div>
            <div className="space-y-2">
              {tugas.map((item, index) => (
                <div key={`tugas-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-md border border-border/50">
                  <Select value={item.jenis} onValueChange={(value) => updateTugas(index, { jenis: value as NilaiMapelTugasItem["jenis"] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {jenisTugasOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0} max={100} value={item.nilai} onChange={(e) => updateTugas(index, { nilai: Number(e.target.value) })} />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={tugas.length <= 3}
                      onClick={() => setTugas((prev) => prev.filter((_, idx) => idx !== index))}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Komponen Ulangan</h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-transparent"
                onClick={() => setUlangan((prev) => [...prev, { nilai: 0, soal_disusun_pengajar: true, diawasi_pengajar: true }])}
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Ulangan
              </Button>
            </div>
            <div className="space-y-2">
              {ulangan.map((item, index) => (
                <div key={`ulangan-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-md border border-border/50">
                  <Input type="number" min={0} max={100} value={item.nilai} onChange={(e) => updateUlangan(index, { nilai: Number(e.target.value) })} />
                  <Label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={item.soal_disusun_pengajar} onCheckedChange={(checked) => updateUlangan(index, { soal_disusun_pengajar: Boolean(checked) })} />
                    Soal disusun pengajar
                  </Label>
                  <Label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={item.diawasi_pengajar} onCheckedChange={(checked) => updateUlangan(index, { diawasi_pengajar: Boolean(checked) })} />
                    Diawasi pengajar
                  </Label>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={ulangan.length <= 3}
                      onClick={() => setUlangan((prev) => prev.filter((_, idx) => idx !== index))}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Keterangan (opsional)</Label>
            <Textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Catatan input nilai" />
          </div>

          <div className="rounded-md border border-border/50 p-4 bg-muted/20">
            <h4 className="font-semibold text-foreground mb-2">Preview Nilai Rapor</h4>
            <div className="grid sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Rapor Raw (20/30/50)</p>
                <p className="font-semibold text-foreground">{preview.raw.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Rapor Tampil</p>
                <p className={preview.isRed ? "font-semibold text-destructive" : "font-semibold text-primary"}>{preview.nilai}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status KKM</p>
                <p className="font-semibold text-foreground">{preview.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Flag Merah</p>
                <p className="font-semibold text-foreground">{preview.isRed ? "YA" : "TIDAK"}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-border/50">
            <div className="flex-1" />
            <Button type="button" variant="outline" className="bg-transparent" onClick={onCancel}>Batal</Button>
            <Button type="submit" disabled={isSubmitting || !isUserReady}>{isSubmitting ? "Menyimpan..." : "Simpan Nilai"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
