"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Clock,
  Weight,
  ArrowRight,
} from "lucide-react"

interface ModuleCard {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
}

export function AdminPanelHome() {
  const modules: ModuleCard[] = [
    {
      title: "Validasi Presensi",
      description: "Validasi presensi santri dan guru, riwayat validasi",
      icon: <Clock className="w-6 h-6" />,
      href: "/dashboard/admin-panel/validasi",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Bobot Nilai",
      description: "Kelola persentase bobot penilaian untuk tugas, ulangan, dan ujian",
      icon: <Weight className="w-6 h-6" />,
      href: "/dashboard/admin-panel/bobot",
      color: "bg-accent/20 text-accent",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Panel Admin</h1>
        <p className="text-muted-foreground mt-2">Pilih modul yang ingin Anda kelola</p>
      </div>

      {/* Module Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="border-border/50 cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${module.color}`}>
                    {module.icon}
                  </div>
                </div>
                <CardTitle className="text-lg text-foreground mt-4">{module.title}</CardTitle>
                <CardDescription className="text-base">{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="bg-transparent w-full justify-between group"
                  asChild
                >
                  <span>
                    Buka Modul
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
