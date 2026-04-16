import { Badge } from '@/components/ui/badge';
import { SppStatus } from '@/lib/services/spp.service';

type SppStatusBadgeProps = {
  status: SppStatus;
};

export function SppStatusBadge({ status }: SppStatusBadgeProps) {
  switch (status) {
    case 'Lunas':
      return <Badge className="bg-primary/10 text-primary border-0">Lunas</Badge>;
    case 'Cicilan':
      return <Badge className="bg-accent/20 text-accent border-0">Cicilan</Badge>;
    case 'Menunggu Verifikasi':
      return <Badge className="bg-chart-3/20 text-chart-4 border-0">Menunggu Verifikasi</Badge>;
    case 'Terverifikasi':
      return <Badge className="bg-primary/10 text-primary border-0">Terverifikasi</Badge>;
    case 'Belum Bayar':
      return <Badge className="bg-chart-3/20 text-chart-4 border-0">Belum Bayar</Badge>;
    case 'Terlambat':
      return <Badge className="bg-destructive/10 text-destructive border-0">Terlambat</Badge>;
    default:
      return <Badge variant="outline">-</Badge>;
  }
}
