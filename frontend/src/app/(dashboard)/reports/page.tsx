"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Clock, Search, Filter, RefreshCw, File } from "lucide-react"

const reports = [
    {
        id: 1,
        project: "CorpNet API Penetration Test",
        type: "Executive Summary",
        date: "Oct 25, 2026",
        status: "Ready",
        format: "DOCX"
    },
    {
        id: 2,
        project: "CorpNet API Penetration Test",
        type: "Full Technical Report",
        date: "Oct 25, 2026",
        status: "Generating",
        format: "PDF"
    },
    {
        id: 3,
        project: "Main Web App Assessment",
        type: "Full Technical Report",
        date: "Oct 18, 2026",
        status: "Ready",
        format: "DOCX"
    },
    {
        id: 4,
        project: "Mobile App Android Security Audit",
        type: "Compliance Report (PCI-DSS)",
        date: "Oct 10, 2026",
        status: "Ready",
        format: "PDF"
    }
]

export default function ReportsPage() {
    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
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
                        placeholder="Search reports..."
                        className="w-full bg-background pl-9 border-border shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="gap-2 bg-background shadow-sm border-border w-full sm:w-auto">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="hidden sm:inline">Filters</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {reports.map((report) => (
                    <Card key={report.id} className="bg-card border-border/50 shadow-sm rounded-xl flex flex-col hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between mb-2">
                                <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border font-medium">
                                    {report.format}
                                </Badge>
                                {report.status === "Ready" ? (
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Ready</Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1.5 px-2">
                                        <RefreshCw className="h-3 w-3 animate-spin" /> Generating
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-lg line-clamp-1">{report.project}</CardTitle>
                            <CardDescription className="text-primary font-medium">{report.type}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                Generated on {report.date}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 border-t border-border/50 bg-background/50 rounded-b-xl gap-3">
                            <Button 
                                className="flex-1 shadow-sm font-medium" 
                                disabled={report.status !== "Ready"}
                                onClick={() => {
                                    if (report.status === "Ready") {
                                        window.open(`http://localhost:8000/api/v1/reports/generate/${report.id}`, '_blank');
                                    }
                                }}
                            >
                                <Download className="h-4 w-4 mr-2" /> Download
                            </Button>
                            <Button variant="outline" className="px-3 border-border shadow-sm text-muted-foreground hover:text-foreground">
                                <File className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
