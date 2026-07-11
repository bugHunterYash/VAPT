"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Edit2, CheckCircle2, AlertTriangle, Calendar, User, Shield } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UserCombobox } from "@/components/users/UserCombobox"

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  
  const [isEditingTeam, setIsEditingTeam] = useState(false)
  const [auditorId, setAuditorId] = useState("")
  const [reviewerId, setReviewerId] = useState("")

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

  if (loading) return <div className="p-8">Loading project details...</div>
  if (error) return <div className="p-8 text-destructive">{error}</div>
  if (!project) return <div className="p-8">Project not found</div>

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex items-center space-x-4 mb-4">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
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
    </div>
  )
}
