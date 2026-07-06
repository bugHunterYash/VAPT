import { Project, columns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

async function getData(): Promise<Project[]> {
  // Mock data representing what will be fetched from FastAPI
  return [
    {
      id: 1,
      name: "CorpNet API Penetration Test",
      organization_id: 1,
      status: "In Progress",
      assessment_type: "API",
      environment: "Staging",
      priority: "High",
      progress: 45,
      findings: { critical: 2, high: 5, medium: 12, low: 4 }
    },
    {
      id: 2,
      name: "Main Web App Assessment",
      organization_id: 1,
      status: "Assigned",
      assessment_type: "Web",
      environment: "Production",
      priority: "Critical",
      progress: 0,
      findings: { critical: 0, high: 0, medium: 0, low: 0 }
    },
    {
      id: 3,
      name: "Mobile App Android Security Audit",
      organization_id: 2,
      status: "Completed",
      assessment_type: "Android",
      environment: "Production",
      priority: "Medium",
      progress: 100,
      findings: { critical: 0, high: 1, medium: 3, low: 8 }
    },
    {
      id: 4,
      name: "Cloud Infrastructure Audit",
      organization_id: 3,
      status: "Pending Review",
      assessment_type: "Cloud",
      environment: "AWS",
      priority: "High",
      progress: 95,
      findings: { critical: 1, high: 4, medium: 15, low: 20 }
    }
  ]
}

function SummaryCard({ title, value, subtitle }: { title: string, value: string | number, subtitle?: string }) {
    return (
        <Card className="bg-card border-border/50 shadow-sm">
            <CardContent className="p-4 sm:p-5 flex flex-col gap-1">
                <span className="text-sm font-medium text-muted-foreground">{title}</span>
                <span className="text-2xl sm:text-3xl font-bold tracking-tight">{value}</span>
                {subtitle && <span className="text-xs text-muted-foreground mt-1">{subtitle}</span>}
            </CardContent>
        </Card>
    )
}

export default async function ProjectsPage() {
  const data = await getData()

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground mt-1">
            Manage enterprise vulnerability assessments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/projects/create">
            <Button className="gap-2 shadow-sm font-medium">
              <Plus className="h-4 w-4" /> Create Project
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryCard title="Total Projects" value="24" subtitle="+2 this month" />
          <SummaryCard title="In Progress" value="8" />
          <SummaryCard title="Pending Review" value="3" />
          <SummaryCard title="Completed" value="13" />
          <SummaryCard title="Critical Findings" value="14" subtitle="Across all projects" />
          <SummaryCard title="Overdue" value="1" subtitle="Requires attention" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/50 p-3 rounded-xl border border-border/50 shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Filter projects..."
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
