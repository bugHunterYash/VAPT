import ExcelJS from 'exceljs'

export async function generateExcelReport(project: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = project.auditor?.name || 'VAPT Platform'
  workbook.created = new Date()

  // Sheet 1: Executive Summary
  const summarySheet = workbook.addWorksheet('Executive Summary')
  summarySheet.getColumn(1).width = 100
  summarySheet.addRow(['Vulnerability Assessment & Penetration Testing Report'])
  summarySheet.getCell('A1').font = { bold: true, size: 16 }
  summarySheet.addRow([])
  summarySheet.addRow(['This report documents the findings of the penetration test conducted on the specified application.'])

  // Sheet 2: Project Information
  const infoSheet = workbook.addWorksheet('Project Information')
  infoSheet.columns = [
    { header: 'Property', key: 'prop', width: 30 },
    { header: 'Value', key: 'val', width: 50 }
  ]
  infoSheet.getRow(1).font = { bold: true }
  infoSheet.addRow({ prop: 'Project Name', val: project.name })
  infoSheet.addRow({ prop: 'PO Number', val: project.poNumber || 'N/A' })
  infoSheet.addRow({ prop: 'Environment', val: project.environment })
  infoSheet.addRow({ prop: 'Target URL', val: project.targetUrl })
  infoSheet.addRow({ prop: 'Auditor', val: project.auditor?.name || 'N/A' })
  infoSheet.addRow({ prop: 'Reviewer', val: project.reviewer?.name || 'N/A' })

  // Sheet 3: Assessment Checklist
  const checklistSheet = workbook.addWorksheet('Assessment Checklist')
  checklistSheet.columns = [
    { header: 'Code', key: 'code', width: 15 },
    { header: 'Category', key: 'cat', width: 25 },
    { header: 'Title', key: 'title', width: 50 },
    { header: 'Result', key: 'result', width: 15 },
    { header: 'Remark', key: 'remark', width: 60 }
  ]
  checklistSheet.getRow(1).font = { bold: true }
  
  ;(project.checklists || []).forEach((c: any) => {
    checklistSheet.addRow({
      code: c.code,
      cat: c.categoryName,
      title: c.title,
      result: c.result,
      remark: c.remark || ''
    })
  })

  // Sheet 4: Findings
  const findingsSheet = workbook.addWorksheet('Findings')
  findingsSheet.columns = [
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Severity', key: 'sev', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'CVSS', key: 'cvss', width: 15 },
    { header: 'CWE', key: 'cwe', width: 15 },
    { header: 'OWASP', key: 'owasp', width: 20 },
    { header: 'Affected Assets', key: 'assets', width: 40 },
    { header: 'Description', key: 'desc', width: 60 },
  ]
  findingsSheet.getRow(1).font = { bold: true }

  ;(project.findings || []).forEach((f: any) => {
    findingsSheet.addRow({
      title: f.title,
      sev: f.severity,
      status: f.status,
      cvss: f.cvss || 'N/A',
      cwe: f.cwe || 'N/A',
      owasp: f.owasp || 'N/A',
      assets: f.affectedUrls || 'N/A',
      desc: f.description || 'N/A'
    })
  })

  // Sheet 5: Statistics
  const statsSheet = workbook.addWorksheet('Statistics')
  statsSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Count', key: 'count', width: 15 }
  ]
  statsSheet.getRow(1).font = { bold: true }

  const findings = project.findings || []
  statsSheet.addRow({ metric: 'Critical', count: findings.filter((f: any) => f.severity === 'Critical').length })
  statsSheet.addRow({ metric: 'High', count: findings.filter((f: any) => f.severity === 'High').length })
  statsSheet.addRow({ metric: 'Medium', count: findings.filter((f: any) => f.severity === 'Medium').length })
  statsSheet.addRow({ metric: 'Low', count: findings.filter((f: any) => f.severity === 'Low').length })
  statsSheet.addRow({ metric: 'Informative', count: findings.filter((f: any) => f.severity === 'Informative').length })
  
  const totalChecks = project.checklists?.length || 0
  const completedChecks = project.checklists?.filter((c: any) => c.result !== 'Not Started').length || 0
  const completionPct = totalChecks ? Math.round((completedChecks / totalChecks) * 100) : 0
  statsSheet.addRow({ metric: 'Checklist Completion %', count: `${completionPct}%` })

  const buffer = await workbook.xlsx.writeBuffer()
  return buffer as Buffer
}
