"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NilaiMapelItem, nilaiMapelService } from "@/lib/services/nilai-mapel.service"
import { calculateRaporRaw, normalizeRaporDisplay, statusKkm } from "../utils/helpers"

export default function NilaiMapelDetailPage() {
  const router = useRouter()
  const params = useParams<{ kode_mapel: string }>()
  const searchParams = useSearchParams()

  const kodeMapel = params.kode_mapel
  const nomorInduk = searchParams.get("nomor_induk") || ""
  const tahunAjaran = searchParams.get("tahun_ajaran") || undefined
  const semester = searchParams.get("semester") || undefined

  const [item, setItem] = useState<NilaiMapelItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDetail = async () => {
      if (!kodeMapel || !nomorInduk) {
        setError("Nomor induk wajib disertakan untuk membuka detail nilai mapel")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError("")

        const data = await nilaiMapelService.getByKodeMapel(kodeMapel, {
          nomor_induk: nomorInduk,
          tahun_ajaran: tahunAjaran,
          semester: semester,
        })

        setItem(data)
      } catch (err: any) {
        setItem(null)
        setError(err?.response?.data?.message || "Gagal memuat detail nilai mapel")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetail()
  }, [kodeMapel, nomorInduk, semester, tahunAjaran])

  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Memuat detail nilai mapel...</div>
  }

  if (error || !item) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12 text-destructive">{error || "Data tidak ditemukan"}</div>
        <div className="text-center">
          <Button variant="outline" className="bg-transparent" onClick={() => router.back()}>
            Kembali
          </Button>
        </div>
      </div>
    )
  }

  const raw = calculateRaporRaw(item.tugas, item.ulangan, item.ujian_akhir)
  const normalized = normalizeRaporDisplay(raw)
  const raporTampil = item.nilai_rapor_tampil ?? normalized.nilai
  const raporIsRed = item.flag_warna_rapor ?? normalized.isRed
  const kkmStatus = item.status_ketuntasan
    || item.status_kkm
    || statusKkm(raporTampil, item.nilai_kkm ?? 75)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detail Nilai Mapel</h1>
          <p className="text-muted-foreground">{item.nama_santri || "-"} ({item.nomor_induk}) - {item.kode_mapel}</p>
        </div>
        <Button variant="outline" className="bg-transparent" onClick={() => router.back()}>
          Kembali
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Ringkasan</CardTitle>
          <CardDescription>{item.tahun_ajaran} - Semester {item.semester}</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Kode Kelas</p>
            <p className="font-semibold text-foreground">{item.kode_kelas || "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ujian Akhir</p>
            <p className="font-semibold text-foreground">{item.ujian_akhir}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Nilai Rapor Tampil</p>
            <p className={raporIsRed ? "font-semibold text-destructive" : "font-semibold text-primary"}>{raporTampil}</p>
          </div>
          <div>
            <p className="text-muted-foreground">KKM Mapel</p>
            <p className="font-semibold text-foreground">{item.nilai_kkm ?? "-"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status KKM</p>
            <Badge className={kkmStatus === "TUNTAS" ? "bg-primary/10 text-primary border-0" : "bg-destructive/10 text-destructive border-0"}>
              {kkmStatus}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Komponen Tugas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jenis</TableHead>
                <TableHead className="text-center">Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.tugas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-6">Tidak ada data tugas</TableCell>
                </TableRow>
              )}
              {item.tugas.map((tugas, idx) => (
                <TableRow key={`tugas-${idx}`}>
                  <TableCell>{tugas.jenis}</TableCell>
                  <TableCell className="text-center">{tugas.nilai}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Komponen Ulangan</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Nilai</TableHead>
                <TableHead className="text-center">Soal Disusun Pengajar</TableHead>
                <TableHead className="text-center">Diawasi Pengajar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {item.ulangan.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">Tidak ada data ulangan</TableCell>
                </TableRow>
              )}
              {item.ulangan.map((ulangan, idx) => (
                <TableRow key={`ulangan-${idx}`}>
                  <TableCell className="text-center">{ulangan.nilai}</TableCell>
                  <TableCell className="text-center">{ulangan.soal_disusun_pengajar ? "Ya" : "Tidak"}</TableCell>
                  <TableCell className="text-center">{ulangan.diawasi_pengajar ? "Ya" : "Tidak"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
