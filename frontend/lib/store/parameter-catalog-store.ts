import { create } from "zustand"
import { persist } from "zustand/middleware"

// Define types for our parameter catalog
export interface BaseParameter {
  id: string
  name: string
  description?: string
  global: boolean
  applicableIndustries?: string[]
}

export interface StructuredParameter extends BaseParameter {
  type: "structured"
  category: string
  range?: string
}

export interface LifeParameter extends BaseParameter {
  type: "life"
  examples: string
}

export interface GuardrailParameter extends BaseParameter {
  type: "guardrail"
  category: string
  examples: string
}

export type CatalogParameter = StructuredParameter | LifeParameter | GuardrailParameter

export interface ParameterCategory {
  id: string
  name: string
  key: string
  parameterType: "structured" | "life" | "guardrail"
}

interface ParameterCatalogState {
  parameters: CatalogParameter[]
  categories: ParameterCategory[]

  // CRUD operations for parameters
  addParameter: (parameter: Omit<CatalogParameter, "id">) => string
  updateParameter: (id: string, updates: Partial<Omit<CatalogParameter, "id" | "type">>) => void
  deleteParameter: (id: string) => void
  getParametersByType: (type: CatalogParameter["type"]) => CatalogParameter[]
  getParametersByCategory: (type: CatalogParameter["type"], categoryKey: string) => CatalogParameter[]

  // CRUD operations for categories
  addCategory: (category: Omit<ParameterCategory, "id">) => string
  updateCategory: (id: string, updates: Partial<Omit<ParameterCategory, "id">>) => void
  deleteCategory: (id: string) => void
  getCategoriesByType: (type: ParameterCategory["parameterType"]) => ParameterCategory[]

  // Initialize with default data
  initializeDefaultData: () => void
}

// Generate a simple ID (in a real app, use a proper ID generator)
const generateId = () => Math.random().toString(36).substring(2, 11)

export const useParameterCatalogStore = create<ParameterCatalogState>()(
  persist(
    (set, get) => ({
      parameters: [],
      categories: [],

      addParameter: (parameter) => {
        const id = generateId()
        set((state) => ({
          parameters: [...state.parameters, { ...parameter, id }],
        }))
        return id
      },

      updateParameter: (id, updates) => {
        set((state) => ({
          parameters: state.parameters.map((param) => (param.id === id ? { ...param, ...updates } : param)),
        }))
      },

      deleteParameter: (id) => {
        set((state) => ({
          parameters: state.parameters.filter((param) => param.id !== id),
        }))
      },

      getParametersByType: (type) => {
        return get().parameters.filter((param) => param.type === type)
      },

      getParametersByCategory: (type, categoryKey) => {
        return get().parameters.filter(
          (param) =>
            param.type === type &&
            (param.type === "structured" || param.type === "guardrail") &&
            param.category === categoryKey,
        )
      },

      addCategory: (category) => {
        const id = generateId()
        set((state) => ({
          categories: [...state.categories, { ...category, id }],
        }))
        return id
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)),
        }))
      },

      deleteCategory: (id) => {
        // First, check if there are any parameters using this category
        const parameters = get().parameters
        const category = get().categories.find((c) => c.id === id)

        if (!category) return

        const hasParameters = parameters.some(
          (param) => (param.type === "structured" || param.type === "guardrail") && param.category === category.key,
        )

        if (hasParameters) {
          console.error("Cannot delete category with associated parameters")
          return
        }

        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
        }))
      },

      getCategoriesByType: (type) => {
        return get().categories.filter((cat) => cat.parameterType === type)
      },

      initializeDefaultData: () => {
        // Only initialize if the store is empty
        if (get().categories.length > 0 || get().parameters.length > 0) {
          return
        }

        // Add default categories
        const structuredCategories = [
          { name: "Age Groups", key: "age-groups", parameterType: "structured" as const },
          { name: "Income Levels", key: "income-levels", parameterType: "structured" as const },
          { name: "Debt Levels", key: "debt-levels", parameterType: "structured" as const },
          { name: "Credit Score", key: "credit-score", parameterType: "structured" as const },
          { name: "Education Level", key: "education-level", parameterType: "structured" as const },
        ]

        const guardrailCategories = [
          { name: "Industry Knowledge", key: "industry-knowledge", parameterType: "guardrail" as const },
          { name: "Conversation Boundaries", key: "conversation-boundaries", parameterType: "guardrail" as const },
          { name: "Regulatory Awareness", key: "regulatory-awareness", parameterType: "guardrail" as const },
        ]

        // Add categories
        const categoryIds = {}

        structuredCategories.forEach((category) => {
          const id = get().addCategory(category)
          categoryIds[category.key] = id
        })

        guardrailCategories.forEach((category) => {
          const id = get().addCategory(category)
          categoryIds[category.key] = id
        })

        // Add some example parameters
        get().addParameter({
          type: "structured",
          name: "Young Adult",
          description: "Age range for young adults",
          category: "age-groups",
          range: "18-25",
          global: true,
        })

        get().addParameter({
          type: "structured",
          name: "Early Career",
          description: "Age range for early career professionals",
          category: "age-groups",
          range: "26-35",
          global: true,
        })

        get().addParameter({
          type: "life",
          name: "Family Status",
          description: "The client's current family structure and living situation",
          examples: '"Single professional", "Married with dependents", "Multi-generational household"',
          global: true,
        })

        get().addParameter({
          type: "guardrail",
          name: "Basic Industry Terms",
          description: "Fundamental terminology the client should understand",
          category: "industry-knowledge",
          examples: "Basic terms related to the industry that most clients would know",
          global: true,
        })
      },
    }),
    {
      name: "parameter-catalog-storage", // Storage key for persistence
    },
  ),
)
