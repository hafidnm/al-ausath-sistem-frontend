"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Info } from "lucide-react"

export function BobotInfo() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">Informasi</p>
              <p className="text-sm text-muted-foreground">
                Bobot nilai berlaku sama untuk semua mata pelajaran. Jangan lupa untuk set default bobot ke 20% tugas, 30% ulangan, dan 50% ujian akhir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground mb-1">Penting</p>
              <p className="text-sm text-muted-foreground">
                Total persentase bobot harus tepat 100%. Pastikan semua nilai sudah benar sebelum menyimpan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
