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
} from "lucide-react"
import type { PpdbDetail } from "@/lib/services/ppdb.service"

interface PpdbTableProps {
  data: PpdbDetail[]
  loading: boolean
  searchQuery: string
  selectedStatus: string
  selectedProgram: string
  programOptions: string[]
  verificationLoading: boolean
  deleteLoading: boolean
  onSearchChange: (val: string) => void
  onStatusChange: (val: string) => void
  onProgramChange: (val: string) => void
  onDetail: (item: PpdbDetail) => void
  onVerifikasi: (item: PpdbDetail, status: "Diterima" | "Ditolak") => void
  onDelete: (item: PpdbDetail) => void
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
  loading,
  searchQuery,
  selectedStatus,
  selectedProgram,
  programOptions,
  verificationLoading,
  deleteLoading,
  onSearchChange,
  onStatusChange,
  onProgramChange,
  onDetail,
  onVerifikasi,
  onDelete,
}: PpdbTableProps) {
  const filtered = data.filter((p) => {
    const kw = searchQuery.toLowerCase()
    const matchSearch =
      p.name.toLowerCase().includes(kw) ||
      p.noPendaftaran.toLowerCase().includes(kw)
    const matchStatus = selectedStatus === "all" || p.status === selectedStatus
    const prog = p.programPendaftaran || p.jenjang
    const matchProgram =
      selectedProgram === "all" ||
      (prog && prog.toLowerCase() === selectedProgram.toLowerCase())
    return matchSearch && matchStatus && matchProgram
  })

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
                                className="text-destructive focus:text-destructive"
                                onClick={() => onVerifikasi(p, "Ditolak")}
                                disabled={verificationLoading}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Tolak
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
        </div>
      </CardContent>
    </Card>
  )
}
