"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useToast } from "@/hooks/use-toast"
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Clock,
  FileSpreadsheet,
  MessageSquare,
  MousePointer,
  HelpCircle,
  FileText,
  CheckCircle,
  Eye,
  EyeOff,
  RotateCw,
  Lightbulb,
  Pencil,
  Search,
  Filter,
} from "lucide-react"
import { apiClient } from "@/lib/api"

// Types for our engagement data
interface EngagementEvent {
  type: string
  timestamp: string
  sessionId: string
  simulationId?: string
  userId?: string
  metadata?: Record<string, any>
  receivedAt?: string
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
    second: "2-digit",
  }).format(date)
}

// Helper function to format time difference
const formatTimeDifference = (startTime: string, endTime: string) => {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const diffMs = end - start

  if (diffMs < 1000) {
    return `${diffMs}ms`
  } else if (diffMs < 60000) {
    return `${Math.round(diffMs / 1000)}s`
  } else {
    const minutes = Math.floor(diffMs / 60000)
    const seconds = Math.floor((diffMs % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }
}

// Helper function to get event icon
const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case "simulation_load":
      return <Eye className="h-4 w-4" />
    case "simulation_exit":
      return <EyeOff className="h-4 w-4" />
    case "help_opened":
      return <HelpCircle className="h-4 w-4" />
    case "help_closed":
      return <HelpCircle className="h-4 w-4" />
    case "objective_completed":
      return <CheckCircle className="h-4 w-4" />
    case "message_sent":
      return <MessageSquare className="h-4 w-4" />
    case "tab_switch":
      return <RotateCw className="h-4 w-4" />
    case "expert_mode_toggle":
      return <Lightbulb className="h-4 w-4" />
    case "feedback_toggle":
      return <Eye className="h-4 w-4" />
    case "note_created":
      return <FileText className="h-4 w-4" />
    case "note_updated":
      return <Pencil className="h-4 w-4" />
    case "note_section_toggled":
      return <FileText className="h-4 w-4" />
    case "note_analyzed":
      return <Search className="h-4 w-4" />
    case "session_idle":
      return <Clock className="h-4 w-4" />
    case "session_active":
      return <MousePointer className="h-4 w-4" />
    default:
      return <MousePointer className="h-4 w-4" />
  }
}

// Helper function to get event color
const getEventColor = (eventType: string) => {
  switch (eventType) {
    case "simulation_load":
      return "bg-green-100 text-green-800 border-green-300"
    case "simulation_exit":
      return "bg-red-100 text-red-800 border-red-300"
    case "help_opened":
      return "bg-blue-100 text-blue-800 border-blue-300"
    case "help_closed":
      return "bg-blue-50 text-blue-600 border-blue-200"
    case "objective_completed":
      return "bg-green-100 text-green-800 border-green-300"
    case "message_sent":
      return "bg-purple-100 text-purple-800 border-purple-300"
    case "tab_switch":
      return "bg-gray-100 text-gray-800 border-gray-300"
    case "expert_mode_toggle":
      return "bg-amber-100 text-amber-800 border-amber-300"
    case "feedback_toggle":
      return "bg-indigo-100 text-indigo-800 border-indigo-300"
    case "note_created":
    case "note_updated":
    case "note_section_toggled":
    case "note_analyzed":
      return "bg-teal-100 text-teal-800 border-teal-300"
    case "session_idle":
      return "bg-gray-100 text-gray-800 border-gray-300"
    case "session_active":
      return "bg-green-100 text-green-800 border-green-300"
    default:
      return "bg-gray-100 text-gray-800 border-gray-300"
  }
}

// Helper function to get human-readable event name
const getEventName = (eventType: string) => {
  switch (eventType) {
    case "simulation_load":
      return "Simulation Started"
    case "simulation_exit":
      return "Simulation Ended"
    case "help_opened":
      return "Help Opened"
    case "help_closed":
      return "Help Closed"
    case "objective_completed":
      return "Objective Completed"
    case "message_sent":
      return "Message Sent"
    case "tab_switch":
      return "Tab Switched"
    case "expert_mode_toggle":
      return "Expert Mode Toggled"
    case "feedback_toggle":
      return "Feedback Toggled"
    case "note_created":
      return "Notes Created"
    case "note_updated":
      return "Notes Updated"
    case "note_section_toggled":
      return "Notes Section Toggled"
    case "note_analyzed":
      return "Notes Analyzed"
    case "session_idle":
      return "Session Idle"
    case "session_active":
      return "Session Active"
    default:
      return eventType
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
  }
}

// Helper function to get event description
const getEventDescription = (event: EngagementEvent) => {
  switch (event.type) {
    case "message_sent":
      return `Message length: ${event.metadata?.messageLength || "Unknown"} characters`
    case "objective_completed":
      return `Completed: ${event.metadata?.objectiveName || "Unknown objective"}`
    case "tab_switch":
      return `From ${event.metadata?.fromTab || "unknown"} to ${event.metadata?.toTab || "unknown"}`
    case "expert_mode_toggle":
      return `Expert mode ${event.metadata?.enabled ? "enabled" : "disabled"}`
    case "note_updated":
      return `Note length: ${event.metadata?.noteLength || 0} characters (${event.metadata?.changeSize || 0} changed)`
    case "note_analyzed":
      return `Analysis: ${event.metadata?.hasStructure ? "Structured" : "Unstructured"} notes, ${event.metadata?.topicCategories?.length || 0} topics identified`
    case "simulation_exit":
      if (event.metadata?.isEngagementSummary) {
        return `Session summary: ${event.metadata.totalMessages || 0} messages, ${event.metadata.objectivesCompleted || 0} objectives completed`
      }
      return "User exited the simulation"
    default:
      return ""
  }
}

export default function SessionTimelinePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const sessionId = params.sessionId as string

  const [events, setEvents] = useState<EngagementEvent[]>([])
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({})
  const [filterType, setFilterType] = useState<string | null>(null)
  const [exportingData, setExportingData] = useState(false)

  // Fetch session data
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setLoading(true)

        // Fetch engagement events for this session
        const response = await apiClient.get(`/api/engagement/log?sessionId=${sessionId}`)

        if (response.data.success && Array.isArray(response.data.data)) {
          // Sort events by timestamp
          const sortedEvents = [...response.data.data].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
          )

          setEvents(sortedEvents)

          // Extract session info from the events
          if (sortedEvents.length > 0) {
            const firstEvent = sortedEvents[0]
            const lastEvent = sortedEvents[sortedEvents.length - 1]
            const duration = new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime()

            // Find the summary event if it exists
            const summaryEvent = sortedEvents.find(
              (event) => event.type === "simulation_exit" && event.metadata?.isEngagementSummary,
            )

            setSessionInfo({
              sessionId,
              simulationId: firstEvent.simulationId || "Unknown",
              userId: firstEvent.userId || "Unknown",
              startTime: firstEvent.timestamp,
              endTime: lastEvent.timestamp,
              duration: duration,
              eventCount: sortedEvents.length,
              summary: summaryEvent?.metadata || null,
            })
          }
        } else {
          throw new Error("Invalid data format received")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load session data")
        toast({
          title: "Error",
          description: err.message || "Failed to load session data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (sessionId) {
      fetchSessionData()
    }
  }, [sessionId, toast])

  // Toggle event expansion
  const toggleEvent = (index: number) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  // Filter events by type
  const filteredEvents = filterType ? events.filter((event) => event.type === filterType) : events

  // Clear filter
  const clearFilter = () => {
    setFilterType(null)
  }

  // Set filter
  const setFilter = (type: string) => {
    setFilterType(type)
  }

  // Export session data to CSV
  const exportToCSV = () => {
    try {
      setExportingData(true)

      // Create CSV header row
      const headers = ["Timestamp", "Event Type", "Event Name", "Simulation ID", "User ID", "Description", "Metadata"]

      // Create CSV rows from events
      const rows = filteredEvents.map((event) => {
        return [
          event.timestamp,
          event.type,
          getEventName(event.type),
          event.simulationId || "",
          event.userId || "",
          getEventDescription(event),
          event.metadata ? JSON.stringify(event.metadata) : "",
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
      link.setAttribute("download", `session-timeline-${sessionId}-${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Export Successful",
        description: `Exported ${filteredEvents.length} events to CSV`,
      })
    } catch (err: any) {
      console.error("Error exporting data:", err)
      toast({
        title: "Export Failed",
        description: err.message || "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setExportingData(false)
    }
  }

  // Get unique event types for filtering
  const eventTypes = [...new Set(events.map((event) => event.type))]

  return (
    <div className="container py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Session Timeline</h1>
      </div>

      {/* Admin-only notice */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
        <p className="text-yellow-700">
          <strong>Note:</strong> This is an admin-only page. Future implementation will include proper authentication
          and authorization.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Session Overview Card */}
          {sessionInfo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Session Overview</CardTitle>
                <CardDescription>Details about this engagement session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Session ID</h3>
                    <p className="font-mono text-sm">{sessionInfo.sessionId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Simulation ID</h3>
                    <p className="font-mono text-sm">{sessionInfo.simulationId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">User ID</h3>
                    <p className="font-mono text-sm">{sessionInfo.userId}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Start Time</h3>
                    <p className="text-sm">{formatDate(sessionInfo.startTime)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">End Time</h3>
                    <p className="text-sm">{formatDate(sessionInfo.endTime)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                    <p className="text-sm">
                      {Math.floor(sessionInfo.duration / 60000)} minutes{" "}
                      {Math.floor((sessionInfo.duration % 60000) / 1000)} seconds
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Total Events</h3>
                    <p className="text-sm">{sessionInfo.eventCount}</p>
                  </div>

                  {sessionInfo.summary && (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Messages Sent</h3>
                        <p className="text-sm">{sessionInfo.summary.totalMessages || 0}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Objectives Completed</h3>
                        <p className="text-sm">{sessionInfo.summary.objectivesCompleted || 0}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Help Used</h3>
                        <p className="text-sm">{sessionInfo.summary.usedNeedsHelp ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Notes Used</h3>
                        <p className="text-sm">{sessionInfo.summary.tookNotes ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Expert Mode Used</h3>
                        <p className="text-sm">{sessionInfo.summary.usedExpertMode ? "Yes" : "No"}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Event Timeline</CardTitle>
                  <CardDescription>
                    {filterType
                      ? `Filtered by event type: ${getEventName(filterType)} (${filteredEvents.length} events)`
                      : `Showing all ${filteredEvents.length} events`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {filterType && (
                    <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={clearFilter}>
                      <Filter className="h-4 w-4" />
                      Clear Filter
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={exportToCSV}
                    disabled={exportingData || filteredEvents.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {exportingData ? "Exporting..." : "Export CSV"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Event Type Filter */}
              <div className="mb-6 overflow-x-auto">
                <div className="flex gap-2 pb-2">
                  {eventTypes.map((type) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className={`cursor-pointer ${filterType === type ? getEventColor(type) : ""}`}
                      onClick={() => setFilter(type)}
                    >
                      {getEventIcon(type)}
                      <span className="ml-1">{getEventName(type)}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No events found.</div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[22px] top-0 bottom-0 w-[2px] bg-gray-200"></div>

                  {/* Events */}
                  <div className="space-y-4">
                    {filteredEvents.map((event, index) => {
                      const isExpanded = expandedEvents[index] || false
                      const isFirst = index === 0
                      const isLast = index === filteredEvents.length - 1
                      const prevEvent = index > 0 ? filteredEvents[index - 1] : null
                      const timeSincePrev = prevEvent ? formatTimeDifference(prevEvent.timestamp, event.timestamp) : ""

                      return (
                        <div key={index} className="relative">
                          {/* Time since previous event */}
                          {!isFirst && timeSincePrev && (
                            <div className="ml-12 text-xs text-gray-400 mb-1">+{timeSincePrev}</div>
                          )}

                          {/* Event dot */}
                          <div
                            className={`absolute left-0 top-2 w-[10px] h-[10px] rounded-full z-10 ${
                              isFirst ? "bg-green-500" : isLast ? "bg-red-500" : "bg-blue-500"
                            }`}
                          ></div>

                          {/* Event card */}
                          <div className="ml-12">
                            <Collapsible open={isExpanded} onOpenChange={() => toggleEvent(index)}>
                              <div className={`border rounded-md p-3 ${getEventColor(event.type)}`}>
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center">
                                    <div className="mr-2">{getEventIcon(event.type)}</div>
                                    <div>
                                      <div className="font-medium">{getEventName(event.type)}</div>
                                      <div className="text-xs">{formatDate(event.timestamp)}</div>
                                    </div>
                                  </div>

                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <ChevronDown
                                        className={`h-4 w-4 transition-transform ${isExpanded ? "transform rotate-180" : ""}`}
                                      />
                                      <span className="sr-only">Toggle details</span>
                                    </Button>
                                  </CollapsibleTrigger>
                                </div>

                                {/* Event description (always visible) */}
                                {getEventDescription(event) && (
                                  <div className="mt-1 text-sm">{getEventDescription(event)}</div>
                                )}

                                <CollapsibleContent>
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <h4 className="text-xs font-medium mb-1">Event Details</h4>
                                    <div className="bg-white bg-opacity-50 rounded p-2 overflow-x-auto">
                                      <pre className="text-xs whitespace-pre-wrap">
                                        {JSON.stringify(event, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
