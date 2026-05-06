import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { endpointInfos, santriBerprestasiSample } from "../data/analitik-data"
import { EndpointInfoCard } from "./endpoint-info-card"

export function SantriBerprestasiSection() {
  const info = endpointInfos[3]

  return (
    <div className="space-y-4">
      <EndpointInfoCard info={info} />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Daftar Santri Berprestasi (Sample)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {santriBerprestasiSample.map((row) => (
            <div key={row.nomor_induk} className="rounded-lg border border-border/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">Nomor Induk: {row.nomor_induk}</p>
                  <p className="text-xs text-muted-foreground">Mapel dinilai: {row.mapel_count}</p>
                </div>
                <Badge className="bg-primary/10 text-primary border-0">Rata-rata {row.rata_rata.toFixed(2)}</Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {row.nilai_detail.map((nilai) => (
                  <Badge key={`${row.nomor_induk}-${nilai.kode_mapel}`} variant="outline" className="bg-transparent">
                    {nilai.kode_mapel}: {nilai.nilai_akhir} ({nilai.status_ketuntasan})
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
