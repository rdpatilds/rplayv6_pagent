"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CustomProgress } from "@/components/ui/custom-progress"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Home,
  RotateCw,
  Star,
  Trophy,
  XCircle,
  BookOpen,
  Play,
  Lightbulb,
  RefreshCw,
  User,
  CircleDollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

// Define colors for progress bars
const progressColors = {
  filled: "bg-[rgb(35,15,110)]", // Deep purple for filled portion
  background: "bg-[rgb(230,225,245)]", // Light purple for unfilled portion
}

// Define chart colors
const chartColors = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff8042", // Orange
  "#0088fe", // Blue
  "#00C49F", // Teal
]

export default function SimulationDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const simulationId = params.id
  const [simulation, setSimulation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real application, you would fetch the simulation data from an API
    // For now, we'll use mock data based on the ID
    const fetchSimulationDetails = async () => {
      setLoading(true)
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Mock data for the simulation
        const mockSimulation = {
          id: simulationId,
          date: "2023-04-15",
          industry: "Insurance",
          subcategory: "Life & Health",
          difficulty: "Intermediate",
          duration: "12:45",
          xp: 325,
          objectivesMet: 3,
          totalObjectives: 3,
          overallScore: 7.8,
          summary:
            "You demonstrated good knowledge of insurance concepts and built rapport effectively. There's room for improvement in needs assessment and addressing client concerns.",
          competencyScores: {
            Communication: 85,
            "Needs Assessment": 72,
            "Addressing Concerns": 68,
            "Product Knowledge": 88,
            "Rapport Building": 82,
            "Time Management": 76,
          },
          objectives: [
            {
              id: 1,
              name: "Establish Rapport",
              description: "Successfully build rapport with the client in the first 5 minutes",
              completed: true,
              xp: 75,
            },
            {
              id: 2,
              name: "Conduct Needs Analysis",
              description: "Identify at least 3 key client needs through effective questioning",
              completed: true,
              xp: 100,
            },
            {
              id: 3,
              name: "Present Information",
              description: "Present appropriate information that addresses client needs",
              completed: true,
              xp: 150,
            },
          ],
          strengths: [
            "Demonstrated exceptional knowledge throughout the conversation, particularly when explaining the differences between financial concepts with precise details",
            "Built strong rapport in the opening conversation by remembering personal details the client had shared previously, such as their children's names and recent family vacation, creating a foundation of trust",
            "Provided clear and concise explanations of complex concepts using effective analogies, such as comparing policy features to smartphone customization options that resonated well with the client's technology background",
            "Used effective questioning techniques including open-ended, probing, and reflective questions that successfully uncovered the client's unstated concern about business continuation planning",
            "Maintained professional tone when addressing client concerns, particularly when discussing costs by relating the value back to the client's stated priority of family protection",
          ],
          improvements: [
            "Needs assessment phase would benefit from a more structured approach - consider implementing the LIFE method (Liabilities, Income needs, Future goals, Estate planning) to ensure comprehensive coverage of all potential need areas",
            "When the client raised cost concerns at 11:20, you attempted to address the concern without fully exploring the underlying issue - develop the habit of asking 'What specifically concerns you about this amount?' before presenting additional information",
            "Time allocation needs improvement with disproportionate time spent on information presentation (7 minutes) compared to needs assessment (3 minutes) and addressing concerns (2 minutes) - aim for a 30/40/30 distribution for discovery/presentation/discussion",
            "Several opportunities to connect features to benefits were missed, particularly when discussing income protection options - remember to consistently use the 'which means that...' bridge to translate features into personal benefits for the client",
            "The consultation conclusion appeared hesitant, with three separate attempts to summarize next steps - develop a more confident approach with clearer action items and specific follow-up plans",
          ],
          timeline: [
            { minute: 0, event: "Introduction and rapport building", score: 85 },
            { minute: 3, event: "Discovery of client needs", score: 72 },
            { minute: 7, event: "Information presentation", score: 88 },
            { minute: 10, event: "Addressing client concerns", score: 68 },
            { minute: 13, event: "Consultation conclusion", score: 65 },
          ],
          competencyDetails: [
            {
              name: "Communication",
              score: 85,
              strengths: [
                "Demonstrated exceptional clarity when explaining complex terms, particularly when discussing the difference between various financial options",
                "Used appropriate pacing throughout most of the conversation, allowing the client time to process information",
                "Effectively used analogies to simplify complex concepts, such as comparing features to 'add-ons' for a car purchase",
                "Adjusted communication style appropriately when client expressed confusion about financial structures",
              ],
              improvements: [
                "When discussing exclusions at 8:45 into the conversation, technical jargon created momentary confusion for the client - consider simplifying terms like 'contestability period' and 'material misrepresentation'",
                "Pace of delivery accelerated when covering limitations - remember to maintain consistent, measured speech especially when discussing complex or potentially concerning information",
                "Consider incorporating more checking questions to confirm client understanding throughout the presentation",
                "Some responses were overly lengthy, particularly when explaining optional features - practice more concise explanations focusing on benefits relevant to the client's expressed needs",
              ],
            },
            {
              name: "Needs Assessment",
              score: 72,
              strengths: [
                "Excellent use of open-ended questions that revealed the client's concern about their children's education funding",
                "Effectively used follow-up probing questions when client mentioned retirement concerns at 5:20 into the conversation",
                "Successfully uncovered unstated need for family coverage through thoughtful questioning about family situation",
                "Demonstrated active listening by referencing previously mentioned client concerns when discussing options",
              ],
              improvements: [
                "Missed opportunity to explore client's risk tolerance when they mentioned market volatility concerns - this would have helped tailor the information between fixed and variable options",
                "Financial needs analysis lacked specific dollar amounts for income replacement needs - incorporate more quantitative assessment using the DIME method (Debt, Income, Mortgage, Education)",
                "When client mentioned their existing coverage at 4:15, you didn't probe sufficiently about coverage amounts and types - this information gap led to potentially redundant information",
                "Consider using a more structured needs assessment framework to ensure comprehensive coverage of all potential need areas (protection, savings, retirement, health, etc.)",
              ],
            },
            {
              name: "Addressing Concerns",
              score: 68,
              strengths: [
                "Effectively acknowledged client's cost concern without becoming defensive, creating space for productive dialogue",
                "Successfully used third-party stories to address concern about complexity at 9:30",
                "Demonstrated good preparation by having comparison data ready when client raised questions about alternative options",
                "Maintained positive tone when addressing multiple consecutive concerns during the concluding phase",
              ],
              improvements: [
                "When client expressed concern about the cost at 11:20, you attempted to address the concern without fully exploring the underlying issue - remember to probe with 'what specifically concerns you about this amount?'",
                "Relied too heavily on feature explanations rather than connecting benefits to previously identified needs when handling the 'too complicated' concern",
                "Missed opportunity to use feel-felt-found technique when client expressed concern about requirements",
                "When faced with the 'need to think about it' response at 12:45, you accepted it too readily instead of exploring specific hesitations - practice using the 'what specifically do you need to think about?' follow-up",
              ],
            },
            {
              name: "Product Knowledge",
              score: 88,
              strengths: [
                "Demonstrated exceptional understanding of the difference between term and permanent options, including specific provisions and exclusions",
                "Accurately explained complex optional features including the accelerated benefit and premium waiver provisions",
                "Effectively compared and contrasted different options with precise details",
                "Showed strong knowledge of requirements and how specific health conditions might affect eligibility and ratings",
              ],
              improvements: [
                "When discussing the investment component at 10:15, explanation lacked specific details about current interest rates and historical performance",
                "Explanation of the contestability period contained a minor inaccuracy regarding the timeframe for exclusions - ensure all technical details are precisely accurate",
                "Consider developing more knowledge about the tax implications of different structures, particularly regarding loans and surrenders",
                "When client asked about the claims process at 11:45, your explanation lacked specific details about required documentation and typical processing timeframes",
              ],
            },
            {
              name: "Rapport Building",
              score: 82,
              strengths: [
                "Excellent use of personal connection by remembering client's children's names and ages throughout the conversation",
                "Created comfortable atmosphere through appropriate use of humor when discussing family vacation plans",
                "Demonstrated genuine interest in client's career transition mentioned during initial conversation",
                "Used appropriate verbal acknowledgments and affirmations when client shared personal information",
              ],
              improvements: [
                "Initial rapport building felt somewhat rushed at 1:30, spending only 2 minutes before transitioning to business discussion - consider allowing more time for relationship development before shifting focus",
                "Missed opportunity to connect on client's mentioned interest in golf, which could have established common ground",
                "When client shared concern about recent health issue at 3:15, verbal acknowledgment felt mechanical rather than empathetic - practice more authentic verbal responses",
                "Transition from rapport building to needs assessment was abrupt - develop smoother transitional phrases that maintain the connection while moving the conversation forward",
              ],
            },
            {
              name: "Time Management",
              score: 76,
              strengths: [
                "Maintained excellent control of overall appointment length, completing within scheduled time",
                "Efficiently handled administrative explanations regarding documentation",
                "Demonstrated good prioritization by allocating appropriate time to the most suitable options",
                "Effectively used summary techniques to keep conversation on track when client began discussing unrelated matters",
              ],
              improvements: [
                "Spent disproportionate time (7 minutes) on information presentation compared to only 3 minutes on needs assessment - aim for better balance with more time allocated to understanding needs",
                "Rushed through important concern handling at 11:20, allocating only 90 seconds to address cost concerns - this critical phase deserves more patient attention",
                "Failed to set clear agenda and expectations at beginning of meeting, which contributed to time management challenges",
                "Consider using more frequent time checks and signposting (e.g., 'For the next few minutes, I'd like to focus on understanding your family's protection needs before we explore solutions')",
              ],
            },
          ],
          practiceExercises: [
            {
              id: "ex-001",
              title: "Client Concern Resolution Practice",
              type: "Scenario",
              competency: "Addressing Concerns",
              description:
                "Practice addressing common client concerns with this targeted scenario focused on cost objections and value communication.",
              difficulty: "Intermediate",
              duration: "10-15 min",
              scenario: {
                industry: "Insurance",
                subcategory: "Life & Health",
                clientProfile: {
                  name: "Michael Chen",
                  age: 38,
                  occupation: "Software Engineer",
                  concerns: [
                    "Premium costs seem high",
                    "Unsure about value vs. term options",
                    "Worried about underwriting",
                  ],
                },
                objectives: [
                  "Explore underlying concerns",
                  "Address cost objections effectively",
                  "Communicate value clearly",
                ],
              },
            },
            {
              id: "ex-002",
              title: "Structured Needs Assessment Exercise",
              type: "Role Play",
              competency: "Needs Assessment",
              description:
                "Improve your discovery skills with this guided needs assessment scenario using the LIFE framework.",
              difficulty: "Intermediate",
              duration: "15-20 min",
              scenario: {
                industry: "Insurance",
                subcategory: "Life & Health",
                clientProfile: {
                  name: "Sarah Johnson",
                  age: 42,
                  occupation: "Small Business Owner",
                  situation:
                    "Recently divorced with two teenage children, concerned about college funding and retirement",
                },
                objectives: [
                  "Apply LIFE framework comprehensively",
                  "Use effective probing questions",
                  "Uncover unstated needs",
                ],
              },
            },
            {
              id: "ex-003",
              title: "Effective Communication Drill",
              type: "Interactive Quiz",
              competency: "Communication",
              description: "Test and improve your ability to translate complex concepts into client-friendly language.",
              difficulty: "Beginner",
              duration: "5-10 min",
              format: "Multiple choice scenarios with feedback",
            },
            {
              id: "ex-004",
              title: "Rapport Building Simulation",
              type: "Scenario",
              competency: "Rapport Building",
              description: "Practice establishing authentic connections with clients from diverse backgrounds.",
              difficulty: "Beginner",
              duration: "10-15 min",
              scenario: {
                industry: "Wealth Management",
                clientProfile: {
                  name: "Robert & Maria Garcia",
                  age: "45 & 43",
                  occupation: "Healthcare professionals",
                  interests: ["Travel", "Education", "Community involvement"],
                },
                objectives: ["Establish authentic connection", "Find common ground", "Create comfortable atmosphere"],
              },
            },
            {
              id: "ex-005",
              title: "Time Management Challenge",
              type: "Timed Exercise",
              competency: "Time Management",
              description: "Practice efficient meeting management with this timed consultation scenario.",
              difficulty: "Advanced",
              duration: "20 min",
              scenario: {
                industry: "Securities",
                clientProfile: {
                  name: "James Wilson",
                  age: 58,
                  occupation: "Retiring Executive",
                  situation: "Complex portfolio, multiple goals, limited time",
                },
                objectives: [
                  "Complete full consultation in 20 minutes",
                  "Cover all essential topics",
                  "Maintain quality interaction",
                ],
              },
            },
          ],
          // Add conversation history
          conversationHistory: [
            { role: "system", content: "Simulation started. Your client will join shortly." },
            {
              role: "assistant",
              content:
                "Hello there! I'm John Smith. [extends hand] It's nice to meet you. I appreciate you taking the time to meet with me today. My wife and I have been thinking about our family's financial future, especially with our two kids growing up so fast.",
              timestamp: "00:00:15",
            },
            {
              role: "user",
              content:
                "It's great to meet you too, John. Thank you for coming in today. I understand how important it is to plan for your family's future. Could you tell me a bit more about your children?",
              timestamp: "00:00:42",
            },
            {
              role: "assistant",
              content:
                "Of course! We have two kids - Emma is 10 and Michael is 8. They're both doing well in school. Emma is really into soccer and science, while Michael loves art and swimming. My wife Sarah and I want to make sure they have opportunities for college when the time comes, but we're also concerned about protecting our family if something were to happen to either of us.",
              timestamp: "00:01:15",
            },
            {
              role: "user",
              content:
                "Thank you for sharing that. It sounds like you have a wonderful family. I'd like to understand more about your current financial situation and goals. Could you tell me about your current coverage and what specific concerns brought you in today?",
              timestamp: "00:01:48",
            },
            {
              role: "assistant",
              content:
                "Well, I have some life insurance through my employer - about $100,000 in coverage. Sarah doesn't have any coverage through her work. We're worried that's not enough if something happened to me. I'm the primary earner as a high school teacher, making about $65,000 a year. Sarah works part-time as a graphic designer. We have a mortgage of about $180,000 left on our home, and we're trying to save for the kids' college funds, but it's challenging. I'm concerned that if something happened to me, Sarah would struggle financially with the mortgage, daily expenses, and saving for the kids' education.",
              timestamp: "00:02:45",
            },
            {
              role: "user",
              content:
                "I appreciate you sharing those details, John. You're right to be thinking about these things. The coverage through your employer is a good start, but it's typically recommended to have coverage that's 5-10 times your annual income, especially with young children and ongoing financial obligations like your mortgage. What specific questions do you have about life insurance options?",
              timestamp: "00:03:30",
            },
            {
              role: "assistant",
              content:
                "I've heard about term and permanent insurance, but I'm not sure which would be better for our situation. Term seems cheaper, but I wonder if I'm missing out on benefits with permanent insurance. Also, how do I figure out exactly how much coverage we need? And honestly, I'm a bit concerned about the cost - we're already stretching our budget with mortgage payments and trying to save for college.",
              timestamp: "00:04:15",
            },
            {
              role: "system",
              content: "You earned 50 XP for: Building rapport with the client",
              timestamp: "00:04:20",
            },
            {
              role: "user",
              content:
                "Those are excellent questions, John. Let's address each one. First, regarding term versus permanent insurance, both have their place depending on your goals. Term insurance provides coverage for a specific period - like 20 or 30 years - and is typically more affordable. It's often ideal for covering specific financial obligations that will eventually end, like your mortgage or providing for your children until they're independent. Permanent insurance, on the other hand, covers you for your entire life and builds cash value over time, but comes with higher premiums. For determining the right amount of coverage, we should look at your specific needs including income replacement, debt payoff, education funding, and final expenses. Would it be helpful if I walked you through a needs analysis to calculate a more precise figure?",
              timestamp: "00:05:30",
            },
            {
              role: "assistant",
              content:
                "Yes, that would be very helpful. I want to make sure we have enough coverage but don't want to pay for more than we need. And I appreciate the explanation about term versus permanent. Given our budget constraints, term might make more sense for us right now, but I'd like to understand the long-term implications of that choice.",
              timestamp: "00:06:10",
            },
            // Additional conversation messages would continue here
          ],
          clientProfile: {
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
          },
        }

        setSimulation(mockSimulation)
      } catch (error) {
        console.error("Error fetching simulation details:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSimulationDetails()
  }, [simulationId])

  // Function to export the review as PDF (placeholder)
  const exportReport = () => {
    alert("Export functionality would be implemented here")
  }

  // Function to launch a practice exercise (placeholder)
  const launchPracticeExercise = (exercise) => {
    // In a real implementation, this would store the exercise details in session storage
    // and redirect to a simulation page configured for this specific exercise
    sessionStorage.setItem("practiceExercise", JSON.stringify(exercise))

    // Alert for now, but would redirect to simulation in real implementation
    alert(`Launching practice exercise: ${exercise.title}`)

    // Uncomment this when the simulation page is ready to accept practice exercises
    // router.push(`/simulation/practice/${exercise.id}`)
  }

  // Updated function to replay this simulation with version tracking
  const replaySimulation = () => {
    if (!simulation) return

    // Store the simulation settings and client profile in session storage
    sessionStorage.setItem("selectedIndustry", simulation.industry.toLowerCase())
    sessionStorage.setItem("selectedSubcategory", simulation.subcategory.toLowerCase().replace(" & ", "-"))
    sessionStorage.setItem("selectedDifficulty", simulation.difficulty.toLowerCase())

    // Make sure to stringify the entire client profile object
    sessionStorage.setItem("clientProfile", JSON.stringify(simulation.clientProfile))

    // Also store selected competencies if available
    if (simulation.competencyDetails) {
      const competencies = simulation.competencyDetails.map((comp) => ({
        id: comp.name.toLowerCase().replace(/\s+/g, "-"),
        name: comp.name,
      }))
      sessionStorage.setItem("selectedCompetencies", JSON.stringify(competencies))
    }

    // Get the current retry count for this simulation
    let retryCount = 1
    const storedRetryCount = sessionStorage.getItem(`retryCount_${simulationId}`)
    if (storedRetryCount) {
      retryCount = Number.parseInt(storedRetryCount) + 1
    }
    sessionStorage.setItem(`retryCount_${simulationId}`, retryCount.toString())

    // Generate a new simulation ID with the retry number
    // Format: original ID + "-" + retry number with leading zero
    const retryNumberFormatted = retryCount.toString().padStart(2, "0")
    const newSimId = `${simulationId}-${retryNumberFormatted}`

    sessionStorage.setItem("currentSimulationId", newSimId)

    // Store the original simulation ID for reference
    sessionStorage.setItem("originalSimulationId", simulationId)

    // Set a flag to indicate this is a replay
    sessionStorage.setItem("isReplay", "true")

    // Redirect to the simulation session page
    router.push(`/simulation/session?simulationId=${newSimId}`)
  }

  // Prepare data for radar chart
  const prepareRadarData = () => {
    if (!simulation) return []

    return Object.entries(simulation.competencyScores).map(([name, score]) => ({
      subject: name,
      score: score,
      fullMark: 100,
    }))
  }

  // Prepare data for timeline chart
  const prepareTimelineData = () => {
    if (!simulation) return []
    return simulation.timeline
  }

  // Get recommended exercises based on competency scores
  const getRecommendedExercises = () => {
    if (!simulation) return []

    // Find the lowest scoring competencies
    const sortedCompetencies = Object.entries(simulation.competencyScores)
      .sort(([, scoreA], [, scoreB]) => Number(scoreA) - Number(scoreB))
      .map(([name]) => name)
      .slice(0, 3) // Get the three lowest scoring competencies

    // Filter exercises that match these competencies
    return simulation.practiceExercises
      .filter((exercise) => sortedCompetencies.includes(exercise.competency))
      .slice(0, 3) // Limit to 3 exercises
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[rgb(35,15,110)]">Loading Simulation Details...</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(35,15,110)]"></div>
        </div>
      </div>
    )
  }

  if (!simulation) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[rgb(35,15,110)]">Simulation Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-lg text-center mb-4">We couldn't find the simulation with ID: {simulationId}</p>
            <div className="flex justify-center">
              <Link href="/">
                <Button className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]">
                  <Home className="mr-2 h-4 w-4" />
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get recommended exercises
  const recommendedExercises = getRecommendedExercises()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(35,15,110)]">Simulation Details</h1>
          <p className="text-gray-500 mt-2">ID: {simulation.id}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]" onClick={replaySimulation}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Replay Simulation
          </Button>
        </div>
      </div>

      {/* Client Profile */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <User className="h-5 w-5 mr-2 text-[rgb(35,15,110)]" />
            <div>
              <CardTitle>Client Profile</CardTitle>
              <CardDescription>Details about the client in this simulation</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/3">
              <div className="flex items-center space-x-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-[rgb(124,108,167)] text-white">JS</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">John Smith</div>
                  <div className="text-sm text-gray-500">42 years old</div>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Occupation:</strong> High School Teacher
                </div>
                <div>
                  <strong>Family:</strong> Married with 2 children (ages 10 and 8)
                </div>
              </div>
            </div>

            <div className="md:w-2/3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="border rounded-md p-3">
                  <div className="text-sm font-medium text-gray-500">Income Level</div>
                  <div className="font-semibold flex items-center">
                    <CircleDollarSign className="h-4 w-4 mr-1 text-green-600" />
                    <Badge variant="outline" className="bg-green-50 text-green-700 font-normal">
                      Moderate
                    </Badge>
                  </div>
                </div>

                <div className="border rounded-md p-3">
                  <div className="text-sm font-medium text-gray-500">Asset Level</div>
                  <div className="font-semibold flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1 text-blue-600" />
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 font-normal">
                      Moderate
                    </Badge>
                  </div>
                </div>

                <div className="border rounded-md p-3">
                  <div className="text-sm font-medium text-gray-500">Debt Level</div>
                  <div className="font-semibold flex items-center">
                    <TrendingDown className="h-4 w-4 mr-1 text-amber-600" />
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 font-normal">
                      Moderate-High
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Financial Goals:</div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-gray-100">
                    Protect family financially
                  </Badge>
                  <Badge variant="outline" className="bg-gray-100">
                    Save for children's college
                  </Badge>
                  <Badge variant="outline" className="bg-gray-100">
                    Ensure retirement savings
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Simulation Summary</CardTitle>
            <CardDescription>Overview of your simulation session</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Industry:</div>
              <div>
                {simulation.industry} - {simulation.subcategory}
              </div>

              <div className="font-medium">Difficulty:</div>
              <div>
                <Badge
                  variant={
                    simulation.difficulty === "Beginner"
                      ? "outline"
                      : simulation.difficulty === "Intermediate"
                        ? "secondary"
                        : "destructive"
                  }
                  className={
                    simulation.difficulty === "Intermediate" ? "bg-[rgb(180,165,220)] text-[rgb(35,15,110)]" : ""
                  }
                >
                  {simulation.difficulty}
                </Badge>
              </div>

              <div className="font-medium">Date:</div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(simulation.date).toLocaleDateString()}
              </div>

              <div className="font-medium">Duration:</div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {simulation.duration}
              </div>

              <div className="font-medium">Overall Score:</div>
              <div className="font-bold text-[rgb(35,15,110)]">{simulation.overallScore}/10</div>

              <div className="font-medium">XP Earned:</div>
              <div className="flex items-center font-bold text-[rgb(35,15,110)]">
                <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                {simulation.xp} XP
              </div>

              <div className="font-medium">Objectives:</div>
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                <span>
                  {simulation.objectivesMet}/{simulation.totalObjectives} completed
                </span>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="text-sm font-medium mb-2">Performance Summary</h3>
              <p className="text-sm text-gray-600">{simulation.summary}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Competency Performance</CardTitle>
            <CardDescription>Your performance across key competencies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={prepareRadarData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Competency Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="objectives" className="w-full">
        <TabsList className="grid w-full grid-cols-6 mb-8">
          <TabsTrigger value="objectives">Objectives</TabsTrigger>
          <TabsTrigger value="competencies">Competency Details</TabsTrigger>
          <TabsTrigger value="timeline">Simulation Timeline</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
        </TabsList>

        {/* Objectives Tab */}
        <TabsContent value="objectives" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Objectives</CardTitle>
              <CardDescription>Your progress on key objectives for this simulation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {simulation.objectives.map((objective: any) => (
                  <div
                    key={objective.id}
                    className={`flex items-start space-x-4 p-4 rounded-lg border ${
                      objective.completed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}
                  >
                    {objective.completed ? (
                      <CheckCircle className="h-6 w-6 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{objective.name}</h3>
                        <Badge variant="outline" className="ml-2">
                          {objective.xp} XP
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{objective.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Takeaways</CardTitle>
              <CardDescription>Strengths and areas for improvement</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-green-600 mb-2">Strengths</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  {simulation.strengths.map((strength: string, index: number) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium text-amber-600 mb-2">Areas for Improvement</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm">
                  {simulation.improvements.map((improvement: string, index: number) => (
                    <li key={index}>{improvement}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competency Details Tab */}
        <TabsContent value="competencies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Competency Analysis</CardTitle>
              <CardDescription>In-depth breakdown of your performance in each competency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {simulation.competencyDetails.map((competency: any, index: number) => (
                  <div key={index} className="border-b pb-6 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">{competency.name}</h3>
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

                    <div className="flex items-center mb-4">
                      <CustomProgress
                        value={competency.score}
                        className="h-2 flex-1"
                        indicatorColor={progressColors.filled}
                        bgColor={progressColors.background}
                      />
                      <span className="ml-2 text-sm font-medium">{competency.score}%</span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="text-sm font-medium text-green-600 mb-2">Strengths</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {competency.strengths.map((strength: string, idx: number) => (
                            <li key={idx}>{strength}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-amber-600 mb-2">Areas for Improvement</h4>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          {competency.improvements.map((improvement: string, idx: number) => (
                            <li key={idx}>{improvement}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          {/* Add this new explanatory card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Lightbulb className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-800 mb-1">Understanding the Timeline</h3>
                  <p className="text-sm text-blue-700">
                    This timeline shows your performance throughout the simulation. The percentages represent your
                    effectiveness score at key moments:
                  </p>
                  <ul className="text-sm text-blue-700 mt-1 list-disc pl-5 space-y-1">
                    <li>
                      <span className="font-medium">80-100%</span>: Excellent performance
                    </li>
                    <li>
                      <span className="font-medium">70-79%</span>: Good performance
                    </li>
                    <li>
                      <span className="font-medium">60-69%</span>: Adequate performance
                    </li>
                    <li>
                      <span className="font-medium">Below 60%</span>: Needs improvement
                    </li>
                  </ul>
                  <p className="text-sm text-blue-700 mt-1">
                    Use this information to identify which phases of your client interaction were strongest and which
                    need improvement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Simulation Timeline</CardTitle>
              <CardDescription>Performance throughout the simulation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareTimelineData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="minute"
                      label={{ value: "Time (minutes)", position: "insideBottomRight", offset: -5 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      label={{ value: "Performance Score", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Key Moments</h3>
                <div className="space-y-3">
                  {simulation.timeline.map((point: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 border-l-2 border-[rgb(35,15,110)] pl-4 pb-4"
                    >
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium">Minute {point.minute}</span>
                          <Badge className="ml-2" variant="outline">
                            {point.score}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{point.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>Practice exercises tailored to your improvement areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recommendedExercises.map((exercise) => (
                  <div key={exercise.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium">{exercise.title}</h3>
                          <Badge variant="outline" className="ml-2">
                            {exercise.type}
                          </Badge>
                          <Badge variant="secondary" className="ml-2 bg-[rgb(180,165,220)] text-[rgb(35,15,110)]">
                            {exercise.competency}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{exercise.description}</p>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span className="mr-3">{exercise.duration}</span>
                          <Star className="h-3 w-3 mr-1" />
                          <span>{exercise.difficulty}</span>
                        </div>
                      </div>
                      <Button
                        className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]"
                        onClick={() => launchPracticeExercise(exercise)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start Exercise
                      </Button>
                    </div>
                  </div>
                ))}

                {recommendedExercises.length === 0 && (
                  <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No personalized recommendations yet</h3>
                    <p className="text-gray-500">Complete more simulations to receive tailored practice exercises.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All Practice Exercises</CardTitle>
              <CardDescription>Browse all available practice exercises</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {simulation.practiceExercises.map((exercise) => (
                  <div key={exercise.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{exercise.title}</h3>
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="mr-2">
                            {exercise.type}
                          </Badge>
                          <Badge variant="secondary" className="bg-[rgb(180,165,220)] text-[rgb(35,15,110)]">
                            {exercise.competency}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => launchPracticeExercise(exercise)}>
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Resources</CardTitle>
              <CardDescription>Educational materials to help improve your skills</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Resources Coming Soon</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  Your administrator will soon be able to upload custom learning resources that will appear here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversation Tab */}
        <TabsContent value="conversation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Conversation</CardTitle>
              <CardDescription>Complete transcript of your conversation with the client</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {simulation.conversationHistory.map((message, index) => (
                    <div key={index} className="space-y-2">
                      {message.timestamp && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {message.timestamp}
                        </div>
                      )}
                      <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        {message.role === "assistant" && (
                          <Avatar className="h-8 w-8 mr-2 mt-1">
                            <AvatarFallback className="bg-[rgb(124,108,167)] text-white">JS</AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === "user"
                              ? "bg-[rgb(35,15,110)] text-white"
                              : message.role === "system"
                                ? message.content.includes("XP")
                                  ? "bg-yellow-100 text-yellow-800 text-sm italic max-w-none text-center my-2 flex items-center justify-center"
                                  : "bg-gray-200 text-gray-700 text-sm italic max-w-none text-center my-2"
                                : "bg-white border"
                          }`}
                        >
                          {message.role === "system" && message.content.includes("XP") ? (
                            <div className="flex items-center">
                              <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                              {message.content}
                            </div>
                          ) : (
                            message.content
                          )}
                        </div>

                        {message.role === "user" && (
                          <Avatar className="h-8 w-8 ml-2 mt-1">
                            <AvatarFallback className="bg-[rgb(80,63,139)] text-white">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-6 flex justify-center">
                <Button className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]" onClick={replaySimulation}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Replay This Simulation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="space-x-2">
          <Link href="/simulation/attestation">
            <Button variant="outline">
              <RotateCw className="mr-2 h-4 w-4" />
              New Simulation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
