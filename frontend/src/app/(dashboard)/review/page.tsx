"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, CheckCircle2, XCircle, Clock, MessageSquare, AlertCircle, Sparkles } from "lucide-react"

const reviewQueue = [
    {
        id: 1,
        title: "SQL Injection in Login Parameter",
        project: "CorpNet API Penetration Test",
        author: "John Doe",
        submittedAt: "2 hours ago",
        severity: "Critical",
        aiAssisted: true,
    },
    {
        id: 2,
        title: "Insecure Direct Object Reference (IDOR)",
        project: "Main Web App Assessment",
        author: "Jane Smith",
        submittedAt: "5 hours ago",
        severity: "High",
        aiAssisted: false,
    },
    {
        id: 3,
        title: "Missing Security Headers",
        project: "Main Web App Assessment",
        author: "Jane Smith",
        submittedAt: "1 day ago",
        severity: "Low",
        aiAssisted: true,
    }
]

export default function ReviewQueuePage() {
    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Review Queue</h2>
                    <p className="text-muted-foreground mt-1">
                        Quality assurance for submitted findings before final report generation.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2 shadow-sm border-border">
                        <Clock className="h-4 w-4 text-muted-foreground" /> View History
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/50 p-3 rounded-xl border border-border/50 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search pending reviews..."
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

            <div className="flex flex-col gap-4">
                {reviewQueue.map((item) => (
                    <Card key={item.id} className="bg-card border-border/50 shadow-sm rounded-xl overflow-hidden hover:border-primary/50 transition-colors">
                        <CardContent className="p-0">
                            <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-semibold">{item.title}</h3>
                                        <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-medium">Pending Review</Badge>
                                        {item.aiAssisted && (
                                            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 py-0 text-[10px] gap-1 h-5 px-1.5">
                                                <Sparkles className="h-3 w-3" /> AI Assisted
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-destructive" />
                                            {item.severity}
                                        </span>
                                        <span className="text-border">•</span>
                                        <span className="font-medium text-foreground">{item.project}</span>
                                        <span className="text-border">•</span>
                                        <span>Submitted by {item.author}</span>
                                        <span className="text-border">•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {item.submittedAt}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-row md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0">
                                    <Button className="flex-1 gap-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-none">
                                        <CheckCircle2 className="h-4 w-4" /> Approve
                                    </Button>
                                    <Button variant="outline" className="flex-1 gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-500 border border-red-500/20 shadow-none">
                                        <XCircle className="h-4 w-4" /> Reject
                                    </Button>
                                    <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground">
                                        <MessageSquare className="h-4 w-4" /> Comment
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            {reviewQueue.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border/50 rounded-xl bg-card/30">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">You're all caught up!</h3>
                    <p className="text-muted-foreground">There are no findings waiting for your review.</p>
                </div>
            )}
        </div>
    )
}
