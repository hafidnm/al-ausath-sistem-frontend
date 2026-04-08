"use client"

import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"

interface NilaiMapelHeaderProps {
  onAdd?: () => void
  onRefresh?: () => void
}

export function NilaiMapelHeader({ onAdd, onRefresh }: NilaiMapelHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nilai Mapel</h1>
        <p className="text-muted-foreground">Kelola input nilai mapel per santri, mapel, tahun ajaran, dan semester</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="bg-transparent" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <Button size="sm" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Input Nilai
        </Button>
      </div>
    </div>
  )
}
