"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface ProtectedPageProps {
  children: React.ReactNode
  allowedRoles?: ("learner" | "trainer" | "company_admin" | "super_admin")[]
}

export function ProtectedPage({ children, allowedRoles }: ProtectedPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/login")
      return
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
      router.push("/")
    }
  }, [session, status, router, allowedRoles])

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return null
  }

  return <>{children}</>
}
