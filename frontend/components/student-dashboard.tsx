"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CustomProgress } from "@/components/ui/custom-progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Play,
  Star,
  Trophy,
  TrendingUp,
  Check,
  BookOpen,
  Lightbulb,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { fetchCompetencies, fetchIndustryCompetencies } from "@/app/admin/industry-settings/actions"
import Link from "next/link"

// Type definitions
type Competency = {
  id: string
  name: string
  description: string
}

type IndustryCompetencies = {
  [industry: string]: {
    [subcategory: string]:
      | string[]
      | {
          [focus: string]: string[]
        }
  }
}

// Visualization types for skills analysis
export type VisualizationType = "ratings" | "bar" | "radar" | "distribution"

// Sample data for the student dashboard
const simulationHistory = [
  {
    id: "SIM-12345",
    date: "2023-04-15",
    industry: "insurance",
    industryDisplay: "Insurance",
    subcategory: "life-health",
    subcategoryDisplay: "Life & Health",
    difficulty: "Intermediate",
    duration: "12:45",
    xp: 325,
    objectivesMet: 3,
    totalObjectives: 4,
    competencyScores: {} as Record<string, number>, // Will be populated dynamically
  },
  {
    id: "SIM-12346",
    date: "2023-04-10",
    industry: "wealth-management",
    industryDisplay: "Wealth Management",
    subcategory: "default",
    subcategoryDisplay: "Retirement Planning",
    difficulty: "Beginner",
    duration: "08:30",
    xp: 275,
    objectivesMet: 4,
    totalObjectives: 4,
    competencyScores: {} as Record<string, number>, // Will be populated dynamically
  },
  {
    id: "SIM-12347",
    date: "2023-04-05",
    industry: "insurance",
    industryDisplay: "Insurance",
    subcategory: "property-casualty",
    subcategoryDisplay: "Property & Casualty",
    difficulty: "Advanced",
    duration: "15:20",
    xp: 420,
    objectivesMet: 2,
    totalObjectives: 4,
    competencyScores: {} as Record<string, number>, // Will be populated dynamically
  },
]

// Define colors for progress bars
const progressColors = {
  filled: "bg-[rgb(35,15,110)]", // Deep purple for filled portion
  background: "bg-[rgb(230,225,245)]", // Light purple for unfilled portion
}

// Define chart colors for different competencies
const chartColors = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff8042", // Orange
  "#0088fe", // Blue
  "#00C49F", // Teal
  "#FFBB28", // Gold
  "#FF8042", // Coral
  "#a4de6c", // Light Green
  "#d0ed57", // Lime
  "#8dd1e1", // Light Blue
  "#83a6ed", // Periwinkle
  "#a4add3", // Lavender
  "#d6b5d5", // Light Purple
  "#e1b5b5", // Light Red
  "#f4a582", // Light Orange
  "#92c5de", // Sky Blue
]

// Local storage key for saving user preferences
const VISUALIZATION_PREFERENCE_KEY = "skills_visualization_preference"

interface StudentDashboardProps {
  defaultVisualization?: VisualizationType
}

export function StudentDashboard({ defaultVisualization = "distribution" }: StudentDashboardProps) {
  const router = useRouter()
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [industryCompetencies, setIndustryCompetencies] = useState<IndustryCompetencies>({})
  const [isLoading, setIsLoading] = useState(true)
  const [competencyMap, setCompetencyMap] = useState<Record<string, string>>({})
  const [processedSimulations, setProcessedSimulations] = useState(simulationHistory)
  const [averageScores, setAverageScores] = useState<{ name: string; score: number }[]>([])
  const [competencyProgressionData, setCompetencyProgressionData] = useState<any[]>([])
  const [allCompetencies, setAllCompetencies] = useState<string[]>([])
  const [visualizationType, setVisualizationType] = useState<VisualizationType>(defaultVisualization)
  const [savedDefault, setSavedDefault] = useState<VisualizationType | null>(null)
  const [showSavedMessage, setShowSavedMessage] = useState(false)

  // Load user preference on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPreference = localStorage.getItem(VISUALIZATION_PREFERENCE_KEY) as VisualizationType | null
      if (savedPreference) {
        setVisualizationType(savedPreference)
        setSavedDefault(savedPreference)
      }
    }
  }, [])

  // Save visualization preference
  const saveVisualizationPreference = (type: VisualizationType) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(VISUALIZATION_PREFERENCE_KEY, type)
      setSavedDefault(type)
      setShowSavedMessage(true)

      // Hide the saved message after 3 seconds
      setTimeout(() => {
        setShowSavedMessage(false)
      }, 3000)
    }
  }

  // Calculate total XP
  const totalXP = processedSimulations.reduce((sum, sim) => sum + sim.xp, 0)

  // Agent level calculation
  const calculateAgentLevel = (xp: number) => {
    // Level progression formula: Each level requires base_xp * level^1.5
    // This creates an increasing curve where higher levels require more XP
    const levels = [
      { level: 1, title: "Trainee Agent", requiredXP: 0 },
      { level: 2, title: "Junior Agent", requiredXP: 500 },
      { level: 3, title: "Agent", requiredXP: 1200 },
      { level: 4, title: "Senior Agent", requiredXP: 2500 },
      { level: 5, title: "Expert Agent", requiredXP: 4500 },
      { level: 6, title: "Master Agent", requiredXP: 7500 },
      { level: 7, title: "Elite Agent", requiredXP: 12000 },
      { level: 8, title: "Specialist Agent", requiredXP: 18000 },
      { level: 9, title: "Principal Agent", requiredXP: 25000 },
      { level: 10, title: "Legendary Agent", requiredXP: 35000 },
    ]

    // Find current level
    let currentLevel = levels[0]
    let nextLevel = levels[1]

    for (let i = 1; i < levels.length; i++) {
      if (xp >= levels[i].requiredXP) {
        currentLevel = levels[i]
        nextLevel = levels[i + 1] || levels[i] // If max level, next level is the same
      } else {
        nextLevel = levels[i]
        break
      }
    }

    // Calculate progress to next level
    const currentLevelXP = currentLevel.requiredXP
    const nextLevelXP = nextLevel.requiredXP
    const xpForNextLevel = nextLevelXP - currentLevelXP
    const xpProgress = xp - currentLevelXP
    const progressPercentage = Math.min(100, Math.round((xpProgress / xpForNextLevel) * 100))
    const xpNeeded = nextLevelXP - xp

    return {
      currentLevel,
      nextLevel,
      xpForNextLevel,
      xpProgress,
      progressPercentage,
      xpNeeded,
      isMaxLevel: currentLevel.level === nextLevel.level,
    }
  }

  const agentLevelInfo = calculateAgentLevel(totalXP)

  // Load competencies and industry settings
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [allCompetencies, industryCompetenciesData] = await Promise.all([
          fetchCompetencies(),
          fetchIndustryCompetencies(),
        ])

        setCompetencies(allCompetencies || [])
        setIndustryCompetencies(industryCompetenciesData || {})

        // Create a map of competency IDs to names
        const compMap: Record<string, string> = {}
        if (Array.isArray(allCompetencies)) {
          allCompetencies.forEach((comp) => {
            compMap[comp.id] = comp.name
          })
        }
        setCompetencyMap(compMap)

        // Process simulations with competency data
        processSimulationData(simulationHistory, industryCompetenciesData || {}, compMap)
      } catch (error) {
        console.error("Error loading data:", error)
        // Fallback to hardcoded data if API fails
        setProcessedSimulations(simulationHistory)

        // Generate some default competency data for visualization
        const defaultCompNames = [
          "Communication",
          "Needs Assessment",
          "Objection Handling",
          "Bias Awareness",
          "Solution Recommendations",
          "Time Management",
        ]
        setAllCompetencies(defaultCompNames)

        // Generate default average scores
        const defaultScores = defaultCompNames.map((name) => ({
          name,
          score: Math.floor(Math.random() * 30) + 65, // Random score between 65-95
        }))
        setAverageScores(defaultScores)

        // Generate default progression data
        const defaultProgressionData = generateProgressionData(simulationHistory, defaultCompNames)
        setCompetencyProgressionData(defaultProgressionData)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Helper function to extract competency IDs from the new data structure
  const getCompetencyIds = (industryComps: IndustryCompetencies, industry: string, subcategory: string): string[] => {
    if (!industryComps || !industryComps[industry] || !industryComps[industry][subcategory]) {
      return []
    }

    const subcategoryData = industryComps[industry][subcategory]

    // If it's an array, return it directly (old format)
    if (Array.isArray(subcategoryData)) {
      return subcategoryData
    }

    // If it's an object with competencies property
    if (subcategoryData && subcategoryData.competencies && Array.isArray(subcategoryData.competencies)) {
      return subcategoryData.competencies
    }

    // If it's an object with focus areas, collect all competency IDs
    if (subcategoryData && subcategoryData.focusAreas) {
      const allCompetencyIds: string[] = []
      Object.values(subcategoryData.focusAreas).forEach((focusCompetencies) => {
        if (focusCompetencies && Array.isArray(focusCompetencies.competencies)) {
          allCompetencyIds.push(...focusCompetencies.competencies)
        }
      })
      return allCompetencyIds
    }

    return []
  }

  // Process simulation data with competency information
  const processSimulationData = (
    simulations: typeof simulationHistory,
    industryComps: IndustryCompetencies,
    compMap: Record<string, string>,
  ) => {
    // Generate random scores for competencies
    const processed = simulations.map((sim) => {
      const competencyIds = getCompetencyIds(industryComps, sim.industry, sim.subcategory)
      const scores: Record<string, number> = {}

      competencyIds.forEach((id) => {
        const name = compMap[id] || id
        // Generate a random score between 60 and 95
        scores[name] = Math.floor(Math.random() * 36) + 60
      })

      return {
        ...sim,
        competencyScores: scores,
      }
    })

    setProcessedSimulations(processed)

    // Get all unique competency names
    const allCompNames = new Set<string>()
    processed.forEach((sim) => {
      Object.keys(sim.competencyScores).forEach((comp) => {
        allCompNames.add(comp)
      })
    })
    const compNames = Array.from(allCompNames)
    setAllCompetencies(compNames)

    // Calculate average scores
    const avgScores = calculateAverageScores(processed, compNames)
    setAverageScores(avgScores)

    // Generate progression data
    const progressionData = generateProgressionData(processed, compNames)
    setCompetencyProgressionData(progressionData)
  }

  // Calculate average competency scores
  const calculateAverageScores = (simulations: typeof processedSimulations, competencyNames: string[]) => {
    const competencyTotals: Record<string, number> = {}
    const competencyCounts: Record<string, number> = {}

    // Initialize with all competencies
    competencyNames.forEach((comp) => {
      competencyTotals[comp] = 0
      competencyCounts[comp] = 0
    })

    // Sum up scores and count occurrences
    simulations.forEach((sim) => {
      Object.entries(sim.competencyScores).forEach(([comp, score]) => {
        competencyTotals[comp] = (competencyTotals[comp] || 0) + score
        competencyCounts[comp] = (competencyCounts[comp] || 0) + 1
      })
    })

    // Calculate averages
    return competencyNames
      .map((comp) => ({
        name: comp,
        score: Math.round(competencyTotals[comp] / (competencyCounts[comp] || 1)),
      }))
      .sort((a, b) => b.score - a.score) // Sort by highest score
  }

  // Generate progression data for competencies
  const generateProgressionData = (simulations: typeof processedSimulations, competencyNames: string[]) => {
    // Create 5 weeks of progression data
    const weeks = 5
    const data = []

    for (let i = 1; i <= weeks; i++) {
      const weekData: Record<string, any> = {
        date: `Week ${i}`,
      }

      competencyNames.forEach((comp) => {
        // Start with a base score between 40-60
        const baseScore = Math.floor(Math.random() * 21) + 40
        // Increase by 5-10 points per week
        const growth = Math.floor(Math.random() * 6) + 5
        weekData[comp] = Math.min(100, baseScore + growth * (i - 1))
      })

      data.push(weekData)
    }

    return data
  }

  // Prepare data for radar chart
  const prepareRadarData = () => {
    return averageScores.slice(0, 8).map((item) => ({
      subject: item.name,
      score: item.score,
      fullMark: 100,
    }))
  }

  // Prepare data for distribution chart
  const prepareDistributionData = () => {
    const ranges = [
      { name: "Beginner (0-60%)", range: [0, 60], color: "#FF8042" },
      { name: "Developing (61-70%)", range: [61, 70], color: "#FFBB28" },
      { name: "Proficient (71-80%)", range: [71, 80], color: "#00C49F" },
      { name: "Advanced (81-90%)", range: [81, 90], color: "#0088FE" },
      { name: "Expert (91-100%)", range: [91, 100], color: "#8884D8" },
    ]

    return ranges.map((range) => {
      const competenciesInRange = averageScores.filter(
        (score) => score.score >= range.range[0] && score.score <= range.range[1],
      )

      return {
        name: range.name,
        value: competenciesInRange.length,
        color: range.color,
        shortName: `${range.name.split(" ")[0]}`,
        competencies: competenciesInRange.map((c) => c.name),
      }
    })
  }

  // Render the selected visualization
  const renderVisualization = () => {
    switch (visualizationType) {
      case "bar":
        return (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={averageScores} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="score" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      case "radar":
        return (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={prepareRadarData()}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Competency Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
            {averageScores.length > 8 && (
              <div className="mt-4 text-sm text-center text-gray-500">Showing top 8 competencies for clarity.</div>
            )}
          </div>
        )
      case "distribution":
        const distributionData = prepareDistributionData()
        return (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="h-[400px] md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={4}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => {
                      const entry = props.payload
                      return [`${value} competencies (${(entry.percent * 100).toFixed(0)}%)`, entry.name]
                    }}
                    contentStyle={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e0e0e0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-lg font-medium mb-4">Proficiency Breakdown</h3>
              <div className="space-y-6">
                {distributionData.map((category) => (
                  <div key={category.name} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                      <h4 className="font-medium">
                        {category.name} ({category.value} competencies)
                      </h4>
                    </div>
                    {category.competencies.length > 0 ? (
                      <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                        {category.competencies.map((comp) => (
                          <li key={comp}>{comp}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No competencies in this range</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      case "ratings":
      default:
        return (
          <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
            {averageScores.map((competency) => (
              <div key={competency.name}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{competency.name}</span>
                  <div className="flex items-center">
                    {Array.from({ length: Math.floor(competency.score / 20) }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    {competency.score % 20 > 0 && <Star className="h-4 w-4 text-yellow-400" />}
                    {Array.from({ length: 5 - Math.ceil(competency.score / 20) }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-gray-300" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
                  <CustomProgress
                    value={competency.score}
                    className="h-2 flex-1"
                    indicatorColor={progressColors.filled}
                    bgColor={progressColors.background}
                  />
                  <span className="ml-2 text-sm font-medium">{competency.score}%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {competency.score >= 90
                    ? "Expert"
                    : competency.score >= 80
                      ? "Advanced"
                      : competency.score >= 70
                        ? "Proficient"
                        : competency.score >= 60
                          ? "Developing"
                          : "Beginner"}
                </p>
              </div>
            ))}
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-[rgb(35,15,110)]">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center text-white">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Welcome to Your Training Dashboard
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-200 md:text-xl">
                  Track your progress, view your simulation history, and continue improving your client interaction
                  skills.
                </p>
              </div>
              <div className="space-x-4">
                <Button
                  className="bg-white text-[rgb(35,15,110)] hover:bg-gray-200"
                  onClick={() => router.push("/simulation/attestation")}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start New Simulation
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Overview */}
        <section className="w-full py-12 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 md:grid-cols-4">
              {/* Agent Level Card */}
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Agent Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Badge className="mr-2 bg-[rgb(35,15,110)]">{agentLevelInfo.currentLevel.level}</Badge>
                    <div className="text-xl font-bold">{agentLevelInfo.currentLevel.title}</div>
                  </div>
                  {!agentLevelInfo.isMaxLevel && (
                    <>
                      <div className="mt-3 mb-1 flex justify-between text-xs">
                        <span>Progress to Level {agentLevelInfo.nextLevel.level}</span>
                        <span>{agentLevelInfo.progressPercentage}%</span>
                      </div>
                      <CustomProgress
                        value={agentLevelInfo.progressPercentage}
                        className="h-2"
                        indicatorColor={progressColors.filled}
                        bgColor={progressColors.background}
                      />
                      <p className="text-xs text-muted-foreground mt-2 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {agentLevelInfo.xpNeeded} XP needed for next level
                      </p>
                    </>
                  )}
                  {agentLevelInfo.isMaxLevel && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Maximum level reached! You're a Legendary Agent.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Total Simulations Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Simulations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{processedSimulations.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {new Set(processedSimulations.map((s) => s.industryDisplay)).size} industries
                  </p>
                </CardContent>
              </Card>

              {/* Total XP Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total XP Earned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                    <div className="text-2xl font-bold">{totalXP}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">Keep practicing to level up your skills</p>
                </CardContent>
              </Card>

              {/* Top Competency Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Top Competency</CardTitle>
                </CardHeader>
                <CardContent>
                  {averageScores.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold">{averageScores[0].name}</div>
                      <div className="flex items-center">
                        <CustomProgress
                          value={averageScores[0].score}
                          className="h-2 flex-1"
                          indicatorColor={progressColors.filled}
                          bgColor={progressColors.background}
                        />
                        <span className="ml-2 text-sm font-medium">{averageScores[0].score}%</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">Loading competency data...</div>
                  )}
                </CardContent>
              </Card>
              {/* Recommendations Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Recommended Exercises</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                    <div className="text-2xl font-bold">3</div>
                  </div>
                  <p className="text-xs text-muted-foreground">Personalized practice exercises</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-[rgb(35,15,110)] mt-2"
                    onClick={() => {
                      document
                        .querySelector('[data-value="resources"]')
                        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
                    }}
                  >
                    View Recommendations
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Main Dashboard Content */}
        <section className="w-full py-12">
          <div className="container px-4 md:px-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="text-lg font-medium">Loading dashboard data...</div>
                <div className="mt-2 text-sm text-gray-500">Please wait while we fetch your simulation data.</div>
              </div>
            ) : (
              <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-8">
                  <TabsTrigger value="history">Simulation History</TabsTrigger>
                  <TabsTrigger value="competencies">Competency Progress</TabsTrigger>
                  <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
                  <TabsTrigger value="resources">Resources & Recommendations</TabsTrigger>
                </TabsList>

                {/* Simulation History Tab */}
                <TabsContent value="history" className="space-y-4">
                  <h2 className="text-2xl font-bold">Your Simulation History</h2>
                  <div className="space-y-4">
                    {processedSimulations.map((simulation) => (
                      <Card key={simulation.id} className="overflow-hidden">
                        <div className="flex flex-col md:flex-row">
                          <div className="p-6 md:w-2/3">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-bold">
                                  {simulation.industryDisplay} - {simulation.subcategoryDisplay}
                                </h3>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {new Date(simulation.date).toLocaleDateString()}
                                  <Clock className="h-4 w-4 ml-3 mr-1" />
                                  {simulation.duration}
                                </div>
                              </div>
                              <Badge
                                variant={
                                  simulation.difficulty === "Beginner"
                                    ? "outline"
                                    : simulation.difficulty === "Intermediate"
                                      ? "secondary"
                                      : "destructive"
                                }
                                className={
                                  simulation.difficulty === "Intermediate"
                                    ? "bg-[rgb(180,165,220)] text-[rgb(35,15,110)]"
                                    : ""
                                }
                              >
                                {simulation.difficulty}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <div className="text-sm text-gray-500">XP Earned</div>
                                <div className="flex items-center">
                                  <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                                  <span className="font-bold">{simulation.xp}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">Objectives</div>
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                                  <span className="font-bold">
                                    {simulation.objectivesMet}/{simulation.totalObjectives}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Link href={`/simulation/history/${simulation.id}`}>
                              <Button variant="outline" size="sm" className="mt-2">
                                View Details
                              </Button>
                            </Link>
                          </div>
                          <div className="bg-gray-50 p-6 md:w-1/3">
                            <h4 className="text-sm font-medium mb-3">Competency Scores</h4>
                            <div className="space-y-3">
                              {Object.entries(simulation.competencyScores).map(([competency, score]) => (
                                <div key={competency}>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>{competency}</span>
                                    <span className="font-medium">{score}%</span>
                                  </div>
                                  <CustomProgress
                                    value={score}
                                    className="h-1.5"
                                    indicatorColor={progressColors.filled}
                                    bgColor={progressColors.background}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <div className="flex justify-center mt-6">
                    <Button
                      className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]"
                      onClick={() => router.push("/simulation/attestation")}
                    >
                      Start New Simulation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>

                {/* Competency Progress Tab */}
                <TabsContent value="competencies">
                  <h2 className="text-2xl font-bold mb-6">Competency Progression</h2>
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Progress Over Time</CardTitle>
                      <CardDescription>Track how your competencies have improved across simulations</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={competencyProgressionData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            {allCompetencies.slice(0, 8).map((competency, index) => (
                              <Line
                                key={competency}
                                type="monotone"
                                dataKey={competency}
                                stroke={chartColors[index % chartColors.length]}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      {allCompetencies.length > 8 && (
                        <div className="mt-4 text-sm text-center text-gray-500">
                          Showing top 8 competencies for clarity. View all in the Skills Analysis tab.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Skills Analysis Tab */}
                <TabsContent value="skills">
                  <h2 className="text-2xl font-bold mb-6">Skills Analysis</h2>
                  <Card>
                    <CardHeader>
                      <CardTitle>Competency Breakdown</CardTitle>
                      <CardDescription>Your performance across all competencies</CardDescription>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button
                          variant={visualizationType === "ratings" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setVisualizationType("ratings")}
                          className={visualizationType === "ratings" ? "bg-[rgb(35,15,110)]" : ""}
                        >
                          Skill Ratings
                        </Button>
                        <Button
                          variant={visualizationType === "bar" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setVisualizationType("bar")}
                          className={visualizationType === "bar" ? "bg-[rgb(35,15,110)]" : ""}
                        >
                          Bar Chart
                        </Button>
                        <Button
                          variant={visualizationType === "radar" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setVisualizationType("radar")}
                          className={visualizationType === "radar" ? "bg-[rgb(35,15,110)]" : ""}
                        >
                          Spider Graph
                        </Button>
                        <Button
                          variant={visualizationType === "distribution" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setVisualizationType("distribution")}
                          className={visualizationType === "distribution" ? "bg-[rgb(35,15,110)]" : ""}
                        >
                          Proficiency Distribution
                        </Button>
                      </div>

                      {/* Set as Default button */}
                      <div className="mt-2 flex items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => saveVisualizationPreference(visualizationType)}
                          className="text-xs"
                          disabled={savedDefault === visualizationType}
                        >
                          {savedDefault === visualizationType ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Default View
                            </>
                          ) : (
                            "Set as Default View"
                          )}
                        </Button>

                        {showSavedMessage && (
                          <span className="ml-2 text-xs text-green-600 animate-fade-in-out">
                            Preference saved! This view will be shown by default.
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">{renderVisualization()}</CardContent>
                  </Card>
                </TabsContent>

                {/* Resources & Recommendations Tab */}
                <TabsContent value="resources" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Recommended Practice Exercises</CardTitle>
                        <CardDescription>Personalized exercises based on your performance</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {averageScores.length > 0 ? (
                            <>
                              {/* Find lowest scoring competencies */}
                              {averageScores
                                .sort((a, b) => a.score - b.score)
                                .slice(0, 3)
                                .map((comp, index) => (
                                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="flex items-center">
                                          <h3 className="font-medium">{`${comp.name} Practice Exercise`}</h3>
                                          <Badge variant="outline" className="ml-2">
                                            Scenario
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">
                                          Improve your {comp.name.toLowerCase()} skills with this targeted exercise.
                                        </p>
                                        <div className="flex items-center mt-2 text-xs text-gray-500">
                                          <Clock className="h-3 w-3 mr-1" />
                                          <span className="mr-3">10-15 min</span>
                                          <Star className="h-3 w-3 mr-1" />
                                          <span>
                                            {comp.score < 70
                                              ? "Beginner"
                                              : comp.score < 85
                                                ? "Intermediate"
                                                : "Advanced"}
                                          </span>
                                        </div>
                                      </div>
                                      <Button
                                        className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]"
                                        onClick={() => router.push("/simulation/attestation")}
                                      >
                                        <Play className="h-4 w-4 mr-1" />
                                        Start
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              <Button
                                variant="outline"
                                className="w-full mt-2"
                                onClick={() => router.push("/simulation/practice")}
                              >
                                View All Practice Exercises
                              </Button>
                            </>
                          ) : (
                            <div className="text-center py-8">
                              <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                              <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                              <p className="text-gray-500">
                                Complete a simulation to receive personalized recommendations.
                              </p>
                              <Button
                                className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)] mt-4"
                                onClick={() => router.push("/simulation/attestation")}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Start Simulation
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Learning Resources</CardTitle>
                        <CardDescription>Educational materials to help improve your skills</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <BookOpen className="h-5 w-5 text-[rgb(35,15,110)] mt-0.5" />
                              <div>
                                <h3 className="font-medium">Client Needs Assessment Guide</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  Learn effective techniques for identifying client needs and priorities.
                                </p>
                                <Button variant="link" className="p-0 h-auto text-[rgb(35,15,110)] mt-1">
                                  View Resource
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <BookOpen className="h-5 w-5 text-[rgb(35,15,110)] mt-0.5" />
                              <div>
                                <h3 className="font-medium">Objection Handling Techniques</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  Master strategies for addressing client concerns and objections.
                                </p>
                                <Button variant="link" className="p-0 h-auto text-[rgb(35,15,110)] mt-1">
                                  View Resource
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-3">
                              <BookOpen className="h-5 w-5 text-[rgb(35,15,110)] mt-0.5" />
                              <div>
                                <h3 className="font-medium">Effective Communication Skills</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  Enhance your verbal and non-verbal communication techniques.
                                </p>
                                <Button variant="link" className="p-0 h-auto text-[rgb(35,15,110)] mt-1">
                                  View Resource
                                </Button>
                              </div>
                            </div>
                          </div>

                          <Button variant="outline" className="w-full mt-2" onClick={() => router.push("/resources")}>
                            View All Resources
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
