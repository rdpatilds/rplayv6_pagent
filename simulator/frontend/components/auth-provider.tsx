"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  role: string
  jobRole?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Check authentication status on mount and when pathname changes
  useEffect(() => {
    console.log("AuthProvider: Checking authentication status")

    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      console.log("AuthProvider: Server-side rendering, skipping auth check")
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      const userData = localStorage.getItem("user")

      console.log("AuthProvider: Token exists:", !!token)
      console.log("AuthProvider: User data exists:", !!userData)

      if (!token || !userData) {
        console.log("AuthProvider: No auth data found")
        setIsAuthenticated(false)
        setLoading(false)

        // Only redirect if on a protected page
        const protectedPaths = ["/dashboard", "/admin", "/simulation", "/profile-generator"]
        const isProtectedPath = protectedPaths.some((path) => pathname?.startsWith(path))

        if (isProtectedPath) {
          console.log("AuthProvider: On protected path, redirecting to login")
          router.push("/login")
        }
        return
      }

      // Parse user data
      try {
        const parsedUser = JSON.parse(userData)
        console.log("AuthProvider: User authenticated:", parsedUser.email)
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("AuthProvider: Error parsing user data:", error)
        setIsAuthenticated(false)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("user")
      }
    } catch (error) {
      console.error("AuthProvider: Error checking auth:", error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }, [pathname, router])

  const login = (token: string, user: User) => {
    console.log("AuthProvider: Logging in user:", user.email)
    localStorage.setItem("auth_token", token)
    localStorage.setItem("user", JSON.stringify(user))
    setUser(user)
    setIsAuthenticated(true)
  }

  const logout = () => {
    console.log("AuthProvider: Logging out user")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user")
    setUser(null)
    setIsAuthenticated(false)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
