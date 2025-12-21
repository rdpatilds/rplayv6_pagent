"use client"

import Link from "next/link"
import { useAuth } from "./auth-provider"
import { Button } from "./ui/button"

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return null
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-xl font-bold">
            Simulation System
          </Link>

          <nav className="hidden md:flex space-x-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>

            {user?.role === "super_admin" && (
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                Admin
              </Link>
            )}

            <Link href="/simulation/setup" className="text-gray-600 hover:text-gray-900">
              Simulations
            </Link>

            <Link href="/profile-generator" className="text-gray-600 hover:text-gray-900">
              Profiles
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <span className="hidden md:inline text-sm text-gray-600">
            {user?.name} ({user?.role})
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
