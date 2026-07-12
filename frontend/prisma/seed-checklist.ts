import { PrismaClient } from '@prisma/client'
import ExcelJS from 'exceljs'
import path from 'path'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Checklist Templates from Master Excel...')

  const filePath = path.join(process.cwd(), 'storage/templates/web_application/1783837702416-WAPT Checklist 1.xlsx')
  
  if (!fs.existsSync(filePath)) {
    console.error(`Master template not found at ${filePath}`)
    process.exit(1)
  }

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const worksheet = workbook.worksheets[0]

  const assessmentType = 'Web Application'
  const templateName = 'Web Application Testing Master'

  // Clean up existing template to avoid duplicates
  await prisma.checklistTemplate.deleteMany({
    where: { assessmentType }
  })

  const template = await prisma.checklistTemplate.create({
    data: {
      name: templateName,
      assessmentType: assessmentType,
    }
  })

  let currentCategoryId: string | null = null
  let categoryOrder = 1
  let itemOrder = 1

  // Helper to extract text from a cell which might be rich text
  const getCellText = (cell: any) => {
    const val = cell.value
    if (!val) return ''
    if (typeof val === 'string') return val.trim()
    if (val.richText) return val.richText.map((rt: any) => rt.text).join('').trim()
    return val.toString().trim()
  }

  for (let rowNumber = 4; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber)
    let col1 = getCellText(row.getCell(1))
    let col2 = getCellText(row.getCell(2))
    let col3 = getCellText(row.getCell(3))
    let col4 = getCellText(row.getCell(4))
    let col5 = getCellText(row.getCell(5))

    // It's a category header if col2 is 'Test Name' (the header row for the category)
    // Or if it's 'Description' (some headers have 'Description' in col2)
    if ((col2 === 'Test Name' || col2 === 'Description') && col1) {
      const category = await prisma.checklistCategory.create({
        data: {
          name: col1,
          order: categoryOrder++,
          templateId: template.id
        }
      })
      currentCategoryId = category.id
      itemOrder = 1
      console.log(`Created Category: ${col1}`)
    }
    // It's a test item if it's not a header and has some content
    else if (currentCategoryId && (col1 || col2)) {
      await prisma.checklistItem.create({
        data: {
          categoryId: currentCategoryId,
          code: col1.includes('-') ? col1 : `CUSTOM-${itemOrder}`,
          title: col1.includes('-') ? col2 : col1 || col2,
          description: col1.includes('-') ? col3 : col2 || col3,
          tools: col1.includes('-') ? col4 : col3 || col4,
          order: itemOrder++
        }
      })
    }
  }

  console.log(`Successfully created Template: ${template.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
