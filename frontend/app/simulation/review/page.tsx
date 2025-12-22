"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Download,
  Home,
  RotateCw,
  Trophy,
  CheckCircle,
  Loader2,
  Badge,
  Lightbulb,
  BookOpen,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
  MessageSquare,
  BarChart,
} from "lucide-react"
import Link from "next/link"
import type { PerformanceReview } from "@/app/api/simulation/review-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSafeDifficultyLevel, getDifficultyDisplayName } from "@/utils/difficulty-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { NPSFeedback } from "@/components/nps-feedback"
import { apiClient } from "@/lib/api"

export default function PerformanceReviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [simulationData, setSimulationData] = useState({
    id: "SIM-12345678",
    industry: "Insurance",
    subcategory: "Life & Health",
    difficulty: "Beginner",
    client: "John Smith",
    duration: "00:00",
    date: new Date().toLocaleDateString(),
    totalXp: 0,
    completedObjectives: [],
  })

  const [review, setReview] = useState<PerformanceReview>({
    overallScore: 0,
    competencyScores: [],
    generalStrengths: [],
    generalImprovements: [],
    summary: "Loading performance review...",
  })

  const [eventTimestamps, setEventTimestamps] = useState<
    Array<{
      time: number
      event: string
      competency?: string
      score?: number
      isKey?: boolean
    }>
  >([])

  // Add state for feedback visibility
  const [showFeedback, setShowFeedback] = useState(true)
  const [filteredMessages, setFilteredMessages] = useState([])
  const [messages, setMessages] = useState<any[]>([])

  // Add state for industry metadata
  const [industryMetadata, setIndustryMetadata] = useState({})

  // Add this function to toggle feedback visibility
  const toggleFeedbackVisibility = () => {
    setShowFeedback(!showFeedback)
  }

  // Add this useEffect to load industry metadata
  useEffect(() => {
    const loadIndustryMetadata = async () => {
      try {
        const response = await apiClient.get("/api/competencies/industry")
        setIndustryMetadata(response.data.industryMetadata || {})
      } catch (error) {
        console.error("Error loading industry metadata:", error)
      }
    }

    loadIndustryMetadata()
  }, [])

  useEffect(() => {
    // Load data from session storage
    const xp = sessionStorage.getItem("simulationXp")
    const completedObjectives = sessionStorage.getItem("completedObjectives")
    const simulationId = sessionStorage.getItem("currentSimulationId")
    const industry = sessionStorage.getItem("selectedIndustry")
    const subcategory = sessionStorage.getItem("selectedSubcategory")
    const difficulty = sessionStorage.getItem("selectedDifficulty")
    const startTime = sessionStorage.getItem("simulationStartTime")
    const endTime = sessionStorage.getItem("simulationEndTime")
    const storedMessages = sessionStorage.getItem("simulationMessages")
    const competencies = sessionStorage.getItem("selectedCompetencies")
    const storedTimestamps = sessionStorage.getItem("simulationTimestamps")

    // Load feedback visibility preference
    const feedbackPref = sessionStorage.getItem("showSimulationFeedback")
    if (feedbackPref !== null) {
      setShowFeedback(feedbackPref === "true")
    }

    if (storedTimestamps) {
      try {
        let timestamps = JSON.parse(storedTimestamps)

        // Process timestamps to identify key moments
        // Key moments are: first interaction, significant score changes, and competency-related events
        if (timestamps.length > 0) {
          // Mark the first interaction as key
          if (timestamps.length > 0) {
            timestamps[0].isKey = true
          }

          // Mark events with competency information as key
          timestamps = timestamps.map((event) => ({
            ...event,
            isKey: event.competency ? true : event.isKey || false,
          }))

          // Mark events with significant score changes as key
          let lastScore = -1
          timestamps = timestamps.map((event) => {
            const isSignificantChange = event.score !== undefined && Math.abs((event.score || 0) - lastScore) > 10
            if (event.score !== undefined) {
              lastScore = event.score
            }
            return {
              ...event,
              isKey: event.isKey || isSignificantChange,
            }
          })

          // Filter to only show key events if there are more than 5 events
          if (timestamps.length > 5) {
            // Always include first and last event
            timestamps[0].isKey = true
            timestamps[timestamps.length - 1].isKey = true

            // If we still don't have enough key events, mark some more
            const keyEvents = timestamps.filter((event) => event.isKey)
            if (keyEvents.length < 3) {
              // Mark events at regular intervals
              const interval = Math.floor(timestamps.length / 3)
              for (let i = interval; i < timestamps.length; i += interval) {
                if (i < timestamps.length) {
                  timestamps[i].isKey = true
                }
              }
            }
          } else {
            // If we have 5 or fewer events, mark them all as key
            timestamps = timestamps.map((event) => ({
              ...event,
              isKey: true,
            }))
          }
        }

        setEventTimestamps(timestamps)
      } catch (error) {
        console.error("Error parsing timestamps:", error)
        setError("Failed to load simulation timeline data")
      }
    }

    if (storedMessages) {
      try {
        setMessages(JSON.parse(storedMessages))
      } catch (error) {
        console.error("Error parsing messages:", error)
        setError("Failed to load simulation messages")
      }
    }

    // Calculate duration
    let duration = "00:00"
    if (startTime && endTime) {
      const start = new Date(startTime).getTime()
      const end = new Date(endTime).getTime()
      const durationMs = end - start
      const minutes = Math.floor(durationMs / 60000)
      const seconds = Math.floor((durationMs % 60000) / 1000)
      duration = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    // Update simulation data with session storage values
    setSimulationData((prev) => ({
      ...prev,
      id: simulationId || prev.id,
      industry: getIndustryName(industry) || prev.industry,
      subcategory: getSubcategoryName(industry, subcategory) || prev.subcategory,
      difficulty: getDifficultyName(difficulty) || prev.difficulty,
      duration: duration,
      date: new Date().toLocaleDateString(),
      totalXp: xp ? Number.parseInt(xp) : prev.totalXp,
      completedObjectives: completedObjectives ? JSON.parse(completedObjectives) : prev.completedObjectives,
    }))

    // Generate the performance review
    const generateReview = async () => {
      if (storedMessages && competencies) {
        try {
          const parsedMessages = JSON.parse(storedMessages)
          const parsedCompetencies = JSON.parse(competencies)

          // Use the utility function to safely handle the difficulty level
          const safeDifficultyLevel = getSafeDifficultyLevel(difficulty)

          // Add debug logging
          console.log("Review page difficulty from session:", difficulty)
          console.log("Review page processed difficulty:", safeDifficultyLevel)

          // Filter out any messages from expert mode (if they exist)
          const clientMessages = parsedMessages.filter(
            (msg) =>
              !msg.content.includes("EXPERT MODE") &&
              !msg.content.includes("I'm now in expert mode") &&
              !msg.content.includes("I'm now back in client mode"),
          )

          // Call the API route instead of directly using the server action
          const response = await apiClient.post("/api/simulation/generate-review", {
            messages: clientMessages,
            competencies: parsedCompetencies,
            difficultyLevel: safeDifficultyLevel,
          })

          setReview(response.data)
        } catch (error) {
          console.error("Error generating review:", error)
          setError(`Failed to generate performance review: ${error.message || "Unknown error"}`)

          // Use fallback review data
          setReview({
            overallScore: 5,
            competencyScores: (JSON.parse(competencies) || []).map((comp) => ({
              name: comp.name,
              score: 5,
              strengths: ["Data unavailable"],
              improvements: ["Data unavailable"],
              expectation: "Review generation failed. Please try again later.",
            })),
            generalStrengths: ["Unable to analyze strengths due to technical issues"],
            generalImprovements: ["Unable to analyze improvement areas due to technical issues"],
            summary:
              "We encountered a technical issue while generating your performance review. A simplified review is shown instead. Please try again later or contact support if the issue persists.",
          })
        }
      } else {
        setError("Missing simulation data. Please complete a simulation first.")
      }
      setLoading(false)
    }

    generateReview()
  }, [])

  // Complete simulation in database when review is ready
  useEffect(() => {
    const completeSimulation = async () => {
      try {
        const uuid = sessionStorage.getItem('currentSimulationUUID');

        // Only attempt to save if we have a valid UUID from database
        // Valid UUIDs have format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        if (!uuid || !uuid.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
          console.log('[REVIEW] Running in frontend-only mode (no database session)');
          return;
        }

        // Wait for review to be loaded
        if (loading || review.overallScore === 0) {
          return;
        }

        const xp = sessionStorage.getItem('simulationXp');
        const startTime = sessionStorage.getItem('simulationStartTime');
        const endTime = sessionStorage.getItem('simulationEndTime');

        // Calculate duration in seconds
        let durationSeconds = 0;
        if (startTime && endTime) {
          const start = new Date(startTime).getTime();
          const end = new Date(endTime).getTime();
          durationSeconds = Math.floor((end - start) / 1000);
        }

        console.log('[REVIEW] Completing simulation in database:', { uuid, xp, durationSeconds });

        const { simulationApi } = await import('@/lib/api/simulation-api');

        await simulationApi.complete(uuid, {
          total_xp: parseInt(xp || '0'),
          performance_review: review,
          duration_seconds: durationSeconds
        });

        console.log('[REVIEW] Simulation completed in database');
      } catch (error) {
        // Silently handle - simulation might not be in database (frontend-only mode)
        // This is expected if user started simulation without logging in
        console.log('[REVIEW] Simulation not saved to database (frontend-only mode)');
        // Don't fail - user can still see review
      }
    };

    completeSimulation();
  }, [review, loading])

  // Add a useEffect to filter messages based on feedback visibility
  useEffect(() => {
    if (messages) {
      try {
        const parsedMessages = JSON.parse(JSON.stringify(messages))
        if (showFeedback) {
          setFilteredMessages(parsedMessages)
        } else {
          // Filter out system messages that contain "Advisor progress"
          setFilteredMessages(
            parsedMessages.filter(
              (msg) =>
                !(msg.role === "system" && !msg.content.includes("XP") && msg.content.includes("Advisor progress")),
            ),
          )
        }
      } catch (error) {
        console.error("Error parsing messages:", error)
      }
    }
  }, [showFeedback, messages])

  // Update the getIndustryName function to use the metadata
  const getIndustryName = (industry) => {
    if (industryMetadata && industryMetadata[industry]) {
      return industryMetadata[industry].displayName
    }

    // Fallback to default formatting if metadata is not available
    switch (industry) {
      case "insurance":
        return "Insurance"
      case "wealth-management":
        return "Wealth Management"
      case "securities":
        return "Securities"
      default:
        return industry
          ? industry
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          : "Unknown"
    }
  }

  // Update the getSubcategoryName function to use the metadata
  const getSubcategoryName = (industry, subcategory) => {
    if (
      industryMetadata &&
      industryMetadata[industry] &&
      industryMetadata[industry].subcategories &&
      industryMetadata[industry].subcategories[subcategory]
    ) {
      return industryMetadata[industry].subcategories[subcategory].displayName
    }

    // Fallback to default formatting if metadata is not available
    if (industry !== "insurance" || !subcategory) return ""
    switch (subcategory) {
      case "life-health":
        return "Life & Health"
      case "property-casualty":
        return "Property & Casualty"
      default:
        return subcategory
          ? subcategory
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          : ""
    }
  }

  const getDifficultyName = (difficulty) => {
    return getDifficultyDisplayName(difficulty)
  }

  // Function to export the review as PDF (placeholder)
  const exportReview = () => {
    alert("Export functionality would be implemented here")
  }

  // Add a function to format elapsed time as MM:SS
  const formatElapsedTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "CL"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(35,15,110)]">Performance Review</h1>
          <p className="text-gray-500 mt-2">Simulation ID: {simulationData.id}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportReview}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 text-[rgb(35,15,110)] animate-spin mb-4" />
          <p className="text-lg text-gray-600">Analyzing your performance...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      ) : (
        <Tabs defaultValue="review" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="review" className="flex items-center">
              <BarChart className="h-4 w-4 mr-2" />
              Performance Review
            </TabsTrigger>
            <TabsTrigger value="conversation" className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Full Conversation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="review">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Simulation Summary</CardTitle>
                    <CardDescription>Overview of your simulation session</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium">Industry:</div>
                      <div>
                        {simulationData.industry} {simulationData.subcategory && `- ${simulationData.subcategory}`}
                      </div>

                      <div className="font-medium">Difficulty:</div>
                      <div>{simulationData.difficulty}</div>

                      <div className="font-medium">Duration:</div>
                      <div>{simulationData.duration}</div>

                      <div className="font-medium">Date:</div>
                      <div>{simulationData.date}</div>

                      <div className="font-medium">Overall Score:</div>
                      <div className="font-bold text-[rgb(35,15,110)]">{review.overallScore}/10</div>

                      <div className="font-medium">Total XP Earned:</div>
                      <div className="font-bold text-[rgb(35,15,110)] flex items-center">
                        <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                        {simulationData.totalXp} XP
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Objectives Completed</CardTitle>
                    <CardDescription>Your progress on key objectives</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {simulationData.completedObjectives.length > 0 ? (
                      <div className="space-y-3">
                        {simulationData.completedObjectives.map((objective, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-2 bg-green-50 p-3 rounded-md border border-green-200"
                          >
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            <div>
                              <p className="font-medium">{objective.name}</p>
                              <p className="text-sm text-gray-600">{objective.description}</p>
                              <p className="text-xs text-green-600 mt-1">+{objective.xp} XP</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No objectives were completed during this simulation.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Key Takeaways</CardTitle>
                    <CardDescription>Strengths and areas for improvement</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-green-600 mb-2">Strengths</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {review.generalStrengths && review.generalStrengths.length > 0 ? (
                          review.generalStrengths.map((strength, index) => <li key={index}>{strength}</li>)
                        ) : (
                          <li>No specific strengths identified in this simulation.</li>
                        )}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-amber-600 mb-2">Areas for Improvement</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {review.generalImprovements && review.generalImprovements.length > 0 ? (
                          review.generalImprovements.map((improvement, index) => (
                            <li key={index}>{improvement}</li>
                          ))
                        ) : (
                          <li>No specific improvements identified in this simulation.</li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Key Simulation Moments</CardTitle>
                    <CardDescription>Important points during your simulation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {eventTimestamps
                        .filter((event) => event.isKey)
                        .map((event, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-3 border-l-2 border-[rgb(35,15,110)] pl-4 pb-4"
                          >
                            <div>
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-gray-500" />
                                <span className="font-medium">{formatElapsedTime(event.time)}</span>
                                {event.score && (
                                  <Badge className="ml-2" variant="outline">
                                    {event.score}%
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{event.event}</p>
                              {event.competency && (
                                <p className="text-xs text-[rgb(35,15,110)]">Competency: {event.competency}</p>
                              )}
                            </div>
                          </div>
                        ))}

                      {eventTimestamps.filter((event) => event.isKey).length === 0 && (
                        <p className="text-sm text-gray-500">No key moments were recorded during this simulation.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                    <CardDescription>Overall assessment of your simulation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-end mb-4">
                      <Button onClick={toggleFeedbackVisibility} variant="outline" size="sm" className="text-xs">
                        {showFeedback ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Hide AI Feedback
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Show AI Feedback
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-gray-700 mb-6">{review.summary}</p>

                    <div className="aspect-square max-w-md mx-auto relative mb-8">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-[rgb(35,15,110)]">{review.overallScore}</div>
                          <div className="text-sm text-gray-500">Overall Score</div>
                        </div>
                      </div>
                      <svg viewBox="-20 -20 140 140" className="w-full h-full">
                        {/* Background polygon based on number of competencies */}
                        {review.competencyScores && review.competencyScores.length > 0 && (
                          <>
                            {[0.2, 0.4, 0.6, 0.8, 1].map((scale, idx) => {
                              const i = idx
                              return (
                                <polygon
                                  key={i}
                                  points={review.competencyScores
                                    .map((_, i) => {
                                      const angle = (Math.PI * 2 * i) / review.competencyScores.length - Math.PI / 2
                                      const x = 50 + 30 * scale * Math.cos(angle)
                                      const y = 50 + 30 * scale * Math.sin(angle)
                                      return `${x},${y}`
                                    })
                                    .join(" ")}
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="0.5"
                                />
                              )
                            })}

                            {/* Score polygon */}
                            <polygon
                              points={review.competencyScores
                                .map((comp, i) => {
                                  const angle = (Math.PI * 2 * i) / review.competencyScores.length - Math.PI / 2
                                  const scale = comp.score / 10
                                  const x = 50 + 30 * scale * Math.cos(angle)
                                  const y = 50 + 30 * scale * Math.sin(angle)
                                  return `${x},${y}`
                                })
                                .join(" ")}
                              fill="rgba(35,15,110,0.2)"
                              stroke="rgb(35,15,110)"
                              strokeWidth="1"
                            />

                            {/* Axes */}
                            {review.competencyScores.map((_, i) => {
                              const angle = (Math.PI * 2 * i) / review.competencyScores.length - Math.PI / 2
                              const x = 50 + 35 * Math.cos(angle)
                              const y = 50 + 35 * Math.sin(angle)
                              return <line key={i} x1="50" y1="50" x2={x} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
                            })}

                            {/* Labels with background for better visibility */}
                            {review.competencyScores.map((comp, i) => {
                              const angle = (Math.PI * 2 * i) / review.competencyScores.length - Math.PI / 2
                              const labelDistance = 55 // Increased distance for labels
                              const x = 50 + labelDistance * Math.cos(angle)
                              const y = 50 + labelDistance * Math.sin(angle)

                              // Determine text anchor based on position around the circle
                              const textAnchor =
                                angle > -Math.PI / 4 && angle < Math.PI / 4
                                  ? "start"
                                  : angle > (3 * Math.PI) / 4 || angle < (-3 * Math.PI) / 4
                                    ? "end"
                                    : "middle"

                              // Adjust vertical alignment based on position
                              const verticalAlign = angle > -Math.PI / 2 && angle < Math.PI / 2 ? "hanging" : "auto"

                              // Add slight adjustment to y position based on vertical alignment
                              const yAdjust = verticalAlign === "hanging" ? -2 : 2

                              return (
                                <g key={i}>
                                  {/* Optional: semi-transparent background for text */}
                                  <rect
                                    x={textAnchor === "start" ? x - 1 : textAnchor === "end" ? x - 40 : x - 20}
                                    y={y + yAdjust - 8}
                                    width={textAnchor === "middle" ? 40 : 40}
                                    height={12}
                                    fill="rgba(255,255,255,0.7)"
                                    rx={2}
                                  />
                                  <text
                                    x={x}
                                    y={y + yAdjust}
                                    textAnchor={textAnchor}
                                    dominantBaseline={verticalAlign}
                                    fontSize="3"
                                    fontWeight="500"
                                    fill="#374151"
                                  >
                                    {comp.name}
                                  </text>
                                </g>
                              )
                            })}

                            {/* Score points */}
                            {review.competencyScores.map((comp, i) => {
                              const angle = (Math.PI * 2 * i) / review.competencyScores.length - Math.PI / 2
                              const scale = comp.score / 10
                              const x = 50 + 30 * scale * Math.cos(angle)
                              const y = 50 + 30 * scale * Math.sin(angle)
                              return <circle key={i} cx={x} cy={y} r="1.5" fill="rgb(35,15,110)" />
                            })}
                          </>
                        )}
                      </svg>
                    </div>

                    {/* Detailed Competency Scores */}
                    <div className="space-y-6">
                      {review.competencyScores && review.competencyScores.map((comp, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="font-medium">{comp.name}</div>
                            <div className="font-bold">{comp.score}/10</div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[rgb(35,15,110)] h-2 rounded-full"
                              style={{ width: `${comp.score * 10}%` }}
                            ></div>
                          </div>

                          {/* Performance Expectation based on rubric */}
                          {comp.expectation && (
                            <div className="text-sm bg-gray-50 p-3 rounded-md border border-gray-200 mb-2">
                              <div className="font-medium text-[rgb(35,15,110)]">Performance Level:</div>
                              <div className="text-gray-700">{comp.expectation}</div>
                            </div>
                          )}

                          <div className="text-sm">
                            <div className="font-medium">Strengths:</div>
                            <ul className="list-disc pl-5 text-gray-600">
                              {comp.strengths && comp.strengths.length > 0 ? (
                                comp.strengths.map((strength, idx) => <li key={idx}>{strength}</li>)
                              ) : (
                                <li>No specific strengths identified in this area.</li>
                              )}
                            </ul>
                            <div className="font-medium mt-1">Improvement:</div>
                            <ul className="list-disc pl-5 text-gray-600">
                              {comp.improvements && comp.improvements.length > 0 ? (
                                comp.improvements.map((improvement, idx) => (
                                  <li key={idx}>{improvement}</li>
                                ))
                              ) : (
                                <li>No specific improvements identified in this area.</li>
                              )}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="conversation">
            <Card>
              <CardHeader>
                <CardTitle>Full Conversation</CardTitle>
                <CardDescription>Complete transcript of your simulation session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto p-2">
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 mr-2 mt-1">
                          <AvatarFallback className="bg-[rgb(124,108,167)] text-white">
                            {getInitials(simulationData.client || "Client")}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-[rgb(35,15,110)] text-white"
                            : message.role === "system"
                              ? message.content.includes("XP")
                                ? "bg-yellow-100 text-yellow-800 text-sm italic max-w-none text-center my-2 flex items-center justify-center"
                                : message.isWarning
                                  ? "bg-red-100 text-red-800 text-sm italic max-w-none text-center my-2 flex items-center justify-center"
                                  : "bg-gray-200 text-gray-700 text-sm italic max-w-none text-center my-2"
                              : "bg-white border"
                        }`}
                      >
                        {message.role === "system" && message.content.includes("XP") ? (
                          <div className="flex items-center">
                            <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                            {message.content}
                          </div>
                        ) : message.role === "system" && message.isWarning ? (
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                            {message.content}
                          </div>
                        ) : message.role !== "system" ? (
                          <span
                            dangerouslySetInnerHTML={{
                              __html: message.content
                                .replace(/\[(.*?)\]/g, '<span class="text-gray-500 italic">[$1]</span>')
                                .replace(
                                  /\n\n## (.*?)$/gm,
                                  '<br/><br/><strong class="text-blue-600 text-lg">$1</strong>',
                                )
                                .replace(/^## (.*?)$/gm, '<strong class="text-blue-600 text-lg">$1</strong>')
                                .replace(/\n- (.*?)$/gm, "<br/>• $1")
                                .replace(/^- (.*?)$/gm, "• $1")
                                .replace(/\n\d\. (.*?)$/gm, '<br/><span class="ml-2">$&</span>')
                                .replace(/\n/g, "<br/>"),
                            }}
                          />
                        ) : (
                          message.content
                        )}
                      </div>

                      {message.role === "user" && (
                        <Avatar className="h-8 w-8 ml-2 mt-1">
                          <AvatarFallback className="bg-[rgb(80,63,139)] text-white">ME</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Next Steps Section */}
      <div className="mt-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>Continue improving your skills with these recommended actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border rounded-lg p-4 bg-[rgb(245,240,255)]">
                <div className="flex items-start space-x-4">
                  <div className="bg-[rgb(35,15,110)] rounded-full p-2 text-white">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Practice Your Improvement Areas</h3>
                    <p className="text-gray-600 mt-1">
                      Based on your performance, we've created personalized practice exercises to help you improve in
                      your weaker areas.
                    </p>
                    <div className="mt-4">
                      <Link href="/?tab=resources">
                        <Button className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]">
                          View Recommended Exercises
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <RotateCw className="h-5 w-5 text-[rgb(35,15,110)] mt-0.5" />
                    <div>
                      <h3 className="font-medium">Try Another Simulation</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Practice with a different scenario to broaden your skills.
                      </p>
                      <Link href="/simulation/setup">
                        <Button variant="outline" size="sm" className="mt-2">
                          Start New Simulation
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    <BookOpen className="h-5 w-5 text-[rgb(35,15,110)] mt-0.5" />
                    <div>
                      <h3 className="font-medium">Review Learning Resources</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Access educational materials related to your improvement areas.
                      </p>
                      <Link href="/?tab=resources">
                        <Button variant="outline" size="sm" className="mt-2">
                          View Resources
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between mt-8">
        <Link href="/simulation/session">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Simulation
          </Button>
        </Link>

        <div className="space-x-2">
          <Link href="/simulation/attestation">
            <Button variant="outline">
              <RotateCw className="mr-2 h-4 w-4" />
              New Simulation
            </Button>
          </Link>

          <Link href="/">
            <Button className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* NPS Feedback */}
      <NPSFeedback simulationId={simulationData.id} userId={sessionStorage.getItem("userId") || "anonymous"} />
    </div>
  )
}
