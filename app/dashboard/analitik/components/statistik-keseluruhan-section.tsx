import { Card, CardContent } from "@/components/ui/card"
import { endpointInfos, statistikKeseluruhanSample } from "../data/analitik-data"
import { EndpointInfoCard } from "./endpoint-info-card"

export function StatistikKeseluruhanSection() {
  const info = endpointInfos[0]

  const statCards = [
    { label: "Rata-rata", value: statistikKeseluruhanSample.rata_rata.toFixed(2) },
    { label: "Nilai Tertinggi", value: statistikKeseluruhanSample.nilai_tertinggi },
    { label: "Nilai Terendah", value: statistikKeseluruhanSample.nilai_terendah },
    { label: "Jumlah Santri", value: statistikKeseluruhanSample.jumlah_santri },
    { label: "Total Record Nilai", value: statistikKeseluruhanSample.total_nilai },
  ]

  return (
    <div className="space-y-4">
      <EndpointInfoCard info={info} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {statCards.map((item) => (
          <Card key={item.label} className="border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
