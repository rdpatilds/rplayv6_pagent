"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight } from "lucide-react"
import Link from "next/link"
import FusionDatabaseEditor from "./components/FusionDatabaseEditor"

export default function FusionModel() {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [selectedFocusArea, setSelectedFocusArea] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("beginner")
  const [activeTab, setActiveTab] = useState("traits")
  
  const [industries, setIndustries] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [focusAreas, setFocusAreas] = useState<any[]>([])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[rgb(35,15,110)]">Fusion Model Catalog</h1>
          <p className="text-gray-500 mt-2">Manage personality components and traits</p>
          <div className="text-sm text-gray-400 mt-1">Page ID: FM-001</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personality Components</CardTitle>
            <CardDescription>Manage and configure personality traits, archetypes, and behaviors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Tabs defaultValue="traits" onValueChange={setActiveTab}>
                <TabsList className="flex flex-wrap gap-2 w-full bg-gray-100 p-2 rounded-md mb-4">
                  <TabsTrigger className="min-w-[120px]" value="traits">Core Traits</TabsTrigger>
                  <TabsTrigger className="min-w-[120px]" value="archetype">Archetype & Mood</TabsTrigger>
                  <TabsTrigger className="min-w-[120px]" value="communication">Communication</TabsTrigger>
                  <TabsTrigger className="min-w-[120px]" value="context">Life Context</TabsTrigger>
                  <TabsTrigger className="min-w-[120px]" value="quirks">Quirks</TabsTrigger>
                  <TabsTrigger className="min-w-[120px]" value="influence">Personality Influence</TabsTrigger>
                  <TabsTrigger className="min-w-[120px]" value="db-config">DB Config</TabsTrigger>
                </TabsList>

                <TabsContent value="traits" className="space-y-6 pt-4">
                  <FusionDatabaseEditor activeTab={activeTab} />
                </TabsContent>

                <TabsContent value="archetype" className="space-y-6 pt-4">
                  <FusionDatabaseEditor activeTab={activeTab} />
                </TabsContent>

                <TabsContent value="communication" className="space-y-6 pt-4">
                  <FusionDatabaseEditor activeTab={activeTab} />
                </TabsContent>

                <TabsContent value="context" className="space-y-6 pt-4">
                  <FusionDatabaseEditor activeTab={activeTab} />
                </TabsContent>

                <TabsContent value="quirks" className="space-y-6 pt-4">
                  <FusionDatabaseEditor activeTab={activeTab} />
                </TabsContent>

                <TabsContent value="influence" className="space-y-6 pt-4">
                  <FusionDatabaseEditor activeTab={activeTab} />
                </TabsContent>

                <TabsContent value="db-config" className="space-y-6 pt-4">
                  <FusionDatabaseEditor activeTab={activeTab} />
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between mt-8">
        <Link href="/admin/client-profiles">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Client Profiles
          </Button>
        </Link>
        <Link href="/admin/global-settings">
          <Button className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]">
            Next: Global Settings
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
