"use client";

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, KeyRound, Loader2, Mail, Phone, ShieldCheck, Key, Lock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ppdbPortalApi } from '@/lib/ppdb/portal-api';
import { toErrorMessage } from '@/hooks/shared/react-query-helpers';

export default function PpdbForgotPasswordPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({
    otp: '',
    password: '',
    passwordConfirmation: '',
  });

  const [otpCodeTip, setOtpCodeTip] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRequestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      toast({
        title: 'Data belum lengkap',
        description: 'Email pendaftar wajib diisi.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await ppdbPortalApi.forgotPassword(email.trim());
      toast({
        title: 'Kode OTP Terkirim',
        description: response.message || 'Silakan cek email atau gunakan kode pengujian.',
      });
      if (response.otp_code) {
        setOtpCodeTip(response.otp_code);
      }
      setStep(2);
    } catch (error) {
      const message = toErrorMessage(error, 'Gagal mengirim kode reset kata sandi');
      toast({
        title: 'Gagal mengirim kode',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.otp.trim() || !form.password || !form.passwordConfirmation) {
      toast({
        title: 'Data belum lengkap',
        description: 'Kode OTP, kata sandi, dan konfirmasi wajib diisi.',
        variant: 'destructive',
      });
      return;
    }

    if (form.password.length < 6) {
      toast({
        title: 'Kata sandi terlalu pendek',
        description: 'Kata sandi minimal 6 karakter.',
        variant: 'destructive',
      });
      return;
    }

    if (form.password !== form.passwordConfirmation) {
      toast({
        title: 'Konfirmasi tidak sesuai',
        description: 'Pastikan konfirmasi kata sandi sama dengan kata sandi baru.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await ppdbPortalApi.resetPassword({
        email: email.trim(),
        otp: form.otp.trim(),
        password: form.password,
        password_confirmation: form.passwordConfirmation,
      });

      toast({
        title: 'Kata sandi diperbarui',
        description: response.message || 'Kata sandi Anda berhasil diperbarui. Silakan login kembali.',
      });

      setTimeout(() => {
        window.location.href = '/ppdb/login';
      }, 1000);
    } catch (error) {
      const message = toErrorMessage(error, 'Gagal memperbarui kata sandi');
      toast({
        title: 'Gagal reset kata sandi',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link
          href="/ppdb/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Login
        </Link>

        <Card className="border-border/60 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary via-chart-1 to-chart-3" />
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Lupa Kata Sandi</CardTitle>
            <CardDescription>
              {step === 1 
                ? 'Masukkan email yang terdaftar pada akun PPDB Anda untuk mendapatkan kode OTP reset kata sandi.'
                : 'Masukkan kode OTP yang dikirimkan beserta kata sandi baru Anda.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 ? (
              <form className="space-y-4" onSubmit={handleRequestOtp}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Terdaftar</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="contoh@email.com"
                      className="pl-9"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 mr-2" />
                  )}
                  Kirim Kode Reset OTP
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleResetPassword}>
                {otpCodeTip && (
                  <div className="rounded-lg border border-chart-1/30 p-3 bg-chart-1/10 text-xs space-y-1 text-foreground">
                    <p className="font-semibold text-chart-1 flex items-center gap-1">
                      <span>💡 Tips Pengujian:</span>
                    </p>
                    <p>Gunakan kode OTP berikut untuk reset kata sandi Anda:</p>
                    <p className="text-sm font-mono font-bold mt-1 text-primary">{otpCodeTip}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="otp">Kode OTP</Label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="otp"
                      placeholder="Masukkan 6 digit OTP"
                      className="pl-9 font-mono tracking-widest text-center text-lg"
                      maxLength={6}
                      value={form.otp}
                      onChange={(event) => setForm((prev) => ({ ...prev, otp: event.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Kata Sandi Baru</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 6 karakter"
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
                  <Label htmlFor="password-confirm">Konfirmasi Kata Sandi Baru</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      id="password-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Ulangi kata sandi baru"
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

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4 mr-2" />
                  )}
                  Perbarui Kata Sandi
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
