"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"

export default function LogoutButton() {
  const { logout } = useAuth()

  return (
    <Button variant="outline" onClick={logout}>
      Logout
    </Button>
  )
}
