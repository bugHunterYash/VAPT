'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Wand2, UploadCloud, X, GripVertical, FileImage } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

interface FindingEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  finding?: any;
  onSave: (data: any) => Promise<void>;
  assessmentParameters?: any[];
}

export function FindingEditor({ open, onOpenChange, projectId, finding, onSave, assessmentParameters = [] }: FindingEditorProps) {
  const [title, setTitle] = useState(finding?.title || '')
  const [severity, setSeverity] = useState(finding?.severity || 'Medium')
  const [cwe, setCwe] = useState(finding?.cwe || '')
  const [owasp, setOwasp] = useState(finding?.owasp || '')
  const [affectedApplication, setAffectedApplication] = useState(finding?.affectedApplication || '')
  const [urls, setUrls] = useState<string[]>(finding?.affectedUrls ? finding.affectedUrls.split('\n') : [''])
  
  const [description, setDescription] = useState(finding?.description || '')
  const [impact, setImpact] = useState(finding?.impact || '')
  const [mitigation, setMitigation] = useState(finding?.mitigation || '')
  
  const [parameters, setParameters] = useState<{name: string, value: string}[]>(() => {
    try { return finding?.parameter ? JSON.parse(finding.parameter) : [] } catch { return [] }
  })
  
  const [evidences, setEvidences] = useState<{filePath: string, caption: string}[]>(finding?.evidences || [])
  const [aiLoading, setAiLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)

  async function handleAIAutoFill() {
    if (!title) return toast.error("Please enter a Vulnerability Name / AI Prompt first.")
    
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/autocomplete-finding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vulnerabilityName: title })
      })
      
      if (!res.ok) throw new Error("Failed to autocomplete")
      const data = await res.json()
      
      if (data.vulnerabilityName && data.vulnerabilityName !== title) setTitle(data.vulnerabilityName)
      if (data.description) setDescription(data.description)
      if (data.owaspMapping) setOwasp(data.owaspMapping)
      if (data.cweId) setCwe(data.cweId)
      
      if (data.impact) setImpact(Array.isArray(data.impact) ? data.impact.join('\n') : data.impact)
      if (data.mitigation) setMitigation(Array.isArray(data.mitigation) ? data.mitigation.join('\n') : data.mitigation)
      
      toast.success("Fields autofilled via AI")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    
    setUploading(true)
    try {
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i]
        const formData = new FormData()
        formData.append('file', file)
        
        // Proxy through next.js or directly to backend if not intercepted
        const res = await fetch('/api/evidence/upload', {
          method: 'POST',
          body: formData
        })
        
        if (!res.ok) throw new Error("Failed to upload file")
        
        const data = await res.json()
        setEvidences(prev => [...prev, { filePath: data.filePath, caption: '' }])
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const input = document.createElement('input')
      input.type = 'file'
      input.files = files
      handleFileUpload({ target: input } as any)
    }
  }

  function removeEvidence(index: number) {
    setEvidences(prev => prev.filter((_, i) => i !== index))
  }

  function updateCaption(index: number, caption: string) {
    setEvidences(prev => {
      const clone = [...prev]
      clone[index].caption = caption
      return clone
    })
  }

  function handleDragStart(index: number) {
    setDraggedItemIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault() 
    if (draggedItemIndex === null || draggedItemIndex === index) return
    
    setEvidences(prev => {
      const clone = [...prev]
      const draggedItem = clone[draggedItemIndex]
      clone.splice(draggedItemIndex, 1)
      clone.splice(index, 0, draggedItem)
      setDraggedItemIndex(index)
      return clone
    })
  }

  function handleDragEnd() {
    setDraggedItemIndex(null)
  }

  async function handleSubmit() {
    if (!title) return toast.error('Vulnerability Name is required.')
    
    setSaving(true)
    try {
      const affectedUrls = urls.filter(u => u.trim() !== '').join('\n')
      
      await onSave({
        id: finding?.id,
        title,
        severity,
        cwe,
        owasp,
        affectedUrls,
        parameter: JSON.stringify(parameters),
        affectedApplication,
        description,
        impact,
        mitigation,
        evidences
      })
      toast.success(finding ? 'Finding updated' : 'Finding created')
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-full max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 border-b border-border bg-card pb-4">
          <DialogTitle className="text-2xl font-bold">{finding ? 'Edit Finding' : 'New Finding'}</DialogTitle>
          <DialogDescription>
            Detailed vulnerability workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-foreground">Vulnerability Name / AI Prompt</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-lg font-medium rounded-lg border-2 border-input bg-background px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="e.g. IDOR profile edit"
              />
            </div>
            <Button 
              variant="secondary" 
              className="h-[52px] px-6 border-2 border-primary/20 text-primary hover:bg-primary/10 gap-2 font-semibold"
              onClick={handleAIAutoFill}
              disabled={aiLoading}
            >
              <Wand2 className="w-5 h-5" />
              {aiLoading ? 'Generating professional finding...' : 'AI Autofill'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">OWASP Mapping</label>
              <select
                value={owasp}
                onChange={(e) => setOwasp(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="">Select Category</option>
                <option value="Broken Access Control">Broken Access Control</option>
                <option value="Cryptographic Failures">Cryptographic Failures</option>
                <option value="Injection">Injection</option>
                <option value="Insecure Design">Insecure Design</option>
                <option value="Security Misconfiguration">Security Misconfiguration</option>
                <option value="Vulnerable and Outdated Components">Vulnerable and Outdated Components</option>
                <option value="Identification and Authentication Failures">Identification and Authentication Failures</option>
                <option value="Software and Data Integrity Failures">Software and Data Integrity Failures</option>
                <option value="Security Logging and Monitoring Failures">Security Logging and Monitoring Failures</option>
                <option value="Server-Side Request Forgery">Server-Side Request Forgery</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">CWE ID</label>
              <input
                type="text"
                value={cwe}
                onChange={(e) => setCwe(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="e.g. CWE-89"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="Info">Info</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Affected Application</label>
              {assessmentParameters && assessmentParameters.length > 0 ? (
                <select
                  value={affectedApplication}
                  onChange={(e) => setAffectedApplication(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Select Application...</option>
                  {assessmentParameters.map((ap, i) => (
                    <option key={i} value={ap.applicationName}>{ap.applicationName || 'Unnamed App'}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={affectedApplication}
                  onChange={(e) => setAffectedApplication(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Admin Portal"
                />
              )}
            </div>
          </div>

          <div className="space-y-3 p-6 bg-muted/30 rounded-xl border border-border">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Affected URLs</label>
              <Badge variant="outline">{urls.filter(u => u.trim() !== '').length} URL(s)</Badge>
            </div>
            <div className="space-y-2">
              {urls.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...urls]
                      newUrls[index] = e.target.value
                      setUrls(newUrls)
                    }}
                    className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary outline-none"
                    placeholder="https://example.com/api/v1/..."
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setUrls(urls.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2 border-dashed"
              onClick={() => setUrls([...urls, ''])}
            >
              + Add Another URL
            </Button>
          </div>

          <div className="space-y-3 p-6 bg-muted/10 rounded-xl border border-border">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Affected Parameters</label>
              <Badge variant="outline">{parameters.length} Parameter(s)</Badge>
            </div>
            <div className="space-y-2">
              {parameters.map((param, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={param.name}
                    onChange={(e) => {
                      const newParams = [...parameters]
                      newParams[index].name = e.target.value
                      setParameters(newParams)
                    }}
                    className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Parameter Name (e.g. user_id)"
                  />
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => {
                      const newParams = [...parameters]
                      newParams[index].value = e.target.value
                      setParameters(newParams)
                    }}
                    className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Value / Payload (Optional)"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setParameters(parameters.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2 border-dashed"
              onClick={() => setParameters([...parameters, { name: '', value: '' }])}
            >
              + Add Parameter
            </Button>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none leading-relaxed resize-y"
                placeholder="Technical description of the vulnerability..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Impact</label>
              <textarea
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none leading-relaxed resize-y"
                placeholder="Impact of this issue..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Mitigation / Recommendation</label>
              <textarea
                value={mitigation}
                onChange={(e) => setMitigation(e.target.value)}
                rows={5}
                className="w-full rounded-md border border-input bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none leading-relaxed resize-y"
                placeholder="Steps required to remediate this issue..."
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Evidence Files (MinIO)</h3>
                <p className="text-sm text-muted-foreground">Upload screenshots and POCs.</p>
              </div>
              <label className="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium text-sm flex items-center gap-2 transition-colors">
                <UploadCloud className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" />
              </label>
            </div>

            {evidences.length === 0 ? (
              <div 
                className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 hover:bg-muted/20 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <FileImage className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">Drag & Drop images here</p>
                <p className="text-xs mt-1">PNG, JPG, GIF up to 10MB</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {evidences.map((ev, index) => (
                  <div 
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`group relative flex gap-4 p-3 bg-card border rounded-lg shadow-sm transition-all hover:border-primary/50 hover:shadow-md cursor-grab active:cursor-grabbing ${draggedItemIndex === index ? 'opacity-50 border-primary border-dashed' : 'border-border'}`}
                  >
                    <div className="flex flex-col justify-center text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="w-24 h-24 rounded-md border border-border overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                      <FileImage className="w-8 h-8 text-muted-foreground opacity-50" />
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start">
                        <div className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-sm inline-block">
                          Figure {index + 1}
                        </div>
                        <button 
                          onClick={() => removeEvidence(index)}
                          className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Add caption..."
                        value={ev.caption}
                        onChange={(e) => updateCaption(index, e.target.value)}
                        className="w-full text-sm bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none py-1 transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-border flex justify-end gap-3 bg-card">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Finding'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
