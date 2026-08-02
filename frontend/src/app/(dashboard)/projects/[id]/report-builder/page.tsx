'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { FindingEditor } from '@/components/projects/FindingEditor'
import { Plus, ChevronLeft, FileType, Sheet } from 'lucide-react'

export default function ReportBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [project, setProject] = useState<any>(null)
  const [findings, setFindings] = useState<any[]>([])
  
  const [selectedFinding, setSelectedFinding] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
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

  async function generateReport(format: "DOCX" | "EXCEL") {
    if (!projectId) return
    setGenerating(true)
    const toastId = toast.loading(`Generating ${format}...`)
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
      
      let filename = format === 'DOCX' ? 'VAPT_Report.docx' : 'Vulnerability_Tracker.xlsx'
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
    }
    
    setIsModalOpen(false)
  }

  function handleCreateNew() {
    setSelectedFinding(null)
    setIsModalOpen(true)
  }

  function handleEdit(finding: any) {
    setSelectedFinding(finding)
    setIsModalOpen(true)
  }

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
            <p className="text-muted-foreground mt-1">Report Builder - Findings List</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => generateReport("EXCEL")} disabled={generating}>
            <Sheet className="h-4 w-4 text-green-600" />
            Generate Tracker
          </Button>
          <Button className="gap-2" onClick={() => generateReport("DOCX")} disabled={generating}>
            <FileType className="h-4 w-4" />
            Generate DOCX
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col min-h-[500px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Project Findings ({findings.length})</h2>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" /> Add Finding
          </Button>
        </div>

        {findings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-12">
            <p>No findings added yet.</p>
            <Button className="mt-4" onClick={handleCreateNew}>
              Create First Finding
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {findings.map((f: any) => (
              <div 
                key={f.id}
                onClick={() => handleEdit(f)}
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
