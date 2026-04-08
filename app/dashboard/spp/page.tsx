"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
Table,
TableBody,
TableCell,
TableHead,
TableHeader,
TableRow,
} from "@/components/ui/table"
import {
Select,
SelectContent,
SelectItem,
SelectTrigger,
SelectValue,
} from "@/components/ui/select"
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuLabel,
DropdownMenuSeparator,
DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
Search,
Plus,
Filter,
Download,
RefreshCw,
MoreHorizontal,
Eye,
Edit,
Trash2,
Wallet,
CheckCircle2,
Clock3,
AlertTriangle,
Receipt,
Settings,
Loader2,
} from "lucide-react"
import {
useCreateSppPayment,
useCreateSppSetting,
useDeleteSppPayment,
useDeleteSppSetting,
useSppPaymentDetail,
useSppPayments,
useSppSettingDetail,
useSppSettings,
useSppTunggakanSummary,
useUpdateSppPayment,
useUpdateSppSetting,
} from "@/hooks/use-spp"
import {
SppPayment,
SppSetting,
SppStatus,
SppTunggakanSummary,
} from "@/lib/services/spp.service"

type PaymentFormState = {
noTagihan: string
nis: string
nama: string
kelas: string
bulan: string
jatuhTempo: string
nominal: string
terbayar: string
status: SppStatus
}

type SettingFormState = {
nama: string
jenjang: string
kelas: string
tahunAjaran: string
nominal: string
jatuhTempoHari: string
aktif: "true" | "false"
keterangan: string
}

const paymentStatusOptions: SppStatus[] = ["Lunas", "Cicilan", "Belum Bayar", "Terlambat"]

const emptyPaymentForm: PaymentFormState = {
noTagihan: "",
nis: "",
nama: "",
kelas: "",
bulan: "",
jatuhTempo: "",
nominal: "",
terbayar: "0",
status: "Belum Bayar",
}

const emptySettingForm: SettingFormState = {
nama: "",
jenjang: "",
kelas: "",
tahunAjaran: "",
nominal: "",
jatuhTempoHari: "",
aktif: "true",
keterangan: "",
}

const formatCurrency = (value: number) => {
return new Intl.NumberFormat("id-ID", {
style: "currency",
currency: "IDR",
maximumFractionDigits: 0,
}).format(value)
}

const formatDate = (value: string) => {
if (!value) return "-"

const parsed = new Date(value)
if (Number.isNaN(parsed.getTime())) return value

return parsed.toLocaleDateString("id-ID", {
day: "2-digit",
month: "short",
year: "numeric",
})
}

const getErrorMessage = (error: unknown, fallback: string) => {
return error instanceof Error ? error.message : fallback
}

const parseNumberInput = (value: string): number => {
const normalized = value.replace(/[^\d]/g, "")
if (!normalized) return 0

const parsed = Number(normalized)
return Number.isFinite(parsed) ? parsed : 0
}

const getStatusBadge = (status: SppStatus) => {
switch (status) {
case "Lunas":
return <Badge className="bg-primary/10 text-primary border-0">Lunas</Badge>
case "Cicilan":
return <Badge className="bg-accent/20 text-accent border-0">Cicilan</Badge>
case "Belum Bayar":
return <Badge className="bg-chart-3/20 text-chart-4 border-0">Belum Bayar</Badge>
case "Terlambat":
return <Badge className="bg-destructive/10 text-destructive border-0">Terlambat</Badge>
default:
return <Badge variant="outline">-</Badge>
}
}

const summarizeFromPayments = (payments: SppPayment[]): SppTunggakanSummary => {
const totalTagihan = payments.length
const totalLunas = payments.filter((item) => item.status === "Lunas").length
const totalCicilan = payments.filter((item) => item.status === "Cicilan").length
const totalBelumBayar = payments.filter((item) => item.status === "Belum Bayar").length
const totalTerlambat = payments.filter((item) => item.status === "Terlambat").length
const totalNominal = payments.reduce((sum, item) => sum + item.nominal, 0)
const totalTerbayar = payments.reduce((sum, item) => sum + item.terbayar, 0)
const totalSisa = Math.max(totalNominal - totalTerbayar, 0)

const sortedDueDates = payments
.map((item) => new Date(item.jatuhTempo))
.filter((item) => !Number.isNaN(item.getTime()))
.sort((a, b) => a.getTime() - b.getTime())

const now = new Date()
const nextDue = sortedDueDates.find((date) => date.getTime() >= now.getTime()) ?? sortedDueDates[0]

return {
periode: payments[0]?.bulan ?? "",
totalTagihan,
totalLunas,
totalCicilan,
totalBelumBayar,
totalTerlambat,
totalNominal,
totalTerbayar,
totalSisa,
jatuhTempoBerikutnya: nextDue ? nextDue.toISOString() : "",
}
}

const mergeSummary = (
baseSummary: SppTunggakanSummary,
apiSummary: SppTunggakanSummary | null,
): SppTunggakanSummary => {
if (!apiSummary) return baseSummary

const pickNumber = (primary: number, fallback: number) => {
return primary > 0 ? primary : fallback
}

return {
periode: apiSummary.periode || baseSummary.periode,
totalTagihan: pickNumber(apiSummary.totalTagihan, baseSummary.totalTagihan),
totalLunas: pickNumber(apiSummary.totalLunas, baseSummary.totalLunas),
totalCicilan: pickNumber(apiSummary.totalCicilan, baseSummary.totalCicilan),
totalBelumBayar: pickNumber(apiSummary.totalBelumBayar, baseSummary.totalBelumBayar),
totalTerlambat: pickNumber(apiSummary.totalTerlambat, baseSummary.totalTerlambat),
totalNominal: pickNumber(apiSummary.totalNominal, baseSummary.totalNominal),
totalTerbayar: pickNumber(apiSummary.totalTerbayar, baseSummary.totalTerbayar),
totalSisa: pickNumber(apiSummary.totalSisa, baseSummary.totalSisa),
jatuhTempoBerikutnya: apiSummary.jatuhTempoBerikutnya || baseSummary.jatuhTempoBerikutnya,
}
}

const mapPaymentToForm = (payment: SppPayment): PaymentFormState => {
return {
noTagihan: payment.noTagihan,
nis: payment.nis,
nama: payment.nama,
kelas: payment.kelas,
bulan: payment.bulan,
jatuhTempo: payment.jatuhTempo,
nominal: payment.nominal.toString(),
terbayar: payment.terbayar.toString(),
status: payment.status,
}
}

const mapSettingToForm = (setting: SppSetting): SettingFormState => {
return {
nama: setting.nama,
jenjang: setting.jenjang,
kelas: setting.kelas,
tahunAjaran: setting.tahunAjaran,
nominal: setting.nominal.toString(),
jatuhTempoHari: setting.jatuhTempoHari?.toString() ?? "",
aktif: setting.aktif ? "true" : "false",
keterangan: setting.keterangan,
}
}

export default function SppPage() {
const [searchQuery, setSearchQuery] = useState("")
const [selectedKelas, setSelectedKelas] = useState("all")
const [selectedStatus, setSelectedStatus] = useState("all")

const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
const [isAddSettingDialogOpen, setIsAddSettingDialogOpen] = useState(false)
const [isEditSettingDialogOpen, setIsEditSettingDialogOpen] = useState(false)

const [selectedPayment, setSelectedPayment] = useState<SppPayment | null>(null)
const [selectedSetting, setSelectedSetting] = useState<SppSetting | null>(null)

const [newPaymentForm, setNewPaymentForm] = useState<PaymentFormState>(emptyPaymentForm)
const [editPaymentForm, setEditPaymentForm] = useState<PaymentFormState>(emptyPaymentForm)
const [newSettingForm, setNewSettingForm] = useState<SettingFormState>(emptySettingForm)
const [editSettingForm, setEditSettingForm] = useState<SettingFormState>(emptySettingForm)

const {
data: paymentData,
loading: paymentLoading,
error: paymentError,
fetchPayments,
} = useSppPayments()

const {
data: tunggakanSummary,
loading: summaryLoading,
error: summaryError,
fetchSummary,
} = useSppTunggakanSummary()

const {
data: paymentDetail,
loading: paymentDetailLoading,
fetchPaymentDetail,
} = useSppPaymentDetail()

const {
data: settingData,
loading: settingLoading,
error: settingError,
fetchSettings,
} = useSppSettings()

const {
data: settingDetail,
loading: settingDetailLoading,
fetchSettingDetail,
} = useSppSettingDetail()

const { createPayment, loading: createPaymentLoading } = useCreateSppPayment()
const { updatePayment, loading: updatePaymentLoading } = useUpdateSppPayment()
const { deletePayment, loading: deletePaymentLoading } = useDeleteSppPayment()

const { createSetting, loading: createSettingLoading } = useCreateSppSetting()
const { updateSetting, loading: updateSettingLoading } = useUpdateSppSetting()
const { deleteSetting, loading: deleteSettingLoading } = useDeleteSppSetting()

useEffect(() => {
void fetchPayments()
void fetchSummary()
void fetchSettings()
}, [fetchPayments, fetchSettings, fetchSummary])

useEffect(() => {
if (!isEditDialogOpen || !paymentDetail) return
setEditPaymentForm(mapPaymentToForm(paymentDetail))
}, [isEditDialogOpen, paymentDetail])

useEffect(() => {
if (!isEditSettingDialogOpen || !settingDetail) return
setEditSettingForm(mapSettingToForm(settingDetail))
}, [isEditSettingDialogOpen, settingDetail])

const filteredData = useMemo(() => {
return paymentData.filter((item) => {
const keyword = searchQuery.toLowerCase()
const matchesSearch =
item.nama.toLowerCase().includes(keyword) ||
item.nis.toLowerCase().includes(keyword) ||
item.noTagihan.toLowerCase().includes(keyword)
const matchesKelas = selectedKelas === "all" || item.kelas === selectedKelas
const matchesStatus = selectedStatus === "all" || item.status === selectedStatus

return matchesSearch && matchesKelas && matchesStatus
})
}, [paymentData, searchQuery, selectedKelas, selectedStatus])

const kelasOptions = useMemo(() => {
const classes = paymentData
.map((item) => item.kelas.trim())
.filter((item) => item.length > 0)
return Array.from(new Set(classes)).sort((a, b) => a.localeCompare(b))
}, [paymentData])

const fallbackSummary = useMemo(() => summarizeFromPayments(paymentData), [paymentData])
const summary = useMemo(
() => mergeSummary(fallbackSummary, tunggakanSummary),
[fallbackSummary, tunggakanSummary],
)

const currentDetail = useMemo(() => {
if (!selectedPayment) return null
if (paymentDetail && paymentDetail.id === selectedPayment.id) return paymentDetail
return selectedPayment
}, [paymentDetail, selectedPayment])

const totalTagihan = summary.totalTagihan
const totalLunas = summary.totalLunas
const totalCicilan = summary.totalCicilan
const totalBelumBayar = summary.totalBelumBayar
const totalTerlambat = summary.totalTerlambat
const totalNominal = summary.totalNominal
const totalTerbayar = summary.totalTerbayar
const totalSisa = summary.totalSisa

const isProcessing =
createPaymentLoading ||
updatePaymentLoading ||
deletePaymentLoading ||
createSettingLoading ||
updateSettingLoading ||
deleteSettingLoading

const refreshAll = async () => {
await Promise.all([fetchPayments(), fetchSummary(), fetchSettings()])
}

const handleAddPayment = async () => {
if (!newPaymentForm.nis || !newPaymentForm.nama || !newPaymentForm.nominal) {
alert("NIS, nama, dan nominal wajib diisi")
return
}

try {
await createPayment({
noTagihan: newPaymentForm.noTagihan || undefined,
nis: newPaymentForm.nis,
nama: newPaymentForm.nama,
kelas: newPaymentForm.kelas,
bulan: newPaymentForm.bulan,
jatuhTempo: newPaymentForm.jatuhTempo,
nominal: parseNumberInput(newPaymentForm.nominal),
terbayar: parseNumberInput(newPaymentForm.terbayar),
status: newPaymentForm.status,
})

setIsAddDialogOpen(false)
setNewPaymentForm(emptyPaymentForm)
await refreshAll()
} catch (error) {
alert(getErrorMessage(error, "Gagal menambah tagihan SPP"))
}
}

const handleOpenDetail = async (item: SppPayment) => {
setSelectedPayment(item)
setIsDetailDialogOpen(true)
await fetchPaymentDetail(item.id)
}

const handleOpenEdit = async (item: SppPayment) => {
setSelectedPayment(item)
setEditPaymentForm(mapPaymentToForm(item))
setIsEditDialogOpen(true)
await fetchPaymentDetail(item.id)
}

const handleUpdatePayment = async () => {
if (!selectedPayment) return

try {
await updatePayment(selectedPayment.id, {
noTagihan: editPaymentForm.noTagihan,
nis: editPaymentForm.nis,
nama: editPaymentForm.nama,
kelas: editPaymentForm.kelas,
bulan: editPaymentForm.bulan,
jatuhTempo: editPaymentForm.jatuhTempo,
nominal: parseNumberInput(editPaymentForm.nominal),
terbayar: parseNumberInput(editPaymentForm.terbayar),
status: editPaymentForm.status,
})

setIsEditDialogOpen(false)
await refreshAll()
} catch (error) {
alert(getErrorMessage(error, "Gagal memperbarui pembayaran"))
}
}

const handleDeletePayment = async (item: SppPayment) => {
if (!confirm(`Hapus tagihan ${item.noTagihan}?`)) return

try {
await deletePayment(item.id)
await refreshAll()
} catch (error) {
alert(getErrorMessage(error, "Gagal menghapus tagihan"))
}
}

const handleAddSetting = async () => {
if (!newSettingForm.nama || !newSettingForm.nominal) {
alert("Nama setting dan nominal wajib diisi")
return
}

try {
await createSetting({
nama: newSettingForm.nama,
jenjang: newSettingForm.jenjang || undefined,
kelas: newSettingForm.kelas || undefined,
tahunAjaran: newSettingForm.tahunAjaran || undefined,
nominal: parseNumberInput(newSettingForm.nominal),
jatuhTempoHari: newSettingForm.jatuhTempoHari
? parseNumberInput(newSettingForm.jatuhTempoHari)
: null,
aktif: newSettingForm.aktif === "true",
keterangan: newSettingForm.keterangan || undefined,
})

setIsAddSettingDialogOpen(false)
setNewSettingForm(emptySettingForm)
await fetchSettings()
} catch (error) {
alert(getErrorMessage(error, "Gagal menambah setting SPP"))
}
}

const handleOpenEditSetting = async (item: SppSetting) => {
setSelectedSetting(item)
setEditSettingForm(mapSettingToForm(item))
setIsEditSettingDialogOpen(true)
await fetchSettingDetail(item.id)
}

const handleUpdateSetting = async () => {
if (!selectedSetting) return

try {
await updateSetting(selectedSetting.id, {
nama: editSettingForm.nama,
jenjang: editSettingForm.jenjang || undefined,
kelas: editSettingForm.kelas || undefined,
tahunAjaran: editSettingForm.tahunAjaran || undefined,
nominal: parseNumberInput(editSettingForm.nominal),
jatuhTempoHari: editSettingForm.jatuhTempoHari
? parseNumberInput(editSettingForm.jatuhTempoHari)
: null,
aktif: editSettingForm.aktif === "true",
keterangan: editSettingForm.keterangan || undefined,
})

setIsEditSettingDialogOpen(false)
await fetchSettings()
} catch (error) {
alert(getErrorMessage(error, "Gagal memperbarui setting SPP"))
}
}

const handleDeleteSetting = async (item: SppSetting) => {
if (!confirm(`Hapus setting ${item.nama}?`)) return

try {
await deleteSetting(item.id)
await fetchSettings()
} catch (error) {
alert(getErrorMessage(error, "Gagal menghapus setting SPP"))
}
}

return (
<div className="space-y-6">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
<div>
<h1 className="text-2xl font-bold text-foreground">SPP - Pembayaran SPP</h1>
<p className="text-muted-foreground">Kelola tagihan, cicilan, pelunasan, dan pengaturan nominal SPP</p>
</div>
<div className="flex items-center gap-2">
<Button variant="outline" size="sm" onClick={() => void refreshAll()} disabled={isProcessing}>
<RefreshCw className="w-4 h-4 mr-2" />
Refresh
</Button>
<Button variant="outline" size="sm">
<Download className="w-4 h-4 mr-2" />
Export
</Button>
<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
<DialogTrigger asChild>
<Button size="sm" className="bg-primary text-primary-foreground">
<Plus className="w-4 h-4 mr-2" />
Tambah Tagihan
</Button>
</DialogTrigger>
<DialogContent className="sm:max-w-[640px]">
<DialogHeader>
<DialogTitle>Tambah Tagihan SPP</DialogTitle>
<DialogDescription>
Buat data pembayaran SPP baru untuk santri
</DialogDescription>
</DialogHeader>
<div className="grid gap-4 py-2">
<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label htmlFor="no-tagihan">No Tagihan</Label>
<Input
id="no-tagihan"
placeholder="Contoh: INV-SPP-2026-001"
value={newPaymentForm.noTagihan}
onChange={(e) =>
setNewPaymentForm((prev) => ({ ...prev, noTagihan: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label htmlFor="nis">NIS</Label>
<Input
id="nis"
placeholder="Nomor induk santri"
value={newPaymentForm.nis}
onChange={(e) =>
setNewPaymentForm((prev) => ({ ...prev, nis: e.target.value }))
}
/>
</div>
</div>
<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label htmlFor="nama">Nama Santri</Label>
<Input
id="nama"
placeholder="Nama santri"
value={newPaymentForm.nama}
onChange={(e) =>
setNewPaymentForm((prev) => ({ ...prev, nama: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label htmlFor="kelas">Kelas</Label>
<Input
id="kelas"
placeholder="Contoh: 11 IPA"
value={newPaymentForm.kelas}
onChange={(e) =>
setNewPaymentForm((prev) => ({ ...prev, kelas: e.target.value }))
}
/>
</div>
</div>
<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label htmlFor="bulan">Bulan Tagihan</Label>
<Input
id="bulan"
placeholder="Contoh: April 2026"
value={newPaymentForm.bulan}
onChange={(e) =>
setNewPaymentForm((prev) => ({ ...prev, bulan: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label htmlFor="jatuh-tempo">Jatuh Tempo</Label>
<Input
id="jatuh-tempo"
type="date"
value={newPaymentForm.jatuhTempo}
onChange={(e) =>
setNewPaymentForm((prev) => ({ ...prev, jatuhTempo: e.target.value }))
}
/>
</div>
</div>
<div className="grid grid-cols-3 gap-4">
<div className="space-y-2">
<Label htmlFor="nominal">Nominal</Label>
<Input
id="nominal"
placeholder="450000"
value={newPaymentForm.nominal}
onChange={(e) =>
setNewPaymentForm((prev) => ({ ...prev, nominal: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label htmlFor="terbayar">Terbayar</Label>
<Input
id="terbayar"
placeholder="0"
value={newPaymentForm.terbayar}
onChange={(e) =>
setNewPaymentForm((prev) => ({ ...prev, terbayar: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label>Status</Label>
<Select
value={newPaymentForm.status}
onValueChange={(value) =>
setNewPaymentForm((prev) => ({ ...prev, status: value as SppStatus }))
}
>
<SelectTrigger>
<SelectValue placeholder="Pilih status" />
</SelectTrigger>
<SelectContent>
{paymentStatusOptions.map((status) => (
<SelectItem key={status} value={status}>
{status}
</SelectItem>
))}
</SelectContent>
</Select>
</div>
</div>
</div>
<DialogFooter>
<Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
Batal
</Button>
<Button className="bg-primary text-primary-foreground" onClick={() => void handleAddPayment()}>
{createPaymentLoading ? (
<Loader2 className="w-4 h-4 mr-2 animate-spin" />
) : null}
Simpan
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
</div>
</div>

{paymentError ? (
<p className="text-sm text-destructive">Gagal memuat pembayaran: {paymentError}</p>
) : null}
{summaryError ? (
<p className="text-sm text-destructive">Ringkasan tunggakan tidak tersedia: {summaryError}</p>
) : null}
{settingError ? (
<p className="text-sm text-destructive">Gagal memuat setting SPP: {settingError}</p>
) : null}

<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
<Card className="border-border/50">
<CardContent className="p-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
<Receipt className="w-5 h-5 text-primary" />
</div>
<div>
<p className="text-xs text-muted-foreground">Total Tagihan</p>
<p className="text-xl font-bold text-foreground">{totalTagihan}</p>
</div>
</div>
</CardContent>
</Card>

<Card className="border-border/50">
<CardContent className="p-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
<CheckCircle2 className="w-5 h-5 text-primary" />
</div>
<div>
<p className="text-xs text-muted-foreground">Lunas</p>
<p className="text-xl font-bold text-foreground">{totalLunas}</p>
</div>
</div>
</CardContent>
</Card>

<Card className="border-border/50">
<CardContent className="p-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
<Wallet className="w-5 h-5 text-accent" />
</div>
<div>
<p className="text-xs text-muted-foreground">Cicilan</p>
<p className="text-xl font-bold text-foreground">{totalCicilan}</p>
</div>
</div>
</CardContent>
</Card>

<Card className="border-border/50">
<CardContent className="p-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-chart-3/20 flex items-center justify-center">
<Clock3 className="w-5 h-5 text-chart-4" />
</div>
<div>
<p className="text-xs text-muted-foreground">Belum Bayar</p>
<p className="text-xl font-bold text-foreground">{totalBelumBayar}</p>
</div>
</div>
</CardContent>
</Card>

<Card className="border-border/50">
<CardContent className="p-4">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
<AlertTriangle className="w-5 h-5 text-destructive" />
</div>
<div>
<p className="text-xs text-muted-foreground">Terlambat</p>
<p className="text-xl font-bold text-foreground">{totalTerlambat}</p>
</div>
</div>
</CardContent>
</Card>
</div>

<Card className="border-border/50">
<CardHeader>
<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
<div>
<CardTitle>Daftar Pembayaran SPP</CardTitle>
<CardDescription>
Periode {summary.periode || "-"} | Total {formatCurrency(totalNominal)} | Terbayar {formatCurrency(totalTerbayar)} | Sisa {formatCurrency(totalSisa)}
</CardDescription>
</div>
<div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
<div className="relative w-full sm:w-64">
<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
<Input
placeholder="Cari nama, NIS, atau no tagihan..."
value={searchQuery}
onChange={(e) => setSearchQuery(e.target.value)}
className="pl-9"
/>
</div>
<Select value={selectedKelas} onValueChange={setSelectedKelas}>
<SelectTrigger className="w-full sm:w-[170px]">
<Filter className="w-4 h-4 mr-2" />
<SelectValue placeholder="Kelas" />
</SelectTrigger>
<SelectContent>
<SelectItem value="all">Semua Kelas</SelectItem>
{kelasOptions.map((kelas) => (
<SelectItem key={kelas} value={kelas}>
{kelas}
</SelectItem>
))}
</SelectContent>
</Select>
<Select value={selectedStatus} onValueChange={setSelectedStatus}>
<SelectTrigger className="w-full sm:w-[170px]">
<SelectValue placeholder="Status" />
</SelectTrigger>
<SelectContent>
<SelectItem value="all">Semua Status</SelectItem>
{paymentStatusOptions.map((status) => (
<SelectItem key={status} value={status}>
{status}
</SelectItem>
))}
</SelectContent>
</Select>
</div>
</div>
</CardHeader>
<CardContent>
<div className="rounded-lg border border-border overflow-x-auto">
<Table>
<TableHeader>
<TableRow>
<TableHead>No Tagihan</TableHead>
<TableHead>Santri</TableHead>
<TableHead>Kelas</TableHead>
<TableHead>Bulan</TableHead>
<TableHead>Jatuh Tempo</TableHead>
<TableHead>Nominal</TableHead>
<TableHead>Terbayar</TableHead>
<TableHead>Sisa</TableHead>
<TableHead>Status</TableHead>
<TableHead className="text-right">Aksi</TableHead>
</TableRow>
</TableHeader>
<TableBody>
{paymentLoading || summaryLoading ? (
<TableRow>
<TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
<span className="inline-flex items-center gap-2">
<Loader2 className="w-4 h-4 animate-spin" />
Memuat data pembayaran...
</span>
</TableCell>
</TableRow>
) : null}

{!paymentLoading &&
filteredData.map((item) => {
const sisa = Math.max(item.nominal - item.terbayar, 0)
return (
<TableRow key={item.id}>
<TableCell className="font-medium">{item.noTagihan}</TableCell>
<TableCell>
<div className="flex items-center gap-3">
<Avatar className="w-8 h-8">
<AvatarFallback className="bg-primary/10 text-primary text-xs">
{item.nama
.split(" ")
.map((part) => part[0])
.join("")
.slice(0, 2)}
</AvatarFallback>
</Avatar>
<div>
<p className="font-medium text-foreground">{item.nama}</p>
<p className="text-xs text-muted-foreground">NIS {item.nis || "-"}</p>
</div>
</div>
</TableCell>
<TableCell>{item.kelas || "-"}</TableCell>
<TableCell>{item.bulan || "-"}</TableCell>
<TableCell>{formatDate(item.jatuhTempo)}</TableCell>
<TableCell>{formatCurrency(item.nominal)}</TableCell>
<TableCell>{formatCurrency(item.terbayar)}</TableCell>
<TableCell className={sisa > 0 ? "text-destructive font-medium" : "text-primary font-medium"}>
{formatCurrency(sisa)}
</TableCell>
<TableCell>{getStatusBadge(item.status)}</TableCell>
<TableCell className="text-right">
<DropdownMenu>
<DropdownMenuTrigger asChild>
<Button variant="ghost" size="icon" className="h-8 w-8">
<MoreHorizontal className="w-4 h-4" />
</Button>
</DropdownMenuTrigger>
<DropdownMenuContent align="end">
<DropdownMenuLabel>Aksi</DropdownMenuLabel>
<DropdownMenuSeparator />
<DropdownMenuItem onClick={() => void handleOpenDetail(item)}>
<Eye className="w-4 h-4 mr-2" />
Lihat Detail
</DropdownMenuItem>
<DropdownMenuItem onClick={() => void handleOpenEdit(item)}>
<Edit className="w-4 h-4 mr-2" />
Catat Pembayaran
</DropdownMenuItem>
<DropdownMenuItem
className="text-destructive focus:text-destructive"
onClick={() => void handleDeletePayment(item)}
>
<Trash2 className="w-4 h-4 mr-2" />
Hapus Tagihan
</DropdownMenuItem>
</DropdownMenuContent>
</DropdownMenu>
</TableCell>
</TableRow>
)
})}

{!paymentLoading && filteredData.length === 0 ? (
<TableRow>
<TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
Data pembayaran SPP tidak ditemukan.
</TableCell>
</TableRow>
) : null}
</TableBody>
</Table>
</div>
</CardContent>
</Card>

<Card className="border-border/50">
<CardHeader>
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
<div>
<CardTitle className="flex items-center gap-2">
<Settings className="w-5 h-5 text-primary" />
Pengaturan SPP
</CardTitle>
<CardDescription>Kelola nominal dan aturan jatuh tempo SPP per jenjang/kelas</CardDescription>
</div>
<Dialog open={isAddSettingDialogOpen} onOpenChange={setIsAddSettingDialogOpen}>
<DialogTrigger asChild>
<Button size="sm" className="bg-primary text-primary-foreground">
<Plus className="w-4 h-4 mr-2" />
Tambah Setting
</Button>
</DialogTrigger>
<DialogContent className="sm:max-w-[640px]">
<DialogHeader>
<DialogTitle>Tambah Setting SPP</DialogTitle>
<DialogDescription>
Atur nominal SPP sesuai jenjang dan tahun ajaran
</DialogDescription>
</DialogHeader>
<div className="grid gap-4 py-2">
<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label htmlFor="setting-nama">Nama Setting</Label>
<Input
id="setting-nama"
placeholder="Contoh: SPP SMA 2026"
value={newSettingForm.nama}
onChange={(e) =>
setNewSettingForm((prev) => ({ ...prev, nama: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label htmlFor="setting-tahun">Tahun Ajaran</Label>
<Input
id="setting-tahun"
placeholder="Contoh: 2026/2027"
value={newSettingForm.tahunAjaran}
onChange={(e) =>
setNewSettingForm((prev) => ({ ...prev, tahunAjaran: e.target.value }))
}
/>
</div>
</div>
<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label htmlFor="setting-jenjang">Jenjang</Label>
<Input
id="setting-jenjang"
placeholder="Contoh: SMA"
value={newSettingForm.jenjang}
onChange={(e) =>
setNewSettingForm((prev) => ({ ...prev, jenjang: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label htmlFor="setting-kelas">Kelas</Label>
<Input
id="setting-kelas"
placeholder="Contoh: 12 IPA"
value={newSettingForm.kelas}
onChange={(e) =>
setNewSettingForm((prev) => ({ ...prev, kelas: e.target.value }))
}
/>
</div>
</div>
<div className="grid grid-cols-3 gap-4">
<div className="space-y-2">
<Label htmlFor="setting-nominal">Nominal SPP</Label>
<Input
id="setting-nominal"
placeholder="450000"
value={newSettingForm.nominal}
onChange={(e) =>
setNewSettingForm((prev) => ({ ...prev, nominal: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label htmlFor="setting-jatuh-tempo">Tanggal Jatuh Tempo</Label>
<Input
id="setting-jatuh-tempo"
placeholder="10"
value={newSettingForm.jatuhTempoHari}
onChange={(e) =>
setNewSettingForm((prev) => ({ ...prev, jatuhTempoHari: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label>Status</Label>
<Select
value={newSettingForm.aktif}
onValueChange={(value) =>
setNewSettingForm((prev) => ({ ...prev, aktif: value as "true" | "false" }))
}
>
<SelectTrigger>
<SelectValue placeholder="Pilih status" />
</SelectTrigger>
<SelectContent>
<SelectItem value="true">Aktif</SelectItem>
<SelectItem value="false">Nonaktif</SelectItem>
</SelectContent>
</Select>
</div>
</div>
<div className="space-y-2">
<Label htmlFor="setting-keterangan">Keterangan</Label>
<Textarea
id="setting-keterangan"
placeholder="Opsional"
value={newSettingForm.keterangan}
onChange={(e) =>
setNewSettingForm((prev) => ({ ...prev, keterangan: e.target.value }))
}
/>
</div>
</div>
<DialogFooter>
<Button variant="outline" onClick={() => setIsAddSettingDialogOpen(false)}>
Batal
</Button>
<Button className="bg-primary text-primary-foreground" onClick={() => void handleAddSetting()}>
{createSettingLoading ? (
<Loader2 className="w-4 h-4 mr-2 animate-spin" />
) : null}
Simpan
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
</div>
</CardHeader>
<CardContent>
<div className="rounded-lg border border-border overflow-x-auto">
<Table>
<TableHeader>
<TableRow>
<TableHead>Nama Setting</TableHead>
<TableHead>Jenjang/Kelas</TableHead>
<TableHead>Tahun Ajaran</TableHead>
<TableHead>Nominal</TableHead>
<TableHead>Jatuh Tempo</TableHead>
<TableHead>Status</TableHead>
<TableHead className="text-right">Aksi</TableHead>
</TableRow>
</TableHeader>
<TableBody>
{settingLoading ? (
<TableRow>
<TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
<span className="inline-flex items-center gap-2">
<Loader2 className="w-4 h-4 animate-spin" />
Memuat setting SPP...
</span>
</TableCell>
</TableRow>
) : null}

{!settingLoading &&
settingData.map((item) => (
<TableRow key={item.id}>
<TableCell className="font-medium">{item.nama}</TableCell>
<TableCell>
{[item.jenjang, item.kelas].filter(Boolean).join(" / ") || "-"}
</TableCell>
<TableCell>{item.tahunAjaran || "-"}</TableCell>
<TableCell>{formatCurrency(item.nominal)}</TableCell>
<TableCell>
{item.jatuhTempoHari ? `Tanggal ${item.jatuhTempoHari}` : "-"}
</TableCell>
<TableCell>
{item.aktif ? (
<Badge className="bg-primary/10 text-primary border-0">Aktif</Badge>
) : (
<Badge variant="outline">Nonaktif</Badge>
)}
</TableCell>
<TableCell className="text-right">
<DropdownMenu>
<DropdownMenuTrigger asChild>
<Button variant="ghost" size="icon" className="h-8 w-8">
<MoreHorizontal className="w-4 h-4" />
</Button>
</DropdownMenuTrigger>
<DropdownMenuContent align="end">
<DropdownMenuItem onClick={() => void handleOpenEditSetting(item)}>
<Edit className="w-4 h-4 mr-2" />
Edit Setting
</DropdownMenuItem>
<DropdownMenuItem
className="text-destructive focus:text-destructive"
onClick={() => void handleDeleteSetting(item)}
>
<Trash2 className="w-4 h-4 mr-2" />
Hapus Setting
</DropdownMenuItem>
</DropdownMenuContent>
</DropdownMenu>
</TableCell>
</TableRow>
))}

{!settingLoading && settingData.length === 0 ? (
<TableRow>
<TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
Belum ada setting SPP.
</TableCell>
</TableRow>
) : null}
</TableBody>
</Table>
</div>
</CardContent>
</Card>

<Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
<DialogContent className="sm:max-w-[560px]">
<DialogHeader>
<DialogTitle>Detail Pembayaran SPP</DialogTitle>
<DialogDescription>Informasi lengkap pembayaran santri</DialogDescription>
</DialogHeader>
{paymentDetailLoading ? (
<div className="py-6 text-center text-muted-foreground">
<span className="inline-flex items-center gap-2">
<Loader2 className="w-4 h-4 animate-spin" />
Memuat detail...
</span>
</div>
) : (
<div className="grid grid-cols-2 gap-4 py-2 text-sm">
<div>
<p className="text-muted-foreground">No Tagihan</p>
<p className="font-medium">{currentDetail?.noTagihan || "-"}</p>
</div>
<div>
<p className="text-muted-foreground">NIS</p>
<p className="font-medium">{currentDetail?.nis || "-"}</p>
</div>
<div>
<p className="text-muted-foreground">Nama</p>
<p className="font-medium">{currentDetail?.nama || "-"}</p>
</div>
<div>
<p className="text-muted-foreground">Kelas</p>
<p className="font-medium">{currentDetail?.kelas || "-"}</p>
</div>
<div>
<p className="text-muted-foreground">Bulan Tagihan</p>
<p className="font-medium">{currentDetail?.bulan || "-"}</p>
</div>
<div>
<p className="text-muted-foreground">Jatuh Tempo</p>
<p className="font-medium">{formatDate(currentDetail?.jatuhTempo || "")}</p>
</div>
<div>
<p className="text-muted-foreground">Nominal</p>
<p className="font-medium">{formatCurrency(currentDetail?.nominal || 0)}</p>
</div>
<div>
<p className="text-muted-foreground">Terbayar</p>
<p className="font-medium">{formatCurrency(currentDetail?.terbayar || 0)}</p>
</div>
<div className="col-span-2">
<p className="text-muted-foreground">Status</p>
<div className="mt-1">
{currentDetail ? getStatusBadge(currentDetail.status) : <Badge variant="outline">-</Badge>}
</div>
</div>
</div>
)}
</DialogContent>
</Dialog>

<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
<DialogContent className="sm:max-w-[640px]">
<DialogHeader>
<DialogTitle>Catat / Ubah Pembayaran</DialogTitle>
<DialogDescription>Perbarui data pembayaran dan status tagihan SPP</DialogDescription>
</DialogHeader>
<div className="grid gap-4 py-2">
<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label>No Tagihan</Label>
<Input
value={editPaymentForm.noTagihan}
onChange={(e) =>
setEditPaymentForm((prev) => ({ ...prev, noTagihan: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label>NIS</Label>
<Input
value={editPaymentForm.nis}
onChange={(e) =>
setEditPaymentForm((prev) => ({ ...prev, nis: e.target.value }))
}
/>
</div>
</div>
<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label>Nama</Label>
<Input
value={editPaymentForm.nama}
onChange={(e) =>
setEditPaymentForm((prev) => ({ ...prev, nama: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label>Kelas</Label>
<Input
value={editPaymentForm.kelas}
onChange={(e) =>
setEditPaymentForm((prev) => ({ ...prev, kelas: e.target.value }))
}
/>
</div>
</div>
<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label>Bulan</Label>
<Input
value={editPaymentForm.bulan}
onChange={(e) =>
setEditPaymentForm((prev) => ({ ...prev, bulan: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label>Jatuh Tempo</Label>
<Input
type="date"
value={editPaymentForm.jatuhTempo}
onChange={(e) =>
setEditPaymentForm((prev) => ({ ...prev, jatuhTempo: e.target.value }))
}
/>
</div>
</div>
<div className="grid grid-cols-3 gap-4">
<div className="space-y-2">
<Label>Nominal</Label>
<Input
value={editPaymentForm.nominal}
onChange={(e) =>
setEditPaymentForm((prev) => ({ ...prev, nominal: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label>Terbayar</Label>
<Input
value={editPaymentForm.terbayar}
onChange={(e) =>
setEditPaymentForm((prev) => ({ ...prev, terbayar: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label>Status</Label>
<Select
value={editPaymentForm.status}
onValueChange={(value) =>
setEditPaymentForm((prev) => ({ ...prev, status: value as SppStatus }))
}
>
<SelectTrigger>
<SelectValue placeholder="Pilih status" />
</SelectTrigger>
<SelectContent>
{paymentStatusOptions.map((status) => (
<SelectItem key={status} value={status}>
{status}
</SelectItem>
))}
</SelectContent>
</Select>
</div>
</div>
</div>
<DialogFooter>
<Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
Batal
</Button>
<Button className="bg-primary text-primary-foreground" onClick={() => void handleUpdatePayment()}>
{updatePaymentLoading ? (
<Loader2 className="w-4 h-4 mr-2 animate-spin" />
) : null}
Simpan Perubahan
</Button>
</DialogFooter>
</DialogContent>
</Dialog>

<Dialog open={isEditSettingDialogOpen} onOpenChange={setIsEditSettingDialogOpen}>
<DialogContent className="sm:max-w-[640px]">
<DialogHeader>
<DialogTitle>Edit Setting SPP</DialogTitle>
<DialogDescription>Perbarui konfigurasi nominal dan aturan SPP</DialogDescription>
</DialogHeader>
{settingDetailLoading ? (
<div className="py-6 text-center text-muted-foreground">
<span className="inline-flex items-center gap-2">
<Loader2 className="w-4 h-4 animate-spin" />
Memuat detail setting...
</span>
</div>
) : (
<div className="grid gap-4 py-2">
<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label>Nama Setting</Label>
<Input
value={editSettingForm.nama}
onChange={(e) =>
setEditSettingForm((prev) => ({ ...prev, nama: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label>Tahun Ajaran</Label>
<Input
value={editSettingForm.tahunAjaran}
onChange={(e) =>
setEditSettingForm((prev) => ({ ...prev, tahunAjaran: e.target.value }))
}
/>
</div>
</div>
<div className="grid grid-cols-2 gap-4">
<div className="space-y-2">
<Label>Jenjang</Label>
<Input
value={editSettingForm.jenjang}
onChange={(e) =>
setEditSettingForm((prev) => ({ ...prev, jenjang: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label>Kelas</Label>
<Input
value={editSettingForm.kelas}
onChange={(e) =>
setEditSettingForm((prev) => ({ ...prev, kelas: e.target.value }))
}
/>
</div>
</div>
<div className="grid grid-cols-3 gap-4">
<div className="space-y-2">
<Label>Nominal</Label>
<Input
value={editSettingForm.nominal}
onChange={(e) =>
setEditSettingForm((prev) => ({ ...prev, nominal: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label>Tanggal Jatuh Tempo</Label>
<Input
value={editSettingForm.jatuhTempoHari}
onChange={(e) =>
setEditSettingForm((prev) => ({ ...prev, jatuhTempoHari: e.target.value }))
}
/>
</div>
<div className="space-y-2">
<Label>Status</Label>
<Select
value={editSettingForm.aktif}
onValueChange={(value) =>
setEditSettingForm((prev) => ({ ...prev, aktif: value as "true" | "false" }))
}
>
<SelectTrigger>
<SelectValue placeholder="Pilih status" />
</SelectTrigger>
<SelectContent>
<SelectItem value="true">Aktif</SelectItem>
<SelectItem value="false">Nonaktif</SelectItem>
</SelectContent>
</Select>
</div>
</div>
<div className="space-y-2">
<Label>Keterangan</Label>
<Textarea
value={editSettingForm.keterangan}
onChange={(e) =>
setEditSettingForm((prev) => ({ ...prev, keterangan: e.target.value }))
}
/>
</div>
</div>
)}
<DialogFooter>
<Button variant="outline" onClick={() => setIsEditSettingDialogOpen(false)}>
Batal
</Button>
<Button className="bg-primary text-primary-foreground" onClick={() => void handleUpdateSetting()}>
{updateSettingLoading ? (
<Loader2 className="w-4 h-4 mr-2 animate-spin" />
) : null}
Simpan Perubahan
</Button>
</DialogFooter>
</DialogContent>
</Dialog>
</div>
)
}
