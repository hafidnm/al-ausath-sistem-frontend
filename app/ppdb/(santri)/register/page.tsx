"use client";

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, KeyRound, Loader2, Mail, Phone, UserPlus, Eye, EyeOff, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalRegister, usePpdbPortalPeriodCheck } from '@/hooks/ppdb/santri';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export default function PpdbRegisterPage() {
  const { toast } = useToast();
  const { register, loading: registerLoading } = usePpdbPortalRegister();
  const { isOpen, loading: checkLoading, period } = usePpdbPortalPeriodCheck();

  const [form, setForm] = useState({
    email: '',
    phone: '',
    password: '',
    passwordConfirmation: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (checkLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground mt-4 text-sm font-medium">Memeriksa status pendaftaran...</p>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-xl space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>

          <Card className="border-border/60 shadow-lg text-center overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="pt-8 pb-4">
              <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-4 animate-pulse">
                <Calendar className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Pendaftaran Santri Baru Ditutup</CardTitle>
              <CardDescription className="text-base mt-2">
                Saat ini pendaftaran santri baru (PPDB) belum dibuka atau gelombang pendaftaran telah berakhir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 max-w-md mx-auto">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Pantau terus halaman ini atau media sosial kami untuk informasi pembukaan gelombang berikutnya.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="outline">
                  <Link href="/">Kembali ke Beranda</Link>
                </Button>
                <Button asChild>
                  <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                    <Phone className="w-4 h-4 mr-2" />
                    Hubungi Admin
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.email.trim() || !form.phone.trim() || !form.password || !form.passwordConfirmation) {
      toast({
        title: 'Data belum lengkap',
        description: 'Email, nomor telepon, and kata sandi wajib diisi.',
        variant: 'destructive',
      });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast({
        title: 'Email tidak valid',
        description: 'Masukkan email pendaftar dengan format yang benar.',
        variant: 'destructive',
      });
      return;
    }

    if (form.password.length < 8) {
      toast({
        title: 'Kata sandi terlalu pendek',
        description: 'Kata sandi minimal 8 karakter.',
        variant: 'destructive',
      });
      return;
    }

    if (form.password !== form.passwordConfirmation) {
      toast({
        title: 'Konfirmasi tidak sesuai',
        description: 'Pastikan konfirmasi kata sandi sama dengan kata sandi.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await register({
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        password_confirmation: form.passwordConfirmation,
      });

      toast({
        title: 'Akun pendaftar berhasil dibuat',
        description: result.message || 'Silakan lanjut ke halaman informasi akun.',
      });

      setTimeout(() => {
        window.location.href = '/ppdb/login';
      }, 500);
    } catch (error) {
      const message = toErrorMessage(error, 'Registrasi akun PPDB gagal');
      toast({
        title: 'Registrasi gagal',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
            <CardTitle className="text-2xl">Registrasi Santri Baru</CardTitle>
            <CardDescription>
              Buat akun pendaftar terlebih dahulu. Setelah login, Anda dapat mengisi form data lengkap PPDB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-border/70 p-4 bg-muted/40">
              <p className="text-sm text-muted-foreground">Nomor Pendaftaran</p>
              <p className="text-sm text-foreground mt-1">
                ID pendaftar dan nomor pendaftaran akan dibuat otomatis setelah akun berhasil didaftarkan.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="contoh@email.com"
                    className="pl-9"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="phone"
                    placeholder="08xxxxxxxxxx"
                    className="pl-9"
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Kata Sandi</Label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 8 karakter"
                    className="pl-9 pr-10"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-confirm">Konfirmasi Kata Sandi</Label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="password-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Ulangi kata sandi"
                    className="pl-9 pr-10"
                    value={form.passwordConfirmation}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, passwordConfirmation: event.target.value }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={registerLoading}>
                {registerLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Buat Akun Pendaftar
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center">
              Sudah punya akun?{' '}
              <Link href="/ppdb/login" className="text-primary hover:underline font-medium">
                Login Pendaftar
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
