"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export type Project = {
  id: string
  name: string
  organization: string
  status: string
  assessmentType: string
  environment: string
  priority: string
  expectedStartDate: string
  expectedEndDate: string
  auditor: { id: string, name: string } | null
  reviewer: { id: string, name: string } | null
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
    accessorKey: "organization",
    header: () => <span className="text-muted-foreground font-medium">Organization</span>,
    cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue("organization")}</div>
    )
  },
  {
    accessorKey: "priority",
    header: () => <span className="text-muted-foreground font-medium">Priority</span>,
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      let badgeClasses = "bg-secondary text-secondary-foreground border-border"
      if (priority === "Critical") badgeClasses = "bg-red-500/10 text-red-500 border-red-500/20"
      if (priority === "High") badgeClasses = "bg-orange-500/10 text-orange-500 border-orange-500/20"
      if (priority === "Medium") badgeClasses = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      if (priority === "Low") badgeClasses = "bg-blue-500/10 text-blue-500 border-blue-500/20"
      return <Badge variant="outline" className={badgeClasses}>{priority}</Badge>
    }
  },
  {
    accessorKey: "status",
    header: () => <span className="text-muted-foreground font-medium">Status</span>,
    cell: ({ row }) => {
      const status = row.getValue("status") as string
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
    id: "team",
    header: () => <span className="text-muted-foreground font-medium">Team</span>,
    cell: ({ row }) => {
      const p = row.original
      return (
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <div><span className="font-medium text-foreground">A:</span> {p.auditor?.name || "Unassigned"}</div>
          <div><span className="font-medium text-foreground">R:</span> {p.reviewer?.name || "Unassigned"}</div>
        </div>
      )
    }
  },
  {
    id: "progress",
    header: () => <span className="text-muted-foreground font-medium">Progress</span>,
    cell: ({ row }) => {
      const p = row.original
      const percent = p.progress || 0
      
      // If it's Assigned, show -
      if (p.status === "Assigned") {
        return <span className="text-muted-foreground text-xs font-medium">Not Started</span>
      }

      return (
        <div className="flex flex-col gap-1 w-32">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">{percent}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div className={`h-full ${percent === 100 ? 'bg-emerald-500' : 'bg-primary'} transition-all`} style={{ width: `${percent}%` }} />
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "expectedEndDate",
    header: () => <span className="text-muted-foreground font-medium">Due Date</span>,
    cell: ({ row }) => {
      const date = row.getValue("expectedEndDate") as string
      return <div className="text-muted-foreground">{date ? format(new Date(date), "MMM d, yyyy") : "-"}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const project = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
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
            <Link href={`/projects/${project.id}`}>
              <DropdownMenuItem className="cursor-pointer">View details</DropdownMenuItem>
            </Link>
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
