"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Loader2, Maximize, Printer, Search } from "lucide-react"

// Ensure Mammoth is only loaded dynamically on client for DOCX
import mammoth from 'mammoth'
import ExcelJS from 'exceljs'

interface ReportPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  report: {
    id: string
    format: string
    project: { name: string }
    filePath: string
  } | null
}

export function ReportPreviewModal({ isOpen, onClose, report }: ReportPreviewModalProps) {
  const [content, setContent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && report) {
      loadPreview()
    } else {
      setContent(null)
      setError("")
    }
  }, [isOpen, report])

  const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
  }

  const loadPreview = async () => {
    if (!report) return
    setLoading(true)
    setError("")
    try {
      const url = `/api/reports/${report.id}/download`
      const res = await fetch(url)
      
      if (!res.ok) throw new Error("Failed to load document")
      const buffer = await res.arrayBuffer()

      if (report.format === 'DOCX') {
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer })
        setContent(result.value)
      } else if (report.format === 'EXCEL') {
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)
        
        let html = '<div class="space-y-8">'
        workbook.eachSheet((worksheet, sheetId) => {
          html += `<div class="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden">`
          html += `<div class="bg-muted/30 p-4 border-b border-border/50"><h3 class="font-bold text-xl">${escapeHtml(worksheet.name)}</h3></div>`
          html += `<div class="overflow-x-auto"><table class="w-full border-collapse text-sm">`
          
          let hasRows = false
          worksheet.eachRow((row, rowNumber) => {
            hasRows = true
            if (rowNumber === 1) {
              html += `<thead class="bg-muted/20"><tr>`
              row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                const cellValue = cell.value ? cell.value.toString() : ''
                html += `<th class="border-b border-border/50 p-4 text-left font-semibold text-muted-foreground whitespace-nowrap uppercase tracking-wider text-xs">${escapeHtml(cellValue)}</th>`
              })
              html += `</tr></thead><tbody class="divide-y divide-border/50">`
            } else {
              html += `<tr class="hover:bg-muted/10 transition-colors">`
              row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                let cellValue = ''
                if (cell.value) {
                  if (typeof cell.value === 'object' && 'richText' in cell.value) {
                    cellValue = (cell.value as any).richText.map((rt: any) => rt.text).join('')
                  } else {
                    cellValue = cell.value.toString()
                  }
                }

                // Add status badges
                if (cellValue === 'Pass') {
                  cellValue = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">PASS</span>`
                } else if (cellValue === 'Issues') {
                  cellValue = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">ISSUES</span>`
                } else if (cellValue === 'Not Started') {
                  cellValue = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">NOT STARTED</span>`
                } else if (cellValue === 'N/A') {
                  cellValue = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-neutral-500/10 text-neutral-500 border border-neutral-500/20">N/A</span>`
                } else {
                  // Escape regular text cells
                  cellValue = escapeHtml(cellValue).replace(/\\n/g, '<br/>')
                }

                html += `<td class="p-4 align-top ${colNumber === 1 ? 'font-medium' : ''}">${cellValue}</td>`
              })
              html += `</tr>`
            }
          })
          
          if (hasRows) {
            html += `</tbody>`
          }
          html += `</table></div></div>`
        })
        html += '</div>'
        setContent(html)
      } else if (report.format === 'PDF') {
        setContent(url)
      }
    } catch (err: any) {
      setError(err.message || "Preview not available")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (!report) return
    window.open(`/api/reports/${report.id}/download`, '_blank')
  }

  if (!report) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[1600px] !w-[95vw] h-[95vh] max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b flex-row justify-between items-center bg-card flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 m-0">
            {report.project.name} - {report.format} Report
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex">
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" /> Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/20 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Loading preview...</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-destructive font-medium">{error}</p>
            </div>
          ) : (
            <>
              {report.format === 'PDF' && content && (
                <iframe 
                  src={content + "#toolbar=0"} 
                  className="w-full h-full border-none"
                  title="PDF Preview"
                />
              )}
              {report.format === 'DOCX' && content && (
                <div 
                  className="max-w-4xl mx-auto my-8 p-12 bg-white text-black shadow-lg rounded-sm min-h-full docx-preview prose prose-sm"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              )}
              {report.format === 'EXCEL' && content && (
                <div 
                  className="p-6 h-full"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
