"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Play, CheckCircle, MessageCircle, Target, HelpCircle, Check, BookOpen } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getProfileForSimulation } from "@/app/api/simulation/profile-connector"
import { apiClient } from "@/lib/api"

export default function SimulationPreview() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCompetencies, setSelectedCompetencies] = useState([])
  const [clientProfile, setClientProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState(null)
  // Replace the hardcoded getIndustryName, getSubcategoryName functions with dynamic ones
  const [industryMetadata, setIndustryMetadata] = useState({})
  const [aiRoleLabel, setAiRoleLabel] = useState<string | undefined>(undefined);
  const [aiRoleDescription, setAiRoleDescription] = useState<string | undefined>(undefined);

  const simulationId =
    searchParams.get("simulationId") || sessionStorage.getItem("currentSimulationId") || "SIM-00000000"
  const industry = searchParams.get("industry") || sessionStorage.getItem("selectedIndustry") || "insurance"
  const subcategory = searchParams.get("subcategory") || sessionStorage.getItem("selectedSubcategory") || "life-health"
  const difficulty = searchParams.get("difficulty") || sessionStorage.getItem("selectedDifficulty") || "beginner"

  // Load selected competencies from session storage or API
  useEffect(() => {
    const loadCompetencies = async () => {
      // First try to load from session storage
      const competenciesJson = sessionStorage.getItem("selectedCompetencies")
      if (competenciesJson) {
        try {
          const competencies = JSON.parse(competenciesJson)
          setSelectedCompetencies(competencies)
          return
        } catch (error) {
          console.error("Error parsing competencies from sessionStorage:", error)
        }
      }

      // If not in sessionStorage, fetch from API
      try {
        const [industryResponse, competenciesResponse] = await Promise.all([
          apiClient.get("/api/competencies/industry"),
          apiClient.get("/api/competencies")
        ])

        const industryCompetencies = industryResponse.data.industryCompetencies || {}
        const allCompetencies = competenciesResponse.competencies || []

        // Get competency IDs for the selected industry/subcategory
        let competencyIds: string[] = []
        const subcategoryKey = industry !== "insurance" ? "default" : subcategory

        if (industryCompetencies[industry] && industryCompetencies[industry][subcategoryKey]) {
          const subcategoryData = industryCompetencies[industry][subcategoryKey]
          if (Array.isArray(subcategoryData)) {
            competencyIds = subcategoryData
          } else if (typeof subcategoryData === 'object' && 'competencies' in subcategoryData) {
            competencyIds = subcategoryData.competencies
          }
        }

        // Map competency IDs to full competency objects
        const selectedComps = competencyIds
          .map((id) => allCompetencies.find((comp: any) => comp.id === id))
          .filter(Boolean)

        setSelectedCompetencies(selectedComps)

        // Store in sessionStorage for future use
        sessionStorage.setItem("selectedCompetencies", JSON.stringify(selectedComps))
      } catch (error) {
        console.error("Error loading competencies from API:", error)
      }
    }

    loadCompetencies()
  }, [industry, subcategory])

  // Load client profile using the profile generator
  useEffect(() => {
    const loadClientProfile = async () => {
      setIsLoading(true)
      try {
        // Get selected focus areas from session storage
        const focusAreasJson = sessionStorage.getItem("selectedFocusAreas")
        const selectedFocusAreas = focusAreasJson ? JSON.parse(focusAreasJson) : []

        console.log("Selected focus areas being passed to profile generator:", selectedFocusAreas)

        // Get profile from the profile generator
        const profile = await getProfileForSimulation(industry, subcategory, difficulty, selectedFocusAreas)

        // Debug: Log the profile structure
        console.log("Raw profile from generator:", profile)
        setDebugInfo({
          hasIncome: !!profile.income || !!profile.incomeLevel,
          incomeValue: profile.income || profile.incomeLevel,
          hasAssets:
            Array.isArray(profile.assets) ||
            (profile.financialDetails && Array.isArray(profile.financialDetails.assets)),
          assetsValue: profile.assets || (profile.financialDetails && profile.financialDetails.assets),
          hasDebts:
            Array.isArray(profile.debts) || (profile.financialDetails && Array.isArray(profile.financialDetails.debts)),
          debtsValue: profile.debts || (profile.financialDetails && profile.financialDetails.debts),
        })

        setClientProfile(profile)

        // Store the profile in session storage for use in the simulation
        sessionStorage.setItem("clientProfile", JSON.stringify(profile))
      } catch (error) {
        console.error("Error loading client profile:", error)
        // If there's an error, use the fallback profile
        const fallbackProfile = getFallbackProfile()
        setClientProfile(fallbackProfile)
        sessionStorage.setItem("clientProfile", JSON.stringify(fallbackProfile))
      } finally {
        setIsLoading(false)
      }
    }

    loadClientProfile()
  }, [industry, subcategory, difficulty])

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

  // Update the getIndustryName function to use the metadata
  const getIndustryName = () => {
    if (industryMetadata && industryMetadata[industry]) {
      return industryMetadata[industry].displayName
    }

    // Fallback to default formatting if metadata is not available
    switch (industry) {
      case "insurance":
        return "Insurance"
      case "wealth-management":
        return "Wealth Management"
      case "securities":
        return "Securities"
      default:
        return industry
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
    }
  }

  // Update the getSubcategoryName function to use the metadata
  const getSubcategoryName = () => {
    if (
      industryMetadata &&
      industryMetadata[industry] &&
      industryMetadata[industry].subcategories &&
      industryMetadata[industry].subcategories[subcategory]
    ) {
      return industryMetadata[industry].subcategories[subcategory].displayName
    }

    // Fallback to default formatting if metadata is not available
    if (industry !== "insurance" || !subcategory) return ""
    switch (subcategory) {
      case "life-health":
        return "Life & Health"
      case "property-casualty":
        return "Property & Casualty"
      default:
        return subcategory
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
    }
  }

  const getDifficultyName = () => {
    switch (difficulty) {
      case "beginner":
        return "Beginner"
      case "intermediate":
        return "Intermediate"
      case "advanced":
        return "Advanced"
      default:
        return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
    }
  }

  // Fallback profile if the profile generator fails
  const getFallbackProfile = () => {
    if (difficulty === "beginner") {
      return {
        name: "John Smith",
        age: 42,
        occupation: "High School Teacher",
        income: "$65,000",
        incomeLevel: "Moderate",
        family: "Married with 2 children (ages 10 and 8)",
        familyStatus: "Married with 2 children (ages 10 and 8)",
        assets: ["$25,000 emergency fund", "403(b) with $120,000", "Home equity"],
        debts: ["$180,000 mortgage", "$15,000 auto loan"],
        goals: [
          "Protect family financially",
          "Save for children's college education",
          "Ensure adequate retirement savings",
        ],
        fusionModelTraits: {
          openness: 60,
          conscientiousness: 70,
          extraversion: 50,
          agreeableness: 75,
          neuroticism: 30,
          assertiveness: 40,
          honestyHumility: 80,
        },
        difficulty: "beginner",
      }
    } else if (difficulty === "intermediate") {
      return {
        name: "Sarah Johnson",
        age: 58,
        occupation: "Marketing Executive",
        income: "$95,000",
        incomeLevel: "High",
        family: "Divorced, 1 adult child",
        familyStatus: "Divorced, 1 adult child",
        assets: ["$150,000 in 401(k)", "$50,000 in savings", "Paid-off condo"],
        debts: ["$5,000 credit card debt"],
        goals: ["Plan for retirement in 7-10 years", "Maximize investment returns", "Minimize tax burden"],
        fusionModelTraits: {
          openness: 50,
          conscientiousness: 65,
          extraversion: 45,
          agreeableness: 60,
          neuroticism: 45,
          assertiveness: 55,
          honestyHumility: 70,
        },
        difficulty: "intermediate",
      }
    } else {
      return {
        name: "Michael Torres",
        age: 35,
        occupation: "Entrepreneur",
        income: "Variable ($120,000-$200,000)",
        incomeLevel: "High",
        family: "Single, no children",
        familyStatus: "Single, no children",
        assets: ["Business equity", "Investment portfolio", "$30,000 in savings"],
        debts: ["$40,000 business loan", "$15,000 student loans"],
        goals: ["Business expansion", "Personal financial security", "Future retirement planning"],
        fusionModelTraits: {
          openness: 40,
          conscientiousness: 60,
          extraversion: 60,
          agreeableness: 40,
          neuroticism: 60,
          assertiveness: 75,
          honestyHumility: 50,
        },
        difficulty: "advanced",
      }
    }
  }

  // Update the handleContinueToSimulation function
  const handleContinueToSimulation = async () => {
    try {
      setIsLoading(true);

      // The client profile is already stored in session storage when loaded
      const focusAreasJson = sessionStorage.getItem("selectedFocusAreas")
      const selectedFocusAreas = focusAreasJson ? JSON.parse(focusAreasJson) : []

      // Store aiRoleLabel and aiRoleDescription for the session page
      if (aiRoleLabel) sessionStorage.setItem("aiRoleLabel", aiRoleLabel);
      if (aiRoleDescription) sessionStorage.setItem("aiRoleDescription", aiRoleDescription);

      // Create the simulation in the database
      console.log('[SETUP] Creating simulation in database...');
      const { simulationApi } = await import('@/lib/api/simulation-api');

      const response = await simulationApi.start({
        industry,
        subcategory,
        difficulty,
        clientProfile,
        objectives: []
      });

      const createdSimulation = response.data || response.simulation;

      if (!createdSimulation) {
        throw new Error('Failed to create simulation');
      }

      console.log('[SETUP] Simulation created:', createdSimulation);

      // Store both the UUID id and text simulation_id in session storage
      sessionStorage.setItem('currentSimulationUUID', createdSimulation.id);
      sessionStorage.setItem('currentSimulationId', createdSimulation.simulation_id);

      // Route to the simulation session page with the UUID
      router.push(`/simulation/session?id=${createdSimulation.id}&industry=${industry}&subcategory=${subcategory}&difficulty=${difficulty}`)
    } catch (error) {
      console.error('[SETUP] Error creating simulation:', error);
      alert('Failed to start simulation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Calculate total assets value from an array of asset strings
  const calculateTotalAssets = (assets) => {
    if (!Array.isArray(assets) || assets.length === 0) return 0

    let totalValue = 0

    assets.forEach((asset) => {
      if (typeof asset === "string") {
        // Extract numeric values using regex
        const matches = asset.match(/\$?([\d,]+)/)
        if (matches && matches[1]) {
          // Convert string like "120,000" to number
          const value = Number.parseInt(matches[1].replace(/,/g, ""), 10)
          if (!isNaN(value)) {
            totalValue += value
          }
        }
      }
    })

    return totalValue
  }

  // Calculate total debt value from an array of debt strings
  const calculateTotalDebt = (debts) => {
    if (!Array.isArray(debts) || debts.length === 0) return 0

    let totalValue = 0

    debts.forEach((debt) => {
      if (typeof debt === "string") {
        // Extract numeric values using regex
        const matches = debt.match(/\$?([\d,]+)/)
        if (matches && matches[1]) {
          // Convert string like "120,000" to number
          const value = Number.parseInt(matches[1].replace(/,/g, ""), 10)
          if (!isNaN(value)) {
            totalValue += value
          }
        }
      }
    })

    return totalValue
  }

  // NEW FUNCTION: Convert specific profile details to general labels
  const convertToLabels = (profile) => {
    if (!profile) return {}

    const labeledProfile = { ...profile }

    // Convert age to age category
    if (profile.age) {
      if (profile.age < 25) labeledProfile.ageCategory = "Young Adult"
      else if (profile.age < 40) labeledProfile.ageCategory = "Adult"
      else if (profile.age < 55) labeledProfile.ageCategory = "Middle-Aged Adult"
      else if (profile.age < 65) labeledProfile.ageCategory = "Pre-Retiree"
      else if (profile.age < 75) labeledProfile.ageCategory = "Retiree"
      else labeledProfile.ageCategory = "Senior"
    }

    // Convert occupation to industry sector
    if (profile.occupation) {
      const occupationMap = {
        "High School Teacher": "Education",
        "Marketing Executive": "Marketing",
        Entrepreneur: "Business Owner",
        "Software Engineer": "Technology",
        Doctor: "Healthcare",
        Lawyer: "Legal",
        "Financial Analyst": "Finance",
        "Sales Manager": "Sales",
        Accountant: "Finance",
        Nurse: "Healthcare",
      }

      // Default to the occupation or try to map it
      labeledProfile.occupationSector =
        occupationMap[profile.occupation] ||
        (profile.occupation.includes("Manager")
          ? "Management"
          : profile.occupation.includes("Director")
            ? "Executive"
            : "Professional")
    }

    // Convert income to range using the provided ranges
    let incomeValue = 0

    // Try to extract income from various sources
    if (profile.income) {
      if (typeof profile.income === "string") {
        // Extract numeric value from string like "$65,000"
        const match = profile.income.match(/\$?([\d,]+)/)
        if (match) {
          incomeValue = Number.parseInt(match[1].replace(/,/g, ""))
        }
      } else if (typeof profile.income === "number") {
        incomeValue = profile.income
      }
    }

    // Apply the income ranges provided by the user
    if (incomeValue > 0) {
      if (incomeValue <= 40000) {
        labeledProfile.incomeRange = "Low Income"
      } else if (incomeValue <= 85000) {
        labeledProfile.incomeRange = "Moderate Income"
      } else if (incomeValue <= 200000) {
        labeledProfile.incomeRange = "High Income"
      } else {
        labeledProfile.incomeRange = "Very High Income"
      }
    } else if (profile.incomeLevel) {
      // If we have an income level string but no numeric value
      labeledProfile.incomeRange = `${profile.incomeLevel} Income`
    } else if (typeof profile.income === "string" && profile.income.includes("Variable")) {
      labeledProfile.incomeRange = "Variable Income"
    } else {
      labeledProfile.incomeRange = "Moderate Income" // Default
    }

    // Convert family status to general category
    if (profile.family || profile.familyStatus) {
      const familyInfo = profile.familyStatus || profile.family

      if (familyInfo.toLowerCase().includes("single") && !familyInfo.toLowerCase().includes("child")) {
        labeledProfile.familyCategory = "Single, No Dependents"
      } else if (
        familyInfo.toLowerCase().includes("single") ||
        familyInfo.toLowerCase().includes("divorced") ||
        familyInfo.toLowerCase().includes("widowed")
      ) {
        labeledProfile.familyCategory = "Single with Dependents"
      } else if (familyInfo.toLowerCase().includes("married") || familyInfo.toLowerCase().includes("partner")) {
        if (
          familyInfo.toLowerCase().includes("children") ||
          familyInfo.toLowerCase().includes("kids") ||
          /\d+\s*child(ren)?/.test(familyInfo.toLowerCase())
        ) {
          labeledProfile.familyCategory = "Married with Children"
        } else {
          labeledProfile.familyCategory = "Married, No Children"
        }
      } else {
        labeledProfile.familyCategory = "Family Status Unknown"
      }
    }

    // Handle assets from either direct assets array or financialDetails.assets
    const assets = profile.assets || (profile.financialDetails && profile.financialDetails.assets) || []

    // Calculate total asset value
    const totalAssetValue = calculateTotalAssets(assets)

    // Apply asset level labels based on total value
    if (totalAssetValue > 0) {
      if (totalAssetValue <= 10000) {
        labeledProfile.assetLevel = "Minimal Assets"
      } else if (totalAssetValue <= 50000) {
        labeledProfile.assetLevel = "Low Assets"
      } else if (totalAssetValue <= 250000) {
        labeledProfile.assetLevel = "Moderate Assets"
      } else if (totalAssetValue <= 1000000) {
        labeledProfile.assetLevel = "High Assets"
      } else {
        labeledProfile.assetLevel = "Very High Assets"
      }
    } else {
      // Default based on age if no assets found
      if (profile.age) {
        if (profile.age < 30) {
          labeledProfile.assetLevel = "Low Assets"
        } else if (profile.age < 50) {
          labeledProfile.assetLevel = "Moderate Assets"
        } else {
          labeledProfile.assetLevel = "High Assets"
        }
      } else {
        labeledProfile.assetLevel = "Moderate Assets" // Default
      }
    }

    // Still categorize asset types for display
    if (assets.length > 0) {
      const assetCategories = new Set()

      assets.forEach((asset) => {
        if (typeof asset === "string") {
          if (asset.toLowerCase().includes("emergency fund") || asset.toLowerCase().includes("savings")) {
            assetCategories.add("Cash/Savings")
          }
          if (
            asset.toLowerCase().includes("401(k)") ||
            asset.toLowerCase().includes("403(b)") ||
            asset.toLowerCase().includes("ira")
          ) {
            assetCategories.add("Retirement Accounts")
          }
          if (
            asset.toLowerCase().includes("home") ||
            asset.toLowerCase().includes("condo") ||
            asset.toLowerCase().includes("property")
          ) {
            assetCategories.add("Real Estate")
          }
          if (
            asset.toLowerCase().includes("investment") ||
            asset.toLowerCase().includes("stocks") ||
            asset.toLowerCase().includes("bonds")
          ) {
            assetCategories.add("Investment Portfolio")
          }
          if (asset.toLowerCase().includes("business")) {
            assetCategories.add("Business Assets")
          }
        }
      })

      labeledProfile.assetCategories = Array.from(assetCategories)
    } else {
      // Generate default asset categories based on profile characteristics
      const defaultAssets = new Set()

      // Age-based defaults
      if (profile.age) {
        if (profile.age < 30) {
          defaultAssets.add("Cash/Savings")
          defaultAssets.add("Retirement Accounts (Early Stage)")
        } else if (profile.age < 50) {
          defaultAssets.add("Cash/Savings")
          defaultAssets.add("Retirement Accounts")
          defaultAssets.add("Real Estate")
        } else {
          defaultAssets.add("Cash/Savings")
          defaultAssets.add("Retirement Accounts")
          defaultAssets.add("Real Estate")
          defaultAssets.add("Investment Portfolio")
        }
      } else {
        defaultAssets.add("Cash/Savings")
        defaultAssets.add("Retirement Accounts")
      }

      // Occupation-based defaults
      if (profile.occupation) {
        if (
          profile.occupation.toLowerCase().includes("entrepreneur") ||
          profile.occupation.toLowerCase().includes("business") ||
          profile.occupation.toLowerCase().includes("owner")
        ) {
          defaultAssets.add("Business Assets")
        }

        if (
          profile.occupation.toLowerCase().includes("executive") ||
          profile.occupation.toLowerCase().includes("director") ||
          profile.occupation.toLowerCase().includes("manager")
        ) {
          defaultAssets.add("Investment Portfolio")
        }
      }

      labeledProfile.assetCategories = Array.from(defaultAssets)
    }

    // Handle debts from either direct debts array or financialDetails.debts
    const debts = profile.debts || (profile.financialDetails && profile.financialDetails.debts) || []

    // Calculate total debt value
    const totalDebtValue = calculateTotalDebt(debts)

    // Apply debt level labels based on total value using the provided ranges
    if (totalDebtValue >= 0) {
      if (totalDebtValue <= 1000) {
        labeledProfile.debtLevel = "No Debt"
      } else if (totalDebtValue <= 25000) {
        labeledProfile.debtLevel = "Low Debt"
      } else if (totalDebtValue <= 100000) {
        labeledProfile.debtLevel = "Moderate Debt"
      } else if (totalDebtValue <= 300000) {
        labeledProfile.debtLevel = "High Debt"
      } else {
        labeledProfile.debtLevel = "Very High Debt"
      }
    } else {
      // Default based on age if no debts found
      if (profile.age) {
        if (profile.age < 30) {
          labeledProfile.debtLevel = "Low Debt"
        } else if (profile.age < 50) {
          labeledProfile.debtLevel = "Moderate Debt"
        } else {
          labeledProfile.debtLevel = "Low Debt"
        }
      } else {
        labeledProfile.debtLevel = "Moderate Debt" // Default
      }
    }

    // Still categorize debt types for display
    if (debts.length > 0) {
      const debtCategories = new Set()

      debts.forEach((debt) => {
        if (typeof debt === "string") {
          if (debt.toLowerCase().includes("mortgage")) {
            debtCategories.add("Mortgage")
          }
          if (debt.toLowerCase().includes("student")) {
            debtCategories.add("Student Loans")
          }
          if (debt.toLowerCase().includes("auto") || debt.toLowerCase().includes("car")) {
            debtCategories.add("Auto Loan")
          }
          if (debt.toLowerCase().includes("credit card")) {
            debtCategories.add("Credit Card Debt")
          }
          if (debt.toLowerCase().includes("business")) {
            debtCategories.add("Business Loan")
          }
          if (debt.toLowerCase().includes("personal")) {
            debtCategories.add("Personal Loan")
          }
        }
      })

      labeledProfile.debtCategories = Array.from(debtCategories)
    } else {
      // Generate default debt categories based on profile characteristics
      const defaultDebts = new Set()

      // Age-based defaults
      if (profile.age) {
        if (profile.age < 30) {
          defaultDebts.add("Student Loans")
          defaultDebts.add("Credit Card Debt")
        } else if (profile.age < 50) {
          defaultDebts.add("Mortgage")
          defaultDebts.add("Auto Loan")
        } else if (profile.age < 65) {
          defaultDebts.add("Mortgage")
        }
      } else {
        defaultDebts.add("Typical Household Debt")
      }

      // Family-based defaults
      if (profile.family || profile.familyStatus) {
        const familyInfo = profile.familyStatus || profile.family
        if (familyInfo.toLowerCase().includes("children") || familyInfo.toLowerCase().includes("kids")) {
          defaultDebts.add("Education Expenses")
        }
      }

      // Occupation-based defaults
      if (profile.occupation) {
        if (
          profile.occupation.toLowerCase().includes("entrepreneur") ||
          profile.occupation.toLowerCase().includes("business") ||
          profile.occupation.toLowerCase().includes("owner")
        ) {
          defaultDebts.add("Business Loan")
        }
      }

      labeledProfile.debtCategories = Array.from(defaultDebts)
    }

    return labeledProfile
  }

  // Add or modify the function that determines what information to show based on difficulty
  const getVisibleClientInfo = (profile, difficulty) => {
    if (!profile) return {}

    // Create a filtered version of the profile based on difficulty
    const visibleProfile = { ...profile }

    // For intermediate difficulty, hide financial details and goals
    if (difficulty === "intermediate") {
      delete visibleProfile.income
      delete visibleProfile.incomeLevel
      delete visibleProfile.assets
      delete visibleProfile.debts
      delete visibleProfile.financialDetails
      delete visibleProfile.goals // Hide goals for intermediate difficulty
    }

    // For advanced difficulty, hide everything except name
    if (difficulty === "advanced") {
      // Keep only the name
      const { name } = visibleProfile
      return { name }
    }

    return visibleProfile
  }

  // Get client behavior traits from the profile or fallback to defaults
  const getClientBehaviorTraits = () => {
    if (clientProfile && clientProfile.fusionModelTraits) {
      return clientProfile.fusionModelTraits
    }

    // Fallback traits if not available in the profile
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

  // Convert the client profile to labeled format
  const labeledClientProfile = clientProfile ? convertToLabels(clientProfile) : {}

  // Make sure to use this function when displaying client information in the UI
  const visibleClientProfile = clientProfile ? getVisibleClientInfo(clientProfile, difficulty) : {}

  // Function to format focus area names
  const formatFocusAreaName = (id: string): string => {
    // Map of focus area IDs to their proper display names
    const focusAreaNames: Record<string, string> = {
      "life-insurance": "Life Insurance",
      annuities: "Annuities",
      "long-term-care": "Long-term Care Insurance",
      "medical-expense": "Medical Expense (including Medicare supplements)",
      "disability-insurance": "Disability Insurance",
      "homeowners-insurance": "Homeowners Insurance",
      "automobile-insurance": "Automobile Insurance",
    }

    // Return the mapped name if it exists, otherwise format the ID
    return (
      focusAreaNames[id] ||
      id
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
  }

  useEffect(() => {
    const fetchIndustrySettings = async () => {
      try {
        const response = await apiClient.get(`/api/industry-settings?industry=${industry}&subcategory=${subcategory}`);
        setAiRoleLabel(response.data.aiRoleLabel || undefined);
        setAiRoleDescription(response.data.aiRoleDescription || undefined);
        // Optionally store in sessionStorage for session page
        if (response.data.aiRoleLabel) sessionStorage.setItem("aiRoleLabel", response.data.aiRoleLabel);
        if (response.data.aiRoleDescription) sessionStorage.setItem("aiRoleDescription", response.data.aiRoleDescription);
      } catch (error) {
        console.error("Error fetching industry settings:", error);
      }
    };
    fetchIndustrySettings();
  }, [industry, subcategory]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header Section - Purple Banner */}
      <div className="bg-[rgb(35,15,110)] text-white p-6 rounded-md mb-6 text-center">
        <h1 className="text-2xl font-bold">Simulation Instructions</h1>
        <p className="mt-1">Prepare for your client interaction and understand your objectives</p>
      </div>

      {/* Simulation Parameters Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[rgb(35,15,110)] mb-2 border-b pb-2">Your Simulation Parameters</h2>
        <div className="border rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2 text-gray-500">Industry</h3>
              <div className="font-medium">{getIndustryName()}</div>
            </div>
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2 text-gray-500">Subcategory</h3>
              <div className="font-medium">{getSubcategoryName() || "N/A"}</div>
            </div>
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-2 text-gray-500">Difficulty</h3>
              <div className="font-medium">{getDifficultyName()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Areas Section - if any are selected */}
      {(() => {
        const focusAreasJson = sessionStorage.getItem("selectedFocusAreas")
        const selectedFocusAreas = focusAreasJson ? JSON.parse(focusAreasJson) : []

        if (selectedFocusAreas.length > 0) {
          return (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[rgb(35,15,110)] mb-2 border-b pb-2">Focus Areas</h2>
              <div className="border rounded-md">
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-2 text-gray-500">Selected Focus Areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFocusAreas.map((area) => (
                      <div
                        key={area.id}
                        className="bg-[rgb(35,15,110)]/10 text-[rgb(35,15,110)] px-3 py-1 rounded-full text-sm"
                      >
                        {area.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* Client Profile Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[rgb(35,15,110)] mb-2 border-b pb-2">Client Profile</h2>
        <div className="border rounded-md p-4">
          <h3 className="text-md font-medium mb-3">Available Client Information</h3>
          <p className="text-sm mb-4">
            {difficulty === "beginner" &&
              "At beginner level, you have access to general client information upfront. You'll need to ask specific questions to uncover detailed financial information during your conversation."}
            {difficulty === "intermediate" &&
              "At intermediate level, you need to uncover the client's financial details and goals through questioning and building trust. The client will share more information as rapport develops."}
            {difficulty === "advanced" &&
              "At advanced level, you must uncover nearly all client details through strategic questioning and significant trust-building. Only the client's name is provided initially."}
          </p>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(35,15,110)]"></div>
              <span className="ml-2">Loading client profile...</span>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-1/3 font-medium">CLIENT DETAIL</TableHead>
                    <TableHead className="font-medium">INFORMATION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientProfile && (
                    <>
                      <TableRow>
                        <TableCell className="font-medium">Name</TableCell>
                        <TableCell>{clientProfile.name}</TableCell>
                      </TableRow>

                      {difficulty !== "advanced" && (
                        <>
                          <TableRow>
                            <TableCell className="font-medium">Age</TableCell>
                            <TableCell>{labeledClientProfile.ageCategory || "Adult"}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Family Status</TableCell>
                            <TableCell>{labeledClientProfile.familyCategory || "Family Status Unknown"}</TableCell>
                          </TableRow>
                        </>
                      )}

                      {(difficulty === "beginner" || difficulty === "intermediate") && (
                        <TableRow>
                          <TableCell className="font-medium">Occupation</TableCell>
                          <TableCell>{labeledClientProfile.occupationSector || "Professional"}</TableCell>
                        </TableRow>
                      )}

                      {difficulty === "beginner" && (
                        <>
                          <TableRow>
                            <TableCell className="font-medium">Income</TableCell>
                            <TableCell>{labeledClientProfile.incomeRange || "Moderate Income"}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Assets</TableCell>
                            <TableCell>{labeledClientProfile.assetLevel || "Moderate Assets"}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Debt</TableCell>
                            <TableCell>{labeledClientProfile.debtLevel || "Moderate Debt"}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Primary Goals</TableCell>
                            <TableCell>
                              {clientProfile.goals && clientProfile.goals.length > 0
                                ? clientProfile.goals.join(", ")
                                : "Financial security and growth"}
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 border rounded-md p-4 bg-gray-50">
            <h3 className="text-sm font-medium mb-2">Difficulty Level Notes</h3>
            <p className="text-sm">
              {difficulty === "beginner" &&
                "At beginner level, you have access to general client information upfront. You'll need to ask specific questions to uncover detailed financial information during your conversation."}
              {difficulty === "intermediate" &&
                "At intermediate level, you need to uncover additional client details through questioning and building trust. The client will share more information as rapport develops."}
              {difficulty === "advanced" &&
                "At advanced level, you must uncover nearly all client details through strategic questioning and significant trust-building. Only the client's name is provided initially."}
            </p>
          </div>
        </div>
      </div>

      {/* Display selected focus areas if any */}

      {/* Client Behavior Section - Hidden from students but still generated */}
      {false && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[rgb(35,15,110)] mb-2 border-b pb-2">Client Behavior Profile</h2>
          <div className="border rounded-md p-4">
            <h3 className="text-md font-medium mb-3 flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-[rgb(35,15,110)]" />
              Expected Client Behavior
            </h3>
            <p className="text-sm mb-4">
              {difficulty === "beginner" &&
                "This client is generally cooperative and open to advice. They will readily share information and are unlikely to raise strong objections."}
              {difficulty === "intermediate" &&
                "This client is somewhat reserved initially and will need trust-building before sharing all relevant information. They may raise moderate objections to recommendations."}
              {difficulty === "advanced" &&
                "This client is skeptical and may challenge your expertise. They will require significant trust-building and may present strong objections to your recommendations."}
            </p>

            {!isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {Object.entries(getClientBehaviorTraits()).map(([trait, value]) => (
                  <div key={trait} className="border rounded-md p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium capitalize">{trait.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="text-xs font-medium">{value}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[rgb(35,15,110)] h-2 rounded-full" style={{ width: `${value}%` }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {trait === "openness" && "Willingness to consider new ideas and approaches"}
                      {trait === "conscientiousness" && "Attention to detail and organization"}
                      {trait === "extraversion" && "Energy and sociability in interactions"}
                      {trait === "agreeableness" && "Cooperation and consideration of others"}
                      {trait === "neuroticism" && "Tendency toward worry or emotional reactions"}
                      {trait === "assertiveness" && "Confidence in expressing opinions and needs"}
                      {trait === "honestyHumility" && "Sincerity and fairness in interactions"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Competencies Section - New */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[rgb(35,15,110)] mb-2 border-b pb-2">Competencies Being Evaluated</h2>
        <div className="border rounded-md p-4">
          <h3 className="text-md font-medium mb-3">Key Skills for This Industry</h3>
          <p className="text-sm mb-4">
            Your performance will be evaluated on the following competencies, which are specifically relevant to{" "}
            {getIndustryName()}
            {getSubcategoryName() ? ` - ${getSubcategoryName()}` : ""}.
          </p>

          {selectedCompetencies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCompetencies.map((competency) => (
                <div key={competency.id} className="border rounded-md p-3">
                  <h4 className="font-medium text-[rgb(35,15,110)]">{competency.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{competency.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 border rounded-md bg-gray-50">
              <p className="text-gray-500">No specific competencies configured for this industry.</p>
            </div>
          )}
        </div>
      </div>

      {/* Objectives Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[rgb(35,15,110)] mb-2 border-b pb-2">Your Objectives</h2>
        <div className="border rounded-md p-4">
          <h3 className="text-md font-medium mb-3">Key Objectives to Complete</h3>
          <p className="text-sm mb-4">
            {difficulty === "beginner" &&
              "Focus on building rapport, asking basic needs assessment questions, and providing general recommendations."}
            {difficulty === "intermediate" &&
              "Focus on building trust, uncovering hidden information, and addressing the client's concerns with appropriate recommendations."}
            {difficulty === "advanced" &&
              "Focus on overcoming client skepticism, uncovering hidden information through strategic questioning, and providing sophisticated recommendations."}
          </p>

          <ul className="space-y-3 mt-4">
            <li className="flex items-start border-b pb-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgb(35,15,110)] flex items-center justify-center text-white mr-3">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Build Rapport</p>
                <p className="text-sm text-gray-600">Establish a connection with your client</p>
              </div>
            </li>
            <li className="flex items-start border-b pb-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgb(35,15,110)] flex items-center justify-center text-white mr-3">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Needs Assessment</p>
                <p className="text-sm text-gray-600">Discover your client's financial situation and goals</p>
              </div>
            </li>
            <li className="flex items-start border-b pb-2">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgb(35,15,110)] flex items-center justify-center text-white mr-3">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Handle Objections</p>
                <p className="text-sm text-gray-600">Address concerns professionally</p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgb(35,15,110)] flex items-center justify-center text-white mr-3">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Provide Recommendations</p>
                <p className="text-sm text-gray-600">Suggest appropriate options based on needs</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* How to Complete Section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-[rgb(35,15,110)] mb-2 border-b pb-2">How to Complete the Simulation</h2>
        <div className="border rounded-md p-4">
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[rgb(35,15,110)]/10 flex items-center justify-center text-[rgb(35,15,110)]">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-md font-medium mb-2">1. Starting the Conversation</h3>
                <p className="text-sm text-gray-600">
                  The client will introduce themselves first. Respond by introducing yourself and begin building
                  rapport. Type your responses in the text area and press Enter or click Send. Focus on open-ended
                  questions to gather information about their situation and needs.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[rgb(35,15,110)]/10 flex items-center justify-center text-[rgb(35,15,110)]">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-md font-medium mb-2">2. Meeting Your Objectives</h3>
                <p className="text-sm text-gray-600">
                  Work through your objectives in a natural conversation flow. The client panel will show your progress
                  on each objective. Adapt your approach based on the client's responses and the difficulty level.
                  {difficulty === "beginner" &&
                    " Take your time to establish a connection. The client will be patient and responsive."}
                  {difficulty === "intermediate" &&
                    " Be persistent but respectful when seeking information. The client will share more as trust develops."}
                  {difficulty === "advanced" &&
                    " Use sophisticated questioning techniques and demonstrate expertise to overcome skepticism."}
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[rgb(35,15,110)]/10 flex items-center justify-center text-[rgb(35,15,110)]">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-md font-medium mb-2">3. Getting Help When Needed</h3>
                <p className="text-sm text-gray-600">
                  If you're stuck or unsure how to proceed, click the "Need Help?" button to switch to assistant mode.
                  You can ask for guidance on how to handle the current situation or get advice on your approach. When
                  you're ready to continue, click "Return to Client" to resume the simulation.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[rgb(35,15,110)]/10 flex items-center justify-center text-[rgb(35,15,110)]">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-md font-medium mb-2">4. Concluding the Simulation</h3>
                <p className="text-sm text-gray-600 mb-3">The simulation is complete when you've:</p>
                <div className="bg-gray-50 p-3 rounded-md">
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-[rgb(35,15,110)] flex items-center justify-center text-white mr-2">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-sm">Completed the provided objectives</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-[rgb(35,15,110)] flex items-center justify-center text-white mr-2">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-sm">Gathered sufficient information about the client's situation</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-[rgb(35,15,110)] flex items-center justify-center text-white mr-2">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-sm">Provided appropriate recommendations based on their needs</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-5 h-5 rounded-full bg-[rgb(35,15,110)] flex items-center justify-center text-white mr-2">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-sm">Reached a natural conclusion in the conversation</span>
                    </li>
                  </ul>
                </div>
                <p className="text-sm mt-3">
                  Click "End Simulation" when you're ready to conclude. You'll receive a detailed performance review
                  with feedback and scores across key competencies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <Link href="/simulation/industry-selection">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <Button
          onClick={handleContinueToSimulation}
          className="bg-[rgb(35,15,110)] hover:bg-[rgb(80,63,139)]"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Continue to Simulation
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
