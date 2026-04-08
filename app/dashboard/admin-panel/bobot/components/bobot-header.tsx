"use client"

import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Download } from "lucide-react"

interface BobotHeaderProps {
  onAdd?: () => void
  onRefresh?: () => void
  onExport?: () => void
}

export function BobotHeader({ onAdd, onRefresh, onExport }: BobotHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bobot Nilai</h1>
        <p className="text-muted-foreground">Kelola persentase bobot penilaian untuk semua mata pelajaran</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent"
          onClick={onRefresh}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="bg-transparent"
          onClick={onExport}
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button
          size="sm"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Bobot
        </Button>
      </div>
    </div>
  )
}
