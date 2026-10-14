import React, { useState, useEffect } from 'react';
import { 
  Sprout, Mic, FileText, Calculator, TrendingUp, CloudSun, 
  PhoneCall, ShieldCheck, CheckCircle2, AlertCircle, ArrowUpRight, 
  ArrowDownRight, Volume2, Sparkles, Building2, HelpCircle 
} from 'lucide-react';

import VoiceRecorder from './components/VoiceRecorder';
import SchemeCard from './components/SchemeCard';
import DosageCalc from './components/DosageCalc';
import PdfPreview from './components/PdfPreview';

export default function App() {
  const [activeTab, setActiveTab] = useState('voice');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [mandiData, setMandiData] = useState({ market_prices: [], weather_feasibility: null });
  const [selectedCropFilter, setSelectedCropFilter] = useState('');
  const [systemNotice, setSystemNotice] = useState(null);

  // Fetch initial schemes and mandi data
  useEffect(() => {
    fetchSchemes();
    fetchMandiRates();
  }, []);

  const fetchSchemes = async () => {
    try {
      const res = await fetch("/api/schemes");
      if (res.ok) {
        const data = await res.json();
        setSchemes(data);
      }
    } catch (e) {
      console.warn("Could not fetch schemes:", e);
    }
  };

  const fetchMandiRates = async (crop = '') => {
    try {
      const url = crop ? `/api/mandi-rates?crop=${encodeURIComponent(crop)}` : "/api/mandi-rates";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMandiData(data);
      }
    } catch (e) {
      console.warn("Could not fetch mandi rates:", e);
    }
  };

  // Central Telugu Text-to-Speech Player for any component
  const speakTeluguText = (text) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'te-IN';
    utterance.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const teVoice = voices.find(v => v.lang.startsWith('te') || v.name.includes('Telugu'));
    if (teVoice) utterance.voice = teVoice;
    window.speechSynthesis.speak(utterance);
  };

  // Result Callback from VoiceRecorder
  const handleVoiceResult = (data) => {
    setVoiceResult(data);

    // If PDF was generated as part of the action, store it and optionally switch to PDF view
    if (data.pdf_data) {
      setPdfData(data.pdf_data);
      setSystemNotice("మీ దరఖాస్తు పత్రం సిద్ధమైంది! ప్రివ్యూ చూడటానికి 'దరఖాస్తు పత్రం' ట్యాబ్ నొక్కండి.");
    } else if (data.ai_result?.intent === "MANDI_RATES") {
      setActiveTab('mandi');
    } else if (data.ai_result?.intent === "CROP_DOSAGE") {
      setActiveTab('dosage');
    }
  };

  // Trigger Scheme Application from SchemeCard
  const handleApplyScheme = async (scheme) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_name: "శ్రీ కార్తీక్ తల్లూరి (Karthik Talluri)",
          phone: "9876543210",
          aadhaar: "XXXX-XXXX-1234",
          scheme_name: scheme.name_te || scheme.name,
          crop_name: "Paddy (వరి)",
          land_acres: 4.0
        })
      });
      if (res.ok) {
        const generated = await res.json();
        setPdfData(generated);
        setActiveTab('pdf');
        speakTeluguText(`${scheme.name_te} కోసం మీ దరఖాస్తు పత్రం సిద్ధమైంది. ప్రింట్ లేదా డౌన్‌లోడ్ చేసుకోవచ్చు.`);
      }
    } catch (err) {
      console.error("Apply scheme error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate PDF from Dosage Calculator values
  const handleGenerateWithDosage = async (calcData) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmer_name: "శ్రీ కార్తీక్ తల్లూరి (Karthik Talluri)",
          phone: "9876543210",
          aadhaar: "XXXX-XXXX-1234",
          scheme_name: "PM-KISAN & Rythu Bharosa Input Subsidy",
          crop_name: calcData.crop_name,
          land_acres: calcData.land_acres,
          dosage_recommendation: calcData.dosage_recommendation
        })
      });
      if (res.ok) {
        const generated = await res.json();
        setPdfData(generated);
        setActiveTab('pdf');
        speakTeluguText(`మీ ${calcData.land_acres} ఎకరాల పంటకు ఎరువుల సబ్సిడీ దరఖాస్తు పత్రం సిద్ధమైంది.`);
      }
    } catch (err) {
      console.error("Generate with dosage error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Re-generate PDF with customized details
  const handleRegeneratePdf = async (formData) => {
    const res = await fetch("/api/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      const generated = await res.json();
      setPdfData(generated);
      speakTeluguText("మీ దరఖాస్తు పత్రం నవీకరించబడింది.");
    }
  };

  const weather = mandiData?.weather_feasibility;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f8f5] text-slate-800">
      {/* Top Govt Emblem & Helpline Bar */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 text-white text-xs py-2 px-4 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-emerald-300">భారత ప్రభుత్వం • ఆంధ్రప్రదేశ్ & తెలంగాణ రాష్ట్ర వ్యవసాయ శాఖ</span>
            <span className="hidden md:inline text-emerald-500">|</span>
            <span className="hidden md:inline text-emerald-200">Rythu Nestham Agri-AI Portal</span>
          </div>

          <div className="flex items-center gap-4 text-emerald-200">
            {weather && (
              <div className="flex items-center gap-1.5 bg-emerald-800/60 px-2.5 py-0.5 rounded-full border border-emerald-700">
                <CloudSun className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-semibold text-[11px]">{weather.location}: {weather.temperature_c}°C ({weather.feasibility_badge.split(' ')[0]})</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>కిసాన్ హెల్ప్‌లైన్: <strong>155251</strong> / 1800-425-3030</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-emerald-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('voice')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 text-2xl">
              🌾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  రైతు నేస్తం
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800">
                  RYTHU NESTHAM AI
                </span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                గ్రామీణ వ్యవసాయ వాయిస్ అసిస్టెంట్ & దరఖాస్తు వేదిక
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('voice')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'voice'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/50'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>వాయిస్ అసిస్టెంట్</span>
            </button>

            <button
              onClick={() => setActiveTab('schemes')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'schemes'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>పథకాలు (Schemes)</span>
            </button>

            <button
              onClick={() => setActiveTab('dosage')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'dosage'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>ఎరువుల మోతాదు</span>
            </button>

            <button
              onClick={() => setActiveTab('mandi')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap ${
                activeTab === 'mandi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>మార్కెట్ ధరలు</span>
            </button>

            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap relative ${
                activeTab === 'pdf'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-white/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>దరఖాస్తు PDF</span>
              {pdfData && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1 animate-pulse" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Notification banner if PDF ready */}
      {systemNotice && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 flex items-center justify-between shadow-sm">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              {systemNotice}
            </span>
            <button
              onClick={() => setActiveTab('pdf')}
              className="bg-white text-emerald-900 px-3 py-1 rounded-lg text-xs font-black hover:bg-emerald-50 transition"
            >
              ఓపెన్ చేయండి (Open PDF)
            </button>
          </div>
        </div>
      )}

      {/* Main Body Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab 1: Central Voice Assistant */}
        {activeTab === 'voice' && (
          <div className="space-y-8">
            <VoiceRecorder
              onResultReceived={handleVoiceResult}
              activeResult={voiceResult}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />

            {/* If voice result returned, show instant structured summary cards */}
            {voiceResult?.ai_result && (
              <div className="bg-white rounded-3xl border border-emerald-100 p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold">
                      <Sparkles className="w-5 h-5 text-emerald-700" />
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-slate-800">
                        ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ విశ్లేషణ ఫలితాలు (AI Analysis)
                      </h3>
                      <p className="text-xs text-slate-500">
                        గుర్తించిన అంశాలు: Intent = {voiceResult.ai_result.intent} • Provider = {voiceResult.stt_provider || "AI Engine"}
                      </p>
                    </div>
                  </div>

                  {voiceResult.pdf_data && (
                    <button
                      onClick={() => setActiveTab('pdf')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow flex items-center gap-2 transition"
                    >
                      <FileText className="w-4 h-4" />
                      <span>రూపొందించిన PDF చూడండి</span>
                    </button>
                  )}
                </div>

                {/* Spoken Response Box */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    రైతుకు సమాధానం (Telugu Spoken Response):
                  </span>
                  <p className="text-base md:text-lg font-bold text-emerald-950 leading-relaxed">
                    "{voiceResult.ai_result.user_response_te}"
                  </p>
                </div>

                {/* Extracted Entities Grid */}
                {voiceResult.ai_result.extracted_entities && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      గుర్తించిన వివరాలు (Extracted Entities):
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
                      {voiceResult.ai_result.extracted_entities.farmer_name && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">రైతు పేరు</span>
                          <span className="font-extrabold text-slate-800 text-sm">
                            {voiceResult.ai_result.extracted_entities.farmer_name}
                          </span>
                        </div>
                      )}

                      {voiceResult.ai_result.extracted_entities.land_acres && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">భూమి విస్తీర్ణం</span>
                          <span className="font-extrabold text-emerald-700 text-sm">
                            {voiceResult.ai_result.extracted_entities.land_acres} ఎకరాలు
                          </span>
                        </div>
                      )}

                      {voiceResult.ai_result.extracted_entities.crop_name && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">పంట</span>
                          <span className="font-extrabold text-slate-800 text-sm">
                            {voiceResult.ai_result.extracted_entities.crop_name}
                          </span>
                        </div>
                      )}

                      {voiceResult.ai_result.extracted_entities.scheme_name && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-slate-400 block text-[10px] font-bold uppercase">పథకం</span>
                          <span className="font-extrabold text-slate-800 text-sm">
                            {voiceResult.ai_result.extracted_entities.scheme_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Government Schemes */}
        {activeTab === 'schemes' && (
          <SchemeCard
            schemes={schemes}
            onApplyScheme={handleApplyScheme}
            onSpeakText={speakTeluguText}
          />
        )}

        {/* Tab 3: Fertilizer Dosage Calculator */}
        {activeTab === 'dosage' && (
          <DosageCalc
            onGenerateWithDosage={handleGenerateWithDosage}
            onSpeakText={speakTeluguText}
          />
        )}

        {/* Tab 4: Mandi Market Rates & Weather */}
        {activeTab === 'mandi' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>రియల్-టైమ్ వ్యవసాయ మార్కెట్ ధరలు (Mandi Prices)</span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-slate-800">
                  ఆంధ్రప్రదేశ్ & తెలంగాణ మార్కెట్ యార్డుల తాజా ధరలు
                </h3>
                <p className="text-sm text-slate-600">
                  గుంటూరు మిర్చి యార్డు, వరంగల్ ఎనుమాముల, ఖమ్మం, కర్నూలు మరియు నిజామాబాద్ ధరల వివరాలు.
                </p>
              </div>

              {/* Crop Filter Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {['', 'Chilli', 'Cotton', 'Paddy', 'Turmeric', 'Maize'].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedCropFilter(c);
                      fetchMandiRates(c);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                      selectedCropFilter === c
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    {c === '' ? 'అన్ని పంటలు (All)' : c}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather Feasibility Banner for Mandi Tab */}
            {weather && (
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 rounded-2xl border border-emerald-200 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                    <CloudSun className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      వ్యవసాయ వాతావరణం & రవాణా స్థితి: {weather.location}
                    </h4>
                    <p className="text-xs text-slate-600">
                      ఉష్ణోగ్రత: {weather.temperature_c}°C • గాలి వేగం: {weather.wind_speed_kmh} km/h • వర్షం: {weather.rain_prob_pct}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    weather.is_spray_feasible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {weather.feasibility_badge}
                  </span>
                  <button
                    onClick={() => speakTeluguText(weather.advisory_te)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 transition"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Mandi Rates Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mandiData.market_prices.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span className="font-semibold">{item.district}, {item.state}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold">
                        {item.unit}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                      {item.crop}
                    </h4>
                    <p className="text-xs text-slate-500 mb-3">{item.mandi_name}</p>

                    {/* Modal Price Highlight */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        ప్రస్తుత సగటు ధర (Modal Price)
                      </span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className="text-2xl font-black text-emerald-700">
                          ₹{item.modal_price.toLocaleString()}
                        </span>
                        <span className={`text-xs font-bold flex items-center ${
                          item.trend === 'up' ? 'text-emerald-600' : item.trend === 'down' ? 'text-rose-600' : 'text-slate-500'
                        }`}>
                          {item.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {item.trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
                          {item.change_rs !== 0 ? `₹${Math.abs(item.change_rs)}` : 'స్థిరం'}
                        </span>
                      </div>
                    </div>

                    {/* Min & Max Range */}
                    <div className="flex justify-between text-xs text-slate-600 pt-1">
                      <span>కనిష్టం: <strong>₹{item.min_price.toLocaleString()}</strong></span>
                      <span>గరిష్టం: <strong>₹{item.max_price.toLocaleString()}</strong></span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">రాక: {item.arrivals_qtl.toLocaleString()} క్వింటాళ్లు</span>
                    <button
                      onClick={() => speakTeluguText(`${item.mandi_name} లో ${item.crop} సగటు ధర క్వింటాలుకు ₹${item.modal_price} గా ఉంది.`)}
                      className="p-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                      title="వాయిస్ ద్వారా వినండి"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Live PDF Preview & Print Engine */}
        {activeTab === 'pdf' && (
          <PdfPreview
            pdfData={pdfData}
            initialEntities={voiceResult?.ai_result?.extracted_entities}
            onRegenerate={handleRegeneratePdf}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌾</span>
            <span className="font-bold text-slate-700">రైతు నేస్తం (Rythu Nestham)</span>
            <span>• Rural Agri-AI Platform for AP & Telangana</span>
          </div>
          <div className="flex items-center gap-4">
            <span>FastAPI + React 18 + Sarvam AI / Bhashini + Gemini 1.5 Flash + ReportLab</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">2026 Hackathon Edition</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

