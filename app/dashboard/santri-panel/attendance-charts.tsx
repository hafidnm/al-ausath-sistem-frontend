import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { TrendingUp } from "lucide-react"

interface AttendanceChartsProps {
  monthlyData: Array<{
    bulan: string
    hadir: number
    sakit: number
    izin: number
    alpha: number
  }>
  pieChartData: Array<{
    name: string
    value: number
    color: string
  }>
  selectedMonth: string
  onMonthChange: (value: string) => void
}

export function AttendanceCharts({
  monthlyData,
  pieChartData,
  selectedMonth,
  onMonthChange,
}: AttendanceChartsProps) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Monthly Chart */}
      <Card className="border-border/50 lg:col-span-2">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Grafik Kehadiran Bulanan
              </CardTitle>
              <CardDescription>Statistik kehadiran per bulan</CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={onMonthChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Bulan</SelectItem>
                <SelectItem value="semester1">Semester 1</SelectItem>
                <SelectItem value="semester2">Semester 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="bulan" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="hadir" fill="hsl(var(--primary))" name="Hadir" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sakit" fill="hsl(var(--chart-3))" name="Sakit" radius={[4, 4, 0, 0]} />
                <Bar dataKey="izin" fill="hsl(var(--accent))" name="Izin" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alpha" fill="hsl(var(--destructive))" name="Alpha" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Distribusi Kehadiran</CardTitle>
          <CardDescription>Total semester ini</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieChartData.filter((d) => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
