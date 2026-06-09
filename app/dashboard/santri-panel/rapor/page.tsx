"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText } from "lucide-react"
import { RaportDisplay } from "../raport-display"

const tahunAjaranOptions = [
  { value: "2029/2030", label: "2029/2030" },
  { value: "2028/2029", label: "2028/2029" },
  { value: "2027/2028", label: "2027/2028" },
  { value: "2026/2027", label: "2026/2027" },
  { value: "2025/2026", label: "2025/2026" },
  { value: "2024/2025", label: "2024/2025" },
  { value: "2023/2024", label: "2023/2024" },
]

const semesterOptions = [
  { value: "1", label: "Semester 1 (Ganjil)" },
  { value: "2", label: "Semester 2 (Genap)" },
]

export default function SantriRaportPage() {
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState("2025/2026")
  const [selectedSemester, setSelectedSemester] = useState("1")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-primary" />
          Raport Digital
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lihat dan unduh raport digital Anda ketika sudah diterbitkan
        </p>
      </div>

      {/* Filters */}
      <Card className="border-border/50 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Filter Raport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Tahun Ajaran
              </label>
              <Select value={selectedTahunAjaran} onValueChange={setSelectedTahunAjaran}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tahunAjaranOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Semester
              </label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {semesterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Raport Display */}
      <RaportDisplay tahunAjaran={selectedTahunAjaran} semester={parseInt(selectedSemester)} />
    </div>
  )
}
