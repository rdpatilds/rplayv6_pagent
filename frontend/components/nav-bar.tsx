"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function NavBar({ userName }: { userName: string }) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="font-bold text-xl mr-6">Simulation Admin</div>
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Link
            href="/dashboard"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/dashboard") ? "text-black" : "text-muted-foreground"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/users"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/users") ? "text-black" : "text-muted-foreground"
            }`}
          >
            Users
          </Link>
          <Link
            href="/parameters"
            className={`text-sm font-medium transition-colors hover:text-primary ${
              isActive("/parameters") ? "text-black" : "text-muted-foreground"
            }`}
          >
            Parameters
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">Welcome, {userName}</span>
          <form action="/api/logout" method="post">
            <Button variant="outline" size="sm" type="submit">
              Logout
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
