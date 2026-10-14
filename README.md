# రైతు నేస్తం (Rythu Nestham) - Rural Agri-AI Platform

> **Voice-First Agricultural Web Assistant designed for Farmers in Andhra Pradesh & Telangana, India.**  
> Powered by FastAPI, React 18 + Vite + Tailwind CSS, Sarvam AI / Bhashini Voice Pipelines, Gemini 1.5 Flash Intent Parsing, and ReportLab PDF Generation.

---

## 🌟 Key Highlights & Features

1. **🎙️ Voice-First Telugu Interaction (Sarvam AI / Bhashini & Web Speech API)**
   - High-visibility central microphone designed for rural accessibility.
   - Real-time Telugu speech-to-text (`te-IN`) with live audio waveform visualization.
   - Natural spoken Telugu voice responses powered by Sarvam AI (Bulbul V3) and browser speech synthesis.
   - Pre-built Telugu voice prompt chips for instant 1-click test queries.

2. **🏛️ Government Scheme Exploration & Auto-Fill (PM-KISAN, Rythu Bharosa, Rythu Bima)**
   - Conversational intake of farmer details (Name, Aadhaar, Mobile, Land Acreage, Crop).
   - Structured intent extraction via Gemini 1.5 Flash with rural-friendly Telugu NLP fallbacks.
   - 1-click application form initiation for Central and State agricultural subsidy schemes.

3. **🧪 Precision Acreage Fertilizer & Pesticide Dosage Calculator**
   - University-calibrated (ANGRAU / PJTSAU) dosage algorithms for Paddy, Chilli, Cotton, Maize, and Groundnut.
   - Calculates exact Urea, DAP, Potash, and Organic Compost in kilograms and standard commercial bags.
   - Real-time weather feasibility integration with Open-Meteo: evaluates temperature, wind drift risk, and precipitation to recommend optimal spraying windows.

4. **📈 Real-Time AP & Telangana Mandi Market Prices**
   - Live daily market rates for Guntur Mirchi Yard, Warangal Enamamula Cotton, Khammam Paddy, Kurnool Groundnut, and Nizamabad Turmeric.
   - Price ranges (Min, Modal, Max), daily market trends (+/- ₹), and arrivals.

5. **📄 Official ReportLab PDF Auto-Fill & Live Print Engine**
   - Programmatically builds an authentic, bilingual (Telugu/English) government application form.
   - Displays reference numbers, land particulars, verified fertilizer quotas, and official VRO/AEO signature verification boxes.
   - Instant live PDF iframe preview, download link, and browser auto-print trigger.

---

## 📁 Repository Structure

```
rythu-nestham/
├── backend/
│   ├── main.py                  # FastAPI server entry point & REST APIs
│   ├── config.py                # Environment, storage paths & API keys
│   ├── services/
│   │   ├── voice_service.py     # Sarvam AI STT & TTS + offline fallback chime
│   │   ├── ai_service.py        # Gemini 1.5 Flash JSON intent & entity parser
│   │   ├── pdf_service.py       # ReportLab PDF application generator
│   │   └── mandi_service.py     # Mandi prices & Open-Meteo weather feasibility
│   ├── templates/
│   │   └── scheme_form_template.pdf
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VoiceRecorder.jsx # High-visibility mic button + audio visualizer
│   │   │   ├── SchemeCard.jsx    # Active government schemes & intake trigger
│   │   │   ├── DosageCalc.jsx    # Acreage vs fertilizer calculator UI
│   │   │   └── PdfPreview.jsx    # Live PDF preview and browser print hook
│   │   ├── App.jsx              # Main tabbed dashboard & central audio handler
│   │   ├── index.css            # Tailwind styling, glowing pulses & animations
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Setup & Run Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# (Optional) Set API keys in .env
# SARVAM_API_KEY=your_sarvam_key
# GEMINI_API_KEY=your_gemini_key

# Start FastAPI server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend documentation will be live at `http://localhost:8000/docs`.

### 2. Setup & Run Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The application will be live at `http://localhost:5173`.

---

## ⚡ Offline & Hackathon Demo Fallback Routine
If external API keys (`SARVAM_API_KEY` or `GEMINI_API_KEY`) are not provided, the platform automatically engages its built-in fallback routines:
- **Speech-to-Text**: Utilizes browser Web Speech API (`te-IN`) along with local Telugu NLP query parsing.
- **Intent & Dosage**: Employs an ANGRAU-calibrated Telugu NLP engine that extracts farmer entities, acreage, and crops accurately.
- **Text-to-Speech**: Synthesizes spoken Telugu voice using native browser speech synthesis (`te-IN`) paired with high-quality audio cues.
- **PDF Generation**: Generates 100% genuine ReportLab PDF forms offline without any external network dependency.

