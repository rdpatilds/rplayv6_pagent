import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { generateSimulationId } from "@/app/api/simulation/actions"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchDifficultyLevels } from "@/app/api/difficulty/actions"
import IndustrySelectionClient from "./client"

// This is now a server component
export default async function IndustrySelection() {
  // Fetch data server-side
  const { levels: difficultyLevels } = await fetchDifficultyLevels()
  
  // Pass the data to the client component
  return <IndustrySelectionClient initialDifficultyLevels={difficultyLevels} />
}
