import type React from "react"
import ProtectedRoute from "@/components/protected-route"
import Sidebar from "@/components/sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
