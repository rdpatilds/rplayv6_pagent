"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { performanceMonitor } from "@/utils/performance-monitor"
import { getPIIPerformanceMetrics, resetPIIPerformanceMetrics } from "@/utils/pii-detector"

export function PerformanceMonitorPanel() {
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [piiMetrics, setPiiMetrics] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Fetch performance data
  const fetchPerformanceData = () => {
    try {
      const report = performanceMonitor.getReport()
      setPerformanceData(report)

      const piiReport = getPIIPerformanceMetrics()
      setPiiMetrics(piiReport)
    } catch (error) {
      console.error("Error fetching performance data:", error)
    }
  }

  // Reset performance data
  const resetPerformanceData = () => {
    try {
      performanceMonitor.reset()
      resetPIIPerformanceMetrics()
      fetchPerformanceData()
    } catch (error) {
      console.error("Error resetting performance data:", error)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchPerformanceData, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Initial data fetch
  useEffect(() => {
    fetchPerformanceData()
  }, [])

  if (!performanceData) {
    return <div>Loading performance data...</div>
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Performance Monitor</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPerformanceData}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={resetPerformanceData}>
            Reset
          </Button>
          <Button variant={autoRefresh ? "default" : "outline"} size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? "Auto-refresh: ON" : "Auto-refresh: OFF"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="pii">PII Detection</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <MetricCard
                title="Total Operations"
                value={performanceData.totalOperations.toString()}
                description="Number of operations measured"
              />
              <MetricCard
                title="Average Time"
                value={`${performanceData.overallAverage.toFixed(2)}ms`}
                description="Average time across all operations"
              />
              <MetricCard
                title="Slowest Operation"
                value={
                  performanceData.slowestOperation ? `${performanceData.slowestOperation.time.toFixed(2)}ms` : "N/A"
                }
                description={
                  performanceData.slowestOperation ? performanceData.slowestOperation.name : "No operations recorded"
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="operations">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Operation</th>
                    <th className="text-right py-2">Count</th>
                    <th className="text-right py-2">Avg Time</th>
                    <th className="text-right py-2">Min Time</th>
                    <th className="text-right py-2">Max Time</th>
                    <th className="text-right py-2">Last Time</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(performanceData.metrics).map(([name, metric]: [string, any]) => (
                    <tr key={name} className="border-b hover:bg-gray-50">
                      <td className="py-2">{name}</td>
                      <td className="text-right py-2">{metric.count}</td>
                      <td className="text-right py-2">{metric.avgTime.toFixed(2)}ms</td>
                      <td className="text-right py-2">{metric.minTime.toFixed(2)}ms</td>
                      <td className="text-right py-2">{metric.maxTime.toFixed(2)}ms</td>
                      <td className="text-right py-2">{metric.lastTime.toFixed(2)}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="pii">
            {piiMetrics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <MetricCard
                    title="PII Scans"
                    value={piiMetrics.scanCount.toString()}
                    description="Number of text scans performed"
                  />
                  <MetricCard
                    title="PII Redactions"
                    value={piiMetrics.redactCount.toString()}
                    description="Number of redactions performed"
                  />
                  <MetricCard
                    title="Avg Scan Time"
                    value={`${piiMetrics.averageScanTimeMs.toFixed(2)}ms`}
                    description="Average time to scan for PII"
                  />
                </div>

                <h3 className="text-lg font-medium mt-4">Pattern Match Counts</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(piiMetrics.patternMatchCounts).map(([type, count]: [string, any]) => (
                    <div key={type} className="bg-gray-100 p-3 rounded-md">
                      <div className="text-sm font-medium">{type}</div>
                      <div className="text-2xl font-bold">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>No PII metrics available</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function MetricCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  )
}
