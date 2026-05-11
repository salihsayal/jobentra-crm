import os
import uuid
from datetime import datetime, timezone

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
)

from app.models import MemberData

GENERATED_DIR = "/app/generated"


def build_pdf(member: MemberData) -> str:
    os.makedirs(GENERATED_DIR, exist_ok=True)

    filename = f"profile-{uuid.uuid4().hex[:12]}.pdf"
    filepath = os.path.join(GENERATED_DIR, filename)

    doc = SimpleDocTemplate(filepath, pagesize=A4,
                            leftMargin=20 * mm, rightMargin=20 * mm,
                            topMargin=20 * mm, bottomMargin=20 * mm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("Title", parent=styles["h1"],
                                 fontSize=22, spaceAfter=6 * mm,
                                 alignment=TA_CENTER)
    header_style = ParagraphStyle("Header", parent=styles["h2"],
                                  fontSize=14, spaceBefore=6 * mm,
                                  spaceAfter=3 * mm,
                                  textColor=colors.HexColor("#1e40af"))
    subtitle_style = ParagraphStyle("Subtitle", parent=styles["Normal"],
                                    fontSize=10, textColor=colors.gray,
                                    alignment=TA_CENTER, spaceAfter=10 * mm)

    story = []
    story.append(Paragraph("Member Profile", title_style))
    story.append(Paragraph(
        f"Generated on {datetime.now(timezone.utc).strftime('%B %d, %Y at %H:%M UTC')}",
        subtitle_style))

    data = [
        ["First Name", member.firstName],
        ["Last Name", member.lastName],
        ["Email", member.email],
        ["Phone", member.phone or "\u2014"],
        ["Status", member.status],
    ]
    table = Table(data, colWidths=[45 * mm, 110 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#eef2ff")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#1e40af")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#c7d2fe")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1),
         [colors.white, colors.HexColor("#f5f7ff")]),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (0, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(table)

    if member.notes:
        story.append(Spacer(1, 8 * mm))
        story.append(Paragraph("Notes", header_style))
        safe = member.notes.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        story.append(Paragraph(safe, styles["Normal"]))

    doc.build(story)
    return filename
