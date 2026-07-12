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
  const [cvss, setCvss] = useState('')
  const [cwe, setCwe] = useState('')
  const [owasp, setOwasp] = useState('')
  const [affectedUrls, setAffectedUrls] = useState('')
  const [description, setDescription] = useState('')
  const [poc, setPoc] = useState('')
  const [recommendation, setRecommendation] = useState('')

  async function handleSave() {
    if (!title || !severity) return toast.error('Title and Severity are required.')
    
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/findings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          severity,
          checklistId,
          cvss,
          cwe,
          owasp,
          affectedUrls,
          description,
          poc,
          recommendation
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
              <label className="text-sm font-medium">Vulnerability Title <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                placeholder="e.g. SQL Injection in Login Form"
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

          <div className="space-y-2">
            <label className="text-sm font-medium">CVSS Score</label>
            <input
              type="text"
              value={cvss}
              onChange={(e) => setCvss(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              placeholder="e.g. CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CWE ID</label>
            <input
              type="text"
              value={cwe}
              onChange={(e) => setCwe(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              placeholder="e.g. CWE-89"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">OWASP Mapping</label>
            <input
              type="text"
              value={owasp}
              onChange={(e) => setOwasp(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              placeholder="e.g. A03:2021-Injection"
            />
          </div>

          <div className="space-y-4 md:col-span-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Affected URLs</label>
              <input
                type="text"
                value={affectedUrls}
                onChange={(e) => setAffectedUrls(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                placeholder="https://target.com/api/login"
              />
            </div>
            
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Proof of Concept (PoC) / Evidence</label>
              <textarea
                value={poc}
                onChange={(e) => setPoc(e.target.value)}
                rows={5}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm font-mono"
                placeholder="Steps to reproduce, payloads used, HTTP requests..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Remediation / Recommendation</label>
              <textarea
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                placeholder="How to fix this issue..."
              />
            </div>
          </div>

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Finding"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
