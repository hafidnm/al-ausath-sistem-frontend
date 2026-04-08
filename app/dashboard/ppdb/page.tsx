"use client"

import { useState, useEffect } from "react"
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
	Loader2,
} from "lucide-react"
import {
	usePpdbList,
	useCreatePpdb,
	useUpdatePpdb,
	useDeletePpdb,
	useUpdatePpdbVerification,
} from "@/hooks/use-ppdb"
import { PpdbDetail } from "@/lib/services/ppdb.service"

type PpdbStatus = "Menunggu" | "Terverifikasi" | "Diterima" | "Ditolak"

type PpdbFormState = {
	name: string
	jenjang: string
	asalSekolah: string
	tanggalDaftar: string
	wali: string
	phone: string
	status: PpdbStatus
}

const statusOptions: PpdbStatus[] = ["Menunggu", "Terverifikasi", "Diterima", "Ditolak"]
const fallbackJenjangOptions = ["PAUD", "TK", "SD", "MA", "SMA", "MTQU", "MUTAWASITHAH", "ALIYAH"]

const emptyPendaftarForm: PpdbFormState = {
	name: "",
	jenjang: "",
	asalSekolah: "",
	tanggalDaftar: "",
	wali: "",
	phone: "",
	status: "Menunggu",
}

const getErrorMessage = (error: unknown, fallback: string) => {
	return error instanceof Error ? error.message : fallback
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
			return <Badge variant="outline">-</Badge>
	}
}

export default function PpdbPage() {
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedJenjang, setSelectedJenjang] = useState("all")
	const [selectedStatus, setSelectedStatus] = useState("all")
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
	const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
	const [selectedPendaftar, setSelectedPendaftar] = useState<PpdbDetail | null>(null)
	const [newPendaftar, setNewPendaftar] = useState<PpdbFormState>(emptyPendaftarForm)
	const [editPendaftar, setEditPendaftar] = useState<PpdbFormState>(emptyPendaftarForm)

	// Use hooks
	const { data: ppdbData, loading, error, fetchList, updateStatusByIds } = usePpdbList()
	const { create: createPendaftar, loading: createLoading } = useCreatePpdb()
	const { update: updatePendaftar, loading: updateLoading } = useUpdatePpdb()
	const { deleteItem: deletePendaftar, loading: deleteLoading } = useDeletePpdb()
	const { updateVerification, loading: verificationLoading } = useUpdatePpdbVerification()

	// Fetch data on component mount
	useEffect(() => {
		fetchList()
	}, [fetchList])

	// Filter data
	const filteredData = ppdbData.filter((pendaftar) => {
		const matchesSearch =
			pendaftar.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			pendaftar.noPendaftaran.toLowerCase().includes(searchQuery.toLowerCase())
		const matchesJenjang = selectedJenjang === "all" || pendaftar.jenjang === selectedJenjang
		const matchesStatus = selectedStatus === "all" || pendaftar.status === selectedStatus
		return matchesSearch && matchesJenjang && matchesStatus
	})

	const jenjangOptions = Array.from(
		new Set([
			...fallbackJenjangOptions,
			...ppdbData
				.map((item) => item.jenjang.trim())
				.filter((item): item is string => item.length > 0),
		]),
	)

	const getIdCandidates = (pendaftar: PpdbDetail) => {
		const ids = [
			pendaftar.pendaftaranId,
			pendaftar.id,
			pendaftar.userId,
			pendaftar.noPendaftaran,
		].filter(
			(item): item is string => Boolean(item && item.trim().length > 0),
		)

		return Array.from(new Set(ids))
	}

	const runActionWithIdFallback = async (
		pendaftar: PpdbDetail,
		action: (id: string) => Promise<unknown>,
	) => {
		const idCandidates = getIdCandidates(pendaftar)

		if (idCandidates.length === 0) {
			throw new Error("ID pendaftar tidak ditemukan")
		}

		let lastError: unknown

		for (const id of idCandidates) {
			try {
				return await action(id)
			} catch (error) {
				lastError = error
			}
		}

		throw lastError
	}

	// Calculate statistics
	const totalPendaftar = ppdbData.length
	const totalMenunggu = ppdbData.filter((item) => item.status === "Menunggu").length
	const totalTerverifikasi = ppdbData.filter((item) => item.status === "Terverifikasi").length
	const totalDiterima = ppdbData.filter((item) => item.status === "Diterima").length
	const totalDitolak = ppdbData.filter((item) => item.status === "Ditolak").length

	// Handle add pendaftar
	const handleAddPendaftar = async () => {
		if (!newPendaftar.name || !newPendaftar.jenjang) {
			alert("Harap lengkapi data sebelum menyimpan")
			return
		}

		try {
			await createPendaftar({
				name: newPendaftar.name,
				jenjang: newPendaftar.jenjang,
				asalSekolah: newPendaftar.asalSekolah,
				tanggalDaftar: newPendaftar.tanggalDaftar,
				wali: newPendaftar.wali,
				phone: newPendaftar.phone,
				status: newPendaftar.status as PpdbStatus,
			})
			// Reset form
			setNewPendaftar(emptyPendaftarForm)
			setIsAddDialogOpen(false)
			// Refresh list
			await fetchList()
		} catch (error) {
			console.error("Error adding pendaftar:", error)
			alert(getErrorMessage(error, "Gagal menambah pendaftar"))
		}
	}

	const handleOpenDetail = (pendaftar: PpdbDetail) => {
		setSelectedPendaftar(pendaftar)
		setIsDetailDialogOpen(true)
	}

	const handleOpenEdit = (pendaftar: PpdbDetail) => {
		setSelectedPendaftar(pendaftar)
		setEditPendaftar({
			name: pendaftar.name,
			jenjang: pendaftar.jenjang,
			asalSekolah: pendaftar.asalSekolah,
			tanggalDaftar: pendaftar.tanggalDaftar,
			wali: pendaftar.wali,
			phone: pendaftar.phone,
			status: (statusOptions.includes(pendaftar.status as PpdbStatus)
				? pendaftar.status
				: "Menunggu") as PpdbStatus,
		})
		setIsEditDialogOpen(true)
	}

	const handleUpdatePendaftar = async () => {
		if (!selectedPendaftar) {
			return
		}

		if (!editPendaftar.name || !editPendaftar.jenjang) {
			alert("Nama dan jenjang wajib diisi")
			return
		}

		try {
			await runActionWithIdFallback(selectedPendaftar, (id) =>
				updatePendaftar(id, {
					name: editPendaftar.name,
					jenjang: editPendaftar.jenjang,
					asalSekolah: editPendaftar.asalSekolah,
					tanggalDaftar: editPendaftar.tanggalDaftar,
					wali: editPendaftar.wali,
					phone: editPendaftar.phone,
					status: editPendaftar.status,
				}),
			)

			setIsEditDialogOpen(false)
			await fetchList()
		} catch (error) {
			console.error("Error updating pendaftar:", error)
			alert(getErrorMessage(error, "Gagal memperbarui data pendaftar"))
		}
	}

	// Handle delete pendaftar
	const handleDeletePendaftar = async (pendaftar: PpdbDetail) => {
		if (!confirm("Apakah Anda yakin ingin menghapus pendaftar ini?")) {
			return
		}

		try {
			await runActionWithIdFallback(pendaftar, (id) => deletePendaftar(id))
			await fetchList()
		} catch (error) {
			console.error("Error deleting pendaftar:", error)
			alert(getErrorMessage(error, "Gagal menghapus pendaftar"))
		}
	}

	// Handle verifikasi
	const handleVerifikasi = async (pendaftar: PpdbDetail, status: "Terverifikasi" | "Ditolak") => {
		const message =
			status === "Terverifikasi"
				? "Anda yakin ingin memverifikasi pendaftar ini?"
				: "Anda yakin ingin menolak pendaftar ini?"

		if (!confirm(message)) {
			return
		}

		try {
			const targetIds = getIdCandidates(pendaftar)

			await runActionWithIdFallback(pendaftar, (id) =>
				updateVerification(id, { status, keterangan: "" }),
			)

			updateStatusByIds(targetIds, status)
			setSelectedPendaftar((prev) => {
				if (!prev) return prev

				const selectedIds = getIdCandidates(prev)
				if (!selectedIds.some((id) => targetIds.includes(id))) {
					return prev
				}

				return {
					...prev,
					status,
				}
			})

			// Keep UI responsive with optimistic update, then sync with source of truth.
			void fetchList()
		} catch (error) {
			console.error("Error updating verification:", error)
			alert(getErrorMessage(error, "Gagal memperbarui verifikasi"))
		}
	}

	if (error) {
		return (
			<div className="space-y-6">
				<div>
					<h1 className="text-2xl font-bold text-foreground">PPDB - Penerimaan Murid Baru</h1>
					<p className="text-muted-foreground">Kelola pendaftaran dan proses seleksi murid baru</p>
				</div>
				<div className="text-destructive">Error: {error}</div>
			</div>
		)
	}

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
										<Input
											id="nama"
											placeholder="Nama calon murid"
											value={newPendaftar.name}
											onChange={(e) =>
												setNewPendaftar({ ...newPendaftar, name: e.target.value })
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="jenjang">Jenjang Tujuan</Label>
										<Select
											value={newPendaftar.jenjang}
											onValueChange={(val) =>
												setNewPendaftar({ ...newPendaftar, jenjang: val })
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Pilih jenjang" />
											</SelectTrigger>
											<SelectContent>
												{jenjangOptions.map((jenjang) => (
													<SelectItem key={jenjang} value={jenjang}>
														{jenjang}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="asal-sekolah">Asal Sekolah</Label>
										<Input
											id="asal-sekolah"
											placeholder="Nama sekolah asal"
											value={newPendaftar.asalSekolah}
											onChange={(e) =>
												setNewPendaftar({ ...newPendaftar, asalSekolah: e.target.value })
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="tanggal-daftar">Tanggal Daftar</Label>
										<Input
											id="tanggal-daftar"
											placeholder="Contoh: 15 Jan 2025"
											value={newPendaftar.tanggalDaftar}
											onChange={(e) =>
												setNewPendaftar({ ...newPendaftar, tanggalDaftar: e.target.value })
											}
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="wali">Nama Wali</Label>
										<Input
											id="wali"
											placeholder="Nama wali murid"
											value={newPendaftar.wali}
											onChange={(e) =>
												setNewPendaftar({ ...newPendaftar, wali: e.target.value })
											}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="telepon">No. Telepon Wali</Label>
										<Input
											id="telepon"
											placeholder="08xxxxxxxxxx"
											value={newPendaftar.phone}
											onChange={(e) =>
												setNewPendaftar({ ...newPendaftar, phone: e.target.value })
											}
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="status">Status Pendaftaran</Label>
									<Select
										value={newPendaftar.status}
										onValueChange={(val) =>
											setNewPendaftar({ ...newPendaftar, status: val as PpdbStatus })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pilih status" />
										</SelectTrigger>
										<SelectContent>
											{statusOptions.map((status) => (
												<SelectItem key={status} value={status}>
													{status}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
									Batal
								</Button>
								<Button
									className="bg-primary text-primary-foreground"
									onClick={handleAddPendaftar}
									disabled={createLoading}
								>
									{createLoading ? (
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
									{jenjangOptions.map((jenjang) => (
										<SelectItem key={jenjang} value={jenjang}>
											{jenjang}
										</SelectItem>
									))}
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
										<TableRow key={`${pendaftar.id}-${pendaftar.noPendaftaran}`}>
											<TableCell className="font-medium">{pendaftar.noPendaftaran}</TableCell>
											<TableCell>
												<div className="flex items-center gap-3">
													<Avatar className="w-8 h-8">
														<AvatarFallback className="bg-primary/10 text-primary text-xs">
															{pendaftar.name
																? pendaftar.name
																		.split(" ")
																		.filter((part) => part.length > 0)
																		.map((part) => part[0])
																		.join("")
																		.slice(0, 2)
																: "NA"}
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
														<DropdownMenuItem onClick={() => handleOpenDetail(pendaftar)}>
															<Eye className="w-4 h-4 mr-2" />
															Detail Pendaftar
														</DropdownMenuItem>
														<DropdownMenuItem onClick={() => handleOpenEdit(pendaftar)}>
															<Edit className="w-4 h-4 mr-2" />
															Ubah Data
														</DropdownMenuItem>
														{pendaftar.status === "Menunggu" && (
															<>
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	onClick={() => handleVerifikasi(pendaftar, "Terverifikasi")}
																	disabled={verificationLoading}
																>
																	<FileCheck className="w-4 h-4 mr-2" />
																	Verifikasi
																</DropdownMenuItem>
																<DropdownMenuItem
																	className="text-destructive focus:text-destructive"
																	onClick={() => handleVerifikasi(pendaftar, "Ditolak")}
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
															onClick={() => handleDeletePendaftar(pendaftar)}
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

									{filteredData.length === 0 && (
										<TableRow>
											<TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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

			<Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
				<DialogContent className="sm:max-w-[620px]">
					<DialogHeader>
						<DialogTitle>Detail Peserta PPDB</DialogTitle>
						<DialogDescription>Informasi lengkap data pendaftar</DialogDescription>
					</DialogHeader>
					{selectedPendaftar ? (
						<div className="grid gap-4 py-2">
							<div className="rounded-lg border border-border/70 p-4">
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-sm text-muted-foreground">No Pendaftaran</p>
										<p className="font-semibold text-foreground">
											{selectedPendaftar.noPendaftaran}
										</p>
									</div>
									{getStatusBadge(selectedPendaftar.status)}
								</div>
							</div>

							<div className="grid sm:grid-cols-2 gap-4 text-sm">
								<div className="space-y-1">
									<p className="text-muted-foreground">Nama Calon Murid</p>
									<p className="font-medium text-foreground">{selectedPendaftar.name || "-"}</p>
								</div>
								<div className="space-y-1">
									<p className="text-muted-foreground">Jenjang</p>
									<p className="font-medium text-foreground">{selectedPendaftar.jenjang || "-"}</p>
								</div>
								<div className="space-y-1">
									<p className="text-muted-foreground">Asal Sekolah/Kota</p>
									<p className="font-medium text-foreground">{selectedPendaftar.asalSekolah || "-"}</p>
								</div>
								<div className="space-y-1">
									<p className="text-muted-foreground">Nomor Umi/Wali</p>
									<p className="font-medium text-foreground">{selectedPendaftar.wali || "-"}</p>
								</div>
								<div className="space-y-1">
									<p className="text-muted-foreground">Nomor Telepon</p>
									<p className="font-medium text-foreground">{selectedPendaftar.phone || "-"}</p>
								</div>
								<div className="space-y-1">
									<p className="text-muted-foreground">Email</p>
									<p className="font-medium text-foreground">{selectedPendaftar.email || "-"}</p>
								</div>
								<div className="space-y-1 sm:col-span-2">
									<p className="text-muted-foreground">Tanggal Daftar</p>
									<p className="font-medium text-foreground">
										{selectedPendaftar.tanggalDaftar || "-"}
									</p>
								</div>
							</div>
						</div>
					) : (
						<p className="text-sm text-muted-foreground py-2">Data peserta tidak tersedia.</p>
					)}
				</DialogContent>
			</Dialog>

			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="sm:max-w-[620px]">
					<DialogHeader>
						<DialogTitle>Ubah Data Peserta</DialogTitle>
						<DialogDescription>
							Perbarui informasi peserta, lalu simpan perubahan.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-3">
						<div className="grid sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-nama">Nama Lengkap</Label>
								<Input
									id="edit-nama"
									value={editPendaftar.name}
									onChange={(e) =>
										setEditPendaftar({ ...editPendaftar, name: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-jenjang">Jenjang</Label>
								<Select
									value={editPendaftar.jenjang}
									onValueChange={(value) =>
										setEditPendaftar({ ...editPendaftar, jenjang: value })
									}
								>
									<SelectTrigger id="edit-jenjang">
										<SelectValue placeholder="Pilih jenjang" />
									</SelectTrigger>
									<SelectContent>
										{jenjangOptions.map((jenjang) => (
											<SelectItem key={jenjang} value={jenjang}>
												{jenjang}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-asal-sekolah">Asal Sekolah/Kota</Label>
								<Input
									id="edit-asal-sekolah"
									value={editPendaftar.asalSekolah}
									onChange={(e) =>
										setEditPendaftar({ ...editPendaftar, asalSekolah: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-tanggal-daftar">Tanggal Daftar</Label>
								<Input
									id="edit-tanggal-daftar"
									value={editPendaftar.tanggalDaftar}
									onChange={(e) =>
										setEditPendaftar({ ...editPendaftar, tanggalDaftar: e.target.value })
									}
								/>
							</div>
						</div>
						<div className="grid sm:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="edit-wali">Nomor Umi/Wali</Label>
								<Input
									id="edit-wali"
									value={editPendaftar.wali}
									onChange={(e) =>
										setEditPendaftar({ ...editPendaftar, wali: e.target.value })
									}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-phone">Nomor Telepon</Label>
								<Input
									id="edit-phone"
									value={editPendaftar.phone}
									onChange={(e) =>
										setEditPendaftar({ ...editPendaftar, phone: e.target.value })
									}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-status">Status</Label>
							<Select
								value={editPendaftar.status}
								onValueChange={(value) =>
									setEditPendaftar({ ...editPendaftar, status: value as PpdbStatus })
								}
							>
								<SelectTrigger id="edit-status">
									<SelectValue placeholder="Pilih status" />
								</SelectTrigger>
								<SelectContent>
									{statusOptions.map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
							Batal
						</Button>
						<Button
							className="bg-primary text-primary-foreground"
							onClick={handleUpdatePendaftar}
							disabled={updateLoading}
						>
							{updateLoading ? (
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
		</div>
	)
}
