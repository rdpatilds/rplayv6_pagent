"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CSVTemplateDownload } from "@/components/csv-template-download"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function UserImportHelpPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Import Help</h1>
        <CSVTemplateDownload />
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CSV Format Instructions</CardTitle>
            <CardDescription>Follow these guidelines to properly format your CSV file for user imports</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The CSV file must include the following columns. The first row should contain the column headers exactly
              as shown below:
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Example</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">firstName</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>User's first name</TableCell>
                  <TableCell>John</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">lastName</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>User's last name</TableCell>
                  <TableCell>Doe</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">email</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>User's email address (must be unique)</TableCell>
                  <TableCell>john.doe@example.com</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">password</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>Initial password for the user</TableCell>
                  <TableCell>password123</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">role</TableCell>
                  <TableCell>Yes</TableCell>
                  <TableCell>
                    User's account type (must be one of: learner, trainer, company_admin, super_admin)
                  </TableCell>
                  <TableCell>learner</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">jobRole</TableCell>
                  <TableCell>No</TableCell>
                  <TableCell>User's job title or role at their company</TableCell>
                  <TableCell>Sales Manager</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Example CSV</CardTitle>
            <CardDescription>Here's an example of a properly formatted CSV file</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
              <code>
                firstName,lastName,email,password,role,jobRole
                <br />
                John,Doe,john.doe@example.com,password123,learner,Sales Manager
                <br />
                Jane,Smith,jane.smith@example.com,securepass,trainer,Training Coordinator
                <br />
                Michael,Johnson,michael@example.com,pass1234,company_admin,HR Director
              </code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Process</CardTitle>
            <CardDescription>How the bulk import process works</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal pl-5 space-y-2">
              <li>Download the CSV template using the button at the top of this page</li>
              <li>Fill in the template with your user data, following the format guidelines</li>
              <li>Save the file as a CSV (comma-separated values) file</li>
              <li>Go to the User Management page and click "Bulk Import"</li>
              <li>Select your CSV file and click "Import Users"</li>
              <li>The system will process each user and report the results</li>
            </ol>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800">
              <h3 className="font-medium mb-2">Important Notes:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Each email address must be unique in the system</li>
                <li>The import will continue even if some users fail to import</li>
                <li>You'll receive a report showing successful and failed imports</li>
                <li>
                  For security reasons, consider requiring users to change their passwords after their first login
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
