import ExcelJS from 'exceljs'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import { access } from 'fs/promises'

const prisma = new PrismaClient()

export async function generateExcelReport(project: any): Promise<Buffer> {
  // Find the active template for this project's assessment type
  const template = await prisma.assessmentTemplate.findFirst({
    where: {
      assessmentType: project.assessmentType,
      isActive: true
    }
  })

  // If no template is found, we fall back to a generic error workbook or throw
  if (!template) {
    throw new Error(`No active Assessment Template found for type: ${project.assessmentType}. Please upload a template in the Administration panel.`)
  }

  // Ensure file exists
  try {
    await access(template.filePath)
  } catch (error) {
    throw new Error(`Template file not found on disk at: ${template.filePath}`)
  }

  // Read the master template
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(template.filePath)

  // Helper to extract text from a cell which might be rich text
  const getCellText = (val: any) => {
    if (!val) return ''
    if (typeof val === 'string') return val.trim()
    if (val.richText) return val.richText.map((rt: any) => rt.text).join('').trim()
    return val.toString().trim()
  }

  // Map checklists by code AND title for fast lookup
  const checklistMap = new Map()
  ;(project.checklists || []).forEach((c: any) => {
    checklistMap.set(c.code, c)
    if (c.title) {
      checklistMap.set(c.title, c)
    }
  })

  // Iterate through all worksheets and rows
  workbook.eachSheet((worksheet) => {
    worksheet.eachRow((row, rowNumber) => {
      // Find if any cell in this row matches a checklist code or title
      let matchedCode: string | null = null
      
      row.eachCell((cell) => {
        const val = getCellText(cell.value)
        if (val && checklistMap.has(val)) {
          matchedCode = val
        }
      })

      // If we found a checklist code in this row, update columns E and F
      if (matchedCode) {
        const checklistItem = checklistMap.get(matchedCode)
        
        // Column E is 5 (Result)
        const resultCell = row.getCell(5)
        resultCell.value = checklistItem.result || 'Not Started'
        
        // Column F is 6 (Remark)
        const remarkCell = row.getCell(6)
        remarkCell.value = checklistItem.remark || ''
      }
    })
  })

  // Optionally we can update project info if the template has placeholders
  // For instance, looking for '{Project Name}' and replacing it
  // This is a nice-to-have but not explicitly requested right now.
  // We will strictly update E & F for matching rows as requested.

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as Buffer
}
