"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { tahunAjaranService, TahunAjaranApiItem } from "@/lib/services/tahun-ajaran.service"

interface TahunAjaranContextType {
  allTahunAjaran: TahunAjaranApiItem[]
  selectedTahunAjaran: TahunAjaranApiItem | null
  selectedKodeTahun: string | null
  setSelectedTahunAjaran: (item: TahunAjaranApiItem) => void
  refetchTahunAjaran: () => Promise<void>
  isLoading: boolean
}

const TahunAjaranContext = createContext<TahunAjaranContextType>({
  allTahunAjaran: [],
  selectedTahunAjaran: null,
  selectedKodeTahun: null,
  setSelectedTahunAjaran: () => {},
  refetchTahunAjaran: async () => {},
  isLoading: true,
})

export function TahunAjaranProvider({ children }: { children: React.ReactNode }) {
  const [allTahunAjaran, setAllTahunAjaran] = useState<TahunAjaranApiItem[]>([])
  const [selectedTahunAjaran, setSelectedTahunAjaranState] = useState<TahunAjaranApiItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setSelectedTahunAjaran = useCallback((item: TahunAjaranApiItem) => {
    setSelectedTahunAjaranState(item)
    if (item?.kode_tahun) {
      sessionStorage.setItem("selected_tahun_ajaran", JSON.stringify(item))
    }
  }, [])

  const fetchTahunAjaran = useCallback(async () => {
    try {
      // 1. Initial quick load from cache to prevent layout shift
      const cachedListRaw = sessionStorage.getItem("all_tahun_ajaran")
      const savedRaw = sessionStorage.getItem("selected_tahun_ajaran")
      let initialSaved: TahunAjaranApiItem | null = null

      if (savedRaw) {
        try {
          initialSaved = JSON.parse(savedRaw)
        } catch {
          initialSaved = null
        }
      }

      if (cachedListRaw) {
        try {
          const cachedData: TahunAjaranApiItem[] = JSON.parse(cachedListRaw)
          if (cachedData.length > 0) {
            setAllTahunAjaran(cachedData)
            if (initialSaved) {
              const matched = cachedData.find(
                (d) => (d.id_tahun_ajaran ?? d.id) === (initialSaved?.id_tahun_ajaran ?? initialSaved?.id) || d.kode_tahun === initialSaved?.kode_tahun
              )
              if (matched) setSelectedTahunAjaranState(matched)
            }
          }
        } catch {
          // Ignore cache parse error
        }
      }

      // 2. Always fetch fresh data from API
      const res = await tahunAjaranService.getAll({ per_page: 50 })
      const freshData = res.data ?? []

      setAllTahunAjaran(freshData)
      sessionStorage.setItem("all_tahun_ajaran", JSON.stringify(freshData))

      // 3. Update active selection with fresh data
      if (initialSaved) {
        const stillExists = freshData.find(
          (d: TahunAjaranApiItem) =>
            (d.id_tahun_ajaran ?? d.id) === (initialSaved?.id_tahun_ajaran ?? initialSaved?.id) ||
            d.kode_tahun === initialSaved?.kode_tahun
        )
        if (stillExists) {
          setSelectedTahunAjaranState(stillExists)
          sessionStorage.setItem("selected_tahun_ajaran", JSON.stringify(stillExists))
          return
        }
      }

      // Default: select the AKTIF year if no valid saved selection
      const aktif = freshData.find((d: TahunAjaranApiItem) => d.status === "AKTIF")
      if (aktif) {
        setSelectedTahunAjaranState(aktif)
        sessionStorage.setItem("selected_tahun_ajaran", JSON.stringify(aktif))
      } else if (freshData.length > 0) {
        setSelectedTahunAjaranState(freshData[0])
        sessionStorage.setItem("selected_tahun_ajaran", JSON.stringify(freshData[0]))
      }
    } catch (err) {
      console.error("Gagal mengambil data tahun ajaran:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTahunAjaran()
  }, [fetchTahunAjaran])

  const selectedKodeTahun = selectedTahunAjaran?.kode_tahun ?? null

  return (
    <TahunAjaranContext.Provider
      value={{
        allTahunAjaran,
        selectedTahunAjaran,
        selectedKodeTahun,
        setSelectedTahunAjaran,
        refetchTahunAjaran: fetchTahunAjaran,
        isLoading,
      }}
    >
      {children}
    </TahunAjaranContext.Provider>
  )
}

export function useTahunAjaran() {
  return useContext(TahunAjaranContext)
}
