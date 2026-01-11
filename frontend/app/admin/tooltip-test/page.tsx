"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle } from "lucide-react"

export default function TooltipTest() {
  return (
    <div className="container py-20">
      <h1 className="text-3xl font-bold mb-10">Tooltip Test Page</h1>

      <div className="space-y-8">
        <div className="p-6 border rounded-lg flex items-center gap-4">
          <span>Hover over this icon:</span>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-6 w-6 text-blue-500 hover:text-blue-700 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="bg-white text-black border border-gray-200 p-3 shadow-lg">
                <p className="font-medium">This is a test tooltip</p>
                <p className="text-sm text-gray-600 mt-1">If you can see this, tooltips are working!</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="p-6 border rounded-lg">
          <p className="mb-4">Alternative tooltip implementation:</p>

          <div className="group relative inline-block">
            <HelpCircle className="h-6 w-6 text-blue-500 hover:text-blue-700 cursor-help" />
            <div className="invisible group-hover:visible absolute left-full ml-2 top-0 w-64 bg-white text-black p-2 rounded shadow-lg border border-gray-200 text-sm">
              This is a CSS-only tooltip that should appear when you hover over the icon.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
