"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Download, Eye, AlertCircle, CheckCircle } from "lucide-react"
import { useRaportSantri, downloadRaportPDF } from "@/hooks/use-raport-santri"

interface RaportDisplayProps {
  tahunAjaran?: string
  semester?: number
}

export function RaportDisplay({ tahunAjaran = "2025/2026", semester = 1 }: RaportDisplayProps) {
  const { data: raport, loading, error } = useRaportSantri({ tahunAjaran, semester })
  const [downloading, setDownloading] = useState(false)

  // Debug log whenever data changes
  useEffect(() => {
    console.log('RaportDisplay - tahunAjaran:', tahunAjaran, 'semester:', semester)
    console.log('RaportDisplay - raport data:', raport)
    console.log('RaportDisplay - loading:', loading)
    console.log('RaportDisplay - error:', error)
  }, [raport, loading, error, tahunAjaran, semester])

  const handleDownload = async () => {
    try {
      setDownloading(true)
      await downloadRaportPDF(tahunAjaran, semester)
    } catch (err) {
      console.error('Download error:', err)
    } finally {
      setDownloading(false)
    }
  }

  const handlePreview = async () => {
    try {
      const blob = await downloadRaportPDF(tahunAjaran, semester, true)
      if (blob instanceof Blob) {
        const url = window.URL.createObjectURL(blob)
        window.open(url, '_blank')
      }
    } catch (err) {
      console.error('Preview error:', err)
    }
  }

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Raport Digital
          </CardTitle>
          <CardDescription>Raport untuk tahun ajaran {tahunAjaran} Semester {semester}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">{error}</AlertDescription>
      </Alert>
    )
  }

  if (!raport) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Raport Anda belum terbit. Silakan hubungi admin untuk informasi lebih lanjut.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Raport Digital
            </CardTitle>
            <CardDescription>
              Tahun Ajaran {tahunAjaran} • Semester {semester}
            </CardDescription>
          </div>
          <Badge className="bg-green-100 text-green-800 border-0 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            TERBIT
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Raport Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">No. Induk</p>
            <p className="text-sm font-semibold text-foreground">{raport.nomor_induk || "-"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Tahun Ajaran</p>
            <p className="text-sm font-semibold text-foreground">{raport.tahun_ajaran}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Semester</p>
            <p className="text-sm font-semibold text-foreground">{raport.semester}</p>
          </div>
        </div>

        {/* Display additional raport info if available */}
        {raport.santri?.nama_lengkap_santri && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Nama Santri</p>
            <p className="text-sm font-semibold text-foreground">{raport.santri.nama_lengkap_santri}</p>
          </div>
        )}

        {raport.kode_kelas && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Kelas</p>
            <p className="text-sm font-semibold text-foreground">{raport.kode_kelas}</p>
          </div>
        )}

        {raport.rata_rata && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Rata-rata Nilai</p>
            <p className="text-sm font-semibold text-foreground">{raport.rata_rata}</p>
          </div>
        )}

        {raport.peringkat_kelas && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Peringkat Kelas</p>
            <p className="text-sm font-semibold text-foreground">{raport.peringkat_kelas} dari {raport.total_siswa_kelas} siswa</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border/50">
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="w-4 h-4" />
            {downloading ? "Mengunduh..." : "Unduh PDF"}
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={handlePreview}>
            <Eye className="w-4 h-4" />
            Lihat Preview
          </Button>
        </div>

        {/* Info Message */}
        <Alert className="border-blue-200/50 bg-blue-50/50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700 text-sm">
            Pastikan Raport ini telah diterbitkan oleh pihak sekolah untuk diunduh.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
