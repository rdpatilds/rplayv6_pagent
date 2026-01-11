"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertCircle,
  BarChart4,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  Filter,
  HelpCircle,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { NPSTrendChart } from "@/components/dashboard/nps-trend-chart"
import { DetractorReasonsChart } from "@/components/dashboard/detractor-reasons-chart"
import { NPSParticipationCard } from "@/components/dashboard/nps-participation-card"
import { TimeToSubmitCard } from "@/components/dashboard/time-to-submit-card"
import Link from "next/link"

// Types for our feedback data
interface NPSFeedback {
  id: string
  simulationId: string
  userId: string
  score: number
  comment: string | null
  timestamp: string
  engagement?: {
    score: number
    engagementLevel: "Low" | "Moderate" | "High"
    details: {
      objectivesCompleted: number
      helpUsed: boolean
      durationSeconds: number
      messagesSent: number
      notesUsed: boolean
      expertModeUsed: boolean
      totalEvents: number
    }
  }
  hasMismatch?: boolean
  sessionId?: string
}

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

// Helper function to get NPS category
const getNPSCategory = (score: number) => {
  if (score >= 9) return { label: "Promoter", color: "bg-green-500 hover:bg-green-600" }
  if (score >= 7) return { label: "Passive", color: "bg-yellow-500 hover:bg-yellow-600" }
  return { label: "Detractor", color: "bg-red-500 hover:bg-red-600" }
}

// Helper function to get engagement level styling
const getEngagementStyle = (level: "Low" | "Moderate" | "High") => {
  switch (level) {
    case "Low":
      return { color: "bg-red-500 hover:bg-red-600" }
    case "Moderate":
      return { color: "bg-yellow-500 hover:bg-yellow-600" }
    case "High":
      return { color: "bg-green-500 hover:bg-green-600" }
    default:
      return { color: "bg-gray-500 hover:bg-gray-600" }
  }
}

// Helper function to detect mismatches between NPS and engagement
const detectMismatch = (npsScore: number, engagementLevel: "Low" | "Moderate" | "High") => {
  // NPS is Promoter (9-10) but engagement is Low
  if (npsScore >= 9 && engagementLevel === "Low") return true
  // NPS is Detractor (0-6) but engagement is High
  if (npsScore <= 6 && engagementLevel === "High") return true
  return false
}

// Helper function to detect detractor reasons
function detectDetractorReasons(comment: string | null) {
  if (!comment) return []

  const lowerComment = comment.toLowerCase()
  const reasons: string[] = []

  // Define categories and keywords
  const categories: Record<string, string[]> = {
    Confusion: ["confus", "unclear", "didn't understand", "complex", "complicated", "hard to follow"],
    Relevance: ["irrelevant", "not relevant", "not applicable", "doesn't apply", "not useful"],
    "Technical Issues": ["bug", "error", "crash", "froze", "slow", "technical", "glitch"],
    "Content Quality": ["basic", "simple", "shallow", "not detailed", "not enough", "limited"],
    "User Experience": ["interface", "difficult to use", "frustrating", "annoying", "cumbersome", "UX"],
  }

  for (const [category, keywords] of Object.entries(categories)) {
    const hasKeyword = keywords.some((keyword) => lowerComment.includes(keyword.toLowerCase()))
    if (hasKeyword) {
      reasons.push(category)
    }
  }

  return reasons
}

export default function ConsolidatedFeedbackDashboard() {
  const [feedback, setFeedback] = useState<NPSFeedback[]>([])
  const [engagementData, setEngagementData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [engagementFilter, setEngagementFilter] = useState<string>("all")
  const [detractorReasonFilter, setDetractorReasonFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [exporting, setExporting] = useState(false)
  const [dashboardCollapsed, setDashboardCollapsed] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Fetch feedback data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch NPS feedback data
        const feedbackRes = await fetch("/api/feedback/nps")
        if (!feedbackRes.ok) throw new Error(`Error fetching feedback: ${feedbackRes.statusText}`)
        const feedbackData = await feedbackRes.json()

        // Fetch engagement data
        const engagementRes = await fetch("/api/engagement/log")
        if (!engagementRes.ok) throw new Error(`Error fetching engagement data: ${engagementRes.statusText}`)
        const engagementJson = await engagementRes.json()
        setEngagementData(engagementJson.data || [])

        if (feedbackData.success && Array.isArray(feedbackData.data)) {
          // Get the feedback data
          const feedbackItems = [...feedbackData.data]

          // Process engagement data to get session summaries
          const sessionSummaries = processEngagementData(engagementJson.data || [])

          // Create a map of simulationId to engagement data
          const engagementMap = new Map()
          sessionSummaries.forEach((session) => {
            engagementMap.set(session.simulationId, {
              score: session.engagementScore || 0,
              engagementLevel: getEngagementLevel(session.engagementScore || 0),
              details: {
                objectivesCompleted: session.objectivesCompleted || 0,
                helpUsed: session.usedHelp || false,
                durationSeconds: (session.durationMinutes || 0) * 60,
                messagesSent: session.messagesSent || 0,
                notesUsed: session.usedNotes || false,
                expertModeUsed: session.usedExpertMode || false,
                totalEvents: 0, // We don't have this data yet
              },
            })
          })

          // Fetch engagement scores for each feedback entry
          const feedbackWithEngagement = feedbackItems.map((item) => {
            // Use simulationId to get engagement data
            const engagement = engagementMap.get(item.simulationId)

            // Check for mismatch between NPS and engagement
            const hasMismatch = engagement ? detectMismatch(item.score, engagement.engagementLevel) : false

            return {
              ...item,
              engagement,
              hasMismatch,
              sessionId: sessionSummaries.find((session) => session.simulationId === item.simulationId)?.sessionId,
            }
          })

          // Sort by timestamp (newest first) by default
          const sortedFeedback = sortFeedback(feedbackWithEngagement, sortBy, sortDirection)
          setFeedback(sortedFeedback)
        } else {
          throw new Error("Invalid data format received")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load feedback data")
        toast({
          title: "Error",
          description: err.message || "Failed to load feedback data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Helper function to determine engagement level
  const getEngagementLevel = (score: number): "Low" | "Moderate" | "High" => {
    if (score > 70) return "High"
    if (score > 40) return "Moderate"
    return "Low"
  }

  // Process engagement data to get session summaries
  function processEngagementData(engagementData: any[]) {
    const sessionSummaries: any[] = []
    const sessionMap = new Map()

    // Group logs by session ID
    engagementData.forEach((log) => {
      if (!sessionMap.has(log.sessionId)) {
        sessionMap.set(log.sessionId, [])
      }
      sessionMap.get(log.sessionId).push(log)
    })

    // Process each session
    sessionMap.forEach((logs, sessionId) => {
      // Find the summary event
      const summaryEvent = logs.find((log: any) => log.type === "simulation_exit" && log.metadata?.isEngagementSummary)

      if (summaryEvent) {
        sessionSummaries.push({
          sessionId,
          simulationId: summaryEvent.simulationId,
          userId: summaryEvent.userId,
          timestamp: summaryEvent.timestamp,
          durationMinutes: summaryEvent.metadata.timeInSimulationMinutes || 0,
          messagesSent: summaryEvent.metadata.totalMessages || 0,
          objectivesCompleted: summaryEvent.metadata.objectivesCompleted || 0,
          usedHelp: summaryEvent.metadata.usedNeedsHelp || false,
          usedNotes: summaryEvent.metadata.tookNotes || false,
          usedExpertMode: summaryEvent.metadata.usedExpertMode || false,
          exitedEarly: summaryEvent.metadata.exitedEarly || false,
          // Calculate engagement score
          engagementScore: calculateEngagementScoreFromSummary(summaryEvent.metadata),
        })
      }
    })

    return sessionSummaries
  }

  function calculateEngagementScoreFromSummary(metadata: any) {
    let score = 0

    // Time spent > 5 mins = +30 pts
    if ((metadata.timeInSimulationMinutes || 0) > 5) score += 30

    // Objectives completed = +10 pts each
    score += (metadata.objectivesCompleted || 0) * 10

    // Help used = +10 pts
    if (metadata.usedNeedsHelp) score += 10

    // Expert toggle used = +10 pts
    if (metadata.usedExpertMode) score += 10

    // 10 messages sent = +10 pts
    score += Math.floor((metadata.totalMessages || 0) / 10) * 10

    // Notes used = +10 pts
    if (metadata.tookNotes) score += 10

    // Cap at 100
    score = Math.min(score, 100)

    return score
  }

  // Sort feedback based on selected criteria
  const sortFeedback = (data: NPSFeedback[], sortField: string, direction: "asc" | "desc") => {
    return [...data].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "date":
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
        case "nps":
          comparison = a.score - b.score
          break
        case "engagement":
          const scoreA = a.engagement?.score || 0
          const scoreB = b.engagement?.score || 0
          comparison = scoreA - scoreB
          break
        default:
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      }

      return direction === "asc" ? comparison : -comparison
    })
  }

  // Toggle comment expansion
  const toggleComment = (id: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Handle sort change
  const handleSortChange = (value: string) => {
    if (value === sortBy) {
      // Toggle direction if clicking the same field
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortBy(value)
      // Reset to descending for new sort field
      setSortDirection("desc")
    }

    // Sort the feedback data
    setFeedback((prev) =>
      sortFeedback(prev, value, sortBy === value ? (sortDirection === "asc" ? "desc" : "asc") : "desc"),
    )
  }

  // Handle detractor reason click
  const handleReasonClick = (reason: string) => {
    setDetractorReasonFilter(reason)

    // Scroll to the table
    if (tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Clear detractor reason filter
  const clearReasonFilter = () => {
    setDetractorReasonFilter(null)
  }

  // Filter feedback based on active filters
  const filteredFeedback = feedback.filter((item) => {
    // NPS filter
    if (activeFilter !== "all") {
      if (activeFilter === "promoters" && item.score < 9) return false
      if (activeFilter === "passives" && (item.score < 7 || item.score > 8)) return false
      if (activeFilter === "detractors" && item.score > 6) return false
    }

    // Engagement filter
    if (engagementFilter !== "all" && item.engagement) {
      if (engagementFilter === "high" && item.engagement.engagementLevel !== "High") return false
      if (engagementFilter === "moderate" && item.engagement.engagementLevel !== "Moderate") return false
      if (engagementFilter === "low" && item.engagement.engagementLevel !== "Low") return false
    }

    // Detractor reason filter
    if (detractorReasonFilter && item.comment) {
      const reasons = detectDetractorReasons(item.comment)
      if (!reasons.includes(detractorReasonFilter)) return false
    }

    return true
  })

  // Export data to CSV
  const exportToCSV = () => {
    try {
      setExporting(true)

      // Create CSV header row
      const headers = [
        "Date",
        "Simulation ID",
        "User ID",
        "NPS Score",
        "NPS Category",
        "Comment",
        "Engagement Score",
        "Engagement Level",
        "Objectives Completed",
        "Help Used",
        "Duration (seconds)",
        "Messages Sent",
        "Notes Used",
        "Expert Mode Used",
        "Has Mismatch",
        "Detractor Reasons",
      ]

      // Create CSV rows from filtered feedback data
      const rows = filteredFeedback.map((item) => {
        const npsCategory = getNPSCategory(item.score).label
        const engagementScore = item.engagement?.score || "N/A"
        const engagementLevel = item.engagement?.engagementLevel || "N/A"
        const objectivesCompleted = item.engagement?.details?.objectivesCompleted || "N/A"
        const helpUsed = item.engagement?.details?.helpUsed ? "Yes" : "No"
        const durationSeconds = item.engagement?.details?.durationSeconds || "N/A"
        const messagesSent = item.engagement?.details?.messagesSent || "N/A"
        const notesUsed = item.engagement?.details?.notesUsed ? "Yes" : "No"
        const expertModeUsed = item.engagement?.details?.expertModeUsed ? "Yes" : "No"
        const detractorReasons = item.comment ? detectDetractorReasons(item.comment).join(", ") : ""

        return [
          formatDate(item.timestamp),
          item.simulationId,
          item.userId,
          item.score,
          npsCategory,
          item.comment || "",
          engagementScore,
          engagementLevel,
          objectivesCompleted,
          helpUsed,
          durationSeconds,
          messagesSent,
          notesUsed,
          expertModeUsed,
          item.hasMismatch ? "Yes" : "No",
          detractorReasons,
        ]
      })

      // Combine header and rows
      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => {
              // Handle cells that might contain commas by wrapping in quotes
              if (typeof cell === "string" && (cell.includes(",") || cell.includes('"') || cell.includes("\n"))) {
                return `"${cell.replace(/"/g, '""')}"`
              }
              return cell
            })
            .join(","),
        ),
      ].join("\n")

      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

      // Create a download link and trigger the download
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `nps-feedback-export-${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: `Exported ${filteredFeedback.length} feedback entries to CSV`,
      })
    } catch (err: any) {
      console.error("Error exporting data:", err)
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  // Calculate NPS metrics
  const calculateAverageNPS = (data: NPSFeedback[]) => {
    if (data.length === 0) return 0
    const sum = data.reduce((acc, item) => acc + item.score, 0)
    return sum / data.length
  }

  // Calculate NPS using the standard formula: (% promoters - % detractors) * 100
  const calculateNPS = (data: NPSFeedback[]) => {
    if (data.length === 0) return 0

    const promoters = data.filter((item) => item.score >= 9).length
    const detractors = data.filter((item) => item.score <= 6).length
    const total = data.length

    const promoterPercentage = promoters / total
    const detractorPercentage = detractors / total

    return Math.round((promoterPercentage - detractorPercentage) * 100)
  }

  const calculateNPSDistribution = (data: NPSFeedback[]) => {
    const total = data.length
    if (total === 0) return { promoters: 0, passives: 0, detractors: 0 }

    const promoters = data.filter((item) => item.score >= 9).length
    const passives = data.filter((item) => item.score >= 7 && item.score <= 8).length
    const detractors = data.filter((item) => item.score <= 6).length

    return {
      promoters: Math.round((promoters / total) * 100),
      passives: Math.round((passives / total) * 100),
      detractors: Math.round((detractors / total) * 100),
    }
  }

  // Define table columns
  const columns = [
    {
      header: "Date",
      key: "timestamp",
      render: (item: NPSFeedback) => <div className="whitespace-nowrap">{formatDate(item.timestamp)}</div>,
    },
    {
      header: "Simulation ID",
      key: "simulationId",
      render: (item: NPSFeedback) => (
        <div className="font-mono text-xs truncate max-w-[120px]" title={item.simulationId}>
          {item.simulationId}
        </div>
      ),
    },
    {
      header: "User ID",
      key: "userId",
      render: (item: NPSFeedback) => (
        <div className="font-mono text-xs truncate max-w-[120px]" title={item.userId}>
          {item.userId}
        </div>
      ),
    },
    {
      header: "NPS Score",
      key: "score",
      render: (item: NPSFeedback) => {
        const category = getNPSCategory(item.score)
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold">{item.score}</span>
            <Badge className={category.color}>{category.label}</Badge>
          </div>
        )
      },
    },
    {
      header: "Comment",
      key: "comment",
      render: (item: NPSFeedback) => {
        if (!item.comment) return <span className="text-gray-400 italic">No comment</span>

        const isExpanded = expandedComments[item.id]
        const isLong = item.comment.length > 100

        return (
          <div>
            <div className={isLong && !isExpanded ? "line-clamp-2" : ""}>{item.comment}</div>
            {isLong && (
              <Button variant="link" size="sm" className="p-0 h-auto mt-1" onClick={() => toggleComment(item.id)}>
                {isExpanded ? "Show Less" : "Show More"}
              </Button>
            )}
          </div>
        )
      },
    },
    {
      header: "Engagement",
      key: "engagement",
      render: (item: NPSFeedback) => {
        if (!item.engagement) {
          return <span className="text-gray-400 italic">Pending...</span>
        }

        const { score, engagementLevel } = item.engagement
        const style = getEngagementStyle(engagementLevel)

        return (
          <div className="flex items-center gap-2">
            <span className="font-bold">{score}</span>
            <Badge className={style.color}>{engagementLevel}</Badge>
          </div>
        )
      },
    },
    {
      header: "Detractor Reasons",
      key: "detractorReasons",
      render: (item: NPSFeedback) => {
        if (!item.comment || item.score > 6) return null

        const reasons = detectDetractorReasons(item.comment)
        if (reasons.length === 0) return null

        return (
          <div className="flex flex-wrap gap-1">
            {reasons.map((reason, index) => (
              <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => handleReasonClick(reason)}>
                {reason}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      header: "Flags",
      key: "flags",
      render: (item: NPSFeedback) => {
        if (item.hasMismatch) {
          return (
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-5 w-5 text-amber-500 hover:text-amber-600 transition-colors cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-white text-black border border-gray-200 p-2 shadow-lg">
                Mismatch between sentiment and engagement — review recommended
              </TooltipContent>
            </Tooltip>
          )
        }
        return null
      },
    },
    {
      header: "Actions",
      key: "actions",
      render: (item: NPSFeedback) => (
        <div className="flex items-center gap-2">
          {item.sessionId && (
            <Link href={`/admin/engagement/session/${item.sessionId}`}>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="View Session Timeline">
                <Eye className="h-4 w-4" />
                <span className="sr-only">View Session Timeline</span>
              </Button>
            </Link>
          )}
        </div>
      ),
    },
  ]

  // Get session summaries for dashboard components
  const sessionSummaries = processEngagementData(engagementData)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="container py-6">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

        {/* Admin-only notice */}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
          <p className="text-yellow-700">
            <strong>Note:</strong> This is an admin-only page. Future implementation will include proper authentication
            and authorization.
          </p>
        </div>

        {/* Dashboard Section */}
        <Collapsible open={!dashboardCollapsed} onOpenChange={(open) => setDashboardCollapsed(!open)}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm">
                  {dashboardCollapsed ? (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" /> Expand Dashboard
                    </>
                  ) : (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" /> Collapse Dashboard
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading || exporting || filteredFeedback.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {exporting ? "Exporting..." : "Export"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToCSV} className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Export to CSV</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <CollapsibleContent>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="w-full h-[200px] animate-pulse bg-muted"></Card>
                ))}
              </div>
            ) : error ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <Tabs defaultValue="nps" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="nps">NPS Overview</TabsTrigger>
                  <TabsTrigger value="engagement">Engagement Overview</TabsTrigger>
                  <TabsTrigger value="correlation">Correlation Insights</TabsTrigger>
                </TabsList>

                <TabsContent value="nps">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Net Promoter Score (NPS)</CardTitle>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="max-w-sm bg-white text-black border border-gray-200 p-2 shadow-lg"
                            >
                              NPS = (% Promoters - % Detractors) × 100. Ranges from -100 to +100. Industry benchmarks
                              for SaaS typically range from +30 to +50. Scores above +50 indicate exceptional customer
                              satisfaction.
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{calculateNPS(feedback)}</div>
                      </CardContent>
                    </Card>

                    <NPSParticipationCard feedbackData={feedback} sessionSummaries={sessionSummaries} />

                    <TimeToSubmitCard feedbackData={feedback} sessionSummaries={sessionSummaries} />

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>NPS Distribution</CardTitle>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm z-50">
                              <p>
                                Breakdown of NPS scores into Promoters (9-10), Passives (7-8), and Detractors (0-6).
                                Focus on converting Passives to Promoters for the biggest NPS impact. High Detractor
                                percentages warrant immediate investigation.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-center">
                          <div>
                            <div className="text-2xl font-bold text-red-500">
                              {calculateNPSDistribution(feedback).detractors}%
                            </div>
                            <div className="text-sm">Detractors</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-yellow-500">
                              {calculateNPSDistribution(feedback).passives}%
                            </div>
                            <div className="text-sm">Passives</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-500">
                              {calculateNPSDistribution(feedback).promoters}%
                            </div>
                            <div className="text-sm">Promoters</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Total Submissions</CardTitle>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm z-50">
                              <p>
                                Total number of NPS feedback submissions received. For reliable insights, aim for at
                                least 100 responses. Low submission counts may indicate response bias and should be
                                interpreted with caution.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{feedback.length}</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3 mb-4">
                    <NPSTrendChart feedbackData={feedback} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <DetractorReasonsChart feedbackData={feedback} onReasonClick={handleReasonClick} />
                  </div>
                </TabsContent>

                <TabsContent value="engagement">
                  {sessionSummaries.length === 0 ? (
                    <Card className="w-full p-6">
                      <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="rounded-full bg-muted p-3">
                          <BarChart4 className="h-6 w-6" />
                        </div>
                        <CardTitle>No engagement data available</CardTitle>
                        <CardDescription>
                          Once users start using simulations, engagement metrics will appear here.
                        </CardDescription>
                      </div>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Average Session Duration</CardTitle>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm z-50">
                                <p>
                                  Average time users spend in simulations. Longer durations typically indicate higher
                                  engagement and interest. However, extremely long sessions might indicate confusion or
                                  difficulty completing objectives. Target 15-30 minutes for optimal learning
                                  experiences.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-bold">
                            {sessionSummaries.length > 0
                              ? (
                                  sessionSummaries.reduce((acc, session) => acc + (session.durationMinutes || 0), 0) /
                                  sessionSummaries.length
                                ).toFixed(1)
                              : "0"}{" "}
                            min
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Average Messages Sent</CardTitle>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm z-50">
                                <p>
                                  Average number of messages sent per simulation session. Higher message counts often
                                  correlate with deeper engagement. Sudden drops may indicate user frustration or
                                  confusion with the conversation flow.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-bold">
                            {sessionSummaries.length > 0
                              ? Math.round(
                                  sessionSummaries.reduce((acc, session) => acc + (session.messagesSent || 0), 0) /
                                    sessionSummaries.length,
                                )
                              : "0"}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Help Feature Usage</CardTitle>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="max-w-sm bg-white text-black border border-gray-200 p-2 shadow-lg"
                              >
                                Percentage of sessions where the help feature was used. High usage (over 50%) may
                                indicate users are struggling with the simulation. Very low usage could mean either
                                excellent UX design or users not knowing the feature exists.
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-4xl font-bold">
                            {sessionSummaries.length > 0
                              ? Math.round(
                                  (sessionSummaries.filter((session) => session.usedHelp).length /
                                    sessionSummaries.length) *
                                    100,
                                )
                              : "0"}
                            %
                          </div>
                          <div className="text-sm text-muted-foreground">of sessions</div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="correlation">
                  {feedback.length === 0 || sessionSummaries.length === 0 ? (
                    <Card className="w-full p-6">
                      <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="rounded-full bg-muted p-3">
                          <BarChart4 className="h-6 w-6" />
                        </div>
                        <CardTitle>Correlation insights coming soon</CardTitle>
                        <CardDescription>
                          As more data is collected, correlation insights will appear here.
                        </CardDescription>
                      </div>
                    </Card>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Mismatch Analysis</CardTitle>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm z-50">
                                <p>
                                  Identifies sessions where NPS and engagement metrics don't align as expected (e.g.,
                                  high engagement but low NPS, or vice versa). These mismatches often reveal valuable
                                  insights about user expectations versus experience and warrant deeper investigation.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <CardDescription>
                            This analysis identifies sessions where NPS scores and engagement metrics don't align as
                            expected.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="text-2xl font-bold">
                                {feedback.filter((item) => item.hasMismatch).length > 0
                                  ? Math.round(
                                      (feedback.filter((item) => item.hasMismatch).length / feedback.length) * 100,
                                    )
                                  : "0"}
                                %
                              </div>
                              <div className="text-sm text-muted-foreground">
                                of sessions have mismatched NPS and engagement
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Feedback Submissions Table */}
        <div ref={tableRef} className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Feedback Submissions</CardTitle>
                  <CardDescription>
                    {detractorReasonFilter
                      ? `Filtered by reason: ${detractorReasonFilter} (${filteredFeedback.length} results)`
                      : `Showing ${filteredFeedback.length} of ${feedback.length} submissions`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {detractorReasonFilter && (
                    <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={clearReasonFilter}>
                      <Filter className="h-4 w-4" />
                      Clear: {detractorReasonFilter}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">NPS Category</label>
                  <Tabs value={activeFilter} onValueChange={setActiveFilter}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="promoters">Promoters (9-10)</TabsTrigger>
                      <TabsTrigger value="passives">Passives (7-8)</TabsTrigger>
                      <TabsTrigger value="detractors">Detractors (0-6)</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Engagement Level</label>
                  <Tabs value={engagementFilter} onValueChange={setEngagementFilter}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="high">High</TabsTrigger>
                      <TabsTrigger value="moderate">Moderate</TabsTrigger>
                      <TabsTrigger value="low">Low</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2 ml-auto">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">
                        Date {sortBy === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                      </SelectItem>
                      <SelectItem value="nps">
                        NPS Score {sortBy === "nps" && (sortDirection === "asc" ? "↑" : "↓")}
                      </SelectItem>
                      <SelectItem value="engagement">
                        Engagement {sortBy === "engagement" && (sortDirection === "asc" ? "↑" : "↓")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Loading state */}
              {loading && (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              )}

              {/* Error state */}
              {error && !loading && (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Retry
                  </Button>
                </div>
              )}

              {/* Data table */}
              {!loading &&
                !error &&
                (filteredFeedback.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          {columns.map((column) => (
                            <th key={column.key} className="text-left p-3 font-medium">
                              {column.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFeedback.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            {columns.map((column) => (
                              <td key={`${item.id}-${column.key}`} className="p-3">
                                {column.render ? column.render(item) : item[column.key]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">No feedback submissions found.</div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
