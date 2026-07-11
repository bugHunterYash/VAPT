'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, Plus } from 'lucide-react'
import { FindingModal } from './FindingModal'

export function ProjectChecklist({ project, onRefresh }: { project: any, onRefresh: () => void }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [findingModalItem, setFindingModalItem] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if(data.user) setCurrentUser(data.user)
    })
  }, [])

  const checklists = project.checklists || []
  const latestSnapshot = project.assessmentSnapshots?.[0]
  const isRejected = project.status === 'Rejected'

  // Group by category
  const categoriesMap = new Map<string, any[]>()
  checklists.forEach((item: any) => {
    if (!categoriesMap.has(item.categoryName)) {
      categoriesMap.set(item.categoryName, [])
    }
    categoriesMap.get(item.categoryName)!.push(item)
  })

  const total = checklists.length
  const completed = checklists.filter((c: any) => c.result !== 'Not Started').length
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100)
  
  const issuesWithoutFindings = checklists.filter((c: any) => c.result === 'Issues' && !c.findingId)
  const canSubmit = total > 0 && completed === total && issuesWithoutFindings.length === 0

  // The checklist should be locked if the project is not in progress or rejected
  // OR if we are explicitly in preview mode
  const isLocked = isPreviewMode || (project.status !== 'Assessment In Progress' && project.status !== 'Rejected')

  async function updateItem(itemId: string, updates: any) {
    if (isLocked) return
    setUpdatingId(itemId)
    try {
      const res = await fetch(`/api/projects/${project.id}/checklist/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!res.ok) throw new Error('Failed to update')
      onRefresh()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function submitAssessment() {
    if (!confirm('Are you sure you want to submit this assessment? The checklist will be locked.')) return
    try {
      const res = await fetch(`/api/projects/${project.id}/submit`, {
        method: 'POST'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }
      setIsPreviewMode(false)
      onRefresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  async function submitReview(action: 'Approve' | 'Reject') {
    const comments = prompt(`Enter mandatory comments for ${action}:`)
    if (comments === null) return // cancelled
    if (action === 'Reject' && !comments.trim()) {
      alert('Comments are mandatory for rejection.')
      return
    }
    
    try {
      const res = await fetch(`/api/projects/${project.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comments })
      })
      if (!res.ok) throw new Error('Failed to submit review')
      onRefresh()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="space-y-6">
      
      {isRejected && latestSnapshot?.reviewerComments && (
        <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-lg">
          <div className="flex items-center gap-2 text-destructive font-bold mb-2">
            <AlertTriangle className="h-5 w-5" /> Project Rejected
          </div>
          <p className="text-sm text-destructive font-semibold mb-1">Reviewer Comments:</p>
          <div className="text-sm whitespace-pre-wrap text-destructive/90 bg-destructive/5 p-3 rounded border border-destructive/10">
            {latestSnapshot.reviewerComments}
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic">Please fix the requested items and resubmit the assessment.</p>
        </div>
      )}

      {isPreviewMode && (
        <div className="bg-primary/10 border border-primary p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold">
            <CheckCircle2 className="h-5 w-5" /> Assessment Preview Mode
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
              Back to Edit
            </Button>
            <Button onClick={submitAssessment} disabled={!canSubmit}>
              Confirm & Submit Assessment
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-muted/20 p-4 rounded-lg border">
        <div>
          <h3 className="text-xl font-bold">Assessment Checklist</h3>
          <p className="text-muted-foreground">{completed} / {total} Completed</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-48 bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-primary h-full transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="font-bold">{progressPercent}%</span>
          
          {!isPreviewMode && (project.status === 'Assessment In Progress' || project.status === 'Rejected') && currentUser?.id === project.auditorId && (
            <Button onClick={() => setIsPreviewMode(true)} disabled={!canSubmit} className="ml-4" variant="outline">
              Preview Assessment
            </Button>
          )}

          {project.status === 'Pending Review' && currentUser?.id === project.reviewerId && (
            <div className="flex gap-2 ml-4">
              <Button onClick={() => submitReview('Reject')} variant="destructive">Reject</Button>
              <Button onClick={() => submitReview('Approve')} className="bg-emerald-600 hover:bg-emerald-700 text-white">Approve</Button>
            </div>
          )}
          {project.status === 'Pending Review' && currentUser?.id !== project.reviewerId && (
            <span className="ml-4 font-semibold text-amber-500">Pending Review by Reviewer</span>
          )}
          {project.status === 'Approved' && (
            <span className="ml-4 font-semibold text-emerald-500">Approved</span>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {Array.from(categoriesMap.keys()).map((categoryName) => {
          const items = categoriesMap.get(categoryName)!
          const catCompleted = items.filter((c: any) => c.result !== 'Not Started').length
          const catTotal = items.length

          return (
            <Card key={categoryName}>
              <CardHeader className="bg-muted/30 pb-3 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{categoryName}</CardTitle>
                  <span className="text-sm font-medium text-muted-foreground">{catCompleted} / {catTotal}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/50">
                {items.map((item) => (
                  <div key={item.id} className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-1 flex items-start pt-1">
                      {item.result === 'Not Started' ? (
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                      ) : item.result === 'Pass' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : item.result === 'Issues' ? (
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-neutral-500 bg-neutral-500/20" />
                      )}
                    </div>
                    
                    <div className="lg:col-span-5 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{item.code}</Badge>
                        <span className="font-semibold text-sm">{item.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                      {item.tools && <p className="text-[10px] text-muted-foreground/70 uppercase">Tools: {item.tools}</p>}
                    </div>

                    <div className="lg:col-span-2">
                      <select 
                        value={item.result}
                        onChange={(e) => updateItem(item.id, { result: e.target.value })}
                        disabled={updatingId === item.id || isLocked}
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="Pass">Pass</option>
                        <option value="Issues">Issues</option>
                        <option value="N/A">N/A</option>
                      </select>

                      {item.result === 'Issues' && (
                        <div className="mt-3">
                          {item.findingId ? (
                            <Badge variant="default" className="w-full justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20">
                              Finding Linked
                            </Badge>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full gap-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                              disabled={isLocked}
                              onClick={() => setFindingModalItem(item)}
                            >
                              <Plus className="w-3 h-3" /> Create Finding
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-4">
                      <textarea 
                        value={item.remark || ''}
                        onChange={(e) => updateItem(item.id, { remark: e.target.value })}
                        disabled={isLocked}
                        placeholder="Add remarks or evidence link..."
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {findingModalItem && (
        <FindingModal
          isOpen={true}
          onClose={() => setFindingModalItem(null)}
          projectId={project.id}
          checklistId={findingModalItem.id}
          defaultCode={findingModalItem.code}
          defaultTitle={findingModalItem.title}
          onSaved={() => {
            setFindingModalItem(null)
            onRefresh()
          }}
        />
      )}
    </div>
  )
}

