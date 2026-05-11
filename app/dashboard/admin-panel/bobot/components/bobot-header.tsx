"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, RefreshCw, Download } from "lucide-react"

interface BobotHeaderProps {
  onAdd?: () => void
  onRefresh?: () => void
  onExport?: () => void
  totalItems?: number
  isLoading?: boolean
}

export function BobotHeader({ onAdd, onRefresh, onExport, totalItems, isLoading }: BobotHeaderProps) {
  const subtitle = isLoading
    ? "Memuat data bobot dari database..."
    : typeof totalItems === "number"
      ? `Menampilkan ${totalItems} data bobot dari database`
      : "Kelola persentase bobot penilaian untuk semua mata pelajaran"

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bobot Nilai</h1>
        <p className="text-muted-foreground">{subtitle}</p>
        {typeof totalItems === "number" && !isLoading && (
          <Badge variant="secondary" className="mt-3 w-fit">
            {totalItems} data tersimpan
          </Badge>
        )}
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
