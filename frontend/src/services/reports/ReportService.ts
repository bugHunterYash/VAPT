import { prisma } from '@/lib/prisma'
import { generatePdfReport } from './PdfGenerator'

export class ReportService {
  /**
   * Generates a report in the specified format and saves it to the database history.
   * Returns the generated ReportHistory record.
   */
  static async generateReport(projectId: string, generatedById: string, format: 'PDF' | 'DOCX' | 'EXCEL', reportId: string) {
    try {
      // 1. Fetch all necessary data
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          auditor: true,
          reviewer: true,
          checklists: { orderBy: { order: 'asc' } },
          findings: {
            include: { evidences: { orderBy: { order: 'asc' } } }
          },
        }
      })

      if (!project) throw new Error('Project not found')

      // 2. Generate file content based on format
      let fileBuffer: Buffer | null = null
      let extension = ''

      if (format === 'PDF') {
        fileBuffer = await generatePdfReport(project)
        extension = 'pdf'
      } else {
        const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
        const endpoint = format === 'DOCX' ? '/api/v1/reports/docx' : '/api/v1/reports/excel'
        
        const response = await fetch(`${backendUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project)
        })
        
        if (!response.ok) {
          const errData = await response.text()
          throw new Error(`Backend generation failed: ${errData}`)
        }
        
        const arrayBuffer = await response.arrayBuffer()
        fileBuffer = Buffer.from(arrayBuffer)
        extension = format === 'DOCX' ? 'docx' : 'xlsx'
      }

      if (!fileBuffer) {
        throw new Error('Failed to generate report file.')
      }

      const reportHistory = await prisma.reportHistory.findUnique({ where: { id: reportId } })
      if (!reportHistory) throw new Error('Report record not found')

      // 3. Save to filesystem
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const uploadDir = path.join(process.cwd(), 'uploads', 'reports')
      await fs.mkdir(uploadDir, { recursive: true })
      
      const fileName = `Report-${project.name.replace(/[^a-z0-9]/gi, '_')}-v${reportHistory.version}.${extension}`
      const filePath = path.join(uploadDir, fileName)
      
      await fs.writeFile(filePath, fileBuffer)

      // 4. Update ReportHistory record
      const updatedReport = await prisma.reportHistory.update({
        where: { id: reportId },
        data: {
          filePath: fileName,
          status: 'Ready'
        }
      })

      return updatedReport
    } catch (error) {
      console.error("Report generation failed:", error)
      await prisma.reportHistory.update({
        where: { id: reportId },
        data: { status: 'Failed' }
      })
      throw error
    }
  }
}
