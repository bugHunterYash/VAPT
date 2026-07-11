import { prisma } from '@/lib/prisma'
import { generatePdfReport } from './PdfGenerator'
import { generateDocxReport } from './DocxGenerator'
import { generateExcelReport } from './ExcelGenerator'

export class ReportService {
  /**
   * Generates a report in the specified format and saves it to the database history.
   * Returns the generated ReportHistory record.
   */
  static async generateReport(projectId: string, generatedById: string, format: 'PDF' | 'DOCX' | 'EXCEL') {
    // 1. Fetch all necessary data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        auditor: true,
        reviewer: true,
        checklists: { orderBy: { order: 'asc' } },
        findings: true,
      }
    })

    if (!project) throw new Error('Project not found')

    // 2. Generate file content based on format
    let fileBuffer: Buffer | null = null
    let extension = ''

    switch (format) {
      case 'PDF':
        fileBuffer = await generatePdfReport(project)
        extension = 'pdf'
        break
      case 'DOCX':
        fileBuffer = await generateDocxReport(project)
        extension = 'docx'
        break
      case 'EXCEL':
        fileBuffer = await generateExcelReport(project)
        extension = 'xlsx'
        break
      default:
        throw new Error('Unsupported format')
    }

    if (!fileBuffer) {
      throw new Error('Failed to generate report file.')
    }

    // 3. Determine new version
    const previousReports = await prisma.reportHistory.count({
      where: { projectId, format }
    })
    const version = previousReports + 1

    // 4. Save to filesystem
    // We will save to a specific directory, e.g. public/reports or a local folder
    // For this implementation, we will use a local /uploads/reports directory
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const uploadDir = path.join(process.cwd(), 'uploads', 'reports')
    await fs.mkdir(uploadDir, { recursive: true })
    
    const fileName = `Report-${project.name.replace(/[^a-z0-9]/gi, '_')}-v${version}.${extension}`
    const filePath = path.join(uploadDir, fileName)
    
    await fs.writeFile(filePath, fileBuffer)

    // 5. Create ReportHistory record
    const reportHistory = await prisma.reportHistory.create({
      data: {
        projectId,
        generatedById,
        format,
        filePath: fileName, // just storing filename or relative path
        version
      }
    })

    return reportHistory
  }
}
