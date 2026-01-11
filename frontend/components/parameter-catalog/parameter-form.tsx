"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Parameter } from "@/lib/parameter-db"
import { useParameterCategories } from "@/hooks/use-parameter-categories"
import { Loader2 } from "lucide-react"

const parameterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["structured", "narrative", "guardrail", "life"]),
  category_key: z.string().optional(),
  global: z.boolean().default(true),
  range: z.string().optional(),
  examples: z.string().optional(),
})

type ParameterFormValues = z.infer<typeof parameterSchema>

interface ParameterFormProps {
  parameter?: Parameter
  type?: "structured" | "narrative" | "guardrail" | "life"
  onSubmit: (data: Partial<Parameter>) => Promise<void>
  onCancel: () => void
}

export function ParameterForm({ parameter, type = "structured", onSubmit, onCancel }: ParameterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: categories, isLoading: isLoadingCategories } = useParameterCategories(type)

  const defaultValues: Partial<ParameterFormValues> = {
    name: parameter?.name || "",
    description: parameter?.description || "",
    type: parameter?.type || type,
    category_key: parameter?.category_key || "",
    global: parameter?.global !== undefined ? parameter.global : true,
    range: parameter?.range || "",
    examples: parameter?.examples || "",
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
  } = useForm<ParameterFormValues>({
    resolver: zodResolver(parameterSchema),
    defaultValues,
  })

  const onFormSubmit = async (data: ParameterFormValues) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...register("description")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type</Label>
          <Select
            defaultValue={defaultValues.type}
            onValueChange={(value) => register("type").onChange({ target: { value } })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="structured">Structured</SelectItem>
              <SelectItem value="narrative">Narrative</SelectItem>
              <SelectItem value="guardrail">Guardrail</SelectItem>
              <SelectItem value="life">Life</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            defaultValue={defaultValues.category_key || ""}
            onValueChange={(value) => register("category_key").onChange({ target: { value } })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.key}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="range">Range</Label>
          <Input id="range" {...register("range")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="examples">Examples</Label>
          <Textarea id="examples" {...register("examples")} />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="global"
            checked={watch("global")}
            onCheckedChange={(checked) => register("global").onChange({ target: { value: checked } })}
          />
          <Label htmlFor="global">Global Parameter</Label>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end space-x-2 border-t p-4">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {parameter ? "Update" : "Create"}
        </Button>
      </CardFooter>
    </form>
  )
}
