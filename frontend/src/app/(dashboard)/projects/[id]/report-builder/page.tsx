'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { FindingEditor } from '@/components/projects/FindingEditor'
import { Plus, ChevronLeft, LayoutPanelLeft } from 'lucide-react'

export default function ReportBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [project, setProject] = useState<any>(null)
  const [findings, setFindings] = useState<any[]>([])
  
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  
  const [loading, setLoading] = useState(true)
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
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function generateReport() {
    if (!projectId) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, format: "DOCX" })
      })
      if (!res.ok) throw new Error("Failed to start generation")
      
      toast.success("Report generation started! Redirecting...")
      setTimeout(() => router.push(`/projects/${projectId}`), 1500)
    } catch (err: any) {
      toast.error(err.message)
      setGenerating(false)
    }
  }

  async function handleSaveFinding(data: any) {
    if (!projectId) return
    
    const isUpdate = !!data.id
    const url = isUpdate 
      ? `/api/projects/${projectId}/findings/${data.id}` 
      : `/api/projects/${projectId}/findings`
      
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
      setIsCreating(false)
      setSelectedFindingId(saved.id)
    }
  }

  function handleCreateNew() {
    setSelectedFindingId(null)
    setIsCreating(true)
  }

  if (loading || !project) return <div className="flex h-screen items-center justify-center">Loading Report Builder...</div>

  const selectedFinding = findings.find(f => f.id === selectedFindingId)
  const showEditor = isCreating || selectedFinding

  return (
    <div className="flex h-[calc(100vh-8rem)] w-full max-w-[1600px] mx-auto bg-background border border-border rounded-xl shadow-sm overflow-hidden">
      
      {/* LEFT SIDEBAR (25%) */}
      <div className="w-[300px] lg:w-[350px] flex-shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border space-y-4">
          <Button variant="ghost" size="sm" className="w-fit -ml-2 text-muted-foreground" onClick={() => router.push(`/projects/${projectId}`)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Project
          </Button>
          <div>
            <h1 className="text-xl font-bold truncate">{project.applicationName}</h1>
            <p className="text-sm text-muted-foreground">Report Builder</p>
          </div>
          <Button className="w-full" onClick={generateReport} disabled={generating}>
            {generating ? "Generating..." : "Generate DOCX Report"}
          </Button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          <div className="flex items-center justify-between mb-4 text-sm font-medium text-muted-foreground">
            <span>Findings ({findings.length})</span>
          </div>
          
          {findings.map((f: any) => (
            <div 
              key={f.id}
              onClick={() => {
                setIsCreating(false)
                setSelectedFindingId(f.id)
              }}
              className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedFindingId === f.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-background hover:bg-muted border-transparent hover:border-border'}`}
            >
              <div className="font-semibold text-sm line-clamp-1">{f.title}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={
                  f.severity === 'Critical' ? 'destructive' :
                  f.severity === 'High' ? 'destructive' :
                  f.severity === 'Medium' ? 'default' :
                  'secondary'
                } className="text-[10px] px-1.5 py-0.5">{f.severity}</Badge>
                {f.evidences?.length > 0 && <span className="text-xs text-muted-foreground">{f.evidences.length} img</span>}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-border bg-card">
          <Button variant="outline" className="w-full border-dashed" onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" /> Add Finding
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT (75%) */}
      <div className="flex-1 flex flex-col bg-muted/10 relative overflow-hidden">
        {showEditor ? (
          <FindingEditor 
            // Add key so component resets state when switching findings
            key={selectedFindingId || 'new'} 
            projectId={projectId!}
            finding={selectedFinding}
            onSave={handleSaveFinding}
            onCancel={() => {
              setIsCreating(false)
              if (!selectedFindingId && findings.length > 0) {
                setSelectedFindingId(findings[0].id)
              }
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <LayoutPanelLeft className="w-16 h-16 opacity-20 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Select a finding to edit</h2>
            <p className="text-sm text-center max-w-sm">
              Click a finding from the sidebar to open the workspace, or click Add Finding to create a new one.
            </p>
            {findings.length === 0 && (
              <Button className="mt-6" onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" /> Create First Finding
              </Button>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
