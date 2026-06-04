# 📈 Rekap Nilai per Mata Pelajaran

**Endpoint:** `GET /api/akademik/analytics/subject-recap`

**Purpose:** Menampilkan breakdown nilai Harian (nilai_harian), UTS (nilai_uts), UAS (nilai_uas), dan Akhir (nilai_akhir_mapel) per mata pelajaran yang diampu oleh pengajar yang sedang login.

**Method:** GET  
**Auth Required:** ✅ Sanctum Token (Pengajar)  
**Latest Updated:** June 4, 2026

---

## Request Examples

### Example 1: Rekap Semua Mapel yang Diajar

```
GET /api/akademik/analytics/subject-recap
Authorization: Bearer {pengajar_token}
```

**Query Parameters:** (none - menampilkan semua mapel yang diajar)

---

### Example 2: Rekap Mapel Tahun Ajaran Spesifik

```
GET /api/akademik/analytics/subject-recap?tahun_ajaran=2024-2025&semester=2
Authorization: Bearer {pengajar_token}
```

**Query Parameters:**

- `tahun_ajaran=2024-2025`
- `semester=2`

---

### Example 3: Rekap Mapel di Kelas Spesifik

```
GET /api/akademik/analytics/subject-recap?tahun_ajaran=2024-2025&semester=2&kode_kelas=9-PA
Authorization: Bearer {pengajar_token}
```

**Query Parameters:**

- `tahun_ajaran=2024-2025`
- `semester=2`
- `kode_kelas=9-PA` (filter untuk kelas tertentu saja)

---

## Response Format

### Success Response (200 OK)

```json
{
  "data": [
    {
      "kode_mapel": "MAT001",
      "nama_mapel": "Matematika",
      "rata_harian": 78.5,
      "rata_uts": 76.2,
      "rata_uas": 80.8,
      "rata_akhir": 78.9,
      "jumlah_santri": 62
    },
    {
      "kode_mapel": "IPA001",
      "nama_mapel": "Ilmu Pengetahuan Alam",
      "rata_harian": 75.3,
      "rata_uts": 73.8,
      "rata_uas": 77.5,
      "rata_akhir": 75.4,
      "jumlah_santri": 62
    },
    {
      "kode_mapel": "IND001",
      "nama_mapel": "Bahasa Indonesia",
      "rata_harian": 80.1,
      "rata_uts": 79.4,
      "rata_uas": 81.2,
      "rata_akhir": 80.2,
      "jumlah_santri": 62
    }
  ],
  "filters": {
    "tahun_ajaran": "2024-2025",
    "semester": 2,
    "kode_kelas": null
  }
}
```

### Field Explanation:

| Field | Type | Description |
|-------|------|-------------|
| `kode_mapel` | string | Kode unik mata pelajaran |
| `nama_mapel` | string | Nama mata pelajaran |
| `rata_harian` | float | Rata-rata nilai Harian/Quiz semua santri |
| `rata_uts` | float | Rata-rata nilai UTS (Ujian Tengah Semester) semua santri |
| `rata_uas` | float | Rata-rata nilai UAS (Ujian Akhir Semester) semua santri |
| `rata_akhir` | float | Rata-rata nilai Akhir (hasil agregasi bobot) semua santri |
| `jumlah_santri` | integer | Total santri yang memiliki nilai di mapel tersebut |

---

## Use Cases

- **Component Analysis**: Lihat mana komponen (Harian/UTS/UAS) yang perlu focus
- **Assessment Balance**: Cek apakah ketiga komponen seimbang atau ada yang tertinggal
- **Performa Mapel**: Bandingkan performa antar mapel yang diajar
- **Curriculum Evaluation**: Data untuk evaluasi kurikulum dan metode mengajar

---

## Filter Explanation

### `tahun_ajaran`
- Optional
- Format: string (e.g., "2024-2025")
- Jika kosong: menampilkan semua tahun ajaran

### `semester`
- Optional
- Value: 1 atau 2
- Jika kosong: menampilkan semua semester

### `kode_kelas`
- Optional
- Filter untuk kelas spesifik
- Jika kosong: menampilkan semua kelas yang mengambil mapel tersebut
- Berguna untuk melihat breakdown per kelas

---

## Error Handling

### 400 Bad Request
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "semester": ["The semester field must be either 1 or 2."]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthenticated."
}
```

---

## Implementation Notes

- **Aggregation Method:** Data dari `DataNilaiSiswa` yang di-JOIN dengan `DataKelasMapel` berdasarkan `id_petugas` yang login
- **Group By:** Hasil dikelompokkan per `kode_mapel`, aggregating semua nilai dari semua kelas yang mengajar mapel tersebut
- **Nilai Components:**
  - `rata_harian`: AVG(nilai_harian)
  - `rata_uts`: AVG(nilai_uts)
  - `rata_uas`: AVG(nilai_uas)
  - `rata_akhir`: AVG(nilai_akhir_mapel) — sudah merupakan nilai final setelah bobot dan normalisasi
- **Kelas Filter:** Saat `kode_kelas` diisi, hanya nilai dari kelas tersebut yang di-aggregate
- **Multi-Class Teaching:** Jika pengajar mengajar mapel yang sama di kelas berbeda:
  - Tanpa filter `kode_kelas`: menampilkan aggregate dari semua kelas (gabungan santri dari semua kelas)
  - Dengan filter `kode_kelas`: hanya santri dari kelas spesifik
- **Empty Result:** Jika tidak ada nilai untuk filter yang diberikan, API return `data: []` dengan status 200
