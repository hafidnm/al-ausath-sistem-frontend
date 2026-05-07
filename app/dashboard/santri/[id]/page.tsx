"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dataSantriService, DataSantriApiItem } from "@/lib/services/santri.service"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, PencilLine } from "lucide-react"

const toText = (value: unknown): string => {
  if (value == null) return "-"
  if (typeof value === "string") return value || "-"
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return "-"
}

const formatDate = (value?: string | null): string => {
  const text = toText(value)
  if (text === "-") return "-"

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return text

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

const formatStatus = (status?: string | null): string => {
  const value = String(status || "").toUpperCase()
  if (value === "AKTIF") return "Aktif"
  if (value === "CUTI") return "Cuti"
  if (value === "LULUS") return "Lulus"
  if (value === "KELUAR") return "Keluar"
  return status || "-"
}

const renderField = (label: string, value?: string | number | null) => (
  <div className="space-y-1">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-medium text-foreground">{value == null || value === "" ? "-" : String(value)}</p>
  </div>
)

export default function SantriDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const id = useMemo(() => Number(params.id), [params.id])

  const [data, setData] = useState<DataSantriApiItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      if (!Number.isFinite(id)) return

      setIsLoading(true)
      try {
        const result = await dataSantriService.getById(id)
        setData(result)
      } catch (error) {
        setData(null)
        toast({
          title: "Gagal memuat data",
          description: error instanceof Error ? error.message : "Data santri tidak ditemukan.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    void fetchDetail()
  }, [id, toast])

  const akun = data?.akun

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">Memuat data santri...</div>
  }

  if (!data) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-muted-foreground">Data santri tidak ditemukan.</p>
        <Button asChild variant="outline" className="bg-transparent">
          <Link href="/dashboard/santri">Kembali ke daftar</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard/santri" className="hover:text-foreground">Daftar Santri</Link>
            <span>/</span>
            <span>Detail</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Detail Santri</h1>
            <p className="text-muted-foreground">Informasi lengkap data santri dan akun yang terkait.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="bg-transparent">
            <Link href="/dashboard/santri">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/santri/${id}/edit`}>
              <PencilLine className="h-4 w-4" />
              Edit Data
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Ringkasan</CardTitle>
          <CardDescription>Identitas utama santri sebelum melihat detail per section.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          {renderField("Nomor Induk", data.nomor_induk)}
          {renderField("Nama Lengkap", data.nama_lengkap_santri)}
          {renderField("Kelas", data.kode_kelas)}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge className="bg-primary/10 text-primary">{formatStatus(data.status)}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Identitas Santri</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">{renderField("Nomor Induk", data.nomor_induk)}{renderField("Nama Lengkap", data.nama_lengkap_santri)}{renderField("Jenis Kelamin", data.jenis_kelamin)}{renderField("Tempat Lahir", data.tempat_lahir)}{renderField("Tanggal Lahir", formatDate(data.tanggal_lahir))}{renderField("Agama", data.agama)}{renderField("Golongan Darah", data.gol_darah)}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Akademik</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">{renderField("Kelas", data.kode_kelas)}{renderField("Status", formatStatus(data.status))}{renderField("Tahun Masuk", data.tahun_masuk)}{renderField("Tahun Lulus", data.tahun_lulus)}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Fisik</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">{renderField("Berat Badan", data.berat_badan)}{renderField("Tinggi Badan", data.tinggi_badan)}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Alamat</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">{renderField("Provinsi", data.provinsi)}{renderField("Kota/Kabupaten", data.kota_kabupaten)}{renderField("Kecamatan", data.kecamatan)}{renderField("Kelurahan", data.kelurahan)}<div className="space-y-1 md:col-span-2">{renderField("Alamat Tinggal", data.alamat_tinggal)}</div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Kontak</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">{renderField("Nomor Telepon", data.nomor_telepon)}{renderField("Alamat Email", data.alamat_email)}</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Orang Tua dan Wali</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">{renderField("Nama Ayah Kandung", data.nama_ayah_kandung)}{renderField("Nama Ibu Kandung", data.nama_ibu_kandung)}<div className="md:col-span-2">{renderField("Nama Wali", data.nama_wali)}</div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Akun Santri</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {renderField("Nama Akun", akun?.nama_akun)}
            {renderField("Status Akun", akun?.status)}
            <div className="md:col-span-2">{renderField("ID Akun", akun?.id_akun_santri)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}