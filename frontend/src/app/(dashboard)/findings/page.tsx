import { Finding, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react"
import Link from "next/link"

async function getData(): Promise<Finding[]> {
  // Mock data
  return [
    {
      id: 1,
      title: "SQL Injection in Login Parameter",
      project_id: 1,
      severity: "Critical",
      cvss: 9.8,
      category: "Injection",
      status: "Open",
      ai_generated: true
    },
    {
      id: 2,
      title: "Cross-Site Scripting (XSS) in Comments",
      project_id: 1,
      severity: "High",
      cvss: 7.2,
      category: "XSS",
      status: "Open",
      ai_generated: false
    },
    {
      id: 3,
      title: "Insecure Direct Object Reference (IDOR)",
      project_id: 2,
      severity: "Medium",
      cvss: 5.3,
      category: "Broken Access Control",
      status: "Fixed",
      ai_generated: true
    }
  ]
}

export default async function FindingsPage() {
  const data = await getData()

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Findings Library</h2>
          <p className="text-muted-foreground mt-1">
            Manage vulnerabilities across all projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/findings/create">
            <Button className="gap-2 shadow-sm font-medium">
              <Plus className="h-4 w-4" /> Add Finding
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/50 p-3 rounded-xl border border-border/50 shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search findings..."
                className="w-full bg-background pl-9 border-border shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" className="gap-2 bg-background shadow-sm border-border w-full sm:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline">Filters</span>
            </Button>
            <Button variant="outline" className="gap-2 bg-background shadow-sm border-border w-full sm:w-auto">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <span className="hidden sm:inline">Sort</span>
            </Button>
          </div>
      </div>

      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  )
}
