'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import { format } from 'date-fns'
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Download, 
  Check, 
  X, 
  MessageSquare,
  FileText,
  Shield,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export function PreviewAssessmentModal({
  isOpen,
  onClose,
  project,
  checklists,
  currentUser,
  onRefresh
}: {
  isOpen: boolean
  onClose: () => void
  project: any
  checklists: any[]
  currentUser: any
  onRefresh: () => void
}) {
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // Action modal state
  const [actionModal, setActionModal] = useState<'submit' | 'approve' | 'reject' | null>(null)
  const [actionComments, setActionComments] = useState('')

  const isReviewer = currentUser?.id === project?.reviewerId
  const isAuditor = currentUser?.id === project?.auditorId
  const status = project?.status || 'Unknown'

  // Calculate stats
  const total = checklists.length
  const passCount = checklists.filter(c => c.result === 'Pass').length
  const issuesCount = checklists.filter(c => c.result === 'Issues').length
  const naCount = checklists.filter(c => c.result === 'N/A').length
  const notStartedCount = checklists.filter(c => c.result === 'Not Started').length
  const completedCount = total - notStartedCount
  const progressPercent = total === 0 ? 0 : Math.round((completedCount / total) * 100)

  // Group by category
  const categoriesMap = new Map<string, any[]>()
  checklists.forEach((item: any) => {
    if (!categoriesMap.has(item.categoryName)) {
      categoriesMap.set(item.categoryName, [])
    }
    categoriesMap.get(item.categoryName)!.push(item)
  })

  useEffect(() => {
    if (categoriesMap.size > 0 && !activeCategory) {
      setActiveCategory(Array.from(categoriesMap.keys())[0])
    }
  }, [checklists, activeCategory])

  const scrollToCategory = (catName: string) => {
    setActiveCategory(catName)
    const el = document.getElementById(`cat-${catName.replace(/\s+/g, '-')}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleGenerate = async (formatType: 'PDF' | 'DOCX' | 'EXCEL') => {
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: formatType })
      })
      if (!res.ok) throw new Error('Failed to generate report')
      toast.success(`Successfully generated ${formatType} report!`)
      onRefresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAction = async (action: 'submit' | 'approve' | 'reject') => {
    setActionModal(action)
    setActionComments('')
  }

  const confirmAction = async () => {
    if (!actionModal) return

    if (actionModal === 'reject' && !actionComments.trim()) {
      toast.error('Comments are mandatory for rejection.')
      return
    }

    setIsSubmitting(true)
    try {
      if (actionModal === 'submit') {
        const res = await fetch(`/api/projects/${project.id}/submit`, { method: 'POST' })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to submit')
        }
        toast.success('Assessment submitted for review')
      } else {
        const res = await fetch(`/api/projects/${project.id}/review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: actionModal === 'approve' ? 'Approve' : 'Reject', comments: actionComments })
        })
        if (!res.ok) throw new Error('Failed to submit review')
        toast.success(`Assessment ${actionModal}d successfully.`)
      }
      
      onRefresh()
      setActionModal(null)
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = total > 0 && completedCount === total && checklists.filter(c => c.result === 'Issues' && !c.findingId).length === 0

  if (!project) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1600px] !w-[95vw] h-[95vh] p-0 overflow-hidden flex flex-col bg-background border-border shadow-2xl">
        <DialogHeader className="p-6 border-b border-border/50 bg-card shrink-0 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-bold flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                {project.name}
              </DialogTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 font-medium">
                <span className="flex gap-1.5 items-center"><strong className="text-foreground">Client:</strong> {project.organization}</span>
                <span className="flex gap-1.5 items-center"><strong className="text-foreground">Type:</strong> {project.assessmentType}</span>
                <span className="flex gap-1.5 items-center"><strong className="text-foreground">Auditor:</strong> {project.auditor?.name || 'Unassigned'}</span>
                <span className="flex gap-1.5 items-center"><strong className="text-foreground">Reviewer:</strong> {project.reviewer?.name || 'Unassigned'}</span>
                <span className="flex gap-1.5 items-center"><strong className="text-foreground">Date:</strong> {format(new Date(project.createdAt), 'MMM d, yyyy')}</span>
                <Badge variant="outline" className="ml-2 font-semibold shadow-sm">{status}</Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose} className="shadow-sm">
                Back to Edit
              </Button>
              {status === 'Approved' && (
                <Button variant="secondary" onClick={() => handleGenerate('PDF')} disabled={isGenerating} className="shadow-sm">
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Download PDF
                </Button>
              )}
              {status === 'Assessment In Progress' && isAuditor && (
                <Button onClick={() => handleAction('submit')} disabled={!canSubmit || isSubmitting} className="shadow-sm bg-primary hover:bg-primary/90">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit Assessment
                </Button>
              )}
              {status === 'Pending Review' && isReviewer && (
                <>
                  <Button variant="destructive" onClick={() => handleAction('reject')} disabled={isSubmitting} className="shadow-sm">
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={() => handleAction('approve')} disabled={isSubmitting}>
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-5 gap-4 mt-6">
            <Card className="bg-card shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Overall Completion</span>
                <span className="text-3xl font-bold mt-1 text-primary">{progressPercent}%</span>
              </CardContent>
            </Card>
            <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Pass</span>
                <span className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{passCount}</span>
              </CardContent>
            </Card>
            <Card className="bg-destructive/10 border-destructive/20 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-sm font-semibold text-destructive uppercase tracking-wider">Issues</span>
                <span className="text-3xl font-bold mt-1 text-destructive">{issuesCount}</span>
              </CardContent>
            </Card>
            <Card className="bg-neutral-500/10 border-neutral-500/20 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">N/A</span>
                <span className="text-3xl font-bold mt-1 text-neutral-600 dark:text-neutral-400">{naCount}</span>
              </CardContent>
            </Card>
            <Card className="bg-orange-500/10 border-orange-500/20 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Not Started</span>
                <span className="text-3xl font-bold mt-1 text-orange-600 dark:text-orange-400">{notStartedCount}</span>
              </CardContent>
            </Card>
          </div>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden bg-muted/5">
          {/* Left Sidebar */}
          <div className="w-80 border-r border-border/50 bg-card shrink-0 flex flex-col shadow-[4px_0_15px_-3px_rgba(0,0,0,0.1)] z-0">
            <div className="p-4 border-b border-border/50 font-bold text-xs text-muted-foreground uppercase tracking-widest bg-muted/30">
              Categories
            </div>
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-1">
                {Array.from(categoriesMap.keys()).map((catName) => {
                  const items = categoriesMap.get(catName)!
                  const catTotal = items.length
                  const catComp = items.filter(c => c.result !== 'Not Started').length
                  const isActive = activeCategory === catName

                  return (
                    <button
                      key={catName}
                      onClick={() => scrollToCategory(catName)}
                      className={`w-full text-left px-3 py-3 rounded-lg transition-all flex items-center justify-between group border ${
                        isActive 
                          ? 'bg-primary/10 text-primary border-primary/20 shadow-sm' 
                          : 'bg-transparent border-transparent hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <span className={`text-sm truncate pr-2 ${isActive ? 'font-semibold' : 'font-medium'}`} title={catName}>{catName}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold transition-colors ${
                        catComp === catTotal ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted-foreground/15 text-muted-foreground'
                      }`}>
                        {catComp}/{catTotal}
                      </span>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-10 scroll-smooth" id="preview-main-scroll" onScroll={(e) => {
            // Simple scroll spy logic
            const container = e.currentTarget
            const sections = Array.from(document.querySelectorAll('[id^="cat-"]'))
            for (let i = sections.length - 1; i >= 0; i--) {
              const section = sections[i] as HTMLElement
              if (container.scrollTop >= (section.offsetTop - container.offsetTop) - 100) {
                const name = section.id.replace('cat-', '').replace(/-/g, ' ')
                // find original map key that matches case insensitive
                const originalName = Array.from(categoriesMap.keys()).find(k => k.replace(/\s+/g, '-').toLowerCase() === section.id.replace('cat-', '').toLowerCase())
                if (originalName && originalName !== activeCategory) {
                  setActiveCategory(originalName)
                }
                break
              }
            }
          }}>
            <div className="max-w-4xl mx-auto space-y-16 pb-32">
              {Array.from(categoriesMap.keys()).map((catName) => {
                const items = categoriesMap.get(catName)!
                const catTotal = items.length
                const catComp = items.filter(c => c.result !== 'Not Started').length
                const catPercent = Math.round((catComp / catTotal) * 100)

                return (
                  <div key={catName} id={`cat-${catName.replace(/\s+/g, '-')}`} className="scroll-mt-8">
                    <div className="mb-8">
                      <h3 className="text-3xl font-bold tracking-tight">{catName}</h3>
                      <div className="flex items-center gap-5 mt-3 bg-card p-4 rounded-xl border shadow-sm">
                        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground shrink-0">{catComp} / {catTotal} Completed</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${catPercent}%` }} />
                        </div>
                        <span className="text-sm font-bold text-primary shrink-0">{catPercent}%</span>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {items.map(item => (
                        <Card key={item.id} className="border-border/60 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-card">
                          <CardContent className="p-0">
                            {/* Card Header */}
                            <div className="flex items-center justify-between p-5 border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
                              <div className="flex items-center gap-4">
                                <div className="shrink-0">
                                  {item.result === 'Pass' && <CheckCircle2 className="w-6 h-6 text-emerald-500 drop-shadow-sm" />}
                                  {item.result === 'Issues' && <AlertTriangle className="w-6 h-6 text-destructive drop-shadow-sm" />}
                                  {item.result === 'N/A' && <Info className="w-6 h-6 text-neutral-500 drop-shadow-sm" />}
                                  {item.result === 'Not Started' && <div className="w-6 h-6 rounded-full border-2 border-orange-500/50 bg-orange-500/10 text-orange-500" />}
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="font-mono text-xs bg-background shadow-sm border-muted-foreground/20">{item.code}</Badge>
                                  <span className="font-bold text-lg text-card-foreground">{item.title}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                {isReviewer && status === 'Pending Review' && (
                                  <Button variant="outline" size="sm" className="h-9 gap-2 shadow-sm" onClick={() => toast.success('Comment interface opened')}>
                                    <MessageSquare className="w-4 h-4" /> Comment
                                  </Button>
                                )}
                                <Badge variant={
                                  item.result === 'Pass' ? 'default' : 
                                  item.result === 'Issues' ? 'destructive' : 
                                  'secondary'
                                } className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm ${
                                  item.result === 'Pass' ? 'bg-emerald-500 hover:bg-emerald-600' :
                                  item.result === 'Not Started' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''
                                }`}>
                                  {item.result}
                                </Badge>
                              </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                              <div className="md:col-span-2 space-y-6">
                                <div>
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5" /> Description
                                  </p>
                                  <p className="text-sm leading-relaxed text-foreground/90">{item.description || 'No description provided.'}</p>
                                </div>
                                {item.tools && (
                                  <div>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Recommended Tools</p>
                                    <p className="text-sm font-mono bg-muted/40 p-3 rounded-lg border border-border/50 text-foreground/80">{item.tools}</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="md:col-span-1 space-y-6 md:border-l md:border-border/50 md:pl-8">
                                <div>
                                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Remark / Evidence</p>
                                  {item.remark ? (
                                    <div className="text-sm bg-muted/30 p-4 rounded-lg border border-border/50 whitespace-pre-wrap text-foreground/90 shadow-inner">
                                      {item.remark}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground/70 italic bg-muted/10 p-3 rounded-lg border border-dashed border-border/50">No remarks provided.</p>
                                  )}
                                </div>

                                {item.result === 'Issues' && (
                                  <div className="pt-2">
                                    <p className="text-xs font-bold text-destructive uppercase tracking-widest mb-3">Linked Vulnerability</p>
                                    {item.findingId ? (
                                      <Link href={`/findings/${item.findingId}`} target="_blank">
                                        <Button variant="outline" className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-sm bg-destructive/5">
                                          <AlertTriangle className="w-4 h-4" /> View Finding Details
                                        </Button>
                                      </Link>
                                    ) : (
                                      <div className="w-full p-3 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-medium flex items-center justify-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Finding not linked
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Action Dialog */}
      <Dialog open={!!actionModal} onOpenChange={(open) => !open && setActionModal(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {actionModal === 'submit' && 'Submit Assessment'}
              {actionModal === 'approve' && 'Approve Assessment'}
              {actionModal === 'reject' && 'Reject Assessment'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {actionModal === 'submit' ? (
              <p className="text-sm text-muted-foreground">
                Are you sure you want to submit this assessment? It will be locked for review.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {actionModal === 'reject' ? 'Please provide a reason for rejecting this assessment.' : 'You may optionally provide comments for this approval.'}
                </p>
                <textarea 
                  value={actionComments}
                  onChange={(e) => setActionComments(e.target.value)}
                  placeholder={actionModal === 'reject' ? "Mandatory rejection reason..." : "Optional approval comments..."}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setActionModal(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              variant={actionModal === 'reject' ? 'destructive' : 'default'}
              onClick={confirmAction} 
              disabled={isSubmitting || (actionModal === 'reject' && !actionComments.trim())}
            >
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
