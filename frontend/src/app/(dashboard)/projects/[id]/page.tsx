"use client"

import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Plus, Settings } from "lucide-react"
import Link from "next/link"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"

const severityData = [
  { name: "Critical", value: 2, color: "#ef4444" },
  { name: "High", value: 5, color: "#f97316" },
  { name: "Medium", value: 12, color: "#eab308" },
  { name: "Low", value: 4, color: "#3b82f6" },
]

const trendData = [
  { date: "Oct 1", findings: 2 },
  { date: "Oct 5", findings: 5 },
  { date: "Oct 10", findings: 8 },
  { date: "Oct 15", findings: 14 },
  { date: "Oct 20", findings: 19 },
  { date: "Oct 25", findings: 23 },
]

export default function ProjectDetailsPage() {
  const params = useParams()
  const projectId = params.id

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Link href="/projects">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">In Progress</Badge>
                    <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border">API</Badge>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">CorpNet API Penetration Test</h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                    <span className="font-medium text-foreground">ACME Corporation</span>
                    <span className="text-border">•</span>
                    <span>Started: Oct 1, 2026</span>
                    <span className="text-border">•</span>
                    <span>Due: Oct 31, 2026</span>
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-2 shadow-sm bg-card border-border">
                    <Download className="h-4 w-4 text-muted-foreground" /> Export
                </Button>
                <Button className="gap-2 shadow-sm font-medium">
                    <Plus className="h-4 w-4" /> Add Finding
                </Button>
            </div>
        </div>

        {/* Tabs Workspace */}
        <Tabs defaultValue="overview" className="w-full">
            <div className="border-b border-border mb-6 overflow-x-auto">
                <TabsList className="bg-transparent h-auto p-0 flex gap-6 justify-start w-max">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 data-[state=active]:shadow-none font-medium data-[state=active]:text-foreground text-muted-foreground">Overview</TabsTrigger>
                    <TabsTrigger value="findings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 data-[state=active]:shadow-none font-medium data-[state=active]:text-foreground text-muted-foreground">Findings (23)</TabsTrigger>
                    <TabsTrigger value="evidence" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 data-[state=active]:shadow-none font-medium data-[state=active]:text-foreground text-muted-foreground">Evidence</TabsTrigger>
                    <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 data-[state=active]:shadow-none font-medium data-[state=active]:text-foreground text-muted-foreground">Timeline</TabsTrigger>
                    <TabsTrigger value="review" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 data-[state=active]:shadow-none font-medium data-[state=active]:text-foreground text-muted-foreground">Review</TabsTrigger>
                    <TabsTrigger value="reports" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-1 py-3 data-[state=active]:shadow-none font-medium data-[state=active]:text-foreground text-muted-foreground">Reports</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="overview" className="mt-0 outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <Card className="bg-card border-border/50 shadow-sm rounded-xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Project Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 text-sm">
                                    <div className="col-span-2">
                                        <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Target URL / IP</div>
                                        <div className="font-medium text-foreground">api.corpnet.internal</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Environment</div>
                                        <div className="font-medium text-foreground">Staging</div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Assigned Auditor</div>
                                        <div className="font-medium text-foreground flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-primary/20 text-xs flex items-center justify-center text-primary border border-primary/30">JD</div>
                                            John Doe
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-muted-foreground mb-1 text-xs uppercase tracking-wider font-semibold">Assigned Reviewer</div>
                                        <div className="font-medium text-foreground flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-orange-500/20 text-xs flex items-center justify-center text-orange-500 border border-orange-500/30">AS</div>
                                            Alice Smith
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-card border-border/50 shadow-sm rounded-xl">
                                <CardHeader>
                                    <CardTitle className="text-lg">Severity Distribution</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px] flex flex-col items-center justify-center pb-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={severityData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {severityData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#111111', borderColor: '#202020', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-border/50 shadow-sm rounded-xl">
                                <CardHeader>
                                    <CardTitle className="text-lg">Finding Trends</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[250px] pb-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#111111', borderColor: '#202020', borderRadius: '8px' }}
                                                cursor={{ fill: '#1a1a1a' }}
                                            />
                                            <Bar dataKey="findings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column - Activity */}
                    <div className="flex flex-col gap-6">
                        <Card className="bg-card border-border/50 shadow-sm rounded-xl">
                            <CardHeader>
                                <CardTitle className="text-lg">Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-end justify-between mb-3">
                                    <span className="text-3xl font-bold tracking-tight">45%</span>
                                    <span className="text-sm text-muted-foreground mb-1">14 days left</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `45%` }} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border/50 shadow-sm flex-1 rounded-xl">
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-card" />
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-medium">Finding added: SQL Injection</p>
                                            <p className="text-xs text-muted-foreground">John Doe • 2 hours ago</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="mt-1.5 h-2 w-2 rounded-full bg-orange-500 ring-4 ring-card" />
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-medium">Review requested</p>
                                            <p className="text-xs text-muted-foreground">John Doe • Yesterday</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-card" />
                                        <div className="flex flex-col gap-1">
                                            <p className="text-sm font-medium">Project started</p>
                                            <p className="text-xs text-muted-foreground">Alice Smith • Oct 1, 2026</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="findings" className="mt-0 outline-none">
                <Card className="bg-card border-border/50 shadow-sm p-12 flex flex-col items-center justify-center text-center rounded-xl">
                    <h3 className="text-lg font-semibold mb-2">Findings View</h3>
                    <p className="text-muted-foreground max-w-sm">The detailed findings table will be rendered here.</p>
                </Card>
            </TabsContent>
            
            <TabsContent value="reports" className="mt-0 outline-none">
                <Card className="bg-card border-border/50 shadow-sm p-12 flex flex-col items-center justify-center text-center rounded-xl">
                    <h3 className="text-lg font-semibold mb-2">Reports View</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">Manage generated reports and exports.</p>
                    <Button onClick={() => window.open(`http://localhost:8000/api/v1/reports/generate/${projectId}`, '_blank')}>Generate Docx Report</Button>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  )
}
