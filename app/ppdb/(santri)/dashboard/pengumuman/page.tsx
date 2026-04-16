"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Info, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalDashboard } from '@/hooks/ppdb/santri/use-ppdb-portal';
import { formatAnnouncementDate } from '@/lib/ppdb/santri/dashboard';

export default function PpdbPengumumanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data, loading, fetchDashboard } = usePpdbPortalDashboard();

  useEffect(() => {
    void fetchDashboard().catch((error) => {
      const message = error instanceof Error ? error.message : 'Gagal memuat status pendaftaran';
      toast({
        title: 'Gagal memuat status',
        description: message,
        variant: 'destructive',
      });
    });
  }, [fetchDashboard, toast]);

  useEffect(() => {
    if (!data) return;

    const hasSubmittedTesAnswer = Boolean((data.soalJawab || '').trim());

    if (data.step === 'tes' && !hasSubmittedTesAnswer) {
      router.replace('/ppdb/tes');
      return;
    }

    if (!data.formCompleted && data.step === 'lengkapi-form') {
      router.replace('/ppdb/dashboard');
    }
  }, [data, router]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat status pengumuman...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href="/ppdb/dashboard?manual=1"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard PPDB
        </Link>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              Status Pendaftaran PPDB
            </CardTitle>
            <CardDescription>
              Pendaftaran Anda sudah berhasil dikirim dan sedang diproses oleh admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-background p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">
                Silahkan tunggu pengumuman selanjutnya, silahkan check website secara berkala.
              </p>
              {data?.pengumumanDate ? (
                <p className="text-sm text-muted-foreground">
                  Estimasi tanggal pengumuman: {formatAnnouncementDate(data.pengumumanDate)}
                </p>
              ) : null}
            </div>

            <Button variant="outline" onClick={() => void fetchDashboard()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
