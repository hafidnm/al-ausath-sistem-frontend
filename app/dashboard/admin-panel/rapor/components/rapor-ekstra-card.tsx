"use client"

import { Loader2, Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RaporItem } from "@/lib/services/rapor.service"
import { ekskulService, EkskulApiItem } from "@/lib/services/ekskul.service"
import { useEffect, useState } from "react"

const NILAI_EKSTRA_OPTIONS = [
  { label: "A (Sangat Baik)", value: "A" },
  { label: "B (Baik)", value: "B" },
  { label: "C (Cukup)", value: "C" },
  { label: "D (Kurang)", value: "D" },
]

export interface EkstraItem {
  nama: string
  nilai: string
}

interface RaporEkstraCardProps {
  selected: RaporItem | null
  ekstraList: EkstraItem[]
  isReportReady: boolean
  isPublishedReport: boolean
  isSaving: boolean
  onEkstraListChange: (updater: (current: EkstraItem[]) => EkstraItem[]) => void
  onSaveEkstra: () => void
}

export function RaporEkstraCard({
  selected,
  ekstraList,
  isReportReady,
  isPublishedReport,
  isSaving,
  onEkstraListChange,
  onSaveEkstra,
}: RaporEkstraCardProps) {
  const [ekskulOptions, setEkskulOptions] = useState<EkskulApiItem[]>([])
  
  useEffect(() => {
    ekskulService.getAll().then((res) => {
      setEkskulOptions(res.data)
    }).catch(console.error)
  }, [])

  const handleAddRow = () => {
    onEkstraListChange((current) => [...current, { nama: "", nilai: "" }])
  }

  const handleRemoveRow = (index: number) => {
    onEkstraListChange((current) => current.filter((_, i) => i !== index))
  }

  const handleChange = (index: number, field: keyof EkstraItem, value: string) => {
    onEkstraListChange((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  const isDisabled = !isReportReady || isPublishedReport

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Nilai Ekstrakurikuler</CardTitle>
        <CardDescription>
          Daftar kegiatan ekstrakurikuler dan nilai masing-masing untuk santri yang dipilih
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isReportReady ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700">
            Generate rapor dulu sebelum nilai ekstrakurikuler bisa diinput.
          </div>
        ) : isPublishedReport ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-primary">
            Rapor sudah TERBIT. Nilai ekstrakurikuler dikunci dan tidak dapat diubah.
          </div>
        ) : null}

        <div className="space-y-3">
          {ekstraList.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Belum ada ekstrakurikuler. Klik tombol "Tambah" untuk menambahkan.
            </p>
          )}

          {ekstraList.map((item, index) => (
            <div key={index} className="flex items-end gap-2">
              <div className="flex-1">
                {index === 0 && (
                  <Label className="mb-2 block text-xs text-muted-foreground">Nama Kegiatan</Label>
                )}
                <Select
                  value={item.nama ?? ""}
                  onValueChange={(val) => handleChange(index, "nama", val)}
                  disabled={isDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kegiatan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ekskulOptions.map((opt) => (
                      <SelectItem key={opt.id_ekskul} value={opt.nama_ekskul}>
                        {opt.nama_ekskul}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-36">
                {index === 0 && (
                  <Label className="mb-2 block text-xs text-muted-foreground">Nilai</Label>
                )}
                <Select
                  value={item.nilai ?? ""}
                  onValueChange={(val) => handleChange(index, "nilai", val)}
                  disabled={isDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih nilai" />
                  </SelectTrigger>
                  <SelectContent>
                    {NILAI_EKSTRA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-0 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleRemoveRow(index)}
                disabled={isDisabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="bg-transparent"
            onClick={handleAddRow}
            disabled={isDisabled}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Ekstrakurikuler
          </Button>

          <Button
            type="button"
            onClick={onSaveEkstra}
            disabled={isDisabled || isSaving || ekstraList.length === 0}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Simpan Ekstrakurikuler
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
