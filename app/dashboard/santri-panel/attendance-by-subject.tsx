import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

interface AttendanceBySubject {
  mapel: string
  hadir: number
  sakit: number
  izin: number
  alpha: number
  total: number
  guru: string
}

interface AttendanceBySubjectTabProps {
  attendanceBySubject: AttendanceBySubject[]
  selectedMapel: string
  onMapelChange: (value: string) => void
}

export function AttendanceBySubjectTab({
  attendanceBySubject,
  selectedMapel,
  onMapelChange,
}: AttendanceBySubjectTabProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-lg text-foreground">Kehadiran Per Mata Pelajaran</CardTitle>
            <CardDescription>Detail kehadiran untuk setiap mata pelajaran</CardDescription>
          </div>
          <Select value={selectedMapel} onValueChange={onMapelChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter Mapel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mapel</SelectItem>
              <SelectItem value="diniyah">Diniyah</SelectItem>
              <SelectItem value="umum">Umum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {attendanceBySubject.map((subject, idx) => {
          const percentage = Math.round((subject.hadir / subject.total) * 100)
          return (
            <div key={idx} className="p-4 rounded-lg border border-border/50 bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3">
                <div>
                  <h4 className="font-semibold text-foreground">{subject.mapel}</h4>
                  <p className="text-sm text-muted-foreground">Guru: {subject.guru}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Hadir:</span>
                    <span className="font-medium text-primary">{subject.hadir}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Sakit:</span>
                    <span className="font-medium text-chart-4">{subject.sakit}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Izin:</span>
                    <span className="font-medium text-accent">{subject.izin}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Alpha:</span>
                    <span className="font-medium text-destructive">{subject.alpha}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tingkat kehadiran</span>
                  <span className="font-medium text-foreground">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
