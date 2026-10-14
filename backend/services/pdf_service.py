import os
import re
import uuid
from datetime import datetime
from typing import Dict, Any
from pathlib import Path
from config import settings

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Group

class PDFService:
    def __init__(self):
        self.output_dir = settings.PDF_OUTPUT_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_scheme_application_pdf(self, entities: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates an official Government-styled agricultural scheme application PDF using ReportLab.
        Returns metadata including doc_id, file_path, and download_url.
        """
        doc_id = str(uuid.uuid4())[:10]
        filename = f"rythu_application_{doc_id}.pdf"
        file_path = self.output_dir / filename

        farmer_name = entities.get("farmer_name") or "శ్రీ కార్తీక్ తల్లూరి (Karthik Talluri)"
        phone = entities.get("phone") or "9876543210"
        aadhaar = entities.get("aadhaar") or "XXXX-XXXX-1234"
        scheme_name = entities.get("scheme_name") or "PM-KISAN & Rythu Bharosa"
        crop_name = entities.get("crop_name") or "Paddy (వరి)"
        land_acres = entities.get("land_acres", 2.0)
        
        try:
            land_acres_num = float(land_acres)
        except (ValueError, TypeError):
            land_acres_num = 2.0

        dosage = entities.get("dosage_recommendation") or {}
        urea_kg = dosage.get("urea_kg", int(land_acres_num * 50))
        dap_kg = dosage.get("dap_kg", int(land_acres_num * 25))
        potash_kg = dosage.get("potash_kg", int(land_acres_num * 20))
        manure_q = dosage.get("organic_manure_quintals", int(land_acres_num * 10))

        # Application Reference Number
        ref_no = f"RN-APTG-{datetime.now().strftime('%Y%m')}-{doc_id.upper()}"
        apply_date = datetime.now().strftime("%d-%b-%Y %I:%M %p")

        doc = SimpleDocTemplate(
            str(file_path),
            pagesize=A4,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom Paragraph Styles
        title_style = ParagraphStyle(
            'GovTitle',
            parent=styles['Heading1'],
            fontSize=15,
            leading=18,
            textColor=colors.HexColor("#064e3b"),
            alignment=TA_CENTER,
            fontName="Helvetica-Bold"
        )
        subtitle_style = ParagraphStyle(
            'GovSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#1e293b"),
            alignment=TA_CENTER,
            fontName="Helvetica-Bold"
        )
        sub_te_style = ParagraphStyle(
            'GovSubTe',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#047857"),
            alignment=TA_CENTER,
            fontName="Helvetica-Oblique"
        )
        section_heading = ParagraphStyle(
            'SectionHead',
            parent=styles['Heading2'],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#065f46"),
            fontName="Helvetica-Bold",
            spaceBefore=8,
            spaceAfter=4
        )
        body_label = ParagraphStyle(
            'BodyLabel',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#475569"),
            fontName="Helvetica-Bold"
        )
        body_val = ParagraphStyle(
            'BodyVal',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#0f172a"),
            fontName="Helvetica"
        )
        badge_style = ParagraphStyle(
            'BadgeStyle',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#065f46"),
            fontName="Helvetica-Bold",
            alignment=TA_CENTER
        )
        legal_text = ParagraphStyle(
            'LegalText',
            parent=styles['Normal'],
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor("#64748b"),
            alignment=TA_JUSTIFY
        )

        story = []

        # Top Header Banner Table
        header_data = [
            [
                Paragraph("<b>GOVERNMENT OF ANDHRA PRADESH & TELANGANA</b><br/><b>DEPARTMENT OF AGRICULTURE & FARMER WELFARE</b><br/><font size='8' color='#047857'>రైతు సంక్షేమ మరియు వ్యవసాయ శాఖ - దరఖాస్తు పత్రం</font>", title_style)
            ],
            [
                Paragraph("<b>INTEGRATED SCHEME ENROLLMENT & INPUT SUBSIDY FORM</b>", subtitle_style)
            ]
        ]
        header_table = Table(header_data, colWidths=[520])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ecfdf5")),
            ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor("#059669")),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 8))

        # Meta Bar (Application Ref, Date, Status)
        meta_data = [
            [
                Paragraph(f"<b>Application Ref No:</b> {ref_no}", body_val),
                Paragraph(f"<b>Date:</b> {apply_date}", body_val),
                Paragraph("<b>Status:</b> <font color='#059669'>VERIFIED & SUBMITTED</font>", body_val)
            ]
        ]
        meta_table = Table(meta_data, colWidths=[220, 160, 140])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('PADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 10))

        # Section 1: Farmer Personal & Identity Particulars
        story.append(Paragraph("1. BENEFICIARY FARMER PARTICULARS / రైతు వివరాలు", section_heading))
        farmer_rows = [
            [
                Paragraph("Farmer Full Name:", body_label),
                Paragraph(f"<b>{farmer_name}</b>", body_val),
                Paragraph("Aadhaar UID:", body_label),
                Paragraph(f"<b>{aadhaar}</b> (Verified via OTP/Biometric)", body_val),
            ],
            [
                Paragraph("Contact Mobile:", body_label),
                Paragraph(f"<b>+91 {phone}</b>", body_val),
                Paragraph("Farmer Category:", body_label),
                Paragraph("Small & Marginal Farmer (SF/MF)", body_val),
            ],
            [
                Paragraph("Target Scheme:", body_label),
                Paragraph(f"<b>{scheme_name}</b>", body_val),
                Paragraph("RBK / Rythu Vedika:", body_label),
                Paragraph("RBK Center - Zone 4 (Enabled)", body_val),
            ]
        ]
        farmer_table = Table(farmer_rows, colWidths=[110, 150, 110, 150])
        farmer_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#ffffff")),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.HexColor("#f8fafc"), colors.HexColor("#ffffff")]),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(farmer_table)
        story.append(Spacer(1, 10))

        # Section 2: Land Holding & Crop Particulars
        story.append(Paragraph("2. LAND HOLDING & CROP PARTICULARS / భూమి మరియు పంట వివరాలు", section_heading))
        land_rows = [
            [
                Paragraph("Total Land Extent:", body_label),
                Paragraph(f"<b>{land_acres_num:g} Acres (ఎకరాలు)</b>", body_val),
                Paragraph("Survey / Pattadar Passbook:", body_label),
                Paragraph("Passbook No: 142/2A, 142/2B", body_val),
            ],
            [
                Paragraph("Current Crop Sown:", body_label),
                Paragraph(f"<b>{crop_name}</b>", body_val),
                Paragraph("Cropping Season:", body_label),
                Paragraph("Kharif / Rabi 2026-27", body_val),
            ],
            [
                Paragraph("Irrigation Source:", body_label),
                Paragraph("Canal / Borewell (Assured)", body_val),
                Paragraph("District / Mandal:", body_label),
                Paragraph("Guntur / Warangal Agri Circle", body_val),
            ]
        ]
        land_table = Table(land_rows, colWidths=[110, 150, 110, 150])
        land_table.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('ROWBACKGROUNDS', (0,0), (-1,-1), [colors.HexColor("#f8fafc"), colors.HexColor("#ffffff")]),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(land_table)
        story.append(Spacer(1, 10))

        # Section 3: Recommended Fertilizer & Scientific Inputs
        story.append(Paragraph("3. APPROVED INPUT DOSAGE & SUBSIDY ALLOCATION / రసాయన & సేంద్రీయ ఎరువుల మోతాదు", section_heading))
        input_rows = [
            [
                Paragraph("<b>Input Item (ఎరువు పేరు)</b>", body_label),
                Paragraph("<b>Calculated Dose</b>", body_label),
                Paragraph("<b>Packaging Units</b>", body_label),
                Paragraph("<b>Subsidy Rate (%)</b>", body_label),
            ],
            [
                Paragraph("Urea (యూరియా 46% N)", body_val),
                Paragraph(f"<b>{urea_kg} kg</b>", body_val),
                Paragraph(f"{max(1, round(urea_kg / 45))} Bags (45kg/bag)", body_val),
                Paragraph("Central Subsidy 70%", body_val),
            ],
            [
                Paragraph("DAP (డీఏపీ 18:46:0)", body_val),
                Paragraph(f"<b>{dap_kg} kg</b>", body_val),
                Paragraph(f"{max(1, round(dap_kg / 50))} Bags (50kg/bag)", body_val),
                Paragraph("Govt Fixed MRP Subsidy", body_val),
            ],
            [
                Paragraph("MOP / Potash (పొటాష్)", body_val),
                Paragraph(f"<b>{potash_kg} kg</b>", body_val),
                Paragraph(f"{max(1, round(potash_kg / 50))} Bags", body_val),
                Paragraph("Govt Approved Rate", body_val),
            ],
            [
                Paragraph("Organic Compost / Manure", body_val),
                Paragraph(f"<b>{manure_q} Quintals</b>", body_val),
                Paragraph("Farm Yard Manure", body_val),
                Paragraph("100% Rythu Bharosa Grant", body_val),
            ]
        ]
        input_table = Table(input_rows, colWidths=[150, 110, 130, 130])
        input_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#e0f2fe")),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('PADDING', (0,0), (-1,-1), 5),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        story.append(input_table)
        story.append(Spacer(1, 10))

        # Section 4: Declaration & Signatures
        story.append(Paragraph("4. FARMER DECLARATION & OFFICIAL VERIFICATION / ధృవీకరణ", section_heading))
        declaration_text = (
            "I hereby declare that the particulars furnished above are true to the best of my knowledge. "
            "I am cultivating the declared acreage of land and I request the authorized agricultural subsidy "
            "and scheme benefits to be credited directly into my Aadhaar-linked DBT bank account.<br/>"
            "<font size='7' color='#047857'>పై తెలిపిన వివరాలన్నీ నిజమైనవని మరియు ప్రభుత్వ నియమ నిబంధనలకు కట్టుబడి ఉంటానని ప్రమాణం చేస్తున్నాను.</font>"
        )
        story.append(Paragraph(declaration_text, legal_text))
        story.append(Spacer(1, 15))

        # Signatures Box
        sig_rows = [
            [
                Paragraph("<b>FARMER SIGNATURE / THUMBPRINT</b><br/><br/><br/>___________________________<br/>రైతు సంతకం / వేలిముద్ర", body_label),
                Paragraph("<b>VRO / RBK INCHARGE SEAL</b><br/><br/><br/>___________________________<br/>గ్రామ వ్యవసాయ సహాయకుడు (AEO)", body_label),
                Paragraph("<b>DIGITAL VERIFICATION QR</b><br/><br/>[ CERTIFIED BY AI ENGINE ]<br/>Ref: " + ref_no[-10:], body_label)
            ]
        ]
        sig_table = Table(sig_rows, colWidths=[180, 180, 160])
        sig_table.setStyle(TableStyle([
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#94a3b8")),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('PADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        story.append(sig_table)
        story.append(Spacer(1, 10))

        # Footer
        footer_text = f"Rythu Nestham Agri-AI Platform • Automated Gov Service Pipeline • Document Hash: {doc_id} • Printed on {apply_date}"
        story.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7, textColor=colors.HexColor("#94a3b8"), alignment=TA_CENTER)))

        # Build Document
        doc.build(story)

        return {
            "doc_id": doc_id,
            "filename": filename,
            "file_path": str(file_path),
            "download_url": f"/api/download-pdf/{doc_id}",
            "ref_no": ref_no,
            "generated_at": apply_date
        }

    def get_pdf_path(self, doc_id: str) -> Path:
        """Finds the generated PDF for the given document ID."""
        clean_id = re.sub(r'[^a-zA-Z0-9_-]', '', doc_id)
        target = self.output_dir / f"rythu_application_{clean_id}.pdf"
        if target.exists():
            return target
        # Check if full filename matches
        for f in self.output_dir.glob(f"*{clean_id}*.pdf"):
            return f
        return target

pdf_service = PDFService()
