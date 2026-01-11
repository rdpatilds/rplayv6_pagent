"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function UserInfo() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return <div className="text-sm">Loading...</div>
  }

  if (!session?.user) {
    return null
  }

  const { user } = session
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
    : user.email?.substring(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <div className="font-medium">{user.name || user.email}</div>
        <div className="text-xs text-muted-foreground">{user.role}</div>
      </div>
      <Avatar className="h-8 w-8">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
        Sign out
      </Button>
    </div>
  )
}
