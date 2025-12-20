"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Key, Check, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { testApiKey, setApiKey } from "@/app/api/simulation/actions"
import { apiClient } from "@/lib/api"

export default function ApiSettings() {
  const [apiKey, setApiKeyState] = useState("")
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<null | { success: boolean; message: string }>(null)

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: "API key cannot be empty",
      })
      return
    }

    setIsTesting(true)

    try {
      // Test the API key
      const result = await testApiKey(apiKey)

      setTestResult(result)

      if (result.success) {
        // If the test was successful, store the API key
        await setApiKey(apiKey)

        // In a real implementation, we might also store the API key in a cookie or localStorage
        // for client-side access, but with proper security measures
        localStorage.setItem("simulationApiKeySet", "true") // Just a flag, not the actual key
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "An error occurred while testing the API key",
      })
    } finally {
      setIsTesting(false)
    }
  }

  const triggerProfilePregeneration = async () => {
    try {
      const response = await apiClient.get("/api/profile-pregeneration")
      if (response.data.success) {
        alert("Profile pre-generation completed successfully!")
      } else {
        alert("Profile pre-generation failed: " + response.data.message)
      }
    } catch (error) {
      console.error("Error triggering profile pre-generation:", error)
      alert(error instanceof Error ? error.message : "Error triggering profile pre-generation")
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[rgb(35,15,110)]">OpenAI API Settings</h1>
        <p className="text-gray-500 mt-2">Configure your OpenAI API key for the simulation system</p>
        <div className="text-sm text-gray-400 mt-1">Page ID: API-001</div>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Enter your OpenAI API key to enable AI client simulations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <div className="flex">
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKeyState(e.target.value)}
                placeholder="sk-..."
                className="flex-1"
              />
              <Button
                onClick={handleSaveApiKey}
                className="ml-2 bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]"
                disabled={isTesting}
              >
                {isTesting ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full"></div>
                    Testing
                  </div>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Validate & Save
                  </>
                )}
              </Button>
            </div>

            {testResult && (
              <div
                className={`mt-2 p-2 rounded text-sm flex items-center ${
                  testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}
              >
                {testResult.success ? <Check className="h-4 w-4 mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                {testResult.message}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-md font-medium">API Key Information</h3>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                The OpenAI API key is required for the simulation system to generate realistic client responses. Your
                API key is used to:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Generate client personalities based on your Fusion Model settings</li>
                <li>Create realistic client responses during simulations</li>
                <li>Adapt client behavior based on the selected difficulty level</li>
              </ul>
              <p className="font-medium">Your API key is stored securely and is only used for simulation purposes.</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-md font-medium">Model Settings</h3>
            <div className="text-sm text-gray-600">
              <p>The simulation system uses the following OpenAI model settings:</p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <strong>Model:</strong>
                </div>
                <div>GPT-4o</div>

                <div>
                  <strong>Temperature:</strong>
                </div>
                <div>0.7 (Balanced creativity and consistency)</div>

                <div>
                  <strong>Max Tokens:</strong>
                </div>
                <div>1000 per response</div>

                <div>
                  <strong>Presence Penalty:</strong>
                </div>
                <div>0.6 (Reduces repetition)</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Performance Optimization</h2>
            <p className="text-sm text-gray-500 mb-4">Pre-generate common profiles to improve loading times</p>
            <Button onClick={triggerProfilePregeneration}>Pre-generate Common Profiles</Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/admin/global-settings">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Global Settings
            </Button>
          </Link>
          <Link href="/admin/diagnostics">
            <Button className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]">
              Next: Diagnostics
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
