from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import io

def generate_resume_pdf(resume_data: dict) -> bytes:
    """
    Generate a PDF resume from structured data using ReportLab.
    Returns the PDF bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    
    styles = getSampleStyleSheet()
    story = []
    
    # --- Styles ---
    # Name style
    name_style = ParagraphStyle(
        'Name',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.darkblue,
        alignment=TA_CENTER,
        spaceAfter=12
    )
    
    # Header Info style
    header_info_style = ParagraphStyle(
        'HeaderInfo',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.gray,
        alignment=TA_CENTER,
        spaceAfter=24
    )
    
    # Section Header style
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.darkblue,
        borderPadding=(0, 0, 5, 0),
        borderWidth=1,
        borderColor=colors.lightgrey,
        spaceBefore=12,
        spaceAfter=10
    )
    
    # Content style
    normal_style = styles['Normal']
    normal_style.fontSize = 11
    normal_style.leading = 14
    
    # Bullet style
    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        leftIndent=20,
        bulletIndent=10
    )

    # --- Content Building ---
    
    # 1. Header (Name & Contact)
    contact = resume_data.get("contact_info", {})
    name = contact.get("name", "Name Not Found")
    story.append(Paragraph(name, name_style))
    
    # Contact details line
    details = []
    if contact.get("email"): details.append(contact["email"])
    if contact.get("phone"): details.append(contact["phone"])
    if contact.get("location"): details.append(contact["location"])
    if contact.get("linkedin"): details.append(contact["linkedin"])
    
    story.append(Paragraph(" | ".join(details), header_info_style))
    
    # 2. Professional Summary
    summary = resume_data.get("summary")
    if summary:
        story.append(Paragraph("Professional Summary", section_style))
        story.append(Paragraph(summary, normal_style))
        story.append(Spacer(1, 10))
    
    # 3. Experience
    experience = resume_data.get("experience", [])
    if experience:
        story.append(Paragraph("Experience", section_style))
        for exp in experience:
            # Company & Role row
            company = exp.get("company", "Company")
            role = exp.get("role", "Role")
            dates = exp.get("dates", "")
            
            # Using bold for role, regular for company
            header_text = f"<b>{role}</b> at {company}"
            story.append(Paragraph(header_text, normal_style))
            
            # Date line (could be aligned right, but keep simple for now)
            story.append(Paragraph(f"<i>{dates}</i>", ParagraphStyle('Dates', parent=normal_style, fontSize=10, textColor=colors.gray)))
            
            story.append(Spacer(1, 5))
            
            # Bullets
            for bullet in exp.get("description", []):
                story.append(Paragraph(f"• {bullet}", bullet_style))
            
            story.append(Spacer(1, 15))

    # 4. Education
    education = resume_data.get("education", [])
    if education:
        story.append(Paragraph("Education", section_style))
        for edu in education:
            uni = edu.get("institution", "")
            degree = edu.get("degree", "")
            dates = edu.get("dates", "")
            
            text = f"<b>{degree}</b>, {uni} ({dates})"
            story.append(Paragraph(text, normal_style))
            story.append(Spacer(1, 5))
            
    # 5. Skills
    skills = resume_data.get("skills", [])
    if skills:
        story.append(Paragraph("Skills", section_style))
        story.append(Paragraph(", ".join(skills), normal_style))

    # Build PDF
    doc.build(story)
    
    buffer.seek(0)
    return buffer.getvalue()
