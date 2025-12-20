"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const CustomProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    indicatorColor?: string
    bgColor?: string
  }
>(({ className, value, indicatorColor = "bg-[rgb(35,15,110)]", bgColor = "bg-[rgb(230,225,245)]", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full", bgColor, className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 transition-all", indicatorColor)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
CustomProgress.displayName = ProgressPrimitive.Root.displayName

export { CustomProgress }
