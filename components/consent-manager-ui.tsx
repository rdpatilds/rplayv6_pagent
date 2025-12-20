"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { consentManager } from "@/utils/consent-manager"
import { Shield } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ConsentManagerUIProps {
  showOnLoad?: boolean
}

export function ConsentManagerUI({ showOnLoad = false }: ConsentManagerUIProps) {
  const [open, setOpen] = useState(showOnLoad)
  const [settings, setSettings] = useState(consentManager.getSettings())

  useEffect(() => {
    // Check if this is the first visit
    const isFirstVisit = localStorage.getItem("consent_shown") !== "true"
    if (isFirstVisit && showOnLoad) {
      setOpen(true)
      localStorage.setItem("consent_shown", "true")
    }
  }, [showOnLoad])

  const handleSave = () => {
    consentManager.saveSettings(settings)
    setOpen(false)
  }

  const handleToggle = (key: keyof typeof settings) => {
    setSettings({
      ...settings,
      [key]: !settings[key],
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Privacy & Consent Settings</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics">Analytics</Label>
                <p className="text-sm text-gray-500">
                  Allow collection of usage data to improve the simulation experience
                </p>
              </div>
              <Switch id="analytics" checked={settings.analytics} onCheckedChange={() => handleToggle("analytics")} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="errorLogging">Error Logging</Label>
                <p className="text-sm text-gray-500">Allow logging of errors to help us identify and fix issues</p>
              </div>
              <Switch
                id="errorLogging"
                checked={settings.errorLogging}
                onCheckedChange={() => handleToggle("errorLogging")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="performanceMonitoring">Performance Monitoring</Label>
                <p className="text-sm text-gray-500">
                  Allow monitoring of system performance to optimize the experience
                </p>
              </div>
              <Switch
                id="performanceMonitoring"
                checked={settings.performanceMonitoring}
                onCheckedChange={() => handleToggle("performanceMonitoring")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => setOpen(true)} className="h-8 w-8 rounded-full">
              <Shield className="h-4 w-4" />
              <span className="sr-only">Privacy Settings</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Privacy Settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  )
}
