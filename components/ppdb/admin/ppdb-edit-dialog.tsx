"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { PpdbFormFields, PpdbFormState } from "./ppdb-form-fields"
import type { TesKonfigurasiJenjangKey } from "@/types/ppdb/admin"

interface TesConfigState {
  fiturSoalAktif: boolean
  soalTes: string
}

interface PpdbEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: PpdbFormState
  programOptions: string[]
  isLoading: boolean
  // Tes config
  selectedPendaftarJenjang: TesKonfigurasiJenjangKey | null
  tesConfig: TesConfigState | null
  isTesConfigLoading: boolean
  isTesConfigSaving: boolean
  onFormChange: (patch: Partial<PpdbFormState>) => void
  onSubmit: () => void
  onTesToggle: (jenjang: TesKonfigurasiJenjangKey, checked: boolean) => void
  onTesSoalChange: (jenjang: TesKonfigurasiJenjangKey, soal: string) => void
  onTesConfigSave: (jenjang: TesKonfigurasiJenjangKey) => void
}

export function PpdbEditDialog({
  open,
  onOpenChange,
  form,
  programOptions,
  isLoading,
  selectedPendaftarJenjang,
  tesConfig,
  isTesConfigLoading,
  isTesConfigSaving,
  onFormChange,
  onSubmit,
  onTesToggle,
  onTesSoalChange,
  onTesConfigSave,
}: PpdbEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ubah Data Peserta</DialogTitle>
          <DialogDescription>
            Perbarui informasi peserta, lalu simpan perubahan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-3">
          <PpdbFormFields
            idPrefix="edit"
            form={form}
            programOptions={programOptions}
            onChange={onFormChange}
            showStatus={false}
          />

          {/* Konfigurasi Soal Tes */}
          <div className="rounded-lg border border-border/70 p-4 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Konfigurasi Soal Tes</p>
                <p className="text-xs text-muted-foreground">
                  On untuk menampilkan form soal sesuai jenjang peserta ({selectedPendaftarJenjang || "-"}).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={tesConfig?.fiturSoalAktif ?? false}
                  onCheckedChange={(checked) => {
                    if (!selectedPendaftarJenjang) return
                    onTesToggle(selectedPendaftarJenjang, checked)
                  }}
                  disabled={!selectedPendaftarJenjang || isTesConfigLoading || isTesConfigSaving}
                />
                <span className="text-sm text-muted-foreground">
                  {tesConfig?.fiturSoalAktif ? "On" : "Off"}
                </span>
              </div>
            </div>

            {tesConfig?.fiturSoalAktif ? (
              <Textarea
                value={tesConfig.soalTes}
                onChange={(e) => {
                  if (!selectedPendaftarJenjang) return
                  onTesSoalChange(selectedPendaftarJenjang, e.target.value)
                }}
                placeholder="Tulis pertanyaan tes"
                disabled={!selectedPendaftarJenjang || isTesConfigLoading || isTesConfigSaving}
              />
            ) : null}

            <div className="flex justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => selectedPendaftarJenjang && onTesConfigSave(selectedPendaftarJenjang)}
                disabled={!selectedPendaftarJenjang || isTesConfigLoading || isTesConfigSaving}
              >
                {isTesConfigSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Konfigurasi Tes"
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            className="bg-primary text-primary-foreground"
            onClick={onSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
