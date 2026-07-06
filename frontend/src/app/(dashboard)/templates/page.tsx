"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, FileCode2, Copy, MoreHorizontal, ArrowRight } from "lucide-react"

const templates = [
    {
        id: 1,
        title: "Standard Web App Assessment",
        type: "Project Template",
        uses: 42,
        author: "System"
    },
    {
        id: 2,
        title: "Mobile App Android Security Audit",
        type: "Project Template",
        uses: 18,
        author: "System"
    },
    {
        id: 3,
        title: "Executive Summary - Minimal",
        type: "Report Template",
        uses: 156,
        author: "John Doe"
    },
    {
        id: 4,
        title: "Full Technical DOCX Export",
        type: "Report Template",
        uses: 89,
        author: "Alice Smith"
    },
    {
        id: 5,
        title: "Internal Infrastructure Audit",
        type: "Project Template",
        uses: 12,
        author: "System"
    },
    {
        id: 6,
        title: "Compliance Report (PCI-DSS)",
        type: "Report Template",
        uses: 34,
        author: "Compliance Team"
    }
]

export default function TemplatesPage() {
    return (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Templates</h2>
                    <p className="text-muted-foreground mt-1">
                        Manage project baselines and report export formats.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/50 p-3 rounded-xl border border-border/50 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search templates..."
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
                {templates.map((template) => (
                    <Card key={template.id} className="bg-card border-border/50 shadow-sm rounded-xl flex flex-col hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-4">
                            <div className="flex items-start justify-between mb-2">
                                <Badge variant="outline" className={template.type === "Project Template" ? "bg-blue-500/10 text-blue-500 border-blue-500/20 font-medium" : "bg-purple-500/10 text-purple-500 border-purple-500/20 font-medium"}>
                                    {template.type}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardTitle className="text-lg line-clamp-1">{template.title}</CardTitle>
                            <CardDescription className="text-muted-foreground font-medium">Created by {template.author}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <FileCode2 className="h-4 w-4" />
                                Used {template.uses} times
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 border-t border-border/50 bg-background/50 rounded-b-xl gap-3">
                            <Button 
                                className="flex-1 shadow-sm font-medium gap-2"
                                variant="outline"
                            >
                                <Copy className="h-4 w-4" /> Clone
                            </Button>
                            <Button className="flex-1 shadow-sm font-medium gap-2">
                                Use <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    )
}
