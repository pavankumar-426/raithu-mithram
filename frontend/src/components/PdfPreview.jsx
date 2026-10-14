import React, { useState } from 'react';
import { 
  Printer, Download, FileText, CheckCircle2, RefreshCw, 
  User, Phone, CreditCard, MapPin, Sparkles, ExternalLink 
} from 'lucide-react';

export default function PdfPreview({ pdfData, initialEntities, onRegenerate }) {
  const [formData, setFormData] = useState({
    farmer_name: initialEntities?.farmer_name || "కార్తీక్ తల్లూరి (Karthik Talluri)",
    phone: initialEntities?.phone || "9876543210",
    aadhaar: initialEntities?.aadhaar || "XXXX-XXXX-1234",
    scheme_name: initialEntities?.scheme_name || "PM-KISAN & Rythu Bharosa",
    crop_name: initialEntities?.crop_name || "Paddy (వరి)",
    land_acres: initialEntities?.land_acres || 4.0,
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    if (pdfData?.download_url) {
      // Open in a new print window or trigger iframe print
      const printWindow = window.open(pdfData.download_url, '_blank');
      if (printWindow) {
        printWindow.focus();
        printWindow.onload = () => {
          printWindow.print();
        };
      } else {
        window.print();
      }
    } else {
      window.print();
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      await onRegenerate(formData);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>ప్రభుత్వ దరఖాస్తు పత్రం ప్రివ్యూ (Gov Scheme PDF Form)</span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-800">
            ఆటో-ఫిల్ చేయబడిన దరఖాస్తు పత్రం & ముద్రణ
          </h3>
          <p className="text-sm text-slate-600">
            వాయిస్ ద్వారా సేకరించిన సమాచారంతో అధికారి రిపోర్ట్‌ల్యాబ్ PDF సిద్ధం చేయబడింది.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          {pdfData?.download_url && (
            <>
              <a
                href={pdfData.download_url}
                download={pdfData.filename || "rythu_application.pdf"}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>డౌన్‌లోడ్ PDF</span>
              </a>

              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>ప్రింట్ చేయండి (Print Form)</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Details Editor & Verification Info */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>దరఖాస్తుదారు వివరాలు సరిచూడండి (Verify Details)</span>
            </h4>

            <form onSubmit={handleUpdate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">రైతు పేరు (Farmer Name)</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.farmer_name}
                    onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">మొబైల్ నంబర్</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">ఆధార్ నంబర్</label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.aadhaar}
                      onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">భూమి (ఎకరాలు)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.land_acres}
                    onChange={(e) => setFormData({ ...formData, land_acres: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">పంట పేరు</label>
                  <input
                    type="text"
                    value={formData.crop_name}
                    onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">పథకం పేరు (Selected Scheme)</label>
                <input
                  type="text"
                  value={formData.scheme_name}
                  onChange={(e) => setFormData({ ...formData, scheme_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>మార్పులతో కొత్త PDF రూపొందించు (Re-generate)</span>
              </button>
            </form>
          </div>

          {/* Reference Info Card */}
          {pdfData && (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-900 font-bold">
                <span>రెఫరెన్స్ నంబర్ (Ref):</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {pdfData.ref_no || "RN-APTG-2026-X"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>రూపొందించిన సమయం:</span>
                <span>{pdfData.generated_at || new Date().toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 font-medium pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>రైతు భరోసా కేంద్రం (RBK) డిజిటల్ ధృవీకరణ పూర్తయింది.</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: PDF Viewer Frame */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 flex flex-col items-center">
          {pdfData?.download_url ? (
            <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-slate-300 relative bg-slate-100 shadow-inner">
              <iframe
                src={`${pdfData.download_url}#toolbar=0&navpanes=0`}
                title="Generated Application PDF"
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full h-[400px] flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <FileText className="w-16 h-16 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">ఇంకా ఏ దరఖాస్తు పత్రం సిద్ధం కాలేదు</p>
              <p className="text-xs text-slate-400">వాయిస్ ద్వారా "నా దరఖాస్తు ఫారం సిద్ధం చేయి" అని చెప్పండి.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

