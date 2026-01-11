"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, Save, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function GlobalSettings() {
  const [apiSettings, setApiSettings] = useState({
    maxTokens: 2000,
    temperature: 0.7,
    presencePenalty: 0.6,
    frequencyPenalty: 0.5,
    enableLogging: true,
    enableDiagnostics: true,
  })

  const [defaultPrompt, setDefaultPrompt] = useState(
    `You are an AI client in a training simulation. Your role is to behave as a realistic client with the personality traits, background, and needs specified below. Respond naturally and conversationally, avoiding robotic language or self-references as an AI. Include occasional filler words and vary your sentence structure to sound human-like. You may use physical gesture cues in [brackets] for short gestures or (parentheses) for longer descriptions.

Personality: {personality_json}
Client Profile: {client_profile_json}
Industry Context: {industry_context}
Difficulty Level: {difficulty_level}
Competencies Being Evaluated: {competencies_json}

Remember to stay in character throughout the conversation and respond as a real person would in this situation. Do not break character or acknowledge that this is a simulation.`,
  )

  const handleApiSettingChange = (setting: string, value: any) => {
    setApiSettings({
      ...apiSettings,
      [setting]: value,
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(35,15,110)]">Global Settings</h1>
          <p className="text-gray-500 mt-2">Configure system-wide default settings</p>
          <div className="text-sm text-gray-400 mt-1">Page ID: GS-001</div>
        </div>
        <Button className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]">
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global Configuration</CardTitle>
          <CardDescription>Manage system-wide settings and defaults</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="api">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="api">API Settings</TabsTrigger>
              <TabsTrigger value="prompt">Default Prompt</TabsTrigger>
              <TabsTrigger value="system">System Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      value={apiSettings.maxTokens}
                      onChange={(e) => handleApiSettingChange("maxTokens", Number.parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Maximum number of tokens to generate in each response</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={apiSettings.temperature}
                      onChange={(e) => handleApiSettingChange("temperature", Number.parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Controls randomness: 0 = deterministic, 1 = creative</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="presence-penalty">Presence Penalty</Label>
                    <Input
                      id="presence-penalty"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={apiSettings.presencePenalty}
                      onChange={(e) => handleApiSettingChange("presencePenalty", Number.parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Reduces repetition of topics already mentioned</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency-penalty">Frequency Penalty</Label>
                    <Input
                      id="frequency-penalty"
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={apiSettings.frequencyPenalty}
                      onChange={(e) => handleApiSettingChange("frequencyPenalty", Number.parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Reduces repetition of specific phrases</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-logging"
                      checked={apiSettings.enableLogging}
                      onCheckedChange={(checked) => handleApiSettingChange("enableLogging", checked)}
                    />
                    <Label htmlFor="enable-logging">Enable Comprehensive API Logging</Label>
                  </div>
                  <p className="text-xs text-gray-500 pl-6">
                    Logs all API requests, responses, and metadata for troubleshooting
                  </p>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="enable-diagnostics"
                      checked={apiSettings.enableDiagnostics}
                      onCheckedChange={(checked) => handleApiSettingChange("enableDiagnostics", checked)}
                    />
                    <Label htmlFor="enable-diagnostics">Enable Diagnostics & Error Reporting</Label>
                  </div>
                  <p className="text-xs text-gray-500 pl-6">Automatically reports errors and diagnostic information</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-prompt">Default System Prompt Template</Label>
                  <Textarea
                    id="default-prompt"
                    value={defaultPrompt}
                    onChange={(e) => setDefaultPrompt(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    This template is used as the base for all simulations. Variables in curly braces will be replaced
                    with actual values.
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setDefaultPrompt(
                        `You are an AI client in a training simulation. Your role is to behave as a realistic client with the personality traits, background, and needs specified below. Respond naturally and conversationally, avoiding robotic language or self-references as an AI. Include occasional filler words and vary your sentence structure to sound human-like. You may use physical gesture cues in [brackets] for short gestures or (parentheses) for longer descriptions.

Personality: {personality_json}
Client Profile: {client_profile_json}
Industry Context: {industry_context}
Difficulty Level: {difficulty_level}
Competencies Being Evaluated: {competencies_json}

Remember to stay in character throughout the conversation and respond as a real person would in this situation. Do not break character or acknowledge that this is a simulation.`,
                      )
                    }
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Default
                  </Button>
                </div>

                <div className="pt-4">
                  <h3 className="text-md font-medium mb-2">Available Variables</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <code>{"{personality_json}"}</code> - Fusion Model personality settings
                    </div>
                    <div>
                      <code>{"{client_profile_json}"}</code> - Client profile details
                    </div>
                    <div>
                      <code>{"{industry_context}"}</code> - Industry-specific context
                    </div>
                    <div>
                      <code>{"{difficulty_level}"}</code> - Selected difficulty level
                    </div>
                    <div>
                      <code>{"{competencies_json}"}</code> - Competencies being evaluated
                    </div>
                    <div>
                      <code>{"{simulation_id}"}</code> - Unique simulation identifier
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="system" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Performance Review Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="enable-auto-review" defaultChecked />
                        <Label htmlFor="enable-auto-review">Enable Automatic Performance Reviews</Label>
                      </div>
                      <p className="text-xs text-gray-500">
                        Automatically generate performance reviews after each simulation
                      </p>

                      <div className="flex items-center space-x-2">
                        <Switch id="enable-spider-graph" defaultChecked />
                        <Label htmlFor="enable-spider-graph">Include Spider Graph Visualization</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="enable-xp" defaultChecked />
                        <Label htmlFor="enable-xp">Enable XP Tracking</Label>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Simulation Observer Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="enable-observer" defaultChecked />
                        <Label htmlFor="enable-observer">Enable Simulation Observer</Label>
                      </div>
                      <p className="text-xs text-gray-500">Allows administrators to observe active simulations</p>

                      <div className="flex items-center space-x-2">
                        <Switch id="enable-recording" defaultChecked />
                        <Label htmlFor="enable-recording">Record Simulation Sessions</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="enable-intervention" defaultChecked />
                        <Label htmlFor="enable-intervention">Allow Admin Intervention</Label>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md">New Industry Defaults</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">
                      When adding new industries, the following settings will be used as defaults:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="inherit-competencies" defaultChecked />
                        <Label htmlFor="inherit-competencies">Inherit Global Competencies</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="inherit-difficulty" defaultChecked />
                        <Label htmlFor="inherit-difficulty">Inherit Difficulty Levels</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="inherit-profiles" defaultChecked />
                        <Label htmlFor="inherit-profiles">Inherit Client Profile Parameters</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch id="inherit-fusion" defaultChecked />
                        <Label htmlFor="inherit-fusion">Inherit Fusion Model Presets</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <Link href="/admin/fusion-model">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Fusion Model
          </Button>
        </Link>
        <Link href="/admin/api-settings">
          <Button className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]">
            Next: API Settings
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
