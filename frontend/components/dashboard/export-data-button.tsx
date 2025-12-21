"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { TooltipWrapper } from "@/components/ui/tooltip-wrapper"
import { TooltipProvider } from "@/components/ui/tooltip"

interface ExportDataButtonProps {
  feedbackData: any[]
  sessionSummaries: any[]
  activeFilter: string | null
}

export function ExportDataButton({ feedbackData, sessionSummaries, activeFilter }: ExportDataButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)

    try {
      // Filter data based on active filter
      let filteredData = feedbackData

      if (activeFilter) {
        filteredData = feedbackData.filter((item) => {
          const comment = item.comment?.toLowerCase() || ""
          return comment.includes(activeFilter.toLowerCase())
        })
      }

      // Create a map of simulationId to engagement score
      const engagementMap = new Map()
      sessionSummaries.forEach((session) => {
        engagementMap.set(session.simulationId, {
          engagementScore: session.engagementScore || 0,
          messagesSent: session.messagesSent || 0,
          objectivesCompleted: session.objectivesCompleted || 0,
        })
      })

      // Prepare data for export
      const exportData = filteredData.map((item) => {
        const engagement = engagementMap.get(item.simulationId) || {}

        // Detect detractor reasons if score is low
        let detractorReasons = []
        if ((item.score || 0) <= 6 && item.comment) {
          detractorReasons = detectDetractorReasons(item.comment)
        }

        return {
          date: item.timestamp ? new Date(item.timestamp).toISOString().split("T")[0] : "N/A",
          npsScore: item.score || 0,
          comment: item.comment || "",
          engagementScore: engagement.engagementScore || 0,
          messagesSent: engagement.messagesSent || 0,
          objectivesCompleted: engagement.objectivesCompleted || 0,
          simulationId: item.simulationId || "N/A",
          userId: item.userId || "N/A",
          detractorReasons: detractorReasons.join(", "),
        }
      })

      // Convert to CSV
      const headers = [
        "Date",
        "NPS Score",
        "Comment",
        "Engagement Score",
        "Messages Sent",
        "Objectives Completed",
        "Simulation ID",
        "User ID",
        "Detractor Reasons",
      ]

      const csvContent = [
        headers.join(","),
        ...exportData.map((row) => {
          return [
            row.date,
            row.npsScore,
            `"${(row.comment || "").replace(/"/g, '""')}"`, // Escape quotes in CSV
            row.engagementScore,
            row.messagesSent,
            row.objectivesCompleted,
            row.simulationId,
            row.userId,
            `"${row.detractorReasons}"`,
          ].join(",")
        }),
      ].join("\n")

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `nps-feedback-export-${new Date().toISOString().split("T")[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error exporting data:", error)
      alert("Failed to export data. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <TooltipProvider>
      <TooltipWrapper content="Export current view to CSV">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={handleExport}
          disabled={isExporting}
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export Data"}
        </Button>
      </TooltipWrapper>
    </TooltipProvider>
  )
}

// Helper function to detect detractor reasons
function detectDetractorReasons(comment) {
  if (!comment) return []

  const lowerComment = comment.toLowerCase()
  const reasons = []

  // Define categories and keywords
  const categories = {
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
