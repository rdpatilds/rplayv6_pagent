"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type InterfaceMode = "student" | "admin"

interface InterfaceModeContextType {
  mode: InterfaceMode
  toggleMode: () => void
  setMode: (mode: InterfaceMode) => void
  isLoading: boolean
}

const InterfaceModeContext = createContext<InterfaceModeContextType | undefined>(undefined)

export function InterfaceModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<InterfaceMode>("student")
  const [isLoading, setIsLoading] = useState(true)

  // Load saved mode from localStorage on initial render
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("interfaceMode") as InterfaceMode
      if (savedMode && (savedMode === "student" || savedMode === "admin")) {
        setModeState(savedMode)
      }
    } catch (error) {
      console.error("Error loading mode from localStorage:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save mode to localStorage when it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem("interfaceMode", mode)
      } catch (error) {
        console.error("Error saving mode to localStorage:", error)
      }
    }
  }, [mode, isLoading])

  const toggleMode = () => {
    setModeState((prevMode) => (prevMode === "student" ? "admin" : "student"))
  }

  const setMode = (newMode: InterfaceMode) => {
    setModeState(newMode)
  }

  return (
    <InterfaceModeContext.Provider value={{ mode, toggleMode, setMode, isLoading }}>
      {children}
    </InterfaceModeContext.Provider>
  )
}

export function useInterfaceMode() {
  const context = useContext(InterfaceModeContext)
  if (context === undefined) {
    throw new Error("useInterfaceMode must be used within an InterfaceModeProvider")
  }
  return context
}
