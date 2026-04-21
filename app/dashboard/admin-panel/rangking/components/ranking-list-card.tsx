import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { RankingItem } from "../types"

type RankingListCardProps = {
  kelasLabel: string
  rankedData: RankingItem[]
}

export function RankingListCard({ kelasLabel, rankedData }: RankingListCardProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Leaderboard Kelas</CardTitle>
        <CardDescription>Menampilkan ranking untuk kelas: {kelasLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rankedData.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
            Tidak ada data ranking untuk kelas ini.
          </div>
        ) : (
          rankedData.map((item) => (
            <div
              key={item.nomorInduk}
              className="flex flex-col gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {item.rank}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{item.nama}</h3>
                    {item.rank <= 3 && <Badge variant="secondary">Top {item.rank}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.nomorInduk}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 md:text-right">
                <div>
                  <p className="text-sm text-muted-foreground">Rata-rata</p>
                  <p className="text-xl font-bold text-foreground">{item.poin.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Nilai</p>
                  <p className="text-base font-semibold text-foreground">{item.totalNilai.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
