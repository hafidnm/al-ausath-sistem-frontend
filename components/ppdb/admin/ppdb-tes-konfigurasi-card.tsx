"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Trash2, GripVertical } from "lucide-react"
import type { TesKonfigurasiJenjangKey, TestQuestion, TestQuestionType } from "@/lib/services/ppdb.service"

const tesJenjangOptions: Array<{ value: TesKonfigurasiJenjangKey; label: string }> = [
  { value: "MI", label: "MI" },
  { value: "MTS", label: "MTs" },
  { value: "MA", label: "MA" },
]

interface TesConfigState {
  fiturSoalAktif: boolean
  soalTes: string
  formSchema?: TestQuestion[]
}

interface PpdbTesKonfigurasiCardProps {
  selectedJenjang: TesKonfigurasiJenjangKey
  configByJenjang: Record<TesKonfigurasiJenjangKey, TesConfigState>
  isLoading: boolean
  isSaving: boolean
  onJenjangChange: (jenjang: TesKonfigurasiJenjangKey) => void
  onToggle: (jenjang: TesKonfigurasiJenjangKey, checked: boolean) => void
  onSoalChange: (jenjang: TesKonfigurasiJenjangKey, soal: string) => void
  onFormSchemaChange: (jenjang: TesKonfigurasiJenjangKey, schema: TestQuestion[]) => void
  onSave: (jenjang: TesKonfigurasiJenjangKey) => void
}

export function PpdbTesKonfigurasiCard({
  selectedJenjang,
  configByJenjang,
  isLoading,
  isSaving,
  onJenjangChange,
  onToggle,
  onSoalChange,
  onFormSchemaChange,
  onSave,
}: PpdbTesKonfigurasiCardProps) {
  const activeConfig = configByJenjang[selectedJenjang]

  const handleAddQuestion = () => {
    const currentSchema = activeConfig.formSchema || []
    onFormSchemaChange(selectedJenjang, [
      ...currentSchema,
      {
        id: crypto.randomUUID(),
        type: "essay",
        question: "",
      },
    ])
  }

  const handleUpdateQuestion = (index: number, updates: Partial<TestQuestion>) => {
    const currentSchema = activeConfig.formSchema || []
    const newSchema = [...currentSchema]
    newSchema[index] = { ...newSchema[index], ...updates }
    onFormSchemaChange(selectedJenjang, newSchema)
  }

  const handleRemoveQuestion = (index: number) => {
    const currentSchema = activeConfig.formSchema || []
    const newSchema = [...currentSchema]
    newSchema.splice(index, 1)
    onFormSchemaChange(selectedJenjang, newSchema)
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Konfigurasi Soal Tes per Jenjang</CardTitle>
        <CardDescription>
          Pilih MI/MTs/MA, aktifkan mode tes, lalu isi pertanyaan ketika mode on.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="tes-jenjang">Jenjang</Label>
            <Select
              value={selectedJenjang}
              onValueChange={(value) => onJenjangChange(value as TesKonfigurasiJenjangKey)}
            >
              <SelectTrigger id="tes-jenjang">
                <SelectValue placeholder="Pilih jenjang" />
              </SelectTrigger>
              <SelectContent>
                {tesJenjangOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-1 flex items-center justify-between rounded-lg border border-border/70 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Aktifkan Soal Tes</p>
              <p className="text-xs text-muted-foreground">
                Mode {activeConfig.fiturSoalAktif ? "On" : "Off"}
              </p>
            </div>
            <Switch
              checked={activeConfig.fiturSoalAktif}
              onCheckedChange={(checked) => onToggle(selectedJenjang, checked)}
              disabled={isLoading || isSaving}
            />
          </div>

          <div className="sm:col-span-1 flex sm:justify-end">
            <Button
              onClick={() => onSave(selectedJenjang)}
              disabled={isLoading || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan Konfigurasi"
              )}
            </Button>
          </div>
        </div>

        {activeConfig.fiturSoalAktif ? (
          <div className="space-y-6 mt-6 border-t pt-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Daftar Soal Tes Google Form</Label>
                <p className="text-xs text-muted-foreground mt-1">Buat form dinamis yang diisi oleh pendaftar jenjang ini.</p>
              </div>
              <Button onClick={handleAddQuestion} size="sm" variant="outline" disabled={isLoading || isSaving}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Soal
              </Button>
            </div>

            {(!activeConfig.formSchema || activeConfig.formSchema.length === 0) ? (
              <div className="text-center py-8 border rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground">Belum ada soal. Klik Tambah Soal untuk memulai.</p>
                {activeConfig.soalTes && (
                  <p className="text-xs text-amber-600 mt-2">Peringatan: Terdapat legacy form soal teks lama yang akan digantikan oleh builder ini.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {activeConfig.formSchema.map((q, idx) => (
                  <Card key={q.id || idx} className="border-border shadow-sm p-4 hover:border-primary/50 transition-colors">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="flex sm:flex-row flex-col gap-3">
                          <div className="flex-1">
                            <Label className="mb-2 block">Pertanyaan {idx + 1}</Label>
                            <Input
                              value={q.question}
                              placeholder="Tuliskan pertanyaan..."
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateQuestion(idx, { question: e.target.value })}
                              disabled={isLoading || isSaving}
                            />
                          </div>
                          <div className="w-full sm:w-[200px]">
                            <Label className="mb-2 block">Tipe Jawaban</Label>
                            <Select
                              value={q.type}
                              disabled={isLoading || isSaving}
                              onValueChange={(val: TestQuestionType) => handleUpdateQuestion(idx, { type: val, options: val === "multiple_choice" ? q.options || [""] : undefined })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="essay">Jawaban Singkat / Esai</SelectItem>
                                <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {q.type === "multiple_choice" && (
                          <div className="pl-4 border-l-2 border-primary/20 space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Opsi Pilihan Ganda (Satu baris per opsi)</Label>
                            <Textarea
                              className="min-h-[80px]"
                              placeholder="Ketik opsi satu, tekan ENTER&#10;Ketik opsi dua, dst..."
                              value={q.options ? q.options.join("\n") : ""}
                              onChange={(e) => handleUpdateQuestion(idx, { options: e.target.value.split("\n") })}
                              disabled={isLoading || isSaving}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 pt-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLoading || isSaving}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={() => handleRemoveQuestion(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Saat off, pendaftar jenjang {selectedJenjang} akan melewati halaman tes.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
