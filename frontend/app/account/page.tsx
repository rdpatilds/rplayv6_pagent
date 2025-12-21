"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { Badge } from "@/components/ui/badge"

export default function AccountPage() {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated || !user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to view your account.</div>
  }

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
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground mb-8">Manage your account settings and preferences</p>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>View and update your profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">Name</h3>
                      <p className="text-sm text-muted-foreground">{user.name || "Not set"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Email</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Account Type</h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground capitalize">{formatAccountType(user.role)}</p>
                        <Badge variant="outline" className="capitalize">
                          {formatAccountType(user.role)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Role</h3>
                      <p className="text-sm text-muted-foreground">{user.job_role || "Not set"}</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button asChild>
                      <Link href="/account/edit">Edit Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage your password and security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Password</h3>
                    <p className="text-sm text-muted-foreground">••••••••</p>
                  </div>
                  <div className="flex justify-end">
                    <Button asChild>
                      <Link href="/account/change-password">Change Password</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {(user.role === "super_admin" || user.role === "company_admin") && (
                <Card>
                  <CardHeader>
                    <CardTitle>Admin Settings</CardTitle>
                    <CardDescription>Manage your organization and users</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="outline">
                        <Link href="/admin/user-management">Manage Users</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/admin/company-settings">Company Settings</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
