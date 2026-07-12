"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function AddKnowledgeBaseModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      severity: formData.get("severity"),
      cvss: formData.get("cvss"),
      cwe: formData.get("cwe"),
      owasp: formData.get("owasp"),
      recommendation: formData.get("recommendation"),
      businessImpact: formData.get("businessImpact")
    }

    try {
      const res = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        toast.success("Vulnerability added to Knowledge Base")
        onSuccess()
        onClose()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to add vulnerability")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add to Knowledge Base</DialogTitle>
            <DialogDescription>
              Define a standardized vulnerability. These exact details will be used by the AI engine.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Vulnerability Title</Label>
                <Input id="title" name="title" required placeholder="e.g. Cross-Site Scripting (XSS)" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Default Severity</Label>
                <Select name="severity" defaultValue="Medium">
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Informative">Informative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cvss">Default CVSS Base Score</Label>
                <Input id="cvss" name="cvss" placeholder="e.g. 7.1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cwe">CWE ID</Label>
                <Input id="cwe" name="cwe" placeholder="e.g. CWE-79" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owasp">OWASP Category</Label>
                <Input id="owasp" name="owasp" placeholder="e.g. A03:2021-Injection" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Standardized Description</Label>
              <Textarea id="description" name="description" required rows={3} placeholder="Technical description of the vulnerability..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessImpact">Standardized Business Impact</Label>
              <Textarea id="businessImpact" name="businessImpact" rows={2} placeholder="Explain what could happen to the business..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommendation">Standardized Recommendation</Label>
              <Textarea id="recommendation" name="recommendation" required rows={3} placeholder="Steps to remediate..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save to KB"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
