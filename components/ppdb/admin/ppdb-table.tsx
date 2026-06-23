"use client"

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
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileCheck,
  XCircle,
  Loader2,
  Wallet,
} from "lucide-react"
import type { PpdbDetail } from "@/types/ppdb/admin"
import type { PaginationMeta } from "@/lib/ppdb/admin-api"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PpdbTableProps {
  data: PpdbDetail[]
  meta?: PaginationMeta
  currentPage: number
  onPageChange: (page: number) => void
  loading: boolean
  searchQuery: string
  selectedStatus: string
  selectedProgram: string
  // POIN 2: Filter kelas dengan opsi dinamis
  selectedKelas?: string
  selectedStatusKelas?: string
  kelasOptions?: Array<{ kode_kelas: string; nama_kelas: string; tahun_ajaran?: string }>
  programOptions: string[]
  verificationLoading: boolean
  deleteLoading: boolean
  onSearchChange: (val: string) => void
  onStatusChange: (val: string) => void
  onProgramChange: (val: string) => void
  onKelasChange?: (val: string) => void
  onStatusKelasChange?: (val: string) => void
  onDetail: (item: PpdbDetail) => void
  onVerifikasi: (item: PpdbDetail, status: "Diterima" | "Ditolak" | "Menunggu") => void
  onDelete: (item: PpdbDetail) => void
  onCreateTagihan: (item: PpdbDetail) => void
  onCreateTagihanInfaq: (item: PpdbDetail) => void
  tagihanLoading: boolean
}

const formatDate = (value: string) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
  })
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Menunggu":
      return <Badge className="bg-chart-3/20 text-chart-4 border-0">Menunggu</Badge>
    case "Terverifikasi":
      return <Badge className="bg-accent/20 text-accent border-0">Terverifikasi</Badge>
    case "Diterima":
      return <Badge className="bg-primary/10 text-primary border-0">Diterima</Badge>
    case "Ditolak":
      return <Badge className="bg-destructive/10 text-destructive border-0">Ditolak</Badge>
    default:
      return <Badge variant="outline">Menunggu</Badge>
  }
}

const resolveWali = (p: PpdbDetail) =>
  p.wali || p.namaIbu || p.namaAyah || p.noHpIbu || p.noHpCalon || "-"

const resolveDisplayJenjang = (p: PpdbDetail) =>
  p.programPendaftaran || p.jenjang || "-"

const getInitials = (name: string) =>
  name
    ? name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2)
    : "NA"

export function PpdbTable({
  data,
  meta,
  currentPage,
  onPageChange,
  loading,
  searchQuery,
  selectedStatus,
  selectedProgram,
  // POIN 2: Destructure kelas filter props
  selectedKelas = "all",
  selectedStatusKelas = "all",
  kelasOptions = [],
  programOptions,
  verificationLoading,
  deleteLoading,
  onSearchChange,
  onStatusChange,
  onProgramChange,
  onKelasChange,
  onStatusKelasChange,
  onDetail,
  onVerifikasi,
  onDelete,
  onCreateTagihan,
  onCreateTagihanInfaq,
  tagihanLoading,
}: PpdbTableProps) {
  // We use server-side filtering and pagination now, so data is already filtered for the current page
  const filtered = data;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle>Daftar Pendaftar PPDB</CardTitle>
            <CardDescription>Monitoring status penerimaan murid baru</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau no pendaftaran..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedProgram} onValueChange={onProgramChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Program" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Program</SelectItem>
                {programOptions.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Menunggu">Menunggu</SelectItem>
                <SelectItem value="Diterima">Diterima</SelectItem>
                <SelectItem value="Ditolak">Ditolak</SelectItem>
              </SelectContent>
            </Select>
            {/* POIN 2: Filter kelas dengan opsi dinamis dari backend */}
            {onKelasChange && (
              <Select value={selectedKelas} onValueChange={onKelasChange}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasOptions.map((k) => (
                    <SelectItem key={k.kode_kelas} value={k.kode_kelas}>
                      {k.kode_kelas}
                      {k.nama_kelas ? ` — ${k.nama_kelas}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {onStatusKelasChange && (
              <Select value={selectedStatusKelas} onValueChange={onStatusKelasChange}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Status Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="available">Tersedia</SelectItem>
                  <SelectItem value="full">Penuh</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Memuat data...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No Pendaftaran</TableHead>
                  <TableHead>Calon Murid</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Jenjang</TableHead>
                  <TableHead>Asal Sekolah</TableHead>
                  <TableHead>Wali</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={`${p.id}-${p.noPendaftaran}`}>
                    <TableCell className="font-medium">{p.noPendaftaran}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(p.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{p.programPendaftaran || "-"}</TableCell>
                    <TableCell>{resolveDisplayJenjang(p)}</TableCell>
                    <TableCell>{p.asalSekolah}</TableCell>
                    <TableCell>{resolveWali(p)}</TableCell>
                    <TableCell>
                      {formatDate(p.tanggalDaftar || "")}
                    </TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
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
                          <DropdownMenuItem onClick={() => onDetail(p)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Detail Pendaftar
                          </DropdownMenuItem>
                          {(p.status === "Menunggu" || p.status === "Terverifikasi") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-primary focus:text-primary"
                                onClick={() => onVerifikasi(p, "Diterima")}
                                disabled={verificationLoading}
                              >
                                <FileCheck className="w-4 h-4 mr-2" />
                                Terima Santri
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-secondary-foreground"
                                onClick={() => onVerifikasi(p, "Menunggu")}
                                disabled={verificationLoading}
                              >
                                <MoreHorizontal className="w-4 h-4 mr-2" />
                                Ubah ke Menunggu
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => onVerifikasi(p, "Ditolak")}
                                disabled={verificationLoading}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Tolak
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => onCreateTagihan(p)}
                                disabled={tagihanLoading}
                              >
                                <Wallet className="w-4 h-4 mr-2" />
                                Buat Tagihan PPDB
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onCreateTagihanInfaq(p)}
                                disabled={tagihanLoading}
                              >
                                <Wallet className="w-4 h-4 mr-2" />
                                Buat Tagihan Infaq
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(p)}
                            disabled={deleteLoading || verificationLoading}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Hapus Pendaftar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Data pendaftar tidak ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Menampilkan {filtered.length} dari {meta.total} pendaftar 
                (Halaman {meta.current_page} dari {meta.last_page})
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1 || loading}
                  onClick={() => onPageChange(currentPage - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= meta.last_page || loading}
                  onClick={() => onPageChange(currentPage + 1)}
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
