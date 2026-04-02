"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BobotHeader } from "./components/bobot-header"
import { BobotInfo } from "./components/bobot-info"
import { BobotTable } from "./components/bobot-table"

export default function BobotPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleAdd = () => {
    router.push("/dashboard/admin-panel/bobot/new")
  }

  const handleEdit = (id: number) => {
    router.push(`/dashboard/admin-panel/bobot/${id}/edit`)
  }

  const handleDelete = (id: number) => {
    // Call DELETE /api/akademik/bobot/{id}
    console.log("Delete bobot:", id)
  }

  const handleSetDefault = () => {
    setIsLoading(true)
    // Call POST /api/akademik/bobot/set-default
    console.log("Setting default bobot to 20-30-50")
    setTimeout(() => setIsLoading(false), 1000)
  }

  const handleRefresh = () => {
    // Call GET /api/akademik/bobot
    console.log("Refresh bobot data")
  }

  const handleExport = () => {
    console.log("Export bobot data")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <BobotHeader
        onAdd={handleAdd}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />

      {/* Info Cards */}
      <BobotInfo />

      {/* Bobot Table */}
      <BobotTable
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSetDefault={handleSetDefault}
      />
    </div>
  )
}
