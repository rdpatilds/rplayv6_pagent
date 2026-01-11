"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CustomProgress } from "@/components/ui/custom-progress"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, Calendar, Clock, Award, TrendingUp, Edit, Save, Eye } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

// Sample user data
const userData = {
  id: "USR-003",
  name: "Michael Chen",
  email: "m.chen@example.com",
  department: "Sales",
  completedSimulations: 15,
  averageScore: 91,
  topSkill: "Solution Recommendations",
  lowestSkill: "Time Management",
  lastActive: "2023-04-16",
  progress: 89,
  status: "active",
  joinDate: "2022-09-15",
  phone: "(555) 123-4567",
  manager: "Sarah Johnson",
  profileImage: "/placeholder.svg?height=200&width=200",
}

// Sample competency data
const competencyData = [
  { name: "Communication", score: 88, previous: 82 },
  { name: "Needs Assessment", score: 92, previous: 85 },
  { name: "Objection Handling", score: 85, previous: 78 },
  { name: "Bias Awareness", score: 90, previous: 86 },
  { name: "Solution Recommendations", score: 95, previous: 90 },
  { name: "Time Management", score: 78, previous: 70 },
]

// Sample progression data
const progressionData = [
  { month: "Jan", score: 75 },
  { month: "Feb", score: 78 },
  { month: "Mar", score: 82 },
  { month: "Apr", score: 85 },
  { month: "May", score: 88 },
  { month: "Jun", score: 91 },
]

// Sample simulation data
const simulationData = [
  {
    id: "SIM-001",
    date: "2023-04-16",
    type: "Life Insurance",
    difficulty: "Advanced",
    duration: "28 min",
    overallScore: 92,
    competencyScores: [
      { name: "Communication", score: 90 },
      { name: "Needs Assessment", score: 95 },
      { name: "Objection Handling", score: 88 },
      { name: "Bias Awareness", score: 93 },
      { name: "Solution Recommendations", score: 96 },
      { name: "Time Management", score: 82 },
    ],
    strengths: ["Excellent rapport building", "Thorough needs assessment", "Clear explanation of complex concepts"],
    improvements: ["Could improve time management", "Consider more open-ended questions"],
    adminNotes: "Great improvement in handling objections compared to previous simulations.",
    conversation: [
      { role: "advisor", content: "Good morning! How can I help you today?" },
      {
        role: "client",
        content: "I'm interested in life insurance but I'm not sure what type would be best for my situation.",
      },
      {
        role: "advisor",
        content:
          "I'd be happy to help you figure that out. To better understand your needs, could you tell me a bit about your current situation? For example, do you have any dependents?",
      },
      {
        role: "client",
        content:
          "Yes, I have two children, ages 8 and 10. My spouse works part-time, and I'm the primary earner in our household.",
      },
      // More conversation items would go here
    ],
  },
  {
    id: "SIM-002",
    date: "2023-04-10",
    type: "Retirement Planning",
    difficulty: "Intermediate",
    duration: "22 min",
    overallScore: 88,
    competencyScores: [
      { name: "Communication", score: 87 },
      { name: "Needs Assessment", score: 90 },
      { name: "Objection Handling", score: 82 },
      { name: "Bias Awareness", score: 89 },
      { name: "Solution Recommendations", score: 94 },
      { name: "Time Management", score: 76 },
    ],
    strengths: ["Strong product knowledge", "Good discovery questions", "Effective recommendations"],
    improvements: ["Work on handling client objections", "Improve time management"],
    adminNotes: "",
    conversation: [
      { role: "advisor", content: "Hello! I understand you wanted to discuss retirement planning today?" },
      {
        role: "client",
        content: "Yes, I'm 45 and starting to worry that I haven't saved enough for retirement yet.",
      },
      // More conversation items would go here
    ],
  },
  {
    id: "SIM-003",
    date: "2023-04-02",
    type: "Estate Planning",
    difficulty: "Advanced",
    duration: "35 min",
    overallScore: 90,
    competencyScores: [
      { name: "Communication", score: 88 },
      { name: "Needs Assessment", score: 92 },
      { name: "Objection Handling", score: 85 },
      { name: "Bias Awareness", score: 91 },
      { name: "Solution Recommendations", score: 95 },
      { name: "Time Management", score: 78 },
    ],
    strengths: ["Comprehensive needs assessment", "Clear explanations of complex concepts", "Effective questioning"],
    improvements: ["Could be more concise in explanations", "Consider more visual aids"],
    adminNotes: "Excellent handling of a complex scenario. Consider having Michael mentor newer advisors.",
    conversation: [
      {
        role: "advisor",
        content: "Good afternoon! I understand you're interested in discussing estate planning today.",
      },
      {
        role: "client",
        content:
          "Yes, I have a somewhat complicated situation with a blended family and some business assets I'm concerned about.",
      },
      // More conversation items would go here
    ],
  },
]

export default function UserDetailPage({ params }: { params: { userId: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedSimulation, setSelectedSimulation] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [adminNote, setAdminNote] = useState("")
  const [editingNote, setEditingNote] = useState(false)

  // In a real application, we would fetch the user data based on the userId
  const userId = params.userId

  const handleSaveNote = (simulationId: string) => {
    // In a real application, this would save the note to the database
    console.log(`Saving note for simulation ${simulationId}: ${adminNote}`)
    setEditingNote(false)
    // Update the simulation data with the new note
    if (selectedSimulation) {
      selectedSimulation.adminNotes = adminNote
    }
  }

  const handleViewSimulation = (simulation: any) => {
    setSelectedSimulation(simulation)
    setAdminNote(simulation.adminNotes || "")
    setIsDialogOpen(true)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Button
        variant="ghost"
        className="mb-6 pl-0 flex items-center text-[rgb(35,15,110)]"
        onClick={() => router.push("/admin/user-management")}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to User Management
      </Button>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* User Profile Card */}
        <Card className="md:w-1/3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Profile</CardTitle>
              <Badge
                variant={userData.status === "active" ? "default" : "outline"}
                className={userData.status === "active" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
              >
                {userData.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                <img
                  src={userData.profileImage || "/placeholder.svg"}
                  alt={userData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-xl font-bold">{userData.name}</h2>
              <p className="text-muted-foreground">{userData.department}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{userData.email}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{userData.phone}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Manager</span>
                <span className="font-medium">{userData.manager}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Join Date</span>
                <span className="font-medium">{userData.joinDate}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Last Active</span>
                <span className="font-medium">{userData.lastActive}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Simulations</span>
                <span className="font-medium">{userData.completedSimulations}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card className="md:w-2/3">
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Overall performance metrics and progression</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Average Score</span>
                <div className="flex items-center mt-1">
                  <div
                    className={`text-2xl font-bold ${userData.averageScore >= 80 ? "text-green-600" : userData.averageScore >= 60 ? "text-amber-600" : "text-red-600"}`}
                  >
                    {userData.averageScore}%
                  </div>
                  <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">+3%</Badge>
                </div>
                <CustomProgress
                  value={userData.averageScore}
                  className="h-2 mt-2"
                  indicatorColor="bg-[rgb(35,15,110)]"
                  bgColor="bg-[rgb(230,225,245)]"
                />
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Top Skill</span>
                <div className="flex items-center mt-1">
                  <div className="text-2xl font-bold">{userData.topSkill}</div>
                </div>
                <div className="text-sm text-green-600 mt-2 flex items-center">
                  <Award className="h-4 w-4 mr-1" />
                  95% Proficiency
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-foreground text-sm">Needs Improvement</span>
                <div className="flex items-center mt-1">
                  <div className="text-2xl font-bold">{userData.lowestSkill}</div>
                </div>
                <div className="text-sm text-amber-600 mt-2 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  78% Proficiency
                </div>
              </div>
            </div>

            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#8884d8"
                    name="Average Score"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed information */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Competency Overview</TabsTrigger>
          <TabsTrigger value="simulations">Simulation History</TabsTrigger>
          <TabsTrigger value="progress">Progress Analysis</TabsTrigger>
        </TabsList>

        {/* Competency Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Competency Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Competency Profile</CardTitle>
                <CardDescription>Current skill levels across all competencies</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={competencyData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Current" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="Previous" dataKey="previous" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Competency Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Competency Scores</CardTitle>
                <CardDescription>Detailed breakdown with improvement tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {competencyData.map((competency) => (
                    <div key={competency.name}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{competency.name}</span>
                        <div className="flex items-center">
                          <span
                            className={`${competency.score >= 90 ? "text-green-600" : competency.score >= 80 ? "text-green-600" : competency.score >= 70 ? "text-amber-600" : "text-red-600"}`}
                          >
                            {competency.score}%
                          </span>
                          <Badge className="ml-2 text-xs" variant="outline">
                            +{competency.score - competency.previous}%
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <CustomProgress
                          value={competency.score}
                          className="h-2 flex-1"
                          indicatorColor="bg-[rgb(35,15,110)]"
                          bgColor="bg-[rgb(230,225,245)]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strengths and Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle>Strengths & Development Areas</CardTitle>
              <CardDescription>Based on simulation performance and competency scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-green-600" />
                    Key Strengths
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="rounded-full bg-green-100 p-1 mt-0.5 mr-2">
                        <div className="h-2 w-2 rounded-full bg-green-600"></div>
                      </div>
                      <div>
                        <p className="font-medium">Solution Recommendations (95%)</p>
                        <p className="text-sm text-muted-foreground">
                          Consistently provides tailored, appropriate solutions based on client needs
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="rounded-full bg-green-100 p-1 mt-0.5 mr-2">
                        <div className="h-2 w-2 rounded-full bg-green-600"></div>
                      </div>
                      <div>
                        <p className="font-medium">Needs Assessment (92%)</p>
                        <p className="text-sm text-muted-foreground">
                          Asks thorough discovery questions to understand client situations
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="rounded-full bg-green-100 p-1 mt-0.5 mr-2">
                        <div className="h-2 w-2 rounded-full bg-green-600"></div>
                      </div>
                      <div>
                        <p className="font-medium">Bias Awareness (90%)</p>
                        <p className="text-sm text-muted-foreground">
                          Demonstrates strong awareness of potential biases in client interactions
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-amber-600" />
                    Development Areas
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="rounded-full bg-amber-100 p-1 mt-0.5 mr-2">
                        <div className="h-2 w-2 rounded-full bg-amber-600"></div>
                      </div>
                      <div>
                        <p className="font-medium">Time Management (78%)</p>
                        <p className="text-sm text-muted-foreground">
                          Could improve efficiency in covering all necessary topics within meeting time
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="rounded-full bg-amber-100 p-1 mt-0.5 mr-2">
                        <div className="h-2 w-2 rounded-full bg-amber-600"></div>
                      </div>
                      <div>
                        <p className="font-medium">Objection Handling (85%)</p>
                        <p className="text-sm text-muted-foreground">
                          While competent, could further develop strategies for handling complex objections
                        </p>
                      </div>
                    </li>
                  </ul>

                  <div className="mt-6 pt-4 border-t">
                    <h4 className="font-medium mb-2">Recommended Focus</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-[rgb(35,15,110)]">Time Management Training</Badge>
                      <Badge className="bg-[rgb(35,15,110)]">Advanced Objection Handling</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulation History Tab */}
        <TabsContent value="simulations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulation History</CardTitle>
              <CardDescription>Complete record of all simulation sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {simulationData.map((simulation) => (
                  <Card key={simulation.id} className="border shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{simulation.type}</CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            {simulation.date}
                            <Clock className="h-3.5 w-3.5 ml-3 mr-1" />
                            {simulation.duration}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge
                            className={`${simulation.difficulty === "Advanced" ? "bg-[rgb(35,15,110)]" : simulation.difficulty === "Intermediate" ? "bg-blue-600" : "bg-green-600"}`}
                          >
                            {simulation.difficulty}
                          </Badge>
                          <div className="flex items-center mt-2">
                            <span className="text-sm mr-2">Score:</span>
                            <span
                              className={`font-bold ${simulation.overallScore >= 90 ? "text-green-600" : simulation.overallScore >= 80 ? "text-green-600" : simulation.overallScore >= 70 ? "text-amber-600" : "text-red-600"}`}
                            >
                              {simulation.overallScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Strengths</h4>
                          <ul className="text-sm space-y-1">
                            {simulation.strengths.map((strength, index) => (
                              <li key={index} className="flex items-start">
                                <div className="rounded-full bg-green-100 p-1 mt-0.5 mr-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-green-600"></div>
                                </div>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Areas for Improvement</h4>
                          <ul className="text-sm space-y-1">
                            {simulation.improvements.map((improvement, index) => (
                              <li key={index} className="flex items-start">
                                <div className="rounded-full bg-amber-100 p-1 mt-0.5 mr-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-amber-600"></div>
                                </div>
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {simulation.adminNotes && (
                        <div className="mb-4 p-3 bg-muted/50 rounded-md">
                          <h4 className="text-sm font-medium mb-1">Admin Notes</h4>
                          <p className="text-sm">{simulation.adminNotes}</p>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                          onClick={() => handleViewSimulation(simulation)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Analysis Tab */}
        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>Average score progression over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#8884d8"
                      name="Average Score"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Competency Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Competency Progress</CardTitle>
                <CardDescription>Improvement in each competency area</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={competencyData.map((item) => ({
                      name: item.name,
                      current: item.score,
                      previous: item.previous,
                      improvement: item.score - item.previous,
                    }))}
                    layout="vertical"
                    margin={{ left: 120 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 15]} />
                    <YAxis dataKey="name" type="category" width={120} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="improvement" name="Improvement" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Learning Path Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Learning Path Progress</CardTitle>
              <CardDescription>Progress through assigned learning modules and simulations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">Sales Fundamentals Path</h3>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                  </div>
                  <CustomProgress
                    value={100}
                    className="h-2"
                    indicatorColor="bg-green-600"
                    bgColor="bg-[rgb(230,225,245)]"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Started: Jan 15, 2023</span>
                    <span>Completed: Feb 28, 2023</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">Advanced Client Relationships</h3>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>
                  </div>
                  <CustomProgress
                    value={65}
                    className="h-2"
                    indicatorColor="bg-blue-600"
                    bgColor="bg-[rgb(230,225,245)]"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Started: Mar 10, 2023</span>
                    <span>Expected completion: May 15, 2023</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">Advanced Product Knowledge</h3>
                    <Badge variant="outline">Not Started</Badge>
                  </div>
                  <CustomProgress
                    value={0}
                    className="h-2"
                    indicatorColor="bg-[rgb(35,15,110)]"
                    bgColor="bg-[rgb(230,225,245)]"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Scheduled: Jun 1, 2023</span>
                    <span></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Simulation Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedSimulation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex justify-between items-center">
                  <span>
                    {selectedSimulation.type} - {selectedSimulation.date}
                  </span>
                  <Badge
                    className={`${selectedSimulation.difficulty === "Advanced" ? "bg-[rgb(35,15,110)]" : selectedSimulation.difficulty === "Intermediate" ? "bg-blue-600" : "bg-green-600"}`}
                  >
                    {selectedSimulation.difficulty}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Overall Score: {selectedSimulation.overallScore}% | Duration: {selectedSimulation.duration}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="review" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="review">Performance Review</TabsTrigger>
                  <TabsTrigger value="conversation">Conversation</TabsTrigger>
                </TabsList>
                <TabsContent value="review" className="space-y-4 mt-4">
                  {/* Competency Scores */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Competency Scores</h3>
                    {selectedSimulation.competencyScores.map((comp) => (
                      <div key={comp.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{comp.name}</span>
                          <span
                            className={`text-sm ${comp.score >= 90 ? "text-green-600" : comp.score >= 80 ? "text-green-600" : comp.score >= 70 ? "text-amber-600" : "text-red-600"}`}
                          >
                            {comp.score}%
                          </span>
                        </div>
                        <CustomProgress
                          value={comp.score}
                          className="h-1.5"
                          indicatorColor="bg-[rgb(35,15,110)]"
                          bgColor="bg-[rgb(230,225,245)]"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Strengths and Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                      <h3 className="font-medium mb-2">Strengths</h3>
                      <ul className="space-y-1">
                        {selectedSimulation.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <div className="rounded-full bg-green-100 p-1 mt-0.5 mr-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-600"></div>
                            </div>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">Areas for Improvement</h3>
                      <ul className="space-y-1">
                        {selectedSimulation.improvements.map((improvement, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <div className="rounded-full bg-amber-100 p-1 mt-0.5 mr-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-amber-600"></div>
                            </div>
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Admin Notes</h3>
                      {!editingNote ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-[rgb(35,15,110)]"
                          onClick={() => setEditingNote(true)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Notes
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-[rgb(35,15,110)]"
                          onClick={() => handleSaveNote(selectedSimulation.id)}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save Notes
                        </Button>
                      )}
                    </div>
                    {!editingNote ? (
                      <div className="p-3 bg-muted/50 rounded-md min-h-[100px]">
                        {adminNote ? (
                          <p className="text-sm">{adminNote}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No admin notes yet. Click Edit to add.</p>
                        )}
                      </div>
                    ) : (
                      <Textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Add your feedback and notes for this simulation..."
                        className="min-h-[100px]"
                      />
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="conversation" className="mt-4">
                  <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                    {selectedSimulation.conversation.map((message, index) => (
                      <div
                        key={index}
                        className={`mb-4 flex ${message.role === "advisor" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${message.role === "advisor" ? "bg-[rgb(230,225,245)] text-[rgb(35,15,110)]" : "bg-gray-100"}`}
                        >
                          <div className="text-xs font-medium mb-1">
                            {message.role === "advisor" ? "Advisor" : "Client"}
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
