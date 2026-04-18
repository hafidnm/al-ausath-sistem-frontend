"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { usePpdbPortalRegister } from "@/hooks/ppdb/santri"
import { BookOpen, Users, GraduationCap, Star, Moon, Menu, Calendar, Bell, MapPin, Phone, Mail, Clock, CheckCircle2, Building2, ChevronDown, LogIn, UserPlus, Loader2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Moon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">e-Rapor Pesantren</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Sistem Penilaian Digital</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#ppdb" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                PPDB
              </Link>
              <Link href="#profile" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Profil
              </Link>
              <Link href="#announcement" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Pengumuman
              </Link>
              <Link href="#education" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Jenjang Pendidikan
              </Link>
              <Link href="#location" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Lokasi
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Masuk / Daftar
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/ppdb/register" className="w-full inline-flex items-center">
                      <UserPlus className="w-4 h-4 mr-2" />
                      PPDB
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="w-full inline-flex items-center">
                      <LogIn className="w-4 h-4 mr-2" />
                      Halaman Login
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-sidebar/10 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm">
              <Star className="w-3.5 h-3.5 mr-2" />
              Dipercaya oleh 500+ Pesantren di Indonesia
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Sistem e-Rapor Digital untuk{" "}
              <span className="text-primary">Pesantren Modern</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Kelola nilai santri dengan mudah dan efisien. Mendukung jenjang PAUD hingga SMA dengan fitur lengkap untuk admin, guru, dan wali santri.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="#ppdb">
                <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                  <Calendar className="w-4 h-4 mr-2" />
                  Daftar PPDB
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Users className="w-4 h-4 mr-2" />
                  Portal Login
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            <StatCard number="500+" label="Pesantren" />
            <StatCard number="50K+" label="Santri Aktif" />
            <StatCard number="5K+" label="Guru & Ustadz" />
            <StatCard number="99.9%" label="Uptime" />
          </div>
        </div>
      </section>

      {/* PPDB Section */}
      <section id="ppdb" className="scroll-mt-24 py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-border/70 shadow-lg">
              <CardHeader className="bg-sidebar/5 border-b border-border rounded-t-xl">
                <Badge variant="outline" className="w-fit mb-3">PPDB 1447/1448 H</Badge>
                <CardTitle className="text-2xl md:text-3xl tracking-tight text-foreground">
                  BUAT AKUN PENDAFTAR
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Tahap 1 PPDB: daftar akun, lalu lengkapi form data santri di dashboard pendaftar.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <PpdbRegistrationForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section id="profile" className="py-20 bg-sidebar/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Tentang Kami</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Profil Pesantren
            </h2>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <Building2 className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Visi Pesantren</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Menjadi lembaga pendidikan Islam terkemuka yang menghasilkan generasi Qur'ani, berakhlak mulia, berprestasi, dan berwawasan global yang mampu berkontribusi positif bagi masyarakat dan bangsa.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <GraduationCap className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Misi Pesantren</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Menyelenggarakan pendidikan berbasis Al-Qur'an dan As-Sunnah</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Membentuk santri berakhlakul karimah</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Mengembangkan potensi akademik dan non-akademik</span>
                  </li>
                  <li className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <span>Mempersiapkan generasi yang siap bersaing global</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="max-w-5xl mx-auto mt-8">
            <CardHeader>
              <CardTitle>Sejarah Singkat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Pesantren kami didirikan pada tahun 1995 dengan visi mencetak generasi Qur'ani yang berakhlak mulia. 
                Dimulai dari 25 santri, kini telah berkembang menjadi lembaga pendidikan terpercaya dengan lebih dari 
                2.000 santri dari berbagai daerah di Indonesia. Dengan menggabungkan kurikulum pesantren tradisional 
                dan pendidikan modern, kami terus berinovasi menghadirkan sistem pembelajaran terbaik, termasuk 
                implementasi sistem e-Rapor digital untuk kemudahan monitoring perkembangan santri.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Announcement Section */}
      <section id="announcement" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Bell className="w-3.5 h-3.5 mr-2" />
              Informasi Terbaru
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pengumuman
            </h2>
            <p className="text-muted-foreground">
              Berita dan informasi terkini dari pesantren
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnnouncementCard
              date="1 Feb 2026"
              title="Pembukaan PPDB Gelombang 2"
              description="Pendaftaran santri baru gelombang 2 telah dibuka. Dapatkan potongan biaya untuk pendaftar awal."
              badge="PPDB"
            />
            <AnnouncementCard
              date="28 Jan 2026"
              title="Jadwal Ujian Tengah Semester"
              description="Ujian tengah semester akan dilaksanakan pada 10-15 Februari 2026. Persiapkan diri dengan baik."
              badge="Akademik"
            />
            <AnnouncementCard
              date="25 Jan 2026"
              title="Lomba Tahfidz Antar Kelas"
              description="Akan diadakan lomba tahfidz tingkat pesantren. Pendaftaran dibuka hingga 5 Februari 2026."
              badge="Kegiatan"
            />
            <AnnouncementCard
              date="20 Jan 2026"
              title="Pelatihan Guru Sistem e-Rapor"
              description="Seluruh guru dan ustadz akan mengikuti pelatihan penggunaan sistem e-Rapor digital."
              badge="Teknologi"
            />
            <AnnouncementCard
              date="15 Jan 2026"
              title="Libur Semester Genap"
              description="Libur semester genap akan dimulai pada 20 Juni 2026. Santri diharapkan kembali pada 10 Juli 2026."
              badge="Akademik"
            />
            <AnnouncementCard
              date="10 Jan 2026"
              title="Pengumuman Beasiswa Prestasi"
              description="Dibuka pendaftaran beasiswa prestasi untuk santri berprestasi akademik dan non-akademik."
              badge="Beasiswa"
            />
          </div>
        </div>
      </section>

      {/* Education Level Section */}
      <section id="education" className="py-20 bg-sidebar/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Jenjang Pendidikan</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Program Pendidikan
            </h2>
            <p className="text-muted-foreground">
              Kami menyediakan pendidikan berkualitas untuk semua jenjang
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EducationCard
              level="PAUD"
              ageRange="3-5 Tahun"
              description="Program pendidikan anak usia dini dengan metode bermain sambil belajar berbasis nilai-nilai Islam."
              features={["Pembelajaran Interaktif", "Hafalan Doa Harian", "Pengembangan Motorik", "Pengenalan Huruf Hijaiyah"]}
            />
            <EducationCard
              level="TK"
              ageRange="5-6 Tahun"
              description="Taman kanak-kanak Islam dengan kurikulum yang mempersiapkan anak memasuki jenjang SD."
              features={["Calistung Dasar", "Hafalan Surat Pendek", "Kegiatan Seni", "Pembiasaan Akhlak"]}
            />
            <EducationCard
              level="MI"
              ageRange="6-12 Tahun"
              description="Sekolah Dasar/Madrasah Ibtidaiyah dengan perpaduan kurikulum nasional dan pesantren."
              features={["Kurikulum Merdeka", "Tahfidz Juz 30", "Bahasa Arab & Inggris", "Ekstrakulikuler"]}
            />
            <EducationCard
              level="MTs"
              ageRange="12-15 Tahun"
              description="Sekolah Menengah Pertama dengan pendalaman ilmu agama dan sains modern."
              features={["Pembelajaran Terpadu", "Tahfidz 3 Juz", "Sains & Teknologi", "Leadership Training"]}
            />
            <EducationCard
              level="MA"
              ageRange="15-18 Tahun"
              description="Sekolah Menengah Atas dengan penjurusan IPA, IPS, dan Keagamaan."
              features={["Persiapan PTN", "Tahfidz 5 Juz", "Penelitian Ilmiah", "Kewirausahaan"]}
            />
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section id="location" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <MapPin className="w-3.5 h-3.5 mr-2" />
              Hubungi Kami
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Lokasi & Kontak
            </h2>
            <p className="text-muted-foreground">
              Kunjungi kami atau hubungi untuk informasi lebih lanjut
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Alamat Pesantren</CardTitle>
                <CardDescription>Lokasi kampus dan pondok pesantren</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Alamat Lengkap</p>
                    <p className="text-sm text-muted-foreground">
                      Jl. Pesantren Modern No. 123, Kelurahan Pendidikan,
                      Kecamatan Ilmu, Kota Santri, Provinsi Berkah 12345
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Telepon</p>
                    <p className="text-sm text-muted-foreground">+62 21 1234 5678</p>
                    <p className="text-sm text-muted-foreground">+62 812 3456 7890 (WhatsApp)</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Email</p>
                    <p className="text-sm text-muted-foreground">info@pesantrenmodern.sch.id</p>
                    <p className="text-sm text-muted-foreground">ppdb@pesantrenmodern.sch.id</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Jam Operasional</p>
                    <p className="text-sm text-muted-foreground">Senin - Jumat: 08.00 - 16.00 WIB</p>
                    <p className="text-sm text-muted-foreground">Sabtu: 08.00 - 14.00 WIB</p>
                    <p className="text-sm text-muted-foreground">Minggu & Libur: Tutup</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peta Lokasi</CardTitle>
                <CardDescription>Temukan kami di Google Maps</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border border-border">
                  <div className="text-center space-y-2">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Peta lokasi pesantren
                    </p>
                    <Button variant="outline" size="sm">
                      Buka di Google Maps
                    </Button>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-sidebar/10 rounded-lg border border-border">
                  <p className="text-sm font-medium mb-2">Akses Transportasi</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 5 menit dari Terminal Kota</li>
                    <li>• 15 menit dari Stasiun Kereta</li>
                    <li>• 30 menit dari Bandara</li>
                    <li>• Tersedia angkutan umum dan ojek online</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                  <Moon className="w-6 h-6 text-sidebar-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-sidebar-foreground">e-Rapor Pesantren</h3>
                  <p className="text-xs text-sidebar-foreground/70">Sistem Penilaian Digital</p>
                </div>
              </div>
              <p className="text-sm text-sidebar-foreground/70">
                Sistem e-Rapor digital untuk pesantren modern di seluruh Indonesia.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sidebar-foreground">Menu</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li><Link href="#ppdb" className="hover:text-sidebar-primary transition-colors">PPDB</Link></li>
                <li><Link href="#profile" className="hover:text-sidebar-primary transition-colors">Profil</Link></li>
                <li><Link href="#announcement" className="hover:text-sidebar-primary transition-colors">Pengumuman</Link></li>
                <li><Link href="#education" className="hover:text-sidebar-primary transition-colors">Jenjang Pendidikan</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sidebar-foreground">Layanan</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li><Link href="/login" className="hover:text-sidebar-primary transition-colors">Portal Login</Link></li>
                <li><Link href="#" className="hover:text-sidebar-primary transition-colors">Rapor Digital</Link></li>
                <li><Link href="#" className="hover:text-sidebar-primary transition-colors">Sistem Presensi</Link></li>
                <li><Link href="#" className="hover:text-sidebar-primary transition-colors">Pembayaran Online</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sidebar-foreground">Kontak</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+62 21 1234 5678</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>info@pesantren.sch.id</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>Kota Santri, Provinsi Berkah</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-sidebar-border text-center text-sm text-sidebar-foreground/60">
            <p>&copy; 2026 e-Rapor Pesantren. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function PpdbRegistrationForm() {
  const { toast } = useToast()
  const { register, loading: registerLoading } = usePpdbPortalRegister()

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [form, setForm] = React.useState({
    email: "",
    phone: "",
    password: "",
    passwordConfirmation: "",
  })

  const resetForm = () => {
    setForm({
      email: "",
      phone: "",
      password: "",
      passwordConfirmation: "",
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password ||
      !form.passwordConfirmation
    ) {
      toast({
        title: "Data belum lengkap",
        description: "Email, nomor telepon, dan kata sandi wajib diisi.",
        variant: "destructive",
      })
      return
    }

    if (form.password.length < 8) {
      toast({
        title: "Kata sandi terlalu pendek",
        description: "Kata sandi minimal 8 karakter.",
        variant: "destructive",
      })
      return
    }

    if (form.password !== form.passwordConfirmation) {
      toast({
        title: "Konfirmasi kata sandi tidak sesuai",
        description: "Pastikan kata sandi dan konfirmasi kata sandi sama.",
        variant: "destructive",
      })
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast({
        title: "Email tidak valid",
        description: "Masukkan email pendaftar yang valid.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await register({
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        password_confirmation: form.passwordConfirmation,
      })

      toast({
        title: "Akun pendaftar berhasil dibuat",
        description: result.message || "Silakan lanjut ke halaman informasi akun.",
      })
      resetForm()
      setTimeout(() => {
        window.location.href = "/ppdb/login"
      }, 500)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim pendaftaran."
      toast({
        title: "Pendaftaran gagal",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-lg border border-border/70 p-4 bg-muted/30">
        <p className="text-sm text-muted-foreground">Nomor Pendaftaran</p>
        <p className="text-sm text-foreground mt-1">
          Akan dibuat otomatis saat tombol <span className="font-semibold">Buat Akun Pendaftar</span> ditekan.
        </p>
      </div>

      <div className="grid gap-2 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
        <Label htmlFor="ppdb-email" className="text-base font-semibold text-foreground">
          Email Akun <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ppdb-email"
          type="email"
          placeholder="contoh@email.com"
          className="h-11"
          value={form.email}
          onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
        <Label htmlFor="ppdb-phone" className="text-base font-semibold text-foreground">
          Nomor Telepon <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ppdb-phone"
          placeholder="08xxxxxxxxxx"
          className="h-11"
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
        <Label htmlFor="ppdb-password" className="text-base font-semibold text-foreground">
          Buat Kata Sandi Akun <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ppdb-password"
          type="password"
          placeholder="Minimal 8 karakter"
          className="h-11"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
        <Label htmlFor="ppdb-password-confirmation" className="text-base font-semibold text-foreground">
          Konfirmasi Kata Sandi <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ppdb-password-confirmation"
          type="password"
          placeholder="Masukkan konfirmasi kata sandi"
          className="h-11"
          value={form.passwordConfirmation}
          onChange={(event) => setForm((prev) => ({ ...prev, passwordConfirmation: event.target.value }))}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
        <div />
        <div className="space-y-3 w-full sm:w-[340px]">
          <Button
            type="submit"
            className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting || registerLoading}
          >
            {isSubmitting || registerLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            Buat Akun Pendaftar
          </Button>
          <p className="text-sm text-muted-foreground">
            Setelah akun dibuat, lanjutkan dengan login dan isi form lengkap di dashboard pendaftar.
          </p>
        </div>
      </div>
    </form>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <Card className="text-center">
      <CardContent className="pt-6">
        <p className="text-3xl md:text-4xl font-bold text-primary mb-1">{number}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function AnnouncementCard({
  date,
  title,
  description,
  badge,
}: {
  date: string
  title: string
  description: string
  badge: string
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary" className="text-xs">{badge}</Badge>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function EducationCard({
  level,
  ageRange,
  description,
  features,
}: {
  level: string
  ageRange: string
  description: string
  features: string[]
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <GraduationCap className="w-8 h-8 text-primary" />
          <Badge variant="outline">{ageRange}</Badge>
        </div>
        <CardTitle>{level}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
