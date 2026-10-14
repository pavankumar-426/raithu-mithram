import React, { useState, useEffect } from 'react';
import { 
  Calculator, Sprout, Wind, Droplets, CloudSun, AlertTriangle, 
  CheckCircle, Plus, Minus, Volume2, ArrowRight, FileCheck 
} from 'lucide-react';

const CROPS = [
  { id: "Paddy", name: "Paddy (వరి)", name_te: "వరి", icon: "🌾", defaultAcres: 4 },
  { id: "Chilli", name: "Chilli (మిర్చి)", name_te: "మిర్చి", icon: "🌶️", defaultAcres: 2 },
  { id: "Cotton", name: "Cotton (పత్తి)", name_te: "పత్తి", icon: "🌱", defaultAcres: 3 },
  { id: "Maize", name: "Maize (మొక్కజొన్న)", name_te: "మొక్కజొన్న", icon: "🌽", defaultAcres: 2 },
  { id: "Groundnut", name: "Groundnut (వేరుశనగ)", name_te: "వేరుశనగ", icon: "🥜", defaultAcres: 3 },
];

export default function DosageCalc({ onGenerateWithDosage, onSpeakText }) {
  const [selectedCrop, setSelectedCrop] = useState(CROPS[0]);
  const [acres, setAcres] = useState(4);
  const [dosageData, setDosageData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch dosage and weather whenever crop or acres change
  useEffect(() => {
    fetchDosage();
  }, [selectedCrop.id, acres]);

  const fetchDosage = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dosage-calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crop_name: selectedCrop.id,
          acres: parseFloat(acres) || 1
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDosageData(data.dosage);
        setWeatherData(data.weather_feasibility);
      }
    } catch (e) {
      console.error("Dosage calculation error:", e);
    } finally {
      setLoading(false);
    }
  };

  const incrementAcres = () => setAcres(prev => Math.min(50, prev + 1));
  const decrementAcres = () => setAcres(prev => Math.max(0.5, prev - 1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
          <Calculator className="w-4 h-4 text-emerald-600" />
          <span>శాస్త్రీయ ఎరువుల మోతాదు క్యాలిక్యులేటర్ (Scientific Dosage Calculator)</span>
        </div>
        <h3 className="text-xl md:text-2xl font-black text-slate-800">
          మీ పంట భూమి విస్తీర్ణం ప్రకారం ఖచ్చితమైన ఎరువుల మోతాదు
        </h3>
        <p className="text-sm text-slate-600">
          ఆచార్య ఎన్.జి. రంగా మరియు ప్రొఫెసర్ జయశంకర్ వ్యవసాయ విశ్వవిద్యాలయాల సిఫార్సుల ఆధారంగా రూపొందించబడింది.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Crop & Acreage Selectors */}
        <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              1. పంటను ఎంచుకోండి (Select Crop):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CROPS.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop)}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    selectedCrop.id === crop.id
                      ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-200 text-emerald-900 font-bold'
                      : 'border-slate-200 hover:border-emerald-300 text-slate-700 font-medium'
                  }`}
                >
                  <span className="text-2xl">{crop.icon}</span>
                  <span className="text-xs">{crop.name_te}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Acreage Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              2. భూమి విస్తీర్ణం - ఎకరాల్లో (Land in Acres):
            </label>
            
            <div className="flex items-center justify-between bg-slate-50 border border-slate-300 rounded-2xl p-3">
              <button
                onClick={decrementAcres}
                className="w-12 h-12 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 shadow-sm text-lg active:scale-95 transition"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="text-center">
                <span className="text-3xl md:text-4xl font-black text-emerald-800 tracking-tight">
                  {acres}
                </span>
                <span className="text-xs font-bold text-slate-500 block uppercase tracking-wider">
                  ఎకరాలు (Acres)
                </span>
              </div>

              <button
                onClick={incrementAcres}
                className="w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center font-bold text-white shadow-sm text-lg active:scale-95 transition"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0.5"
              max="25"
              step="0.5"
              value={acres}
              onChange={(e) => setAcres(parseFloat(e.target.value))}
              className="w-full mt-4 accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>0.5 ఎకరం</span>
              <span>10 ఎకరాలు</span>
              <span>25 ఎకరాలు</span>
            </div>
          </div>

          {/* Live Weather & Spraying Feasibility Advisory Box */}
          {weatherData && (
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-emerald-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <CloudSun className="w-4 h-4 text-amber-500" />
                  <span>రియల్-టైమ్ వాతావరణ స్థితి ({weatherData.location})</span>
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  weatherData.is_spray_feasible
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {weatherData.feasibility_badge}
                </span>
              </div>

              {/* Weather Stats Pill Row */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-semibold">ఉష్ణోగ్రత</span>
                  <span className="font-bold text-slate-800">{weatherData.temperature_c}°C</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-semibold">గాలి వేగం</span>
                  <span className="font-bold text-slate-800">{weatherData.wind_speed_kmh} km/h</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block font-semibold">వర్ష సూచన</span>
                  <span className="font-bold text-slate-800">{weatherData.rain_prob_pct}%</span>
                </div>
              </div>

              {/* Spoken Advisory */}
              <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200 flex items-start gap-2">
                <button
                  onClick={() => onSpeakText(weatherData.advisory_te)}
                  className="p-1 rounded-lg bg-emerald-100 text-emerald-700 shrink-0 hover:bg-emerald-200 transition"
                  title="వాయిస్ సలహా వినండి"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <p className="leading-snug">{weatherData.advisory_te}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Calculated Dosage Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-extrabold text-slate-900">
                  {selectedCrop.name_te} ({acres} ఎకరాలు) - సిఫార్సు చేసిన మోతాదు
                </h4>
                <p className="text-xs text-slate-500">
                  రైతు భరోసా కేంద్రం (RBK) వద్ద ప్రభుత్వం సబ్సిడీపై అందించే పరిమాణం
                </p>
              </div>

              <button
                onClick={() => {
                  if (dosageData) {
                    onSpeakText(`మీ ${acres} ఎకరాల ${selectedCrop.name_te} పంటకు ${dosageData.urea_kg} కిలోల యూరియా అనగా ${dosageData.urea_bags} బస్తాలు, మరియు ${dosageData.dap_kg} కిలోల డీఏపీ అవసరం.`);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>వినండి</span>
              </button>
            </div>

            {/* Dosage Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Urea */}
              <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                    నత్రజని ఎరువు (Nitrogen)
                  </span>
                  <h5 className="text-xl font-black mt-0.5">యూరియా (Urea 46% N)</h5>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black">{dosageData?.urea_kg ?? (acres * 50)}</span>
                    <span className="text-sm font-semibold text-emerald-100">కిలోలు (kg)</span>
                  </div>
                  <div className="mt-2 text-xs font-bold bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-lg inline-block">
                    ≈ {dosageData?.urea_bags ?? Math.max(1, Math.round((acres * 50) / 45))} బస్తాలు (45kg Bags)
                  </div>
                </div>
              </div>

              {/* DAP */}
              <div className="bg-gradient-to-br from-blue-600 to-sky-700 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                    భాస్వరం ఎరువు (Phosphorus)
                  </span>
                  <h5 className="text-xl font-black mt-0.5">డీఏపీ (DAP 18:46:0)</h5>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black">{dosageData?.dap_kg ?? (acres * 25)}</span>
                    <span className="text-sm font-semibold text-blue-100">కిలోలు (kg)</span>
                  </div>
                  <div className="mt-2 text-xs font-bold bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-lg inline-block">
                    ≈ {dosageData?.dap_bags ?? Math.max(1, Math.round((acres * 25) / 50))} బస్తాలు (50kg Bags)
                  </div>
                </div>
              </div>

              {/* Potash */}
              <div className="bg-gradient-to-br from-amber-600 to-yellow-600 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
                    పొటాష్ ఎరువు (Potassium)
                  </span>
                  <h5 className="text-xl font-black mt-0.5">మ్యూరేట్ ఆఫ్ పొటాష్ (MOP)</h5>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black">{dosageData?.potash_kg ?? (acres * 20)}</span>
                    <span className="text-sm font-semibold text-amber-100">కిలోలు (kg)</span>
                  </div>
                  <div className="mt-2 text-xs font-bold bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-lg inline-block">
                    ≈ {dosageData?.potash_bags ?? Math.max(1, Math.round((acres * 20) / 50))} బస్తాలు
                  </div>
                </div>
              </div>

              {/* Organic Manure */}
              <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                    సేంద్రీయ ఎరువు (Organic)
                  </span>
                  <h5 className="text-xl font-black mt-0.5">పశువుల ఎరువు / వర్మీకంపోస్ట్</h5>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl font-black">{dosageData?.organic_manure_quintals ?? (acres * 10)}</span>
                    <span className="text-sm font-semibold text-emerald-200">క్వింటాళ్లు (Quintals)</span>
                  </div>
                  <div className="mt-2 text-xs font-bold bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-lg inline-block">
                    నేల సారాన్ని పెంచుతుంది
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Form Generation Action */}
            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                ఈ ఎరువుల మోతాదు వివరాలతో ప్రభుత్వ సబ్సిడీ దరఖాస్తును రూపొందించండి.
              </p>
              <button
                onClick={() => onGenerateWithDosage({
                  crop_name: selectedCrop.name,
                  land_acres: acres,
                  dosage_recommendation: dosageData
                })}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
              >
                <FileCheck className="w-4 h-4" />
                <span>ఈ మోతాదుతో PDF ఫారం నింపండి (Generate PDF)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

