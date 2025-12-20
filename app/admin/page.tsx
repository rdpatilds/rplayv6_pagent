"use client"

import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AdminPage() {
  const { user } = useAuth()

  if (user?.role !== "super_admin" && user?.role !== "company_admin") {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
        <p>You do not have permission to access the admin area.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage users and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Add, edit, and remove users from the system.</p>
            <div className="mt-4">
              <Link href="/admin/user-management" className="text-blue-500 hover:underline">
                Go to User Management →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Global Settings</CardTitle>
            <CardDescription>Configure system-wide settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Adjust global parameters and system configuration.</p>
            <div className="mt-4">
              <Link href="/admin/global-settings" className="text-blue-500 hover:underline">
                Go to Global Settings →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Industry Settings</CardTitle>
            <CardDescription>Manage industry configurations</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Configure industry-specific parameters and settings.</p>
            <div className="mt-4">
              <Link href="/admin/industry-settings" className="text-blue-500 hover:underline">
                Go to Industry Settings →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Competencies</CardTitle>
            <CardDescription>Manage competency frameworks</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Define and configure competencies for simulations.</p>
            <div className="mt-4">
              <Link href="/admin/competencies" className="text-blue-500 hover:underline">
                Go to Competencies →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Rubrics</CardTitle>
            <CardDescription>Configure assessment rubrics</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Create and manage rubrics for evaluating simulations.</p>
            <div className="mt-4">
              <Link href="/admin/rubrics" className="text-blue-500 hover:underline">
                Go to Rubrics →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
            <CardDescription>View user feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Review and analyze user feedback and ratings.</p>
            <div className="mt-4">
              <Link href="/admin/feedback" className="text-blue-500 hover:underline">
                Go to Feedback →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>API Settings</CardTitle>
            <CardDescription>Manage API configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Configure API keys and integration settings.</p>
            <div className="mt-4">
              <Link href="/admin/api-settings" className="text-blue-500 hover:underline">
                Go to API Settings →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Diagnostics</CardTitle>
            <CardDescription>System diagnostics and debugging</CardDescription>
          </CardHeader>
          <CardContent>
            <p>View system logs and diagnostic information.</p>
            <div className="mt-4">
              <Link href="/admin/diagnostics" className="text-blue-500 hover:underline">
                Go to Diagnostics →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Parameter Catalog</CardTitle>
            <CardDescription>Manage simulation parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Configure and organize simulation parameters.</p>
            <div className="mt-4">
              <Link href="/admin/parameter-catalog" className="text-blue-500 hover:underline">
                Go to Parameter Catalog →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
