"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

// Types
interface BaseComponent {
  id: string
  name: string
  description: string
}

interface CoreTrait extends BaseComponent {
  category: string
  weight: number
  influence: number
}

interface Mood extends BaseComponent {
  intensity?: number
}

interface CommunicationStyle extends BaseComponent {
  characteristics: string[]
}

interface Archetype extends BaseComponent {
  traits: string[]
  behaviors: string[]
}

interface Quirk extends BaseComponent {
  impact: string
  fusion_links: string[]
}

type ComponentType = 'core-trait' | 'mood' | 'communication-style' | 'archetype' | 'quirk'

interface Props {
  activeTab: string
}

interface EditingComponent {
  type: ComponentType
  data: any
}

export default function FusionDatabaseEditor({ activeTab }: Props) {
  const [loading, setLoading] = useState(true)
  const [coreTraits, setCoreTraits] = useState<CoreTrait[]>([])
  const [moods, setMoods] = useState<Mood[]>([])
  const [commStyles, setCommStyles] = useState<CommunicationStyle[]>([])
  const [archetypes, setArchetypes] = useState<Archetype[]>([])
  const [quirks, setQuirks] = useState<Quirk[]>([])
  const [editingComponent, setEditingComponent] = useState<EditingComponent | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  async function fetchData() {
    try {
      setLoading(true)
      
      // Only fetch data for the active tab
      switch (activeTab) {
        case 'traits':
          const traits = await fetch("/api/personality/core-traits").then(async (res) => {
            if (!res.ok) throw new Error('Failed to fetch core traits')
            const data = await res.json()
            return Array.isArray(data) ? data : []
          })
          setCoreTraits(traits)
          break
          
        case 'archetype':
          const archetypes = await fetch("/api/personality/archetypes").then(async (res) => {
            if (!res.ok) throw new Error('Failed to fetch archetypes')
            const data = await res.json()
            return Array.isArray(data) ? data : []
          })
          setArchetypes(archetypes)
          break
          
        case 'communication':
          const styles = await fetch("/api/personality/communication-styles").then(async (res) => {
            if (!res.ok) throw new Error('Failed to fetch communication styles')
            const data = await res.json()
            return Array.isArray(data) ? data : []
          })
          setCommStyles(styles)
          break
          
        case 'quirks':
          const quirks = await fetch("/api/personality/quirks").then(async (res) => {
            if (!res.ok) throw new Error('Failed to fetch quirks')
            const data = await res.json()
            return Array.isArray(data) ? data : []
          })
          setQuirks(quirks)
          break
          
        case 'influence':
          // Fetch influence settings
          break
          
        case 'db-config':
          // Fetch database configuration
          break
      }
    } catch (e) {
      console.error("Error loading data:", e)
      toast.error("Failed to load components")
      // Initialize with empty arrays on error
      setCoreTraits([])
      setMoods([])
      setCommStyles([])
      setArchetypes([])
      setQuirks([])
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = (type: ComponentType) => {
    setEditingComponent({ type, data: {} })
    setIsDialogOpen(true)
  }

  const handleEdit = (type: ComponentType, data: any) => {
    setEditingComponent({ type, data })
    setIsDialogOpen(true)
  }

  const handleDelete = async (type: ComponentType, id: string) => {
    try {
      const response = await fetch(`/api/personality/${type}/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete component')
      
      toast.success('Component deleted successfully')
      fetchData() // Refresh the data
    } catch (error) {
      console.error('Error deleting component:', error)
      toast.error('Failed to delete component')
    }
  }

  const handleSave = async (type: ComponentType, data: any) => {
    try {
      const url = data.id 
        ? `/api/personality/${type}/${data.id}`
        : `/api/personality/${type}`
      
      const response = await fetch(url, {
        method: data.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) throw new Error('Failed to save component')
      
      toast.success('Component saved successfully')
      setIsDialogOpen(false)
      fetchData() // Refresh the data
    } catch (error) {
      console.error('Error saving component:', error)
      toast.error('Failed to save component')
    }
  }

  if (loading) return <Skeleton className="h-96 w-full" />

  // Render different content based on active tab
  switch (activeTab) {
    case 'traits':
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Core Traits</CardTitle>
            <Button size="sm" onClick={() => handleAdd('core-trait')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Trait
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.isArray(coreTraits) && coreTraits.map((trait) => (
              <div key={trait.id} className="flex justify-between items-center border p-2 rounded-md">
                <div>
                  <div className="font-medium">{trait.name}</div>
                  <div className="text-xs text-gray-500">{trait.description}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Category: {trait.category} | Weight: {trait.weight} | Influence: {trait.influence}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit('core-trait', trait)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete('core-trait', trait.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )

    case 'archetype':
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Archetypes</CardTitle>
            <Button size="sm" onClick={() => handleAdd('archetype')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Archetype
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.isArray(archetypes) && archetypes.map((archetype) => (
              <div key={archetype.id} className="flex justify-between items-center border p-2 rounded-md">
                <div>
                  <div className="font-medium">{archetype.name}</div>
                  <div className="text-xs text-gray-500">{archetype.description}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit('archetype', archetype)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete('archetype', archetype.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )

    case 'communication':
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Communication Styles</CardTitle>
            <Button size="sm" onClick={() => handleAdd('communication-style')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Style
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.isArray(commStyles) && commStyles.map((style) => (
              <div key={style.id} className="flex justify-between items-center border p-2 rounded-md">
                <div>
                  <div className="font-medium">{style.name}</div>
                  <div className="text-xs text-gray-500">{style.description}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit('communication-style', style)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete('communication-style', style.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )

    case 'quirks':
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Quirks</CardTitle>
            <Button size="sm" onClick={() => handleAdd('quirk')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Quirk
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.isArray(quirks) && quirks.map((quirk) => (
              <div key={quirk.id} className="flex justify-between items-center border p-2 rounded-md">
                <div>
                  <div className="font-medium">{quirk.name}</div>
                  <div className="text-xs text-gray-500">{quirk.description}</div>
                  <div className="text-xs text-gray-400 italic mt-1">{quirk.impact}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit('quirk', quirk)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete('quirk', quirk.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )

    default:
      return <div>Select a tab to view content</div>
  }

  // Edit Dialog
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingComponent?.data?.id ? 'Edit' : 'Add'} {editingComponent?.type}
          </DialogTitle>
        </DialogHeader>
        {editingComponent && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editingComponent.data?.name || ''}
                onChange={(e) => {
                  const component = editingComponent
                  if (component) {
                    setEditingComponent({
                      type: component.type,
                      data: { ...component.data, name: e.target.value }
                    })
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editingComponent.data?.description || ''}
                onChange={(e) => {
                  const component = editingComponent
                  if (component) {
                    setEditingComponent({
                      type: component.type,
                      data: { ...component.data, description: e.target.value }
                    })
                  }
                }}
              />
            </div>
            {/* Add additional fields based on component type */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                const component = editingComponent
                if (component) {
                  handleSave(component.type, component.data)
                }
              }}>
                Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
