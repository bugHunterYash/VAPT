import ExcelJS from 'exceljs'
import path from 'path'

async function main() {
  const filePath = path.join(process.cwd(), 'storage/templates/web_application/1783837702416-WAPT Checklist 1.xlsx')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)

  const worksheet = workbook.worksheets[0]
  console.log(`Worksheet Name: ${worksheet.name}`)
  
  let rowCount = 0
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 84) {
      console.log(`Row ${rowNumber}:`, row.values)
    }
    rowCount++
  })
  console.log(`Total rows: ${rowCount}`)
}

main().catch(console.error)
