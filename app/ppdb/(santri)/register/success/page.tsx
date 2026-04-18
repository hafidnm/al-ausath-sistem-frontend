"use client";

import Link from 'next/link';
import { useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, LogIn, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function RegisterSuccessContent() {
  const searchParams = useSearchParams();

  const idPendaftar = useMemo(() => searchParams.get('id') || '', [searchParams]);
  const noPendaftaran = useMemo(() => searchParams.get('no') || '', [searchParams]);

  return (
    <div className="w-full max-w-xl space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Beranda
      </Link>

      <Card className="border-border/60 shadow-lg">
        <CardHeader>
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl">Akun Berhasil Dibuat</CardTitle>
          <CardDescription>
            Simpan informasi pendaftaran ini untuk login dan proses lanjutan PPDB.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="rounded-lg border border-border/70 p-4 bg-muted/40 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Nomor Pendaftaran</p>
              <p className="text-lg font-semibold text-foreground mt-1">{noPendaftaran || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ID Pendaftar</p>
              <p className="text-base font-medium text-foreground mt-1">{idPendaftar || '-'}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/ppdb/login" className="w-full">
              <Button className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                Login Akun PPDB
              </Button>
            </Link>
            <Link href="/ppdb/register" className="w-full">
              <Button variant="outline" className="w-full">
                Daftar Akun Lain
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Nomor pendaftaran dan ID pendaftar terikat ke akun yang baru dibuat. Gunakan nomor pendaftaran atau email untuk login.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PpdbRegisterSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Memuat...
        </div>
      }>
        <RegisterSuccessContent />
      </Suspense>
    </div>
  );
}
