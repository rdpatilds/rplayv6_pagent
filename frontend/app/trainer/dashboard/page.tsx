import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TrainerDashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Check if user has trainer or super_admin role
  if (session.user.role !== "trainer" && session.user.role !== "super_admin") {
    redirect("/dashboard")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Trainer Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cohort Management</CardTitle>
            <CardDescription>Manage your training cohorts</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Cohort management features will be implemented soon.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Progress</CardTitle>
            <CardDescription>Track student progress and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Student progress tracking will be implemented soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
