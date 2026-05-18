import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen, User, Calendar } from "lucide-react"

interface StudentInfoHeaderProps {
  santriInfo: {
    name: string
    nis: string
    kelas: string
    jenjang: string
    waliKelas: string
    tahunAjaran: string
    semester: string
  }
  attendancePercentage: number
}

export function StudentInfoHeader({ santriInfo, attendancePercentage }: StudentInfoHeaderProps) {
  return (
    <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              AF
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{santriInfo.name}</h1>
              <Badge variant="outline" className="bg-transparent">{santriInfo.jenjang}</Badge>
            </div>
            <p className="text-muted-foreground mb-3">NIS: {santriInfo.nis}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-foreground">Kelas {santriInfo.kelas}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span className="text-foreground">{santriInfo.waliKelas}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-foreground">{santriInfo.tahunAjaran} - {santriInfo.semester}</span>
              </div>
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="inline-flex flex-col items-center p-4 bg-card rounded-xl border border-border/50">
              <span className="text-3xl font-bold text-primary">{attendancePercentage}%</span>
              <span className="text-sm text-muted-foreground">Tingkat Kehadiran</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
