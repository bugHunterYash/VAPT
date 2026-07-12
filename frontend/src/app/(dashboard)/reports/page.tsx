"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Clock, Search, Filter, RefreshCw, File, User, Eye, XCircle } from "lucide-react"
import { format } from "date-fns"
import { ReportPreviewModal } from "@/components/reports/ReportPreviewModal"
import Link from "next/link"

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [previewReport, setPreviewReport] = useState<any>(null)

  const fetchReports = async () => {
    try {
      const query = searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : ""
      const res = await fetch(`/api/reports${query}`)
      const data = await res.json()
      if (data.reports) {
        setReports(data.reports)
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
    
    // Poll every 5 seconds to update statuses
    const interval = setInterval(fetchReports, 5000)
    return () => clearInterval(interval)
  }, [searchQuery])

  const handleDownload = (id: string) => {
    window.open(`/api/reports/${id}/download`, '_blank')
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports Center</h2>
          <p className="text-muted-foreground mt-1">
            Generate, manage, and download vulnerability assessment reports.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/50 p-3 rounded-xl border border-border/50 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by project name..."
            className="w-full bg-background pl-9 border-border shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-2 bg-background shadow-sm border-border w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
      </div>

      {loading && reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-24 text-muted-foreground">
          <RefreshCw className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p>Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-24 text-center border-dashed border-2 bg-card/50">
          <FileText className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-bold mb-2">📄 No Reports Generated</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Reports will appear here once an approved project generates a report.
          </p>
          <Link href="/projects">
            <Button size="lg" variant="default">Go to Projects</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="bg-card border-border/50 shadow-sm rounded-xl flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border font-medium px-2 py-0.5">
                    {report.format}
                  </Badge>
                  {report.status === "Ready" ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Ready</Badge>
                  ) : report.status === "Failed" ? (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1.5 px-2">
                      <XCircle className="h-3 w-3" /> Failed
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1.5 px-2">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Generating
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-1">{report.project.name}</CardTitle>
                <CardDescription className="text-primary font-medium line-clamp-1">
                  Client: {report.project.organization}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4 shrink-0" />
                  <span className="truncate">By {report.generatedBy.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{format(new Date(report.createdAt), 'MMM d, yyyy • h:mm a')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span>Version {report.version}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border/50 bg-background/50 rounded-b-xl gap-3">
                <Button 
                  variant="default"
                  className="flex-1 shadow-sm font-medium gap-2" 
                  disabled={report.status !== "Ready"}
                  onClick={() => setPreviewReport(report)}
                >
                  <Eye className="h-4 w-4" /> Preview
                </Button>
                <Button 
                  variant="outline" 
                  className="px-3 border-border shadow-sm text-muted-foreground hover:text-foreground"
                  disabled={report.status !== "Ready"}
                  onClick={() => handleDownload(report.id)}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <ReportPreviewModal 
        isOpen={!!previewReport}
        onClose={() => setPreviewReport(null)}
        report={previewReport}
      />
    </div>
  )
}
