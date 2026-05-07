"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SantriForm, santriFormToPayload } from "../components/santri-form"
import { dataSantriService } from "@/lib/services/santri.service"
import { useToast } from "@/hooks/use-toast"

export default function SantriTambahPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (values: Parameters<typeof santriFormToPayload>[0] & {
    create_account: boolean
    nama_akun: string
    password: string
    password_confirmation: string
    status_akun: "AKTIF" | "NONAKTIF"
  }) => {
    const payload = santriFormToPayload(values)
    const created = await dataSantriService.create(payload)
    const createdId = Number(created.id_santri ?? created.id ?? 0)
    let accountCreated = false

    if (values.create_account && createdId > 0) {
      try {
        await dataSantriService.createAccount(createdId, {
          nama_akun: values.nama_akun.trim() || undefined,
          password: values.password,
          status: values.status_akun,
        })
        accountCreated = true
      } catch (error) {
        accountCreated = false
      }
    }

    toast(
      values.create_account && createdId > 0 && !accountCreated
        ? {
            title: "Data santri tersimpan",
            description: "Akun santri gagal dibuat, tetapi data utama sudah berhasil disimpan.",
            variant: "destructive",
          }
        : {
            title: "Berhasil",
            description: accountCreated
              ? "Data santri dan akun berhasil ditambahkan."
              : "Data santri berhasil ditambahkan.",
          },
    )

    if (createdId > 0) {
      router.push(`/dashboard/santri/${createdId}`)
      return
    }

    router.push("/dashboard/santri")
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard/santri" className="hover:text-foreground">
            Daftar Santri
          </Link>
          <span>/</span>
          <span>Tambah Santri</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Tambah Santri</h1>
            <p className="text-muted-foreground">Isi data santri secara lengkap dan langsung buat akun bila diperlukan.</p>
          </div>
          <Button asChild variant="outline" className="self-start bg-transparent">
            <Link href="/dashboard/santri">Kembali ke daftar</Link>
          </Button>
        </div>
      </div>

      <SantriForm
        mode="create"
        title="Formulir Santri Baru"
        description="Kelompokkan data ke beberapa section agar pengisian lebih mudah dipahami."
        showAccountSection
        submitLabel="Simpan Santri"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/dashboard/santri")}
      />
    </div>
  )
}