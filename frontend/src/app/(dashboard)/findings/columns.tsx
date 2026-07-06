"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown, Sparkles } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Finding = {
  id: number
  title: string
  project_id: number
  severity: string
  category: string
  status: string
  owasp?: string
  cwe?: string
  cvss?: number
  evidence_count?: number
  ai_generated?: boolean
}

export const columns: ColumnDef<Finding>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-4 hover:bg-transparent hover:text-primary text-muted-foreground font-medium"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Finding Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
        const finding = row.original
        return (
            <div className="flex items-center gap-2">
                <div className="font-semibold">{finding.title}</div>
                {finding.ai_generated && (
                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 py-0 text-[10px] gap-1 h-5 px-1.5">
                        <Sparkles className="h-3 w-3" /> AI
                    </Badge>
                )}
            </div>
        )
    }
  },
  {
    accessorKey: "severity",
    header: () => <span className="text-muted-foreground font-medium">Severity</span>,
    cell: ({ row }) => {
      const severity = row.getValue("severity") as string
      let badgeClasses = "bg-secondary text-secondary-foreground"
      if (severity === "Critical") badgeClasses = "bg-destructive/10 text-destructive border-destructive/20"
      if (severity === "High") badgeClasses = "bg-orange-500/10 text-orange-500 border-orange-500/20"
      if (severity === "Medium") badgeClasses = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      if (severity === "Low") badgeClasses = "bg-blue-500/10 text-blue-500 border-blue-500/20"
      if (severity === "Info") badgeClasses = "bg-slate-500/10 text-slate-400 border-slate-500/20"
      
      return <Badge variant="outline" className={badgeClasses}>{severity}</Badge>
    },
  },
  {
    accessorKey: "cvss",
    header: () => <span className="text-muted-foreground font-medium">CVSS</span>,
    cell: ({ row }) => {
        const cvss = row.getValue("cvss") as number
        if (!cvss) return <span className="text-muted-foreground">-</span>
        return <div className="font-mono text-sm">{cvss.toFixed(1)}</div>
    }
  },
  {
    accessorKey: "category",
    header: () => <span className="text-muted-foreground font-medium">Category</span>,
  },
  {
    accessorKey: "status",
    header: () => <span className="text-muted-foreground font-medium">Status</span>,
    cell: ({ row }) => {
        const status = row.getValue("status") as string
        let badgeClasses = "bg-secondary text-secondary-foreground"
        if (status === "Open") badgeClasses = "bg-red-500/10 text-red-500 border-red-500/20"
        if (status === "Fixed") badgeClasses = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        if (status === "Risk Accepted") badgeClasses = "bg-orange-500/10 text-orange-500 border-orange-500/20"
        return <Badge variant="outline" className={badgeClasses}>{status}</Badge>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const finding = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border shadow-lg min-w-40">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(finding.id.toString())}
              className="cursor-pointer"
            >
              Copy finding ID
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="cursor-pointer font-medium text-primary">Quick Preview</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Edit Finding</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
