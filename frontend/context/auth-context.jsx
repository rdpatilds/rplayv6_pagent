"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...")
        const response = await fetch("/api/auth/check", {
          // Add cache: 'no-store' to prevent caching
          cache: "no-store",
          // Add a timestamp to prevent caching
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        // Even if response is not ok, try to parse the JSON
        const data = await response.json().catch(() => ({ authenticated: false }))
        console.log("Auth check response:", data)

        if (data.authenticated) {
          console.log("User is authenticated:", data.user)
          setUser(data.user)
        } else {
          console.log("User is not authenticated")
          setUser(null)

          // If we're on an admin page and not authenticated, redirect to login
          if (window.location.pathname.startsWith("/admin") && !window.location.pathname.includes("/login")) {
            console.log("Redirecting to login page from admin area")
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
        setUser(null)
        setError(`Auth check error: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const login = async (email, password) => {
    try {
      console.log(`Attempting login for: ${email}`)
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json().catch(() => ({ success: false, message: "Invalid response from server" }))
      console.log("Login response:", data)

      if (data.success) {
        console.log("Login successful, setting user:", data.user)
        setUser(data.user)
        return { success: true, user: data.user }
      } else {
        console.log("Login failed:", data.message)
        return { success: false, message: data.message || "Login failed" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "An error occurred during login" }
    }
  }

  const logout = async () => {
    try {
      console.log("Attempting logout")
      const response = await fetch("/api/logout", {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      console.log("Logout response status:", response.status)
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      // Still clear the user state and redirect even if the API call fails
      setUser(null)
      router.push("/login")
    }
  }

  return <AuthContext.Provider value={{ user, loading, error, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
