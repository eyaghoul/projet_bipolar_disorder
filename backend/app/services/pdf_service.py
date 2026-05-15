"""
PDF report generation service using reportlab.
Generates a clinical-style PDF with screening result + mood history table.
Returns raw bytes to be streamed as application/pdf.
PII note: PDF contains patient name and clinical data — handle securely.
"""
import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT


TEAL = colors.HexColor("#00b4d8")
NAVY = colors.HexColor("#0d1b2a")
LIGHT_GREY = colors.HexColor("#f0f4f8")


def generate_report(patient: dict, screening: dict, mood_logs: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    story = []

    # ── Header ──────────────────────────────────────────────────────────────
    title_style = ParagraphStyle("title", fontSize=22, textColor=NAVY,
                                  spaceAfter=4, alignment=TA_CENTER, fontName="Helvetica-Bold")
    sub_style = ParagraphStyle("sub", fontSize=11, textColor=TEAL,
                                spaceAfter=2, alignment=TA_CENTER)
    story.append(Paragraph("BipolarGuide", title_style))
    story.append(Paragraph("Mental Health Screening Report", sub_style))
    story.append(HRFlowable(width="100%", thickness=2, color=TEAL, spaceAfter=12))

    # ── Patient info ─────────────────────────────────────────────────────────
    label = ParagraphStyle("label", fontSize=10, textColor=NAVY, fontName="Helvetica-Bold")
    body = ParagraphStyle("body", fontSize=10, textColor=colors.black)
    story.append(Paragraph("Patient Information", label))
    story.append(Spacer(1, 6))
    info_data = [
        ["Name:", patient.get("name", "N/A")],
        ["Email:", patient.get("email", "N/A")],
        ["Report Date:", datetime.utcnow().strftime("%B %d, %Y")],
        ["Plan:", screening.get("plan", "N/A").title()],
    ]
    info_table = Table(info_data, colWidths=[4 * cm, 12 * cm])
    info_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 16))

    # ── Screening result ─────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=LIGHT_GREY, spaceAfter=8))
    story.append(Paragraph("AI Screening Result", label))
    story.append(Spacer(1, 6))
    binary = screening.get("binary_label", "N/A")
    confidence = screening.get("confidence", 0)
    result_color = colors.HexColor("#ef4444") if binary == "Bipolar" else colors.HexColor("#22c55e")
    res_data = [
        ["Result:", binary, f"Confidence: {confidence * 100:.1f}%"],
    ]
    if screening.get("multiclass_label"):
        res_data.append(["Subtype:", screening["multiclass_label"],
                          f"{screening.get('multiclass_confidence', 0) * 100:.1f}%"])
    res_table = Table(res_data, colWidths=[4 * cm, 8 * cm, 4 * cm])
    res_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (1, 0), (1, 0), result_color),
        ("FONTNAME", (1, 0), (1, 0), "Helvetica-Bold"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(res_table)

    # ── Contributing factors ─────────────────────────────────────────────────
    if screening.get("top_features"):
        story.append(Spacer(1, 12))
        story.append(Paragraph("Key Contributing Factors", label))
        story.append(Spacer(1, 6))
        for i, f in enumerate(screening["top_features"], 1):
            story.append(Paragraph(f"{i}. {f['explanation']}", body))
            story.append(Spacer(1, 4))

    # ── Mood history table ───────────────────────────────────────────────────
    if mood_logs:
        story.append(Spacer(1, 16))
        story.append(HRFlowable(width="100%", thickness=1, color=LIGHT_GREY, spaceAfter=8))
        story.append(Paragraph("Mood History (Recent Entries)", label))
        story.append(Spacer(1, 6))
        header = ["Date", "Mood", "Sleep (h)", "Energy", "Irritability"]
        rows = [header]
        for log in mood_logs[-30:]:
            rows.append([
                str(log.get("date", "")),
                str(log.get("mood", "")),
                str(log.get("sleep", "")),
                str(log.get("energy", "")),
                str(log.get("irritability", "")),
            ])
        mood_table = Table(rows, colWidths=[3.5 * cm, 2.5 * cm, 3 * cm, 2.5 * cm, 3.5 * cm])
        mood_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), TEAL),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT_GREY]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(mood_table)

    # ── Footer ───────────────────────────────────────────────────────────────
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=LIGHT_GREY))
    story.append(Spacer(1, 6))
    footer_style = ParagraphStyle("footer", fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    story.append(Paragraph(
        "This report is generated by BipolarGuide and is intended to assist clinical assessment. "
        "It is not a substitute for professional medical advice.",
        footer_style,
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
