"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Clock,
  CheckCircle,
  Weight,
} from "lucide-react"

interface AdminNavItem {
  label: string
  value: string
  href: string
  icon: React.ReactNode
  description: string
}

export const adminNavItems: AdminNavItem[] = [
  {
    label: "Validasi Presensi",
    value: "validasi",
    href: "/dashboard/admin-panel",
    icon: <Clock className="w-4 h-4" />,
    description: "Validasi presensi santri dan guru",
  },
  {
    label: "Bobot Nilai",
    value: "bobot",
    href: "/dashboard/admin-panel/bobot",
    icon: <Weight className="w-4 h-4" />,
    description: "Kelola bobot penilaian",
  },
]

interface AdminPanelNavProps {
  children: React.ReactNode
}

export function AdminPanelNav({ children }: AdminPanelNavProps) {
  const pathname = usePathname()

  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname?.includes("/bobot")) return "bobot"
    return "validasi"
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <Tabs value={getActiveTab()} className="w-full">
        <TabsList className="bg-muted/50">
          {adminNavItems.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              asChild
              className="data-[state=active]:bg-card"
            >
              <Link href={item.href} className="flex items-center gap-2">
                {item.icon}
                {item.label}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content Areas */}
        {adminNavItems.map((item) => (
          <TabsContent key={item.value} value={item.value} className="space-y-6">
            {children}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
