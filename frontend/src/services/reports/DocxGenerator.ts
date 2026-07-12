import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle } from 'docx'

export async function generateDocxReport(project: any): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'Vulnerability Assessment & Penetration Testing Report',
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Application: ${project.applicationName}`, bold: true, size: 28 }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Organization: ${project.organization}`, bold: true, size: 28 }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Date: ${new Date().toLocaleDateString()}`, bold: true, size: 28 }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 }
          }),

          new Paragraph({ text: '1. Executive Summary', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
          new Paragraph({
            text: 'This report documents the findings of the penetration test conducted on the specified application. It outlines the methodology used, vulnerabilities discovered, and actionable recommendations for remediation.',
          }),

          new Paragraph({ text: '2. Project Details', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Project Name')] }), new TableCell({ children: [new Paragraph(project.name)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('PO Number')] }), new TableCell({ children: [new Paragraph(project.poNumber || 'N/A')] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Environment')] }), new TableCell({ children: [new Paragraph(project.environment)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Target URL')] }), new TableCell({ children: [new Paragraph(project.targetUrl)] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Auditor')] }), new TableCell({ children: [new Paragraph(project.auditor?.name || 'N/A')] })] }),
            ]
          }),

          new Paragraph({ text: '3. Findings Summary', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Severity', bold: true })] })] }), new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Count', bold: true })] })] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Critical')] }), new TableCell({ children: [new Paragraph(String(project.findings?.filter((f: any) => f.severity === 'Critical').length || 0))] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('High')] }), new TableCell({ children: [new Paragraph(String(project.findings?.filter((f: any) => f.severity === 'High').length || 0))] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Medium')] }), new TableCell({ children: [new Paragraph(String(project.findings?.filter((f: any) => f.severity === 'Medium').length || 0))] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Low')] }), new TableCell({ children: [new Paragraph(String(project.findings?.filter((f: any) => f.severity === 'Low').length || 0))] })] }),
              new TableRow({ children: [new TableCell({ children: [new Paragraph('Informative')] }), new TableCell({ children: [new Paragraph(String(project.findings?.filter((f: any) => f.severity === 'Informative').length || 0))] })] }),
            ]
          }),

          new Paragraph({ text: '4. Detailed Findings', heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 }, pageBreakBefore: true }),
          ...(project.findings || []).map((finding: any, idx: number) => {
            return [
              new Paragraph({ text: `4.${idx + 1} ${finding.title}`, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 100 } }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({ children: [new TableCell({ children: [new Paragraph('Severity')] }), new TableCell({ children: [new Paragraph(finding.severity)] })] }),
                  new TableRow({ children: [new TableCell({ children: [new Paragraph('Description')] }), new TableCell({ children: [new Paragraph(finding.description || 'N/A')] })] }),
                  new TableRow({ children: [new TableCell({ children: [new Paragraph('Recommendation')] }), new TableCell({ children: [new Paragraph(finding.recommendation || 'N/A')] })] }),
                ]
              })
            ]
          }).flat()
        ]
      }
    ]
  })

  const b64string = await Packer.toBase64String(doc)
  return Buffer.from(b64string, 'base64')
}
