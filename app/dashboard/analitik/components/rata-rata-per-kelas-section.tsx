import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { endpointInfos, rataRataPerKelasSample } from "../data/analitik-data"
import { EndpointInfoCard } from "./endpoint-info-card"

export function RataRataPerKelasSection() {
  const info = endpointInfos[1]

  return (
    <div className="space-y-4">
      <EndpointInfoCard info={info} />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Perbandingan Rata-rata Kelas (Sample)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {rataRataPerKelasSample.map((row) => (
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
        </CardContent>
      </Card>
    </div>
  )
}
