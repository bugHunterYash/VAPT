'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UserCombobox } from "@/components/users/UserCombobox"
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Activity, CheckCircle, Clock, AlertTriangle, ShieldAlert, BarChart3, TrendingUp, Waves, CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

export function AssessmentAnalytics() {
  const [timePeriod, setTimePeriod] = useState("This Year")
  const [auditorId, setAuditorId] = useState("all")
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("area")
  const [date, setDate] = useState<DateRange | undefined>(undefined)
  
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (timePeriod === "Custom Date Range" && (!date?.from || !date?.to)) {
      // Don't fetch until full range is selected
      return
    }

    setLoading(true)
    let url = `/api/dashboard/analytics?timePeriod=${encodeURIComponent(timePeriod)}&auditorId=${auditorId}`
    if (timePeriod === "Custom Date Range" && date?.from && date?.to) {
      url += `&startDate=${date.from.toISOString()}&endDate=${date.to.toISOString()}`
    }

    fetch(url)
      .then(res => res.json())
      .then(json => {
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [timePeriod, auditorId, date])

  return (
    <Card className="col-span-full border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Assessment Analytics
            </CardTitle>
            <CardDescription>
              Comprehensive overview of projects, reports, and findings.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-40"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
            >
              <option value="This Month">This Month</option>
              <option value="Last Month">Last Month</option>
              <option value="Last 3 Months">Last 3 Months</option>
              <option value="Last 6 Months">Last 6 Months</option>
              <option value="This Year">This Year</option>
              <option value="Custom Date Range">Custom Date Range</option>
            </select>
            
            {timePeriod === "Custom Date Range" && (
              <Popover>
                <PopoverTrigger
                  className={cn(
                    "flex h-10 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring w-64",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}

            <div className="w-56">
              <UserCombobox 
                role="AUDITOR" 
                value={auditorId === 'all' ? '' : auditorId} 
                onChange={(val) => setAuditorId(val || 'all')} 
              />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading || !data ? (
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            Loading analytics...
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border/50">
            
            {/* Stats Sidebar */}
            <div className="lg:w-1/3 xl:w-1/4 p-6 bg-muted/10 flex flex-col gap-8">
              
              <div className="space-y-4">
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Project Activity</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-foreground">{data.projects.assigned}</p>
                    <p className="text-xs text-muted-foreground">Assigned</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-blue-500">{data.projects.inProgress}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-emerald-500">{data.projects.completed}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">Completed <CheckCircle className="h-3 w-3"/></p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-orange-500">{data.projects.pendingReview}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">In Review <Clock className="h-3 w-3"/></p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm font-medium">Average Completion Time</p>
                  <p className="text-xl font-bold mt-1 text-primary">{data.projects.averageCompletionDays} <span className="text-sm font-normal text-muted-foreground">days</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center justify-between">
                  Findings Overview
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{data.findings.total}</span>
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-500" /> Critical</span>
                    <span className="font-bold">{data.findings.critical}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" /> High</span>
                    <span className="font-bold">{data.findings.high}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-yellow-500 mx-0.5" /> Medium</span>
                    <span className="font-bold">{data.findings.medium}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-blue-500 mx-0.5" /> Low</span>
                    <span className="font-bold">{data.findings.low}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-neutral-500 mx-0.5" /> Informative</span>
                    <span className="font-bold">{data.findings.informative}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Chart Area */}
            <div className="lg:w-2/3 xl:w-3/4 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Monthly Trend</h3>
                <div className="flex items-center bg-muted/50 p-1 rounded-md border border-border/50">
                  <button 
                    onClick={() => setChartType("bar")} 
                    className={`p-1.5 rounded-sm transition-colors ${chartType === 'bar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setChartType("line")} 
                    className={`p-1.5 rounded-sm transition-colors ${chartType === 'line' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <TrendingUp className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setChartType("area")} 
                    className={`p-1.5 rounded-sm transition-colors ${chartType === 'area' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Waves className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                        itemStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                      <Bar dataKey="projects" name="Projects" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32} />
                      <Bar dataKey="findings" name="Findings" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={32} />
                    </BarChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                      <Line type="monotone" dataKey="projects" name="Projects" stroke="hsl(var(--primary))" strokeWidth={3} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="findings" name="Findings" stroke="hsl(var(--destructive))" strokeWidth={3} activeDot={{ r: 6 }} />
                    </LineChart>
                  ) : (
                    <AreaChart data={data.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorFindings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                      <Area type="monotone" dataKey="projects" name="Projects" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorProjects)" strokeWidth={2} />
                      <Area type="monotone" dataKey="findings" name="Findings" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorFindings)" strokeWidth={2} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
