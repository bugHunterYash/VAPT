"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, AreaChart, Area, CartesianGrid } from "recharts"
import { ShieldAlert, Bug, Target, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

const severityData = [
  { name: "Critical", value: 45, color: "#ef4444" },
  { name: "High", value: 120, color: "#f97316" },
  { name: "Medium", value: 350, color: "#eab308" },
  { name: "Low", value: 180, color: "#3b82f6" },
]

const monthlyTrends = [
  { month: "Jan", critical: 4, high: 12, medium: 35 },
  { month: "Feb", critical: 7, high: 15, medium: 28 },
  { month: "Mar", critical: 2, high: 22, medium: 41 },
  { month: "Apr", critical: 5, high: 18, medium: 33 },
  { month: "May", critical: 9, high: 25, medium: 48 },
  { month: "Jun", critical: 3, high: 14, medium: 29 },
]

const categoryData = [
  { name: "Injection", value: 120 },
  { name: "Broken Auth", value: 85 },
  { name: "Sensitive Data", value: 65 },
  { name: "XXE", value: 30 },
  { name: "Broken Access", value: 140 },
  { name: "Misconfig", value: 210 },
]

function StatCard({ title, value, icon: Icon, trend, isPositive }: { title: string, value: string, icon: any, trend: string, isPositive: boolean }) {
    return (
        <Card className="bg-card border-border/50 shadow-sm rounded-xl">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
                        {isPositive ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        {trend}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-3xl font-bold tracking-tight">{value}</span>
                    <span className="text-sm font-medium text-muted-foreground">{title}</span>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AnalyticsPage() {
    return (
        <div className="flex flex-col gap-8 max-w-[1400px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Platform Analytics</h2>
                    <p className="text-muted-foreground mt-1">
                        Enterprise vulnerability trends and security posture metrics.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="shadow-sm border-border">Export PDF</Button>
                    <Button className="shadow-sm">Generate Custom Report</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Vulnerabilities" value="2,482" icon={Bug} trend="12.5%" isPositive={false} />
                <StatCard title="Critical Risk Assets" value="14" icon={ShieldAlert} trend="4.2%" isPositive={true} />
                <StatCard title="Assessments Completed" value="86" icon={Target} trend="18.1%" isPositive={true} />
                <StatCard title="Avg. Time to Remediate" value="18 Days" icon={Activity} trend="2.5 days" isPositive={true} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-card border-border/50 shadow-sm rounded-xl lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Vulnerability Discovery Trends</CardTitle>
                        <CardDescription>Monthly breakdown of findings by severity.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#202020" vertical={false} />
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111111', borderColor: '#202020', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="critical" stroke="#ef4444" fillOpacity={1} fill="url(#colorCrit)" />
                                <Area type="monotone" dataKey="high" stroke="#f97316" fillOpacity={1} fill="url(#colorHigh)" />
                                <Area type="monotone" dataKey="medium" stroke="#eab308" fillOpacity={0} strokeDasharray="5 5" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border/50 shadow-sm rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Global Severity</CardTitle>
                        <CardDescription>Current open findings by severity.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px] flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={severityData}
                                    innerRadius={70}
                                    outerRadius={100}
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
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="bg-card border-border/50 shadow-sm rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Top Vulnerability Categories (OWASP Top 10)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#202020" horizontal={false} />
                                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#111111', borderColor: '#202020', borderRadius: '8px' }}
                                    cursor={{ fill: '#1a1a1a' }}
                                />
                                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
