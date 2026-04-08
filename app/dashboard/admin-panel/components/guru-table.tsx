"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  GraduationCap,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { getInitials, getStatusBadge } from "../utils/helpers"
import { pendingGuruPresensi } from "../utils/constants"

export function GuruTable() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-accent" />
              Validasi Presensi Guru
            </CardTitle>
            <CardDescription>Presensi guru yang perlu divalidasi</CardDescription>
          </div>
          <Badge variant="outline" className="bg-transparent">{pendingGuruPresensi.length} pending</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Tanggal</TableHead>
                <TableHead>Guru</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Keluar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingGuruPresensi.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">{item.tanggal}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="bg-accent/20 text-accent text-xs">
                          {getInitials(item.guru)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-foreground">{item.guru}</p>
                        <p className="text-xs text-muted-foreground">{item.nip}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{item.mapel}</TableCell>
                  <TableCell>
                    <div>
                      <span className="text-foreground">{item.kelas}</span>
                      <span className="text-xs text-muted-foreground ml-1">({item.jenjang})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.status)}
                    {item.alasan && (
                      <p className="text-xs text-muted-foreground mt-1">{item.alasan}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground">{item.jamMasuk}</TableCell>
                  <TableCell className="text-muted-foreground">{item.jamKeluar}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                      >
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 hover:bg-destructive/10"
                      >
                        <XCircle className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
