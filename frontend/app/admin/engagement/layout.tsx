import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Engagement Analytics",
  description: "Detailed analytics for user engagement with simulations",
}

export default function EngagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
