"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { canAccess, getRoleHome } from "@/lib/rbac"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authService } from "@/lib/services/auth.service"
import { getCachedUser } from "@/lib/auth-cache"
import { TahunAjaranProvider, useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Moon,
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  FileText,
  Settings,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronDown,
  LogOut,
  User,
  School,
  Calendar,
  UserCheck,
  ClipboardCheck,
  CheckCircle,
  BarChart3,
  TrendingUp,
  UserCog,
  Shield,
  UserPlus,
  Wallet,
  Building2,
  Megaphone,
  Receipt,
  Award,
  Star,
  ListChecks,
  CreditCard,
  BookMarked,
  Landmark,
} from "lucide-react"
import NotificationsBell from "@/components/notifications/notifications-bell"

function TahunAjaranSelector() {
  const { allTahunAjaran, selectedTahunAjaran, setSelectedTahunAjaran, isLoading } = useTahunAjaran()

  if (isLoading || allTahunAjaran.length === 0) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium hidden sm:flex">
          <BookMarked className="w-3.5 h-3.5 text-primary" />
          <span className="max-w-[120px] truncate">
            {selectedTahunAjaran?.nama_tahun ?? "Tahun Ajaran"}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Pilih Tahun Ajaran</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allTahunAjaran.map((ta) => {
          const id = ta.id_tahun_ajaran ?? ta.id
          const selectedId = selectedTahunAjaran?.id_tahun_ajaran ?? selectedTahunAjaran?.id
          const isActive = id === selectedId
          return (
            <DropdownMenuItem
              key={id}
              className={cn("cursor-pointer text-sm", isActive && "font-semibold text-primary")}
              onClick={() => setSelectedTahunAjaran(ta)}
            >
              {ta.nama_tahun}
              {ta.status === "AKTIF" && (
                <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                  Aktif
                </span>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type MenuItem = {
  icon: any
  label: string
  href?: string
  subItems?: { icon: any; label: string; href: string }[]
}

const adminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/admin-panel" },
  { icon: BarChart3, label: "Overview Presensi", href: "/dashboard/presensi-overview" },
  {
    icon: Building2,
    label: "Data Master",
    subItems: [
      { icon: Users, label: "Data Santri", href: "/dashboard/santri" },
      { icon: GraduationCap, label: "Santri Lulus", href: "/dashboard/santri/lulus" },
      { icon: UserCheck, label: "Data Akun Santri", href: "/dashboard/akun-santri" },
      { icon: GraduationCap, label: "Data Petugas", href: "/dashboard/guru" },
      { icon: School, label: "Data Kelas", href: "/dashboard/kelas" },
      { icon: Building2, label: "Data Unit", href: "/dashboard/unit" },
      { icon: BookOpen, label: "Data Kelas Mapel", href: "/dashboard/kelas-mapel" },
      { icon: BookOpen, label: "Data Mata Pelajaran", href: "/dashboard/mapel" },
      { icon: Calendar, label: "Data Jadwal Pembelajaran", href: "/dashboard/jadwal-pembelajaran" },
      { icon: Calendar, label: "Tahun Ajaran", href: "/dashboard/tahun-ajaran" },
    ]
  },
  { icon: Star, label: "Ekstrakurikuler", href: "/dashboard/ekskul" },
  { icon: ListChecks, label: "Rekap Pendaftar Ekskul", href: "/dashboard/ekskul-rekap" },
  { icon: UserCheck, label: "Presensi Santri", href: "/dashboard/presensi-santri" },
  { icon: ClipboardCheck, label: "Presensi Guru", href: "/dashboard/presensi-guru" },
  { icon: CheckCircle, label: "Validasi Presensi", href: "/dashboard/validasi-presensi" },
  { icon: ClipboardList, label: "Input Nilai", href: "/dashboard/admin-panel/nilai-mapel" },
  { icon: ClipboardList, label: "Nilai Akhlak", href: "/dashboard/admin-panel/nilai-akhlak" },
  { icon: ClipboardList, label: "KKM", href: "/dashboard/admin-panel/kkm" },
  { icon: FileText, label: "Rapor", href: "/dashboard/admin-panel/rapor" },
  { icon: TrendingUp, label: "Analitik", href: "/dashboard/analitik" },
  { icon: UserPlus, label: "PPDB", href: "/dashboard/ppdb" },
  { icon: Megaphone, label: "Pengumuman", href: "/dashboard/pengumuman" },
  { icon: Receipt, label: "Tagihan", href: "/dashboard/spp" },
  { icon: Receipt, label: "Administrasi Bebas", href: "/dashboard/bebas" },
  { icon: Wallet, label: "Pembayaran", href: "/dashboard/pembayaran" },
  { icon: CreditCard, label: "Setting SPP", href: "/dashboard/admin-panel/spp-settings" },
  { icon: Landmark, label: "Rekening Bank", href: "/dashboard/admin-panel/rekening" },
]

const guruMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/guru-panel" },
  { icon: ClipboardList, label: "Input Nilai", href: "/dashboard/admin-panel/nilai-mapel" },
  { icon: ClipboardList, label: "Nilai Akhlak", href: "/dashboard/admin-panel/nilai-akhlak" },
  { icon: ClipboardList, label: "KKM", href: "/dashboard/admin-panel/kkm" },
  { icon: FileText, label: "Rapor", href: "/dashboard/admin-panel/rapor" },
  { icon: Megaphone, label: "Pengumuman", href: "/dashboard/pengumuman" },
]

// Staf Pengajar should have access to Analitik
const stafPengajarMenuItems: MenuItem[] = [
  ...guruMenuItems,
  { icon: TrendingUp, label: "Analitik Pengajar", href: "/dashboard/analitik-pengajar" },
]

const sppMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Receipt, label: "Tagihan SPP", href: "/dashboard/spp" },
  { icon: Receipt, label: "Administrasi Bebas", href: "/dashboard/bebas" },
  { icon: Wallet, label: "Pembayaran", href: "/dashboard/pembayaran" },
  { icon: Megaphone, label: "Pengumuman", href: "/dashboard/pengumuman" },
]

const ppdbMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: UserPlus, label: "PPDB", href: "/dashboard/ppdb" },
  { icon: Megaphone, label: "Pengumuman", href: "/dashboard/pengumuman" },
]

const santriMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/santri-panel" },
  { icon: FileText, label: "Rapor Digital", href: "/dashboard/santri-panel/rapor" },
  { icon: Award, label: "Nilai Mapel", href: "/dashboard/santri-panel/nilai-mapel" },
  { icon: TrendingUp, label: "Analitik Santri", href: "/dashboard/santri-panel/analitik" },
  { icon: Calendar, label: "Jadwal Pembelajaran", href: "/dashboard/santri-panel/jadwal-pembelajaran" },
  { icon: Star, label: "Ekstrakurikuler", href: "/dashboard/pilih-ekskul" },
  { icon: Receipt, label: "Administrasi", href: "/dashboard/santri-panel/administrasi" },
  { icon: Megaphone, label: "Pengumuman", href: "/dashboard/santri-panel/pengumuman" },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string>("")
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const router = useRouter()

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
  const checkAuth = async () => {
    const authData = await getCachedUser()

    if (!authData?.user) {
      router.replace("/login")
      return
    }

    // ── RBAC Whitelist Guard ──────────────────────────────────
    const petugasRoles: string[] = Array.isArray(authData.user.peran_akun)
      ? authData.user.peran_akun
      : typeof authData.user.peran_akun === "string" && authData.user.peran_akun.startsWith("[")
        ? JSON.parse(authData.user.peran_akun)
        : authData.user.peran_akun
          ? [authData.user.peran_akun]
          : []

    const isSantri = authData.role === "santri"
    const effectiveRoles: string[] = isSantri ? ["santri"] : petugasRoles

    if (!canAccess(effectiveRoles, pathname)) {
      const home = getRoleHome(effectiveRoles)
      if (pathname !== home) {
        router.replace(home)
        return
      }
    }
    // ─────────────────────────────────────────────────────────

    setUser(authData.user)
    setRole(authData.role)
  }

  checkAuth()
}, [pathname])

  const handleLogout = async () => {
  try {
    await authService.logout()
  } catch (error) {
    console.error('Logout backend failed:', error)
    localStorage.clear()
  } finally {
    window.location.replace('/')
  }
}
  // Ambil inisial nama
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U'
  }

  if (!mounted) {
    return <div className="min-h-screen bg-background" suppressHydrationWarning />
  }

  return (
    <TahunAjaranProvider>
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          isDesktopSidebarOpen ? "lg:translate-x-0" : "lg:-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Moon className="w-6 h-6 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground">Al-Ausath </h1>
                <p className="text-xs text-sidebar-foreground/60">Pesantren</p>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setIsDesktopSidebarOpen(false)}
                aria-label="Tutup sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {(role === 'petugas'
               ? (() => {
                   const peran: string[] = Array.isArray(user?.peran_akun)
                     ? user.peran_akun.flat().map(String)
                     : (user?.peran_akun ? [String(user.peran_akun)] : [])
                   if (peran.includes('Petugas Admin')) return adminMenuItems
                   if (peran.includes('Petugas SPP'))  return sppMenuItems
                   if (peran.includes('Petugas PPDB')) return ppdbMenuItems
                   if (peran.includes('Staf Pengajar')) return stafPengajarMenuItems
                   return guruMenuItems // Petugas Tata Usaha dan lainnya
                 })()
               : santriMenuItems
             ).map((item) => {
              if (item.subItems) {
                const isAnyChildActive = item.subItems.some((sub: any) => pathname === sub.href)
                const isOpen = openMenus[item.label] || isAnyChildActive

                return (
                  <div key={item.label} className="flex flex-col space-y-1">
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isAnyChildActive
                          ? "bg-sidebar-accent/50 text-sidebar-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        {item.label}
                      </div>
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <div className="flex flex-col pl-9 space-y-1 mt-1">
                        {item.subItems.map((sub: any) => {
                          const isSubActive = pathname === sub.href
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={() => setSidebarOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                isSubActive
                                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              )}
                            >
                              <sub.icon className="w-4 h-4" />
                              {sub.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href || item.label}
                  href={item.href || "#"}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  {user ? getInitials(user.nama_lengkap) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.nama_lengkap || 'User'}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("transition-[padding] duration-200", isDesktopSidebarOpen ? "lg:pl-64" : "lg:pl-0")}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              {/* Sidebar toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              {!isDesktopSidebarOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden lg:inline-flex"
                  onClick={() => setIsDesktopSidebarOpen(true)}
                  aria-label="Buka sidebar"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              )}
              <div>
                <h2 className="font-semibold text-foreground">
                  {([...adminMenuItems, ...guruMenuItems, ...sppMenuItems, ...ppdbMenuItems, ...santriMenuItems] as any[]).find((item) => {
                    if (item.href === pathname) return true;
                    if (item.subItems) {
                      return item.subItems.find((sub: any) => sub.href === pathname);
                    }
                    return false;
                  })?.label || "Dashboard"}
                </h2>
              </div>
              {/* Tahun Ajaran Global Selector */}
              <TahunAjaranSelector />
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <NotificationsBell />

              {/* User Menu */}
              <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user ? getInitials(user.nama_lengkap) : 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm font-medium text-foreground">
              {user?.nama_lengkap || 'User'}
            </span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <Link href="/dashboard/profile" className="w-full">
            <DropdownMenuItem className="cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              Profil
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem>
            <Settings className="w-4 h-4 mr-2" />
            Pengaturan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleLogout}
            className="text-destructive cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
    </TahunAjaranProvider>
  )
}
