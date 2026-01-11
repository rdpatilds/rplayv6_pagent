"use client"

import React from "react"
import { useState, useRef, useEffect, type ReactNode } from "react"
import { useInterfaceMode } from "@/context/interface-mode-context"
import { useRouter } from "next/navigation"
import { GraduationCap, Settings } from "lucide-react"

interface DraggableControlsProps {
  children: ReactNode
  initialPosition?: { x: number; y: number }
}

export default function DraggableControls({ children, initialPosition = { x: 20, y: 20 } }: DraggableControlsProps) {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const controlRef = useRef<HTMLDivElement>(null)
  const { mode, setMode } = useInterfaceMode()
  const router = useRouter()

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!controlRef.current) return

    const rect = controlRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsDragging(true)
  }

  // Handle mouse move during dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      // Calculate new position
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y

      // Keep within viewport bounds
      const maxX = window.innerWidth - (controlRef.current?.offsetWidth || 0)
      const maxY = window.innerHeight - (controlRef.current?.offsetHeight || 0)

      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)

      // Save position to localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("controlsPosition", JSON.stringify(position))
      }
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragOffset, position])

  // Load saved position on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPosition = localStorage.getItem("controlsPosition")
      if (savedPosition) {
        try {
          setPosition(JSON.parse(savedPosition))
        } catch (e) {
          console.error("Failed to parse saved position", e)
        }
      }
    }
  }, [])

  // Toggle between modes
  const handleToggle = () => {
    const newMode = mode === "admin" ? "student" : "admin"
    setMode(newMode)
    router.push(newMode === "admin" ? "/admin" : "/")
  }

  return (
    <div
      ref={controlRef}
      className="fixed z-50 flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 rounded-full shadow-md cursor-move border border-gray-200 dark:border-gray-700"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={(e) => {
        if (!controlRef.current) return
        const touch = e.touches[0]
        const rect = controlRef.current.getBoundingClientRect()
        setDragOffset({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        })
        setIsDragging(true)
      }}
    >
      {/* First child (privacy icon) */}
      {React.Children.toArray(children)[0]}

      {/* Simple Mode Toggle with Visual Indicators */}
      <div className="flex items-center space-x-1 ml-2" onClick={(e) => e.stopPropagation()}>
        {/* Admin Icon (static visual indicator) */}
        <Settings className="h-4 w-4 text-gray-600 dark:text-gray-300" />

        {/* Toggle Switch */}
        <div
          className="relative w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer mx-1"
          onClick={handleToggle}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 bg-white dark:bg-gray-800 rounded-full shadow-md transition-all duration-300 ${
              mode === "admin" ? "left-0.5" : "left-5"
            }`}
          />
        </div>

        {/* Student Icon (static visual indicator) */}
        <GraduationCap className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      </div>

      {/* Remaining children */}
      {React.Children.toArray(children).slice(1)}
    </div>
  )
}
