"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Loader2,
  Download,
  User,
  BookOpen,
  GraduationCap,
  Calendar,
  Hash,
  Building2,
  Pencil,
  Eye,
  DollarSign,
  PlusCircle,
  Percent,
  BadgeCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTagihanDetail, useUbahStatusPembayaran } from "@/hooks/use-pembayaran"
import { useToast } from "@/hooks/use-toast"
import { pembayaranService } from "@/lib/services/pembayaran.service"

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v)

const formatDate = (value: string | null) => {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

type InvoiceRow = {
  id_pembayaran: number
  nomor_invoice: string
  periode_tagihan: string | null
  rincian_tagihan: string | null
  jumlah_potongan?: number
  jumlah_tagihan: number
  jumlah_dibayar: number
  jumlah_tunggakan: number
  status_label: string
  status_key: string
  waktu_invoice: string | null
  kwitansi_url: string | null
}

const StatusBadge = ({ statusKey }: { statusKey: string }) => {
  switch (statusKey) {
    case "lunas":
      return <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-xs">Lunas</Badge>
    case "menunggu_konfirmasi":
      return <Badge className="bg-blue-500/15 text-blue-700 border-0 text-xs">Menunggu Konfirmasi</Badge>
    case "dibatalkan":
      return <Badge className="bg-slate-400/15 text-slate-600 border-0 text-xs">Dibatalkan</Badge>
    default:
      return <Badge className="bg-red-500/15 text-red-700 border-0 text-xs">Menunggu Pembayaran</Badge>
  }
}

function InvoiceTable({ 
  rows, 
  index_start = 1,
  onView,
  onEdit,
  onPay,
}: { 
  rows: InvoiceRow[]; 
  index_start?: number;
  onView: (row: InvoiceRow) => void;
  onEdit: (row: InvoiceRow) => void;
  onPay: (row: InvoiceRow) => void;
}) {
  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="w-10 text-center">#</TableHead>
            <TableHead>Tagihan Unit</TableHead>
            <TableHead>Tagihan Kelas</TableHead>
            <TableHead>Periode Tagihan</TableHead>
            <TableHead>Rincian Tagihan</TableHead>
            <TableHead className="text-right">Jml. Potongan</TableHead>
            <TableHead className="text-right">Jml. Tagihan</TableHead>
            <TableHead className="text-right">Jml. Dibayar</TableHead>
            <TableHead className="text-right">Jml. Tunggakan</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-sm">
                Tidak ada data.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow key={row.id_pembayaran} className="hover:bg-muted/30 transition-colors">
                <TableCell className="text-center text-sm text-muted-foreground font-medium">
                  {index_start + idx}
                </TableCell>
                <TableCell className="text-sm">
                  {row.rincian_tagihan ? (
                    <div>
                      <p className="font-semibold text-primary text-xs">{row.rincian_tagihan}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(row.jumlah_tagihan)}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {row.rincian_tagihan ? (
                    <div>
                      <p className="font-semibold text-primary text-xs">UNIT {row.rincian_tagihan.split(' ')[0]}</p>
                    </div>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-sm">{row.periode_tagihan || formatDate(row.waktu_invoice)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{row.rincian_tagihan || "Tagihan SPP"}</TableCell>
                <TableCell className="text-right text-sm">
                  {formatCurrency(row.jumlah_potongan ?? 0)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatCurrency(row.jumlah_tagihan)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium text-emerald-600">
                  {formatCurrency(row.jumlah_dibayar)}
                </TableCell>
                <TableCell
                  className={`text-right text-sm font-medium ${
                    row.jumlah_tunggakan > 0 ? "text-red-600" : "text-muted-foreground"
                  }`}
                >
                  {formatCurrency(row.jumlah_tunggakan)}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge statusKey={row.status_key} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="icon" className="w-8 h-8" title="Detail" onClick={() => onView(row)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="w-8 h-8 text-blue-600" title="Edit" onClick={() => onEdit(row)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="w-8 h-8 text-emerald-600" 
                      title="Bayar"
                      onClick={() => onPay(row)}
                      disabled={row.status_key === 'lunas'}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default function SppTagihanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const { data, loading, error, fetchTagihanDetail } = useTagihanDetail()
  const { toast } = useToast()

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null)
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Payment form state
  const [payForm, setPayForm] = useState({
    nominal: 0,
    tanggal: new Date().toISOString().split('T')[0],
    metode: 'Tunai',
    catatan: ''
  })

  useEffect(() => {
    if (id) void fetchTagihanDetail(id)
  }, [id, fetchTagihanDetail])

  const handlePayClick = (row: InvoiceRow) => {
    setSelectedInvoice(row)
    setPayForm({
      nominal: row.jumlah_tunggakan,
      tanggal: new Date().toISOString().split('T')[0],
      metode: 'Tunai',
      catatan: ''
    })
    setPayDialogOpen(true)
  }

  const handleProcessPayment = async () => {
    if (!selectedInvoice) return
    setSubmitting(true)
    try {
      // For now, use ubahStatus to mark as lunas. 
      // In a more complete implementation, we'd record the payment amount etc.
      await pembayaranService.ubahStatus(selectedInvoice.id_pembayaran.toString(), {
        status: 'lunas',
        keterangan: `${payForm.metode}: ${payForm.catatan || 'Pembayaran manual'}`
      })
      
      toast({
        title: "Berhasil",
        description: "Pembayaran telah berhasil dicatat.",
      })
      setPayDialogOpen(false)
      if (id) void fetchTagihanDetail(id)
    } catch (err) {
      toast({
        title: "Gagal",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const belumLunas = useMemo(
    () => (data?.invoice ?? []).filter((item: InvoiceRow) => item.status_key !== "lunas"),
    [data],
  )
  const sudahLunas = useMemo(
    () => (data?.invoice ?? []).filter((item: InvoiceRow) => item.status_key === "lunas"),
    [data],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Memuat detail tagihan...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
        {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground text-sm">
        Data tidak ditemukan.
      </div>
    )
  }

  const totalInvoice = data.ringkasan?.jumlah_invoice ?? (data.invoice?.length ?? 0)
  const totalTagihan = data.ringkasan?.total_tagihan ?? 0
  const totalDibayar = data.ringkasan?.total_dibayar ?? 0
  const totalTunggakan = data.ringkasan?.total_tunggakan ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/spp")} id="btn-back-tagihan-detail">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Detail Tagihan</h1>
          <p className="text-sm text-muted-foreground">Ringkasan dan rincian invoice per santri/calon santri</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700 h-9">
            <PlusCircle className="w-4 h-4 mr-2" /> Tambah
          </Button>
          <Button variant="outline" className="h-9">
            <Percent className="w-4 h-4 mr-2" /> Potongan
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Jumlah Invoice</p>
            <p className="text-2xl font-bold text-foreground">{totalInvoice}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Tagihan</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totalTagihan)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Sudah Dibayar</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalDibayar)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Belum Dibayar</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalTunggakan)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Profil + Daftar Tagihan */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1 border-border/50">
          <CardContent className="p-6">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-5">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border mb-3">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
              <Badge className="bg-emerald-500/15 text-emerald-700 border-0 text-xs px-3">
                {data.profil?.status?.toUpperCase() ?? "AKTIF"}
              </Badge>
            </div>

            {/* Profile Fields */}
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Nama Lengkap</p>
                  <p className="font-semibold text-foreground">{data.profil?.nama_lengkap || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Hash className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Nomor Induk/Pendaftaran</p>
                  <p className="font-mono text-foreground">{data.profil?.nomor_induk || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Unit Pendidikan</p>
                  <p className="text-foreground">{data.profil?.nama_unit || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <BookOpen className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Kelas Sekarang</p>
                  <p className="text-foreground">{data.profil?.kelas_sekarang || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Tahun Ajaran</p>
                  <p className="text-foreground">{data.profil?.tahun_ajaran || "-"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <GraduationCap className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Sumber</p>
                  <Badge variant="outline" className="uppercase text-xs mt-0.5">
                    {data.profil?.sumber || "santri"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Table Card */}
        <Card className="md:col-span-2 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Daftar Tagihan</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="belum-lunas" className="space-y-4">
              <TabsList>
                <TabsTrigger value="belum-lunas" id="tab-belum-lunas">
                  Belum Lunas ({belumLunas.length})
                </TabsTrigger>
                <TabsTrigger value="sudah-lunas" id="tab-sudah-lunas">
                  Sudah Lunas ({sudahLunas.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="belum-lunas">
                <InvoiceTable 
                  rows={belumLunas as InvoiceRow[]} 
                  index_start={1} 
                  onView={(row) => { setSelectedInvoice(row); setDetailDialogOpen(true) }}
                  onEdit={(row) => toast({ title: "Fitur Edit", description: "Halaman edit sedang dalam pengembangan." })}
                  onPay={handlePayClick}
                />
              </TabsContent>

              <TabsContent value="sudah-lunas">
                <InvoiceTable 
                  rows={sudahLunas as InvoiceRow[]} 
                  index_start={1} 
                  onView={(row) => { setSelectedInvoice(row); setDetailDialogOpen(true) }}
                  onEdit={() => {}}
                  onPay={() => {}}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
            <DialogDescription>
              Masukkan rincian pembayaran untuk invoice <strong>{selectedInvoice?.nomor_invoice}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nominal">Nominal Pembayaran</Label>
              <Input
                id="nominal"
                type="number"
                value={payForm.nominal}
                onChange={(e) => setPayForm({ ...payForm, nominal: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tanggal">Tanggal Bayar</Label>
              <Input
                id="tanggal"
                type="date"
                value={payForm.tanggal}
                onChange={(e) => setPayForm({ ...payForm, tanggal: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="metode">Metode Pembayaran</Label>
              <Select value={payForm.metode} onValueChange={(v) => setPayForm({ ...payForm, metode: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Metode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tunai">Tunai</SelectItem>
                  <SelectItem value="Transfer">Transfer Bank</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="catatan">Catatan</Label>
              <Input
                id="catatan"
                placeholder="Contoh: Titipan wali santri"
                value={payForm.catatan}
                onChange={(e) => setPayForm({ ...payForm, catatan: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Batal</Button>
            <Button onClick={handleProcessPayment} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
              Simpan Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rincian Invoice</DialogTitle>
            <DialogDescription>
              Detail lengkap untuk tagihan <strong>{selectedInvoice?.nomor_invoice}</strong>
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-y-3">
                <div className="text-muted-foreground">Kategori</div>
                <div className="font-medium">{selectedInvoice.rincian_tagihan || "Tagihan SPP"}</div>
                
                <div className="text-muted-foreground">Periode</div>
                <div className="font-medium">{selectedInvoice.periode_tagihan || formatDate(selectedInvoice.waktu_invoice)}</div>
                
                <div className="text-muted-foreground">Jumlah Tagihan</div>
                <div className="font-medium">{formatCurrency(selectedInvoice.jumlah_tagihan)}</div>
                
                <div className="text-muted-foreground">Potongan</div>
                <div className="font-medium text-blue-600">-{formatCurrency(selectedInvoice.jumlah_potongan ?? 0)}</div>
                
                <div className="text-muted-foreground pt-2 border-t">Total Harus Dibayar</div>
                <div className="font-bold text-base pt-2 border-t">{formatCurrency(selectedInvoice.jumlah_tagihan - (selectedInvoice.jumlah_potongan ?? 0))}</div>
                
                <div className="text-muted-foreground">Status</div>
                <div><StatusBadge statusKey={selectedInvoice.status_key} /></div>
              </div>
              
              {selectedInvoice.status_key === 'lunas' && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <BadgeCheck className="w-5 h-5" />
                    <span className="font-medium">Pembayaran Lunas</span>
                  </div>
                  {selectedInvoice.kwitansi_url && (
                    <Button variant="ghost" size="sm" className="text-emerald-700 hover:text-emerald-800" asChild>
                      <a href={selectedInvoice.kwitansi_url} target="_blank" rel="noreferrer">
                        <Download className="w-4 h-4 mr-1" /> Kwitansi
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
