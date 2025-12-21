import { requireAuth } from "@/lib/auth-utils"
import NavBar from "@/components/nav-bar"
import ParameterTable from "@/components/parameter-table"

export default async function ParametersPage() {
  const session = await requireAuth()
  const { user } = session

  return (
    <div>
      <NavBar userName={user.name || user.email} />

      <main className="container mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Parameter Management</h1>
        <ParameterTable />
      </main>
    </div>
  )
}
