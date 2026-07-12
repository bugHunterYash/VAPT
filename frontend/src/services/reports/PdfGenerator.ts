const PdfPrinter = require('pdfmake')
import { TDocumentDefinitions } from 'pdfmake/interfaces'

export async function generatePdfReport(project: any): Promise<Buffer> {
  const fonts = {
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  }

  const printer = new PdfPrinter(fonts)

  const docDefinition: TDocumentDefinitions = {
    defaultStyle: {
      font: 'Helvetica'
    },
    content: [
      { text: 'Vulnerability Assessment & Penetration Testing Report', style: 'header' },
      { text: `Application: ${project.applicationName}`, style: 'subheader' },
      { text: `Organization: ${project.organization}`, style: 'subheader' },
      { text: `Date: ${new Date().toLocaleDateString()}`, style: 'subheader' },
      '\n',
      { text: '1. Executive Summary', style: 'sectionHeader' },
      { text: 'This report documents the findings of the penetration test conducted on the specified application. It outlines the methodology used, vulnerabilities discovered, and actionable recommendations for remediation.', margin: [0, 5, 0, 15] },
      
      { text: '2. Project Details', style: 'sectionHeader' },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            ['Project Name', project.name],
            ['PO Number', project.poNumber || 'N/A'],
            ['Environment', project.environment],
            ['Target URL', project.targetUrl],
            ['Auditor', project.auditor?.name || 'N/A'],
            ['Reviewer', project.reviewer?.name || 'N/A']
          ]
        },
        margin: [0, 5, 0, 15]
      },

      { text: '3. Findings Summary', style: 'sectionHeader' },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto'],
          body: [
            [{ text: 'Severity', bold: true }, { text: 'Count', bold: true }],
            ['Critical', project.findings?.filter((f: any) => f.severity === 'Critical').length || 0],
            ['High', project.findings?.filter((f: any) => f.severity === 'High').length || 0],
            ['Medium', project.findings?.filter((f: any) => f.severity === 'Medium').length || 0],
            ['Low', project.findings?.filter((f: any) => f.severity === 'Low').length || 0],
            ['Informative', project.findings?.filter((f: any) => f.severity === 'Informative').length || 0],
          ]
        },
        margin: [0, 5, 0, 15]
      },

      { text: '4. Detailed Findings', style: 'sectionHeader', pageBreak: 'before' },
      ...(project.findings || []).map((finding: any, idx: number) => {
        return [
          { text: `4.${idx + 1} ${finding.title}`, style: 'findingHeader' },
          {
            table: {
              widths: ['25%', '75%'],
              body: [
                ['Severity', finding.severity],
                ['Status', finding.status],
                ['Description', finding.description || 'N/A'],
                ['CVSS', finding.cvss || 'N/A'],
                ['CWE', finding.cwe || 'N/A'],
                ['OWASP', finding.owasp || 'N/A'],
                ['Affected URLs', finding.affectedUrls || 'N/A'],
                ['Recommendation', finding.recommendation || 'N/A']
              ]
            },
            margin: [0, 5, 0, 15]
          }
        ]
      }).flat(),

      { text: '5. Assessment Checklist', style: 'sectionHeader', pageBreak: 'before' },
      {
        table: {
          headerRows: 1,
          widths: ['20%', '40%', '20%', '20%'],
          body: [
            [{ text: 'Code', bold: true }, { text: 'Title', bold: true }, { text: 'Result', bold: true }, { text: 'Remarks', bold: true }],
            ...(project.checklists || []).map((c: any) => [
              c.code,
              c.title,
              c.result,
              c.remark || 'N/A'
            ])
          ]
        }
      }
    ],
    styles: {
      header: {
        fontSize: 22,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 14,
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 5]
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      findingHeader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
        color: '#b91c1c' // red-700
      }
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition)
      const chunks: Buffer[] = []

      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk))
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)))
      pdfDoc.on('error', (err: Error) => reject(err))

      pdfDoc.end()
    } catch (error) {
      reject(error)
    }
  })
}
