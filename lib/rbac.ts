/**
 * lib/rbac.ts
 * ──────────────────────────────────────────────────────
 * Konfigurasi RBAC Frontend — pendekatan Whitelist (Default Deny).
 *
 * Setiap rute HARUS terdaftar eksplisit beserta role yang diizinkan.
 * Jika rute tidak terdaftar → akses ditolak secara default.
 *
 * Role yang valid:
 *  - "Petugas Admin"
 *  - "Staf Pengajar"
 *  - "Petugas Tata Usaha"
 *  - "Petugas PPDB"
 *  - "Petugas SPP"
 *  - "santri"   ← nilai dari authData.role, bukan peran_akun
 */

// ─────────────────────────────────────────────────────
// Tipe Data
// ─────────────────────────────────────────────────────
export type PetugasRole =
  | "Petugas Admin"
  | "Staf Pengajar"
  | "Petugas Tata Usaha"
  | "Petugas PPDB"
  | "Petugas SPP"

export type AppRole = PetugasRole | "santri"

export type RouteRule = {
  /** Pola URL yang dicek menggunakan `pathname.startsWith(prefix)` */
  prefix: string
  /** Role yang boleh mengakses rute ini */
  allowedRoles: AppRole[]
}

// ─────────────────────────────────────────────────────
// Whitelist Rute
// PENTING: Urutan PENTING — aturan lebih spesifik harus di atas.
// ─────────────────────────────────────────────────────
export const routeWhitelist: RouteRule[] = [
  // ── Halaman profil (semua role yang sudah login boleh akses)
  {
    prefix: "/dashboard/profile",
    allowedRoles: [
      "Petugas Admin",
      "Staf Pengajar",
      "Petugas Tata Usaha",
      "Petugas PPDB",
      "Petugas SPP",
      "santri",
    ],
  },

  // ── Admin Panel (Data Master & Manajemen Akademik)
  {
    prefix: "/dashboard/admin-panel",
    allowedRoles: ["Petugas Admin", "Staf Pengajar"],
  },
  {
    prefix: "/dashboard/santri",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/akun-santri",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/guru",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/unit",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/kelas",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/kelas-mapel",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/mapel",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/jadwal-pembelajaran",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/tahun-ajaran",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/ekskul-rekap",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/ekskul",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/presensi-santri",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/presensi-guru",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/validasi-presensi",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/presensi-overview",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/analitik",
    allowedRoles: ["Petugas Admin"],
  },
  {
    prefix: "/dashboard/ppdb",
    allowedRoles: ["Petugas Admin", "Petugas PPDB"],
  },
  {
    prefix: "/dashboard/pengumuman",
    allowedRoles: [
      "Petugas Admin",
      "Petugas Tata Usaha",
      "Petugas PPDB",
      "Petugas SPP",
      "Staf Pengajar",
      "santri",
    ],
  },
  {
    prefix: "/dashboard/spp",
    allowedRoles: ["Petugas Admin", "Petugas SPP"],
  },
  {
    prefix: "/dashboard/bebas",
    allowedRoles: ["Petugas Admin", "Petugas SPP"],
  },
  {
    prefix: "/dashboard/pembayaran",
    allowedRoles: ["Petugas Admin", "Petugas SPP"],
  },

  // ── Panel Guru / Staf Pengajar
  {
    prefix: "/dashboard/guru-panel",
    allowedRoles: ["Staf Pengajar"],
  },
  {
    prefix: "/dashboard/analitik-pengajar",
    allowedRoles: ["Staf Pengajar"],
  },

  // ── Panel Santri
  {
    prefix: "/dashboard/santri-panel",
    allowedRoles: ["santri"],
  },
  {
    prefix: "/dashboard/pilih-ekskul",
    allowedRoles: ["santri"],
  },
]

// ─────────────────────────────────────────────────────
// Fungsi Utilitas
// ─────────────────────────────────────────────────────

/**
 * Kembalikan URL halaman utama berdasarkan role user.
 */
export function getRoleHome(roles: string | string[]): string {
  const normalized = Array.isArray(roles) ? roles : [roles]

  if (normalized.includes("santri")) return "/dashboard/santri-panel"
  if (normalized.includes("Petugas Admin")) return "/dashboard/admin-panel"
  if (normalized.includes("Staf Pengajar")) return "/dashboard/guru-panel"
  if (normalized.includes("Petugas Tata Usaha")) return "/dashboard"
  if (normalized.includes("Petugas PPDB")) return "/dashboard/ppdb"
  if (normalized.includes("Petugas SPP")) return "/dashboard/spp"

  return "/dashboard"
}

/**
 * Cek apakah user dengan role tertentu boleh mengakses pathname.
 *
 * Logika:
 * 1. Cari aturan whitelist yang cocok dengan pathname (startsWith).
 * 2. Jika tidak ada aturan yang cocok → Default Deny (return false).
 * 3. Jika cocok → cek apakah salah satu role user ada di allowedRoles.
 */
export function canAccess(
  userRoles: string | string[],
  pathname: string
): boolean {
  const normalized = Array.isArray(userRoles) ? userRoles : [userRoles]

  // Cari rule yang paling spesifik (prefix terpanjang yang cocok)
  const matchedRule = routeWhitelist
    .filter((rule) => pathname.startsWith(rule.prefix))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]

  // Tidak ada rule yang cocok → Default Deny
  if (!matchedRule) return false

  // Cek apakah salah satu role user ada dalam allowedRoles
  return normalized.some((role) =>
    matchedRule.allowedRoles.includes(role as AppRole)
  )
}
