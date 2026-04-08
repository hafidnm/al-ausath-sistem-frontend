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
  UserCheck,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react"
import { getInitials } from "../utils/helpers"
import { pendingSantriPresensi } from "../utils/constants"

interface SantriTableProps {
  selectedItems: number[]
  onSelectAll: () => void
  onSelectItem: (id: number) => void
  onViewDetail: (item: typeof pendingSantriPresensi[0]) => void
  onApprove: (id: number) => void
  onReject: (item: typeof pendingSantriPresensi[0]) => void
}

export function SantriTable({
  selectedItems,
  onSelectAll,
  onSelectItem,
  onViewDetail,
  onApprove,
  onReject,
}: SantriTableProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Validasi Presensi Santri
            </CardTitle>
            <CardDescription>Presensi santri yang perlu divalidasi</CardDescription>
          </div>
          <Badge variant="outline" className="bg-transparent">{pendingSantriPresensi.length} pending</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 accent-primary"
                    checked={selectedItems.length === pendingSantriPresensi.length}
                    onChange={onSelectAll}
                  />
                </TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Guru</TableHead>
                <TableHead>Mata Pelajaran</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead className="text-center">Hadir</TableHead>
                <TableHead className="text-center">Sakit</TableHead>
                <TableHead className="text-center">Izin</TableHead>
                <TableHead className="text-center">Alpha</TableHead>
                <TableHead>Waktu Input</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSantriPresensi.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-primary"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => onSelectItem(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{item.tanggal}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(item.guru)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-foreground">{item.guru}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{item.mapel}</TableCell>
                  <TableCell>
                    <div>
                      <span className="text-foreground">{item.kelas}</span>
                      <span className="text-xs text-muted-foreground ml-1">({item.jenjang})</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium text-primary">{item.hadir}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-chart-4">{item.sakit}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-accent">{item.izin}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-destructive">{item.alpha}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{item.waktuInput}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => onViewDetail(item)}
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                        onClick={() => onApprove(item.id)}
                      >
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 hover:bg-destructive/10"
                        onClick={() => onReject(item)}
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
