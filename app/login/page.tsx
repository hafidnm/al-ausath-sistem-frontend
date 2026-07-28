"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Users, GraduationCap, Shield, Star, Moon, ArrowLeft, HeartHandshake, Award, Sparkles, Quote, MapPin } from "lucide-react"
import { authService } from "@/lib/services/auth.service"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [userType, setUserType] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    document.title = "Login | Pesantren Al-Ausath"
    const checkExistingSession = async () => {
      try {
        const userData = await authService.me()
        if (userData) {
          const role = localStorage.getItem('role')
          const userStr = localStorage.getItem('user')
          let userObj = null
          if (userStr) {
            try { userObj = JSON.parse(userStr) } catch (e) {}
          }
          
          if (role === 'petugas' || userData?.peran_akun) {
             const peran = userObj?.peran_akun || userData?.peran_akun
             if (peran === 'admin') {
               window.location.href = '/dashboard/admin-panel'
             } else {
               window.location.href = '/dashboard/guru-panel'
             }
          } else {
            window.location.href = '/dashboard/santri-panel'
          }
        } else {
          setIsCheckingAuth(false)
        }
      } catch (e) {
        setIsCheckingAuth(false)
      }
    }
    
    checkExistingSession()
  }, [])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!userType) {
      toast({
        title: "Error",
        description: "Pilih jenis pengguna terlebih dahulu",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const username = formData.get('username') as string
      const password = formData.get('password') as string

      let role: 'petugas' | 'santri'
      if (userType === 'admin' || userType === 'guru') {
        role = 'petugas'
      } else {
        role = 'santri'
      }

      const response = await authService.login({
        role,
        username,
        password,
      })

      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('role', response.role)

      toast({
        title: "Login Berhasil!",
        description: `Selamat datang, ${response.user.nama_lengkap}`,
      })

      setTimeout(() => {
        if (role === 'petugas') {
          if (userType === 'admin') {
            window.location.href = '/dashboard/admin-panel'
          } else {
            window.location.href = '/dashboard/guru-panel'
          }
        } else {
          window.location.href = '/dashboard/santri-panel'
        }
      }, 500)

    } catch (error: any) {
      console.error('Login error:', error)

      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.username?.[0] ||
                          'Login gagal. Periksa kredensial Anda.'
      
      toast({
        title: "Login Gagal",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-sidebar-foreground flex-col justify-between p-10 relative overflow-hidden bg-gradient-to-br from-sidebar via-sidebar to-sidebar-accent/30">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-sidebar-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Kembali ke Beranda</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg border border-sidebar-border/50 shrink-0">
              <img src="/logo.png" alt="Logo Al Ausath" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">PONDOK PESANTREN AL-AUSATH</h1>
              <p className="text-xs text-sidebar-foreground/70 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-sidebar-primary" />
                Karanganyar, Jawa Tengah
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 relative z-10 my-auto py-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sidebar-primary/15 text-sidebar-primary text-xs font-semibold border border-sidebar-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              Pendidikan Islam & Akademik Terpadu
            </div>
            <h2 className="text-3xl font-bold leading-snug text-balance">
              Mendidik Generasi Rabbani Berakhlaq Mulia & Berwawasan Global
            </h2>
            <p className="text-sm text-sidebar-foreground/80 leading-relaxed max-w-xl">
              Pondok Pesantren Al-Ausath memadukan nilai-nilai keislaman, tahfidzul Qur'an, dan kurikulum akademik modern secara seimbang demi mencetak santri berprestasi dan beradab.
            </p>
          </div>

          {/* 4 Pilar Pesantren */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <FeatureCard
              icon={<BookOpen className="w-4 h-4 text-sidebar-primary" />}
              title="Tahfidz & Dirasah"
              description="Pembinaan Al-Qur'an dan pemahaman ilmu syar'i."
            />
            <FeatureCard
              icon={<GraduationCap className="w-4 h-4 text-sidebar-primary" />}
              title="Pendidikan Formal"
              description="Kurikulum terpadu jenjang PAUD hingga SMA."
            />
            <FeatureCard
              icon={<HeartHandshake className="w-4 h-4 text-sidebar-primary" />}
              title="Kemitraan Orang Tua"
              description="Transparansi presensi, nilai & SPP realtime."
            />
            <FeatureCard
              icon={<Award className="w-4 h-4 text-sidebar-primary" />}
              title="Karakter & Adab"
              description="Pembentukan akhlaqul karimah & kemandirian."
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Kembali ke Beranda</span>
            </Link>
            
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-border/50 shadow-sm shrink-0">
                <img src="/logo.png" alt="Logo Al Ausath" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">e-Rapor Pesantren</h1>
                <p className="text-xs text-muted-foreground">Sistem Penilaian Digital</p>
              </div>
            </div>
          </div>

          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-foreground">Selamat Datang</CardTitle>
              <CardDescription className="text-muted-foreground">
                Masuk ke akun Anda untuk melanjutkan
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {isCheckingAuth ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-muted-foreground">Memeriksa sesi Anda...</p>
                </div>
              ) : (
                <>
                  <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="userType" className="text-foreground">Masuk Sebagai</Label>
                  <Select value={userType} onValueChange={setUserType} required>
                    <SelectTrigger id="userType" className="bg-background">
                      <SelectValue placeholder="Pilih jenis pengguna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          <span>Admin</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="guru">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-primary" />
                          <span>Guru / Wali Kelas / Ustadz</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="santri">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          <span>Santri / Wali Santri</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground">
                    {userType === 'santri' ? 'Username / Nama Akun' : 'Email / Username'}
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder={userType === 'santri' ? 'Masukkan username' : 'Masukkan email'}
                    className="bg-background"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">Kata Sandi</Label>
                    <Link
                      href="#"
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      Lupa kata sandi?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Masukkan kata sandi"
                    className="bg-background"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Memproses..." : "Masuk"}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-center text-sm text-muted-foreground">
                  Belum punya akun?{" "}
                  <Link href="/ppdb/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Daftar PPDB
                  </Link>
                  {" "}atau{" "}
                  <Link href="/#location" className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Hubungi Admin
                  </Link>
                </p>
              </div>
                </>
              )}
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Dengan masuk, Anda menyetujui{" "}
            <Link href="#" className="text-primary hover:underline">Syarat & Ketentuan</Link>
            {" "}dan{" "}
            <Link href="#" className="text-primary hover:underline">Kebijakan Privasi</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-4 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
      <div className="w-9 h-9 rounded-lg bg-sidebar-primary/20 flex items-center justify-center text-sidebar-primary mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-sidebar-foreground">{title}</h3>
      <p className="text-sm text-sidebar-foreground/70">{description}</p>
    </div>
  )
}
