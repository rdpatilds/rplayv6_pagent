"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { feedbackApi } from "@/lib/api"

interface NPSFeedbackProps {
  simulationId: string
  userId: string
}

export function NPSFeedback({ simulationId, userId }: NPSFeedbackProps) {
  const [score, setScore] = useState<number>(5)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Check if feedback has already been submitted for this simulation
  useEffect(() => {
    const feedbackKey = `nps_feedback_${simulationId}`
    const hasAlreadySubmitted = sessionStorage.getItem(feedbackKey) === "submitted"

    if (hasAlreadySubmitted) {
      setShowForm(false)
    }
  }, [simulationId])

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Check if user is authenticated (has a valid token)
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

      if (authToken) {
        // User is authenticated, save feedback to database
        await feedbackApi.create({
          simulationId,
          userId,
          rating: score * 10, // Convert 0-10 scale to 0-100
          comments: comment.trim() || undefined,
          feedbackType: "user_submitted",
        })
      } else {
        // User is not authenticated (frontend-only mode), just log locally
        console.log('[Feedback] Submitted in frontend-only mode (not saved to database)')
      }

      // Mark as submitted in session storage
      sessionStorage.setItem(`nps_feedback_${simulationId}`, "submitted")
      setShowForm(false)

      toast({
        title: "Thank you for your feedback!",
        description: "We use every submission to improve the experience.",
      })

      // Redirect to dashboard immediately
      router.push("/")
    } catch (error) {
      console.error("Error submitting feedback:", error)

      // Even if feedback submission fails, still navigate to dashboard
      // Mark as submitted so user doesn't see the form again
      sessionStorage.setItem(`nps_feedback_${simulationId}`, "submitted")
      setShowForm(false)

      toast({
        title: "Feedback noted!",
        description: "Redirecting to dashboard...",
      })

      // Redirect to dashboard even on error
      router.push("/")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    // Mark as skipped in session storage
    sessionStorage.setItem(`nps_feedback_${simulationId}`, "skipped")
    setShowForm(false)
    router.push("/")
  }

  if (!showForm) {
    return null
  }

  return (
    <Card className="w-full mx-auto mb-8">
      <CardHeader>
        <CardTitle>Your Feedback Matters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="font-medium">How likely are you to recommend this simulation to a colleague?</label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={score}
              onChange={(e) => setScore(Number.parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>0 - Not Likely</span>
              <span>10 - Extremely Likely</span>
            </div>
            <div className="text-center font-medium">Selected: {score}</div>
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor="comment" className="font-medium">
            Tell us what worked well or what could be better (optional)
          </label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Your thoughts help us improve..."
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleSkip} disabled={isSubmitting}>
          Skip
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </CardFooter>
    </Card>
  )
}
