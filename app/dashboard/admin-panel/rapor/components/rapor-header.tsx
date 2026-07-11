"use client"

import { FileText, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RaporHeaderProps {
  onRefresh: () => void
  onBackToAdmin: () => void
}

export function RaporHeader({ onRefresh, onBackToAdmin }: RaporHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Rapor Operasional</h1>
        <p className="text-muted-foreground">Cari santri, generate rapor, preview PDF, dan isi catatan wali dalam satu halaman</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="bg-transparent" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Button variant="outline" size="sm" className="bg-transparent" onClick={() => window.location.href = '/dashboard/admin-panel/rapor/massal'}>
          <FileText className="mr-2 h-4 w-4" />
          Input Massal
        </Button>
        <Button variant="outline" size="sm" className="bg-transparent" onClick={onBackToAdmin}>
          <FileText className="mr-2 h-4 w-4" />
          Panel Admin
        </Button>
      </div>
    </div>
  )
}
