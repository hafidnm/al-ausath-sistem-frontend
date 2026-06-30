"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import type { PpdbPortalBillingInfo } from "@/types/ppdb/portal"
import {
  PpdbFormFields,
  PpdbFormState,
  PpdbAdminFileState,
  emptyPpdbAdminFiles,
} from "./ppdb-form-fields"

interface PpdbAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: PpdbFormState
  programOptions: string[]
  isLoading: boolean
  billingInfo?: PpdbPortalBillingInfo | null
  billingLoading?: boolean
  files?: PpdbAdminFileState
  onFormChange: (patch: Partial<PpdbFormState>) => void
  onFileChange?: (key: keyof PpdbAdminFileState, file: File | null) => void
  onSubmit: () => void
}

export function PpdbAddDialog({
  open,
  onOpenChange,
  form,
  programOptions,
  isLoading,
  billingInfo = null,
  billingLoading = false,
  files = emptyPpdbAdminFiles,
  onFormChange,
  onFileChange,
  onSubmit,
}: PpdbAddDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pendaftar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Pendaftar Baru</DialogTitle>
          <DialogDescription>
            Lengkapi data calon santri sesuai form PPDB portal santri
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <PpdbFormFields
            idPrefix="new"
            form={form}
            programOptions={programOptions}
            onChange={onFormChange}
            showStatus
            showAdminMeta
            showDocuments
            showInfaq
            files={files}
            onFileChange={onFileChange}
            billingInfo={billingInfo}
            billingLoading={billingLoading}
          />
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
              "Simpan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
