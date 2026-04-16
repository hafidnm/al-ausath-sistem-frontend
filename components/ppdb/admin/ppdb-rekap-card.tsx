"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, XCircle, Users } from "lucide-react"
import type { PpdbDetail } from "@/lib/services/ppdb.service"

interface PpdbRekapCardProps {
  data: PpdbDetail[]
}

const formatDate = (value: string) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

export function PpdbRekapCard({ data }: PpdbRekapCardProps) {
  const [activeTab, setActiveTab] = useState<"diterima" | "ditolak">("diterima")

  const diterima = useMemo(() =>
    data.filter((p) => p.status === "Diterima"),
    [data]
  )

  const ditolak = useMemo(() =>
    data.filter((p) => p.status === "Ditolak"),
    [data]
  )

  const displayed = activeTab === "diterima" ? diterima : ditolak

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Rekap Hasil Seleksi PPDB
            </CardTitle>
            <CardDescription>
              Daftar pendaftar yang telah mendapat keputusan diterima atau ditolak
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "diterima" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("diterima")}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Diterima
              <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary">
                {diterima.length}
              </Badge>
            </Button>
            <Button
              variant={activeTab === "ditolak" ? "destructive" : "outline"}
              size="sm"
              onClick={() => setActiveTab("ditolak")}
              className="gap-2"
            >
              <XCircle className="w-4 h-4" />
              Ditolak
              <Badge variant="secondary" className="ml-1 bg-destructive/10 text-destructive">
                {ditolak.length}
              </Badge>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {displayed.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            {activeTab === "diterima"
              ? "Belum ada pendaftar yang diterima."
              : "Belum ada pendaftar yang ditolak."}
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Nama Calon</TableHead>
                  <TableHead>No Pendaftaran</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Tanggal Daftar</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((p, index) => (
                  <TableRow key={`${p.id}-${p.noPendaftaran}`}>
                    <TableCell className="text-muted-foreground text-sm">{index + 1}</TableCell>
                    <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.noPendaftaran}</TableCell>
                    <TableCell className="text-sm">{p.programPendaftaran || p.jenjang || "-"}</TableCell>
                    <TableCell className="text-sm">{formatDate(p.tanggalDaftar || "")}</TableCell>
                    <TableCell>
                      {activeTab === "diterima" ? (
                        <Badge className="bg-primary/10 text-primary border-0">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Diterima
                        </Badge>
                      ) : (
                        <Badge className="bg-destructive/10 text-destructive border-0">
                          <XCircle className="w-3 h-3 mr-1" />
                          Ditolak
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
