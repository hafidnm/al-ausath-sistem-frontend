"use client";

import { useEffect, useState } from "react";
import { 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  DollarSign, 
  FileText, 
  Info, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ppdbAdminApi } from "@/lib/ppdb/admin-api";

interface PpdbPeriod {
  id: number;
  nama_gelombang: string;
  tahun_ajaran: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  kuota: number | null;
  biaya_pendaftaran: number;
  status: 'draft' | 'aktif' | 'ditutup' | 'selesai';
  deskripsi: string | null;
  jumlah_pendaftar: number;
  is_buka: boolean;
  is_kuota_penuh: boolean;
}

const initialForm = {
  nama_gelombang: "",
  tahun_ajaran: "",
  tanggal_mulai: "",
  tanggal_selesai: "",
  kuota: "" as string | number,
  biaya_pendaftaran: 100000,
  status: "draft" as PpdbPeriod["status"],
  deskripsi: "",
};

export function PpdbPeriodsTab() {
  const { toast } = useToast();
  const [periods, setPeriods] = useState<PpdbPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [isOpen, setIsOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PpdbPeriod | null>(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const data = await ppdbAdminApi.getPeriods();
      setPeriods(data);
    } catch (err) {
      toast({
        title: "Gagal memuat data",
        description: err instanceof Error ? err.message : "Terjadi kesalahan saat memuat gelombang PPDB",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPeriods();
  }, []);

  const handleOpenAdd = () => {
    setEditingPeriod(null);
    setForm({
      ...initialForm,
      tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    });
    setIsOpen(true);
  };

  const handleOpenEdit = (period: PpdbPeriod) => {
    setEditingPeriod(period);
    setForm({
      nama_gelombang: period.nama_gelombang,
      tahun_ajaran: period.tahun_ajaran,
      tanggal_mulai: period.tanggal_mulai,
      tanggal_selesai: period.tanggal_selesai,
      kuota: period.kuota ?? "",
      biaya_pendaftaran: Number(period.biaya_pendaftaran),
      status: period.status,
      deskripsi: period.deskripsi ?? "",
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_gelombang || !form.tahun_ajaran || !form.tanggal_mulai || !form.tanggal_selesai) {
      toast({
        title: "Form belum lengkap",
        description: "Mohon isi semua field wajib (*)",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        kuota: form.kuota === "" ? null : Number(form.kuota),
        biaya_pendaftaran: Number(form.biaya_pendaftaran),
      };

      if (editingPeriod) {
        await ppdbAdminApi.updatePeriod(editingPeriod.id, payload);
        toast({
          title: "Berhasil diperbarui",
          description: `Gelombang "${form.nama_gelombang}" berhasil disimpan`,
        });
      } else {
        await ppdbAdminApi.createPeriod(payload);
        toast({
          title: "Berhasil dibuat",
          description: `Gelombang "${form.nama_gelombang}" berhasil ditambahkan`,
        });
      }
      setIsOpen(false);
      void fetchPeriods();
    } catch (err) {
      toast({
        title: "Gagal menyimpan",
        description: err instanceof Error ? err.message : "Terjadi kesalahan pada server",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (period: PpdbPeriod) => {
    if (period.jumlah_pendaftar > 0) {
      toast({
        title: "Tidak dapat menghapus",
        description: `Gelombang ini sudah memiliki ${period.jumlah_pendaftar} pendaftar.`,
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus gelombang "${period.nama_gelombang}"?`)) {
      return;
    }

    try {
      await ppdbAdminApi.deletePeriod(period.id);
      toast({
        title: "Berhasil dihapus",
        description: "Gelombang PPDB berhasil dihapus",
      });
      void fetchPeriods();
    } catch (err) {
      toast({
        title: "Gagal menghapus",
        description: err instanceof Error ? err.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: PpdbPeriod["status"]) => {
    switch (status) {
      case "aktif":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">Aktif</Badge>;
      case "draft":
        return <Badge variant="secondary" className="font-medium">Draft</Badge>;
      case "ditutup":
        return <Badge variant="outline" className="text-amber-500 border-amber-500/30 font-medium">Ditutup</Badge>;
      case "selesai":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium">Selesai</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 shadow-sm relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/80 to-primary/40" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-bold">Pengaturan Gelombang PPDB</CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Buat dan kelola periode penerimaan santri baru berdasarkan tahun ajaran
            </CardDescription>
          </div>
          <Button onClick={handleOpenAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Gelombang
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-sm">Memuat daftar gelombang...</p>
            </div>
          ) : periods.length === 0 ? (
            <div className="text-center py-12 border rounded-lg border-dashed border-muted bg-muted/10">
              <Calendar className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
              <h3 className="font-semibold text-base text-foreground mb-1">Belum Ada Gelombang</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                Mulai dengan menambahkan gelombang pendaftaran baru untuk membuka registrasi online.
              </p>
              <Button onClick={handleOpenAdd} variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Buat Pertama
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-border/60 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Nama Gelombang</TableHead>
                    <TableHead className="font-semibold">Tahun Ajaran</TableHead>
                    <TableHead className="font-semibold">Masa Pendaftaran</TableHead>
                    <TableHead className="font-semibold text-center">Pendaftar</TableHead>
                    <TableHead className="font-semibold">Biaya</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => (
                    <TableRow key={period.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium text-foreground">
                        <div>
                          {period.nama_gelombang}
                          {period.kuota && (
                            <span className="text-xs text-muted-foreground block font-normal">
                              Kuota: {period.kuota} santri
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{period.tahun_ajaran}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col text-xs text-muted-foreground">
                          <span>Mulai: {new Date(period.tanggal_mulai).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                          <span>Selesai: {new Date(period.tanggal_selesai).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1 bg-primary/5 text-primary border border-primary/10 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                          <Users className="w-3 h-3" />
                          {period.jumlah_pendaftar}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(period.biaya_pendaftaran)}
                      </TableCell>
                      <TableCell>{getStatusBadge(period.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenEdit(period)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            disabled={period.jumlah_pendaftar > 0}
                            onClick={() => handleDelete(period)}
                            title={period.jumlah_pendaftar > 0 ? "Tidak bisa dihapus karena memiliki pendaftar" : "Hapus gelombang"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Add / Edit */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {editingPeriod ? "Edit Gelombang PPDB" : "Tambah Gelombang PPDB Baru"}
              </DialogTitle>
              <DialogDescription>
                Lengkapi data di bawah ini. Pastikan hanya ada satu gelombang yang berstatus aktif.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nama_gelombang">Nama Gelombang <span className="text-destructive">*</span></Label>
                  <Input
                    id="nama_gelombang"
                    placeholder="Contoh: Gelombang 1"
                    value={form.nama_gelombang}
                    onChange={(e) => setForm({ ...form, nama_gelombang: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tahun_ajaran">Tahun Ajaran <span className="text-destructive">*</span></Label>
                  <Input
                    id="tahun_ajaran"
                    placeholder="Contoh: 2026/2027"
                    value={form.tahun_ajaran}
                    onChange={(e) => setForm({ ...form, tahun_ajaran: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tanggal_mulai">Tanggal Mulai <span className="text-destructive">*</span></Label>
                  <Input
                    id="tanggal_mulai"
                    type="date"
                    value={form.tanggal_mulai}
                    onChange={(e) => setForm({ ...form, tanggal_mulai: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tanggal_selesai">Tanggal Selesai <span className="text-destructive">*</span></Label>
                  <Input
                    id="tanggal_selesai"
                    type="date"
                    value={form.tanggal_selesai}
                    onChange={(e) => setForm({ ...form, tanggal_selesai: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kuota">Kuota Pendaftar (opsional)</Label>
                  <Input
                    id="kuota"
                    type="number"
                    min="1"
                    placeholder="Tanpa batas"
                    value={form.kuota}
                    onChange={(e) => setForm({ ...form, kuota: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="biaya_pendaftaran">Biaya Pendaftaran (Rp)</Label>
                  <Input
                    id="biaya_pendaftaran"
                    type="number"
                    min="0"
                    placeholder="Default: 100.000"
                    value={form.biaya_pendaftaran}
                    onChange={(e) => setForm({ ...form, biaya_pendaftaran: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status Gelombang</Label>
                <Select
                  value={form.status}
                  onValueChange={(val: PpdbPeriod["status"]) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger id="status-select">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (Belum dibuka)</SelectItem>
                    <SelectItem value="aktif">Aktif (Pendaftaran Buka)</SelectItem>
                    <SelectItem value="ditutup">Ditutup Sementara</SelectItem>
                    <SelectItem value="selesai">Selesai (Periode berakhir)</SelectItem>
                  </SelectContent>
                </Select>
                {form.status === "aktif" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1 mt-1">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>Mengaktifkan gelombang ini akan otomatis menonaktifkan gelombang aktif lainnya.</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deskripsi">Keterangan / Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  placeholder="Informasi detail mengenai syarat pendaftaran gelombang ini..."
                  value={form.deskripsi}
                  onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
