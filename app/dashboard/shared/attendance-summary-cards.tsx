import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Clock, XCircle, Receipt } from "lucide-react"

interface AttendanceSummaryCardsProps {
  attendanceSummary: {
    hadir: number
    sakit: number
    izin: number
    alpha: number
    total: number
  }
}

export function AttendanceSummaryCards({ attendanceSummary }: AttendanceSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Hadir</p>
              <p className="text-2xl font-bold text-primary mt-1">{attendanceSummary.hadir}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sakit</p>
              <p className="text-2xl font-bold text-chart-4 mt-1">{attendanceSummary.sakit}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-chart-3/20 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-chart-4" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Izin</p>
              <p className="text-2xl font-bold text-accent mt-1">{attendanceSummary.izin}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Alpha</p>
              <p className="text-2xl font-bold text-destructive mt-1">{attendanceSummary.alpha}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/50 bg-primary/5 hover:bg-primary/10 transition-colors border-dashed border-primary/30">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-primary uppercase">Keuangan</p>
              <p className="text-lg font-bold text-foreground mt-1">Tagihan</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
