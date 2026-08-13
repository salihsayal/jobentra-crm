import io
import logging
import os

from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.models import ProfilePdfData

log = logging.getLogger(__name__)

NAVY = HexColor("#0E2A47")
ORANGE = HexColor("#F38430")
LIGHT_BG = HexColor("#F8FAFC")
BORDER = HexColor("#E2E8F0")
GRAY = HexColor("#6B7280")
GRAY_DARK = HexColor("#374151")

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm

LOGO_PATH = os.path.join(os.path.dirname(__file__), "..", "assets", "logo.png")

FOOTER_TEXT = (
    "Jobentra GmbH | Franz-Haniel-Platz 1a, 47119 Duisburg | "
    "HRB 39507 (Amtsgericht Duisburg) | USt-ID: DE457971028"
)

TITLE_STYLE = ParagraphStyle(
    "profile-title", fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=NAVY,
)
SUBTITLE_STYLE = ParagraphStyle(
    "profile-subtitle", fontName="Helvetica", fontSize=9.5, leading=13, textColor=GRAY,
)
SECTION_STYLE = ParagraphStyle(
    "profile-section", fontName="Helvetica-Bold", fontSize=9.5, leading=12,
    textColor=NAVY, spaceBefore=10, spaceAfter=6,
)
PILL_STYLE = ParagraphStyle(
    "profile-pill", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=white,
    alignment=1,
)
JOB_STYLE = ParagraphStyle(
    "profile-job", fontName="Helvetica-Bold", fontSize=10, leading=13, textColor=NAVY,
)
DURATION_STYLE = ParagraphStyle(
    "profile-duration", fontName="Helvetica", fontSize=8, leading=11, textColor=GRAY,
    alignment=TA_RIGHT,
)
COMPANY_STYLE = ParagraphStyle(
    "profile-company", fontName="Helvetica", fontSize=8.5, leading=12, textColor=GRAY,
)
DESCRIPTION_STYLE = ParagraphStyle(
    "profile-description", fontName="Helvetica", fontSize=9, leading=12.5, textColor=GRAY_DARK,
)
CERT_STYLE = ParagraphStyle(
    "profile-cert", fontName="Helvetica", fontSize=9, leading=13, textColor=GRAY_DARK,
    leftIndent=10, bulletIndent=0,
)
FOOTER_STYLE = ParagraphStyle(
    "profile-footer", fontName="Helvetica", fontSize=7.5, leading=10, textColor=GRAY,
)


def _draw_header(canvas, doc, data):
    canvas.saveState()
    logo = ImageReader(LOGO_PATH)
    lw, lh = logo.getSize()
    logo_h = 13 * mm
    logo_w = logo_h * lw / lh
    top = PAGE_H - 14 * mm
    canvas.drawImage(
        LOGO_PATH, MARGIN, top - logo_h,
        width=logo_w, height=logo_h, preserveAspectRatio=True, mask="auto",
    )

    badge_text = f"Ref: #{data.refNumber}"
    if data.city:
        badge_text += f" | Standort: {data.city}"
    font_size = 9
    text_w = canvas.stringWidth(badge_text, "Helvetica-Bold", font_size)
    pad_x, pad_y = 8, 5
    bw = text_w + 2 * pad_x
    bh = font_size + 2 * pad_y + 2
    bx = PAGE_W - MARGIN - bw
    by = top - bh + 2
    canvas.setFillColor(NAVY)
    canvas.roundRect(bx, by, bw, bh, 6, stroke=0, fill=1)
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", font_size)
    canvas.drawString(bx + pad_x, by + pad_y, badge_text)
    canvas.restoreState()


def _draw_footer(canvas, doc):
    canvas.saveState()
    y_line = MARGIN + 6 * mm
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.6)
    canvas.line(MARGIN, y_line, PAGE_W - MARGIN, y_line)
    paragraph = Paragraph(FOOTER_TEXT, FOOTER_STYLE)
    avail_w = PAGE_W - 2 * MARGIN
    _, h = paragraph.wrapOn(canvas, avail_w, 20)
    paragraph.drawOn(canvas, MARGIN, y_line - h - 2 * mm)
    canvas.restoreState()


def _build_skills_pills(skills):
    per_row = 4
    rows = [skills[i:i + per_row] for i in range(0, len(skills), per_row)]
    table_rows = []
    for row in rows:
        cells = []
        for skill in row:
            pill = Table(
                [[Paragraph(skill, PILL_STYLE)]],
                style=TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), ORANGE),
                    ("ROUNDEDCORNERS", [9, 9, 9, 9]),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]),
            )
            cells.append(pill)
        while len(cells) < per_row:
            cells.append("")
        table_rows.append(cells)
    return Table(
        table_rows,
        hAlign="LEFT",
        colWidths=[(PAGE_W - 2 * MARGIN) / per_row] * per_row,
        style=TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]),
    )


def _build_work_experience_cards(entries):
    flowables = []
    for entry in entries:
        title_cell = Paragraph(entry.jobTitle or "-", JOB_STYLE)
        duration = f"{entry.startDate or '?'} – {entry.endDate or 'heute'}"
        duration_cell = Paragraph(duration, DURATION_STYLE)
        header_table = Table(
            [[title_cell, duration_cell]],
            colWidths=[(PAGE_W - 2 * MARGIN - 16 * mm) * 0.6,
                       (PAGE_W - 2 * MARGIN - 16 * mm) * 0.4],
            style=TableStyle([
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]),
        )

        inner = [header_table]
        if entry.company:
            inner.append(Paragraph(entry.company, COMPANY_STYLE))
        if entry.description:
            inner.append(Spacer(1, 1.5 * mm))
            inner.append(Paragraph(entry.description, DESCRIPTION_STYLE))

        card = Table(
            [[inner]],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
                ("BOX", (0, 0), (-1, -1), 0.7, BORDER),
                ("ROUNDEDCORNERS", [6, 6, 6, 6]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]),
        )
        flowables.append(card)
        flowables.append(Spacer(1, 2.5 * mm))
    return flowables


def build_profile_pdf(data: ProfilePdfData) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=30 * mm,
        bottomMargin=24 * mm,
        title=f"Kandidaten-Profil #{data.refNumber}",
        author="Jobentra GmbH",
    )

    story = []
    story.append(Paragraph("Kandidat/in (m/w/d)", TITLE_STYLE))
    if data.job:
        story.append(Spacer(1, 1.5 * mm))
        story.append(Paragraph(data.job, SUBTITLE_STYLE))

    if data.skills:
        story.append(Paragraph("FÄHIGKEITEN", SECTION_STYLE))
        story.append(_build_skills_pills(data.skills))

    if data.workExperience:
        story.append(Paragraph("ARBEITSERFAHRUNG", SECTION_STYLE))
        story.extend(_build_work_experience_cards(data.workExperience))

    if data.certificates:
        story.append(Paragraph("ZERTIFIKATE", SECTION_STYLE))
        for name in data.certificates:
            story.append(Paragraph(name, CERT_STYLE, bulletText="•"))

    def on_page(canvas, d):
        _draw_header(canvas, d, data)
        _draw_footer(canvas, d)

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    pdf_bytes = buf.getvalue()
    buf.close()
    log.info(
        "Generated profile PDF ref #%s: %d skills, %d work entries, %d certificates",
        data.refNumber, len(data.skills), len(data.workExperience), len(data.certificates),
    )
    return pdf_bytes
