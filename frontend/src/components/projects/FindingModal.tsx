'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"

type FindingModalProps = {
  isOpen: boolean
  onClose: () => void
  projectId: string
  checklistId?: string
  defaultTitle?: string
  defaultCode?: string
  onSaved: () => void
}

export function FindingModal({ isOpen, onClose, projectId, checklistId, defaultTitle, defaultCode, onSaved }: FindingModalProps) {
  const [loading, setLoading] = useState(false)

  // Form State
  const [title, setTitle] = useState(defaultTitle || '')
  const [severity, setSeverity] = useState('Medium')
  const [cwe, setCwe] = useState('')
  const [owasp, setOwasp] = useState('')
  const [urls, setUrls] = useState<string[]>([''])
  const [description, setDescription] = useState('')
  const [recommendation, setRecommendation] = useState('')

  const [evidences, setEvidences] = useState<{filePath: string, caption: string}[]>([])
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  async function handleAIAutoFill() {
    if (!title) return toast.error("Please enter a Vulnerability Title first.")
    
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/autocomplete-finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vulnerabilityName: title })
      })
      
      if (!res.ok) throw new Error("Failed to autocomplete")
      const data = await res.json()
      
      if (data.description) setDescription(data.description)
      if (data.owasp) setOwasp(data.owasp)
      if (data.cwe) setCwe(data.cwe)
      if (data.mitigation) setRecommendation(data.mitigation)
      
      toast.success("Fields autofilled using AI")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleEvidenceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    
    setUploadingEvidence(true)
    try {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i]
        const formData = new FormData()
        formData.append('file', file)
        
        const res = await fetch('/api/upload-evidence', {
          method: 'POST',
          body: formData
        })
        
        if (!res.ok) throw new Error("Failed to upload evidence")
        
        const data = await res.json()
        setEvidences(prev => [...prev, { filePath: data.url, caption: '' }])
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploadingEvidence(false)
    }
  }

  async function handleSave() {
    if (!title || !severity) return toast.error('Title and Severity are required.')
    
    setLoading(true)
    try {
      const affectedUrls = urls.filter(u => u.trim() !== '').join('\n')

      const res = await fetch(`/api/projects/${projectId}/findings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          severity,
          checklistId,
          cwe,
          owasp,
          affectedUrls,
          description,
          recommendation,
          evidences
        })
      })

      if (!res.ok) throw new Error('Failed to create finding')
      
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index))
  }

  const addUrl = () => {
    setUrls([...urls, ''])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Finding</DialogTitle>
          <DialogDescription>
            {checklistId ? (
              <span className="flex items-center gap-2 mt-2">
                Linked to: <Badge variant="outline">{defaultCode}</Badge> {defaultTitle}
              </span>
            ) : (
              "Report a new vulnerability manually."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4 md:col-span-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vulnerability Name <span className="text-destructive">*</span></label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                  placeholder="e.g. SQL Injection"
                />
                <Button variant="secondary" onClick={handleAIAutoFill} disabled={aiLoading || !title}>
                  {aiLoading ? "Thinking..." : "AI Autofill"}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">OWASP Mapping</label>
            <input
              type="text"
              value={owasp}
              onChange={(e) => setOwasp(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              placeholder="e.g. Broken Access Control"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CWE ID</label>
            <input
              type="text"
              value={cwe}
              onChange={(e) => setCwe(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              placeholder="e.g. CWE-284"
            />
          </div>

          <div className="space-y-4 md:col-span-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                placeholder="Detailed description of the vulnerability..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Severity <span className="text-destructive">*</span></label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            >
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Informative">Informative</option>
            </select>
          </div>

          <div className="space-y-4 md:col-span-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Affected URLs</label>
                <Button type="button" variant="ghost" size="sm" onClick={addUrl}>
                  <Plus className="h-4 w-4 mr-2" /> Add URL
                </Button>
              </div>
              <div className="space-y-2">
                {urls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                      placeholder="https://target.com/api/login"
                    />
                    {urls.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeUrl(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mitigation</label>
              <textarea
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                placeholder="How to fix this issue..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Evidence (Screenshots)</label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/20 hover:bg-muted/30 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleEvidenceUpload}
                  disabled={uploadingEvidence}
                  className="hidden"
                  id="evidence-upload"
                />
                <label
                  htmlFor="evidence-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2 w-full h-full"
                >
                  <span className="text-sm font-medium text-muted-foreground">
                    {uploadingEvidence ? "Uploading..." : "Drag and drop screenshots here or click to browse"}
                  </span>
                  <span className="text-xs text-muted-foreground/70">Unlimited screenshots supported</span>
                  <Button variant="secondary" size="sm" type="button" className="pointer-events-none mt-2">
                    Upload Images
                  </Button>
                </label>
              </div>
              
              {evidences.length > 0 && (
                <div className="mt-4 space-y-4">
                  {evidences.map((ev, index) => (
                    <div key={index} className="flex gap-4 items-start bg-muted/30 p-3 rounded-lg border">
                      <img src={ev.filePath} alt="Evidence" className="w-32 h-auto rounded border" />
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-semibold">Caption</label>
                        <input
                          type="text"
                          value={ev.caption}
                          onChange={(e) => {
                            const newEvidences = [...evidences]
                            newEvidences[index].caption = e.target.value
                            setEvidences(newEvidences)
                          }}
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                          placeholder={`e.g. Figure ${index + 1}: Evidence description`}
                        />
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => {
                            setEvidences(evidences.filter((_, i) => i !== index))
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading || uploadingEvidence}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || uploadingEvidence}>
            {loading ? "Saving..." : "Save Finding"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
