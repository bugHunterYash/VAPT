import io
import json
import datetime
import os
import subprocess
import tempfile
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT, WD_BREAK
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
import matplotlib.pyplot as plt
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from app.services.storage_service import get_evidence_bytes

def add_evidence_image(doc, file_path, caption, max_width_inches=6.0):
    try:
        image_bytes = get_evidence_bytes(file_path)
        img_stream = io.BytesIO(image_bytes)
        doc.add_picture(img_stream, width=Inches(max_width_inches))
        if caption:
            p = doc.add_paragraph(caption)
            p.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
            p.runs[0].font.italic = True
    except Exception as e:
        doc.add_paragraph(f"[Missing Image: {file_path}]")
        print(f"Error adding image {file_path}: {e}")

def add_toc(doc):
    p = doc.add_paragraph()
    run = p.add_run()
    fldChar1 = OxmlElement('w:fldChar')
    fldChar1.set(qn('w:fldCharType'), 'begin')
    instrText = OxmlElement('w:instrText')
    instrText.set(qn('xml:space'), 'preserve')
    instrText.text = 'TOC \\o "1-3" \\h \\z \\u'
    fldChar2 = OxmlElement('w:fldChar')
    fldChar2.set(qn('w:fldCharType'), 'separate')
    fldChar3 = OxmlElement('w:fldChar')
    fldChar3.set(qn('w:fldCharType'), 'end')
    
    r_element = run._r
    r_element.append(fldChar1)
    r_element.append(instrText)
    r_element.append(fldChar2)
    r_element.append(fldChar3)

def generate_severity_chart(counts: dict) -> io.BytesIO:
    labels = ['Critical', 'High', 'Medium', 'Low', 'Informative']
    values = [counts.get('Critical', 0), counts.get('High', 0), counts.get('Medium', 0), counts.get('Low', 0), counts.get('Info', counts.get('Informative', 0))]
    colors = ['#FF0000', '#FF9900', '#FFFF00', '#0070C0', '#BFBFBF']
    
    fig, ax = plt.subplots(figsize=(7, 4))
    bars = ax.bar(labels, values, color=colors, edgecolor='black', linewidth=0.5)
    ax.set_ylabel('Number of Findings', fontweight='bold')
    ax.set_title('Vulnerability Severity Overview', fontweight='bold', pad=15)
    ax.grid(axis='y', linestyle='--', alpha=0.7)
    
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height + 0.1, f'{int(height)}', ha='center', va='bottom', fontweight='bold')
        
    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=300)
    buf.seek(0)
    plt.close()
    return buf

def apply_heading_style(doc, level, text):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.color.rgb = RGBColor(31, 78, 120) # Professional Blue
    return h

def generate_docx_report(project_data: dict) -> io.BytesIO:
    doc = Document()
    
    meta = project_data.get('reportMeta', {})
    if not meta: meta = {}
    team = project_data.get('teamMembers', [])
    findings = project_data.get('findings', [])
    
    app_name = project_data.get('applicationName', project_data.get('name', 'N/A'))
    report_title = meta.get('reportTitle') or "Vulnerability Assessment & Penetration Testing Report"
    org_name = meta.get('organization') or "Organization"
    
    counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0, "Info": 0}
    owasp_counts = {}
    for f in findings:
        sev = f.get('severity', 'Info')
        if sev == 'Informative': sev = 'Info'
        counts[sev] = counts.get(sev, 0) + 1
        
        owasp = f.get('owasp', 'Other')
        if not owasp: owasp = 'Other'
        if owasp not in owasp_counts: owasp_counts[owasp] = {"Critical":0, "High":0, "Medium":0, "Low":0, "Info":0}
        owasp_counts[owasp][sev] += 1
    
    # 01. COVER PAGE
    for _ in range(5): doc.add_paragraph()
    t_para = doc.add_paragraph(report_title)
    t_para.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    t_para.runs[0].font.size = Pt(28)
    t_para.runs[0].bold = True
    t_para.runs[0].font.color.rgb = RGBColor(31, 78, 120)
    
    doc.add_paragraph("\n")
    p_app = doc.add_paragraph(f"Target: {app_name}")
    p_app.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    p_app.runs[0].font.size = Pt(18)
    p_app.runs[0].bold = True
    
    doc.add_paragraph("\n\n\n\n")
    p_org = doc.add_paragraph(f"Prepared For:\n{org_name}")
    p_org.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    p_org.runs[0].font.size = Pt(16)
    p_org.runs[0].bold = True
    
    date_str = meta.get('documentDate', '')
    if date_str: date_str = date_str.split('T')[0]
    p_date = doc.add_paragraph(f"\nDate: {date_str}")
    p_date.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    p_date.runs[0].font.size = Pt(14)
    
    doc.add_page_break()
    
    # 02. DOCUMENT DETAILS
    apply_heading_style(doc, 1, "Document Details")
    t1 = doc.add_table(rows=5, cols=2)
    t1.style = 'Table Grid'
    t1.cell(0,0).text = "Project Name"
    t1.cell(0,1).text = app_name
    t1.cell(1,0).text = "Prepared By"
    t1.cell(1,1).text = meta.get('preparedBy', '')
    t1.cell(2,0).text = "Reviewed By"
    t1.cell(2,1).text = meta.get('reviewedBy', '')
    t1.cell(3,0).text = "Approved By"
    t1.cell(3,1).text = meta.get('approvedBy', '')
    t1.cell(4,0).text = "Released By"
    t1.cell(4,1).text = meta.get('releasedBy', '')
    for r in t1.rows: r.cells[0].paragraphs[0].runs[0].bold = True
    doc.add_paragraph("\n")
    
    doc.add_heading("Revision History", level=2)
    t2 = doc.add_table(rows=2, cols=4)
    t2.style = 'Table Grid'
    t2.cell(0,0).text = "Version"
    t2.cell(0,1).text = "Date"
    t2.cell(0,2).text = "Description"
    t2.cell(0,3).text = "Author"
    for cell in t2.rows[0].cells: cell.paragraphs[0].runs[0].bold = True
    t2.cell(1,0).text = project_data.get('version', '1.0')
    t2.cell(1,1).text = date_str
    t2.cell(1,2).text = "Initial Release"
    t2.cell(1,3).text = meta.get('preparedBy', '')
    doc.add_page_break()
    
    # 03. DECLARATION
    apply_heading_style(doc, 1, "Declaration")
    doc.add_paragraph(
        f"This report contains sensitive and confidential information regarding the security posture of {app_name}. "
        "It is intended for the exclusive use of the authorized personnel. Distribution, reproduction, or sharing of this document "
        "without explicit consent is strictly prohibited. The findings represent a point-in-time assessment based on the scope defined."
    )
    doc.add_page_break()
    
    # 04. TABLE OF CONTENTS
    apply_heading_style(doc, 1, "Table of Contents")
    add_toc(doc)
    doc.add_page_break()
    
    # 05. INTRODUCTION
    apply_heading_style(doc, 1, "1. Introduction")
    apply_heading_style(doc, 2, "1.1 Objective")
    doc.add_paragraph(
        f"The primary objective of this assessment was to identify, analyze, and report security vulnerabilities present in {app_name}. "
        "This evaluation aims to provide an actionable understanding of the risks and recommendations for remediation."
    )
    doc.add_page_break()
    
    # 06. DETAILS OF AUDITING TEAM
    apply_heading_style(doc, 1, "2. Details of the Auditing Team")
    if team:
        tt = doc.add_table(rows=len(team)+1, cols=4)
        tt.style = 'Table Grid'
        tt.cell(0,0).text = "S.No"
        tt.cell(0,1).text = "Name"
        tt.cell(0,2).text = "Designation"
        tt.cell(0,3).text = "Qualifications"
        for cell in tt.rows[0].cells: cell.paragraphs[0].runs[0].bold = True
        
        for i, m in enumerate(team, 1):
            tt.cell(i,0).text = str(i)
            tt.cell(i,1).text = m.get('name', '')
            tt.cell(i,2).text = m.get('designation', '')
            tt.cell(i,3).text = m.get('qualifications', '')
    else:
        doc.add_paragraph("No team details provided.")
    doc.add_page_break()
    
    # 07. EXECUTIVE SUMMARY
    apply_heading_style(doc, 1, "3. Executive Summary")
    doc.add_paragraph(
        f"A comprehensive security assessment was conducted on {app_name}. The assessment revealed a total of {len(findings)} findings."
    )
    
    apply_heading_style(doc, 2, "3.1 Summary of Findings")
    chart_buf = generate_severity_chart(counts)
    doc.add_picture(chart_buf, width=Inches(6.0))
    
    apply_heading_style(doc, 2, "3.2 Scope of Security Assessment")
    ts = doc.add_table(rows=2, cols=2)
    ts.style = 'Table Grid'
    ts.cell(0,0).text = "Application URL / IP"
    ts.cell(0,0).paragraphs[0].runs[0].bold = True
    ts.cell(0,1).text = project_data.get('targetUrl', project_data.get('targetIp', ''))
    
    if meta.get('includeCredentials'):
        ts.cell(1,0).text = "Test Credentials"
        ts.cell(1,0).paragraphs[0].runs[0].bold = True
        ts.cell(1,1).text = f"Username: {meta.get('appUsername', 'N/A')} \nPassword: {meta.get('appPassword', 'N/A')}"
    else:
        ts.cell(1,0).text = "Test Credentials"
        ts.cell(1,0).paragraphs[0].runs[0].bold = True
        ts.cell(1,1).text = "Not provided / Not applicable"
        
    apply_heading_style(doc, 2, "3.3 Vulnerabilities Overview")
    tvo = doc.add_table(rows=len(owasp_counts)+1, cols=6)
    tvo.style = 'Table Grid'
    tvo_headers = ["OWASP Category", "Critical", "High", "Medium", "Low", "Info"]
    for i, h in enumerate(tvo_headers):
        tvo.cell(0,i).text = h
        tvo.cell(0,i).paragraphs[0].runs[0].bold = True
    
    for row_idx, (cat, cat_counts) in enumerate(owasp_counts.items(), 1):
        tvo.cell(row_idx, 0).text = cat
        tvo.cell(row_idx, 1).text = str(cat_counts['Critical'])
        tvo.cell(row_idx, 2).text = str(cat_counts['High'])
        tvo.cell(row_idx, 3).text = str(cat_counts['Medium'])
        tvo.cell(row_idx, 4).text = str(cat_counts['Low'])
        tvo.cell(row_idx, 5).text = str(cat_counts['Info'])
    doc.add_page_break()
    
    # 08. APPROACH
    apply_heading_style(doc, 1, "4. Approach")
    apply_heading_style(doc, 2, "4.1 Testing Methodology")
    doc.add_paragraph("The assessment was performed in the following phases: \n1. Planning\n2. Discovery\n3. Attack\n4. Review & Analysis\n5. Reporting")
    
    apply_heading_style(doc, 2, "4.2 Tools Used")
    doc.add_paragraph("Industry standard commercial and open-source security testing tools were utilized alongside manual verification techniques.")
    doc.add_page_break()
    
    # 09. VULNERABILITY DISCOVERED
    apply_heading_style(doc, 1, "5. Vulnerability Discovered & Proof of Concept")
    apply_heading_style(doc, 2, f"5.1 {app_name}")
    
    # Counter table
    tc = doc.add_table(rows=2, cols=5)
    tc.style = 'Table Grid'
    c_heads = ["Critical", "High", "Medium", "Low", "Informative"]
    c_vals = [counts['Critical'], counts['High'], counts['Medium'], counts['Low'], counts['Info']]
    for i, h in enumerate(c_heads):
        tc.cell(0,i).text = h
        tc.cell(0,i).paragraphs[0].runs[0].bold = True
        tc.cell(1,i).text = str(c_vals[i])
        
    doc.add_paragraph("\n")
    figure_counter = 1
    
    for idx, finding in enumerate(findings, 1):
        apply_heading_style(doc, 3, f"5.1.{idx} Testing for {finding.get('owasp', 'N/A')}")
        
        # Black title header
        title_p = doc.add_paragraph()
        title_p.alignment = WD_PARAGRAPH_ALIGNMENT.LEFT
        title_run = title_p.add_run(finding.get('title', 'Unknown Vulnerability'))
        title_run.bold = True
        # In docx, applying a black background to a paragraph isn't trivial without an explicit shading oxml element,
        # so we will use a 1x1 table for the black header.
        
        th = doc.add_table(rows=1, cols=1)
        th.style = 'Table Grid'
        tc_head = th.cell(0,0)
        tc_head.text = finding.get('title', 'Unknown Vulnerability')
        tc_head.paragraphs[0].runs[0].bold = True
        tc_head.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255) # White text
        shading_elm = OxmlElement('w:shd')
        shading_elm.set(qn('w:fill'), '000000') # Black background
        tc_head._element.get_or_add_tcPr().append(shading_elm)
        
        tf = doc.add_table(rows=6, cols=2)
        tf.style = 'Table Grid'
        tf.autofit = False
        
        def set_r(r_i, label, val):
            c0, c1 = tf.cell(r_i,0), tf.cell(r_i,1)
            c0.width = Inches(1.5)
            c1.width = Inches(5.0)
            c0.text = label
            c0.paragraphs[0].runs[0].bold = True
            c1.text = str(val) if val else "N/A"
            return c1
            
        cwe_v = finding.get('cwe', '')
        if cwe_v and not cwe_v.upper().startswith('CWE-'): cwe_v = f"CWE-{cwe_v}"
        
        set_r(0, "CWE ID", cwe_v or 'N/A')
        set_r(1, "Severity", finding.get('severity', 'N/A'))
        set_r(2, "Description", finding.get('description', 'N/A'))
        
        url_c = set_r(3, "Affected URL", "")
        urls = finding.get('affectedUrls', '')
        if urls: url_c.text = "\n".join([u.strip() for u in urls.split('\n') if u.strip()])
        else: url_c.text = "N/A"
        
        param_c = set_r(4, "Parameters", "")
        pv = finding.get('parameter', '')
        try:
            pl = json.loads(pv)
            if isinstance(pl, list) and len(pl) > 0:
                param_c.text = "\n".join([f"{p.get('name')} = {p.get('value')}" if p.get('value') else p.get('name') for p in pl])
            else:
                param_c.text = pv or "N/A"
        except:
            param_c.text = pv or "N/A"
            
        mit_c = set_r(5, "Recommendation", "")
        mit = finding.get('mitigation', '')
        if isinstance(mit, list): mit_c.text = "\n".join([f"• {m}" for m in mit if m])
        else: mit_c.text = str(mit)
        
        doc.add_paragraph("\n")
        
        evidences = finding.get('evidences', [])
        for ev in evidences:
            if ev.get('filePath'):
                cap = ev.get('caption', '').strip()
                c_text = f"Figure {figure_counter}: {cap}" if cap else f"Figure {figure_counter}"
                add_evidence_image(doc, ev.get('filePath'), c_text)
                figure_counter += 1
                
        doc.add_paragraph("\n")
    
    doc.add_page_break()
    
    # 10. CONCLUSION
    apply_heading_style(doc, 1, "6. Conclusion")
    doc.add_paragraph("The security assessment identified security weaknesses of varying severity within the assessed application.\n")
    doc.add_paragraph(f"In this assessment, the following vulnerabilities were discovered:\n"
                      f"• Critical – {counts['Critical']}\n"
                      f"• High – {counts['High']}\n"
                      f"• Medium – {counts['Medium']}\n"
                      f"• Low – {counts['Low']}\n"
                      f"• Informative – {counts['Info']}\n")
                      
    if counts['Critical'] > 0:
        doc.add_paragraph("Critical vulnerabilities require immediate remediation to prevent severe exploitation.")
    if counts['High'] > 0:
        doc.add_paragraph("High-severity vulnerabilities pose significant risk and should be prioritized.")
    if counts['Medium'] > 0:
        doc.add_paragraph("Medium-severity findings should be addressed as part of the scheduled remediation plan.")
    if counts['Low'] > 0:
        doc.add_paragraph("Low-severity findings represent lower-risk weaknesses but should still be remediated.")
    if counts['Info'] > 0:
        doc.add_paragraph("Informational observations should be reviewed as security-hardening opportunities.")
        
    doc.add_page_break()
    
    # 11. DISCLAIMER
    apply_heading_style(doc, 1, "Disclaimer")
    disc = doc.add_table(rows=1, cols=1)
    disc.style = 'Table Grid'
    disc_c = disc.cell(0,0)
    disc_c.text = (
        "1. POINT-IN-TIME ASSESSMENT\n"
        "The security assessment represents the condition of the tested application/environment during the agreed assessment period. Changes made after testing may affect the validity of findings.\n\n"
        "2. DEFINED SCOPE\n"
        "Testing was limited to the targets and scope defined for the assessment. Systems outside the defined scope were not assessed.\n\n"
        "3. NO GUARANTEE OF COMPLETE SECURITY\n"
        "The absence of additional findings does not guarantee that the application is completely free from vulnerabilities.\n\n"
        "4. ENVIRONMENTAL CHANGES\n"
        "Application updates, infrastructure changes, configuration changes, new dependencies or other modifications may introduce new security risks after completion of the assessment.\n\n"
        "5. CONFIDENTIALITY\n"
        "The report may contain confidential security information and should only be distributed to authorized recipients.\n\n"
        "6. REMEDIATION\n"
        "The organization receiving the report is responsible for evaluating and implementing appropriate remediation according to its own risk management process."
    )
    doc.add_page_break()
    
    # 12. THANK YOU
    doc.add_paragraph("\n\n\n\n\n\n")
    ty = doc.add_paragraph("THANK YOU")
    ty.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    ty.runs[0].font.size = Pt(36)
    ty.runs[0].bold = True
    ty.runs[0].font.color.rgb = RGBColor(31, 78, 120)
    
    ty_sub = doc.add_paragraph("\nSecurity Assessment Completed\n\n")
    ty_sub.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    ty_sub.runs[0].font.size = Pt(16)
    
    ty_org = doc.add_paragraph(f"{org_name}\nCONFIDENTIAL / INTERNAL")
    ty_org.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    ty_org.runs[0].bold = True
    
    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer

import shutil

def find_libreoffice():
    # 0. Check Environment Variable
    env_path = os.environ.get("LIBREOFFICE_PATH")
    if env_path and os.path.exists(env_path): return env_path
    
    # 1. Check shutil.which("soffice")
    path = shutil.which("soffice")
    if path: return path
    # 2. Check shutil.which("libreoffice")
    path = shutil.which("libreoffice")
    if path: return path
    # 3. Explicit check: C:\Program Files\LibreOffice\program\soffice.exe
    p1 = r"C:\Program Files\LibreOffice\program\soffice.exe"
    if os.path.exists(p1): return p1
    # 4. Explicit check: C:\Program Files (x86)\LibreOffice\program\soffice.exe
    p2 = r"C:\Program Files (x86)\LibreOffice\program\soffice.exe"
    if os.path.exists(p2): return p2
    return None

def generate_pdf_report(project_data: dict) -> io.BytesIO:
    print("[REPORT] Requested format: PDF")
    docx_buffer = generate_docx_report(project_data)
    
    fd, docx_path = tempfile.mkstemp(suffix=".docx")
    with os.fdopen(fd, 'wb') as f:
        f.write(docx_buffer.getvalue())
        
    outdir = os.path.dirname(docx_path)
    pdf_path = docx_path.replace(".docx", ".pdf")
    
    lo_path = find_libreoffice()
    if not lo_path:
        os.remove(docx_path)
        raise Exception("LibreOffice executable not found. Cannot convert DOCX to PDF.")
        
    print(f"[REPORT] DOCX generated: {docx_path}")
    print(f"[PDF] LibreOffice detected: {lo_path}")
    print(f"[PDF] Output directory: {outdir}")
    
    cmd = [
        lo_path,
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        outdir,
        docx_path
    ]
    
    try:
        print(f"[PDF] Executing command: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        print(f"[PDF] Return code: {result.returncode}")
        print(f"[PDF] stdout: {result.stdout}")
        print(f"[PDF] stderr: {result.stderr}")
        
        if result.returncode != 0:
            raise Exception(f"LibreOffice conversion failed with return code {result.returncode}.\nStdout: {result.stdout}\nStderr: {result.stderr}")
            
    except Exception as e:
        if os.path.exists(docx_path): os.remove(docx_path)
        raise Exception(f"PDF conversion process failed: {str(e)}")
        
    if not os.path.exists(pdf_path):
        os.remove(docx_path)
        raise Exception(f"PDF conversion failed: Expected PDF file does not exist at {pdf_path}. LibreOffice may have failed silently. Check stderr.")
        
    if os.path.getsize(pdf_path) == 0:
        os.remove(docx_path)
        os.remove(pdf_path)
        raise Exception(f"PDF conversion failed: Output PDF file is empty.")
        
    with open(pdf_path, 'rb') as f:
        pdf_bytes = f.read()
        
    if os.path.exists(docx_path): os.remove(docx_path)
    if os.path.exists(pdf_path): os.remove(pdf_path)
    
    return io.BytesIO(pdf_bytes)

def generate_excel_report(project_data: dict) -> io.BytesIO:
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Vulnerability Tracker"
    
    headers = [
        "S. No", "Vulnerability Name", "Owasp Mapping", "Severity", 
        "Vulnerable URL", "Affected Parameters", "Solution"
    ]
    ws.append(headers)
    
    header_fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    border = Border(
        left=Side(style='thin'), right=Side(style='thin'), 
        top=Side(style='thin'), bottom=Side(style='thin')
    )
    center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    
    for col in range(1, len(headers) + 1):
        cell = ws.cell(row=1, column=col)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = center_align
        cell.border = border
        
    ws.column_dimensions['A'].width = 8
    ws.column_dimensions['B'].width = 28
    ws.column_dimensions['C'].width = 25
    ws.column_dimensions['D'].width = 15
    ws.column_dimensions['E'].width = 45
    ws.column_dimensions['F'].width = 23
    ws.column_dimensions['G'].width = 120
        
    findings = project_data.get("findings", [])
    
    for idx, finding in enumerate(findings, 2):
        ws.row_dimensions[idx].height = 80
        
        c_sno = ws.cell(row=idx, column=1, value=idx-1)
        c_sno.border = border
        c_sno.alignment = center_align
        
        c_title = ws.cell(row=idx, column=2, value=finding.get('title', ''))
        c_title.border = border
        c_title.alignment = center_align
        
        c_owasp = ws.cell(row=idx, column=3, value=finding.get('owasp', ''))
        c_owasp.border = border
        c_owasp.alignment = center_align
        
        sev = finding.get('severity', '')
        c_sev = ws.cell(row=idx, column=4, value=sev)
        c_sev.border = border
        c_sev.alignment = center_align
        
        if sev == "Critical":
            c_sev.fill = PatternFill(start_color="FF0000", end_color="FF0000", fill_type="solid")
            c_sev.font = Font(color="FFFFFF")
        elif sev == "High":
            c_sev.fill = PatternFill(start_color="FFC000", end_color="FFC000", fill_type="solid")
        elif sev == "Medium":
            c_sev.fill = PatternFill(start_color="FFFF00", end_color="FFFF00", fill_type="solid")
        elif sev == "Low":
            c_sev.fill = PatternFill(start_color="0070C0", end_color="0070C0", fill_type="solid")
            c_sev.font = Font(color="FFFFFF")
        elif sev == "Info" or sev == "Informative":
            c_sev.fill = PatternFill(start_color="BFBFBF", end_color="BFBFBF", fill_type="solid")
            
        urls_raw = finding.get('affectedUrls', '')
        url_list = [u.strip() for u in urls_raw.split('\n') if u.strip()] if urls_raw else []
        c_url = ws.cell(row=idx, column=5, value="\n".join(url_list) if url_list else "N/A")
        c_url.border = border
        c_url.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
        if len(url_list) == 1 and url_list[0].startswith("http"):
            c_url.hyperlink = url_list[0]
            c_url.font = Font(color="0563C1", underline="single")
            
        param_val = finding.get('parameter', '')
        parsed_params = "N/A"
        if param_val:
            try:
                param_list = json.loads(param_val)
                if isinstance(param_list, list) and len(param_list) > 0:
                    lines = []
                    for p in param_list:
                        name = p.get('name', '')
                        value = p.get('value', '')
                        if value: lines.append(f"{name} = {value}")
                        else: lines.append(name)
                    parsed_params = "\n".join(lines)
                else:
                    parsed_params = str(param_val)
            except Exception:
                parsed_params = str(param_val)
                
        c_param = ws.cell(row=idx, column=6, value=parsed_params)
        c_param.border = border
        c_param.alignment = center_align
        
        mitigation_data = finding.get('mitigation', '')
        if isinstance(mitigation_data, list):
            mitigation_val = "\n\n".join(f"• {m}" for m in mitigation_data if m)
        else:
            mitigation_val = str(mitigation_data)
            
        c_sol = ws.cell(row=idx, column=7, value=mitigation_val)
        c_sol.border = border
        c_sol.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)

    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions
    
    ws.print_options.horizontalCentered = True
    ws.page_setup.orientation = ws.ORIENTATION_LANDSCAPE
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.print_title_rows = '1:1'
    
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer
