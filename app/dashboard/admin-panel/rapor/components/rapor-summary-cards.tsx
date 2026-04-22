"use client"

import { Card, CardContent } from "@/components/ui/card"

interface RaporSummaryCardsProps {
  total: number
  totalTerbit: number
  totalDraft: number
}

export function RaporSummaryCards({ total, totalTerbit, totalDraft }: RaporSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-border/50">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Total Rapor</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{total}</p>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Rapor Terbit</p>
          <p className="mt-1 text-3xl font-bold text-primary">{totalTerbit}</p>
        </CardContent>
      </Card>
      <Card className="border-border/50">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">Rapor Draft</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">{totalDraft}</p>
        </CardContent>
      </Card>
    </div>
  )
}
