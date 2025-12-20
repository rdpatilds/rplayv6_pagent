"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "./auth-provider"

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, logout } = useAuth()

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  // Admin navigation items
  const adminNavItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: "📊",
    },
    {
      title: "Industry Settings",
      href: "/admin/industry-settings",
      icon: "🏭",
    },
    {
      title: "Competencies",
      href: "/admin/competencies",
      icon: "🧠",
    },
    
    {
      title: "Fusion Model",
      href: "/admin/fusion-model",
      icon: "🔄",
    },
    {
      title: "Analytics",
      href: "/admin/feedback",
      icon: "📈",
    },
    {
      title: "User Management",
      href: "/admin/user-management",
      icon: "👥",
    },
    {
      title: "Global Settings",
      href: "/admin/global-settings",
      icon: "⚙️",
    },
    {
      title: "API Settings",
      href: "/admin/api-settings",
      icon: "🔑",
    },
    {
      title: "Diagnostics",
      href: "/admin/diagnostics",
      icon: "🔍",
    },
    {
      title: "Parameter Catalog",
      href: "/admin/parameter-catalog",
      icon: "📝",
    },
    {
      title: "Start Simulation",
      href: "/simulation/attestation",
      icon: "▶️",
    },
    {
      title: "Logout",
      href: "#",
      icon: "🚪",
      onClick: handleLogout,
    },
  ]

  return (
    <div className={`bg-gray-800 text-white transition-all duration-300 h-screen ${isCollapsed ? "w-16" : "w-64"}`}>
      <div className="p-4 flex justify-between items-center">
        {!isCollapsed && <h1 className="text-xl font-bold">Admin Panel</h1>}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded hover:bg-gray-700">
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="mt-6">
        <ul className="space-y-2">
          {adminNavItems.map((item) => (
            <li key={item.href}>
              {item.onClick ? (
                <button
                  onClick={item.onClick}
                  className={`flex items-center w-full p-3 ${isCollapsed ? "justify-center" : "px-4"} ${
                    pathname === item.href ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {!isCollapsed && <span className="ml-3">{item.title}</span>}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center p-3 ${isCollapsed ? "justify-center" : "px-4"} ${
                    pathname === item.href ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {!isCollapsed && <span className="ml-3">{item.title}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
