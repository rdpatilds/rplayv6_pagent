"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { Eye } from "lucide-react"
import Link from "next/link"

interface FeedbackSubmissionsProps {
  feedbackData: any[]
}

export function FeedbackSubmissions({ feedbackData }: FeedbackSubmissionsProps) {
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})

  // Toggle comment expansion
  const toggleComment = (id: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Format date
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

  // Get NPS category
  const getNPSCategory = (score: number) => {
    if (score >= 9) return { label: "Promoter", color: "bg-green-500 hover:bg-green-600" }
    if (score >= 7) return { label: "Passive", color: "bg-yellow-500 hover:bg-yellow-600" }
    return { label: "Detractor", color: "bg-red-500 hover:bg-red-600" }
  }

  // Define table columns
  const columns = [
    {
      header: "Date",
      key: "timestamp",
      render: (item: any) => <div className="whitespace-nowrap">{formatDate(item.timestamp)}</div>,
    },
    {
      header: "Simulation ID",
      key: "simulationId",
      render: (item: any) => (
        <div className="font-mono text-xs truncate max-w-[120px]" title={item.simulationId}>
          {item.simulationId}
        </div>
      ),
    },
    {
      header: "User ID",
      key: "userId",
      render: (item: any) => (
        <div className="font-mono text-xs truncate max-w-[120px]" title={item.userId}>
          {item.userId}
        </div>
      ),
    },
    {
      header: "NPS Score",
      key: "score",
      render: (item: any) => {
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
      render: (item: any) => {
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
      header: "Actions",
      key: "actions",
      render: (item: any) => (
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Feedback Submissions</CardTitle>
        <CardDescription>Latest user feedback from simulations</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={feedbackData} />
      </CardContent>
    </Card>
  )
}
