# Task Henry - Mapping Endpoint dan View FE

Dokumen ini adalah checklist implementasi FE untuk setiap endpoint backend, lengkap dengan view/halaman target.

## Konvensi Status

- [ ] Belum dikerjakan
- [x] Selesai
- [~] Sedang dikerjakan

## 0. Tugas Utama Henry (Endpoint Bagian Saya)

Guideline utama section ini mengacu ke `docs/client-flow.md`.

### Scope Endpoint Henry

- [~] Bobot nilai
- [~] KKM mapel
- [~] Konversi nilai
- [~] Nilai akhlak
- [~] Nilai mapel
- [~] Raport catatan wali
- [~] Raport generate
- [ ] Raport pdf

### Mapping Endpoint -> View -> Task

#### A. Bobot Nilai

View target:

- [~] `GET /api/akademik/bobot` -> View List Bobot (`/dashboard/admin-panel/bobot`)
- [~] `POST /api/akademik/bobot` -> View Form Bobot (`/dashboard/admin-panel/bobot/new`)
- [~] `PUT /api/akademik/bobot/{id}` -> View Form Edit Bobot (`/dashboard/admin-panel/bobot/:id/edit`)
- [~] `DELETE /api/akademik/bobot/{id}` -> Action delete di View List Bobot
- [~] `POST /api/akademik/bobot/set-default` -> Action set default di View List Bobot

Acceptance flow client:

- [~] Bobot default harus 20% tugas, 30% ulangan, 50% ujian akhir
- [~] Bobot berlaku sama untuk semua mapel

#### B. KKM Mapel

View target:

- [~] `GET /api/akademik/kkm-mapel` -> View List KKM (`/dashboard/admin-panel/kkm`)
- [~] `POST /api/akademik/kkm-mapel` -> View Form KKM (`/dashboard/admin-panel/kkm/new`)
- [~] `PUT /api/akademik/kkm-mapel/{id}` -> View Form Edit KKM (`/dashboard/admin-panel/kkm/:id/edit`)
- [~] `DELETE /api/akademik/kkm-mapel/{id}` -> Action delete di View List KKM

Acceptance flow client:

- [~] KKM dikelola guru mapel
- [~] KKM antar jenjang diset sama (MTQU/MTS/Aliyah tidak dibedakan)

#### C. Konversi Nilai

View target:

- [~] `GET /api/akademik/konversi-nilai` -> View List Konversi (`/dashboard/admin-panel/konversi`)
- [~] `POST /api/akademik/konversi-nilai` -> View Form Konversi (`/dashboard/admin-panel/konversi/new`)
- [~] `PUT /api/akademik/konversi-nilai/{id}` -> View Form Edit Konversi (`/dashboard/admin-panel/konversi/:id/edit`)
- [~] `DELETE /api/akademik/konversi-nilai/{id}` -> Action delete di View List Konversi

Acceptance flow client:

- [ ] Hasil konversi dipakai konsisten saat render nilai rapor

#### D. Nilai Akhlak

View target:

- [~] `GET /api/akademik/nilai-akhlak` -> View List Nilai Akhlak (`/dashboard/admin-panel/nilai-akhlak`)
- [~] `POST /api/akademik/nilai-akhlak` -> View Form Input Nilai Akhlak (`/dashboard/admin-panel/nilai-akhlak/new`)

Acceptance flow client:

- [ ] Nilai akhlak cukup input angka (tanpa komponen turunan yang kompleks)

#### E. Nilai Mapel

View target:

- [~] `GET /api/akademik/nilai-mapel` -> View List Nilai Mapel (`/dashboard/admin-panel/nilai-mapel`)
- [~] `POST /api/akademik/nilai-mapel` -> View Form Input Nilai Mapel (`/dashboard/admin-panel/nilai-mapel/new`)
- [~] `GET /api/akademik/nilai-mapel/{kode_mapel}` -> View Detail Nilai Mapel (`/dashboard/admin-panel/nilai-mapel/:kode_mapel`)

Acceptance flow client:

- [ ] Form mendukung minimal 3 tugas dan minimal 3 ulangan
- [ ] Tugas mendukung kategori: PR, tugas pengganti saat pengajar tidak hadir, modul kompetensi
- [ ] Ulangan harus valid dari soal yang disusun pengajar dan diawasi pengajar
- [ ] Nilai rapor maksimal 98 (nilai 100 ditulis 98)
- [ ] Nilai rapor di bawah 50 ditampilkan menjadi 50 dengan indikator warna merah
- [ ] Nilai rapor 50 asli ditampilkan 50 tanpa indikator merah
- [ ] Pembulatan nilai mapel: desimal 1-4 turun, 5-9 naik

#### F. Raport Catatan Wali

View target:

- [~] `GET /api/akademik/raport/catatan-wali` -> Panel Catatan Wali di View Operasional Rapor (`/petugas/akademik/rapor`)
- [~] `POST /api/akademik/raport/catatan-wali` -> Action simpan catatan di panel Catatan Wali pada halaman yang sama

Acceptance flow client:

- [~] Pencarian santri berdasarkan nama/nomor induk tersedia di halaman operasional rapor
- [~] Dari hasil pencarian, petugas bisa preview PDF rapor
- [~] Input catatan wali hanya aktif jika data rapor sudah di-generate (sudah ada record rapor)
- [~] Jika rapor belum ada, form catatan wali disabled dan tampilkan info "generate rapor dulu"
- [ ] Catatan berisi pengembangan diri, akhlak/adab, akademis, dan pesan wali kelas
- [ ] Nomor induk wajib terisi saat submit

#### G. Raport Generate

View target:

- [~] `POST /api/akademik/raport/generate` -> Action generate di View Operasional Rapor (`/petugas/akademik/rapor`)

Acceptance flow client:

- [~] Generate menjadi prasyarat sebelum input catatan wali
- [ ] Generate menghitung nilai berdasarkan bobot 20/30/50
- [ ] Rata-rata rapor desimal dibulatkan 2 angka di belakang koma
- [ ] Urutan peringkat mengikuti rata-rata rapor (sesuai rumus kebijakan client)
- [ ] Tampilkan hanya peringkat 10 besar untuk kelas besar dan 5 besar untuk kelas kecil

#### H. Raport PDF

View target:

- [ ] `GET /api/akademik/raport/pdf` -> Action download PDF di View Operasional Rapor (`/petugas/akademik/rapor`)

Acceptance flow client:

- [ ] Tombol download memicu file response (blob) dan menyimpan PDF rapor

## 1. Auth

### View

- [ ] View Login (`/login`)
- [ ] View Register (`/register`, opsional)

### Task Endpoint

- [ ] `POST /api/login` -> implement submit login form (role, username, password) di View Login
- [ ] `POST /api/register` -> implement submit register form di View Register (opsional)
- [ ] `POST /api/logout` -> implement action logout pada header/sidebar
- [ ] `GET /api/me` -> implement hydration user profile + role store setelah login/refresh

## 2. Santri Self Service

### View

- [ ] View Dashboard Santri (`/santri/dashboard`)
- [ ] View Rapor Saya (`/santri/rapor`)
- [ ] Action Download PDF Rapor Saya (`/santri/rapor`)

### Task Endpoint

- [ ] `GET /api/akademik/raport/self` -> tampilkan data rapor santri login pada View Rapor Saya
- [ ] `GET /api/akademik/raport/self/pdf` -> implement download file PDF rapor santri

## 3. Akademik - Bobot Nilai

### View

- [x] View List Bobot (`/dashboard/admin-panel/bobot`)
- [x] View Form Tambah/Edit Bobot (`/dashboard/admin-panel/bobot/new`, `/dashboard/admin-panel/bobot/:id/edit`)

### Task Endpoint

- [~] `GET /api/akademik/bobot` -> tampilkan tabel bobot + pagination
- [~] `POST /api/akademik/bobot` -> implement create bobot
- [~] `PUT /api/akademik/bobot/{id}` -> implement update bobot
- [~] `DELETE /api/akademik/bobot/{id}` -> implement delete bobot
- [~] `POST /api/akademik/bobot/set-default` -> implement tombol set default 20/30/50

## 4. Akademik - KKM Mapel

### View

- [x] View List KKM (`/dashboard/admin-panel/kkm`)
- [x] View Form Tambah/Edit KKM (`/dashboard/admin-panel/kkm/new`, `/dashboard/admin-panel/kkm/:id/edit`)

### Task Endpoint

- [~] `GET /api/akademik/kkm-mapel` -> list KKM + filter `kode_mapel`, `tahun_ajaran`, `semester`, `kode_unit`, `per_page`
- [~] `POST /api/akademik/kkm-mapel` -> create KKM + handling error 422 duplicate
- [~] `PUT /api/akademik/kkm-mapel/{id}` -> update KKM + handling 403/422
- [~] `DELETE /api/akademik/kkm-mapel/{id}` -> delete KKM + handling 403

## 5. Akademik - Konversi Nilai

### View

- [x] View List Konversi (`/dashboard/admin-panel/konversi`)
- [x] View Form Tambah/Edit Konversi (`/dashboard/admin-panel/konversi/new`, `/dashboard/admin-panel/konversi/:id/edit`)

### Task Endpoint

- [~] `GET /api/akademik/konversi-nilai` -> list konversi + pagination
- [~] `POST /api/akademik/konversi-nilai` -> create konversi nilai
- [~] `PUT /api/akademik/konversi-nilai/{id}` -> update konversi nilai
- [~] `DELETE /api/akademik/konversi-nilai/{id}` -> delete konversi nilai

## 6. Akademik - Nilai Mapel

### View

- [x] View List Nilai Mapel (`/dashboard/admin-panel/nilai-mapel`)
- [x] View Form Input Nilai Mapel (`/dashboard/admin-panel/nilai-mapel/new`)
- [x] View Detail Nilai Mapel (`/dashboard/admin-panel/nilai-mapel/:kode_mapel`)

### Task Endpoint

- [~] `GET /api/akademik/nilai-mapel` -> list nilai mapel dengan query `nomor_induk` (wajib) + filter opsional
- [~] `POST /api/akademik/nilai-mapel` -> upsert nilai mapel (dynamic rows tugas/ulangan, minimal 3 item)
- [~] `GET /api/akademik/nilai-mapel/{kode_mapel}` -> detail nilai mapel per mapel

## 7. Akademik - Nilai Akhlak

### View

- [x] View List Nilai Akhlak (`/dashboard/admin-panel/nilai-akhlak`)
- [x] View Form Upsert Nilai Akhlak (`/dashboard/admin-panel/nilai-akhlak/new`)

### Task Endpoint

- [~] `GET /api/akademik/nilai-akhlak/bar` -> list semua nilai akhlak tanpa `nomor_induk`
- [~] `POST /api/akademik/nilai-akhlak` -> upsert nilai akhlak

## 8. Akademik - Keseharian

### View

- [ ] View Form Keseharian (`/petugas/akademik/rapor/keseharian`)

### Task Endpoint

- [ ] `GET /api/akademik/raport/keseharian` -> fetch data keseharian
- [ ] `POST /api/akademik/raport/keseharian` -> submit/update data keseharian

## 9. Akademik - Rapor Operasional Petugas

### View

- [ ] View List Rapor (`/petugas/akademik/rapor`)
- [ ] View Detail Rapor (`/petugas/akademik/rapor/detail`)
- [ ] Action Generate Rapor (`/petugas/akademik/rapor`)
- [~] Panel Isi/Edit Catatan Wali dalam halaman operasional rapor (`/petugas/akademik/rapor`)
- [ ] Action Ranking Kelas (`/petugas/akademik/rapor`)
- [ ] Action Publish Rapor (`/petugas/akademik/rapor`)
- [~] Action Preview PDF Rapor dari hasil pencarian santri (`/petugas/akademik/rapor`)
- [ ] Action Download PDF Rapor (`/petugas/akademik/rapor`)

### Task Endpoint

- [ ] `GET /api/akademik/raport` -> list rapor + filter + server-side pagination
- [ ] `GET /api/akademik/raport/show` -> detail rapor
- [~] `POST /api/akademik/raport/generate` -> generate rapor per santri
- [~] `GET /api/akademik/raport/catatan-wali` -> fetch catatan wali di panel halaman operasional rapor
- [~] `POST /api/akademik/raport/catatan-wali` -> submit/update catatan wali (hanya jika rapor sudah di-generate)
- [ ] `POST /api/akademik/raport/rank` -> hitung ranking per kelas
- [ ] `POST /api/akademik/raport/publish` -> publish rapor (kelas/santri)
- [ ] `GET /api/akademik/raport/pdf` -> download PDF rapor

### Checklist Implementasi UI (Halaman Gabungan Rapor)

- [ ] Search santri by `nama`/`nomor_induk` di halaman `/petugas/akademik/rapor`
- [ ] Saat santri dipilih, fetch status rapor aktif (`nomor_induk`, `tahun_ajaran`, `semester`)
- [ ] Tombol preview PDF aktif hanya jika data rapor sudah ada
- [ ] Tombol generate rapor tersedia untuk membuat data awal rapor
- [ ] Setelah generate sukses, refresh state agar panel catatan wali langsung aktif
- [ ] Panel catatan wali memuat data awal dari `GET /api/akademik/raport/catatan-wali`
- [ ] Form catatan wali disable jika rapor belum ada, tampilkan helper text yang jelas
- [ ] Submit catatan wali kirim payload minimal wajib (`nomor_induk`, `kode_kelas`, `tahun_ajaran`, `semester`, `catatan_wali`)
- [ ] Tangani response error validasi (422) per field dan tampilkan pesan global jika gagal
- [ ] Preview/download PDF menggunakan response blob dari `GET /api/akademik/raport/pdf`

## 10. Administrasi - PPDB

### View

- [ ] View List Pendaftar (`/petugas/administrasi/ppdb`)
- [ ] View Form Pendaftar (`/petugas/administrasi/ppdb/new`, `/petugas/administrasi/ppdb/:id/edit`)
- [ ] View Detail Pendaftar + Tab Berkas/Tes/Verifikasi/Notifikasi (`/petugas/administrasi/ppdb/:id`)

### Task Endpoint

- [ ] `GET /api/administrasi/ppdb/pendaftar` -> list pendaftar + filter
- [ ] `POST /api/administrasi/ppdb/pendaftar` -> create pendaftar
- [ ] `PUT /api/administrasi/ppdb/pendaftar/{id}` -> update pendaftar
- [ ] `DELETE /api/administrasi/ppdb/pendaftar/{id}` -> delete pendaftar
- [ ] `POST /api/administrasi/ppdb/pendaftar/{id}/berkas` -> upload/update berkas
- [ ] `PUT /api/administrasi/ppdb/pendaftar/{id}/tes` -> update hasil tes
- [ ] `PUT /api/administrasi/ppdb/pendaftar/{id}/verifikasi` -> update status verifikasi
- [ ] `POST /api/administrasi/ppdb/pendaftar/{id}/notifikasi` -> kirim notifikasi

## 11. Administrasi - Master Santri

### View

- [ ] View List Santri (`/petugas/administrasi/santri`)
- [ ] View Form Santri (`/petugas/administrasi/santri/new`, `/petugas/administrasi/santri/:id/edit`)
- [ ] View Detail Santri (`/petugas/administrasi/santri/:id`)
- [ ] Action Import/Export Santri (`/petugas/administrasi/santri`)
- [ ] Action Pindah Kelas Massal (`/petugas/administrasi/santri`)
- [ ] Action Buat Akun dari Santri (`/petugas/administrasi/santri/:id`)

### Task Endpoint

- [ ] `GET /api/administrasi/santri` -> list santri + filter + pagination
- [ ] `POST /api/administrasi/santri` -> create santri
- [ ] `PUT /api/administrasi/santri/{id}` -> update santri
- [ ] `DELETE /api/administrasi/santri/{id}` -> delete santri
- [ ] `POST /api/administrasi/santri/import` -> import file santri
- [ ] `GET /api/administrasi/santri/export` -> export data santri
- [ ] `GET /api/administrasi/santri/import-template` -> download template import
- [ ] `POST /api/administrasi/santri/pindah-kelas` -> proses pindah kelas massal
- [ ] `POST /api/administrasi/santri/{id}/buat-akun` -> generate akun santri dari data santri

## 12. Administrasi - Akun Santri

### View

- [ ] View List Akun Santri (`/petugas/administrasi/akun-santri`)
- [ ] View Form Akun Santri (`/petugas/administrasi/akun-santri/new`, `/petugas/administrasi/akun-santri/:id/edit`)
- [ ] Action Sinkron Akun Massal (`/petugas/administrasi/akun-santri`)
- [ ] View Kelas Tanpa Akun (`/petugas/administrasi/akun-santri/kelas-tanpa-akun`)
- [ ] View Santri Tanpa Akun per Kelas (`/petugas/administrasi/akun-santri/santri-tanpa-akun`)

### Task Endpoint

- [ ] `GET /api/administrasi/akun-santri` -> list akun santri + pagination
- [ ] `POST /api/administrasi/akun-santri` -> create akun santri
- [ ] `PUT /api/administrasi/akun-santri/{id}` -> update akun santri
- [ ] `DELETE /api/administrasi/akun-santri/{id}` -> delete akun santri
- [ ] `POST /api/administrasi/akun-santri/sinkron` -> sinkron massal akun santri
- [ ] `GET /api/administrasi/akun-santri/kelas-tanpa-akun` -> tampilkan kelas tanpa akun
- [ ] `GET /api/administrasi/akun-santri/santri-tanpa-akun?kode_kelas=...` -> tampilkan santri tanpa akun per kelas
- [ ] `GET /api/administrasi/akun-santri/export` -> export data akun santri

## 13. Administrasi - Petugas

### View

- [ ] View List Petugas (`/petugas/administrasi/petugas`)
- [ ] View Form Petugas (`/petugas/administrasi/petugas/new`, `/petugas/administrasi/petugas/:id/edit`)
- [ ] Action Import/Export Petugas (`/petugas/administrasi/petugas`)

### Task Endpoint

- [ ] `GET /api/administrasi/petugas/peran-akun-options` -> ambil opsi peran akun untuk form
- [ ] `GET /api/administrasi/petugas` -> list petugas + pagination
- [ ] `POST /api/administrasi/petugas` -> create petugas
- [ ] `PUT /api/administrasi/petugas/{id}` -> update petugas
- [ ] `DELETE /api/administrasi/petugas/{id}` -> delete petugas
- [ ] `POST /api/administrasi/petugas/import` -> import petugas
- [ ] `GET /api/administrasi/petugas/export` -> export petugas
- [ ] `GET /api/administrasi/petugas/import-template` -> download template import petugas

## 14. Administrasi - SPP

### View

- [ ] View SPP Setting List/Form (`/petugas/administrasi/spp/setting`)
- [ ] View Pembayaran SPP List/Form (`/petugas/administrasi/spp/pembayaran`)

### Task Endpoint

- [ ] `GET /api/administrasi/spp/setting` -> list setting SPP
- [ ] `POST /api/administrasi/spp/setting` -> create setting SPP
- [ ] `PUT /api/administrasi/spp/setting/{id}` -> update setting SPP
- [ ] `DELETE /api/administrasi/spp/setting/{id}` -> delete setting SPP
- [ ] `GET /api/administrasi/spp/pembayaran` -> list pembayaran + filter (`id_santri`, `status`, `tanggal_mulai`, `tanggal_selesai`, `per_page`)
- [ ] `POST /api/administrasi/spp/pembayaran` -> create pembayaran SPP
- [ ] `PUT /api/administrasi/spp/pembayaran/{id}` -> update pembayaran SPP
- [ ] `DELETE /api/administrasi/spp/pembayaran/{id}` -> delete pembayaran SPP

## 15. Route Guard dan Role-Based View

### View / Infrastruktur

- [ ] Guest-only guard untuk `/login`
- [ ] Auth guard role `petugas` untuk semua `/petugas/*`
- [ ] Auth guard role `santri` untuk semua `/santri/*`
- [ ] Role-based menu renderer berdasarkan `peran_akun`
- [ ] Global error handler untuk tampilkan pesan backend (403/422/500)

## 16. Task Komponen Wajib (Reusable)

### List Page Standard

- [ ] Komponen search `q`
- [ ] Komponen filter select sesuai modul
- [ ] Komponen table + server pagination
- [ ] Komponen action column (detail/edit/delete)
- [ ] Komponen empty state
- [ ] Komponen loading state
- [ ] Komponen error state

### Form Standard

- [ ] Inline FE validation
- [ ] Mapping error 422 per-field
- [ ] Disable submit saat loading
- [ ] Toast sukses/gagal

## 17. Prioritas Eksekusi

- [ ] Sprint 1: Auth + role guard + layout dasar
- [ ] Sprint 2: Rapor self service santri
- [ ] Sprint 3: Akademik petugas (nilai mapel, akhlak, keseharian, catatan wali)
- [ ] Sprint 4: Workflow rapor petugas (generate, rank, publish, pdf)
- [ ] Sprint 5: Master data administrasi (santri, akun, petugas, PPDB, SPP)
