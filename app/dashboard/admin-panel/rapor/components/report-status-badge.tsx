"use client"

import { Badge } from "@/components/ui/badge"

interface ReportStatusBadgeProps {
  status?: string
}

export function ReportStatusBadge({ status }: ReportStatusBadgeProps) {
  const normalized = (status || "DRAFT").toUpperCase()

  if (normalized === "TERBIT") {
    return <Badge className="bg-primary/10 text-primary border-0">TERBIT</Badge>
  }

  return <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 border-0">DRAFT</Badge>
}
