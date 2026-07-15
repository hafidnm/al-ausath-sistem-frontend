"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { tahunAjaranService, TahunAjaranApiItem } from "@/lib/services/tahun-ajaran.service"

interface TahunAjaranContextType {
  allTahunAjaran: TahunAjaranApiItem[]
  selectedTahunAjaran: TahunAjaranApiItem | null
  selectedKodeTahun: string | null
  setSelectedTahunAjaran: (item: TahunAjaranApiItem) => void
  isLoading: boolean
}

const TahunAjaranContext = createContext<TahunAjaranContextType>({
  allTahunAjaran: [],
  selectedTahunAjaran: null,
  selectedKodeTahun: null,
  setSelectedTahunAjaran: () => {},
  isLoading: true,
})

export function TahunAjaranProvider({ children }: { children: React.ReactNode }) {
  const [allTahunAjaran, setAllTahunAjaran] = useState<TahunAjaranApiItem[]>([])
  const [selectedTahunAjaran, setSelectedTahunAjaranState] = useState<TahunAjaranApiItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const setSelectedTahunAjaran = useCallback((item: TahunAjaranApiItem) => {
    setSelectedTahunAjaranState(item)
    // Persist to sessionStorage so it survives page navigation
    if (item?.kode_tahun) {
      sessionStorage.setItem("selected_tahun_ajaran", JSON.stringify(item))
    }
  }, [])

  useEffect(() => {
    const fetchTahunAjaran = async () => {
      try {
        // Cek cache session dulu untuk menghindari request berulang
        const cachedListRaw = sessionStorage.getItem("all_tahun_ajaran")
        const savedRaw = sessionStorage.getItem("selected_tahun_ajaran")
        
        let data = []
        if (cachedListRaw) {
          try {
            data = JSON.parse(cachedListRaw)
            setAllTahunAjaran(data)
          } catch {
            data = []
          }
        }
        
        // Jika tidak ada cache, fetch dari API
        if (data.length === 0) {
          const res = await tahunAjaranService.getAll({ per_page: 50 })
          data = res.data
          setAllTahunAjaran(data)
          sessionStorage.setItem("all_tahun_ajaran", JSON.stringify(data))
        }

        // Try to restore previous selection from sessionStorage
        if (savedRaw) {
          try {
            const saved: TahunAjaranApiItem = JSON.parse(savedRaw)
            const stillExists = data.find(
              (d) => (d.id_tahun_ajaran ?? d.id) === (saved.id_tahun_ajaran ?? saved.id)
            )
            if (stillExists) {
              setSelectedTahunAjaranState(stillExists)
              setIsLoading(false)
              return
            }
          } catch {
            // Ignore parse errors
          }
        }

        // Default: select the AKTIF year
        const aktif = data.find((d) => d.status === "AKTIF")
        if (aktif) {
          setSelectedTahunAjaranState(aktif)
        } else if (data.length > 0) {
          setSelectedTahunAjaranState(data[0])
        }
      } catch (err) {
        console.error("Gagal mengambil data tahun ajaran:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTahunAjaran()
  }, [])

  const selectedKodeTahun = selectedTahunAjaran?.kode_tahun ?? null

  return (
    <TahunAjaranContext.Provider
      value={{
        allTahunAjaran,
        selectedTahunAjaran,
        selectedKodeTahun,
        setSelectedTahunAjaran,
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
