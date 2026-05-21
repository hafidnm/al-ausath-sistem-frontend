import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle, AlertCircle, Clock, XCircle } from "lucide-react"

interface RecentAttendanceRecord {
  tanggal: string
  mapel: string
  status: string
  jam: string
}

interface RecentAttendanceTabProps {
  recentAttendance: RecentAttendanceRecord[]
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "hadir":
      return <Badge className="bg-primary/10 text-primary border-0">Hadir</Badge>
    case "sakit":
      return <Badge className="bg-chart-3/20 text-chart-4 border-0">Sakit</Badge>
    case "izin":
      return <Badge className="bg-accent/20 text-accent border-0">Izin</Badge>
    case "alpha":
      return <Badge className="bg-destructive/10 text-destructive border-0">Alpha</Badge>
    default:
      return <Badge variant="outline">-</Badge>
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "hadir":
      return <CheckCircle className="w-4 h-4 text-primary" />
    case "sakit":
      return <AlertCircle className="w-4 h-4 text-chart-3" />
    case "izin":
      return <Clock className="w-4 h-4 text-accent" />
    case "alpha":
      return <XCircle className="w-4 h-4 text-destructive" />
    default:
      return null
  }
}

export function RecentAttendanceTab({ recentAttendance }: RecentAttendanceTabProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Riwayat Kehadiran Terbaru</CardTitle>
        <CardDescription>10 record kehadiran terakhir</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Tanggal</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jam Masuk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAttendance.map((record, idx) => (
                <TableRow key={idx} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">{record.tanggal}</TableCell>
                  <TableCell className="text-foreground">{record.mapel}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      {getStatusBadge(record.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{record.jam !== "-" ? record.jam : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
