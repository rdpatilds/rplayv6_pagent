"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SimulationAttestation() {
  const router = useRouter()
  const [attestation, setAttestation] = useState("")
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (attestation.trim().toLowerCase() === "i attest") {
      // Proceed to industry selection
      router.push("/simulation/industry-selection")
    } else {
      // Show error message
      setError(true)
      setErrorMessage('Please type "I attest" exactly to proceed.')
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[rgb(35,15,110)]">Simulation Disclaimer</h1>
        <p className="text-gray-500 mt-2">Please review the information below before proceeding</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Important Disclaimer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
            <p>
              This simulation is for educational purposes only to enhance skills like communication, needs assessment,
              and objection handling. It does not provide or substitute specific advice regarding insurance, wealth
              management, or securities. Users should verify all recommendations and strategies with their compliance
              officer or carrier representative to ensure adherence to state regulations and company guidelines.
            </p>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-3">Your Attestation</h3>
            <p className="mb-3">By typing "I Attest" below, you acknowledge that:</p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>You understand this is a training simulation for skill development only</li>
              <li>No specific product recommendations should be made during the simulation</li>
              <li>Any strategies discussed should be verified with your compliance department</li>
              <li>The simulation does not constitute professional advice</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="attestation" className="text-base font-medium">
                Type "I Attest" to continue
              </Label>
              <Input
                id="attestation"
                value={attestation}
                onChange={(e) => {
                  setAttestation(e.target.value)
                  if (error) setError(false)
                }}
                placeholder='Type "I attest" here'
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]">
                Proceed to Simulation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-between">
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
