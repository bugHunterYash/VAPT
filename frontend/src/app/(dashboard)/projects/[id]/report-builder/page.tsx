'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { FindingEditor } from '@/components/projects/FindingEditor'
import { Plus, ChevronLeft, FileType, Sheet, Save, CheckCircle2, XCircle, Users, Settings, FileText, Download } from 'lucide-react'

export default function ReportBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [project, setProject] = useState<any>(null)
  const [findings, setFindings] = useState<any[]>([])
  
  const [activeTab, setActiveTab] = useState<'config' | 'findings'>('config')
  
  // Configuration State
  const [meta, setMeta] = useState<any>({
    reportTitle: 'Vulnerability Assessment & Penetration Testing Report',
    documentDate: new Date().toISOString().split('T')[0],
    preparedBy: '',
    approvedBy: '',
    reviewedBy: '',
    releasedBy: '',
    organization: '',
    certInEmpanelment: '',
    appUsername: '',
    appPassword: '',
    includeCredentials: false
  })
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  
  const [selectedFinding, setSelectedFinding] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    params.then(p => {
      setProjectId(p.id)
      fetchProjectData(p.id)
    })
  }, [params])

  async function fetchProjectData(id: string) {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (!res.ok) throw new Error('Failed to fetch project')
      const data = await res.json()
      setProject(data)

      const fRes = await fetch(`/api/projects/${id}/findings`)
      if (fRes.ok) {
        const fData = await fRes.json()
        setFindings(fData)
      }
      
      const mRes = await fetch(`/api/projects/${id}/report-meta`)
      if (mRes.ok) {
        const mData = await mRes.json()
        if (mData.reportMeta) {
          setMeta({
            ...meta,
            ...mData.reportMeta,
            documentDate: mData.reportMeta.documentDate ? new Date(mData.reportMeta.documentDate).toISOString().split('T')[0] : meta.documentDate
          })
        }
        if (mData.teamMembers) {
          setTeamMembers(mData.teamMembers)
        }
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function saveConfiguration() {
    if (!projectId) return
    setSaving(true)
    const toastId = toast.loading('Saving report configuration...')
    try {
      const res = await fetch(`/api/projects/${projectId}/report-meta`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...meta,
          teamMembers
        })
      })
      if (!res.ok) throw new Error('Failed to save configuration')
      toast.success('Configuration saved successfully', { id: toastId })
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  async function generateReport(format: "DOCX" | "EXCEL" | "PDF") {
    if (!projectId) return
    
    // Auto-save config first
    await saveConfiguration()
    
    setGenerating(true)
    const toastId = toast.loading(`Generating ${format} Report... Please wait.`)
    try {
      const res = await fetch(`/api/projects/${projectId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      })
      
      if (!res.ok) {
        let errData
        try {
          errData = await res.json()
        } catch(e) {}
        throw new Error(errData?.error || `Failed to generate ${format} report`)
      }
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      
      let filename = `VAPT_Report_${project?.applicationName || 'App'}.${format.toLowerCase()}`
      if (format === 'EXCEL') filename = `Vulnerability_Tracker_${project?.applicationName || 'App'}.xlsx`
      
      const contentDisposition = res.headers.get('content-disposition')
      if (contentDisposition && contentDisposition.includes('filename="')) {
        const match = contentDisposition.match(/filename="(.+?)"/)
        if (match && match[1]) filename = match[1]
      }
      
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success(`${format} generated successfully!`, { id: toastId })
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setGenerating(false)
    }
  }

  async function handleSaveFinding(data: any) {
    if (!projectId) return
    const isUpdate = !!data.id
    const url = isUpdate ? `/api/projects/${projectId}/findings/${data.id}` : `/api/projects/${projectId}/findings`
    const res = await fetch(url, {
      method: isUpdate ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error("Failed to save finding")
    const saved = await res.json()
    if (isUpdate) {
      setFindings(prev => prev.map(f => f.id === saved.id ? saved : f))
    } else {
      setFindings(prev => [saved, ...prev])
    }
    setIsModalOpen(false)
  }

  function addTeamMember() {
    setTeamMembers([...teamMembers, { name: '', designation: '', email: '', qualifications: '' }])
  }

  function updateTeamMember(index: number, field: string, value: string) {
    const updated = [...teamMembers]
    updated[index][field] = value
    setTeamMembers(updated)
  }

  function removeTeamMember(index: number) {
    setTeamMembers(teamMembers.filter((_, i) => i !== index))
  }

  // Report Readiness Checks
  const issues = []
  if (findings.length === 0) issues.push('No findings added to the project.')
  const findingsMissingSeverity = findings.filter(f => !f.severity || f.severity.trim() === '')
  if (findingsMissingSeverity.length > 0) issues.push(`${findingsMissingSeverity.length} finding(s) missing severity.`)
  if (!meta.reportTitle) issues.push('Report Title is missing.')
  if (teamMembers.length === 0) issues.push('No auditing team members added.')

  const isReady = issues.length === 0

  if (loading || !project) return <div className="flex h-screen items-center justify-center">Loading Report Builder...</div>

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push(`/projects/${projectId}`)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.applicationName || project.name}</h1>
            <p className="text-muted-foreground mt-1">Professional Report Builder</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={saveConfiguration} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Config'}
          </Button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border">
        <button 
          onClick={() => setActiveTab('config')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === 'config' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Settings className="w-4 h-4" /> Report Configuration
        </button>
        <button 
          onClick={() => setActiveTab('findings')}
          className={`pb-3 px-4 text-sm font-semibold transition-colors flex items-center gap-2 ${activeTab === 'findings' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <FileText className="w-4 h-4" /> Findings & Evidence ({findings.length})
        </button>
      </div>

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-primary"/> Document Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-semibold">Report Title</label>
                  <input type="text" value={meta.reportTitle} onChange={e => setMeta({...meta, reportTitle: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Document Date</label>
                  <input type="date" value={meta.documentDate} onChange={e => setMeta({...meta, documentDate: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Organization / Client Name</label>
                  <input type="text" value={meta.organization} onChange={e => setMeta({...meta, organization: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background" placeholder="e.g. Acme Corp" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Prepared By</label>
                  <input type="text" value={meta.preparedBy} onChange={e => setMeta({...meta, preparedBy: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Approved By</label>
                  <input type="text" value={meta.approvedBy} onChange={e => setMeta({...meta, approvedBy: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Reviewed By</label>
                  <input type="text" value={meta.reviewedBy} onChange={e => setMeta({...meta, reviewedBy: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Released By</label>
                  <input type="text" value={meta.releasedBy} onChange={e => setMeta({...meta, releasedBy: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-sm font-semibold">CERT-In Empanelment Info (Optional)</label>
                  <input type="text" value={meta.certInEmpanelment} onChange={e => setMeta({...meta, certInEmpanelment: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background" placeholder="e.g. CERT-In Empaneled Security Auditor..." />
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5 text-primary"/> Auditing Team</h2>
                <Button size="sm" variant="outline" onClick={addTeamMember}><Plus className="w-4 h-4 mr-1"/> Add Member</Button>
              </div>
              
              {teamMembers.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground text-sm">No team members added. Reports usually require at least one tester.</div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member, i) => (
                    <div key={i} className="flex gap-3 items-start border p-4 rounded-lg bg-muted/20 relative">
                      <button onClick={() => removeTeamMember(i)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"><XCircle className="w-4 h-4"/></button>
                      <div className="grid grid-cols-2 gap-3 w-full pr-6">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Name</label>
                          <input type="text" value={member.name} onChange={e => updateTeamMember(i, 'name', e.target.value)} className="w-full border rounded text-sm px-2 py-1.5" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Designation</label>
                          <input type="text" value={member.designation} onChange={e => updateTeamMember(i, 'designation', e.target.value)} className="w-full border rounded text-sm px-2 py-1.5" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Email</label>
                          <input type="email" value={member.email} onChange={e => updateTeamMember(i, 'email', e.target.value)} className="w-full border rounded text-sm px-2 py-1.5" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Qualifications</label>
                          <input type="text" value={member.qualifications} onChange={e => updateTeamMember(i, 'qualifications', e.target.value)} className="w-full border rounded text-sm px-2 py-1.5" placeholder="e.g. OSCP, CEH" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-4">Assessment Parameters</h2>
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input type="checkbox" checked={meta.includeCredentials} onChange={e => setMeta({...meta, includeCredentials: e.target.checked})} className="w-4 h-4 rounded border-gray-300" />
                <span className="text-sm font-semibold">Include assessment credentials in generated report</span>
              </label>
              
              {meta.includeCredentials && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/10">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Test Username / Account</label>
                    <input type="text" value={meta.appUsername} onChange={e => setMeta({...meta, appUsername: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Test Password</label>
                    <input type="text" value={meta.appPassword} onChange={e => setMeta({...meta, appPassword: e.target.value})} className="w-full border rounded-md px-3 py-2 text-sm bg-background" />
                  </div>
                </div>
              )}
            </div>
            
          </div>

          <div className="space-y-6">
            {/* Report Readiness Widget */}
            <div className="bg-card border rounded-xl p-6 shadow-sm sticky top-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                {isReady ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-amber-500" />}
                Report Readiness
              </h2>
              
              {isReady ? (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md mb-6 border border-green-200">
                  All checks passed. The report is ready to be generated.
                </div>
              ) : (
                <div className="mb-6 space-y-2">
                  {issues.map((iss, i) => (
                    <div key={i} className="text-sm text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200 flex items-start gap-2">
                      <span className="mt-0.5">•</span> {iss}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 pt-4 border-t">
                <Button className="w-full gap-2 font-semibold bg-[#1F4E78] hover:bg-[#163a5a]" size="lg" onClick={() => generateReport("DOCX")} disabled={generating}>
                  <FileType className="h-5 w-5" /> Generate DOCX Report
                </Button>
                <Button className="w-full gap-2 font-semibold bg-red-600 hover:bg-red-700" size="lg" onClick={() => generateReport("PDF")} disabled={generating}>
                  <Download className="h-5 w-5" /> Generate PDF Report
                </Button>
                <Button variant="outline" className="w-full gap-2 font-semibold" size="lg" onClick={() => generateReport("EXCEL")} disabled={generating}>
                  <Sheet className="h-5 w-5 text-green-600" /> Generate Excel Tracker
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'findings' && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Project Findings ({findings.length})</h2>
            <Button onClick={() => { setSelectedFinding(null); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Add Finding
            </Button>
          </div>

          {findings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
              <p>No findings added yet.</p>
              <Button className="mt-4" onClick={() => { setSelectedFinding(null); setIsModalOpen(true); }}>
                Create First Finding
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map((f: any) => (
                <div 
                  key={f.id}
                  onClick={() => { setSelectedFinding(f); setIsModalOpen(true); }}
                  className="flex items-center justify-between p-4 rounded-lg cursor-pointer border bg-background hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-base">{f.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{f.owasp || "No category"} • {f.cwe || "No CWE"}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    {f.evidences?.length > 0 && <span className="text-xs text-muted-foreground">{f.evidences.length} img</span>}
                    <Badge variant={
                      f.severity === 'Critical' ? 'destructive' :
                      f.severity === 'High' ? 'destructive' :
                      f.severity === 'Medium' ? 'default' :
                      'secondary'
                    } className="px-2 py-1">{f.severity}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <FindingEditor
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          projectId={projectId!}
          finding={selectedFinding}
          onSave={handleSaveFinding}
        />
      )}
    </div>
  )
}
