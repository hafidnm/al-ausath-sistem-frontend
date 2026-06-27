"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface SemesterContextValue {
  semester: number
  setSemester: (s: number) => void
}

const SemesterContext = createContext<SemesterContextValue>({
  semester: 1,
  setSemester: () => {},
})

export function SemesterProvider({ children }: { children: ReactNode }) {
  const [semester, setSemester] = useState<number>(1)
  return (
    <SemesterContext.Provider value={{ semester, setSemester }}>
      {children}
    </SemesterContext.Provider>
  )
}

export function useSemester() {
  return useContext(SemesterContext)
}
