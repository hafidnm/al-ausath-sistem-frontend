"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useNilaiStatistikPerKelas } from "@/hooks/use-nilai-statistik"
import { endpointInfos } from "../data/analitik-data"
import { EndpointInfoCard } from "./endpoint-info-card"

export function RataRataPerKelasSection() {
  const info = endpointInfos[1]
  const { data, loading, error, fetchPerKelas } = useNilaiStatistikPerKelas()

  useEffect(() => {
    fetchPerKelas()
  }, [fetchPerKelas])

  return (
    <div className="space-y-4">
      <EndpointInfoCard info={info} />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Perbandingan Rata-rata Kelas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6" />
              <span className="ml-2 text-sm text-muted-foreground">Memuat data...</span>
            </div>
          )}

          {error && !loading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && data.length === 0 && !error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Tidak ada data tersedia</AlertDescription>
            </Alert>
          )}

          {!loading && data.length > 0 && (
            <>
              {data.map((row) => (
                <div key={row.kode_kelas} className="space-y-2 rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-foreground">{row.nama_kelas}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.kode_kelas} · {row.jumlah_santri} santri
                      </p>
                    </div>
                    <p className="text-lg font-bold text-foreground">{row.rata_rata.toFixed(2)}</p>
                  </div>
                  <Progress value={row.rata_rata} />
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
