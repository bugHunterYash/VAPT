"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"

interface UploadTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

const ASSESSMENT_TYPES = [
  "Web Application",
  "API",
  "Android",
  "iOS",
  "Cloud",
  "Infrastructure"
]

export function UploadTemplateModal({ isOpen, onClose, onUploadSuccess }: UploadTemplateModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [assessmentType, setAssessmentType] = useState(ASSESSMENT_TYPES[0])
  const [templateName, setTemplateName] = useState("")
  const [version, setVersion] = useState("v1.0")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")

  const handleUpload = async () => {
    if (!file || !templateName || !assessmentType || !version) {
      setError("Please fill in all fields and select a file.")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", templateName)
      formData.append("assessmentType", assessmentType)
      formData.append("version", version)

      const response = await fetch("/api/admin/assessment-templates", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload template")
      }

      onUploadSuccess()
      onClose()
      
      // Reset form
      setFile(null)
      setTemplateName("")
      setVersion("v1.0")
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Assessment Template</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx) file to be used as a master template for generating reports.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Assessment Type</label>
            <Select value={assessmentType} onValueChange={setAssessmentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {ASSESSMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Template Name</label>
            <Input 
              placeholder="e.g., Web Checklist v1" 
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Version</label>
            <Input 
              placeholder="e.g., v1.0" 
              value={version}
              onChange={(e) => setVersion(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Upload Excel (.xlsx)</label>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/50 transition-colors border-muted-foreground/30">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                        <Upload className="w-8 h-8 mb-3" />
                        <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs">{file ? file.name : "XLSX files only"}</p>
                    </div>
                    <input 
                      id="dropzone-file" 
                      type="file" 
                      className="hidden" 
                      accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFile(e.target.files[0])
                        }
                      }}
                    />
                </label>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !file || !templateName}>
            {isUploading ? "Uploading..." : "Upload Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
