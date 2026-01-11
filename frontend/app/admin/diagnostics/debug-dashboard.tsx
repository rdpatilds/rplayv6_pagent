"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { EmotionalStateDebugPanel } from "@/components/debug/emotional-state-panel"
import { PerformanceMonitorPanel } from "@/components/debug/performance-monitor-panel"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, ToggleLeft } from "lucide-react"
import { performanceMonitor } from "@/utils/performance-monitor"
import { logger } from "@/utils/logger"

export function DebugDashboard() {
  const [activeTab, setActiveTab] = useState("emotional")
  const [showRawData, setShowRawData] = useState(false)
  const [rawData, setRawData] = useState<any>(null)

  const handleExportData = () => {
    try {
      // Gather all debug data
      const data = {
        performance: performanceMonitor.getReport(),
        logs: logger.getRecentLogs(),
        timestamp: new Date().toISOString(),
        environment: {
          logLevel: process.env.LOG_LEVEL || "info",
          enablePiiDetection: process.env.ENABLE_PII_DETECTION === "true",
          enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === "true",
          nodeEnv: process.env.NODE_ENV,
        },
      }

      // Create a downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `debug-data-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Also set the raw data for viewing
      setRawData(data)
    } catch (error) {
      console.error("Error exporting debug data:", error)
    }
  }

  const toggleRawData = () => {
    if (!showRawData) {
      // If we're showing raw data, refresh it first
      try {
        const data = {
          performance: performanceMonitor.getReport(),
          logs: logger.getRecentLogs(),
          timestamp: new Date().toISOString(),
        }
        setRawData(data)
      } catch (error) {
        console.error("Error gathering debug data:", error)
      }
    }
    setShowRawData(!showRawData)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Diagnostics</h1>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={toggleRawData}>
            <ToggleLeft className="h-4 w-4 mr-2" />
            {showRawData ? "Hide Raw Data" : "View Raw Data"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
          <Button variant="default" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export Debug Data
          </Button>
        </div>
      </div>

      {showRawData ? (
        <Card>
          <CardHeader>
            <CardTitle>Raw Debug Data</CardTitle>
            <CardDescription>Timestamp: {rawData?.timestamp || new Date().toISOString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[600px] text-xs">
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-[400px]">
            <TabsTrigger value="emotional">Emotional State</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="emotional" className="mt-4">
            <EmotionalStateDebugPanel />
          </TabsContent>
          <TabsContent value="performance" className="mt-4">
            <PerformanceMonitorPanel />
          </TabsContent>
        </Tabs>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
          <CardDescription>Current system configuration settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Log Level</h3>
              <p className="text-xl font-bold">{process.env.LOG_LEVEL || "info"}</p>
              <p className="text-sm text-gray-500">Current logging verbosity</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">PII Detection</h3>
              <p className="text-xl font-bold">
                {process.env.ENABLE_PII_DETECTION === "true" ? "Enabled" : "Disabled"}
              </p>
              <p className="text-sm text-gray-500">Privacy protection status</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Performance Monitoring</h3>
              <p className="text-xl font-bold">
                {process.env.ENABLE_PERFORMANCE_MONITORING === "true" ? "Enabled" : "Disabled"}
              </p>
              <p className="text-sm text-gray-500">System performance tracking</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
