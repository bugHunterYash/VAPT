"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, CheckCircle2, Clock, ShieldAlert, ArrowRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function ReviewQueuePage() {
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        async function fetchProjects() {
            try {
                const res = await fetch('/api/projects')
                if (!res.ok) throw new Error('Failed to fetch')
                const data = await res.json()
                // Filter only Pending Review projects
                const pending = data.filter((p: any) => p.status === 'Pending Review')
                setProjects(pending)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchProjects()
    }, [])

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Review Queue</h2>
                    <p className="text-muted-foreground mt-1">
                        Quality assurance for submitted assessments before final report generation.
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

            {loading && <div className="text-center p-8">Loading queue...</div>}
            {error && <div className="text-center text-destructive p-8">{error}</div>}

            {!loading && !error && (
                <div className="flex flex-col gap-4">
                    {projects.map((project) => (
                        <Card key={project.id} className="bg-card border-border/50 shadow-sm rounded-xl overflow-hidden hover:border-primary/50 transition-colors">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold">{project.name}</h3>
                                            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 font-medium">Pending Review</Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5 font-medium text-foreground">
                                                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                                                {project.assessmentType}
                                            </span>
                                            <span className="text-border">•</span>
                                            <span className="font-medium text-foreground">{project.organization}</span>
                                            <span className="text-border">•</span>
                                            <span>Auditor: {project.auditor?.name || 'Unknown'}</span>
                                            <span className="text-border">•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {format(new Date(project.updatedAt), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-row md:flex-col gap-2 shrink-0 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0">
                                        <Link href={`/projects/${project.id}`}>
                                            <Button className="w-full gap-2 shadow-none">
                                                Review Assessment <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            
            {!loading && !error && projects.length === 0 && (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border/50 rounded-xl bg-card/30">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-1">You're all caught up!</h3>
                    <p className="text-muted-foreground">There are no assessments waiting for your review.</p>
                </div>
            )}
        </div>
    )
}
