"use client"

import type React from "react"

import { UserAccountMenu } from "@/components/user-account-menu"
import { AuthProvider, useAuth } from "@/components/auth-provider"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <UserAccountMenuWrapper />
        <div className="flex-1">{children}</div>
      </div>
    </AuthProvider>
  )
}

function UserAccountMenuWrapper() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <UserAccountMenu />
    </div>
  )
}
