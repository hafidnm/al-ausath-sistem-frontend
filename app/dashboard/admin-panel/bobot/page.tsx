"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { BobotNilaiItem, bobotNilaiService } from "@/lib/services/bobot-nilai.service"
import { BobotHeader } from "./components/bobot-header"
import { BobotInfo } from "./components/bobot-info"
import { BobotTable } from "./components/bobot-table"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"

export default function BobotPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedTahunAjaran, isLoading: isTahunLoading } = useTahunAjaran()

  const [items, setItems] = useState<BobotNilaiItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBobot = useCallback(async () => {
    if (isTahunLoading) return
    try {
      setIsLoading(true)
      setError(null)

      const tahunAjaran = selectedTahunAjaran?.nama_tahun || undefined
      const response = await bobotNilaiService.getAll({ per_page: 100, tahun_ajaran: tahunAjaran })
      setItems(response.data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat data bobot"
      setError(message)
      toast({
        title: "Gagal memuat bobot",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, isTahunLoading, selectedTahunAjaran])

  useEffect(() => {
    void fetchBobot()
  }, [fetchBobot])

  const handleAdd = () => {
    router.push("/dashboard/admin-panel/bobot/new")
  }

  const handleEdit = (id: number) => {
    router.push(`/dashboard/admin-panel/bobot/${id}/edit`)
  }

  const handleDelete = async (id: number) => {
    try {
      await bobotNilaiService.remove(id)
      toast({
        title: "Bobot dihapus",
        description: "Data bobot berhasil dihapus.",
      })
      await fetchBobot()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menghapus data bobot"
      toast({
        title: "Gagal menghapus bobot",
        description: message,
        variant: "destructive",
      })
    }
  }

  const handleSetDefault = async (item: BobotNilaiItem) => {
    try {
      await bobotNilaiService.setDefault({
        tahun_ajaran: item.tahun_ajaran,
        semester: item.semester,
      })
      toast({
        title: "Bobot default disimpan",
        description: `Konfigurasi default 20/30/50 untuk ${item.tahun_ajaran} semester ${item.semester} berhasil diset.`,
      })
      await fetchBobot()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal menyimpan bobot default"
      toast({
        title: "Gagal set default",
        description: message,
        variant: "destructive",
      })
    }
  }

  const handleRefresh = () => {
    void fetchBobot()
  }

  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Belum ada data bobot untuk diekspor.",
      })
      return
    }

    const headers = [
      "id",
      "tahun_ajaran",
      "semester",
      "bobot_harian",
      "bobot_uts",
      "bobot_uas",
      "total",
      "status",
      "updated_at",
    ]

    const rows = items.map((item) => [
      item.id,
      `"${item.tahun_ajaran}"`,
      item.semester,
      item.bobot_harian,
      item.bobot_uts,
      item.bobot_uas,
      item.bobot_harian + item.bobot_uts + item.bobot_uas,
      item.is_default ? "default" : "tersimpan",
      `"${item.updated_at || item.created_at || ""}"`,
    ])

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "bobot-nilai.csv"
    link.click()
    URL.revokeObjectURL(url)

    toast({
      title: "Ekspor dimulai",
      description: "File CSV bobot nilai telah dibuat.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <BobotHeader
        onAdd={handleAdd}
        onRefresh={handleRefresh}
        onExport={handleExport}
        totalItems={items.length}
        isLoading={isLoading}
      />

      {/* Info Cards */}
      <BobotInfo />

      {/* Bobot Table */}
      <BobotTable
        items={items}
        isLoading={isLoading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
      />
    </div>
  )
}
