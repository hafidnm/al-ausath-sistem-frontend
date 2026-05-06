import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { endpointInfos, santriPerluBimbinganSample } from "../data/analitik-data"
import { EndpointInfoCard } from "./endpoint-info-card"

export function SantriPerluBimbinganSection() {
  const info = endpointInfos[4]

  return (
    <div className="space-y-4">
      <EndpointInfoCard info={info} />

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Daftar Santri Perlu Bimbingan (Sample)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {santriPerluBimbinganSample.map((row) => (
            <div key={row.nomor_induk} className="rounded-lg border border-border/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">Nomor Induk: {row.nomor_induk}</p>
                  <p className="text-xs text-muted-foreground">
                    Mapel perlu bimbingan: {row.mapel_perlu_bimbingan} · Belum tuntas: {row.mapel_belum_tuntas}
                  </p>
                </div>
                <Badge className="bg-destructive/10 text-destructive border-0">Rata-rata {row.rata_rata.toFixed(2)}</Badge>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {row.mapel_detail.map((nilai) => (
                  <Badge
                    key={`${row.nomor_induk}-${nilai.kode_mapel}`}
                    variant="outline"
                    className={nilai.status_ketuntasan === "BELUM TUNTAS" ? "border-destructive/40 text-destructive" : "bg-transparent"}
                  >
                    {nilai.kode_mapel}: {nilai.nilai_akhir} · {nilai.status_ketuntasan} · {nilai.flag_warna}
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
