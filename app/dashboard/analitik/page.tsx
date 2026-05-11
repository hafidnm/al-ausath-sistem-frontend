"use client"

import { AnalitikHeader } from "./components/analitik-header"
import { AnalitikSections } from "./components/analitik-sections"

export default function AnalitikPage() {
  return (
    <div className="space-y-6">
      <AnalitikHeader />
      <AnalitikSections />
    </div>
  )
}