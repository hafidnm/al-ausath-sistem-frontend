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
import { usePpdbPortalRegister, usePpdbPortalPeriodCheck } from "@/hooks/ppdb/santri"
import { pengumumanService, type Pengumuman } from "@/lib/services/pengumuman.service"
import { BookOpen, Users, GraduationCap, Star, Moon, Menu, Calendar, Bell, MapPin, Phone, Mail, Clock, CheckCircle2, Building2, ChevronDown, LogIn, UserPlus, Loader2 } from "lucide-react"

export default function LandingPage() {
  const [pengumuman, setPengumuman] = React.useState<Pengumuman[]>([])
  const [pengumumanLoading, setPengumumanLoading] = React.useState(true)
  const [pengumumanError, setPengumumanError] = React.useState<string | null>(null)

  const { isOpen, period, loading: periodLoading } = usePpdbPortalPeriodCheck()

  React.useEffect(() => {
    let isMounted = true

    const loadPengumuman = async () => {
      setPengumumanLoading(true)
      setPengumumanError(null)

      try {
        const items = await pengumumanService.getPublic()
        if (!isMounted) return
        setPengumuman(items)
      } catch (error) {
        if (!isMounted) return
        setPengumumanError(error instanceof Error ? error.message : "Gagal memuat pengumuman")
      } finally {
        if (isMounted) setPengumumanLoading(false)
      }
    }

    void loadPengumuman()

    return () => {
      isMounted = false
    }
  }, [])

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
                <h1 className="text-lg font-bold text-foreground">Pesantren Al Ausath</h1>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/ppdb/register" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
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
          <div className="max-w-4xl mx-auto text-center space-y-6 flex flex-col items-center">
            
            {periodLoading ? (
              <div className="inline-flex items-center gap-2 bg-muted px-4 py-1.5 rounded-full text-xs text-muted-foreground animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Mengecek status PPDB...
              </div>
            ) : isOpen && period ? (
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                PPDB {period.nama_gelombang} TA {period.tahun_ajaran} Telah Dibuka!
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-muted text-muted-foreground border border-border px-4 py-1.5 rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                Pendaftaran PPDB Online Sedang Ditutup
              </div>
            )}

            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight w-full">
              Sistem Informasi Digital{" "}
              <span className="text-primary">Pesantren Modern</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Menggabungkan sistem pendidikan formal dengan keagamaan. Menyediakan portal pendaftaran santri baru (PPDB) serta pengelolaan administrasi & e-Rapor secara terintegrasi.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 w-full sm:w-auto">
              <Link href="/ppdb/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Calendar className="w-4 h-4 mr-2" />
                  Daftar PPDB
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Portal Login
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            <StatCard number="1" label="Mitra Institusi" />
            <StatCard number="4" label="Bidang Kegiatan" />
            <StatCard number="10++" label="Ustadz & Guru" />
            <StatCard number="Banyak" label="Fasilitas Belajar" />
          </div>
        </div>
      </section>


      {/* Profile Section */}
      <section id="profile" className="py-20 bg-sidebar/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Profil Institusi Mitra</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pondok Pesantren Al Ausath
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

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 mt-8">
            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle>Sejarah Singkat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Pondok Pesantren Al Ausath merupakan salah satu lembaga pendidikan yang berada di Kabupaten Karanganyar, Jawa Tengah. Pondok pesantren ini menggabungkan sistem pendidikan formal dengan pendidikan berbasis keagamaan, sehingga santri tidak hanya memperoleh ilmu akademik, tetapi juga pemahaman agama yang kuat.
                </p>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Dalam proses pembelajaran, Pondok Pesantren Al Ausath menerapkan kurikulum yang berlaku secara umum serta dipadukan dengan kurikulum keislaman. Selain kegiatan belajar mengajar, pesantren juga menyediakan berbagai kegiatan ekstrakurikuler seperti karate, basket, futsal, serta kelompok belajar untuk menunjang pengembangan kemampuan santri secara menyeluruh.
                </p>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Pondok Pesantren Al Ausath memiliki tenaga pengajar yang kompeten, baik ustadz maupun guru, yang memiliki keahlian pada bidangnya masing-masing. Selain itu, tersedia berbagai fasilitas pendukung seperti ruang kelas, asrama, laboratorium, perpustakaan, lapangan olahraga, kantin, serta masjid yang menunjang kegiatan belajar dan kehidupan santri di lingkungan pesantren.
                </p>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-full">
              <CardHeader>
                <CardTitle>Bidang Kegiatan</CardTitle>
                <CardDescription>
                  Program dan lingkup kegiatan Pondok Pesantren Al Ausath
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">1</div>
                    <div>
                      <p className="font-semibold text-foreground">Pendidikan formal dan keagamaan</p>
                      <p className="text-sm text-muted-foreground">Penggabungan kurikulum umum nasional dengan pengajaran keagamaan Islam secara intensif.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">2</div>
                    <div>
                      <p className="font-semibold text-foreground">Pengelolaan administrasi santri</p>
                      <p className="text-sm text-muted-foreground">Sistem informasi untuk mempermudah pendaftaran (PPDB), e-Rapor, dan rekam perkembangan santri.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">3</div>
                    <div>
                      <p className="font-semibold text-foreground">Kegiatan ekstrakurikuler</p>
                      <p className="text-sm text-muted-foreground">Penunjang minat bakat santri seperti olahraga karate, basket, futsal, dan kelompok belajar.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">4</div>
                    <div>
                      <p className="font-semibold text-foreground">Pembinaan karakter dan keagamaan</p>
                      <p className="text-sm text-muted-foreground">Pendidikan moral, pembentukan disiplin ibadah harian, dan kepribadian Islami yang kokoh.</p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
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

          {pengumumanLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse border-border/50">
                  <CardHeader>
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-6 w-4/5 rounded bg-muted mt-4" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 w-full rounded bg-muted" />
                      <div className="h-4 w-5/6 rounded bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pengumumanError ? (
            <Card className="max-w-3xl mx-auto border-destructive/30 bg-destructive/5">
              <CardContent className="p-6 text-center space-y-2">
                <p className="font-semibold text-destructive">Pengumuman gagal dimuat</p>
                <p className="text-sm text-muted-foreground">{pengumumanError}</p>
              </CardContent>
            </Card>
          ) : pengumuman.length === 0 ? (
            <Card className="max-w-3xl mx-auto border-border/60">
              <CardContent className="p-6 text-center space-y-2">
                <p className="font-semibold text-foreground">Belum ada pengumuman aktif</p>
                <p className="text-sm text-muted-foreground">
                  Informasi terbaru akan tampil di sini ketika admin mempublikasikannya.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pengumuman.slice(0, 6).map((item) => (
                <AnnouncementCard
                  key={item.id}
                  id={item.id}
                  date={item.tanggal_mulai || item.created_at}
                  title={item.judul}
                  description={item.konten}
                  badge={item.kategori}
                />
              ))}
            </div>
          )}
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
                      Unnamed Road, Gotamon, Jati, Kec. Jaten, Kabupaten Karanganyar, Jawa Tengah 57731, Indonesia
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Telepon & WhatsApp</p>
                    <p className="text-sm text-muted-foreground">+62 812-3456-7890 (Layanan PPDB / Informasi)</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Email</p>
                    <p className="text-sm text-muted-foreground">info@alausath-karanganyar.sch.id</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Jam Operasional Kantor</p>
                    <p className="text-sm text-muted-foreground">Senin - Sabtu: 08.00 - 15.00 WIB</p>
                    <p className="text-sm text-muted-foreground">Minggu & Hari Libur Nasional: Tutup</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Peta Lokasi</CardTitle>
                <CardDescription>Lokasi Pondok Pesantren Al Ausath di Google Maps</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="aspect-video w-full rounded-lg overflow-hidden border border-border">
                  <iframe
                    src="https://maps.google.com/maps?q=Pondok%20Pesantren%20Al%20Ausath%20Jaten%20Karanganyar&t=&z=15&ie=UTF8&iwloc=&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    title="Peta Lokasi Pondok Pesantren Al Ausath"
                  ></iframe>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Pondok+Pesantren+Al+Ausath+Jaten+Karanganyar"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Buka di Google Maps
                    </a>
                  </Button>
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
                  <h3 className="font-bold text-sidebar-foreground">PP Al Ausath</h3>
                  <p className="text-xs text-sidebar-foreground/70">Portal & e-Rapor Digital</p>
                </div>
              </div>
              <p className="text-sm text-sidebar-foreground/70">
                Sistem informasi, administrasi, dan e-Rapor digital Pondok Pesantren Al Ausath Karanganyar.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sidebar-foreground">Menu</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li><Link href="/ppdb/register" className="hover:text-sidebar-primary transition-colors">PPDB</Link></li>
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
                  <span>+62 812-3456-7890</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>info@alausath-karanganyar.sch.id</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span className="text-xs">Gotamon, Jati, Kec. Jaten, Kabupaten Karanganyar, Jawa Tengah</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-sidebar-border text-center text-sm text-sidebar-foreground/60">
            <p>&copy; 2026 Pondok Pesantren Al Ausath. All rights reserved.</p>
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
  id,
  date,
  title,
  description,
  badge,
}: {
  id: number
  date: string
  title: string
  description: string
  badge: string
}) {
  const formattedDate = new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary" className="text-xs">{badge}</Badge>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-4">{description}</p>
        <div className="mt-4">
          <Link href={`/pengumuman/${id}`} className="text-sm font-medium text-primary hover:underline">
            Baca selengkapnya
          </Link>
        </div>
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
