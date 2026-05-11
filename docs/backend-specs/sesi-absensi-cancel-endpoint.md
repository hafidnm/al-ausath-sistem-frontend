# Spesifikasi Backend: Endpoint Cancel Sesi Absensi

## Alur Frontend → Backend yang Diharapkan

```
User klik "Input Presensi" 
  ↓
FE buka popup input presensi
  ├─ Jika user tekan "Lanjutkan" → FE panggil POST /mulai (create/draft session)
  ├─ Jika user tekan "Lanjutkan" → lanjut ke step berikutnya
  ├─ Jika user tekan "Kembali/Cancel" → FE panggil POST /cancel (batalkan sesi)
  └─ Jika user tekan "Kirim" (final) → FE panggil POST /selesai (finalize sesi)
```

Requirement:
- Sesi **tidak boleh mengunci jadwal** sampai user **benar-benar tekan Kirim (final)**
- Jika user **cancel di tengah jalan**, sesi harus benar-benar hilang/dibatalkan sehingga jadwal bisa digunakan lagi

---

## Endpoint Baru: Cancel Sesi Absensi

### Request

```http
POST /api/akademik/sesi-absensi/{id}/cancel
Content-Type: application/json
X-XSRF-TOKEN: [token]
Authorization: Bearer [token]

{
  "keterangan": "Pengguna membatalkan di step input"
}
```

**Parameter:**
- `id` (path) - ID sesi absensi yang ingin dibatalkan
- `keterangan` (body, optional) - Alasan pembatalan, max 500 karakter

---

### Response Success (200 OK)

Sesi berhasil dibatalkan dan jadwal kembali bebas digunakan.

```json
{
  "message": "Sesi absensi berhasil dibatalkan. Jadwal dapat digunakan kembali.",
  "data": {
    "id_sesi": 123,
    "id_jadwal": 456,
    "tanggal": "2026-05-07",
    "status_sesi": "BATAL",
    "message_detail": "Sesi draft berhasil dibatalkan"
  }
}
```

---

### Response Error (422 Unprocessable Entity)

Sesi tidak boleh dibatalkan karena statusnya sudah final atau ada data absensi.

```json
{
  "message": "Sesi absensi tidak dapat dibatalkan karena statusnya sudah BERLANGSUNG/SELESAI atau sudah ada data absensi.",
  "data": {
    "id_sesi": 123,
    "status_sesi": "BERLANGSUNG",
    "absensi_santri_count": 25,
    "reason": "Sesi sudah memiliki data absensi santri"
  }
}
```

---

### Response Error (404 Not Found)

Sesi absensi tidak ditemukan.

```json
{
  "message": "Sesi absensi tidak ditemukan."
}
```

---

### Response Error (403 Forbidden)

Hanya pengajar pada sesi ini yang dapat membatalkan.

```json
{
  "message": "Hanya pengajar pada sesi ini yang dapat membatalkan sesi."
}
```

---

## Business Rules untuk Cancel Sesi

### Siapa yang bisa cancel:
- **Hanya pengajar utama** (`id_petugas_hadir`) dari sesi tersebut

### Kapan boleh dibatalkan:
✅ Status `MENUNGGU_PENGGANTI` + belum ada absensi santri  
✅ Status `BERLANGSUNG` + belum ada absensi santri  

### Kapan TIDAK boleh dibatalkan:
❌ Status `SELESAI`  
❌ Status `BATAL` (sudah dibatalkan sebelumnya)  
❌ Ada absensi santri yang sudah tercatat (`absensi_santri_count > 0`)  
❌ Ada absensi pengajar yang sudah final  

---

## Aksi saat Cancel Berhasil

1. **Hapus draft absensi pengajar** terkait sesi ini
   ```sql
   DELETE FROM absensi_pengajar WHERE id_sesi = {id}
   ```

2. **Hapus absensi santri** jika ada (biasanya kosong, tapi untuk safety)
   ```sql
   DELETE FROM absensi_santri WHERE id_sesi = {id}
   ```

3. **Ubah status sesi menjadi BATAL** (jangan hapus row, keep audit trail)
   ```sql
   UPDATE sesi_absensi 
   SET status_sesi = 'BATAL', 
       keterangan = CONCAT(keterangan, ' [DIBATALKAN]') 
   WHERE id_sesi = {id}
   ```

4. **Pastikan jadwal jadwal tidak terkunci lagi** (index/cache update jika ada)

---

## Contoh Implementasi Laravel

```php
public function cancel(Request $request, int $id): JsonResponse
{
    $petugas = $this->resolveCurrentPetugas($request);

    $validated = $request->validate([
        'keterangan' => ['nullable', 'string', 'max:500'],
    ]);

    $sesi = SesiAbsensi::with(['absensiSantri', 'absensiPengajar'])
        ->findOrFail($id);

    // Cek izin: hanya pengajar pada sesi ini
    if ((int) $sesi->id_petugas_hadir !== (int) $petugas->id_petugas) {
        return response()->json([
            'message' => 'Hanya pengajar pada sesi ini yang dapat membatalkan sesi.',
        ], 403);
    }

    // Cek status: tidak boleh SELESAI atau BATAL
    if (in_array($sesi->status_sesi, ['SELESAI', 'BATAL'], true)) {
        return response()->json([
            'message' => 'Sesi absensi tidak dapat dibatalkan karena statusnya sudah ' . $sesi->status_sesi . '.',
            'data' => [
                'id_sesi' => $sesi->id_sesi,
                'status_sesi' => $sesi->status_sesi,
            ],
        ], 422);
    }

    // Cek data absensi santri: jika ada, tidak boleh cancel
    if ($sesi->absensiSantri->count() > 0) {
        return response()->json([
            'message' => 'Sesi absensi tidak dapat dibatalkan karena sudah ada data absensi santri.',
            'data' => [
                'id_sesi' => $sesi->id_sesi,
                'absensi_santri_count' => $sesi->absensiSantri->count(),
            ],
        ], 422);
    }

    // Cancel berhasil: ubah status jadi BATAL dan hapus draft absensi pengajar
    DB::transaction(function () use ($sesi, $validated) {
        // Hapus draft absensi pengajar
        AbsensiPengajar::where('id_sesi', $sesi->id_sesi)->delete();

        // Ubah status sesi jadi BATAL
        $sesi->status_sesi = 'BATAL';
        $sesi->keterangan = $validated['keterangan'] 
            ?? ($sesi->keterangan . ' [DIBATALKAN]');
        $sesi->save();
    });

    return response()->json([
        'message' => 'Sesi absensi berhasil dibatalkan. Jadwal dapat digunakan kembali.',
        'data' => [
            'id_sesi' => $sesi->id_sesi,
            'id_jadwal' => $sesi->id_jadwal,
            'tanggal' => $sesi->tanggal,
            'status_sesi' => $sesi->status_sesi,
            'message_detail' => 'Sesi draft berhasil dibatalkan',
        ],
    ], 200);
}
```

---

## Frontend Implementation Notes

Frontend sudah siap untuk memanggil endpoint ini:

1. **Saat user buka popup**: Sesi belum dibuat
2. **Saat user tekan "Lanjutkan"**: FE panggil `POST /mulai` → sesi mulai dibuat
3. **Saat user tekan "Cancel" sebelum "Kirim"**: FE panggil `POST /cancel/{id}` → sesi dibatalkan
4. **Saat user tekan "Kirim"**: FE panggil `POST /selesai/{id}` → sesi menjadi final

Hasil akhir: **Jadwal tidak pernah terkunci sampai user benar-benar selesai input dan tekan Kirim**.
