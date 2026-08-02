"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { dataUnitService, DataUnitApiItem } from "@/lib/services/unit.service"

interface UnitContextType {
  allUnit: DataUnitApiItem[]
  selectedUnit: DataUnitApiItem | null
  selectedKodeUnit: string | null
  setSelectedUnit: (item: DataUnitApiItem | null) => void
  refetchUnit: () => Promise<void>
  isLoading: boolean
}

const UnitContext = createContext<UnitContextType>({
  allUnit: [],
  selectedUnit: null,
  selectedKodeUnit: null,
  setSelectedUnit: () => {},
  refetchUnit: async () => {},
  isLoading: true,
})

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [allUnit, setAllUnit] = useState<DataUnitApiItem[]>([])
  const [selectedUnit, setSelectedUnitState] = useState<DataUnitApiItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setSelectedUnit = useCallback((item: DataUnitApiItem | null) => {
    setSelectedUnitState(item)
    if (item?.kode_unit) {
      sessionStorage.setItem("selected_unit", JSON.stringify(item))
    } else {
      sessionStorage.removeItem("selected_unit")
    }
  }, [])

  const fetchUnit = useCallback(async () => {
    try {
      // 1. Initial quick load from cache
      const cachedListRaw = sessionStorage.getItem("all_unit")
      const savedRaw = sessionStorage.getItem("selected_unit")
      let initialSaved: DataUnitApiItem | null = null

      if (savedRaw) {
        try {
          initialSaved = JSON.parse(savedRaw)
        } catch {
          initialSaved = null
        }
      }

      if (cachedListRaw) {
        try {
          const cachedData: DataUnitApiItem[] = JSON.parse(cachedListRaw)
          if (cachedData.length > 0) {
            setAllUnit(cachedData)
            if (initialSaved) {
              const matched = cachedData.find(
                (d) => (d.id_unit ?? d.id) === (initialSaved?.id_unit ?? initialSaved?.id) || d.kode_unit === initialSaved?.kode_unit
              )
              if (matched) setSelectedUnitState(matched)
            }
          }
        } catch {
          // Ignore cache parse error
        }
      }

      // 2. Always fetch fresh data from API
      const res = await dataUnitService.getAll({ status: "AKTIF", per_page: 50 })
      const freshData = res.data ?? []

      setAllUnit(freshData)
      sessionStorage.setItem("all_unit", JSON.stringify(freshData))

      // 3. Update active selection with fresh data
      if (initialSaved) {
        const stillExists = freshData.find(
          (d: DataUnitApiItem) =>
            (d.id_unit ?? d.id) === (initialSaved?.id_unit ?? initialSaved?.id) ||
            d.kode_unit === initialSaved?.kode_unit
        )
        if (stillExists) {
          setSelectedUnitState(stillExists)
          sessionStorage.setItem("selected_unit", JSON.stringify(stillExists))
          return
        }
      }

      setSelectedUnitState(null)
    } catch (err) {
      console.error("Gagal mengambil data unit:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchUnit()
  }, [fetchUnit])

  const selectedKodeUnit = selectedUnit?.kode_unit ?? null

  return (
    <UnitContext.Provider
      value={{
        allUnit,
        selectedUnit,
        selectedKodeUnit,
        setSelectedUnit,
        refetchUnit: fetchUnit,
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
