"use client"

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name}</CardTitle>
            <CardDescription>You are logged in as {user?.role?.replace("_", " ")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Email: {user?.email}</p>
          </CardContent>
        </Card>

        {user?.role === "super_admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
              <CardDescription>Quick access to admin functions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5">
                <li>
                  <a href="/admin/user-management" className="text-blue-500 hover:underline">
                    User Management
                  </a>
                </li>
                <li>
                  <a href="/admin/global-settings" className="text-blue-500 hover:underline">
                    Global Settings
                  </a>
                </li>
                <li>
                  <a href="/admin/industry-settings" className="text-blue-500 hover:underline">
                    Industry Settings
                  </a>
                </li>
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Frequently used pages</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5">
            <li>
                <a href="/simulation/attestation" className="text-blue-500 hover:underline">
                  Start New Simulation
                 </a>
              </li>

              <li>
                <a href="/profile-generator" className="text-blue-500 hover:underline">
                  Profile Generator
                </a>
              </li>
              <li>
                <a href="/account" className="text-blue-500 hover:underline">
                  Account Settings
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
