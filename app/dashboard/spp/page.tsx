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
	Wallet,
	CheckCircle2,
	Clock3,
	AlertTriangle,
	Receipt,
} from "lucide-react"

type SppStatus = "Lunas" | "Cicilan" | "Belum Bayar" | "Terlambat"

type SppRecord = {
	id: string
	noTagihan: string
	nis: string
	nama: string
	kelas: string
	bulan: string
	jatuhTempo: string
	nominal: number
	terbayar: number
	status: SppStatus
}

const sppData: SppRecord[] = [
	{
		id: "SPP001",
		noTagihan: "INV-SPP-2025-001",
		nis: "2024001",
		nama: "Ahmad Fauzi",
		kelas: "12 IPA",
		bulan: "Januari 2025",
		jatuhTempo: "10 Jan 2025",
		nominal: 450000,
		terbayar: 450000,
		status: "Lunas",
	},
	{
		id: "SPP002",
		noTagihan: "INV-SPP-2025-002",
		nis: "2024002",
		nama: "Siti Aisyah",
		kelas: "12 IPA",
		bulan: "Januari 2025",
		jatuhTempo: "10 Jan 2025",
		nominal: 450000,
		terbayar: 300000,
		status: "Cicilan",
	},
	{
		id: "SPP003",
		noTagihan: "INV-SPP-2025-003",
		nis: "2024003",
		nama: "Muhammad Rizki",
		kelas: "11 IPS",
		bulan: "Januari 2025",
		jatuhTempo: "10 Jan 2025",
		nominal: 425000,
		terbayar: 0,
		status: "Belum Bayar",
	},
	{
		id: "SPP004",
		noTagihan: "INV-SPP-2025-004",
		nis: "2024004",
		nama: "Fatimah Zahra",
		kelas: "9A",
		bulan: "Januari 2025",
		jatuhTempo: "10 Jan 2025",
		nominal: 400000,
		terbayar: 0,
		status: "Terlambat",
	},
	{
		id: "SPP005",
		noTagihan: "INV-SPP-2025-005",
		nis: "2024005",
		nama: "Abdullah Ibrahim",
		kelas: "6A",
		bulan: "Januari 2025",
		jatuhTempo: "10 Jan 2025",
		nominal: 350000,
		terbayar: 350000,
		status: "Lunas",
	},
	{
		id: "SPP006",
		noTagihan: "INV-SPP-2025-006",
		nis: "2024006",
		nama: "Khadijah Amira",
		kelas: "TK-B",
		bulan: "Januari 2025",
		jatuhTempo: "10 Jan 2025",
		nominal: 300000,
		terbayar: 150000,
		status: "Cicilan",
	},
]

const formatCurrency = (value: number) => {
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		maximumFractionDigits: 0,
	}).format(value)
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

export default function SppPage() {
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedKelas, setSelectedKelas] = useState("all")
	const [selectedStatus, setSelectedStatus] = useState("all")
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

	const filteredData = sppData.filter((item) => {
		const matchesSearch =
			item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.nis.includes(searchQuery) ||
			item.noTagihan.toLowerCase().includes(searchQuery.toLowerCase())
		const matchesKelas = selectedKelas === "all" || item.kelas === selectedKelas
		const matchesStatus = selectedStatus === "all" || item.status === selectedStatus

		return matchesSearch && matchesKelas && matchesStatus
	})

	const totalTagihan = sppData.length
	const totalLunas = sppData.filter((item) => item.status === "Lunas").length
	const totalCicilan = sppData.filter((item) => item.status === "Cicilan").length
	const totalBelumBayar = sppData.filter((item) => item.status === "Belum Bayar").length
	const totalTerlambat = sppData.filter((item) => item.status === "Terlambat").length

	const totalNominal = sppData.reduce((sum, item) => sum + item.nominal, 0)
	const totalTerbayar = sppData.reduce((sum, item) => sum + item.terbayar, 0)
	const totalSisa = totalNominal - totalTerbayar

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-foreground">SPP - Pembayaran SPP</h1>
					<p className="text-muted-foreground">Kelola tagihan, cicilan, dan pelunasan pembayaran santri</p>
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
								Tambah Tagihan
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[560px]">
							<DialogHeader>
								<DialogTitle>Tambah Tagihan SPP</DialogTitle>
								<DialogDescription>
									Buat tagihan pembayaran SPP baru untuk santri
								</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="nis">NIS</Label>
										<Input id="nis" placeholder="Nomor induk santri" />
									</div>
									<div className="space-y-2">
										<Label htmlFor="nama">Nama Santri</Label>
										<Input id="nama" placeholder="Nama santri" />
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="kelas">Kelas</Label>
										<Input id="kelas" placeholder="Contoh: 10 IPA" />
									</div>
									<div className="space-y-2">
										<Label htmlFor="bulan">Bulan Tagihan</Label>
										<Input id="bulan" placeholder="Contoh: Februari 2025" />
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="nominal">Nominal</Label>
										<Input id="nominal" placeholder="Contoh: 450000" />
									</div>
									<div className="space-y-2">
										<Label htmlFor="jatuh-tempo">Jatuh Tempo</Label>
										<Input id="jatuh-tempo" placeholder="Contoh: 10 Feb 2025" />
									</div>
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
								Total tagihan {formatCurrency(totalNominal)} | Terbayar {formatCurrency(totalTerbayar)} | Sisa {formatCurrency(totalSisa)}
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
								<SelectTrigger className="w-full sm:w-[160px]">
									<Filter className="w-4 h-4 mr-2" />
									<SelectValue placeholder="Kelas" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Kelas</SelectItem>
									<SelectItem value="12 IPA">12 IPA</SelectItem>
									<SelectItem value="11 IPS">11 IPS</SelectItem>
									<SelectItem value="9A">9A</SelectItem>
									<SelectItem value="6A">6A</SelectItem>
									<SelectItem value="TK-B">TK-B</SelectItem>
								</SelectContent>
							</Select>
							<Select value={selectedStatus} onValueChange={setSelectedStatus}>
								<SelectTrigger className="w-full sm:w-[160px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Semua Status</SelectItem>
									<SelectItem value="Lunas">Lunas</SelectItem>
									<SelectItem value="Cicilan">Cicilan</SelectItem>
									<SelectItem value="Belum Bayar">Belum Bayar</SelectItem>
									<SelectItem value="Terlambat">Terlambat</SelectItem>
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
								{filteredData.map((item) => {
									const sisa = item.nominal - item.terbayar
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
														<p className="text-xs text-muted-foreground">NIS {item.nis}</p>
													</div>
												</div>
											</TableCell>
											<TableCell>{item.kelas}</TableCell>
											<TableCell>{item.bulan}</TableCell>
											<TableCell>{item.jatuhTempo}</TableCell>
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
														<DropdownMenuItem>
															<Eye className="w-4 h-4 mr-2" />
															Lihat Detail
														</DropdownMenuItem>
														<DropdownMenuItem>
															<Edit className="w-4 h-4 mr-2" />
															Catat Pembayaran
														</DropdownMenuItem>
														<DropdownMenuItem className="text-destructive focus:text-destructive">
															<Trash2 className="w-4 h-4 mr-2" />
															Hapus Tagihan
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									)
								})}

								{filteredData.length === 0 && (
									<TableRow>
										<TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
											Data pembayaran SPP tidak ditemukan.
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
