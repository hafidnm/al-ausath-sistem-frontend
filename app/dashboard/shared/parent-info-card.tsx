import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export function ParentInformationCard() {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Informasi untuk Wali Santri</h4>
            <p className="text-sm text-muted-foreground">
              Halaman ini menampilkan data kehadiran putra/putri Anda secara real-time. 
              Data presensi diinput oleh guru pengampu dan telah divalidasi oleh admin pesantren. 
              Jika ada pertanyaan atau ketidaksesuaian data, silakan hubungi wali kelas atau bagian administrasi.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
