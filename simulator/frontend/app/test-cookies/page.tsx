"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestCookiesPage() {
  const [cookies, setCookies] = useState<string[]>([])
  const [sessionStatus, setSessionStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get all cookies
    const allCookies = document.cookie.split(";").map((cookie) => cookie.trim())
    setCookies(allCookies)

    // Check session status
    fetch("/api/check-session", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setSessionStatus(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Error checking session:", err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Cookie Test Page</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Browser Cookies</CardTitle>
            <CardDescription>Cookies available in the browser</CardDescription>
          </CardHeader>
          <CardContent>
            {cookies.length === 0 ? (
              <p>No cookies found</p>
            ) : (
              <ul className="list-disc pl-5">
                {cookies.map((cookie, index) => (
                  <li key={index}>{cookie}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Result from /api/check-session</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <pre className="bg-gray-100 p-4 rounded overflow-auto">{JSON.stringify(sessionStatus, null, 2)}</pre>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={() => (window.location.href = "/login")}>Go to Login</Button>
          <Button onClick={() => (window.location.href = "/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    </div>
  )
}
