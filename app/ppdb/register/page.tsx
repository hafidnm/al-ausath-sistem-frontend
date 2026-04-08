"use client";

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, KeyRound, Loader2, Mail, Phone, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePpdbPortalRegister } from '@/hooks/use-ppdb-portal';

export default function PpdbRegisterPage() {
  const { toast } = useToast();
  const { register, loading } = usePpdbPortalRegister();

  const [form, setForm] = useState({
    email: '',
    phone: '',
    password: '',
    passwordConfirmation: '',
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.email.trim() || !form.phone.trim() || !form.password || !form.passwordConfirmation) {
      toast({
        title: 'Data belum lengkap',
        description: 'Email, nomor telepon, dan kata sandi wajib diisi.',
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
        const noPendaftaran = encodeURIComponent(result.noPendaftaran || '');
        const idPendaftar = encodeURIComponent(result.idPendaftar || '');
        const loginHint = encodeURIComponent(result.noPendaftaran || form.email.trim());

        window.location.href = `/ppdb/register/success?no=${noPendaftaran}&id=${idPendaftar}&login=${loginHint}`;
      }, 500);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registrasi akun PPDB gagal';
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
                    type="password"
                    placeholder="Minimal 8 karakter"
                    className="pl-9"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password-confirm">Konfirmasi Kata Sandi</Label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="password-confirm"
                    type="password"
                    placeholder="Ulangi kata sandi"
                    className="pl-9"
                    value={form.passwordConfirmation}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, passwordConfirmation: event.target.value }))
                    }
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
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
