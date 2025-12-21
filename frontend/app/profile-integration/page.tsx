"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { testProfileIntegration } from "./actions"
import { Loader2, Upload, ArrowRight, Check, AlertCircle } from "lucide-react"

export default function ProfileIntegration() {
  const [profileJson, setProfileJson] = useState("")
  const [isValidJson, setIsValidJson] = useState(false)
  const [jsonError, setJsonError] = useState("")
  const [parsedProfile, setParsedProfile] = useState(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [integrationResults, setIntegrationResults] = useState(null)
  const [activeTab, setActiveTab] = useState("mapping")

  // Validate JSON as user types
  useEffect(() => {
    if (!profileJson.trim()) {
      setIsValidJson(false)
      setJsonError("")
      setParsedProfile(null)
      return
    }

    try {
      const parsed = JSON.parse(profileJson)
      setIsValidJson(true)
      setJsonError("")
      setParsedProfile(parsed)
    } catch (error) {
      setIsValidJson(false)
      setJsonError("Invalid JSON format")
      setParsedProfile(null)
    }
  }, [profileJson])

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        setProfileJson(content)
      } catch (error) {
        setJsonError("Error reading file")
      }
    }
    reader.readAsText(file)
  }

  const handleTestIntegration = async () => {
    if (!isValidJson || !parsedProfile) return

    setIsProcessing(true)

    try {
      const results = await testProfileIntegration(parsedProfile)
      setIntegrationResults(results)
      setActiveTab("mapping")
    } catch (error) {
      console.error("Error testing integration:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-[rgb(35,15,110)] mb-2">Profile Integration Testing</h1>
      <p className="text-gray-500 mb-8">Test how generated profiles integrate with the simulation system</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Client Profile Input</CardTitle>
              <CardDescription>Paste or upload a generated profile JSON</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="profile-json">Profile JSON</Label>
                <Textarea
                  id="profile-json"
                  value={profileJson}
                  onChange={(e) => setProfileJson(e.target.value)}
                  placeholder='{"name": "John Smith", ...}'
                  rows={12}
                  className={`font-mono text-sm ${jsonError ? "border-red-500" : isValidJson ? "border-green-500" : ""}`}
                />
                {jsonError && (
                  <div className="text-red-500 text-sm flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {jsonError}
                  </div>
                )}
                {isValidJson && (
                  <div className="text-green-500 text-sm flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    Valid JSON format
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-upload">Or upload a JSON file</Label>
                <Input
                  id="profile-upload"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                <div className="text-xs text-gray-500">Upload a JSON file exported from the Profile Generator</div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]"
                onClick={handleTestIntegration}
                disabled={!isValidJson || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Test Integration
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Integration Analysis</CardTitle>
              <CardDescription>
                {integrationResults
                  ? `Analysis for ${parsedProfile?.name || "client profile"}`
                  : "Test a profile to see integration results"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {integrationResults ? (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="mapping">Parameter Mapping</TabsTrigger>
                    <TabsTrigger value="compatibility">Compatibility</TabsTrigger>
                    <TabsTrigger value="simulation">Simulation Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="mapping" className="mt-4 space-y-4">
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="w-1/3">Simulation Parameter</TableHead>
                            <TableHead className="w-1/3">Extracted Value</TableHead>
                            <TableHead className="w-1/3">Source</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {integrationResults.parameterMapping.map((param, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{param.parameter}</TableCell>
                              <TableCell>
                                {param.value}
                                {param.confidence < 100 && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {param.confidence}% confidence
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">{param.source}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <h3 className="text-md font-medium mb-2">Extraction Notes</h3>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {integrationResults.extractionNotes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="compatibility" className="mt-4">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-md font-medium">Overall Compatibility</h3>
                          <Badge
                            className={
                              integrationResults.compatibility.score > 80
                                ? "bg-green-100 text-green-800"
                                : integrationResults.compatibility.score > 60
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }
                          >
                            {integrationResults.compatibility.score}%
                          </Badge>
                        </div>
                        <p className="text-sm">{integrationResults.compatibility.summary}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="text-md font-medium mb-2">Strengths</h3>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {integrationResults.compatibility.strengths.map((strength, index) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md">
                          <h3 className="text-md font-medium mb-2">Gaps</h3>
                          <ul className="list-disc pl-5 text-sm space-y-1">
                            {integrationResults.compatibility.gaps.map((gap, index) => (
                              <li key={index}>{gap}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-md font-medium mb-2">Industry-Specific Compatibility</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Industry</TableHead>
                              <TableHead>Compatibility</TableHead>
                              <TableHead>Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {integrationResults.compatibility.industries.map((industry, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{industry.name}</TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      industry.score > 80
                                        ? "bg-green-100 text-green-800"
                                        : industry.score > 60
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                    }
                                  >
                                    {industry.score}%
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">{industry.notes}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="simulation" className="mt-4">
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-md font-medium mb-2">Simulation Preview</h3>
                        <p className="text-sm mb-4">This is how the profile would appear in the simulation system:</p>

                        <div className="border rounded-md p-4 bg-white">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="h-12 w-12 rounded-full bg-[rgb(124,108,167)] text-white flex items-center justify-center font-medium">
                              {parsedProfile?.name
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("") || "JS"}
                            </div>
                            <div>
                              <div className="font-medium">{parsedProfile?.name || "John Smith"}</div>
                              <div className="text-sm text-gray-500">
                                {parsedProfile?.age || "42"} years old, {parsedProfile?.occupation || "Occupation"}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <strong>Family:</strong> {integrationResults.simulationPreview.family}
                            </div>
                            <div>
                              <strong>Annual Income:</strong> {integrationResults.simulationPreview.income}
                            </div>
                            <div>
                              <strong>Assets:</strong>
                            </div>
                            <ul className="list-disc pl-5 text-xs">
                              {integrationResults.simulationPreview.assets.map((asset, index) => (
                                <li key={index}>{asset}</li>
                              ))}
                            </ul>
                            <div>
                              <strong>Debt:</strong>
                            </div>
                            <ul className="list-disc pl-5 text-xs">
                              {integrationResults.simulationPreview.debts.map((debt, index) => (
                                <li key={index}>{debt}</li>
                              ))}
                            </ul>
                            <div>
                              <strong>Goals:</strong>
                            </div>
                            <ul className="list-disc pl-5 text-xs">
                              {integrationResults.simulationPreview.goals.map((goal, index) => (
                                <li key={index}>{goal}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-md">
                        <h3 className="text-md font-medium mb-2">Simulation Behavior Prediction</h3>
                        <p className="text-sm mb-3">
                          Based on the profile, here's how the AI client would likely behave in a simulation:
                        </p>

                        <div className="space-y-3">
                          <div>
                            <div className="font-medium text-sm">Communication Style</div>
                            <p className="text-sm text-gray-600">
                              {integrationResults.simulationPreview.behavior.communicationStyle}
                            </p>
                          </div>

                          <div>
                            <div className="font-medium text-sm">Information Sharing</div>
                            <p className="text-sm text-gray-600">
                              {integrationResults.simulationPreview.behavior.informationSharing}
                            </p>
                          </div>

                          <div>
                            <div className="font-medium text-sm">Decision Making</div>
                            <p className="text-sm text-gray-600">
                              {integrationResults.simulationPreview.behavior.decisionMaking}
                            </p>
                          </div>

                          <div>
                            <div className="font-medium text-sm">Likely Challenges</div>
                            <ul className="list-disc pl-5 text-sm">
                              {integrationResults.simulationPreview.behavior.likelyChallenges.map(
                                (challenge, index) => (
                                  <li key={index}>{challenge}</li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  <div className="text-gray-400 mb-4">
                    <Upload className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">No Profile Tested Yet</p>
                  </div>
                  <p className="text-gray-500 max-w-md">
                    Paste or upload a client profile JSON and click "Test Integration" to analyze how it would integrate
                    with the simulation system
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
