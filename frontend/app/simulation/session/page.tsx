"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Clock,
  FileText,
  Info,
  AlertTriangle,
  CheckCircle,
  Trophy,
  Target,
  HelpCircle,
  ArrowLeftCircle,
  Eye,
  EyeOff,
} from "lucide-react"
import {
  chatApi,
  type ClientProfile,
  type PersonalitySettings,
  type SimulationSettings,
} from "@/lib/api/chat-api"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

// Add imports at the top of the file
import { getEmotionalStateStore } from "@/app/profile-generator/emotional-state-store"
import { detectActions } from "@/app/profile-generator/conversation-state-tracker"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { EmotionalStateDebugPanel } from "@/components/debug/emotional-state-panel"
import { apiClient } from "@/lib/api"

// Import the tooltip components at the top of the file
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Import TTS components and client
import { websocketTTS, type ConnectionState } from "@/lib/tts/websocket-tts-client"
import { TTSControls } from "@/components/tts/tts-controls"

import {
  trackSimulationLoad,
  trackSimulationExit,
  trackHelpUsage,
  trackObjectiveCompleted,
  trackMessageSent,
  trackEngagementMetrics,
  trackNoteSectionToggle,
  trackNoteCreated,
  trackNoteUpdated,
  trackNoteAnalysis,
} from "@/utils/engagement-tracker"

// Add this near the top of your component
export default function SimulationSessionPage() {
  const searchParams = useSearchParams()
  const querySimId = searchParams.get("simulationId")

  useEffect(() => {
    // If we have a simulation ID in the URL, make sure it's stored correctly
    if (querySimId) {
      // Store the current simulation ID
      sessionStorage.setItem("currentSimulationId", querySimId)

      // If this is a replay (has format original-XX)
      if (/^.*-\d{2}$/.test(querySimId)) {
        // Extract the original ID
        const originalId = querySimId.replace(/-\d{2}$/, "")
        sessionStorage.setItem("originalSimulationId", originalId)
        sessionStorage.setItem("isReplay", "true")

        // Extract the retry number
        const retryNumber = querySimId.split("-").pop()
        if (retryNumber) {
          sessionStorage.setItem(`retryCount_${originalId}`, Number.parseInt(retryNumber).toString())
        }
      }
    }
  }, [querySimId])

  // Rest of your component...

  function SimulationSession() {
    const router = useRouter()
    const [messages, setMessages] = useState([
      {
        role: "system",
        content: "Simulation started. Your client will join shortly.",
      },
    ])

    const [input, setInput] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const [notes, setNotes] = useState("")
    const [isNotesOpen, setIsNotesOpen] = useState(true)
    const [hasCreatedNotes, setHasCreatedNotes] = useState(false)
    const [noteUpdateCount, setNoteUpdateCount] = useState(0)
    const [lastNoteLength, setLastNoteLength] = useState(0)
    const [noteAnalysisTimeout, setNoteAnalysisTimeout] = useState<NodeJS.Timeout | null>(null)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [apiKeyError, setApiKeyError] = useState(false)
    const [totalXp, setTotalXp] = useState(0)
    const [recentXp, setRecentXp] = useState(0)
    const [showXpAnimation, setShowXpAnimation] = useState(false)
    const messagesEndRef = useRef(null)
    const [initialGreetingSent, setInitialGreetingSent] = useState(false)
    const [profileLoaded, setProfileLoaded] = useState(false)

    // Add state for expert mode
    const [expertMode, setExpertMode] = useState(false)
    const [lastClientMessage, setLastClientMessage] = useState("")
    const [selectedCompetencies, setSelectedCompetencies] = useState([])

    // Objectives tracking
    const [objectives, setObjectives] = useState([
      {
        id: "rapport",
        name: "Build Rapport",
        description: "Establish a connection with your client",
        completed: false,
        progress: 0,
        xp: 50,
      },
      {
        id: "needs",
        name: "Needs Assessment",
        description: "Discover your client's financial situation and goals",
        completed: false,
        progress: 0,
        xp: 75,
      },
      {
        id: "objections",
        name: "Handle Objections",
        description: "Address concerns professionally",
        completed: false,
        progress: 0,
        xp: 100,
      },
      {
        id: "recommendations",
        name: "Provide Recommendations",
        description: "Suggest appropriate options based on needs",
        completed: false,
        progress: 0,
        xp: 125,
      },
    ])

    // Add these state variables after the existing objectives state
    const [highestScores, setHighestScores] = useState({
      rapport: 0,
      needs: 0,
      objections: 0,
      recommendations: 0,
    })

    const [decreaseReasons, setDecreaseReasons] = useState({
      rapport: "",
      needs: "",
      objections: "",
      recommendations: "",
    })

    // Add this state for showing tooltips
    const [activeTooltip, setActiveTooltip] = useState("")

    // Add state for collapsible sections
    const [isClientProfileOpen, setIsClientProfileOpen] = useState(true)
    const [isObjectivesOpen, setIsObjectivesOpen] = useState(true)
    const [isCompetenciesOpen, setIsCompetenciesOpen] = useState(true)
    const [isXpOpen, setIsXpOpen] = useState(true)

    // Add these state variables with the other useState declarations (around line 100)
    const [isProgressOpen, setIsProgressOpen] = useState(true)
    const [isTipsOpen, setIsTipsOpen] = useState(true)

    // Add this state after the other useState declarations
    const [eventTimestamps, setEventTimestamps] = useState<
      Array<{
        time: number
        event: string
        competency?: string
        score?: number
      }>
    >([])

    // Add a new state variable for showing/hiding feedback
    const [showFeedback, setShowFeedback] = useState(true)

    // Add a new state variable for showing/hiding the debug panel
    const [showDebugPanel, setShowDebugPanel] = useState(false)

    // TTS state
    const [ttsEnabled, setTtsEnabled] = useState(true)
    const [ttsConnectionState, setTtsConnectionState] = useState<ConnectionState>('disconnected')

    const simulationId =
      searchParams.get("simulationId") || sessionStorage.getItem("currentSimulationId") || "SIM-00000000"
    const industry = searchParams.get("industry") || sessionStorage.getItem("selectedIndustry") || "insurance"
    const subcategory =
      searchParams.get("subcategory") || sessionStorage.getItem("selectedSubcategory") || "life-health"
    const difficulty = searchParams.get("difficulty") || sessionStorage.getItem("selectedDifficulty") || "beginner"

    // Add state for industry metadata
    const [industryMetadata, setIndustryMetadata] = useState({})

    // Add this useEffect to load industry metadata
    useEffect(() => {
      const loadIndustryMetadata = async () => {
        try {
          const response = await apiClient.get("/api/competencies/industry")
          setIndustryMetadata(response.data.industryMetadata || {})
        } catch (error) {
          console.error("Error loading industry metadata:", error)
        }
      }

      loadIndustryMetadata()
    }, [])

    // Load simulation from database on mount
    useEffect(() => {
      const loadSimulation = async () => {
        try {
          const uuid = searchParams.get("id") || sessionStorage.getItem("currentSimulationUUID");

          if (!uuid) {
            console.warn('[SESSION] No simulation UUID found, running in frontend-only mode');
            return;
          }

          console.log('[SESSION] Loading simulation from database:', uuid);
          const { simulationApi } = await import('@/lib/api/simulation-api');
          const response = await simulationApi.getById(uuid);
          const simulation = response.data || response.simulation;

          if (simulation) {
            console.log('[SESSION] Loaded simulation from DB:', simulation);

            // Load conversation history if it exists
            if (simulation.conversation_history && Array.isArray(simulation.conversation_history)) {
              setMessages(simulation.conversation_history);
            }

            // Load XP if it exists
            if (simulation.total_xp) {
              setTotalXp(simulation.total_xp);
            }

            // Store the simulation_id for feedback later
            if (simulation.simulation_id) {
              sessionStorage.setItem('currentSimulationId', simulation.simulation_id);
            }
          }
        } catch (error) {
          console.error('[SESSION] Error loading simulation:', error);
          // Don't fail - allow simulation to continue in frontend-only mode
        }
      };

      loadSimulation();
    }, [searchParams])

    // Periodically save simulation data to database
    useEffect(() => {
      const saveSimulation = async () => {
        try {
          const uuid = sessionStorage.getItem("currentSimulationUUID");

          if (!uuid) {
            return; // Frontend-only mode
          }

          const { simulationApi } = await import('@/lib/api/simulation-api');

          await simulationApi.update(uuid, {
            conversation_history: messages,
            objectives_completed: objectives.filter(o => o.completed),
            total_xp: totalXp
          });

          console.log('[SESSION] Saved simulation data to database');
        } catch (error) {
          console.error('[SESSION] Error saving simulation:', error);
          // Don't fail - simulation can continue
        }
      };

      // Save every 30 seconds or when messages change (debounced)
      const saveInterval = setInterval(saveSimulation, 30000);

      // Also save when there are new messages (but debounce it)
      const debounceTimeout = setTimeout(() => {
        if (messages.length > 1) { // More than just the initial system message
          saveSimulation();
        }
      }, 5000);

      return () => {
        clearInterval(saveInterval);
        clearTimeout(debounceTimeout);
      };
    }, [messages, objectives, totalXp])

    // Get client behavior traits based on difficulty
    const getClientBehaviorTraits = () => {
      if (difficulty === "beginner") {
        return {
          openness: 60,
          conscientiousness: 70,
          extraversion: 50,
          agreeableness: 75,
          neuroticism: 30,
          assertiveness: 40,
          honestyHumility: 80,
        }
      } else if (difficulty === "intermediate") {
        return {
          openness: 50,
          conscientiousness: 65,
          extraversion: 45,
          agreeableness: 60,
          neuroticism: 45,
          assertiveness: 55,
          honestyHumility: 70,
        }
      } else {
        return {
          openness: 40,
          conscientiousness: 60,
          extraversion: 60,
          agreeableness: 40,
          neuroticism: 60,
          assertiveness: 75,
          honestyHumility: 50,
        }
      }
    }

    // Sample personality settings - now using the difficulty-based traits
    const [personalitySettings, setPersonalitySettings] = useState<PersonalitySettings>({
      traits: getClientBehaviorTraits(),
      archetype: "analyst",
      mood: "confident",
      influence: 70,
    })

    // Sample simulation settings - in a real implementation, this would come from the setup page
    const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
      industry: industry,
      subcategory: subcategory,
      difficulty: difficulty,
      competencies: [
        "Communication and Rapport-Building",
        "Needs Assessment",
        "Objection Handling",
        "Bias Awareness",
        "Generalized Option Suggestions",
        "Time Management",
      ],
      simulationId: simulationId,
    })

    // Simulate elapsed time
    useEffect(() => {
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)

      return () => clearInterval(timer)
    }, [])

    // Auto-scroll to bottom of messages
    useEffect(() => {
      if (messagesEndRef.current) {
        // Get the chat container element (parent of the messages)
        const chatContainer = document.querySelector(".chat-messages-container")
        if (chatContainer) {
          // Scroll only the chat container, not the whole page
          chatContainer.scrollTop = chatContainer.scrollHeight
        } else {
          // Fallback to the old behavior but with scrollIntoView options to prevent page scrolling
          messagesEndRef.current.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          })
        }
      }
    }, [messages])

    // Sample client profile - in a real implementation, this would come from the previous setup page
    const [clientProfile, setClientProfile] = useState<ClientProfile>({
      name: "",
      age: 0,
      occupation: "",
      income: "",
      family: "",
      assets: [],
      debts: [],
      goals: [],
    })

    // Initial client greeting - now separated into its own function
    const sendInitialGreeting = async () => {
      // Only proceed if we haven't sent the greeting yet and the profile is loaded
      if (initialGreetingSent || !profileLoaded || !clientProfile.name) return

      setInitialGreetingSent(true)
      setIsTyping(true)

      try {
        // Call the OpenAI API via backend
        const response = await chatApi.generateClientResponse(
          [{ role: "system", content: "Initial greeting" }],
          clientProfile,
          personalitySettings,
          simulationSettings,
        )

        if (response.success) {
          setMessages((prev) => [...prev, { role: "assistant", content: response.message }])
          setLastClientMessage(response.message)
        } else {
          // Fallback if the API call fails
          // Use the client profile name in the fallback message
          const fallbackMessage = `Hello there! I'm ${clientProfile.name}. [extends hand] It's nice to meet you. I appreciate you taking the time to meet with me today. My wife and I have been thinking about our family's financial future, especially with our two kids growing up so fast.`
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: fallbackMessage,
            },
          ])
          setLastClientMessage(fallbackMessage)

          // Check if the error is related to the API key
          if (response.message.includes("API key")) {
            setApiKeyError(true)
          }
        }
      } catch (error) {
        console.error("Error generating initial greeting:", error)
        // Use the client profile name in the fallback message
        const fallbackMessage = `Hello there! I'm ${clientProfile.name}. [extends hand] It's nice to meet you. I appreciate you taking the time to meet with me today.`
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: fallbackMessage,
          },
        ])
        setLastClientMessage(fallbackMessage)
        setApiKeyError(true)
      }

      setIsTyping(false)

      // Award initial XP for starting the simulation
      awardXp(25, "Starting the simulation")
    }

    // Effect to load client profile
    useEffect(() => {
      async function loadData() {
        const storedProfile = sessionStorage.getItem("clientProfile")
        if (storedProfile) {
          try {
            const parsedProfile = JSON.parse(storedProfile)
            setClientProfile(parsedProfile)

            // Also update the personality settings if the profile has fusion model traits
            if (parsedProfile.fusionModelTraits) {
              setPersonalitySettings((prev) => ({
                ...prev,
                traits: parsedProfile.fusionModelTraits,
              }))
            }

            // Mark profile as loaded
            setProfileLoaded(true)
          } catch (error) {
            console.error("Error parsing client profile:", error)
            // Fall back to default profile
            setClientProfile({
              name: "John Smith",
              age: 42,
              occupation: "High School Teacher",
              income: "$65,000",
              family: "Married with 2 children (ages 10 and 8)",
              assets: ["$25,000 emergency fund", "403(b) with $120,000", "Home equity"],
              debts: ["$180,000 mortgage", "$15,000 auto loan"],
              goals: [
                "Protect family financially",
                "Save for children's college education",
                "Ensure adequate retirement savings",
              ],
            })
            setProfileLoaded(true)
          }
        } else {
          // Fallback profile if none is stored (shouldn't happen in normal flow)
          setClientProfile({
            name: "John Smith",
            age: 42,
            occupation: "High School Teacher",
            income: "$65,000",
            family: "Married with 2 children (ages 10 and 8)",
            assets: ["$25,000 emergency fund", "403(b) with $120,000", "Home equity"],
            debts: ["$180,000 mortgage", "$15,000 auto loan"],
            goals: [
              "Protect family financially",
              "Save for children's college education",
              "Ensure adequate retirement savings",
            ],
          })
          setProfileLoaded(true)
        }

        // Load the selected competencies
        const competenciesJson = sessionStorage.getItem("selectedCompetencies")
        if (competenciesJson) {
          try {
            const competencies = JSON.parse(competenciesJson)
            setSelectedCompetencies(competencies)

            // Update simulation settings with the competency names
            setSimulationSettings((prev) => ({
              ...prev,
              competencies: competencies.map((comp) => comp.name),
            }))
          } catch (error) {
            console.error("Error parsing competencies:", error)
          }
        }

        // Load focus areas
        const focusAreasJson = sessionStorage.getItem("selectedFocusAreas")
        if (focusAreasJson) {
          try {
            const focusAreas = JSON.parse(focusAreasJson)

            // Update simulation settings with focus areas
            setSimulationSettings((prev) => ({
              ...prev,
              focusAreas: focusAreas,
            }))
          } catch (error) {
            console.error("Error parsing focus areas:", error)
          }
        }

        // Set personality traits based on difficulty
        setPersonalitySettings((prev) => ({
          ...prev,
          traits: getClientBehaviorTraits(),
        }))

        // Load feedback visibility preference
        const feedbackPref = sessionStorage.getItem("showSimulationFeedback")
        if (feedbackPref !== null) {
          setShowFeedback(feedbackPref === "true")
        }
      }

      loadData()
    }, [])

    // Effect to trigger initial greeting after profile is loaded
    useEffect(() => {
      if (profileLoaded && clientProfile.name && !initialGreetingSent) {
        sendInitialGreeting()
      }
    }, [profileLoaded, clientProfile.name])

    // Add this useEffect after the other useEffect hooks
    useEffect(() => {
      // Track simulation load
      trackSimulationLoad(simulationId, sessionStorage.getItem("userId") || "anonymous", {
        industry,
        subcategory,
        difficulty,
      })

      // Track simulation exit on unmount
      return () => {
        trackSimulationExit(simulationId, sessionStorage.getItem("userId") || "anonymous", {
          elapsedTime,
          completedObjectivesCount,
        })
      }
    }, [simulationId, industry, subcategory, difficulty])

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    // Function to award XP
    const awardXp = (amount, reason) => {
      setTotalXp((prev) => prev + amount)
      setRecentXp(amount)
      setShowXpAnimation(true)

      // Add XP notification to messages
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `You earned ${amount} XP for: ${reason}`,
        },
      ])

      // Hide animation after 3 seconds
      setTimeout(() => {
        setShowXpAnimation(false)
      }, 3000)
    }

    // Function to complete an objective
    const completeObjective = (objectiveId) => {
      setObjectives((prev) =>
        prev.map((obj) => (obj.id === objectiveId ? { ...obj, completed: true, progress: 100 } : obj)),
      )

      // Find the objective to get its XP value
      const objective = objectives.find((obj) => obj.id === objectiveId)
      if (objective && !objective.completed) {
        awardXp(objective.xp, `Completing objective: ${objective.name}`)
      }
    }

    // Replace the existing updateObjectiveProgress function
    const updateObjectiveProgress = (objectiveId, progressValue) => {
      // Get the previous progress value
      const previousProgress = objectives.find((obj) => obj.id === objectiveId)?.progress || 0

      setObjectives((prev) =>
        prev.map((obj) =>
          obj.id === objectiveId
            ? {
                ...obj,
                progress: Math.min(100, progressValue),
                completed: progressValue >= 100,
              }
            : obj,
        ),
      )

      // If progress reaches 100% and wasn't already complete, track the objective completion
      const objective = objectives.find((obj) => obj.id === objectiveId)
      if (objective && !objective.completed && progressValue >= 100 && previousProgress < 100) {
        trackObjectiveCompleted(
          objectiveId,
          objective.name,
          simulationId,
          sessionStorage.getItem("userId") || "anonymous",
        )

        // Award XP if not already completed
        awardXp(objective.xp, `Completing objective: ${objective.name}`)
      }
    }

    // Updated function to handle objective progress from function calling
    const handleObjectiveProgress = (progressData) => {
      if (!progressData) return

      // Create a copy of the current highest scores
      const newHighestScores = { ...highestScores }
      const newDecreaseReasons = { ...decreaseReasons }

      // Process each objective
      const objectives = ["rapport", "needs", "objections", "recommendations"]
      let decreasesDetected = false

      objectives.forEach((objective) => {
        if (typeof progressData[objective] === "number") {
          const currentScore = progressData[objective]
          const highestScore = highestScores[objective]

          // Check if this is a decrease from the highest score
          if (currentScore < highestScore) {
            // Only apply the decrease if there's a reason provided
            if (progressData.decreaseReason && progressData.decreaseReason[objective]) {
              decreasesDetected = true
              newDecreaseReasons[objective] = progressData.decreaseReason[objective]

              // Update the objective with the decreased score
              updateObjectiveProgress(objective, currentScore)
            } else {
              // If no reason provided, maintain the highest score (ratcheting)
              // But don't update the UI - the score stays the same
            }
          } else {
            // If it's an increase or the same, update normally
            updateObjectiveProgress(objective, currentScore)

            // Update the highest score if this is a new high
            if (currentScore > highestScore) {
              newHighestScores[objective] = currentScore
            }

            // Clear any previous decrease reason
            if (newDecreaseReasons[objective]) {
              newDecreaseReasons[objective] = ""
            }
          }
        }
      })

      // Update the highest scores state
      setHighestScores(newHighestScores)

      // Update decrease reasons state
      setDecreaseReasons(newDecreaseReasons)

      // Add a system message with the explanation if provided
      if (progressData.explanation) {
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `Advisor progress: ${progressData.explanation}`,
            isFeedback: true, // Mark this as feedback message
          },
        ])
      }

      // If any decreases were detected, add a specific message about that
      if (decreasesDetected) {
        const decreaseMessages = objectives
          .filter((obj) => newDecreaseReasons[obj])
          .map((obj) => `${obj.charAt(0).toUpperCase() + obj.slice(1)}: ${newDecreaseReasons[obj]}`)

        if (decreaseMessages.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: `⚠️ Score decreased: ${decreaseMessages.join("; ")}`,
              isFeedback: true,
              isWarning: true, // Mark this as a warning message
            },
          ])
        }
      }
    }

    // Function to check for objective completion based on conversation
    // This is now a fallback if function calling fails
    const checkObjectiveCompletion = (userMessage, aiResponse) => {
      const combinedText = `${userMessage} ${aiResponse}`.toLowerCase()

      // Simple keyword-based checks for demonstration purposes
      // In a real implementation, this would use more sophisticated NLP

      // Check for rapport building
      if (!objectives.find((o) => o.id === "rapport").completed) {
        if (
          combinedText.includes("nice to meet") ||
          combinedText.includes("pleasure") ||
          combinedText.includes("how are you")
        ) {
          updateObjectiveProgress("rapport", 100) // Complete the objective
        } else if (
          combinedText.includes("hello") ||
          combinedText.includes("hi there") ||
          combinedText.includes("good morning") ||
          combinedText.includes("good afternoon")
        ) {
          updateObjectiveProgress("rapport", Math.max(objectives.find((o) => o.id === "rapport").progress, 50)) // Partial progress
        }
      }

      // Check for needs assessment
      if (!objectives.find((o) => o.id === "needs").completed) {
        if (
          combinedText.includes("what are your goals") ||
          combinedText.includes("financial situation") ||
          combinedText.includes("tell me about your") ||
          combinedText.includes("what brings you")
        ) {
          updateObjectiveProgress("needs", 100) // Complete the objective
        } else if (
          combinedText.includes("goals") ||
          combinedText.includes("needs") ||
          combinedText.includes("priorities") ||
          combinedText.includes("planning for")
        ) {
          updateObjectiveProgress("needs", Math.max(objectives.find((o) => o.id === "needs").progress, 50)) // Partial progress
        }
      }

      // Check for objection handling
      if (!objectives.find((o) => o.id === "objections").completed) {
        if (
          combinedText.includes("concern") ||
          combinedText.includes("worried about") ||
          combinedText.includes("not sure if") ||
          combinedText.includes("understand your")
        ) {
          updateObjectiveProgress("objections", 100) // Complete the objective
        } else if (
          combinedText.includes("hesitant") ||
          combinedText.includes("issue") ||
          combinedText.includes("problem") ||
          combinedText.includes("challenge")
        ) {
          updateObjectiveProgress("objections", Math.max(objectives.find((o) => o.id === "objections").progress, 50)) // Partial progress
        }
      }

      // Check for recommendations
      if (!objectives.find((o) => o.id === "recommendations").completed) {
        if (
          combinedText.includes("recommend") ||
          combinedText.includes("suggest") ||
          combinedText.includes("option") ||
          combinedText.includes("consider")
        ) {
          updateObjectiveProgress("recommendations", 100) // Complete the objective
        } else if (
          combinedText.includes("might work") ||
          combinedText.includes("could be") ||
          combinedText.includes("possibility") ||
          combinedText.includes("alternative")
        ) {
          updateObjectiveProgress(
            "recommendations",
            Math.max(objectives.find((o) => o.id === "recommendations").progress, 50),
          ) // Partial progress
        }
      }

      // Award XP for good questions or responses
      if (userMessage.toLowerCase().includes("?") && userMessage.length > 20) {
        awardXp(10, "Asking a thoughtful question")
      }
    }

    // Add this function before handleSendMessage
    const recordEvent = (event: string, competency?: string, score?: number) => {
      setEventTimestamps((prev) => [
        ...prev,
        {
          time: elapsedTime,
          event,
          competency,
          score: score || Math.floor(Math.random() * 21) + 60, // Random score between 60-80 if not provided
        },
      ])
    }

    // Add this function inside the SimulationSession component, before the handleSendMessage function
    const processMessageForEmotionalImpact = (message: string, isUser: boolean) => {
      try {
        console.log(`Processing message for emotional impact: "${message}", isUser: ${isUser}`)

        // Get the emotional state store
        const emotionalStore = getEmotionalStateStore()

        // Initialize if needed
        if (!emotionalStore.getContext() && clientProfile) {
          console.log("Initializing emotional state store with client profile:", clientProfile)
          emotionalStore.initialize({
            ...clientProfile,
            fusionModelTraits: personalitySettings.traits,
          })
        }

        // Process the message
        if (emotionalStore.getContext()) {
          console.log("Emotional state before processing:", emotionalStore.getContext()?.currentState)

          // For user messages, detect actions and update emotional state
          if (isUser) {
            const actions = detectActions(message)
            console.log("Detected actions for emotional impact:", actions)

            if (actions.length > 0) {
              emotionalStore.processMessage(message, isUser)
              console.log("Emotional state after processing:", emotionalStore.getContext()?.currentState)
            } else {
              console.log("No actions detected, emotional state unchanged")
            }

            // Map actions to objective progress (existing code)
            if (
              actions.includes("reflective_listening") ||
              actions.includes("empathetic_response") ||
              actions.includes("personal_connection")
            ) {
              updateObjectiveProgress(
                "rapport",
                Math.min(100, objectives.find((o) => o.id === "rapport").progress + 25),
              )
            }

            if (actions.includes("open_question")) {
              updateObjectiveProgress("needs", Math.min(100, objectives.find((o) => o.id === "needs").progress + 25))
            } else if (actions.includes("probing_question") || actions.includes("clarifying_question")) {
              updateObjectiveProgress("needs", Math.min(100, objectives.find((o) => o.id === "needs").progress + 20))
            }

            if (actions.includes("addressing_objection")) {
              updateObjectiveProgress(
                "objections",
                Math.min(100, objectives.find((o) => o.id === "objections").progress + 25),
              )
            }

            if (actions.includes("clear_explanation")) {
              updateObjectiveProgress(
                "recommendations",
                Math.min(100, objectives.find((o) => o.id === "recommendations").progress + 20),
              )
            }
          } else {
            // For AI responses, just log them but don't update emotional state
            console.log("AI response received, not updating emotional state directly")
          }
        } else {
          console.warn("Emotional state context is null after attempted initialization")
        }
      } catch (error) {
        console.error("Error processing message for emotional impact:", error)
      }
    }

    // Add this function before handleSendMessage
    const toggleFeedbackVisibility = () => {
      const newValue = !showFeedback
      setShowFeedback(newValue)
      // Store preference in session storage for the review page
      sessionStorage.setItem("showSimulationFeedback", newValue.toString())
    }

    // Add a toggle function for the debug panel:
    const toggleDebugPanel = () => {
      setShowDebugPanel((prev) => !prev)
    }

    // Toggle between client and expert mode
    const toggleExpertMode = () => {
      if (!expertMode) {
        // Switching to expert mode
        setExpertMode(true)
        trackHelpUsage(true, simulationId, sessionStorage.getItem("userId") || "anonymous")
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "Switching to expert guidance mode. How can I help you with this client interaction?",
          },
        ])
      } else {
        // Switching back to client mode
        setExpertMode(false)
        trackHelpUsage(false, simulationId, sessionStorage.getItem("userId") || "anonymous")
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "Returning to client conversation. The client will continue from where you left off.",
          },
        ])
      }
    }

    // Modify the handleSendMessage function to handle both client and expert modes
    const handleSendMessage = async () => {
      if (!input.trim()) return

      // Add user message
      const userMessage = input.trim()
      const updatedMessages = [...messages, { role: "user", content: userMessage }]
      setMessages(updatedMessages)

      // Track message sent
      trackMessageSent(userMessage.length, simulationId, sessionStorage.getItem("userId") || "anonymous")

      // Record the user message as an event
      recordEvent(`Advisor: ${userMessage.substring(0, 30)}${userMessage.length > 30 ? "..." : ""}`)

      setInput("")

      // In the handleSendMessage function, after adding the user message to the messages state:
      // Process the user message for emotional impact (only in client mode)
      if (!expertMode) {
        console.log("Processing user message in handleSendMessage:", userMessage)
        processMessageForEmotionalImpact(userMessage, true)
      }

      // Simulate AI thinking
      setIsTyping(true)

      try {
        if (expertMode) {
          // In expert mode, generate guidance response
          const response = await chatApi.generateExpertResponse(
            updatedMessages.filter((m) => m.role !== "system" || m === updatedMessages[0]),
            clientProfile,
            personalitySettings,
            simulationSettings,
            objectives,
          )

          if (response.success) {
            setMessages((prev) => [...prev, { role: "assistant", content: response.message }])
          } else {
            // Fallback response if API call fails
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content:
                  "I'm sorry, I'm having trouble providing guidance right now. Please try asking a more specific question about how to proceed with this client.",
              },
            ])

            // Check if the error is related to the API key
            if (response.message.includes("API key")) {
              setApiKeyError(true)
            }
          }
        } else {
          // In client mode, generate client response
          const response = await chatApi.generateClientResponse(
            updatedMessages.filter((m) => m.role !== "system" || m === updatedMessages[0]),
            clientProfile,
            personalitySettings,
            simulationSettings,
          )

          let aiResponse = ""

          if (response.success) {
            aiResponse = response.message
            setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }])
            setLastClientMessage(aiResponse)

            // Record the AI response as an event
            recordEvent(`Client: ${aiResponse.substring(0, 30)}${aiResponse.length > 30 ? "..." : ""}`)

            // Play TTS audio (only in client mode, not expert mode)
            if (ttsEnabled && ttsConnectionState === 'connected') {
              try {
                console.log('[TTS] Speaking response...');
                await websocketTTS.speak(aiResponse);
              } catch (error) {
                console.error('[TTS] Failed to speak:', error);
              }
            }

            // Process the AI response for emotional impact
            if (!expertMode && response.success) {
              console.log("Processing AI response in handleSendMessage:", aiResponse)
              processMessageForEmotionalImpact(aiResponse, false)
            }

            // Handle objective progress from function calling
            if (response.objectiveProgress) {
              handleObjectiveProgress(response.objectiveProgress)
            } else {
              // Fallback to keyword-based objective tracking
              checkObjectiveCompletion(userMessage, aiResponse)
            }
          } else {
            // Fallback response if API call fails
            aiResponse = "I'm sorry, I'm having trouble with that. Let's continue our conversation."
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: aiResponse,
              },
            ])
            setLastClientMessage(aiResponse)

            // Check if the error is related to the API key
            if (response.message.includes("API key")) {
              setApiKeyError(true)
            }

            // Fallback to keyword-based objective tracking
            checkObjectiveCompletion(userMessage, aiResponse)
          }
        }
      } catch (error) {
        console.error("Error generating response:", error)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "I'm sorry, I'm having trouble with that. Let's continue our conversation.",
          },
        ])
        setApiKeyError(true)
      }

      setIsTyping(false)
    }

    const handleKeyDown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    }

    // Add this function to handle notes changes
    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      const oldValue = notes

      // Track if this is the first time adding notes
      if (!hasCreatedNotes && newValue.trim().length > 0) {
        setHasCreatedNotes(true)
        trackNoteCreated(simulationId, sessionStorage.getItem("userId") || "anonymous")
      }

      // Track the update with the change size
      const changeSize = Math.abs(newValue.length - oldValue.length)
      if (changeSize > 0) {
        setNoteUpdateCount((prev) => prev + 1)
        trackNoteUpdated(newValue.length, changeSize, simulationId, sessionStorage.getItem("userId") || "anonymous")
      }

      // Set the new notes value
      setNotes(newValue)
      setLastNoteLength(newValue.length)

      // Schedule content analysis after user stops typing
      if (noteAnalysisTimeout) {
        clearTimeout(noteAnalysisTimeout)
      }

      // Only analyze substantial notes
      if (newValue.trim().length > 10) {
        const timeout = setTimeout(() => {
          trackNoteAnalysis(newValue, simulationId, sessionStorage.getItem("userId") || "anonymous")
        }, 2000) // Wait 2 seconds after typing stops

        setNoteAnalysisTimeout(timeout)
      }
    }

    // Add this function to handle notes section toggle
    const handleNotesToggle = (open: boolean) => {
      setIsNotesOpen(open)
      trackNoteSectionToggle(open, simulationId, sessionStorage.getItem("userId") || "anonymous")
    }

    // Update the handleEndSimulation function to include notes metrics
    const handleEndSimulation = () => {
      // In a real implementation, this would save the simulation data to a database
      // before redirecting to the review page

      // Award XP for completing the simulation
      const completedObjectivesCount = objectives.filter((o) => o.completed).length
      const completionBonus = completedObjectivesCount * 50

      if (completionBonus > 0) {
        awardXp(completionBonus, "Simulation completion bonus")
      }

      // Track engagement metrics
      trackEngagementMetrics(simulationId, sessionStorage.getItem("userId") || "anonymous", {
        totalMessages: messages.filter((m) => m.role === "user").length,
        timeInSimulationMinutes: Math.floor(elapsedTime / 60),
        usedNeedsHelp: messages.some((m) => m.role === "system" && m.content.includes("expert guidance mode")),
        exitedEarly: objectives.some((o) => !o.completed),
        objectivesCompleted: completedObjectivesCount,
        coachingInteractions: messages.filter(
          (m) =>
            m.role === "system" && (m.content.includes("expert guidance") || m.content.includes("Advisor progress")),
        ).length,
        // Include notes metrics
        tookNotes: hasCreatedNotes,
        noteLength: notes.length,
        noteUpdateCount: noteUpdateCount,
      })

      // Store the end time and messages for the review
      // Mark feedback messages when storing them
      const messagesWithFeedbackMarked = messages.map((msg) => {
        if (msg.role === "system" && !msg.content.includes("XP") && msg.content.includes("Advisor progress")) {
          return { ...msg, isFeedback: true }
        }
        return msg
      })

      sessionStorage.setItem("simulationEndTime", new Date().toISOString())
      sessionStorage.setItem("simulationMessages", JSON.stringify(messagesWithFeedbackMarked))

      // Store XP and completion data in session storage for the review
      sessionStorage.setItem("simulationXp", totalXp.toString())
      sessionStorage.setItem("completedObjectives", JSON.stringify(objectives.filter((o) => o.completed)))

      // Store the event timestamps for the review
      sessionStorage.setItem("simulationTimestamps", JSON.stringify(eventTimestamps))

      router.push("/simulation/review")
    }

    // Calculate progress percentage
    const completedObjectivesCount = objectives.filter((obj) => obj.completed).length
    const progressPercentage = (completedObjectivesCount / objectives.length) * 100

    // Add or modify the function that determines what information to show based on difficulty
    const getVisibleClientInfo = (profile, difficulty) => {
      // Create a filtered version of the profile based on difficulty
      const visibleProfile = { ...profile }

      // For intermediate difficulty, hide financial details and goals
      if (difficulty === "intermediate") {
        delete visibleProfile.income
        delete visibleProfile.assets
        delete visibleProfile.debts
        delete visibleProfile.goals // Hide goals for intermediate difficulty
      }

      // For advanced difficulty, hide everything except name and age
      if (difficulty === "advanced") {
        // Keep only the name and age
        const { name, age } = visibleProfile
        return { name, age }
      }

      return visibleProfile
    }

    // Make sure to use this function when displaying client information in the UI
    const visibleClientProfile = getVisibleClientInfo(clientProfile, difficulty)

    // Get initials for avatar
    const getInitials = (name) => {
      if (!name) return "JS"
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    }

    // Add this useEffect to fetch industry settings
    useEffect(() => {
      const fetchIndustrySettings = async () => {
        try {
          const response = await apiClient.get(`/api/industry-settings?industry=${industry}&subcategory=${subcategory}`);
          setSimulationSettings((prev) => ({
            ...prev,
            aiRoleLabel: response.data.aiRoleLabel || undefined,
            aiRoleDescription: response.data.aiRoleDescription || undefined,
          }));
        } catch (error) {
          console.error("Error fetching industry settings:", error);
        }
      };
      fetchIndustrySettings();
    }, [industry, subcategory]);

    // Initialize TTS connection
    useEffect(() => {
      const initTTS = async () => {
        try {
          console.log('[TTS] Initializing TTS connection...');

          // Set up state change listener
          websocketTTS.onStateChange((state) => {
            console.log('[TTS] State changed:', state);
            setTtsConnectionState(state);
          });

          // Set up error listener
          websocketTTS.onError((error) => {
            console.error('[TTS] Error:', error);
          });

          // Connect to TTS service
          await websocketTTS.connect();
          console.log('[TTS] Connected successfully');
        } catch (error) {
          console.error('[TTS] Failed to connect:', error);
          setTtsConnectionState('error');
        }
      };

      initTTS();

      // Cleanup on unmount
      return () => {
        console.log('[TTS] Disconnecting...');
        websocketTTS.disconnect();
      };
    }, []);

    return (
      <div className="flex h-screen bg-[rgb(239,239,239)]">
        {/* Left Sidebar - Client Profile & Objectives */}
        <div className="w-64 bg-white p-4 overflow-auto border-r">
          {/* Client Profile Section - Now Collapsible */}
          <Collapsible open={isClientProfileOpen} onOpenChange={setIsClientProfileOpen} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[rgb(35,15,110)]">Client Profile</h2>
              <CollapsibleTrigger className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100">
                <ChevronDown className="h-4 w-4 transition-transform duration-200 transform ui-open:rotate-180" />
                <span className="sr-only">Toggle client profile</span>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[rgb(124,108,167)] text-white">
                      {getInitials(clientProfile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{visibleClientProfile.name || "Loading..."}</div>
                    <div className="text-sm text-gray-500">
                      {visibleClientProfile.age} years old, {visibleClientProfile.occupation}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Family:</strong> {visibleClientProfile.family || visibleClientProfile.familyStatus}
                  </div>
                  {visibleClientProfile.income && (
                    <div>
                      <strong>Annual Income:</strong> {visibleClientProfile.income}
                    </div>
                  )}
                  {visibleClientProfile.assets && visibleClientProfile.assets.length > 0 && (
                    <div>
                      <strong>Assets:</strong>
                    </div>
                  )}
                  {visibleClientProfile.assets && visibleClientProfile.assets.length > 0 && (
                    <ul className="list-disc pl-5 text-xs">
                      {visibleClientProfile.assets.map((asset, index) => (
                        <li key={index}>{asset}</li>
                      ))}
                    </ul>
                  )}
                  {visibleClientProfile.debts && visibleClientProfile.debts.length > 0 && (
                    <div>
                      <strong>Debt:</strong>
                    </div>
                  )}
                  {visibleClientProfile.debts && visibleClientProfile.debts.length > 0 && (
                    <ul className="list-disc pl-5 text-xs">
                      {visibleClientProfile.debts.map((debt, index) => (
                        <li key={index}>{debt}</li>
                      ))}
                    </ul>
                  )}
                  {visibleClientProfile.goals && visibleClientProfile.goals.length > 0 && (
                    <div>
                      <strong>Goals:</strong>
                    </div>
                  )}
                  {visibleClientProfile.goals && visibleClientProfile.goals.length > 0 && (
                    <ul className="list-disc pl-5 text-xs">
                      {visibleClientProfile.goals.map((goal, index) => (
                        <li key={index}>{goal}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Objectives Section - Now Collapsible */}
          <Collapsible open={isObjectivesOpen} onOpenChange={setIsObjectivesOpen} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[rgb(35,15,110)]">Objectives</h2>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-[rgb(35,15,110)] text-white">
                  {completedObjectivesCount}/{objectives.length}
                </Badge>
                <CollapsibleTrigger className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100">
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 transform ui-open:rotate-180" />
                  <span className="sr-only">Toggle objectives</span>
                </CollapsibleTrigger>
              </div>
            </div>

            <CollapsibleContent>
              <Progress value={progressPercentage} className="h-2 mb-4" />

              <div className="space-y-3">
                {objectives.map((objective) => {
                  const objectiveId = objective.id
                  const highWaterMark = highestScores[objectiveId] || 0
                  const currentProgress = objective.progress
                  const hasDecreased = highWaterMark > currentProgress
                  const decreaseReason = decreaseReasons[objectiveId]

                  return (
                    <div
                      key={objective.id}
                      className={`flex items-start space-x-2 p-2 rounded-md ${
                        objective.completed
                          ? "bg-green-50 border border-green-200"
                          : hasDecreased
                            ? "bg-red-50 border border-red-200"
                            : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-5 h-5 rounded-full ${
                          objective.completed
                            ? "bg-green-500 text-white"
                            : hasDecreased
                              ? "bg-red-500 text-white"
                              : "bg-gray-300 text-gray-500"
                        } flex items-center justify-center`}
                      >
                        {objective.completed ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : hasDecreased ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm flex items-center">
                          {objective.name}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  className="ml-1 text-gray-400 hover:text-gray-600"
                                  onClick={() => setActiveTooltip(activeTooltip === objective.id ? "" : objective.id)}
                                >
                                  <HelpCircle className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="text-xs">
                                  Scores generally increase as you make progress. Scores may decrease only for
                                  significant mistakes.
                                  {hasDecreased && highWaterMark > 0
                                    ? ` Your highest score was ${highWaterMark}%.`
                                    : ""}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="text-xs text-gray-500">{objective.description}</div>

                        {/* Progress bar with high water mark */}
                        <div className="mt-2 mb-1 relative">
                          <Progress
                            value={objective.progress}
                            className={`h-1.5 ${
                              objective.completed ? "bg-green-100" : hasDecreased ? "bg-red-100" : "bg-gray-100"
                            }`}
                          />

                          {/* High water mark indicator */}
                          {hasDecreased && highWaterMark > 0 && (
                            <div
                              className="absolute top-0 h-1.5 border-r-2 border-yellow-500"
                              style={{ left: `${highWaterMark}%` }}
                              title={`Highest score: ${highWaterMark}%`}
                            ></div>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span
                            className={
                              objective.completed ? "text-green-600" : hasDecreased ? "text-red-600" : "text-gray-500"
                            }
                          >
                            {objective.progress}% complete
                            {hasDecreased && highWaterMark > 0 && (
                              <span className="text-yellow-600 ml-1">(peak: {highWaterMark}%)</span>
                            )}
                          </span>
                          {objective.completed && <span className="text-green-600">+{objective.xp} XP</span>}
                        </div>

                        {/* Decrease reason */}
                        {decreaseReason && (
                          <div className="mt-1 text-xs text-red-600 bg-red-50 p-1 rounded">
                            <span className="font-medium">Score decreased:</span> {decreaseReason}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Competencies Section - Now Collapsible */}
          {selectedCompetencies.length > 0 && (
            <Collapsible open={isCompetenciesOpen} onOpenChange={setIsCompetenciesOpen} className="mb-6 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-[rgb(35,15,110)]">Competencies</h2>
                <CollapsibleTrigger className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100">
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 transform ui-open:rotate-180" />
                  <span className="sr-only">Toggle competencies</span>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="space-y-2">
                  {selectedCompetencies.map((competency) => (
                    <div key={competency.id} className="text-sm p-2 bg-gray-50 rounded-md">
                      <div className="font-medium">{competency.name}</div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* XP Earned Section - Now Collapsible */}
          <Collapsible open={isXpOpen} onOpenChange={setIsXpOpen} className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[rgb(35,15,110)]">XP Earned</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="font-bold">{totalXp}</span>
                </div>
                <CollapsibleTrigger className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100">
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 transform ui-open:rotate-180" />
                  <span className="sr-only">Toggle XP</span>
                </CollapsibleTrigger>
              </div>
            </div>
            <CollapsibleContent>
              <div className="text-xs text-gray-500">
                Complete objectives and interact effectively to earn experience points.
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Main Content - Chat */}
        <div className="flex-1 flex flex-col relative">
          {/* XP Animation */}
          {showXpAnimation && (
            <div className="absolute top-16 right-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-md shadow-md animate-bounce z-10 flex items-center">
              <Trophy className="h-5 w-5 text-yellow-500 mr-2" />+{recentXp} XP
            </div>
          )}

          {/* Header */}
          <div className="bg-white p-4 border-b flex justify-between items-center">
            <div>
              {/* Update the header section to use dynamic names */}
              <h1 className="text-xl font-bold text-[rgb(35,15,110)]">
                {industryMetadata[simulationSettings.industry]?.displayName || simulationSettings.industry}{" "}
                {simulationSettings.subcategory &&
                !(simulationSettings.industry !== "insurance" && simulationSettings.subcategory === "life-health") &&
                industryMetadata[simulationSettings.industry]?.subcategories[simulationSettings.subcategory]
                  ? `- ${industryMetadata[simulationSettings.industry].subcategories[simulationSettings.subcategory].displayName}`
                  : simulationSettings.subcategory
                    ? `- ${simulationSettings.subcategory
                        .split("-")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}`
                    : ""}
                ({simulationSettings.difficulty})
              </h1>
              <div className="text-sm text-gray-500">Simulation ID: {simulationSettings.simulationId}</div>
            </div>
            <div className="flex items-center space-x-4">
              <TTSControls
                enabled={ttsEnabled}
                onEnabledChange={setTtsEnabled}
                connectionState={ttsConnectionState}
              />
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{formatTime(elapsedTime)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleEndSimulation}>
                <FileText className="h-4 w-4 mr-1" />
                End & Review
              </Button>
            </div>
          </div>

          {/* API Key Error Banner */}
          {apiKeyError && (
            <div className="bg-amber-50 border-amber-200 border-b p-2 flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                <span className="text-sm text-amber-800">
                  OpenAI API key is missing or invalid. The simulation is running in fallback mode with limited
                  responses.
                </span>
              </div>
              <Link href="/admin/api-settings">
                <Button variant="outline" size="sm" className="text-xs">
                  Configure API Key
                </Button>
              </Link>
            </div>
          )}

          {/* Expert Mode Banner */}
          {expertMode && (
            <div className="bg-blue-50 border-blue-200 border-b p-2 flex items-center">
              <Info className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm text-blue-800">
                Expert guidance mode active. Ask questions about how to proceed with this client.
              </span>
            </div>
          )}

          {/* Loading Banner */}
          {!profileLoaded && (
            <div className="bg-blue-50 border-blue-200 border-b p-2 flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-sm text-blue-800">Loading client profile...</span>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 chat-messages-container">
            <div className="space-y-4">
              {messages.map((message, index) =>
                // Only show system messages if they're XP related or feedback is enabled
                message.role === "system" &&
                !message.content.includes("XP") &&
                !showFeedback &&
                message.content.includes("Advisor progress") ? null : (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 mr-2 mt-1">
                        <AvatarFallback
                          className={`${expertMode ? "bg-blue-500" : "bg-[rgb(124,108,167)]"} text-white`}
                        >
                          {expertMode ? "EX" : getInitials(clientProfile.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-[rgb(35,15,110)] text-white"
                          : message.role === "system"
                            ? message.content.includes("XP")
                              ? "bg-yellow-100 text-yellow-800 text-sm italic max-w-none text-center my-2 flex items-center justify-center"
                              : message.isWarning
                                ? "bg-red-100 text-red-800 text-sm italic max-w-none text-center my-2 flex items-center justify-center"
                                : "bg-gray-200 text-gray-700 text-sm italic max-w-none text-center my-2"
                            : "bg-white border"
                      }`}
                    >
                      {message.role === "system" && message.content.includes("XP") ? (
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                          {message.content}
                        </div>
                      ) : message.role === "system" && message.isWarning ? (
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                          {message.content}
                        </div>
                      ) : message.role !== "system" ? (
                        <span
                          className={`${expertMode ? "whitespace-pre-line" : ""}`}
                          dangerouslySetInnerHTML={{
                            __html: message.content
                              .replace(/\[(.*?)\]/g, '<span class="text-gray-500 italic">[$1]</span>')
                              .replace(/\n\n## (.*?)$/gm, '<br/><br/><strong class="text-blue-600 text-lg">$1</strong>')
                              .replace(/^## (.*?)$/gm, '<strong class="text-blue-600 text-lg">$1</strong>')
                              .replace(/\n- (.*?)$/gm, "<br/>• $1")
                              .replace(/^- (.*?)$/gm, "• $1")
                              .replace(/\n\d\. (.*?)$/gm, '<br/><span class="ml-2">$&</span>')
                              .replace(/\n/g, "<br/>"),
                          }}
                        />
                      ) : (
                        message.content
                      )}
                    </div>

                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 ml-2 mt-1">
                        <AvatarFallback className="bg-[rgb(80,63,139)] text-white">ME</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ),
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <Avatar className="h-8 w-8 mr-2 mt-1">
                    <AvatarFallback className={`${expertMode ? "bg-blue-500" : "bg-[rgb(124,108,167)]"} text-white`}>
                      {expertMode ? "EX" : getInitials(clientProfile.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border rounded-lg p-3 max-w-[80%]">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-300 animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t">
            <div className="flex space-x-2">
              <div className="flex flex-col space-y-1">
                <Button
                  onClick={toggleExpertMode}
                  variant="outline"
                  size="sm"
                  className={`${
                    expertMode
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white"
                      : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                  }`}
                >
                  {expertMode ? (
                    <>
                      <ArrowLeftCircle className="h-4 w-4 mr-2" />
                      Return to Client
                    </>
                  ) : (
                    <>
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Need Help?
                    </>
                  )}
                </Button>

                <Button
                  onClick={toggleFeedbackVisibility}
                  variant="outline"
                  size="sm"
                  className={`${
                    showFeedback
                      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white"
                      : "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
                  }`}
                >
                  {showFeedback ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Hide Feedback
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Show Feedback
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={expertMode ? "Ask for guidance..." : "Type your message..."}
                className="flex-1 resize-none"
                rows={2}
                disabled={!profileLoaded}
              />
              <Button
                onClick={handleSendMessage}
                className={`self-end ${
                  expertMode ? "bg-blue-600 hover:bg-blue-700" : "bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]"
                }`}
                disabled={!input.trim() || isTyping || !profileLoaded}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Notes */}
        <div className="w-64 bg-white p-4 overflow-auto border-l">
          {/* Notes Section - Now Collapsible with tracking */}
          <Collapsible open={isNotesOpen} onOpenChange={handleNotesToggle} className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-[rgb(35,15,110)]">Notes</h2>
              <CollapsibleTrigger className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100">
                <ChevronDown className="h-4 w-4 transition-transform duration-200 transform ui-open:rotate-180" />
                <span className="sr-only">Toggle notes</span>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <p className="text-xs text-gray-500 mb-2">Take notes during your conversation to reference later</p>
              <Textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="Add your notes here..."
                className="w-full resize-none"
                rows={12}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Debug Panel Toggle - Now Collapsible */}
          <Collapsible open={showDebugPanel} onOpenChange={setShowDebugPanel} className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-[rgb(35,15,110)]">Emotional Debug</h2>
              <CollapsibleTrigger className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100">
                <ChevronDown className="h-4 w-4 transition-transform duration-200 transform ui-open:rotate-180" />
                <span className="sr-only">Toggle debug panel</span>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              {/* Emotional State Debug Panel */}
              <EmotionalStateDebugPanel />
            </CollapsibleContent>
          </Collapsible>

          {/* Simulation Progress - Now Collapsible */}
          <Collapsible open={isProgressOpen} onOpenChange={setIsProgressOpen} className="mb-4">
            <Card className="border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center">
                  <Target className="h-4 w-4 text-[rgb(35,15,110)] mr-2" />
                  Simulation Progress
                </CardTitle>
                <CollapsibleTrigger className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100">
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 transform ui-open:rotate-180" />
                  <span className="sr-only">Toggle progress</span>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="p-3 text-xs">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Objectives Completed:</span>
                      <span className="font-bold">
                        {completedObjectivesCount}/{objectives.length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>XP Earned:</span>
                      <span className="font-bold">{totalXp}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Time Elapsed:</span>
                      <span className="font-bold">{formatTime(elapsedTime)}</span>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Simulation Tip - Now Collapsible */}
          <Collapsible open={isTipsOpen} onOpenChange={setIsTipsOpen}>
            <Card className="border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center">
                  <Info className="h-4 w-4 text-[rgb(35,15,110)] mr-2" />
                  Simulation Tip
                </CardTitle>
                <CollapsibleTrigger className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100">
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 transform ui-open:rotate-180" />
                  <span className="sr-only">Toggle tips</span>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="p-3 text-xs">
                  <p>
                    Ask open-ended questions to uncover the client's needs and concerns. Listen actively and take notes
                    on key points.
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    )
  }
  return <SimulationSession />
}
