"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function SeedDataPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; stats?: any } | null>(null)

  const handleSeedData = async () => {
    try {
      setIsLoading(true)
      setResult(null)

      const response = await fetch("/api/admin/seed-data", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "Mock data seeded successfully",
          stats: data.stats,
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to seed mock data",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error.message || "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Seed Mock Data</h1>

      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Generate Mock Feedback & Engagement Data</CardTitle>
          <CardDescription>
            This will create realistic mock data for testing the admin dashboard and feedback system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This will generate:</p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>At least 12 NPS feedback submissions (evenly distributed across score ranges)</li>
            <li>Matching engagement logs for each submission</li>
            <li>Realistic comments and interaction patterns</li>
            <li>Mismatched records (high NPS with low engagement and vice versa)</li>
            <li>Data with timestamps from the last 14 days</li>
          </ul>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
            <p className="text-amber-700">
              <strong>Note:</strong> This will overwrite any existing mock data in the system.
            </p>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>

              {result.success && result.stats && (
                <div className="mt-2 text-sm">
                  <p>Generated {result.stats.feedbackEntries} feedback entries</p>
                  <p>Generated {result.stats.engagementLogs} engagement log events</p>
                </div>
              )}
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSeedData} disabled={isLoading} className="w-full">
            {isLoading ? "Generating Mock Data..." : "Generate Mock Data"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
