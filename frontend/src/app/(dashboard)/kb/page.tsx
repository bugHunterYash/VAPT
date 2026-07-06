import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const kbData = [
  { title: "SQL Injection", category: "Injection", owasp: "A03:2021", cwe: "CWE-89" },
  { title: "Cross-Site Scripting (XSS)", category: "XSS", owasp: "A03:2021", cwe: "CWE-79" },
  { title: "Server-Side Request Forgery", category: "SSRF", owasp: "A10:2021", cwe: "CWE-918" },
  { title: "Broken Access Control", category: "Auth", owasp: "A01:2021", cwe: "CWE-284" },
]

export default function KBPage() {
  return (
    <div className="flex h-full flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Knowledge Base</h2>
          <p className="text-muted-foreground">Standardized vulnerability library for deduplication.</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kbData.map(item => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="outline">{item.owasp}</Badge>
                <Badge variant="secondary">{item.cwe}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
