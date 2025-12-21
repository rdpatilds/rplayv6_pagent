"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, UserIcon, Settings, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function UserAccountMenu() {
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (!isAuthenticated || !user) {
    return null
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await logout()
  }

  // Get initials from name or email
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : user.email.substring(0, 2).toUpperCase()

  // Format account type for display
  const formatAccountType = (accountType: string) => {
    switch (accountType) {
      case "super_admin":
        return "Super Admin"
      case "company_admin":
        return "Company Admin"
      case "trainer":
        return "Trainer"
      case "learner":
        return "Learner"
      default:
        return accountType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <div className="flex items-center mt-1">
              <Badge variant="outline" className="text-xs capitalize">
                {formatAccountType(user.role)}
              </Badge>
            </div>
            {user.job_role && <p className="text-xs leading-none text-muted-foreground mt-1">{user.job_role}</p>}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/account")}>
          <UserIcon className="mr-2 h-4 w-4" />
          <span>My Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/account/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        {(user.role === "super_admin" || user.role === "company_admin") && (
          <DropdownMenuItem onClick={() => router.push("/admin")}>
            <Shield className="mr-2 h-4 w-4" />
            <span>Admin Dashboard</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleSignOut} disabled={isSigningOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
