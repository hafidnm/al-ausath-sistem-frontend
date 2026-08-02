"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { dataUnitService, DataUnitApiItem } from "@/lib/services/unit.service"

interface UnitContextType {
  allUnit: DataUnitApiItem[]
  selectedUnit: DataUnitApiItem | null
  selectedKodeUnit: string | null
  setSelectedUnit: (item: DataUnitApiItem | null) => void
  isLoading: boolean
}

const UnitContext = createContext<UnitContextType>({
  allUnit: [],
  selectedUnit: null,
  selectedKodeUnit: null,
  setSelectedUnit: () => {},
  isLoading: true,
})

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [allUnit, setAllUnit] = useState<DataUnitApiItem[]>([])
  const [selectedUnit, setSelectedUnitState] = useState<DataUnitApiItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setSelectedUnit = useCallback((item: DataUnitApiItem | null) => {
    setSelectedUnitState(item)
    // Persist to sessionStorage so it survives page navigation
    if (item?.kode_unit) {
      sessionStorage.setItem("selected_unit", JSON.stringify(item))
    } else {
      // null means "Semua Unit"
      sessionStorage.removeItem("selected_unit")
    }
  }, [])

  useEffect(() => {
    const fetchUnit = async () => {
      try {
        // Cek cache session dulu untuk menghindari request berulang
        const cachedListRaw = sessionStorage.getItem("all_unit")
        const savedRaw = sessionStorage.getItem("selected_unit")
        
        let data = []
        if (cachedListRaw) {
          try {
            data = JSON.parse(cachedListRaw)
            setAllUnit(data)
          } catch {
            data = []
          }
        }
        
        // Jika tidak ada cache, fetch dari API
        if (data.length === 0) {
          const res = await dataUnitService.getAll({ status: "AKTIF", per_page: 50 })
          data = res.data
          setAllUnit(data)
          sessionStorage.setItem("all_unit", JSON.stringify(data))
        }

        // Try to restore previous selection from sessionStorage
        if (savedRaw) {
          try {
            const saved: DataUnitApiItem = JSON.parse(savedRaw)
            const stillExists = data.find(
              (d: DataUnitApiItem) => (d.id_unit ?? d.id) === (saved.id_unit ?? saved.id)
            )
            if (stillExists) {
              setSelectedUnitState(stillExists)
              setIsLoading(false)
              return
            }
          } catch {
            // Ignore parse errors
          }
        }

        // Default: no unit selected = "Semua Unit"
        setSelectedUnitState(null)
      } catch (err) {
        console.error("Gagal mengambil data unit:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUnit()
  }, [])

  const selectedKodeUnit = selectedUnit?.kode_unit ?? null

  return (
    <UnitContext.Provider
      value={{
        allUnit,
        selectedUnit,
        selectedKodeUnit,
        setSelectedUnit,
        isLoading,
      }}
    >
      {children}
    </UnitContext.Provider>
  )
}

export function useUnit() {
  return useContext(UnitContext)
}
