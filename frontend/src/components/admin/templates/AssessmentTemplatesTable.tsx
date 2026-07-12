"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { UploadTemplateModal } from "./UploadTemplateModal"
import { Upload, FileSpreadsheet, Download, MoreVertical, Trash, CheckCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Template {
  id: string
  name: string
  assessmentType: string
  version: string
  isActive: boolean
  createdAt: string
  uploadedBy: { name: string }
}

const ASSESSMENT_TYPES = [
  "Web Application",
  "API",
  "Android",
  "iOS",
  "Cloud",
  "Infrastructure"
]

export function AssessmentTemplatesTable() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/assessment-templates')
      const data = await res.json()
      if (data.templates) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error("Failed to fetch templates", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return
    try {
      await fetch(`/api/admin/assessment-templates/${id}`, { method: 'DELETE' })
      fetchTemplates()
    } catch (error) {
      console.error("Failed to delete", error)
    }
  }

  const handleSetActive = async (id: string) => {
    try {
      await fetch(`/api/admin/assessment-templates/${id}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true })
      })
      fetchTemplates()
    } catch (error) {
      console.error("Failed to set active", error)
    }
  }

  // Get only the active templates for each type, or the most recent one if none are active
  const getActiveTemplateForType = (type: string) => {
    const typeTemplates = templates.filter(t => t.assessmentType === type)
    if (typeTemplates.length === 0) return null
    return typeTemplates.find(t => t.isActive) || typeTemplates[0]
  }

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Upload className="w-4 h-4" />
          Upload Template
        </Button>
      </div>

      <div className="border rounded-lg bg-card/50 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b font-medium text-sm text-muted-foreground bg-muted/20">
          <div className="col-span-3">Assessment Type</div>
          <div className="col-span-4">Template Name</div>
          <div className="col-span-2">Version</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="divide-y">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading templates...</div>
          ) : (
            ASSESSMENT_TYPES.map(type => {
              const activeTemplate = getActiveTemplateForType(type)
              
              return (
                <div key={type} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/10 transition-colors">
                  <div className="col-span-3 font-medium flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-primary/70" />
                    {type}
                  </div>
                  
                  <div className="col-span-4 text-sm text-muted-foreground truncate">
                    {activeTemplate ? activeTemplate.name : "Not Uploaded"}
                  </div>
                  
                  <div className="col-span-2 text-sm">
                    {activeTemplate ? (
                      <span className="bg-secondary/50 px-2 py-1 rounded text-xs font-mono">
                        {activeTemplate.version}
                      </span>
                    ) : "-"}
                  </div>
                  
                  <div className="col-span-2">
                    {activeTemplate ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full w-fit">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Pending</span>
                    )}
                  </div>
                  
                  <div className="col-span-1 text-right">
                    {activeTemplate && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setIsModalOpen(true)}>
                            <Upload className="w-4 h-4" /> Replace
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer text-destructive" onClick={() => handleDelete(activeTemplate.id)}>
                            <Trash className="w-4 h-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <UploadTemplateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUploadSuccess={fetchTemplates}
      />
    </div>
  )
}
