import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { EndpointInfo } from "../data/analitik-data"

type EndpointInfoCardProps = {
  info: EndpointInfo
}

export function EndpointInfoCard({ info }: EndpointInfoCardProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base text-foreground">{info.title}</CardTitle>
        <CardDescription>{info.purpose}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-xs text-muted-foreground">Endpoint</p>
          <p className="mt-1 font-mono text-sm text-foreground">{info.endpoint}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filter yang didukung</p>
          <div className="flex flex-wrap gap-2">
            {info.filters.map((filter) => (
              <Badge key={filter.name} variant="outline" className="bg-transparent">
                {filter.name}
                {filter.defaultValue ? `=${filter.defaultValue}` : ""}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
