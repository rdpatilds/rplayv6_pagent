"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"

export default function ChangePasswordPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated || !user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to change your password.</div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
    let isValid = true

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required"
      isValid = false
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required"
      isValid = false
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters"
      isValid = false
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password"
      isValid = false
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.field && data.message) {
          setErrors((prev) => ({ ...prev, [data.field]: data.message }))
          throw new Error(data.message)
        }
        throw new Error(data.message || "Failed to change password")
      }

      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      })

      router.push("/account")
    } catch (error) {
      console.error("Error changing password:", error)

      // If no specific field error was set
      if (!Object.values(errors).some((error) => error !== "")) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to change password. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container py-8">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-8">Change Password</h1>
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Change Your Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    {errors.currentPassword && <p className="text-sm text-red-500">{errors.currentPassword}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/account")}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Changing..." : "Change Password"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
