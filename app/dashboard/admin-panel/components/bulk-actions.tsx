"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"

interface BulkActionsProps {
  selectedCount: number
  onClear: () => void
  onApproveAll: () => void
}

export function BulkActions({ selectedCount, onClear, onApproveAll }: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground">
            <span className="font-medium">{selectedCount}</span> item dipilih
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="bg-transparent"
              onClick={onClear}
            >
              Batal
            </Button>
            <Button 
              size="sm" 
              className="bg-primary text-primary-foreground"
              onClick={onApproveAll}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Setujui Semua
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
