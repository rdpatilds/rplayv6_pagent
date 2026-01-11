"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { getEmotionalStateStore } from "@/app/profile-generator/emotional-state-store"

export function EmotionalStateDebugPanel() {
  const [emotionalState, setEmotionalState] = useState({
    trust: { current: 50, initial: 50, previous: 50 },
    frustration: { current: 20, initial: 20, previous: 20 },
    openness: { current: 50, initial: 50, previous: 50 },
    engagement: { current: 60, initial: 60, previous: 60 },
    anxiety: { current: 40, initial: 40, previous: 40 },
  })

  const [flags, setFlags] = useState({
    trustBreakthrough: false,
    defensiveReaction: false,
    informationWithheld: false,
    buySignal: false,
    confusionDetected: false,
    concernAddressed: false,
    rapportEstablished: false,
  })

  const [lastUpdate, setLastUpdate] = useState(Date.now())

  useEffect(() => {
    // Poll for emotional state updates
    const interval = setInterval(() => {
      const emotionalStore = getEmotionalStateStore()
      const context = emotionalStore.getContext()

      if (context) {
        const currentState = context.currentState
        const initialState = context.history.states[0]

        setEmotionalState({
          trust: { current: currentState.trust, initial: initialState.trust, previous: emotionalState.trust.current },
          frustration: {
            current: currentState.frustration,
            initial: initialState.frustration,
            previous: emotionalState.frustration.current,
          },
          openness: {
            current: currentState.openness,
            initial: initialState.openness,
            previous: emotionalState.openness.current,
          },
          engagement: {
            current: currentState.engagement,
            initial: initialState.engagement,
            previous: emotionalState.engagement.current,
          },
          anxiety: {
            current: currentState.anxiety,
            initial: initialState.anxiety,
            previous: emotionalState.anxiety.current,
          },
        })

        setFlags(context.flags)
        setLastUpdate(Date.now())
      }
    }, 500) // Poll every 500ms for more responsive updates

    return () => clearInterval(interval)
  }, [])

  // Function to test negative emotional impact
  const testNegativeImpact = () => {
    const emotionalStore = getEmotionalStateStore()
    if (emotionalStore.getContext()) {
      emotionalStore.processMessage("You're stupid and I don't like you", true)
      setLastUpdate(Date.now())
    } else {
      console.warn("Emotional state context not initialized")
    }
  }

  // Function to get change indicator based on current and previous values
  const getChangeIndicator = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="h-3 w-3 text-red-500" />
    if (current < previous) return <ArrowDown className="h-3 w-3 text-green-500" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  return (
    <Card className="w-full">
      <CardHeader className="py-2">
        <CardTitle className="text-sm">Client Emotional State</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <div className="flex items-center gap-1">
                <span>Trust:</span>
                {getChangeIndicator(emotionalState.trust.current, emotionalState.trust.previous)}
              </div>
              <span>{emotionalState.trust.current.toFixed(1)}</span>
            </div>
            <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${emotionalState.trust.current}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <div className="flex items-center gap-1">
                <span>Frustration:</span>
                {getChangeIndicator(emotionalState.frustration.current, emotionalState.frustration.previous)}
              </div>
              <span>{emotionalState.frustration.current.toFixed(1)}</span>
            </div>
            <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${emotionalState.frustration.current}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <div className="flex items-center gap-1">
                <span>Openness:</span>
                {getChangeIndicator(emotionalState.openness.current, emotionalState.openness.previous)}
              </div>
              <span>{emotionalState.openness.current.toFixed(1)}</span>
            </div>
            <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${emotionalState.openness.current}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <div className="flex items-center gap-1">
                <span>Engagement:</span>
                {getChangeIndicator(emotionalState.engagement.current, emotionalState.engagement.previous)}
              </div>
              <span>{emotionalState.engagement.current.toFixed(1)}</span>
            </div>
            <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${emotionalState.engagement.current}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <div className="flex items-center gap-1">
                <span>Anxiety:</span>
                {getChangeIndicator(emotionalState.anxiety.current, emotionalState.anxiety.previous)}
              </div>
              <span>{emotionalState.anxiety.current.toFixed(1)}</span>
            </div>
            <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${emotionalState.anxiety.current}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-2">
            <div className="font-medium mb-1">Active Flags:</div>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(flags).map(([flag, isActive]) => (
                <div
                  key={flag}
                  className={`p-1 rounded text-center ${isActive ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-400"}`}
                >
                  {flag.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={testNegativeImpact}
              className="w-full p-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
            >
              Test Negative Impact
            </button>
          </div>

          <div className="text-gray-400 text-[10px] mt-1">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
