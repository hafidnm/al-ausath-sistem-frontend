"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { dataSantriService, DataSantriApiItem } from "@/lib/services/santri.service"
import { SantriForm, santriFormToPayload, SantriFormState } from "../../components/santri-form"
import { useToast } from "@/hooks/use-toast"

const toText = (value: unknown): string => {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return ""
}

const toInitialData = (data: DataSantriApiItem): Partial<SantriFormState> => ({
  nomor_induk: toText(data.nomor_induk),
  nama_lengkap_santri: toText(data.nama_lengkap_santri),
  kode_kelas: toText(data.kode_kelas),
  status: toText(data.status).toUpperCase() || "AKTIF",
  tahun_masuk: toText(data.tahun_masuk),
  tahun_lulus: toText(data.tahun_lulus),
  jenis_kelamin: toText(data.jenis_kelamin).toUpperCase(),
  tempat_lahir: toText(data.tempat_lahir),
  tanggal_lahir: toText(data.tanggal_lahir),
  agama: toText(data.agama),
  berat_badan: toText(data.berat_badan),
  tinggi_badan: toText(data.tinggi_badan),
  gol_darah: toText(data.gol_darah).toUpperCase(),
  provinsi: toText(data.provinsi),
  kota_kabupaten: toText(data.kota_kabupaten),
  kecamatan: toText(data.kecamatan),
  kelurahan: toText(data.kelurahan),
  alamat_tinggal: toText(data.alamat_tinggal),
  hobi: toText(data.hobi),
  nomor_telepon: toText(data.nomor_telepon),
  alamat_email: toText(data.alamat_email),
  nama_ayah_kandung: toText(data.nama_ayah_kandung),
  nama_ibu_kandung: toText(data.nama_ibu_kandung),
  nama_wali: toText(data.nama_wali),
})

export default function SantriEditPage() {
  const params = useParams()
  const router = useRouter()
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

  const handleSubmit = async (values: Parameters<typeof santriFormToPayload>[0] & {
    create_account: boolean
    nama_akun: string
    password: string
    password_confirmation: string
    status_akun: "AKTIF" | "NONAKTIF"
  }) => {
    await dataSantriService.update(id, santriFormToPayload(values))
    toast({
      title: "Berhasil",
      description: "Data santri berhasil diperbarui.",
    })
    router.push(`/dashboard/santri/${id}`)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/santri" className="hover:text-foreground">Daftar Santri</Link>
          <span>/</span>
          <Link href={`/dashboard/santri/${id}`} className="hover:text-foreground">Detail</Link>
          <span>/</span>
          <span>Edit</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Edit Santri</h1>
            <p className="text-muted-foreground">Perbarui data santri sesuai informasi terbaru.</p>
          </div>
          <Button asChild variant="outline" className="self-start bg-transparent">
            <Link href={`/dashboard/santri/${id}`}>Kembali ke detail</Link>
          </Button>
        </div>
      </div>

      <SantriForm
        mode="edit"
        title="Formulir Edit Santri"
        description="Semua section tetap tersedia agar perubahan data tidak terpisah-pisah."
        initialData={toInitialData(data)}
        submitLabel="Simpan Perubahan"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/dashboard/santri/${id}`)}
      />
    </div>
  )
}