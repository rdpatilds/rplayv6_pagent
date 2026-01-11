import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Header from "@/components/header"

// Simple function to get user from cookie
function getUserFromCookie() {
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) {
    return null
  }

  // In a real app, you would validate the token and get the user from a database
  // For now, we'll just return a mock user
  return {
    id: "1",
    name: "Test User",
    email: "test@example.com",
    role: "super_admin", // Hardcoded for testing
  }
}

export default function TrainerPage() {
  const user = getUserFromCookie()

  if (!user) {
    redirect("/login")
  }

  // Check if user has trainer role
  if (user.role !== "super_admin" && user.role !== "trainer") {
    redirect("/dashboard")
  }

  return (
    <div>
      <Header user={user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Trainer Dashboard</h1>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Trainer Controls</h2>
          <p>This page is only accessible to trainer and super_admin roles.</p>
        </div>
      </main>
    </div>
  )
}
