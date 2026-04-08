"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, FileCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  usePpdbPortalAnnouncement,
  usePpdbPortalDashboard,
} from '@/hooks/use-ppdb-portal';

const statusBadgeClass: Record<string, string> = {
  Menunggu: 'bg-chart-3/20 text-chart-4 border-0',
  Terverifikasi: 'bg-accent/20 text-accent border-0',
  Diterima: 'bg-primary/10 text-primary border-0',
  Ditolak: 'bg-destructive/10 text-destructive border-0',
};

export default function PpdbPengumumanPage() {
  const { toast } = useToast();
  const { data: dashboard, fetchDashboard } = usePpdbPortalDashboard();
  const {
    data,
    checkAnnouncement,
    loading,
  } = usePpdbPortalAnnouncement();

  const [announcementId, setAnnouncementId] = useState('');

  useEffect(() => {
    void fetchDashboard().then((response) => {
      setAnnouncementId(response.noPendaftaran || response.idPendaftar || '');
    }).catch(() => {
      // Halaman pengumuman tetap bisa diakses walau dashboard gagal.
    });
  }, [fetchDashboard]);

  const handleCheck = async () => {
    if (!announcementId.trim()) {
      toast({
        title: 'ID pendaftaran belum diisi',
        description: 'Masukkan ID atau nomor pendaftaran.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await checkAnnouncement(announcementId.trim());
      toast({
        title: 'Pengumuman ditemukan',
        description: result.message || `Status Anda: ${result.status}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Cek pengumuman gagal';
      toast({
        title: 'Pengumuman tidak ditemukan',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href="/ppdb/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard PPDB
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              Form Pengumuman PPDB
            </CardTitle>
            <CardDescription>
              Masukkan ID pendaftaran untuk cek status: diterima, ditolak, atau masih diverifikasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>ID / Nomor Pendaftaran</Label>
              <Input
                placeholder="Masukkan ID atau nomor pendaftaran"
                value={announcementId}
                onChange={(event) => setAnnouncementId(event.target.value)}
              />
            </div>

            <Button onClick={() => void handleCheck()} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
              Cek Pengumuman
            </Button>

            {dashboard?.pengumumanDate ? (
              <p className="text-sm text-muted-foreground">
                Tanggal pengumuman dari sistem: {dashboard.pengumumanDate}
              </p>
            ) : null}

            {data ? (
              <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nama Calon</p>
                  <p className="font-semibold text-foreground">{data.namaCalon || '-'}</p>
                </div>
                <Badge className={statusBadgeClass[data.status] || ''}>{data.status}</Badge>
                {data.message ? (
                  <p className="text-sm text-muted-foreground">{data.message}</p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
