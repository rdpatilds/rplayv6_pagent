import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getParameters } from "@/lib/db"

export default async function ParameterTable() {
  const parameters = await getParameters()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parameters</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Global</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parameters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No parameters found
                </TableCell>
              </TableRow>
            ) : (
              parameters.map((param) => (
                <TableRow key={param.id}>
                  <TableCell className="font-medium">
                    {param.name}
                    {param.description && <p className="text-xs text-gray-500 mt-1">{param.description}</p>}
                  </TableCell>
                  <TableCell>{param.category_name || "Uncategorized"}</TableCell>
                  <TableCell>{param.type}</TableCell>
                  <TableCell>
                    {param.global ? (
                      <Badge className="bg-green-500">Global</Badge>
                    ) : (
                      <Badge variant="outline">Specific</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
