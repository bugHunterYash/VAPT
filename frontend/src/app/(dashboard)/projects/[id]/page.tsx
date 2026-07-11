"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit2, CheckCircle2, AlertTriangle, Calendar, User, Shield, PlayCircle, FileText, FileType, Sheet, Archive, ChevronDown, Loader2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserCombobox } from "@/components/users/UserCombobox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectChecklist } from "@/components/projects/ProjectChecklist"
import { ReportHistory } from "@/components/projects/ReportHistory"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const [isEditingTeam, setIsEditingTeam] = useState(false)
  const [auditorId, setAuditorId] = useState("")
  const [reviewerId, setReviewerId] = useState("")

  const [startingAssessment, setStartingAssessment] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [params.id])

  async function fetchProject() {
    try {
      const res = await fetch(`/api/projects/${params.id}`)
      if (!res.ok) throw new Error("Failed to fetch project")
      const data = await res.json()
      setProject(data)
      setAuditorId(data.auditorId)
      setReviewerId(data.reviewerId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateTeam() {
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditorId, reviewerId })
      })
      if (!res.ok) throw new Error("Failed to update assignments")
      setIsEditingTeam(false)
      fetchProject()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function startAssessment() {
    if (!confirm('Starting this assessment will load the mandatory Testing Checklist. Continue?')) return
    
    setStartingAssessment(true)
    try {
      const res = await fetch(`/api/projects/${params.id}/start`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to start assessment")
      }
      fetchProject()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setStartingAssessment(false)
    }
  }

  async function handleGenerate(format: 'PDF' | 'DOCX' | 'EXCEL') {
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/projects/${params.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to generate report')
      }
      
      // Successfully generated
      fetchProject() // Refresh so Report History tab updates
      alert(`Successfully generated ${format} report! Check the Reports tab.`)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) return <div className="p-8">Loading project details...</div>
  if (error) return <div className="p-8 text-destructive">{error}</div>
  if (!project) return <div className="p-8">Project not found</div>

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/projects">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">{project.name}</h2>
              <Badge variant="outline">{project.status}</Badge>
              {project.priority === 'Critical' && <Badge variant="destructive">Critical Priority</Badge>}
            </div>
            <p className="text-muted-foreground mt-1">
              {project.organization} {project.applicationName ? `• ${project.applicationName}` : ''}
            </p>
          </div>
        </div>

        {project.status === 'Assigned' && (
          <Button onClick={startAssessment} disabled={startingAssessment} size="lg" className="gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
            <PlayCircle className="w-5 h-5" /> Start Assessment
          </Button>
        )}

        {project.status !== 'Approved' ? (
          <div title="Report generation is available only after reviewer approval.">
            <Button size="lg" className="gap-2 font-bold opacity-50 cursor-not-allowed">
              Generate Report <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="lg" disabled={isGenerating} className="gap-2 font-bold bg-indigo-600 text-white hover:bg-indigo-700">
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating Report...</>
                ) : (
                  <>Generate Report <ChevronDown className="h-4 w-4" /></>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onClick={() => handleGenerate('PDF')} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2 text-red-500" /> Generate PDF Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerate('DOCX')} className="cursor-pointer">
                <FileType className="h-4 w-4 mr-2 text-blue-500" /> Generate DOCX Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleGenerate('EXCEL')} className="cursor-pointer">
                <Sheet className="h-4 w-4 mr-2 text-green-500" /> Generate Excel Report
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Archive className="h-4 w-4 mr-2 text-gray-500" /> Export Complete Package (.zip)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 h-12">
          <TabsTrigger value="overview" className="h-10 px-6">Overview</TabsTrigger>
          <TabsTrigger value="checklist" className="h-10 px-6">Assessment Checklist</TabsTrigger>
          <TabsTrigger value="findings" className="h-10 px-6">Findings</TabsTrigger>
          <TabsTrigger value="reports" className="h-10 px-6">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" /> Scope & Target
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assessment Type</p>
                    <p className="font-semibold mt-1">{project.assessmentType}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Environment</p>
                    <p className="font-semibold mt-1">{project.environment}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target URL</p>
                    <p className="font-semibold mt-1 truncate">
                      <a href={project.targetUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                        {project.targetUrl}
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Target IP</p>
                    <p className="font-semibold mt-1">{project.targetIp || "N/A"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" /> Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expected Start</p>
                    <p className="font-semibold mt-1">{format(new Date(project.expectedStartDate), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expected End (Due)</p>
                    <p className="font-semibold mt-1">{format(new Date(project.expectedEndDate), 'PPP')}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Activity Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {project.activities?.map((activity: any) => (
                      <div key={activity.id} className="flex gap-4">
                        <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                        <div>
                          <p className="text-sm">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            by {activity.user?.name} on {format(new Date(activity.createdAt), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {project.activities?.length === 0 && (
                      <p className="text-sm text-muted-foreground">No activity yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row justify-between items-center space-y-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Team
                  </CardTitle>
                  {!isEditingTeam ? (
                    <Button variant="ghost" size="icon" onClick={() => setIsEditingTeam(true)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditingTeam ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Auditor</label>
                        <UserCombobox role="AUDITOR" value={auditorId} onChange={setAuditorId} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Reviewer</label>
                        <UserCombobox role="REVIEWER" value={reviewerId} onChange={setReviewerId} />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={updateTeam} size="sm" className="w-full">Save Changes</Button>
                        <Button variant="outline" size="sm" onClick={() => setIsEditingTeam(false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Assigned Auditor</p>
                        <p className="font-semibold mt-1">{project.auditor?.name || "Unassigned"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Assigned Reviewer</p>
                        <p className="font-semibold mt-1">{project.reviewer?.name || "Unassigned"}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created By</p>
                    <p className="font-semibold mt-1">{project.creator?.name || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created At</p>
                    <p className="font-semibold mt-1">{format(new Date(project.createdAt), 'PPP')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="mt-4">
          {project.status === 'Assigned' ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <Shield className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-bold mb-2">Assessment Not Started</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Click the "Start Assessment" button to dynamically load the {project.assessmentType} checklist template and begin your security audit.
              </p>
              <Button onClick={startAssessment} disabled={startingAssessment} size="lg" className="gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                <PlayCircle className="w-5 h-5" /> Start Assessment
              </Button>
            </Card>
          ) : (
            <ProjectChecklist project={project} onRefresh={fetchProject} />
          )}
        </TabsContent>

        <TabsContent value="findings" className="mt-4">
          <Card className="p-12 text-center text-muted-foreground border-dashed">
            Findings module coming soon...
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <ReportHistory projectId={project.id} isAdmin={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
