"use client"

import { AlertCircle } from "lucide-react"

interface RaporFeedbackAlertProps {
  error: string
  success: string
}

export function RaporFeedbackAlert({ error, success }: RaporFeedbackAlertProps) {
  if (!error && !success) return null

  return (
    <div className={`rounded-lg border p-4 ${error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-primary/30 bg-primary/5 text-primary"}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4" />
        <p className="text-sm">{error || success}</p>
      </div>
    </div>
  )
}
