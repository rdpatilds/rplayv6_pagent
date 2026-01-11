"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface CSVTemplateDownloadProps {
  filename?: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function CSVTemplateDownload({
  filename = "user-import-template.csv",
  variant = "outline",
  size = "default",
  className = "",
}: CSVTemplateDownloadProps) {
  const handleDownload = () => {
    // Create CSV template content
    const headers = "firstName,lastName,email,password,role,jobRole"
    const exampleRow = "John,Doe,john.doe@example.com,password123,learner,Sales Manager"
    const csvContent = `${headers}\n${exampleRow}`

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload} className={className}>
      <Download className="mr-2 h-4 w-4" />
      Download CSV Template
    </Button>
  )
}
