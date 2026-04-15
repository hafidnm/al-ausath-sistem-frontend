# Template PDF Rapor Referensi

Dokumen ini mendefinisikan struktur PDF rapor yang mengikuti foto client: satu halaman, hitam-putih, dengan tabel nilai sederhana seperti laporan perkembangan anak didik.

## Struktur halaman

- Judul utama: `Laporan Perkembangan Anak Didik`
- Blok identitas kiri:
  - Nama Anak Didik
  - Nomor Induk
  - Nama Sekolah
- Blok identitas kanan:
  - Tingkat
  - Semester
  - Tahun Pelajaran
- Tabel nilai:
  - No
  - Mata Pelajaran
  - Nilai Angka
  - Nilai Huruf
  - Keterangan
- Ringkasan bawah tabel:
  - Jumlah Nilai
  - Nilai Rata-Rata
  - Peringkat Kelas Ke ... dari ... Siswa
- Tanda tangan:
  - Orang Tua / Wali
  - Wali Kelas

## Catatan implementasi

- Layout ini sebaiknya dipakai sebagai source of truth untuk generator PDF backend.
- Endpoint frontend yang ada sekarang hanya memanggil `/api/akademik/raport/pdf` sebagai blob, jadi template asli PDF tidak dibentuk di repo frontend ini.
- Komponen referensi yang mengikuti layout foto ada di `components/rapor/rapor-pdf-template.tsx`.

## Mapping field

- `namaAnakDidik` -> nama santri
- `nomorInduk` -> nomor induk santri
- `namaSekolah` -> nama lembaga
- `tingkat` -> kelas/jenjang
- `semester` -> semester aktif
- `tahunPelajaran` -> tahun ajaran
- `subjects[]` -> daftar mapel dan nilai
- `jumlahNilai` -> total nilai
- `nilaiRataRata` -> rata-rata
- `peringkat` -> ranking kelas
- `totalSiswa` -> jumlah siswa di kelas
- `namaOrangTuaWali` -> tanda tangan orang tua/wali
- `namaWaliKelas` -> tanda tangan wali kelas
