"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { ArrowLeft, ClipboardCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalDashboard } from '@/hooks/use-ppdb-portal';

export default function PpdbTesPage() {
  const { toast } = useToast();
  const { data, loading, fetchDashboard } = usePpdbPortalDashboard();

  useEffect(() => {
    void fetchDashboard().catch((error) => {
      const message = error instanceof Error ? error.message : 'Gagal memuat data tes';
      toast({
        title: 'Akses tes gagal',
        description: message,
        variant: 'destructive',
      });
      setTimeout(() => {
        window.location.href = '/ppdb/login';
      }, 800);
    });
  }, [fetchDashboard, toast]);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link href="/ppdb/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard PPDB
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              Halaman Tes Soal PPDB
            </CardTitle>
            <CardDescription>
              Halaman ini muncul ketika admin PPDB mengaktifkan tahapan tes untuk pendaftar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat status tes...
              </span>
            ) : null}

            {!loading && data && !data.tesRequired ? (
              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <p className="font-medium text-foreground">Tes belum diaktifkan oleh admin.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Silakan kembali ke dashboard pendaftar untuk melihat tahapan berikutnya.
                </p>
              </div>
            ) : null}

            {!loading && data?.tesRequired ? (
              <div className="rounded-lg border border-border p-4 bg-muted/30 space-y-2">
                <p className="font-medium text-foreground">Tes aktif untuk akun Anda.</p>
                <p className="text-sm text-muted-foreground">
                  {data.tesTitle || 'Tes Seleksi PPDB'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.tesDescription || 'Admin telah menjadwalkan tes. Soal akan ditampilkan sesuai konfigurasi backend.'}
                </p>
              </div>
            ) : null}

            <div className="flex gap-2">
              <Link href="/ppdb/dashboard">
                <Button variant="outline">Kembali</Button>
              </Link>
              <Button onClick={() => void fetchDashboard()}>Refresh Status Tes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
