"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

export default function AdminDashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?redirect=/admin")
      } else if (user.role !== "super_admin" && user.role !== "company_admin") {
        router.push("/dashboard")
      } else {
        // Redirect to the main admin page
        router.push("/admin")
      }
    }
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <p>Taking you to the admin dashboard</p>
      </div>
    </div>
  )
}
