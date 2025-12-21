"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear cookies
    document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

    // Redirect to login
    router.push("/login")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging out...</h1>
        <p>You are being redirected to the login page.</p>
      </div>
    </div>
  )
}
