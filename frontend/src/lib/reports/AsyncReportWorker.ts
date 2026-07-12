import { prisma } from "@/lib/prisma";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, convertInchesToTwip } from "docx";
import fs from "fs";
import path from "path";
import sizeOf from "image-size";

export class AsyncReportWorker {
  static async runAsyncReportGeneration(projectId: string, reportId: string, generatedById: string) {
    console.log(`[AsyncReportWorker] Starting template-based generation for project ${projectId}, report ${reportId}`);
    
    try {
      // 1. Fetch all necessary data including Evidences
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          findings: {
            include: {
              evidences: {
                orderBy: { order: 'asc' }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          checklists: true,
        },
      });

      if (!project) throw new Error("Project not found");

      // 2. Pure Template Engine Assembly (No AI)
      
      const docxChildren: any[] = [
        // Cover Page
        new Paragraph({ text: "Vulnerability Assessment Report", heading: HeadingLevel.TITLE }),
        new Paragraph({ text: `Application: ${project.applicationName}`, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `Organization: ${project.organization}`, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `Classification: ${project.classification || 'Confidential'}`, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: `Date: ${new Date().toLocaleDateString()}`, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "\n", pageBreakBefore: true }),
        
        // Document Control
        new Paragraph({ text: "Document Control", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: `Version: ${project.version || '1.0'}` }),
        new Paragraph({ text: `Auditor ID: ${project.auditorId}` }),
        new Paragraph({ text: `Reviewer ID: ${project.reviewerId}` }),
        new Paragraph({ text: `Start Date: ${project.assessmentStartDate ? project.assessmentStartDate.toLocaleDateString() : 'N/A'}` }),
        new Paragraph({ text: `End Date: ${project.assessmentEndDate ? project.assessmentEndDate.toLocaleDateString() : 'N/A'}` }),
        new Paragraph({ text: "\n", pageBreakBefore: true }),
        
        // Scope
        new Paragraph({ text: "Scope", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: `Target URL: ${project.targetUrl}` }),
        new Paragraph({ text: `Assessment Type: ${project.assessmentType}` }),
        new Paragraph({ text: "\n", pageBreakBefore: true }),
        
        // Findings
        new Paragraph({ text: "Detailed Findings", heading: HeadingLevel.HEADING_1 }),
      ];

      docxChildren.push(new Paragraph({ text: "\n" }));

      let findingIndex = 1;
      for (const f of project.findings) {
        
        // Finding Title Heading (e.g. 5.1 SQL Injection)
        docxChildren.push(
          new Paragraph({ text: `5.${findingIndex} ${f.title}`, heading: HeadingLevel.HEADING_2 })
        );

        // Helper to create table rows
        const createRow = (label: string, value: string | null) => {
          const valText = value || 'N/A';
          const lines = valText.split('\n');
          
          return new TableRow({
            children: [
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                shading: { fill: "F3F4F6" }, // Light grey header
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })]
              }),
              new TableCell({
                width: { size: 75, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 100, right: 100 },
                children: lines.map(line => new Paragraph({ text: line }))
              })
            ]
          });
        };

        // Affected URLs
        let urlValue = f.affectedUrls || 'N/A';

        // Table strictly styled for Enterprise reports
        const table = new Table({
          columnWidths: [convertInchesToTwip(1.625), convertInchesToTwip(4.875)], // Fixed widths (total 6.5 inches)
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" }, // lighter grey inside
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D1D5DB" },
          },
          rows: [
            createRow("Vulnerability Name", f.title),
            createRow("Description", f.description),
            createRow("CWE ID", f.cwe),
            createRow("Severity", f.severity),
            createRow("OWASP Mapping", f.owasp),
            createRow("Affected URL(s)", urlValue),
            createRow("Mitigation", f.recommendation),
          ],
        });

        docxChildren.push(table);
        docxChildren.push(new Paragraph({ text: "\n" }));

        // Inject Evidence Images
        if (f.evidences && f.evidences.length > 0) {
          docxChildren.push(new Paragraph({ text: "Evidence", heading: HeadingLevel.HEADING_3 }));
          for (let i = 0; i < f.evidences.length; i++) {
            const ev = f.evidences[i];
            
            // Extract exact filename from URL. Example: /api/evidence-files/123_image.jpg -> 123_image.jpg
            const urlParts = ev.filePath.split('/');
            const filename = urlParts[urlParts.length - 1];
            
            const absolutePath = path.join(process.cwd(), 'uploads', 'evidence', filename);

            if (fs.existsSync(absolutePath)) {
              try {
                const imageBuffer = fs.readFileSync(absolutePath);
                
                // Get image dimensions to scale proportionally
                const dimensions = sizeOf(imageBuffer);
                let finalWidth = dimensions.width || 600;
                let finalHeight = dimensions.height || 400;

                const MAX_WIDTH = 600; // max px width to fit A4 DOCX page
                if (finalWidth > MAX_WIDTH) {
                  const ratio = MAX_WIDTH / finalWidth;
                  finalWidth = MAX_WIDTH;
                  finalHeight = finalHeight * ratio;
                }

                // Determine extension for image type
                const ext = path.extname(filename).toLowerCase();
                let type: "jpg" | "png" | "gif" | "bmp" = "png";
                if (ext === ".jpg" || ext === ".jpeg") type = "jpg";
                if (ext === ".gif") type = "gif";
                if (ext === ".bmp") type = "bmp";

                docxChildren.push(
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new ImageRun({
                        data: imageBuffer,
                        transformation: {
                          width: finalWidth,
                          height: finalHeight,
                        },
                        type, // explicitly set type
                      }),
                    ],
                  })
                );
                
                // Caption centered under image
                docxChildren.push(
                  new Paragraph({ 
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ text: `Figure ${i + 1}: `, bold: true }),
                      new TextRun({ text: ev.caption || 'Attached Evidence', italics: true })
                    ] 
                  })
                );
                docxChildren.push(new Paragraph({ text: "\n" }));
              } catch (imgError) {
                console.error(`Error processing image ${absolutePath}:`, imgError);
                docxChildren.push(new Paragraph({ text: `[Error rendering image: ${ev.filePath}]` }));
              }
            } else {
              console.warn(`[AsyncReportWorker] Missing image file: ${absolutePath}`);
            }
          }
        }

        // Add page break for all but the last finding
        if (findingIndex < project.findings.length) {
          docxChildren.push(new Paragraph({ text: "", pageBreakBefore: true }));
        }
        
        findingIndex++;
      }

      // 3. Assemble final DOCX
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docxChildren,
          },
        ],
      });

      // 4. Save DOCX
      const buffer = await Packer.toBuffer(doc);
      
      const reportsDir = path.join(process.cwd(), "uploads", "reports");
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }
      
      const fileName = `Report_${project.applicationName.replace(/\s+/g, "_")}_${Date.now()}.docx`;
      const filePath = path.join(reportsDir, fileName);
      fs.writeFileSync(filePath, buffer);

      // 5. Update DB
      await prisma.reportHistory.update({
        where: { id: reportId },
        data: {
          status: "Ready",
          filePath: fileName,
        },
      });

      console.log(`[AsyncReportWorker] Successfully generated report ${reportId}`);

    } catch (error: any) {
      console.error(`[AsyncReportWorker] Error generating report ${reportId}:`, error);
      
      try {
        await prisma.reportHistory.update({
          where: { id: reportId },
          data: { status: "Failed" },
        });
      } catch (dbError) {
        console.error("Failed to update report status to Failed:", dbError);
      }
    }
  }
}
