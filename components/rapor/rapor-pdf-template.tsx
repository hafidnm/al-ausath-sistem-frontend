type RaporSubjectRow = {
  no: number
  mataPelajaran: string
  angka?: string | number | null
  huruf?: string | null
  keterangan?: string | null
}

type RaporPdfTemplateProps = {
  namaAnakDidik: string
  nomorInduk: string
  namaSekolah: string
  tingkat: string
  semester: string
  tahunPelajaran: string
  subjects: RaporSubjectRow[]
  jumlahNilai?: string | number | null
  nilaiRataRata?: string | number | null
  peringkat?: string | number | null
  totalSiswa?: string | number | null
  tempatTerbit?: string
  tanggalTerbit?: string
  namaOrangTuaWali?: string
  namaWaliKelas?: string
}

const displayValue = (value: string | number | null | undefined) => {
  if (value == null) return ""
  const text = String(value).trim()
  return text
}

export function RaporPdfTemplate({
  namaAnakDidik,
  nomorInduk,
  namaSekolah,
  tingkat,
  semester,
  tahunPelajaran,
  subjects,
  jumlahNilai,
  nilaiRataRata,
  peringkat,
  totalSiswa,
  tempatTerbit = "Karanganyar",
  tanggalTerbit = "6 Oktober 2024",
  namaOrangTuaWali = "",
  namaWaliKelas = "",
}: RaporPdfTemplateProps) {
  return (
    <div className="w-full bg-white text-black">
      <div className="mx-auto w-full max-w-[210mm] bg-white px-6 py-5 text-[12px] leading-tight">
        <div className="border-2 border-black px-4 py-3">
          <div className="mb-4 text-center text-[17px] font-bold uppercase tracking-wide">
            Laporan Perkembangan Anak Didik
          </div>

          <div className="grid grid-cols-[1fr_0.9fr] gap-6 text-[12px] font-medium">
            <div className="space-y-1.5">
              <div className="grid grid-cols-[120px_12px_1fr] items-start gap-1">
                <div>Nama Anak Didik</div>
                <div>:</div>
                <div>{namaAnakDidik}</div>
              </div>
              <div className="grid grid-cols-[120px_12px_1fr] items-start gap-1">
                <div>Nomor Induk</div>
                <div>:</div>
                <div>{nomorInduk}</div>
              </div>
              <div className="grid grid-cols-[120px_12px_1fr] items-start gap-1">
                <div>Nama Sekolah</div>
                <div>:</div>
                <div>{namaSekolah}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="grid grid-cols-[120px_12px_1fr] items-start gap-1">
                <div>Tingkat</div>
                <div>:</div>
                <div>{tingkat}</div>
              </div>
              <div className="grid grid-cols-[120px_12px_1fr] items-start gap-1">
                <div>Semester</div>
                <div>:</div>
                <div>{semester}</div>
              </div>
              <div className="grid grid-cols-[120px_12px_1fr] items-start gap-1">
                <div>Tahun Pelajaran</div>
                <div>:</div>
                <div>{tahunPelajaran}</div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <table className="w-full border-collapse border border-black text-[11px]">
              <thead>
                <tr>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold">
                    No
                  </th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold">
                    Mata Pelajaran
                  </th>
                  <th colSpan={2} className="border border-black px-2 py-2 text-center font-bold">
                    Nilai
                  </th>
                  <th rowSpan={2} className="border border-black px-2 py-2 text-center align-middle font-bold">
                    Keterangan
                  </th>
                </tr>
                <tr>
                  <th className="border border-black px-2 py-2 text-center font-bold">Angka</th>
                  <th className="border border-black px-2 py-2 text-center font-bold">Huruf</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={`${subject.no}-${subject.mataPelajaran}`}>
                    <td className="border border-black px-2 py-1 text-center">{subject.no}</td>
                    <td className="border border-black px-2 py-1">{subject.mataPelajaran}</td>
                    <td className="border border-black px-2 py-1 text-center">{displayValue(subject.angka)}</td>
                    <td className="border border-black px-2 py-1 text-center">{displayValue(subject.huruf)}</td>
                    <td className="border border-black px-2 py-1 text-center italic">{displayValue(subject.keterangan)}</td>
                  </tr>
                ))}

                <tr>
                  <td className="border border-black px-2 py-1 text-center" colSpan={2}>
                    Jumlah Nilai
                  </td>
                  <td className="border border-black px-2 py-1 text-center">{displayValue(jumlahNilai)}</td>
                  <td className="border border-black px-2 py-1 text-center" />
                  <td className="border border-black px-2 py-1" />
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 text-center" colSpan={2}>
                    Nilai Rata-Rata
                  </td>
                  <td className="border border-black px-2 py-1 text-center">{displayValue(nilaiRataRata)}</td>
                  <td className="border border-black px-2 py-1 text-center" />
                  <td className="border border-black px-2 py-1" />
                </tr>
                <tr>
                  <td className="border border-black px-2 py-1 text-left" colSpan={5}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span>Peringkat Kelas Ke :</span>
                      <span className="min-w-20 border-b border-black text-center">{displayValue(peringkat)}</span>
                      <span>dari</span>
                      <span className="min-w-20 border-b border-black text-center">{displayValue(totalSiswa)}</span>
                      <span>Siswa</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-8 text-[12px]">
            <div>
              <div className="mb-10 font-medium">Mengetahui</div>
              <div className="font-bold">Orang Tua / Wali</div>
              <div className="mt-14 text-center">( {displayValue(namaOrangTuaWali)} )</div>
            </div>

            <div className="text-right">
              <div>Diberikan di {tempatTerbit}, {tanggalTerbit}</div>
              <div className="mt-10 font-bold">Wali Kelas</div>
              <div className="mt-14 text-center">( {displayValue(namaWaliKelas)} )</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
