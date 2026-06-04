"use client"

import React, { useState, useEffect } from "react"
import { authService } from "@/lib/services/auth.service"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Lock, Loader2, Save } from "lucide-react"

export default function ProfilePage() {
  const { toast } = useToast()
  
  // Data State
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState("")
  
  // Form Biodata State
  const [biodata, setBiodata] = useState({
    nama_lengkap: "",
    alamat_email: "",
    nomor_telepon: "",
    jenis_kelamin: "",
    nomor_induk: "",
    nama_kelas: "",
  })
  const [isSavingBiodata, setIsSavingBiodata] = useState(false)

  // Form Password State
  const [passwordForm, setPasswordForm] = useState({
    password_lama: "",
    password_baru: "",
    password_baru_confirmation: "",
  })
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await authService.me()
      if (response && response.user) {
        setBiodata({
          nama_lengkap: response.user.nama_lengkap || "",
          alamat_email: response.user.alamat_email || response.user.email || "",
          nomor_telepon: response.user.nomor_telepon || response.user.phone || "",
          jenis_kelamin: response.user.jenis_kelamin || "",
          nomor_induk: response.user.nomor_induk || "",
          nama_kelas: response.user.nama_kelas || "",
        })
        const finalRole = response.user.peran_akun ? response.user.peran_akun : "Santri"
        setUserRole(finalRole)
      }
    } catch (error) {
      toast({
        title: "Gagal memuat profil",
        description: "Terjadi kesalahan saat mengambil data profil.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBiodataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setBiodata(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
  }

  const submitBiodata = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingBiodata(true)
    try {
      await authService.updateBiodata(biodata)
      toast({
        title: "Berhasil",
        description: "Biodata Anda telah diperbarui.",
      })
      
      // Update local storage user data to reflect new name
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userObj = JSON.parse(userStr)
        userObj.nama_lengkap = biodata.nama_lengkap
        localStorage.setItem('user', JSON.stringify(userObj))
        // Dispatch event to update navbar if listening
        window.dispatchEvent(new Event('storage'))
      }
      
    } catch (error: any) {
      toast({
        title: "Gagal menyimpan biodata",
        description: error.response?.data?.message || "Terjadi kesalahan.",
        variant: "destructive"
      })
    } finally {
      setIsSavingBiodata(false)
    }
  }

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.password_baru !== passwordForm.password_baru_confirmation) {
      toast({
        title: "Validasi Gagal",
        description: "Konfirmasi password baru tidak cocok.",
        variant: "destructive"
      })
      return
    }

    setIsSavingPassword(true)
    try {
      await authService.updatePassword(passwordForm)
      toast({
        title: "Berhasil",
        description: "Kata sandi Anda telah berhasil diperbarui.",
      })
      setPasswordForm({
        password_lama: "",
        password_baru: "",
        password_baru_confirmation: "",
      })
    } catch (error: any) {
      toast({
        title: "Gagal mengganti password",
        description: error.response?.data?.message || error.response?.data?.errors?.password_lama?.[0] || "Pastikan password lama Anda benar.",
        variant: "destructive"
      })
    } finally {
      setIsSavingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Memuat data profil...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Profil Akun</h1>
        <p className="text-muted-foreground">
          Kelola informasi pribadi dan pengaturan keamanan akun Anda.
        </p>
      </div>

      <Tabs defaultValue="biodata" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="biodata" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Informasi Pribadi</span>
          </TabsTrigger>
          <TabsTrigger value="keamanan" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>Keamanan</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="biodata" className="mt-6">
          <Card>
            <form onSubmit={submitBiodata}>
              <CardHeader>
                <CardTitle>Informasi Pribadi</CardTitle>
                <CardDescription>
                  Perbarui detail kontak dan nama lengkap Anda di sini.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {userRole !== "Santri" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nomor Induk Pegawai / Petugas</Label>
                        <Input value={biodata.nomor_induk || "-"} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Peran Akun (Role)</Label>
                        <Input value={userRole} disabled className="bg-muted" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nama_lengkap">Nama Lengkap (beserta gelar)</Label>
                      <Input 
                        id="nama_lengkap" 
                        name="nama_lengkap" 
                        value={biodata.nama_lengkap} 
                        onChange={handleBiodataChange} 
                        required 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="alamat_email">Alamat Email (Username Login)</Label>
                        <Input 
                          id="alamat_email" 
                          name="alamat_email" 
                          type="email" 
                          value={biodata.alamat_email} 
                          onChange={handleBiodataChange} 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="nomor_telepon">Nomor Telepon / WhatsApp</Label>
                        <Input 
                          id="nomor_telepon" 
                          name="nomor_telepon" 
                          value={biodata.nomor_telepon} 
                          onChange={handleBiodataChange} 
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nomor Induk Santri (NIS)</Label>
                        <Input value={biodata.nomor_induk || "-"} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Kelas Saat Ini</Label>
                        <Input value={biodata.nama_kelas || "-"} disabled className="bg-muted" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nama_lengkap">Nama Lengkap Santri (Sesuai Ijazah)</Label>
                      <Input 
                        id="nama_lengkap" 
                        name="nama_lengkap" 
                        value={biodata.nama_lengkap} 
                        onChange={handleBiodataChange} 
                        required 
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                        <Select 
                          value={biodata.jenis_kelamin} 
                          onValueChange={(val) => setBiodata(prev => ({ ...prev, jenis_kelamin: val }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Jenis Kelamin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L">Laki-laki (Putra)</SelectItem>
                            <SelectItem value="P">Perempuan (Putri)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="alamat_email">Alamat Email</Label>
                        <Input 
                          id="alamat_email" 
                          name="alamat_email" 
                          type="email" 
                          value={biodata.alamat_email} 
                          onChange={handleBiodataChange} 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nomor_telepon">Nomor Telepon / WhatsApp</Label>
                        <Input 
                          id="nomor_telepon" 
                          name="nomor_telepon" 
                          value={biodata.nomor_telepon} 
                          onChange={handleBiodataChange} 
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6">
                <Button type="submit" disabled={isSavingBiodata} className="gap-2">
                  {isSavingBiodata ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Perubahan
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="keamanan" className="mt-6">
          <Card>
            <form onSubmit={submitPassword}>
              <CardHeader>
                <CardTitle>Ganti Kata Sandi</CardTitle>
                <CardDescription>
                  Pastikan kata sandi baru Anda unik dan mudah diingat.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password_lama">Kata Sandi Saat Ini</Label>
                  <Input 
                    id="password_lama" 
                    name="password_lama" 
                    type="password" 
                    value={passwordForm.password_lama}
                    onChange={handlePasswordChange}
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password_baru">Kata Sandi Baru</Label>
                  <Input 
                    id="password_baru" 
                    name="password_baru" 
                    type="password" 
                    value={passwordForm.password_baru}
                    onChange={handlePasswordChange}
                    required 
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_baru_confirmation">Konfirmasi Kata Sandi Baru</Label>
                  <Input 
                    id="password_baru_confirmation" 
                    name="password_baru_confirmation" 
                    type="password" 
                    value={passwordForm.password_baru_confirmation}
                    onChange={handlePasswordChange}
                    required 
                    minLength={6}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-6">
                <Button type="submit" disabled={isSavingPassword} className="gap-2">
                  {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Perbarui Sandi
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
