"use client";

import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, LogIn, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalLogin } from '@/hooks/ppdb/santri/use-ppdb-portal';
import { ppdbPortalService } from '@/lib/services/ppdb-portal.service';
import { useRouter } from 'next/navigation';

const wait = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const ensureDashboardReady = async (): Promise<Awaited<ReturnType<typeof ppdbPortalService.getDashboard>> | null> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await ppdbPortalService.getDashboard();
    } catch {
      await wait(300 * (attempt + 1));
    }
  }

  return null;
};

// Komponen kecil yang hanya pakai useSearchParams — harus di-wrap Suspense
function LoginParamSync({ onLoginParam }: { onLoginParam: (v: string) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const loginParam = searchParams.get('login');
    if (!loginParam) return;
    onLoginParam(loginParam);
  }, [searchParams, onLoginParam]);

  return null;
}

export default function PpdbLoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login, loading } = usePpdbPortalLogin();
  const [form, setForm] = useState({
    login: '',
    password: '',
  });

  const handleLoginParam = (v: string) => setForm((prev) => ({ ...prev, login: v }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.login.trim() || !form.password) {
      toast({
        title: 'Data belum lengkap',
        description: 'Isi email atau nomor pendaftaran serta kata sandi.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await login({
        login: form.login.trim(),
        password: form.password,
      });

      const dashboard = await ensureDashboardReady();
      const hasSubmittedTesAnswer = Boolean((dashboard?.soalJawab || '').trim());
      const nextRoute =
        dashboard?.step === 'tes' && !hasSubmittedTesAnswer
          ? '/ppdb/tes'
          : dashboard?.step === 'menunggu-pengumuman' ||
            dashboard?.step === 'pengumuman' ||
            dashboard?.formCompleted
            ? '/ppdb/dashboard/pengumuman'
            : '/ppdb/dashboard';

      toast({
        title: 'Login berhasil',
        description: 'Selamat datang di dashboard pendaftar PPDB.',
      });

      setTimeout(() => {
        router.push(nextRoute);
      }, 400);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login PPDB gagal';
      toast({
        title: 'Login gagal',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Suspense wrapper wajib untuk useSearchParams di Next.js App Router */}
      <Suspense fallback={null}>
        <LoginParamSync onLoginParam={handleLoginParam} />
      </Suspense>
      <div className="w-full max-w-lg space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>

        <Card className="border-border/60 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Login Akun Santri / Pendaftar</CardTitle>
            <CardDescription>
              Masuk menggunakan email atau nomor pendaftaran dari akun PPDB yang sudah didaftarkan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="login">Email / Nomor Pendaftaran</Label>
                <div className="relative">
                  <UserRound className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="login"
                    placeholder="email atau nomor pendaftaran"
                    className="pl-9"
                    value={form.login}
                    onChange={(event) => setForm((prev) => ({ ...prev, login: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Masukkan kata sandi"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                Masuk ke Dashboard PPDB
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center">
              Belum punya akun?{' '}
              <Link href="/ppdb/register" className="text-primary hover:underline font-medium">
                Registrasi Santri Baru
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
