import { Badge } from "@/components/ui/badge"

export const getInitials = (name: string) => {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
}

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "hadir":
      return <Badge className="bg-primary/10 text-primary border-0">Hadir</Badge>
    case "tidak_hadir":
      return <Badge className="bg-destructive/10 text-destructive border-0">Tidak Hadir</Badge>
    default:
      return <Badge variant="outline">-</Badge>
  }
}

export const getValidationBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge className="bg-primary/10 text-primary border-0">Disetujui</Badge>
    case "pending":
      return <Badge className="bg-secondary text-secondary-foreground border-0">Menunggu</Badge>
    case "rejected":
      return <Badge className="bg-destructive/10 text-destructive border-0">Ditolak</Badge>
    default:
      return <Badge variant="outline">-</Badge>
  }
}
