"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authService } from "@/lib/services/auth.service"
import { getCachedUser } from "@/lib/auth-cache"
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
} from "lucide-react"

const adminMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/admin-panel" },
  { icon: BarChart3, label: "Overview Presensi", href: "/dashboard/presensi-overview" },
  { icon: Users, label: "Data Santri", href: "/dashboard/santri" },
  { icon: GraduationCap, label: "Santri Lulus", href: "/dashboard/santri/lulus" },
  { icon: UserCheck, label: "Data Akun Santri", href: "/dashboard/akun-santri" },
  { icon: GraduationCap, label: "Data Guru", href: "/dashboard/guru" },
  { icon: School, label: "Data Kelas", href: "/dashboard/kelas" },
  { icon: Building2, label: "Data Unit", href: "/dashboard/unit" },
  { icon: BookOpen, label: "Data Kelas Mapel", href: "/dashboard/kelas-mapel" },
  { icon: BookOpen, label: "Data Mata Pelajaran", href: "/dashboard/mapel" },
  { icon: Calendar, label: "Data Jadwal Pembelajaran", href: "/dashboard/jadwal-pembelajaran" },
  { icon: UserCheck, label: "Presensi Santri", href: "/dashboard/presensi-santri" },
  { icon: ClipboardCheck, label: "Presensi Guru", href: "/dashboard/presensi-guru" },
  { icon: CheckCircle, label: "Validasi Presensi", href: "/dashboard/validasi-presensi" },
  { icon: ClipboardList, label: "Input Nilai", href: "/dashboard/admin-panel/nilai-mapel" },
  { icon: ClipboardList, label: "Nilai Akhlak", href: "/dashboard/admin-panel/nilai-akhlak" },
  { icon: ClipboardList, label: "KKM", href: "/dashboard/admin-panel/kkm" },
  { icon: FileText, label: "Rapor", href: "/dashboard/admin-panel/rapor" },
  { icon: TrendingUp, label: "Analitik", href: "/dashboard/analitik" },
  { icon: Calendar, label: "Tahun Ajaran", href: "/dashboard/tahun-ajaran" },
  { icon: UserPlus, label: "PPDB", href: "/dashboard/ppdb" },
  { icon: Megaphone, label: "Pengumuman", href: "/dashboard/pengumuman" },
  { icon: Receipt, label: "Tagihan", href: "/dashboard/spp" },
  { icon: Receipt, label: "Administrasi Bebas", href: "/dashboard/bebas" },
  { icon: Wallet, label: "Pembayaran", href: "/dashboard/pembayaran" },
  { icon: Settings, label: "Pengaturan", href: "/dashboard/pengaturan" },
]

const guruMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/guru-panel" },
  { icon: UserCheck, label: "Presensi Santri", href: "/dashboard/presensi-santri" },
  { icon: ClipboardList, label: "Input Nilai", href: "/dashboard/admin-panel/nilai-mapel" },
  { icon: ClipboardList, label: "Nilai Akhlak", href: "/dashboard/admin-panel/nilai-akhlak" },
  { icon: ClipboardList, label: "KKM", href: "/dashboard/admin-panel/kkm" },
  { icon: FileText, label: "Rapor", href: "/dashboard/admin-panel/rapor" },
  { icon: Megaphone, label: "Pengumuman", href: "/dashboard/pengumuman" },
]

const sppMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Receipt, label: "Tagihan SPP", href: "/dashboard/spp" },
  { icon: Receipt, label: "Administrasi Bebas", href: "/dashboard/bebas" },
  { icon: Wallet, label: "Pembayaran", href: "/dashboard/pembayaran" },
  { icon: Megaphone, label: "Pengumuman", href: "/dashboard/pengumuman" },
]

const ppdbMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: UserPlus, label: "PPDB", href: "/dashboard/ppdb" },
  { icon: Megaphone, label: "Pengumuman", href: "/dashboard/pengumuman" },
]

const santriMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard/santri-panel" },
  { icon: FileText, label: "Rapor Digital", href: "/dashboard/santri-panel/rapor" },
  { icon: Award, label: "Nilai Mapel", href: "/dashboard/santri-panel/nilai-mapel" },
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
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
  const checkAuth = async () => {
    const authData = await getCachedUser()

    if (!authData?.user) {
      window.location.replace("/login")
      return
    }

    setUser(authData.user)
    setRole(authData.role)
  }

  checkAuth()
}, [])

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
                <h1 className="font-bold text-sidebar-foreground">e-Rapor</h1>
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
               ? (
                   user?.peran_akun === 'Petugas Admin' ? adminMenuItems
                   : user?.peran_akun === 'Petugas SPP'  ? sppMenuItems
                   : user?.peran_akun === 'Petugas PPDB' ? ppdbMenuItems
                   : guruMenuItems   // Staf Pengajar & Petugas Tata Usaha
                 )
               : santriMenuItems
             ).map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
            <div className="flex items-center gap-4">
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
                  {[...adminMenuItems, ...guruMenuItems, ...sppMenuItems, ...ppdbMenuItems, ...santriMenuItems].find((item) => item.href === pathname)?.label || "Dashboard"}
                </h2>
                <p className="text-xs text-muted-foreground">Tahun Ajaran 2024/2025 - Semester Ganjil</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              </Button>

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
          <DropdownMenuItem>
            <User className="w-4 h-4 mr-2" />
            Profil
          </DropdownMenuItem>
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
  )
}
