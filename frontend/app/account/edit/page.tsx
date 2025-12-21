"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/components/auth-provider"
import { usersApi } from "@/lib/api"

export default function EditProfilePage() {
  const { user, isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobRole: "",
  })

  useEffect(() => {
    if (user) {
      // Split the name into first and last name
      const nameParts = (user.name || "").split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      setFormData({
        firstName,
        lastName,
        email: user.email,
        jobRole: user.job_role || "",
      })
    }
  }, [user])

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!isAuthenticated || !user) {
    return <div className="flex justify-center items-center min-h-screen">Please log in to edit your profile.</div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await usersApi.update(user.id, {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        jobRole: formData.jobRole,
      })

      // Update the user in localStorage
      const updatedUser = {
        ...user,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        job_role: formData.jobRole,
      }
      localStorage.setItem("user", JSON.stringify(updatedUser))

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      })

      router.push("/account")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format account type for display
  const formatAccountType = (accountType: string) => {
    switch (accountType) {
      case "super_admin":
        return "Super Admin"
      case "company_admin":
        return "Company Admin"
      case "trainer":
        return "Trainer"
      case "learner":
        return "Learner"
      default:
        return accountType.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container py-8">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-8">Edit Profile</h1>
            <Card>
              <form onSubmit={handleSubmit}>
                <CardHeader>
                  <CardTitle>Edit Your Profile</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobRole">Role (Optional)</Label>
                    <Input
                      id="jobRole"
                      name="jobRole"
                      placeholder="e.g. Sales Manager, Customer Service Rep"
                      value={formData.jobRole}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">Your job title or role at your company</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type</Label>
                    <Input
                      id="accountType"
                      name="accountType"
                      value={formatAccountType(user.role)}
                      disabled={true}
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Account type cannot be changed</p>
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
                    {isSubmitting ? "Saving..." : "Save Changes"}
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
