"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, LogIn, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalLogin } from '@/hooks/use-ppdb-portal';

export default function PpdbLoginPage() {
  const { toast } = useToast();
  const { login, loading } = usePpdbPortalLogin();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    login: '',
    password: '',
  });

  useEffect(() => {
    const loginParam = searchParams.get('login');
    if (!loginParam) return;

    setForm((prev) => ({ ...prev, login: loginParam }));
  }, [searchParams]);

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

      toast({
        title: 'Login berhasil',
        description: 'Selamat datang di dashboard pendaftar PPDB.',
      });

      setTimeout(() => {
        window.location.href = '/ppdb/dashboard';
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
