import type React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TooltipWrapperProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  className?: string
}

export function TooltipWrapper({ content, children, side = "top", className = "" }: TooltipWrapperProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className={`max-w-sm z-50 ${className}`} sideOffset={5}>
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
