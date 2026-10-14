import React, { useState } from 'react';
import { ShieldCheck, FileText, ArrowRight, CheckCircle2, IndianRupee, Volume2, Sparkles, Building2 } from 'lucide-react';

export default function SchemeCard({ schemes, onApplyScheme, onSpeakText }) {
  const [selectedScheme, setSelectedScheme] = useState(null);

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>ప్రభుత్వ వ్యవసాయ పథకాలు (Government Schemes)</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-800">
            ఆంధ్రప్రదేశ్ & తెలంగాణ రైతు సంక్షేమ పథకాలు
          </h3>
          <p className="text-sm text-slate-600">
            అర్హత కలిగిన పథకాలను ఎంచుకోండి, వాయిస్ ద్వారా లేదా సింగిల్ క్లిక్‌తో దరఖాస్తు ఫారమ్ నింపండి.
          </p>
        </div>
      </div>

      {/* Schemes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {schemes.map((scheme) => (
          <div
            key={scheme.id}
            className={`rounded-2xl border transition-all duration-200 bg-white p-5 flex flex-col justify-between shadow-sm hover:shadow-md ${
              selectedScheme?.id === scheme.id
                ? 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/20'
                : 'border-slate-200 hover:border-emerald-300'
            }`}
          >
            <div>
              {/* Category Badge & Audio Prompt */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                  scheme.category.includes('Central')
                    ? 'bg-amber-100 text-amber-800'
                    : scheme.category.includes('Insurance')
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {scheme.category}
                </span>

                <button
                  onClick={() => onSpeakText(`${scheme.name_te}. ఈ పథకం ద్వారా ${scheme.benefit_amount} అందుతుంది. ${scheme.description_te}`)}
                  title="వివరణ వినండి"
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 transition"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Telugu Name */}
              <h4 className="text-lg font-bold text-slate-900 leading-tight">
                {scheme.name_te}
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5 mb-3">
                {scheme.name}
              </p>

              {/* Benefit Amount Callout */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  ₹
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                    లభించే ఆర్థిక సహాయం (Benefit)
                  </span>
                  <span className="text-sm md:text-base font-extrabold text-emerald-950">
                    {scheme.benefit_amount}
                  </span>
                </div>
              </div>

              {/* Description & Eligibility */}
              <div className="space-y-2 text-xs text-slate-600 mb-5">
                <p className="leading-relaxed">
                  <strong className="text-slate-800">వివరణ: </strong>
                  {scheme.description_te}
                </p>
                <p className="leading-relaxed text-slate-500">
                  <strong className="text-slate-700">అర్హత: </strong>
                  {scheme.eligibility_te}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedScheme(scheme);
                  onApplyScheme(scheme);
                }}
                className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow flex items-center justify-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>దరఖాస్తు ఫారం సిద్ధం చేయి (Apply PDF)</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

