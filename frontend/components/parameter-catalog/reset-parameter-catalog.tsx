"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"
import { parametersApi } from "@/lib/api"

interface ResetParameterCatalogProps {
  onSuccess?: () => void
}

export function ResetParameterCatalog({ onSuccess }: ResetParameterCatalogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleReset = async () => {
    try {
      setLoading(true)
      await parametersApi.resetToDefaults()

      toast({
        title: "Parameter catalog reset",
        description: "The parameter catalog has been reset to default values.",
      })

      setOpen(false)
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error resetting parameter catalog:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset parameter catalog. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Reset to Default
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Parameter Catalog</DialogTitle>
            <DialogDescription>
              This will reset all parameter categories and parameters to their default values.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-red-500">
              Warning: This action cannot be undone. All custom categories and parameters will be lost.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-[rgb(35,15,110)] hover:bg-[rgb(35,15,110)]/90"
              onClick={handleReset}
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset to Default"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
