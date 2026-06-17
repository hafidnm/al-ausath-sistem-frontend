"use client"

import { useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Trash2, ImagePlus, X, Globe } from "lucide-react"
import type { TesKonfigurasiJenjangKey, TesKonfigurasiJenjang, TestQuestion, TestQuestionType } from "@/types/ppdb/admin"
import api from "@/lib/axios"
import { transliterateText } from "@/lib/utils/arabic-transliterate"

// Helper: Construct full image URL from backend path
const getImageUrl = (path?: string): string | null => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Get base URL from API_URL (e.g., http://localhost:8000/api → http://localhost:8000)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const base = apiUrl.replace(/\/api\/?$/, '');
  
  // Handle both relative paths (ppdb/tes_soal/img.jpg) and /storage/ prefixes
  const cleanPath = path.replace(/^\/storage\/?/, '').replace(/^\//, '');
  return `${base}/storage/${cleanPath}`;
};

const tesJenjangOptions: Array<{ value: TesKonfigurasiJenjangKey; label: string }> = [
  { value: "MI", label: "MI" },
  { value: "MTS", label: "MTs" },
  { value: "MA", label: "MA" },
]

interface TesConfigState {
  fiturSoalAktif: boolean
  soalTes: string
  formSchema?: TestQuestion[]
  bahasa?: 'id' | 'ar'
  is_rtl?: boolean
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
  onConfigPatch?: (jenjang: TesKonfigurasiJenjangKey, patch: Partial<TesConfigState>) => void
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
  onConfigPatch,
}: PpdbTesKonfigurasiCardProps) {
  const activeConfig = configByJenjang[selectedJenjang]
  const imageInputRef = useRef<Record<number, HTMLInputElement | null>>({})

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

  // Issue 2: Upload gambar soal ke backend dan simpan URL-nya
  const handleImageUpload = async (index: number, file: File) => {
    try {
      const formData = new FormData()
      formData.append('gambar', file)
      const response = await api.post('/administrasi/ppdb/tes/konfigurasi/upload-gambar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // Backend return file_url (format: /storage/ppdb/tes_soal/...)
      const url = (response.data as any)?.file_url ?? (response.data as any)?.url ?? ''
      if (url) {
        handleUpdateQuestion(index, { image_url: url })
      }
    } catch (error) {
      console.error('Image upload error:', error)
      alert('Gagal mengunggah gambar soal.')
    }
  }

  const handleBahasaChange = (bahasa: 'id' | 'ar') => {
    const isRtl = bahasa === 'ar'
    onConfigPatch?.(selectedJenjang, { bahasa, is_rtl: isRtl })
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Konfigurasi Soal Tes per Jenjang</CardTitle>
        <CardDescription>
          Pilih MI/MTs/MA, aktifkan mode tes, atur bahasa soal, lalu isi pertanyaan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-4 gap-4 items-end">
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

          {/* Issue 1: Pilihan bahasa soal (Indonesia / Arab RTL) */}
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="tes-bahasa" className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Bahasa Soal
            </Label>
            <p className="text-xs text-muted-foreground italic">
              💡 Pilih bahasa per soal (setiap soal bisa berbeda bahasa)
            </p>
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
                <Label className="text-base">Daftar Soal Tes</Label>
                <p className="text-xs text-muted-foreground mt-1">Buat form dinamis yang diisi oleh pendaftar jenjang ini. Setiap soal bisa memiliki bahasa berbeda.</p>
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
                              placeholder={q.bahasa === 'ar' ? 'اكتب السؤال هنا...' : 'Tuliskan pertanyaan...'}
                              dir={q.bahasa === 'ar' ? 'rtl' : 'ltr'}
                              className={q.bahasa === 'ar' ? 'text-right font-arabic' : ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                let value = e.target.value;
                                // Auto-transliterasi pertanyaan jika bahasa Arab
                                if (q.bahasa === 'ar' && /[a-zA-Z]/.test(value)) {
                                  value = transliterateText(value);
                                }
                                handleUpdateQuestion(idx, { question: value });
                              }}
                              disabled={isLoading || isSaving}
                            />
                            {q.bahasa === 'ar' && (
                              <p className="text-xs text-amber-600 mt-1">💡 Ketik A/B/C akan otomatis menjadi أ/ب/ج</p>
                            )}
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
                          {/* Per-question language selection */}
                          <div className="w-full sm:w-[180px]">
                            <Label className="mb-2 block flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5" /> Bahasa
                            </Label>
                            <Select
                              value={q.bahasa ?? 'id'}
                              disabled={isLoading || isSaving}
                              onValueChange={(v) => handleUpdateQuestion(idx, { bahasa: v as 'id' | 'ar' })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="id">Bahasa Indonesia</SelectItem>
                                <SelectItem value="ar">العربية (Arab)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Issue 2: Upload gambar pendukung soal */}
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            {q.image_url ? (
                              <div className="relative inline-block">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={getImageUrl(q.image_url) || ''} alt="Gambar soal" className="max-h-28 rounded border border-border/50 object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuestion(idx, { image_url: undefined })}
                                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                  title="Hapus gambar"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="gap-2 text-xs"
                                disabled={isLoading || isSaving}
                                onClick={() => imageInputRef.current[idx]?.click()}
                              >
                                <ImagePlus className="w-3.5 h-3.5" />
                                Upload Gambar Soal
                              </Button>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={(el) => { imageInputRef.current[idx] = el }}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) void handleImageUpload(idx, file)
                              }}
                            />
                          </div>
                        </div>

                        {/* POIN 16: Setiap opsi pilihan ganda memiliki box/input tersendiri */}
                        {q.type === "multiple_choice" && (
                          <div className="pl-4 border-l-2 border-primary/20 space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                                Opsi Pilihan Ganda
                              </Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1.5"
                                disabled={isLoading || isSaving}
                                onClick={() => {
                                  const currentOptions = q.options ?? []
                                  handleUpdateQuestion(idx, { options: [...currentOptions, ""] })
                                }}
                              >
                                <Plus className="w-3 h-3" /> Tambah Opsi
                              </Button>
                            </div>
                            {q.bahasa === 'ar' && (
                              <p className="text-xs text-amber-600">💡 Ketik A/B/C akan otomatis menjadi أ/ب/ج</p>
                            )}
                            <div className="space-y-2">
                              {(q.options ?? [""]).map((opt, optIdx) => {
                                const optLabel = String.fromCharCode(65 + optIdx) // A, B, C, ...
                                return (
                                  <div
                                    key={optIdx}
                                    className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 shadow-sm"
                                  >
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                                      {optLabel}
                                    </span>
                                    <Input
                                      value={opt}
                                      placeholder={q.bahasa === 'ar' ? `الخيار ${optLabel}` : `Opsi ${optLabel}`}
                                      dir={q.bahasa === 'ar' ? 'rtl' : 'ltr'}
                                      className={`flex-1 h-8 text-sm border-0 shadow-none focus-visible:ring-0 px-1 ${q.bahasa === 'ar' ? 'text-right' : ''}`}
                                      disabled={isLoading || isSaving}
                                      onChange={(e) => {
                                        let value = e.target.value
                                        if (q.bahasa === 'ar' && /[a-zA-Z]/.test(value)) {
                                          value = transliterateText(value)
                                        }
                                        const newOptions = [...(q.options ?? [])]
                                        newOptions[optIdx] = value
                                        handleUpdateQuestion(idx, { options: newOptions })
                                      }}
                                    />
                                    <button
                                      type="button"
                                      disabled={isLoading || isSaving || (q.options ?? []).length <= 1}
                                      onClick={() => {
                                        const newOptions = (q.options ?? []).filter((_, i) => i !== optIdx)
                                        handleUpdateQuestion(idx, { options: newOptions.length ? newOptions : [""] })
                                      }}
                                      className="flex-shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                                      title="Hapus opsi"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
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
