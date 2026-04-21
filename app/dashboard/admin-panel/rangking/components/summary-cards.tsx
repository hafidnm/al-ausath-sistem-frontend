import { Crown, Medal, Sparkles, Trophy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

type SummaryCardsProps = {
  totalSantri: number
  rataRataNilai: number
  kelasTerbaik: string
}

export function SummaryCards({ totalSantri, rataRataNilai, kelasTerbaik }: SummaryCardsProps) {
  const summaryCards = [
    { label: "Santri Masuk Ranking", value: String(totalSantri), icon: <Trophy className="h-5 w-5" /> },
    { label: "Rata-rata Nilai", value: rataRataNilai.toFixed(2), icon: <Sparkles className="h-5 w-5" /> },
    { label: "Kelas Ditampilkan", value: kelasTerbaik, icon: <Medal className="h-5 w-5" /> },
    { label: "Juara Bertahan", value: "3 Bulan", icon: <Crown className="h-5 w-5" /> },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((item) => (
        <Card key={item.label} className="border-border/50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">{item.icon}</div>
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-bold text-foreground">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
