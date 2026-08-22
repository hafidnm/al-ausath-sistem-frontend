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
import { UnitProvider, useUnit } from "@/contexts/unit-context"
import { SemesterProvider, useSemester } from "@/contexts/semester-context"
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
  Building2 as UnitIcon,
  Database,
  HardDrive,
} from "lucide-react"
import NotificationsBell from "@/components/notifications/notifications-bell"

function TahunAjaranSelector() {
  const { allTahunAjaran, selectedTahunAjaran, setSelectedTahunAjaran, isLoading } = useTahunAjaran()

  if (isLoading) {
    return (
      <div className="h-8 w-32 rounded-md bg-muted animate-pulse hidden sm:block" />
    )
  }

  if (allTahunAjaran.length === 0) return null

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

function SemesterSelector() {
  const { semester, setSemester } = useSemester()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium hidden sm:flex">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>Semester {semester === 1 ? "Ganjil" : "Genap"}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Pilih Semester</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={cn("cursor-pointer text-sm", semester === 1 && "font-semibold text-primary")}
          onClick={() => setSemester(1)}
        >
          Ganjil (1)
          {semester === 1 && <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Aktif</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          className={cn("cursor-pointer text-sm", semester === 2 && "font-semibold text-primary")}
          onClick={() => setSemester(2)}
        >
          Genap (2)
          {semester === 2 && <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Aktif</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function UnitSelector({ role }: { role?: string }) {
  const { allUnit, selectedUnit, setSelectedUnit, isLoading } = useUnit()

  if (isLoading) {
    return (
      <div className="h-8 w-28 rounded-md bg-muted animate-pulse hidden sm:block" />
    )
  }

  // Only show if there's more than one unit, and role is not santri
  if (role === "santri" || allUnit.length <= 1) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium hidden sm:flex">
          <UnitIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span className="max-w-[100px] truncate">
            {selectedUnit?.nama_unit ?? "Semua Unit"}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Pilih Jenjang / Unit</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={cn("cursor-pointer text-sm", !selectedUnit && "font-semibold text-primary")}
          onClick={() => setSelectedUnit(null)}
        >
          Semua Unit
          {!selectedUnit && (
            <span className="ml-auto text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              Aktif
            </span>
          )}
        </DropdownMenuItem>
        {allUnit.map((unit) => {
          const id = unit.id_unit ?? unit.id
          const selectedId = selectedUnit?.id_unit ?? selectedUnit?.id
          const isActive = id === selectedId
          return (
            <DropdownMenuItem
              key={id}
              className={cn("cursor-pointer text-sm", isActive && "font-semibold text-primary")}
              onClick={() => setSelectedUnit(unit)}
            >
              {unit.nama_unit}
              {isActive && (
                <span className="ml-auto text-[10px] bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded-full">
                  Dipilih
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
  {
    icon: UserCheck,
    label: "Presensi",
    subItems: [
      { icon: BarChart3, label: "Overview Presensi", href: "/dashboard/presensi-overview" },
      { icon: UserCheck, label: "Presensi Santri", href: "/dashboard/presensi-santri" },
      { icon: ClipboardCheck, label: "Presensi Guru", href: "/dashboard/presensi-guru" },
    ],
  },
  {
    icon: ClipboardList,
    label: "Penilaian & Rapor",
    subItems: [
      { icon: ClipboardList, label: "Input Nilai Mapel", href: "/dashboard/admin-panel/nilai-mapel" },
      { icon: ClipboardList, label: "Nilai Akhlak", href: "/dashboard/admin-panel/nilai-akhlak" },
      { icon: ClipboardList, label: "KKM", href: "/dashboard/admin-panel/kkm" },
      { icon: FileText, label: "Rapor", href: "/dashboard/admin-panel/rapor" },
      { icon: BookMarked, label: "Bobot Nilai", href: "/dashboard/admin-panel/bobot" },
      { icon: TrendingUp, label: "Rangking Kelas", href: "/dashboard/admin-panel/rangking" },
    ],
  },
  { icon: Star, label: "Ekstrakurikuler", href: "/dashboard/ekskul" },
  { icon: ListChecks, label: "Rekap Pendaftar Ekskul", href: "/dashboard/ekskul-rekap" },
  { icon: TrendingUp, label: "Analitik", href: "/dashboard/analitik" },
  { icon: UserPlus, label: "PPDB", href: "/dashboard/ppdb" },
  {
    icon: Wallet,
    label: "Administrasi",
    subItems: [
      { icon: Receipt, label: "Tagihan", href: "/dashboard/spp" },
      { icon: Receipt, label: "Administrasi Bebas", href: "/dashboard/bebas" },
      { icon: Wallet, label: "Pembayaran", href: "/dashboard/pembayaran" },
      { icon: CreditCard, label: "Setting SPP", href: "/dashboard/admin-panel/spp-settings" },
      { icon: Landmark, label: "Rekening Bank", href: "/dashboard/admin-panel/rekening" },
      { icon: Megaphone, label: "Pengumuman", href: "/dashboard/pengumuman" },
      { icon: Building2, label: "Profil Web", href: "/dashboard/admin-panel/profil-web" },
    ],
  },
  {
    icon: HardDrive,
    label: "Pengaturan Sistem",
    subItems: [
      { icon: Database, label: "Backup Database", href: "/dashboard/admin-panel/backup" },
    ],
  },
]

const guruMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard Guru", href: "/dashboard/guru-panel" },
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
  {
    icon: Wallet,
    label: "Administrasi",
    subItems: [
      { icon: Receipt, label: "Tagihan SPP", href: "/dashboard/spp" },
      { icon: Receipt, label: "Administrasi Bebas", href: "/dashboard/bebas" },
      { icon: Wallet, label: "Pembayaran", href: "/dashboard/pembayaran" },
      { icon: CreditCard, label: "Setting SPP", href: "/dashboard/admin-panel/spp-settings" },
      { icon: Landmark, label: "Rekening Bank", href: "/dashboard/admin-panel/rekening" },
      { icon: Megaphone, label: "Pengumuman", href: "/dashboard/pengumuman" },
    ],
  },
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

// Merge menu items from multiple roles, deduplicating by href/label
function mergeMenuItems(peran: string[]): MenuItem[] {
  const collected: MenuItem[][] = []

  if (peran.includes('Petugas Admin')) collected.push(adminMenuItems)
  if (peran.includes('Petugas SPP'))  collected.push(sppMenuItems)
  if (peran.includes('Petugas PPDB')) collected.push(ppdbMenuItems)
  if (peran.includes('Staf Pengajar')) collected.push(stafPengajarMenuItems)

  // Fallback: any other petugas role → guru menu
  const knownRoles = ['Petugas Admin', 'Petugas SPP', 'Petugas PPDB', 'Staf Pengajar']
  if (collected.length === 0 || peran.some((p) => !knownRoles.includes(p) && !collected.length)) {
    collected.push(guruMenuItems)
  }

  if (collected.length === 1) return collected[0]

  // Merge: preserve order, deduplicate by href (for leaf items) or label (for groups)
  const merged: MenuItem[] = []
  const seen = new Set<string>()

  for (const menu of collected) {
    for (const item of menu) {
      const key = item.href ?? item.label
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(item)
      }
    }
  }

  return merged
}

function getPageTitle(pathname: string): string {
  const allMenus = [...adminMenuItems, ...guruMenuItems, ...sppMenuItems, ...ppdbMenuItems, ...santriMenuItems]
  
  // Exact match
  for (const item of allMenus) {
    if (item.subItems) {
      for (const sub of item.subItems) {
        if (sub.href === pathname) return sub.label
      }
    }
    if (item.href === pathname) return item.label
  }

  // Prefix match
  for (const item of allMenus) {
    if (item.subItems) {
      for (const sub of item.subItems) {
        if (sub.href && sub.href !== "/dashboard" && pathname.startsWith(sub.href)) return sub.label
      }
    }
    if (item.href && item.href !== "/dashboard" && pathname.startsWith(item.href)) return item.label
  }

  if (pathname.includes("/santri/lulus")) return "Santri Lulus"
  if (pathname.includes("/nilai-mapel/new")) return "Tambah Nilai Mapel"
  if (pathname.includes("/nilai-akhlak/new")) return "Tambah Nilai Akhlak"

  return "Dashboard"
}

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
  const currentTitle = getPageTitle(pathname)

  const effectiveRoles: string[] = role === "santri"
    ? ["santri"]
    : (Array.isArray(user?.peran_akun)
        ? user.peran_akun.flat().map(String)
        : (user?.peran_akun ? [String(user.peran_akun)] : []))

  const logoHref = effectiveRoles.length > 0 ? getRoleHome(effectiveRoles) : "/dashboard"

  useEffect(() => {
    if (currentTitle) {
      document.title = `${currentTitle} | Pesantren Al-Ausath`
    }
  }, [pathname, currentTitle])

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isMenuHrefActive = (href?: string) => {
    if (!href) return false
    if (href === "/dashboard") return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
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
    return (
      <UnitProvider>
      <TahunAjaranProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 bg-card border-b border-border">
          <div className="flex items-center justify-between px-4 py-3 lg:px-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-32 rounded-md bg-muted animate-pulse" />
            </div>
          </div>
        </header>
      </div>
      </TahunAjaranProvider>
      </UnitProvider>
    )
  }

  return (
    <UnitProvider>
    <TahunAjaranProvider>
    <SemesterProvider>
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
            <Link href={logoHref} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center border border-border/20 shadow-sm shrink-0">
                <img src="/logo.png" alt="Logo Al-Ausath" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="font-bold text-sidebar-foreground">Al-Ausath</h1>
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
                   return mergeMenuItems(peran)
                 })()
               : santriMenuItems
             ).map((item) => {
              if (item.subItems) {
                const isAnyChildActive = item.subItems.some((sub: any) => isMenuHrefActive(sub.href))
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
                          const isSubActive = isMenuHrefActive(sub.href)
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

              const isActive = isMenuHrefActive(item.href)
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
              <div className="flex items-center gap-2.5">
                <h2 className="font-semibold text-foreground">
                  {currentTitle}
                </h2>
              </div>
              {/* Tahun Ajaran Global Selector */}
              <TahunAjaranSelector />
              {/* Semester Global Selector — hanya untuk santri */}
              {role === "santri" && <SemesterSelector />}
              {/* Unit / Jenjang Global Selector */}
              <UnitSelector role={role} />
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
    </SemesterProvider>
    </TahunAjaranProvider>
    </UnitProvider>
  )
}
