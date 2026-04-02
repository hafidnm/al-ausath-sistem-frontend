"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckCircle, Badge } from "lucide-react"
import { Filters } from "../components/filters"
import { OverviewStats } from "../components/overview-stats"
import { BulkActions } from "../components/bulk-actions"
import { SantriTable } from "../components/santri-table"
import { GuruTable } from "../components/guru-table"
import { HistoryTable } from "../components/history-table"
import { DetailDialog } from "../components/dialogs/detail-dialog"
import { RejectDialog } from "../components/dialogs/reject-dialog"
import { pendingSantriPresensi, pendingGuruPresensi } from "../utils/constants"


export default function ValidasiPage() {
  const [selectedTab, setSelectedTab] = useState("pending")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState("2026-01-30")
  const [selectedMapel, setSelectedMapel] = useState("all")
  const [selectedKelas, setSelectedKelas] = useState("all")
  const [selectedGuru, setSelectedGuru] = useState("all")
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<typeof pendingSantriPresensi[0] | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [selectedItems, setSelectedItems] = useState<number[]>([])

  const handleViewDetail = (item: typeof pendingSantriPresensi[0]) => {
    setSelectedItem(item)
    setIsDetailOpen(true)
  }

  const handleApprove = (id: number) => {
    console.log("Approved:", id)
  }

  const handleReject = (item: typeof pendingSantriPresensi[0]) => {
    setSelectedItem(item)
    setIsRejectOpen(true)
  }

  const handleBulkApprove = () => {
    console.log("Bulk approved:", selectedItems)
    setSelectedItems([])
  }

  const handleSelectItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === pendingSantriPresensi.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(pendingSantriPresensi.map(p => p.id))
    }
  }

  const handleRefresh = () => {
    console.log("Refresh data")
  }

  const handleExport = () => {
    console.log("Export data")
  }

  return (
    <div className="space-y-6">
      {/* Filters & Header */}
      <Filters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        selectedMapel={selectedMapel}
        onMapelChange={setSelectedMapel}
        selectedKelas={selectedKelas}
        onKelasChange={setSelectedKelas}
        selectedGuru={selectedGuru}
        onGuruChange={setSelectedGuru}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {/* Overview Stats */}
      <OverviewStats />

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="pending" className="data-[state=active]:bg-card">
            <Clock className="w-4 h-4 mr-2" />
            Menunggu Validasi
            <Badge className="ml-2 bg-secondary text-secondary-foreground">{pendingSantriPresensi.length + pendingGuruPresensi.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-card">
            <CheckCircle className="w-4 h-4 mr-2" />
            Riwayat Validasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {/* Bulk Actions */}
          <BulkActions
            selectedCount={selectedItems.length}
            onClear={() => setSelectedItems([])}
            onApproveAll={handleBulkApprove}
          />

          {/* Pending Santri Attendance */}
          <SantriTable
            selectedItems={selectedItems}
            onSelectAll={handleSelectAll}
            onSelectItem={handleSelectItem}
            onViewDetail={handleViewDetail}
            onApprove={handleApprove}
            onReject={handleReject}
          />

          {/* Pending Guru Attendance */}
          <GuruTable />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <HistoryTable />
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <DetailDialog 
        open={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
        selectedItem={selectedItem} 
      />

      {/* Reject Dialog */}
      <RejectDialog
        open={isRejectOpen}
        onOpenChange={setIsRejectOpen}
        selectedItem={selectedItem}
        rejectNote={rejectNote}
        onRejectNoteChange={setRejectNote}
        onSubmit={() => {
          console.log("Rejected with note:", rejectNote)
          setIsRejectOpen(false)
          setRejectNote("")
        }}
      />
    </div>
  )
}
