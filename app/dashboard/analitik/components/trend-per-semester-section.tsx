import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { endpointInfos, trendPerSemesterSample } from "../data/analitik-data"
import { EndpointInfoCard } from "./endpoint-info-card"

export function TrendPerSemesterSection() {
  const info = endpointInfos[2]

  return (
    <div className="space-y-4">
      <EndpointInfoCard info={info} />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Trend Nilai per Semester (Sample)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {trendPerSemesterSample.map((row) => (
            <div key={row.semester} className="rounded-lg border border-border/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold text-foreground">Semester {row.semester}</p>
                <p className="text-xl font-bold text-primary">{row.rata_rata.toFixed(2)}</p>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <p>Tertinggi: {row.tertinggi}</p>
                <p>Terendah: {row.terendah}</p>
                <p>Jumlah Santri: {row.jumlah_santri}</p>
              </div>

              <div className="mt-3 h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-linear-to-r from-primary to-accent" style={{ width: `${row.rata_rata}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
