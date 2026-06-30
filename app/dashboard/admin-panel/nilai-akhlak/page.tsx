"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { NilaiAkhlakFilters } from "./components/nilai-akhlak-filters"
import { NilaiAkhlakHeader } from "./components/nilai-akhlak-header"
import { NilaiAkhlakTable } from "./components/nilai-akhlak-table"
import { NilaiAkhlakItem, nilaiAkhlakService } from "@/lib/services/nilai-akhlak.service"
import { useTahunAjaran } from "@/contexts/tahun-ajaran-context"
import { getCachedUser } from "@/lib/auth-cache"
import { dataKelasService } from "@/lib/services/kelas.service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function NilaiAkhlakPage() {
  const router = useRouter()
  const { selectedTahunAjaran, isLoading: isTahunLoading } = useTahunAjaran()

  const [nomorInduk, setNomorInduk] = useState("")
  const [kodeKelas, setKodeKelas] = useState("all")
  const [semester, setSemester] = useState("all")
  const [aspek, setAspek] = useState("all")
  const [perPage, setPerPage] = useState("10")
  const [items, setItems] = useState<NilaiAkhlakItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const authData = await getCachedUser();
        if (!authData?.user) {
          setHasAccess(false);
          return;
        }

        const idPetugas = authData.user.id_petugas ?? authData.user.petugas?.id_petugas;
        const rolesStr = String(authData.user.peran_akun || "").toLowerCase();
        const isAdmin = rolesStr.includes("admin");

        if (isAdmin) {
          setHasAccess(true);
          return;
        }

        if (!idPetugas) {
          setHasAccess(false);
          return;
        }

        const res = await dataKelasService.getAll({ status: "AKTIF", per_page: 200 });
        const isWaliKelas = res.data.some(c => c.id_wali_kelas === idPetugas);
        setHasAccess(isWaliKelas);
      } catch (err) {
        console.error("Access check failed", err);
        setHasAccess(false);
      }
    };
    checkAccess();
  }, []);

  const fetchNilaiAkhlak = useCallback(async () => {
    if (isTahunLoading) return
    try {
      setIsLoading(true)
      setError("")

      const tahunAjaran = selectedTahunAjaran?.nama_tahun || undefined

      const sharedParams = {
        tahun_ajaran: tahunAjaran,
        kode_kelas: kodeKelas === "all" ? undefined : kodeKelas,
        semester: semester === "all" ? undefined : semester,
        aspek: aspek === "all" ? undefined : aspek,
        per_page: perPage,
      }

      const data = nomorInduk.trim()
        ? await nilaiAkhlakService.getAll({
          ...sharedParams,
          nomor_induk: nomorInduk.trim(),
        })
        : await nilaiAkhlakService.getAllBar(sharedParams)

      setItems(data)
    } catch (err: any) {
      setItems([])
      setError(err?.response?.data?.message || "Gagal memuat data nilai akhlak")
    } finally {
      setIsLoading(false)
    }
  }, [aspek, nomorInduk, kodeKelas, perPage, semester, selectedTahunAjaran, isTahunLoading])

  useEffect(() => {
    fetchNilaiAkhlak()
  }, [fetchNilaiAkhlak])

  const handleDelete = async (id: number) => {
    try {
      await nilaiAkhlakService.remove(id)
      await fetchNilaiAkhlak()
    } catch (err: any) {
      setError(err?.response?.data?.message || "Gagal menghapus nilai akhlak")
    }
  }

  if (hasAccess === null) {
    return <div className="space-y-6" /> // loading access
  }

  if (hasAccess === false) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          Halaman ini hanya dapat diakses oleh Wali Kelas atau Admin.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <NilaiAkhlakHeader
        onAdd={() => router.push("/dashboard/admin-panel/nilai-akhlak/new")}
        onRefresh={fetchNilaiAkhlak}
      />

      <NilaiAkhlakFilters
        kodeKelas={kodeKelas}
        onKodeKelasChange={setKodeKelas}
        nomorInduk={nomorInduk}
        onNomorIndukChange={setNomorInduk}
        semester={semester}
        onSemesterChange={setSemester}
        aspek={aspek}
        onAspekChange={setAspek}
        perPage={perPage}
        onPerPageChange={setPerPage}
        onApply={fetchNilaiAkhlak}
      />

      <NilaiAkhlakTable
        items={items}
        isLoading={isLoading || isTahunLoading}
        error={error}
        onDelete={handleDelete}
        onUpdate={fetchNilaiAkhlak}
      />
    </div>
  )
}
