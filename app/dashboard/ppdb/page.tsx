"use client"

import { useState } from "react"
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
import {
	Search,
	Plus,
	Filter,
	Download,
	MoreHorizontal,
	Eye,
	Edit,
	Trash2,
	UserPlus,
	Clock3,
	CheckCircle2,
	XCircle,
	FileCheck,
} from "lucide-react"

type PpdbStatus = "Menunggu" | "Terverifikasi" | "Diterima" | "Ditolak"

type Pendaftar = {
	id: string
	noPendaftaran: string
	name: string
	jenjang: string
	asalSekolah: string
	wali: string
	phone: string
	tanggalDaftar: string
	status: PpdbStatus
}

const ppdbData: Pendaftar[] = [
	{
		id: "P001",
		noPendaftaran: "PPDB-2025-001",
		name: "Muhammad Hasyim",
		jenjang: "SMP",
		asalSekolah: "SDIT Al-Hikmah",
		wali: "Bpk. Abdul Karim",
		phone: "081234560001",
		tanggalDaftar: "12 Jan 2025",
		status: "Menunggu",
	},
	{
		id: "P002",
		noPendaftaran: "PPDB-2025-002",
		name: "Aisyah Nurani",
		jenjang: "SMA",
		asalSekolah: "SMPN 3 Bandung",
		wali: "Ibu Siti Rahmah",
		phone: "081234560002",
		tanggalDaftar: "12 Jan 2025",
		status: "Terverifikasi",
	},
	{
		id: "P003",
		noPendaftaran: "PPDB-2025-003",
		name: "Fajar Ramadhan",
		jenjang: "SD",
		asalSekolah: "TK Nurul Ilmi",
		wali: "Bpk. Ramadhan Yusuf",
		phone: "081234560003",
		tanggalDaftar: "13 Jan 2025",
		status: "Diterima",
	},
	{
		id: "P004",
		noPendaftaran: "PPDB-2025-004",
		name: "Khadijah Aulia",
		jenjang: "SMP",
		asalSekolah: "SDN 2 Cibiru",
		wali: "Ibu Aulia Fitri",
		phone: "081234560004",
		tanggalDaftar: "13 Jan 2025",
		status: "Terverifikasi",
	},
	{
		id: "P005",
		noPendaftaran: "PPDB-2025-005",
		name: "Umar Alfarizi",
		jenjang: "SMA",
		asalSekolah: "SMPIT Fathan",
		wali: "Bpk. Alfarizi Hasan",
		phone: "081234560005",
		tanggalDaftar: "14 Jan 2025",
		status: "Ditolak",
	},
	{
		id: "P006",
		noPendaftaran: "PPDB-2025-006",
		name: "Maryam Salsabila",
		jenjang: "SD",
		asalSekolah: "TKIT Bina Umat",
		wali: "Ibu Salsabila Hanum",
		phone: "081234560006",
		tanggalDaftar: "14 Jan 2025",
		status: "Menunggu",
	},
]

const getStatusBadge = (status: PpdbStatus) => {
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
			return <Badge variant="outline">-</Badge>
	}
}

export default function PpdbPage() {
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedJenjang, setSelectedJenjang] = useState("all")
	const [selectedStatus, setSelectedStatus] = useState("all")
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

	const filteredData = ppdbData.filter((pendaftar) => {
		const matchesSearch =
			pendaftar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			pendaftar.noPendaftaran.toLowerCase().includes(searchQuery.toLowerCase())
		const matchesJenjang = selectedJenjang === "all" || pendaftar.jenjang === selectedJenjang
		const matchesStatus = selectedStatus === "all" || pendaftar.status === selectedStatus
		return matchesSearch && matchesJenjang && matchesStatus
	})

	const totalPendaftar = ppdbData.length
	const totalMenunggu = ppdbData.filter((item) => item.status === "Menunggu").length
	const totalTerverifikasi = ppdbData.filter((item) => item.status === "Terverifikasi").length
	const totalDiterima = ppdbData.filter((item) => item.status === "Diterima").length
	const totalDitolak = ppdbData.filter((item) => item.status === "Ditolak").length

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-foreground">PPDB - Penerimaan Murid Baru</h1>
					<p className="text-muted-foreground">Kelola pendaftaran dan proses seleksi murid baru</p>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm">
						<Download className="w-4 h-4 mr-2" />
						Export
					</Button>
					<Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
						<DialogTrigger asChild>
							<Button size="sm" className="bg-primary text-primary-foreground">
								<Plus className="w-4 h-4 mr-2" />
								Tambah Pendaftar
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[560px]">
							<DialogHeader>
								<DialogTitle>Tambah Pendaftar Baru</DialogTitle>
								<DialogDescription>
									Lengkapi data calon murid untuk proses PPDB
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="nama">Nama Lengkap</Label>
										<Input id="nama" placeholder="Nama calon murid" />
									</div>
									<div className="space-y-2">
										<Label htmlFor="jenjang">Jenjang Tujuan</Label>
										<Select>
											<SelectTrigger>
												<SelectValue placeholder="Pilih jenjang" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="sd">SD</SelectItem>
												<SelectItem value="smp">SMP</SelectItem>
												<SelectItem value="sma">SMA</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="asal-sekolah">Asal Sekolah</Label>
										<Input id="asal-sekolah" placeholder="Nama sekolah asal" />
									</div>
									<div className="space-y-2">
										<Label htmlFor="tanggal-daftar">Tanggal Daftar</Label>
										<Input id="tanggal-daftar" placeholder="Contoh: 15 Jan 2025" />
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="wali">Nama Wali</Label>
										<Input id="wali" placeholder="Nama wali murid" />
									</div>
									<div className="space-y-2">
										<Label htmlFor="telepon">No. Telepon Wali</Label>
										<Input id="telepon" placeholder="08xxxxxxxxxx" />
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="status">Status Pendaftaran</Label>
									<Select>
										<SelectTrigger>
											<SelectValue placeholder="Pilih status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="menunggu">Menunggu</SelectItem>
											<SelectItem value="terverifikasi">Terverifikasi</SelectItem>
											<SelectItem value="diterima">Diterima</SelectItem>
											<SelectItem value="ditolak">Ditolak</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
									Batal
								</Button>
								<Button className="bg-primary text-primary-foreground" onClick={() => setIsAddDialogOpen(false)}>
									Simpan
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<Card className="border-border/50">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
								<UserPlus className="w-5 h-5 text-primary" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Total Pendaftar</p>
								<p className="text-xl font-bold text-foreground">{totalPendaftar}</p>
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
								<p className="text-xs text-muted-foreground">Menunggu</p>
								<p className="text-xl font-bold text-foreground">{totalMenunggu}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/50">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
								<FileCheck className="w-5 h-5 text-accent" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Terverifikasi</p>
								<p className="text-xl font-bold text-foreground">{totalTerverifikasi}</p>
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
								<p className="text-xs text-muted-foreground">Diterima</p>
								<p className="text-xl font-bold text-foreground">{totalDiterima}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-border/50">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
								<XCircle className="w-5 h-5 text-destructive" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">Ditolak</p>
								<p className="text-xl font-bold text-foreground">{totalDitolak}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

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
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>
							<Select value={selectedJenjang} onValueChange={setSelectedJenjang}>
								<SelectTrigger className="w-full sm:w-[140px]">
									<Filter className="w-4 h-4 mr-2" />
									<SelectValue placeholder="Jenjang" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Jenjang</SelectItem>
									<SelectItem value="SD">SD</SelectItem>
									<SelectItem value="SMP">SMP</SelectItem>
									<SelectItem value="SMA">SMA</SelectItem>
								</SelectContent>
							</Select>
							<Select value={selectedStatus} onValueChange={setSelectedStatus}>
								<SelectTrigger className="w-full sm:w-[160px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Status</SelectItem>
									<SelectItem value="Menunggu">Menunggu</SelectItem>
									<SelectItem value="Terverifikasi">Terverifikasi</SelectItem>
									<SelectItem value="Diterima">Diterima</SelectItem>
									<SelectItem value="Ditolak">Ditolak</SelectItem>
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
									<TableHead>No Pendaftaran</TableHead>
									<TableHead>Calon Murid</TableHead>
									<TableHead>Jenjang</TableHead>
									<TableHead>Asal Sekolah</TableHead>
									<TableHead>Wali</TableHead>
									<TableHead>Tanggal Daftar</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredData.map((pendaftar) => (
									<TableRow key={pendaftar.id}>
										<TableCell className="font-medium">{pendaftar.noPendaftaran}</TableCell>
										<TableCell>
											<div className="flex items-center gap-3">
												<Avatar className="w-8 h-8">
													<AvatarFallback className="bg-primary/10 text-primary text-xs">
														{pendaftar.name
															.split(" ")
															.map((part) => part[0])
															.join("")
															.slice(0, 2)}
													</AvatarFallback>
												</Avatar>
												<div>
													<p className="font-medium text-foreground">{pendaftar.name}</p>
													<p className="text-xs text-muted-foreground">{pendaftar.phone}</p>
												</div>
											</div>
										</TableCell>
										<TableCell>{pendaftar.jenjang}</TableCell>
										<TableCell>{pendaftar.asalSekolah}</TableCell>
										<TableCell>{pendaftar.wali}</TableCell>
										<TableCell>{pendaftar.tanggalDaftar}</TableCell>
										<TableCell>{getStatusBadge(pendaftar.status)}</TableCell>
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
													<DropdownMenuItem>
														<Eye className="w-4 h-4 mr-2" />
														Detail Pendaftar
													</DropdownMenuItem>
													<DropdownMenuItem>
														<Edit className="w-4 h-4 mr-2" />
														Ubah Data
													</DropdownMenuItem>
													<DropdownMenuItem className="text-destructive focus:text-destructive">
														<Trash2 className="w-4 h-4 mr-2" />
														Hapus Pendaftar
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}

								{filteredData.length === 0 && (
									<TableRow>
										<TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
											Data pendaftar tidak ditemukan.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
