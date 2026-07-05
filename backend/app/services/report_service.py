import os
from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT

def generate_docx_report(project, findings) -> str:
    """
    Generates a professional VAPT DOCX report.
    Returns the file path of the generated report.
    """
    doc = Document()
    
    # Cover Page
    title = doc.add_paragraph("Vulnerability Assessment & Penetration Testing Report")
    title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    title.runs[0].font.size = Pt(24)
    title.runs[0].bold = True
    
    doc.add_paragraph(f"\n\nProject: {project.name}", style='Heading 1')
    doc.add_paragraph(f"Target: {project.application_url or project.ip_address}")
    doc.add_paragraph(f"Assessment Type: {project.assessment_type}")
    doc.add_page_break()
    
    # Executive Summary
    doc.add_heading("1. Executive Summary", level=1)
    doc.add_paragraph("This report outlines the security posture of the assessed environment. The assessment was performed using industry-standard methodologies (e.g., OWASP Top 10) to identify vulnerabilities and risks.")
    
    # Findings Summary
    doc.add_heading("2. Vulnerability Summary", level=1)
    table = doc.add_table(rows=1, cols=3)
    table.style = 'Table Grid'
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = 'Title'
    hdr_cells[1].text = 'Severity'
    hdr_cells[2].text = 'Status'
    
    for finding in findings:
        row_cells = table.add_row().cells
        row_cells[0].text = finding.title
        row_cells[1].text = finding.severity or "Unknown"
        row_cells[2].text = finding.status or "Open"
        
    doc.add_page_break()
    
    # Detailed Findings
    doc.add_heading("3. Detailed Findings", level=1)
    for idx, finding in enumerate(findings, 1):
        doc.add_heading(f"3.{idx} {finding.title}", level=2)
        
        p = doc.add_paragraph()
        p.add_run("Severity: ").bold = True
        p.add_run(f"{finding.severity or 'N/A'}\n")
        p.add_run("Category: ").bold = True
        p.add_run(f"{finding.category or 'N/A'}\n")
        
        doc.add_heading("Description", level=3)
        doc.add_paragraph(finding.description or "No description provided.")
        
        doc.add_heading("Business Impact", level=3)
        doc.add_paragraph(finding.business_impact or "No impact provided.")
        
        doc.add_heading("Mitigation", level=3)
        doc.add_paragraph(finding.mitigation or "No mitigation provided.")
        
        doc.add_paragraph("\n")
        
    os.makedirs("generated_reports", exist_ok=True)
    file_path = f"generated_reports/Report_Project_{project.id}.docx"
    doc.save(file_path)
    return file_path
