import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Session Timeline",
  description: "Detailed timeline of user engagement events",
}

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
