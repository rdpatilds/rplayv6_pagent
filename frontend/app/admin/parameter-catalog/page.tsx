"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { StructuredParametersManager } from "@/components/parameter-catalog/structured-parameters-manager"
import { GuardrailsParametersManager } from "@/components/parameter-catalog/guardrails-parameters-manager"
import { ResetParameterCatalog } from "@/components/parameter-catalog/reset-parameter-catalog"
import { NarrativeParametersManager } from "@/components/parameter-catalog/narrative-parameters-manager"



export default function ParameterCatalogPage() {
  const [activeTab, setActiveTab] = useState("structured")
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const handleSaveAllChanges = () => {
    toast({
      title: "Changes saved",
      description: "All changes to the parameter catalog have been saved.",
    })
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
    setError(null)
  }

  useEffect(() => {
    // Reset error when tab changes
    setError(null)
  }, [activeTab])

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Global Parameter Catalog</h1>
          <p className="text-gray-500">Define and manage global parameters for client profile generation</p>
          <p className="text-xs text-gray-400">Page ID: GPC-001</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="default"
            className="bg-[rgb(35,15,110)] hover:bg-[rgb(35,15,110)] hover:opacity-90"
            onClick={handleSaveAllChanges}
          >
            Save All Changes
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error}</p>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="mt-2 flex items-center gap-1"
                disabled={isLoading}
              >
                <RefreshCw className="h-3 w-3" />
                {isLoading ? "Retrying..." : "Retry"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Parameter Categories</h2>
        <p className="text-gray-500 text-sm mb-4">Browse and manage parameters by category</p>

        <Tabs defaultValue="structured" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="structured">Structured Parameters</TabsTrigger>
            <TabsTrigger value="narrative">Narrative Parameters</TabsTrigger>
            <TabsTrigger value="guardrails">Guardrails Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="structured">
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-6">
                Structured parameters define discrete values selected from predefined options. These parameters help
                create realistic client profiles with specific demographic and financial characteristics.
              </p>
              <StructuredParametersManager />
            </div>
          </TabsContent>

          <TabsContent value="narrative">
  <div className="mt-4">
    <p className="text-sm text-gray-600 mb-6">
      Narrative parameters define AI-generated content based on guidance and examples. These parameters help
      create realistic client scenarios with authentic narratives that advisors must address.
    </p>
    <NarrativeParametersManager /> {/* ✅ This is the correct new manager */}
  </div>
</TabsContent>

          <TabsContent value="guardrails">
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-6">
                Guardrails parameters define boundaries and limitations for the AI simulation to ensure appropriate and
                realistic client interactions. These parameters help create safe, compliant, and effective training
                scenarios.
              </p>
              <GuardrailsParametersManager />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-4 flex justify-end">
        <ResetParameterCatalog />
      </div>
    </div>
  )
}
