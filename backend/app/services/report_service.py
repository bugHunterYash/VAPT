import io
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from app.services.storage_service import get_evidence_bytes

def add_evidence_image(doc, file_path, caption):
    try:
        # file_path might be "vmt-evidence/unique_filename.png"
        image_bytes = get_evidence_bytes(file_path)
        img_stream = io.BytesIO(image_bytes)
        doc.add_picture(img_stream, width=Inches(5.5))
        if caption:
            p = doc.add_paragraph(caption)
            p.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
            p.runs[0].font.italic = True
    except Exception as e:
        doc.add_paragraph(f"[Missing Image: {file_path}]")
        print(f"Error adding image {file_path}: {e}")

def generate_docx_report(project_data: dict) -> io.BytesIO:
    """
    Generates a professional VAPT DOCX report.
    Returns the BytesIO buffer of the generated report.
    """
    doc = Document()
    
    # Cover Page
    title = doc.add_paragraph("Vulnerability Assessment & Penetration Testing Report")
    title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    title.runs[0].font.size = Pt(28)
    title.runs[0].bold = True
    
    doc.add_paragraph("\n\n")
    p1 = doc.add_paragraph(f"Application: {project_data.get('applicationName', project_data.get('name', ''))}")
    p1.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    p1.runs[0].font.size = Pt(20)
    p1.runs[0].bold = True
    
    p2 = doc.add_paragraph(f"Organization: {project_data.get('organization', '')}")
    p2.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    p2.runs[0].font.size = Pt(18)
    
    doc.add_page_break()
    
    # Executive Summary
    doc.add_heading("1. Executive Summary", level=1)
    doc.add_paragraph(
        "This report outlines the security posture of the assessed environment. "
        "The assessment was performed using industry-standard methodologies to identify vulnerabilities and risks."
    )
    
    # Findings Summary
    doc.add_heading("2. Vulnerability Summary", level=1)
    
    findings = project_data.get("findings", [])
    
    table = doc.add_table(rows=1, cols=3)
    table.style = 'Table Grid'
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = 'Title'
    hdr_cells[1].text = 'Severity'
    hdr_cells[2].text = 'OWASP Category'
    
    for f in findings:
        row_cells = table.add_row().cells
        row_cells[0].text = f.get('title', '')
        row_cells[1].text = f.get('severity', '')
        row_cells[2].text = f.get('owasp', '')
        
    doc.add_page_break()
    
    # Detailed Findings
    doc.add_heading("3. Detailed Findings", level=1)
    
    # Global figure numbering
    figure_counter = 1
    
    for idx, finding in enumerate(findings, 1):
        doc.add_heading(f"5.{idx}.1 Testing for {finding.get('owasp', 'N/A')}", level=2)
        doc.add_heading(finding.get('title', 'Unknown Vulnerability'), level=3)
        
        # Create the finding table
        table = doc.add_table(rows=7, cols=2)
        table.style = 'Table Grid'
        
        def set_row(row_idx, label, value):
            cells = table.rows[row_idx].cells
            cells[0].text = label
            cells[0].paragraphs[0].runs[0].bold = True
            cells[1].text = str(value) if value else "N/A"
            return cells[1]
            
        set_row(0, "Vulnerability Name", finding.get('title', 'Unknown'))
        set_row(1, "Description", finding.get('description', 'No description provided.'))
        
        cwe_val = finding.get('cwe', '')
        if cwe_val and not cwe_val.upper().startswith('CWE-'):
            cwe_val = f"CWE-{cwe_val}"
        set_row(2, "CWE ID", cwe_val or 'N/A')
        
        set_row(3, "Severity", finding.get('severity', 'N/A'))
        
        # Affected URLs
        urls = finding.get('affectedUrls', '')
        url_cell = set_row(4, "Affected URL", "")
        if urls:
            url_cell.text = ""
            for i, url in enumerate([u.strip() for u in urls.split('\n') if u.strip()]):
                if i > 0:
                    url_cell.add_paragraph(url)
                else:
                    url_cell.paragraphs[0].text = url
        
        set_row(5, "Impact", finding.get('impact', 'No impact provided.'))
        
        # Mitigation (list)
        mitigation_cell = set_row(6, "Mitigation", "")
        mitigation_data = finding.get('mitigation', [])
        mitigation_cell.text = ""
        
        if isinstance(mitigation_data, list):
            for i, item in enumerate(mitigation_data):
                p = mitigation_cell.add_paragraph(item, style='List Bullet')
                if i == 0 and not mitigation_cell.paragraphs[0].text:
                    p_element = mitigation_cell.paragraphs[0]._element
                    p_element.getparent().remove(p_element)
                    p_element.p = p_element.p = None
        else:
            mitigation_cell.paragraphs[0].text = str(mitigation_data)
        
        # Set column widths
        for row in table.rows:
            row.cells[0].width = Inches(1.5)
            row.cells[1].width = Inches(5.0)

        doc.add_paragraph() # Spacing
        
        evidences = finding.get('evidences', [])
        if evidences:
            for ev in evidences:
                file_path = ev.get('filePath')
                if file_path:
                    ev_caption = ev.get('caption', '').strip()
                    caption = f"Figure {figure_counter}: {ev_caption}" if ev_caption else f"Figure {figure_counter}"
                    add_evidence_image(doc, file_path, caption)
                    figure_counter += 1
        
        doc.add_page_break()
        
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer


def generate_excel_report(project_data: dict) -> io.BytesIO:
    """
    Generates an Excel Tracker sheet for findings.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Vulnerability Tracker"
    
    headers = [
        "S. No.", "Vulnerability", "OWASP Mapping", "Description", 
        "Vulnerable URL", "Severity", "Risk/Impact", "Mitigation"
    ]
    
    ws.append(headers)
    
    # Styling headers
    header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    border = Border(
        left=Side(style='thin'), right=Side(style='thin'), 
        top=Side(style='thin'), bottom=Side(style='thin')
    )
    
    for col in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border
        
    findings = project_data.get("findings", [])
    
    for idx, finding in enumerate(findings, 2):
        ws.cell(row=idx, column=1, value=idx-1).border = border
        ws.cell(row=idx, column=2, value=finding.get('title', '')).border = border
        ws.cell(row=idx, column=3, value=finding.get('owasp', '')).border = border
        ws.cell(row=idx, column=4, value=str(finding.get('description', ''))).border = border
        ws.cell(row=idx, column=5, value=finding.get('affectedUrls', '')).border = border
        
        # Severity coloring
        sev = finding.get('severity', '')
        sev_cell = ws.cell(row=idx, column=6, value=sev)
        sev_cell.border = border
        if sev == "Critical":
            sev_cell.fill = PatternFill(start_color="FF0000", end_color="FF0000", fill_type="solid")
            sev_cell.font = Font(color="FFFFFF")
        elif sev == "High":
            sev_cell.fill = PatternFill(start_color="FF9900", end_color="FF9900", fill_type="solid")
        elif sev == "Medium":
            sev_cell.fill = PatternFill(start_color="FFFF00", end_color="FFFF00", fill_type="solid")
        elif sev == "Low":
            sev_cell.fill = PatternFill(start_color="92D050", end_color="92D050", fill_type="solid")
        
        ws.cell(row=idx, column=7, value=str(finding.get('impact', ''))).border = border
        
        mitigation_data = finding.get('mitigation', '')
        if isinstance(mitigation_data, list):
            mitigation_val = "\n".join(str(m) for m in mitigation_data)
        else:
            mitigation_val = str(mitigation_data)
        
        ws.cell(row=idx, column=8, value=mitigation_val).border = border
        
    # Adjust column widths
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(cell.value)
            except:
                pass
        adjusted_width = min(max_length + 2, 50) # Cap at 50
        ws.column_dimensions[column].width = adjusted_width

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer
