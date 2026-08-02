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

def generate_methodology_graphic() -> io.BytesIO:
    import matplotlib.pyplot as plt
    import matplotlib.patches as patches
    
    fig, ax = plt.subplots(figsize=(10, 2.5))
    ax.axis('off')
    
    steps = ["Planning", "Discovery", "Attack", "Review &\nAnalysis", "Reporting"]
    colors = ['#5B9BD5', '#5B9BD5', '#5B9BD5', '#5B9BD5', '#5B9BD5']
    
    start_x = 0
    y = 0.5
    w = 1.6
    h = 0.8
    arrow_w = 0.4
    gap = 0.2
    
    for i, step in enumerate(steps):
        # Draw chevron
        if i == 0:
            # First one is a rectangle with arrow head
            poly = patches.Polygon([[start_x, y-h/2], [start_x+w, y-h/2], [start_x+w+arrow_w, y], [start_x+w, y+h/2], [start_x, y+h/2]], 
                                   closed=True, facecolor=colors[i], edgecolor='white', lw=2)
        else:
            # Others have arrow tail indent
            poly = patches.Polygon([[start_x, y-h/2], [start_x+w, y-h/2], [start_x+w+arrow_w, y], [start_x+w, y+h/2], [start_x, y+h/2], [start_x+arrow_w, y]], 
                                   closed=True, facecolor=colors[i], edgecolor='white', lw=2)
        
        # Add shadow
        import copy
        shadow = copy.copy(poly)
        shadow.set_facecolor('gray')
        shadow.set_alpha(0.3)
        shadow.set_xy(shadow.get_xy() + [0.03, -0.05])
        ax.add_patch(shadow)
        ax.add_patch(poly)
        
        # Text
        text_x = start_x + w/2 + (arrow_w/2 if i>0 else arrow_w/4)
        ax.text(text_x, y, step, ha='center', va='center', fontweight='bold', color='black', fontsize=11)
        
        start_x += w + gap
        
    # Draw curved arrow back
    style = "Simple, tail_width=3, head_width=10, head_length=12"
    kw = dict(arrowstyle=style, color="#5B9BD5")
    # From Review (index 3) to Discovery (index 1)
    x_start = (w + gap) * 3 + w/2
    x_end = (w + gap) * 1 + w/2
    a = patches.FancyArrowPatch((x_start, y - h/2 - 0.1), (x_end, y - h/2 - 0.1),
                                connectionstyle="arc3,rad=0.4", **kw)
    ax.add_patch(a)
    
    ax.set_xlim(-0.5, start_x + 0.5)
    ax.set_ylim(-0.5, 1.5)
    
    plt.tight_layout()
    img_stream = io.BytesIO()
    plt.savefig(img_stream, format='png', dpi=150, bbox_inches='tight')
    plt.close()
    img_stream.seek(0)
    return img_stream

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
        run.font.color.rgb = RGBColor(0, 176, 240) # Professional Blue
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
    cv_b64 = project_data.get('coverImage')
    if cv_b64 and ',' in cv_b64:
        cv_b64 = cv_b64.split(',')[1]

    doc.add_paragraph("\n\n")
    p_title1 = doc.add_paragraph(f"{app_name}")
    p_title1.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    p_title1.runs[0].font.size = Pt(22)
    p_title1.runs[0].font.bold = True
    p_title1.runs[0].font.color.rgb = RGBColor(0, 176, 240)
    
    p_title2 = doc.add_paragraph("Web Application\nDetailed Vulnerabilities Report")
    p_title2.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    p_title2.runs[0].font.size = Pt(16)
    p_title2.runs[0].font.bold = True
    p_title2.runs[0].font.color.rgb = RGBColor(0, 176, 240)

    doc.add_paragraph("\n\n")

    if cv_b64:
        import base64
        import io
        try:
            img_data = base64.b64decode(cv_b64)
            img_stream = io.BytesIO(img_data)
            img_stream.seek(0)
            p_img = doc.add_paragraph()
            p_img.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
            p_img.add_run().add_picture(img_stream, width=Inches(5.0))
        except Exception:
            pass
    else:
        doc.add_paragraph("\n\n\n\n")
        
    doc.add_page_break()
    
    # 02. DOCUMENT DETAILS
    doc.add_paragraph("\n\n")
    t_date = doc.add_paragraph(datetime.datetime.now().strftime("%d/%m/%Y") + "\nDocument Version 1.0\nDocument Version 1.0")
    t_date.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    t_date.runs[0].font.size = Pt(12)
    
    doc.add_paragraph("\n\n\n\n")
    apply_heading_style(doc, 2, "Document Details")
    t1 = doc.add_table(rows=10, cols=2)
    t1.style = 'Table Grid'
    
    details = [
        ("Document Name", f"{app_name} Web Application Detailed Vulnerabilities Report"),
        ("Document Version No.", "1.0"),
        ("Document Prepared by", "TASL's CTVM Team"),
        ("Approved By", meta.get('reviewer', 'Manager')),
        ("Reviewed By", meta.get('auditor', 'Security Team')),
        ("Released By", meta.get('releasedBy', 'Director')),
        ("CERT-In Empanelment #", "3(15)/2004-CERT-In (Vol. XIV)"),
        ("Document Prepared for", org_name),
        ("Document Date", datetime.datetime.now().strftime("%d/%m/%Y")),
        ("Document Classification", "CONFIDENTIAL")
    ]
    for i, (k, v) in enumerate(details):
        t1.cell(i,0).text = k
        t1.cell(i,0).paragraphs[0].runs[0].bold = True
        t1.cell(i,1).text = v
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
    
    apply_heading_style(doc, 2, "3.3 Vulnerabilities Overview")
    tvo = doc.add_table(rows=2, cols=7)
    tvo.style = 'Table Grid'
    tvo_headers = ["Application", "Total", "Critical", "High", "Medium", "Low", "Informative"]
    tvo_bg = ['0070C0', 'FFFFFF', 'FF0000', 'FF9900', 'FFFF00', '0070C0', '2F5597']
    tvo_fg = [RGBColor(255,255,255), RGBColor(0,0,0), RGBColor(255,255,255), RGBColor(0,0,0), RGBColor(0,0,0), RGBColor(255,255,255), RGBColor(255,255,255)]
    
    for i, h in enumerate(tvo_headers):
        c = tvo.cell(0,i)
        c.text = h
        c.paragraphs[0].runs[0].bold = True
        c.paragraphs[0].runs[0].font.color.rgb = tvo_fg[i]
        c.paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        shd = OxmlElement('w:shd')
        shd.set(qn('w:val'), 'clear')
        shd.set(qn('w:color'), 'auto')
        shd.set(qn('w:fill'), tvo_bg[i])
        c._tc.get_or_add_tcPr().append(shd)
        
    tvo.cell(1,0).text = app_name
    tvo.cell(1,1).text = str(sum(counts.values()))
    tvo.cell(1,2).text = str(counts['Critical'])
    tvo.cell(1,3).text = str(counts['High'])
    tvo.cell(1,4).text = str(counts['Medium'])
    tvo.cell(1,5).text = str(counts['Low'])
    tvo.cell(1,6).text = str(counts['Info'])
    for i in range(1, 7):
        tvo.cell(1,i).paragraphs[0].alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
        
    doc.add_paragraph("\n")
    p_sum = doc.add_paragraph("A high-level summary of the vulnerabilities is as below:")
    
    ths = doc.add_table(rows=len(findings)+1, cols=4)
    ths.style = 'Table Grid'
    ths_headers = ["S. No.", "Description", "Severity", "Count of Vulnerabilities"]
    for i, h in enumerate(ths_headers):
        c = ths.cell(0,i)
        c.text = h
        c.paragraphs[0].runs[0].bold = True
        shd = OxmlElement('w:shd')
        shd.set(qn('w:val'), 'clear')
        shd.set(qn('w:color'), 'auto')
        shd.set(qn('w:fill'), 'D9E1F2') # Light blue
        c._tc.get_or_add_tcPr().append(shd)
        
    for idx, f in enumerate(findings, 1):
        ths.cell(idx, 0).text = str(idx)
        ths.cell(idx, 1).text = f.get('title', '')
        ths.cell(idx, 2).text = f.get('severity', '')
        ths.cell(idx, 3).text = "1"
        # Alternating row color
        if idx % 2 == 0:
            for i in range(4):
                shd = OxmlElement('w:shd')
                shd.set(qn('w:val'), 'clear')
                shd.set(qn('w:color'), 'auto')
                shd.set(qn('w:fill'), 'D9E1F2')
                ths.cell(idx, i)._tc.get_or_add_tcPr().append(shd)

    doc.add_page_break()
    
    # 08. APPROACH
    apply_heading_style(doc, 1, "4. Approach")
    
    doc.add_paragraph("This assessment is conducted on OWASP Top 10 framework and is intended to simulate real-world attack scenarios and demonstrate the impact of security weaknesses in human, procedural, and technical defenses that constitute the overall security of web applications. It may be possible to combine the information or access provided by several non-critical vulnerabilities to gain unauthorized access to critical data or systems. Further, by clearly demonstrating how vulnerabilities can be exploited to lead to unauthorized access of critical business systems and confidential data, the report can often provide the management team with greater insight into the business risks related to information security controls.")
    doc.add_paragraph("\n")
    
    apply_heading_style(doc, 2, "4.1 Testing Methodology")
    doc.add_paragraph("Security Testing of Web Applications is performed in the following phases:")
    
    meth_img = generate_methodology_graphic()
    p_meth = doc.add_paragraph()
    p_meth.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    p_meth.add_run().add_picture(meth_img, width=Inches(6.0))
    doc.add_paragraph("\n")
    
    apply_heading_style(doc, 3, "Planning")
    p1 = doc.add_paragraph(style='List Bullet')
    p1.add_run("Set scope, identify target and schedule of testing.")
    p2 = doc.add_paragraph(style='List Bullet')
    p2.add_run("Plan assessment path, entry point and testing boundary.")
    
    apply_heading_style(doc, 3, "Discovery")
    p3 = doc.add_paragraph(style='List Bullet')
    p3.add_run("Identify the function and all input fields of the application.")
    p4 = doc.add_paragraph(style='List Bullet')
    p4.add_run("Inventories the features, input fields and functional walkthrough.")
    p5 = doc.add_paragraph(style='List Bullet')
    p5.add_run("Profile the application authentication & access control and logic.")
    
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
    doc.add_paragraph("The security of the web applications appears to be weak at certain points.\n")
    
    p1 = doc.add_paragraph(style='List Bullet')
    p1.add_run("In this assessment, the following vulnerabilities were discovered:")
    p1_1 = doc.add_paragraph(f"Critical – {counts['Critical']}", style='List Bullet 2')
    p1_2 = doc.add_paragraph(f"High – {counts['High']}", style='List Bullet 2')
    p1_3 = doc.add_paragraph(f"Medium – {counts['Medium']}", style='List Bullet 2')
    p1_4 = doc.add_paragraph(f"Low – {counts['Low']}", style='List Bullet 2')
    p1_5 = doc.add_paragraph(f"Informative-{counts['Info']}", style='List Bullet 2')
    
    p2 = doc.add_paragraph(style='List Bullet')
    p2.add_run("The critical and high vulnerabilities can easily be compromised. Hence, need to be patched immediately on a priority basis.")
    
    p3 = doc.add_paragraph(style='List Bullet')
    p3.add_run("The medium vulnerabilities allow intruders to access information that helps them exploit other vulnerabilities, or better understand the system so that their attacks can be refined. However, Medium severity vulnerabilities should still be addressed at the earliest possible opportunity.")
    
    p4 = doc.add_paragraph(style='List Bullet')
    p4.add_run("The Low vulnerabilities pose a lower threat but should be addressed in the long run.")
    
    p5 = doc.add_paragraph(style='List Bullet')
    p5.add_run("The informative vulnerabilities are for the awareness of the owner.")
    
    doc.add_page_break()
    
    # 11. DISCLAIMER
    p_disc = doc.add_paragraph("Disclaimer")
    p_disc.runs[0].font.size = Pt(12)
    p_disc.runs[0].bold = True
    p_disc.runs[0].font.underline = True
    
    doc.add_paragraph("========================================================================================")
    
    p_text = doc.add_paragraph(
        'This Report (including all annexures, appendices, data, analyses, findings, recommendations, and any related oral or written communications) has been prepared solely in accordance with, and strictly limited to, the agreed scope of work under the applicable RFP, tender, Letter of Intent/ Award, work order, statement of work, or governing contract as the case maybe (collectively "Engagement Documents") between Gujrat Informatics Limited and Tata Advanced Systems Limited ("TASL"). It is based on information, representations, access, and system conditions made available by the DIC and reflects observations limited to the time, environment, assumptions, exclusions, dependencies, and testing parameters defined in the Engagement Documents. This Report is intended exclusively for the DIC internal purposes contemplated under the and does not constitute a legal opinion, expert determination, attestation, certification, continuous monitoring assurance, guarantee of security or compliance, or a comprehensive investigation beyond the defined scope. Except as expressly provided in the Engagement Documents, TASL disclaims all implied warranties, including any implied warranty of merchantability or fitness for a particular purpose. The findings and conclusions herein reflect professional services performed in accordance with the agreed scope and applicable industry practices; however, cyber security assessments are inherently subject to technical, environmental, and temporal limitations, and this Report should be read strictly in the context of the defined scope, assumptions, and assessment period. It is not designed, prepared, or intended to meet evidentiary standards or to support litigation, arbitration, mediation, regulatory inquiry, disciplinary proceedings, insurance claims, or any other adversarial or dispute resolution process. DIC shall remain solely responsible for management decisions taken by it in connection with or based upon the Services and/or the Deliverables and for determining whether the Services and/or Deliverables are appropriate for its purposes and DIC shall solely bear all risks, liabilities and consequences arising from such decisions and TASL shall have no liability whatsoever in this regard. Client shall assign qualified personnel to oversee the Services as well as the use and implementation of the Services and Deliverables. Unless specifically otherwise agreed with DIC in writing, TASL\'s responsibility for performance of the Services is to DIC alone and the Deliverables are permitted to be used only by the DIC for its own operational purposes. Should any Deliverable be disclosed, or otherwise made available, by or through DIC or at DIC’s request to a third party (including but not limited to permitted disclosures to third parties under the relevant provisions), DIC agrees to indemnify and hold TASL and its directors, officers, employees and agents and sub-contractors, harmless against all claims by third parties, and resulting liabilities, losses, damages, costs and expenses (including reasonable external and internal legal costs) arising out of such disclosure. Further, the Report shall not be used, submitted, relied upon, characterized, or represented as expert evidence or determinative proof in any judicial, quasi-judicial, arbitral, regulatory, investigative, or other proceeding. Any use beyond the contractual scope is at the sole discretion, risk, and responsibility of DIC. TASL disclaims all liability arising from or in connection with any such use and shall have no duty of care or liability to any third party, authority, forum, or opposing party that may gain access to the Report. DIC agrees that TASL shall not be impleaded, cited, compelled to testify, produce documents, provide affidavits, clarifications, or expert testimony, or otherwise participate in any proceedings unless separately retained under a written agreement on mutually agreed commercial terms, and DIC shall indemnify and hold harmless TASL from any claims, costs, or liabilities arising out of any unauthorized or extraneous use of this Report.'
    )
    p_text.alignment = WD_PARAGRAPH_ALIGNMENT.JUSTIFY
    
    doc.add_paragraph("========================================================================================")
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
