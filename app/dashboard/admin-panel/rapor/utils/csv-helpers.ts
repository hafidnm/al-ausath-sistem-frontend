/**
 * CSV helpers for Rapor Massal import/export.
 *
 * Template format:
 *   nomor_induk,nama_santri,catatan_wali,kebersihan,kerapian,keterampilan,kelakuan,kerajinan,kedisiplinan,ketaatan,ekstrakurikuler
 */

export interface CsvRaporRow {
  nomor_induk: string
  nama_santri: string
  catatan_wali: string
  keseharian_kebersihan: string
  keseharian_kerapian: string
  keseharian_keterampilan: string
  keseharian_kelakuan: string
  keseharian_kerajinan: string
  keseharian_kedisiplinan: string
  keseharian_ketaatan: string
  ekstrakurikuler: string // Format: "Pramuka:A;Futsal:B"
}

export interface CsvRaporParseResult {
  rows: CsvRaporRow[]
  errors: { line: number; message: string }[]
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

export function downloadRaporTemplate(
  santris: CsvRaporRow[],
  meta: { kodeKelas: string; tahunAjaran: string; semester: string },
): void {
  const header = [
    "nomor_induk",
    "nama_santri",
    "catatan_wali",
    "kebersihan",
    "kerapian",
    "keterampilan",
    "kelakuan",
    "kerajinan",
    "kedisiplinan",
    "ketaatan",
    "ekstrakurikuler"
  ]

  const rows = santris.map((s) => [
    s.nomor_induk,
    s.nama_santri,
    s.catatan_wali,
    s.keseharian_kebersihan,
    s.keseharian_kerapian,
    s.keseharian_keterampilan,
    s.keseharian_kelakuan,
    s.keseharian_kerajinan,
    s.keseharian_kedisiplinan,
    s.keseharian_ketaatan,
    s.ekstrakurikuler
  ])

  const csvLines = [header, ...rows].map((row) =>
    row.map((cell) => {
      const str = String(cell ?? "")
      // Quote cells that contain comma, newline, or double quote
      if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }).join(","),
  )

  const csvContent = csvLines.join("\r\n")
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  const safeTahun = meta.tahunAjaran.replace(/\//g, "-")
  anchor.href = url
  anchor.download = `rapor-${meta.kodeKelas}-${safeTahun}-s${meta.semester}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Upload / Parse
// ---------------------------------------------------------------------------

export async function parseRaporCsv(file: File): Promise<CsvRaporParseResult> {
  const text = await file.text()
  // Strip BOM if present
  const content = text.startsWith("\uFEFF") ? text.slice(1) : text

  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "")
  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ line: 0, message: "File CSV kosong atau tidak memiliki data." }],
    }
  }

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  const headerCols = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase())

  // Detect column positions
  const idxNomorInduk = headerCols.indexOf("nomor_induk")
  if (idxNomorInduk === -1) {
    return {
      rows: [],
      errors: [{ line: 1, message: "Header 'nomor_induk' tidak ditemukan di baris pertama." }],
    }
  }

  const idxCatatanWali = headerCols.indexOf("catatan_wali")
  const idxKebersihan = headerCols.indexOf("kebersihan")
  const idxKerapian = headerCols.indexOf("kerapian")
  const idxKeterampilan = headerCols.indexOf("keterampilan")
  const idxKelakuan = headerCols.indexOf("kelakuan")
  const idxKerajinan = headerCols.indexOf("kerajinan")
  const idxKedisiplinan = headerCols.indexOf("kedisiplinan")
  const idxKetaatan = headerCols.indexOf("ketaatan")
  const idxEkstrakurikuler = headerCols.indexOf("ekstrakurikuler")

  const rows: CsvRaporRow[] = []
  const errors: { line: number; message: string }[] = []

  const validNilai = ["A", "B", "C", "D", ""]

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1
    const cols = parseCsvLine(lines[i])
    const nomorInduk = cols[idxNomorInduk]?.trim() ?? ""

    if (!nomorInduk) {
      errors.push({ line: lineNum, message: "nomor_induk kosong, baris dilewati." })
      continue
    }

    const namaSantri = cols[1]?.trim() ?? ""
    const catatanWaliRaw = idxCatatanWali !== -1 ? cols[idxCatatanWali]?.trim() ?? "" : ""
    const kebersihanRaw = idxKebersihan !== -1 ? cols[idxKebersihan]?.trim().toUpperCase() ?? "" : ""
    const kerapianRaw = idxKerapian !== -1 ? cols[idxKerapian]?.trim().toUpperCase() ?? "" : ""
    const keterampilanRaw = idxKeterampilan !== -1 ? cols[idxKeterampilan]?.trim().toUpperCase() ?? "" : ""
    const kelakuanRaw = idxKelakuan !== -1 ? cols[idxKelakuan]?.trim().toUpperCase() ?? "" : ""
    const kerajinanRaw = idxKerajinan !== -1 ? cols[idxKerajinan]?.trim().toUpperCase() ?? "" : ""
    const kedisiplinanRaw = idxKedisiplinan !== -1 ? cols[idxKedisiplinan]?.trim().toUpperCase() ?? "" : ""
    const ketaatanRaw = idxKetaatan !== -1 ? cols[idxKetaatan]?.trim().toUpperCase() ?? "" : ""
    const ekstrakurikulerRaw = idxEkstrakurikuler !== -1 ? cols[idxEkstrakurikuler]?.trim() ?? "" : ""

    const checkNilai = (val: string, name: string) => {
      if (!validNilai.includes(val)) {
        errors.push({ line: lineNum, message: `Nilai ${name} tidak valid (${val}). Harus A, B, C, atau D.` })
      }
    }

    checkNilai(kebersihanRaw, "kebersihan")
    checkNilai(kerapianRaw, "kerapian")
    checkNilai(keterampilanRaw, "keterampilan")
    checkNilai(kelakuanRaw, "kelakuan")
    checkNilai(kerajinanRaw, "kerajinan")
    checkNilai(kedisiplinanRaw, "kedisiplinan")
    checkNilai(ketaatanRaw, "ketaatan")

    rows.push({
      nomor_induk: nomorInduk,
      nama_santri: namaSantri,
      catatan_wali: catatanWaliRaw,
      keseharian_kebersihan: kebersihanRaw,
      keseharian_kerapian: kerapianRaw,
      keseharian_keterampilan: keterampilanRaw,
      keseharian_kelakuan: kelakuanRaw,
      keseharian_kerajinan: kerajinanRaw,
      keseharian_kedisiplinan: kedisiplinanRaw,
      keseharian_ketaatan: ketaatanRaw,
      ekstrakurikuler: ekstrakurikulerRaw,
    })
  }

  return { rows, errors }
}
