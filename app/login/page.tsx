"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Users, GraduationCap, Shield, Star, Moon, ArrowLeft } from "lucide-react"
import { authService } from "@/lib/services/auth.service"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [userType, setUserType] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

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
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-sidebar-foreground flex-col justify-between p-12">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Kembali ke Beranda</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <Moon className="w-7 h-7 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">e-Rapor Pesantren</h1>
              <p className="text-sidebar-foreground/70 text-sm">Sistem Penilaian Digital</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight text-balance">
              Kelola Nilai Santri dengan Mudah dan Efisien
            </h2>
            <p className="mt-4 text-sidebar-foreground/80 leading-relaxed">
              Sistem e-Rapor digital untuk pesantren modern. Mendukung jenjang PAUD hingga SMA dengan fitur lengkap untuk admin, guru, dan wali santri.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FeatureCard
              icon={<BookOpen className="w-5 h-5" />}
              title="Multi Jenjang"
              description="PAUD, TK, SD, SMP, SMA"
            />
            <FeatureCard
              icon={<Users className="w-5 h-5" />}
              title="Multi Pengguna"
              description="Admin, Guru, Wali Santri"
            />
            <FeatureCard
              icon={<GraduationCap className="w-5 h-5" />}
              title="Rapor Digital"
              description="Cetak & unduh rapor"
            />
            <FeatureCard
              icon={<Shield className="w-5 h-5" />}
              title="Aman & Terpercaya"
              description="Data terenkripsi"
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
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Moon className="w-6 h-6 text-primary-foreground" />
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
