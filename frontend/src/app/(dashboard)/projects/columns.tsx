"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Project = {
  id: number
  name: string
  organization_id: number
  status: string
  assessment_type: string
  environment: string
  priority?: string
  progress?: number
  findings?: {
    critical: number,
    high: number,
    medium: number,
    low: number
  }
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-4 hover:bg-transparent hover:text-primary text-muted-foreground font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Project Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
        <div className="font-semibold">{row.getValue("name")}</div>
    )
  },
  {
    accessorKey: "environment",
    header: () => <span className="text-muted-foreground font-medium">Environment</span>,
    cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue("environment")}</div>
    )
  },
  {
    accessorKey: "assessment_type",
    header: () => <span className="text-muted-foreground font-medium">Type</span>,
  },
  {
    accessorKey: "progress",
    header: () => <span className="text-muted-foreground font-medium">Progress</span>,
    cell: ({ row }) => {
      const progress = row.getValue("progress") as number
      return (
          <div className="flex items-center gap-3">
              <div className="h-1.5 w-24 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground font-medium w-8">{progress}%</span>
          </div>
      )
    }
  },
  {
    accessorKey: "findings",
    header: () => <span className="text-muted-foreground font-medium">Findings</span>,
    cell: ({ row }) => {
      const findings = row.original.findings
      if (!findings) return <span className="text-muted-foreground">-</span>
      return (
          <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-destructive/10 text-xs font-semibold text-destructive ring-1 ring-inset ring-destructive/20">{findings.critical}</span>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-orange-500/10 text-xs font-semibold text-orange-500 ring-1 ring-inset ring-orange-500/20">{findings.high}</span>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-yellow-500/10 text-xs font-semibold text-yellow-500 ring-1 ring-inset ring-yellow-500/20">{findings.medium}</span>
              <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/10 text-xs font-semibold text-blue-500 ring-1 ring-inset ring-blue-500/20">{findings.low}</span>
          </div>
      )
    }
  },
  {
    accessorKey: "status",
    header: () => <span className="text-muted-foreground font-medium">Status</span>,
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      // Assigned: Gray, In Progress: Blue, Pending Review: Orange, Approved/Completed: Emerald, Changes Requested: Red
      let badgeClasses = "bg-secondary text-secondary-foreground"
      if (status === "Assigned") badgeClasses = "bg-neutral-800 text-neutral-300 border-neutral-700"
      if (status === "In Progress") badgeClasses = "bg-blue-500/10 text-blue-500 border-blue-500/20"
      if (status === "Pending Review") badgeClasses = "bg-orange-500/10 text-orange-500 border-orange-500/20"
      if (status === "Completed" || status === "Approved") badgeClasses = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      if (status === "Changes Requested") badgeClasses = "bg-red-500/10 text-red-500 border-red-500/20"
      
      return <Badge variant="outline" className={badgeClasses}>{status}</Badge>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const project = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border shadow-lg min-w-40">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(project.id.toString())}
              className="cursor-pointer"
            >
              Copy project ID
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="cursor-pointer">View details</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Edit project</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem 
              onClick={() => {
                window.open(`http://localhost:8000/api/v1/reports/generate/${project.id}`, '_blank');
              }}
              className="text-primary font-medium focus:text-primary focus:bg-primary/10 cursor-pointer"
            >
              Download DOCX Report
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
