import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { LineChart } from "lucide-react"

export function AnalitikHeader() {
  return (
    <Card className="overflow-hidden border-0 bg-linear-to-r from-sidebar to-sidebar-accent text-sidebar-foreground">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-sidebar-foreground/70">
              <LineChart className="h-4 w-4" />
              Dashboard Analitik Akademik
            </div>
            <h1 className="text-2xl font-bold">Analitik Nilai Santri</h1>
            <p className="mt-2 max-w-3xl text-sm text-sidebar-foreground/80">
              Halaman ini hanya memuat cakupan endpoint Analitik: statistik keseluruhan, rata-rata per kelas,
              trend semester, santri berprestasi, dan santri perlu bimbingan.
            </p>
          </div>
          <Badge className="w-fit border-0 bg-sidebar-primary/20 px-3 py-1 text-sidebar-primary-foreground">
            Scope: Docs Analitik
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
