"use client"

import { useAuth } from "@/context/auth-context"

export default function TestAuthPage() {
  const { user, loading, error } = useAuth()

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>
  }

  if (!user) {
    return (
      <div className="p-8">
        Not authenticated. Please{" "}
        <a href="/login" className="text-blue-500 underline">
          login
        </a>
        .
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      <div className="bg-green-100 p-4 rounded mb-4">
        <p className="text-green-700">✅ Authentication successful!</p>
      </div>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">User Information:</h2>
        <pre className="whitespace-pre-wrap">{JSON.stringify(user, null, 2)}</pre>
      </div>
      <div className="mt-4">
        <a href="/api/logout" className="bg-red-500 text-white px-4 py-2 rounded">
          Logout
        </a>
      </div>
    </div>
  )
}
