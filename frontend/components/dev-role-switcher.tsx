"use client"

import { useState } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserIcon } from "lucide-react"

const testUsers = [
  { email: "brittany.jones+learner@kaplan.com", role: "learner", password: "admin123" },
  { email: "brittany.jones+trainer@kaplan.com", role: "trainer", password: "admin123" },
  { email: "brittany.jones+companyadmin@kaplan.com", role: "company_admin", password: "admin123" },
  { email: "brittany.jones+superadmin@kaplan.com", role: "super_admin", password: "admin123" },
]

export function DevRoleSwitcher() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  const switchRole = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      // Sign out first
      await signOut({ redirect: false })

      // Then sign in as the selected user
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      // Reload the page to update the session
      window.location.reload()
    } catch (error) {
      console.error("Error switching role:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="bg-yellow-100 border-yellow-300 text-yellow-800">
            <UserIcon className="h-4 w-4 mr-2" />
            {session?.user?.role || "Dev Mode"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Switch Test User</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {testUsers.map((user) => (
            <DropdownMenuItem
              key={user.email}
              disabled={isLoading || session?.user?.email === user.email}
              onClick={() => switchRole(user.email, user.password)}
            >
              {user.email} ({user.role}){session?.user?.email === user.email && " ✓"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
