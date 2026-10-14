import os
import sys
from pathlib import Path
from typing import Optional, Dict, Any

# Ensure backend root is on sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from config import settings
from services.voice_service import voice_service
from services.ai_service import ai_service
from services.pdf_service import pdf_service
from services.mandi_service import mandi_service

FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Rural Agri-AI Platform for AP & Telangana Farmers - Voice First, Scheme Intake, and Mandi Analytics"
)

# Enable CORS for React Vite development & production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemas
class TextQueryRequest(BaseModel):
    text: str
    crop_name: Optional[str] = None
    land_acres: Optional[float] = None
    farmer_name: Optional[str] = None
    phone: Optional[str] = None

class DosageCalcRequest(BaseModel):
    crop_name: str
    acres: float
    soil_type: Optional[str] = "Red Loamy (ఎర్ర నేలలు)"

class PDFGenerateRequest(BaseModel):
    farmer_name: Optional[str] = "కార్తీక్ తల్లూరి"
    phone: Optional[str] = "9876543210"
    aadhaar: Optional[str] = "XXXX-XXXX-1234"
    scheme_name: Optional[str] = "PM-KISAN"
    crop_name: Optional[str] = "Paddy (వరి)"
    land_acres: Optional[float] = 4.0
    dosage_recommendation: Optional[Dict[str, Any]] = None

@app.get("/")
def root():
    index_path = FRONTEND_DIST / "index.html"
    if FRONTEND_DIST.exists() and index_path.exists():
        return FileResponse(str(index_path))
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "sarvam_configured": bool(settings.SARVAM_API_KEY),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "fallback_enabled": settings.ALLOW_MOCK_FALLBACK
    }

@app.post("/api/process-voice")
async def process_voice(
    file: Optional[UploadFile] = File(None),
    transcript_text: Optional[str] = Form(None)
):
    """
    Core Voice Pipeline:
    1. STT: Converts voice audio into Telugu text transcript.
    2. AI Intent & Entity Extraction: Gemini 1.5 Flash structured parser.
    3. Action Execution: Generates PDF if action_required == GENERATE_PDF.
    4. TTS: Converts Telugu response to natural spoken audio via Sarvam AI.
    """
    transcript = ""
    stt_provider = "direct_text"

    if file:
        audio_bytes = await file.read()
        transcript, stt_provider = voice_service.speech_to_text(audio_bytes, file.filename or "audio.wav")
    elif transcript_text:
        transcript = transcript_text.strip()
    else:
        # Default representative demo query if empty
        transcript, stt_provider = voice_service.speech_to_text(b"", "sample.wav")

    # Step 2: Intent Analysis with Gemini / Telugu Agri-NLP Engine
    ai_result = ai_service.analyze_intent(transcript)

    # Step 3: Handle Action Required (e.g. Generate Application PDF)
    pdf_data = None
    if ai_result.get("action_required") == "GENERATE_PDF":
        entities = ai_result.get("extracted_entities", {})
        pdf_data = pdf_service.generate_scheme_application_pdf(entities)

    # Step 4: Text-To-Speech (TTS) for the Telugu spoken response
    response_te = ai_result.get("user_response_te", "")
    audio_b64, tts_provider = voice_service.text_to_speech(response_te)

    return {
        "transcript": transcript,
        "stt_provider": stt_provider,
        "ai_result": ai_result,
        "pdf_data": pdf_data,
        "audio_base64": audio_b64,
        "tts_provider": tts_provider
    }

@app.post("/api/process-text")
def process_text(req: TextQueryRequest):
    """Processes a text-based query through the AI & PDF pipeline with TTS response."""
    ai_result = ai_service.analyze_intent(req.text)
    
    # Enrich with explicit fields if provided
    entities = ai_result.get("extracted_entities", {})
    if req.crop_name:
        entities["crop_name"] = req.crop_name
    if req.land_acres:
        entities["land_acres"] = req.land_acres
    if req.farmer_name:
        entities["farmer_name"] = req.farmer_name
    if req.phone:
        entities["phone"] = req.phone
    ai_result["extracted_entities"] = entities

    pdf_data = None
    if ai_result.get("action_required") == "GENERATE_PDF":
        pdf_data = pdf_service.generate_scheme_application_pdf(entities)

    response_te = ai_result.get("user_response_te", "")
    audio_b64, tts_provider = voice_service.text_to_speech(response_te)

    return {
        "transcript": req.text,
        "ai_result": ai_result,
        "pdf_data": pdf_data,
        "audio_base64": audio_b64,
        "tts_provider": tts_provider
    }

@app.post("/api/generate-pdf")
def generate_pdf(req: PDFGenerateRequest):
    """Explicitly triggers government application form PDF generation."""
    entities = {
        "farmer_name": req.farmer_name,
        "phone": req.phone,
        "aadhaar": req.aadhaar,
        "scheme_name": req.scheme_name,
        "crop_name": req.crop_name,
        "land_acres": req.land_acres,
        "dosage_recommendation": req.dosage_recommendation
    }
    pdf_info = pdf_service.generate_scheme_application_pdf(entities)
    return pdf_info

@app.get("/api/download-pdf/{doc_id}")
def download_pdf(doc_id: str):
    """Downloads or streams the generated official PDF for inline viewing and browser printing."""
    pdf_path = pdf_service.get_pdf_path(doc_id)
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="Requested PDF application document not found")
    
    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=pdf_path.name,
        headers={
            "Content-Disposition": f"inline; filename={pdf_path.name}"
        }
    )

@app.get("/api/mandi-rates")
def get_mandi_rates(crop: Optional[str] = Query(None)):
    """Fetches real-time Mandi crop prices and weather spraying feasibility."""
    prices = mandi_service.get_mandi_prices(crop)
    weather = mandi_service.get_weather_feasibility()
    return {
        "timestamp": "2026-10-14",
        "market_prices": prices,
        "weather_feasibility": weather
    }

@app.post("/api/dosage-calculate")
def calculate_dosage(req: DosageCalcRequest):
    """Precision acreage-based fertilizer & pesticide dosage calculator."""
    crops_table = {
        "Paddy": {
            "crop_te": "వరి",
            "urea_per_acre": 50,
            "dap_per_acre": 25,
            "potash_per_acre": 20,
            "organic_manure_qtl": 10,
            "spray_notes_te": "వరి నాట్లు వేసిన 20 రోజులకు మొదటి యూరియా, చిరుపొట్ట దశలో రెండో దఫా వేయాలి.",
            "water_requirement": "హై (నీరు నిల్వ ఉంచాలి)"
        },
        "Chilli": {
            "crop_te": "మిర్చి / మిరప",
            "urea_per_acre": 60,
            "dap_per_acre": 40,
            "potash_per_acre": 35,
            "organic_manure_qtl": 15,
            "spray_notes_te": "తామర పురుగు (Thrips) నివారణకు వేపనూనె లేదా సిఫార్సు చేసిన పురుగు మందు పిచికారీ చేయాలి.",
            "water_requirement": "మధ్యస్థం (తేమ ఆరనివ్వకూడదు)"
        },
        "Cotton": {
            "crop_te": "పత్తి",
            "urea_per_acre": 45,
            "dap_per_acre": 30,
            "potash_per_acre": 25,
            "organic_manure_qtl": 12,
            "spray_notes_te": "గులాబీ రంగు కాయతొలుచు పురుగు (PBW) పర్యవేక్షణకు లింగాకర్షక బుట్టలు ఏర్పాటు చేయండి.",
            "water_requirement": "మధ్యస్థం"
        },
        "Maize": {
            "crop_te": "మొక్కజొన్న",
            "urea_per_acre": 50,
            "dap_per_acre": 30,
            "potash_per_acre": 20,
            "organic_manure_qtl": 10,
            "spray_notes_te": "కత్తెర పురుగు (Fall Armyworm) నివారణకు సుడిలో గుళికలు లేదా స్ప్రే చేయండి.",
            "water_requirement": "మధ్యస్థం"
        },
        "Groundnut": {
            "crop_te": "వేరుశనగ",
            "urea_per_acre": 20,
            "dap_per_acre": 40,
            "potash_per_acre": 25,
            "organic_manure_qtl": 10,
            "spray_notes_te": "టిక్కా ఆకుమచ్చ తెగులు రాకుండా మాంకోజెబ్ 2 గ్రా/లీటరు నీటికి కలిపి పిచికారీ చేయాలి.",
            "water_requirement": "తక్కువ"
        }
    }

    info = crops_table.get(req.crop_name, crops_table["Paddy"])
    urea_total = int(info["urea_per_acre"] * req.acres)
    dap_total = int(info["dap_per_acre"] * req.acres)
    potash_total = int(info["potash_per_acre"] * req.acres)
    manure_total = int(info["organic_manure_qtl"] * req.acres)

    weather = mandi_service.get_weather_feasibility()

    return {
        "crop_name": req.crop_name,
        "crop_te": info["crop_te"],
        "acres": req.acres,
        "dosage": {
            "urea_kg": urea_total,
            "urea_bags": max(1, round(urea_total / 45)),
            "dap_kg": dap_total,
            "dap_bags": max(1, round(dap_total / 50)),
            "potash_kg": potash_total,
            "potash_bags": max(1, round(potash_total / 50)),
            "organic_manure_quintals": manure_total
        },
        "advisory_te": info["spray_notes_te"],
        "weather_feasibility": weather
    }

@app.get("/api/schemes")
def get_schemes():
    """Returns curated Government schemes available for AP & Telangana farmers."""
    return [
        {
            "id": "pm-kisan",
            "name": "PM-KISAN Samman Nidhi",
            "name_te": "పీఎం కిసాన్ సమ్మాన్ నిధి",
            "benefit_amount": "₹6,000 / ఏడాదికి (3 విడతల్లో)",
            "description_te": "భూమి ఉన్న రైతులందరికీ పెట్టుబడి సాయంగా నేరుగా బ్యాంక్ ఖాతాలో జమ అవుతుంది.",
            "eligibility_te": "భూమి యజమానులు, ఆధార్-బ్యాంక్ లింక్ తప్పనిసరి. చిన్న/సన్నకారు రైతులు.",
            "category": "Central",
            "color": "emerald"
        },
        {
            "id": "rythu-bharosa",
            "name": "Rythu Bharosa / Rythu Bandhu",
            "name_te": "రైతు భరోసా / రైతు బంధు",
            "benefit_amount": "₹13,500 - ₹15,000 / ఏడాదికి",
            "description_te": "ఖరీఫ్ మరియు రబీ సీజన్లలో ఎరువులు, విత్తనాల కొనుగోలుకు అదనపు రాష్ట్ర ప్రభుత్వ తోడ్పాటు.",
            "eligibility_te": "పట్టాదారు పాస్‌బుక్ కలిగి ఉన్న రైతులు మరియు కౌలు రైతులు (CCRC కార్డుదారులు).",
            "category": "State (AP/TG)",
            "color": "blue"
        },
        {
            "id": "rythu-bima",
            "name": "Rythu Bima Life Insurance",
            "name_te": "రైతు బీమా (జీవిత బీమా రక్షణ)",
            "benefit_amount": "₹5,00,000 పూర్తి ఉచిత బీమా",
            "description_te": "రైతు మరణించిన సందర్భంలో కుటుంబానికి 10 రోజుల్లో ₹5 లక్షల ఆర్థిక సహాయం.",
            "eligibility_te": "18 నుండి 59 సంవత్సరాల వయస్సు కలిగిన పట్టాదారు రైతులు. ప్రభుత్వమే ప్రీమియం చెల్లిస్తుంది.",
            "category": "Insurance",
            "color": "amber"
        },
        {
            "id": "pm-fasal-bima",
            "name": "PM Fasal Bima Yojana (PMFBY)",
            "name_te": "ప్రధానమంత్రి ఫసల్ బీమా యోజన",
            "benefit_amount": "పంట నష్టం పై 100% పరిహారం",
            "description_te": "అకాల వర్షాలు, తుఫానులు, కరువు వల్ల పంట నష్టపోతే బీమా క్లెయిమ్ అందుతుంది.",
            "eligibility_te": "నోటిఫై చేసిన పంటలను సాగు చేసే రైతులందరూ అర్హులు. ప్రీమియం 1.5% - 2% మాత్రమే.",
            "category": "Crop Insurance",
            "color": "purple"
        },
        {
            "id": "sunna-vaddi",
            "name": "YSR Sunna Vaddi Panta Runalu",
            "name_te": "సున్నా వడ్డీ పంట రుణాలు",
            "benefit_amount": "0% వడ్డీ (లక్ష రూపాయల వరకు)",
            "description_te": "సకాలంలో పంట రుణాలు తిరిగి చెల్లించే రైతులకు వడ్డీ రాయితీ ప్రభుత్వం భరిస్తుంది.",
            "eligibility_te": "లక్ష రూపాయల లోపు పంట రుణం తీసుకొని ఏడాదిలోపు తీర్చిన రైతులకు వర్తిస్తుంది.",
            "category": "Credit",
            "color": "teal"
        }
    ]

# Serve compiled frontend static assets in production (Cloud Run / Docker)
if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        # Exclude /docs, /redoc, /openapi.json and API routes
        if full_path.startswith("api") or full_path in ["docs", "redoc", "openapi.json"]:
            raise HTTPException(status_code=404, detail="Not Found")
        target_file = FRONTEND_DIST / full_path
        if target_file.exists() and target_file.is_file():
            return FileResponse(str(target_file))
        return FileResponse(str(FRONTEND_DIST / "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
