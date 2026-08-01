# 🎨 Frontend Web App - Sistem Informasi Akademik & Administrasi (SIAKAD e-Rapor)
### **Pondok Pesantren Al-Ausath Karanganyar**

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)

Aplikasi Web Frontend modern berbasis Next.js 16 (App Router) untuk antarmuka Sistem Informasi Akademik, Presensi, e-Rapor Digital, Keuangan/SPP, dan PPDB Online Pondok Pesantren Al-Ausath Karanganyar.

---

## 🚀 Modul & Halaman Frontend

### 1. 🌐 Landing Page & PPDB Portal (`/` & `/ppdb`)
- Halaman Publik Profil Pesantren Al-Ausath Karanganyar.
- Informasi Gelombang, Kuota, & Form Pendaftaran PPDB Online.
- Pengumuman Publik & Lokasi Pesantren.

### 2. 🔐 Multi-Role Login Portal (`/login`)
- Portal Login Tunggal Berbasis Peran (Admin, Guru/Ustadz, Santri/Wali Santri).
- Desain Khas Pesantren Al-Ausath.

### 3. 👑 Admin Dashboard (`/dashboard/admin-panel`)
- Manajemen Data Master (Santri, Petugas, Kelas, Unit, Mapel, Jadwal, Tahun Ajaran).
- Validasi Presensi Guru & Santri.
- Pengaturan SPP, Tagihan Bebas, & Rekening Bank.
- Manajemen KKM, Nilai Akhlak, & Pengumuman Web.

### 4. 👨‍🏫 Guru / Staf Pengajar Dashboard (`/dashboard/guru-panel`)
- Input Nilai Mata Pelajaran (UTS, UAS, Tugas) & Nilai Akhlak.
- Pengisian Catatan Wali Kelas & Sesi Presensi Pembelajaran.
- Grafik Analitik Pengajar.

### 5. 🎓 Santri & Wali Santri Portal (`/dashboard/santri-panel`)
- Rekap Presensi Realtime & Grafik Kehadiran.
- **e-Rapor Digital**: Lihat, Cetak, dan Unduh PDF/Excel Rapor Santri.
- Fitur Filter Dynamic Header (**Tahun Ajaran & Semester Ganjil/Genap**).
- Pendaftaran Ekskul & Informasi Administrasi/Tagihan.

---

## 🛠️ Teknologi & Stack Frontend

- **Framework**: Next.js 16 (App Router, React 19)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS v4, Lucide Icons
- **UI Components**: Radix UI / Shadcn UI, Embla Carousel
- **State & Data Fetching**: TanStack React Query v5, Axios
- **Visualisasi Data**: Recharts

---

## 💻 Panduan Instalasi & Pengoperasian

```bash
# Clone repositori frontend
git clone https://github.com/hafidnm/al-ausath-sistem-frontend.git
cd al-ausath-frontend

# Install dependensi
pnpm install

# Buat file lingkungan (.env.local)
cp .env.example .env.local

# Sesuaikan URL Backend API di .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Jalankan server pengembangan
pnpm dev
```

Aplikasi frontend akan berjalan di `http://localhost:3000`.

---

## 📁 Struktur Direktori

```text
al-ausath-frontend/
├── app/
│   ├── dashboard/               # Halaman Dashboard (Admin, Guru, Santri)
│   │   ├── admin-panel/         # Panel Administrator
│   │   ├── guru-panel/          # Panel Guru / Ustadz
│   │   ├── santri-panel/        # Portal Santri & Wali Santri
│   │   └── layout.tsx           # Layout Dashboard, Sidebar, Topbar, & Dynamic Titles
│   ├── login/                   # Halaman Login Multi-Role
│   ├── ppdb/                    # Halaman Pendaftaran Santri Baru
│   ├── layout.tsx               # Root Layout & Metadata Title Template
│   └── page.tsx                 # Landing Page Utama Pesantren
├── components/                  # Komponen UI Reusable (Shadcn UI)
├── contexts/                    # React Contexts (Tahun Ajaran, Semester, Unit)
├── hooks/                       # Custom React Hooks
├── lib/
│   ├── axios.ts                 # Axios Client & Interceptor Auth
│   ├── rbac.ts                  # Role-Based Access Control Rules
│   └── services/                # API Services (Auth, Santri, Nilai, Presensi, dll)
└── public/                      # Assets Logo, Favicon, & Gambar
```

---

## 🔒 Lisensi

Hak Cipta &copy; 2026 **Pondok Pesantren Al-Ausath Karanganyar**. All rights reserved.
