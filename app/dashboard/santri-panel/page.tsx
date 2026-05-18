"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, FileText, Award } from "lucide-react"
import { StudentInfoHeader } from "./student-info-header"
import { AttendanceSummaryCards } from "./attendance-summary-cards"
import { AttendanceCharts } from "./attendance-charts"
import { AttendanceBySubjectTab } from "./attendance-by-subject"
import { RecentAttendanceTab } from "./recent-attendance"
import { NilaiMapelList } from "./nilai-mapel-list"
import { ParentInformationCard } from "./parent-info-card"

// Student data
const santriInfo = {
  name: "Ahmad Fauzi",
  nis: "2024001",
  kelas: "9A",
  jenjang: "SMP",
  waliKelas: "Ustadz Ibrahim",
  tahunAjaran: "2025/2026",
  semester: "Ganjil",
}

// Attendance summary
const attendanceSummary = {
  hadir: 145,
  sakit: 3,
  izin: 2,
  alpha: 0,
  total: 150,
}

// Monthly attendance data
const monthlyData = [
  { bulan: "Jul", hadir: 20, sakit: 1, izin: 0, alpha: 0 },
  { bulan: "Agu", hadir: 22, sakit: 0, izin: 1, alpha: 0 },
  { bulan: "Sep", hadir: 21, sakit: 1, izin: 0, alpha: 0 },
  { bulan: "Okt", hadir: 23, sakit: 0, izin: 0, alpha: 0 },
  { bulan: "Nov", hadir: 20, sakit: 1, izin: 1, alpha: 0 },
  { bulan: "Des", hadir: 18, sakit: 0, izin: 0, alpha: 0 },
  { bulan: "Jan", hadir: 21, sakit: 0, izin: 0, alpha: 0 },
]

// Attendance by subject
const attendanceBySubject = [
  { mapel: "Tahfidz Al-Quran", hadir: 28, sakit: 1, izin: 1, alpha: 0, total: 30, guru: "Ustadz Ahmad" },
  { mapel: "Fiqih", hadir: 25, sakit: 1, izin: 0, alpha: 0, total: 26, guru: "Ustadz Umar" },
  { mapel: "Hadits", hadir: 24, sakit: 0, izin: 1, alpha: 0, total: 25, guru: "Ustadz Ibrahim" },
  { mapel: "Bahasa Arab", hadir: 26, sakit: 1, izin: 0, alpha: 0, total: 27, guru: "Ustadzah Fatimah" },
  { mapel: "Matematika", hadir: 22, sakit: 0, izin: 0, alpha: 0, total: 22, guru: "Pak Budi" },
  { mapel: "IPA", hadir: 20, sakit: 0, izin: 0, alpha: 0, total: 20, guru: "Bu Siti" },
]

// Recent attendance records
const recentAttendance = [
  { tanggal: "30 Jan 2026", mapel: "Tahfidz Al-Quran", status: "hadir", jam: "07:15" },
  { tanggal: "30 Jan 2026", mapel: "Fiqih", status: "hadir", jam: "09:05" },
  { tanggal: "29 Jan 2026", mapel: "Hadits", status: "hadir", jam: "07:10" },
  { tanggal: "29 Jan 2026", mapel: "Matematika", status: "hadir", jam: "10:00" },
  { tanggal: "28 Jan 2026", mapel: "Bahasa Arab", status: "sakit", jam: "-" },
  { tanggal: "27 Jan 2026", mapel: "IPA", status: "hadir", jam: "08:30" },
  { tanggal: "27 Jan 2026", mapel: "Tahfidz Al-Quran", status: "hadir", jam: "07:08" },
  { tanggal: "26 Jan 2026", mapel: "Fiqih", status: "izin", jam: "-" },
]

const pieChartData = [
  { name: "Hadir", value: attendanceSummary.hadir, color: "hsl(var(--primary))" },
  { name: "Sakit", value: attendanceSummary.sakit, color: "hsl(var(--chart-3))" },
  { name: "Izin", value: attendanceSummary.izin, color: "hsl(var(--accent))" },
  { name: "Alpha", value: attendanceSummary.alpha, color: "hsl(var(--destructive))" },
]

export default function SantriPanelPage() {
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [selectedMapel, setSelectedMapel] = useState("all")

  const attendancePercentage = Math.round((attendanceSummary.hadir / attendanceSummary.total) * 100)

  return (
    <div className="space-y-6">
      <StudentInfoHeader santriInfo={santriInfo} attendancePercentage={attendancePercentage} />
      <AttendanceSummaryCards attendanceSummary={attendanceSummary} />
      <AttendanceCharts
        monthlyData={monthlyData}
        pieChartData={pieChartData}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
      />

      <Tabs defaultValue="mapel" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="mapel" className="data-[state=active]:bg-card">
            <BookOpen className="w-4 h-4 mr-2" />
            Per Mata Pelajaran
          </TabsTrigger>
          <TabsTrigger value="nilai-mapel" className="data-[state=active]:bg-card">
            <Award className="w-4 h-4 mr-2" />
            Nilai Mapel
          </TabsTrigger>
          <TabsTrigger value="riwayat" className="data-[state=active]:bg-card">
            <FileText className="w-4 h-4 mr-2" />
            Riwayat Terbaru
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mapel" className="space-y-4">
          <AttendanceBySubjectTab
            attendanceBySubject={attendanceBySubject}
            selectedMapel={selectedMapel}
            onMapelChange={setSelectedMapel}
          />
        </TabsContent>

        <TabsContent value="nilai-mapel" className="space-y-4">
          <NilaiMapelList tahunAjaran={santriInfo.tahunAjaran} semester={1} />
        </TabsContent>

        <TabsContent value="riwayat" className="space-y-4">
          <RecentAttendanceTab recentAttendance={recentAttendance} />
        </TabsContent>
      </Tabs>

      <ParentInformationCard />
    </div>
  )
}
