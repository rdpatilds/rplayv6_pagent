"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usersApi } from "@/lib/api"

export function BulkImportDialog({ onSuccess }) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [importMethod, setImportMethod] = useState("csv") // "csv" or "json"
  const [jsonData, setJsonData] = useState("")
  const [file, setFile] = useState(null)
  const [results, setResults] = useState(null)

  const handleDownloadTemplate = () => {
    // Create CSV template content
    const headers = "firstName,lastName,email,password,role,jobRole,company"
    const exampleRow = "John,Doe,john.doe@example.com,password123,learner,Sales Manager,Acme Inc"
    const csvContent = `${headers}\n${exampleRow}`

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "user-import-template.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    try {
      setIsLoading(true)
      setResults(null)

      if (importMethod === "csv" && !file) {
        toast({
          title: "Error",
          description: "Please select a CSV file to upload",
          variant: "destructive",
        })
        return
      }

      if (importMethod === "json" && !jsonData.trim()) {
        toast({
          title: "Error",
          description: "Please enter JSON data",
          variant: "destructive",
        })
        return
      }

      let data

      if (importMethod === "csv") {
        data = await usersApi.bulkImport({
          file,
          importMethod: "csv",
        })
      } else {
        // For JSON method
        try {
          // Validate JSON
          const parsedData = JSON.parse(jsonData)
          data = await usersApi.bulkImport({
            jsonData,
            importMethod: "json",
          })
        } catch (error) {
          toast({
            title: "Invalid JSON",
            description: "Please check your JSON format and try again",
            variant: "destructive",
          })
          return
        }
      }

      setResults(data.results)

      if (data.results.success > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${data.results.success} users.`,
        })

        if (data.results.failed > 0) {
          toast({
            title: "Some imports failed",
            description: `${data.results.failed} users could not be imported.`,
            variant: "destructive",
          })
        }

        // Call the success callback to refresh the user list
        if (typeof onSuccess === "function") {
          onSuccess()
        }
      } else {
        toast({
          title: "Import Failed",
          description: "No users were imported. Please check the errors and try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error importing users:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to import users. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setJsonData("")
    setFile(null)
    setResults(null)
  }

  const handleOpenChange = (open) => {
    setIsOpen(open)
    if (!open) {
      resetForm()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Users</DialogTitle>
          <DialogDescription>Import multiple users at once using a CSV file or JSON data.</DialogDescription>
        </DialogHeader>

        <div className="flex space-x-4 my-4">
          <Button
            variant={importMethod === "csv" ? "default" : "outline"}
            onClick={() => setImportMethod("csv")}
            className="flex-1"
          >
            CSV File
          </Button>
          <Button
            variant={importMethod === "json" ? "default" : "outline"}
            onClick={() => setImportMethod("json")}
            className="flex-1"
          >
            JSON Data
          </Button>
        </div>

        {importMethod === "csv" ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="csvFile">Upload CSV File</Label>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate} type="button">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
            <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>CSV should have the following headers:</p>
              <ul className="list-disc pl-5">
                <li>firstName, lastName, email, password (required)</li>
                <li>role (optional, defaults to "learner")</li>
                <li>jobRole, company (optional)</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Label htmlFor="jsonData">JSON Data</Label>
            <Textarea
              id="jsonData"
              placeholder={`[
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "role": "learner",
    "jobRole": "Sales Manager",
    "company": "Acme Inc"
  }
]`}
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        )}

        {results && (
          <Alert variant={results.failed > 0 ? "destructive" : "default"}>
            <div className="flex items-center gap-2">
              {results.failed > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              <AlertTitle>Import Results</AlertTitle>
            </div>
            <AlertDescription>
              <p>Successfully imported: {results.success} users</p>
              {results.failed > 0 && (
                <>
                  <p>Failed to import: {results.failed} users</p>
                  <div className="mt-2 max-h-[100px] overflow-y-auto text-sm">
                    {results.errors.map((error, index) => (
                      <p key={index} className="text-xs">
                        • {error}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Importing..." : "Import Users"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
