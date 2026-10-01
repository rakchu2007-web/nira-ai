import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  ExternalLink,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  BadgeHelp,
  Landmark,
  Layers,
} from 'lucide-react';
import { GovernmentScheme, AppSettings } from '../types';
import { explainSchemeSimply } from '../services/api';
import { speakWithBrowserSynthesis, stopCurrentAudio } from '../services/speech';

interface SchemeCardProps {
  scheme: GovernmentScheme;
  settings: AppSettings;
  onAskThozhi: (prompt: string) => void;
  isSpeakingThis: boolean;
  onReadAloud: (text: string) => void;
  onStopSpeaking: () => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  settings,
  onAskThozhi,
  isSpeakingThis,
  onReadAloud,
  onStopSpeaking,
}) => {
  const [simpleExplanation, setSimpleExplanation] = useState<string | null>(null);
  const [isLoadingSimple, setIsLoadingSimple] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(false);

  const handleExplainSimply = async () => {
    if (simpleExplanation) {
      // Toggle read aloud of the simple explanation
      if (isSpeakingThis) {
        onStopSpeaking();
      } else {
        onReadAloud(simpleExplanation);
      }
      return;
    }

    setIsLoadingSimple(true);
    try {
      const officialText = `திட்டம்: ${scheme.nameTa}. அடிப்படை தகுதி: ${scheme.basicEligibilityTa.join('; ')}. பலன்கள்: ${scheme.benefitsTa}. விண்ணப்பிக்கும் முறை: ${scheme.howToApplyTa}.`;
      const res = await explainSchemeSimply(scheme.nameTa, officialText);
      setSimpleExplanation(res.simpleExplanation);

      // Automatically speak the simple explanation
      onReadAloud(res.simpleExplanation);
    } catch (e) {
      console.error('Explain simply error:', e);
      setSimpleExplanation('மன்னிக்கவும், எளிய விளக்கத்தை உருவாக்குவதில் சிரமம். அதிகாரப்பூர்வ தளத்தை பார்க்கவும்.');
    } finally {
      setIsLoadingSimple(false);
    }
  };

  const handleReadCard = () => {
    if (isSpeakingThis) {
      onStopSpeaking();
    } else {
      const fullText = `${scheme.nameTa}. ${scheme.simpleExplanationTa}. பலன்கள்: ${scheme.benefitsTa}. விண்ணப்பிக்கும் முறை: ${scheme.howToApplyTa}. அடுத்த படி: ${scheme.nextStepTa}.`;
      onReadAloud(fullText);
    }
  };

  return (
    <article
      className={`p-5 rounded-3xl border shadow-sm transition-all space-y-4 ${
        settings.highContrast
          ? 'bg-zinc-950 border-amber-400 text-white'
          : 'bg-white border-rose-100 text-slate-800 hover:border-rose-300'
      }`}
    >
      {/* Top Header: Category Tag & Official Verification Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
        <span
          className={`px-3 py-1 rounded-full font-bold flex items-center gap-1.5 ${
            settings.highContrast
              ? 'bg-zinc-800 text-amber-300 border border-amber-500'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{scheme.categoryIcon}</span>
          <span>{scheme.categoryTa}</span>
        </span>

        <span
          className={`px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 text-[11px] ${
            scheme.sourceVerified
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>சரிபார்க்கப்பட்ட அரசு திட்டம்</span>
        </span>
      </div>

      {/* 🏛️ Scheme Name */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base sm:text-lg font-bold flex items-start gap-2 text-slate-900 dark:text-white leading-snug">
            <span className="text-xl flex-shrink-0">🏛️</span>
            <span>{scheme.nameTa}</span>
          </h3>

          {/* Read Aloud button */}
          <button
            type="button"
            onClick={handleReadCard}
            aria-label={isSpeakingThis ? 'வாசிப்பதை நிறுத்து' : 'திட்டத்தை சத்தமாக வாசி'}
            title="திட்ட விவரங்களை சத்தமாக வாசிக்க"
            className={`p-2 rounded-xl text-xs font-semibold transition cursor-pointer flex-shrink-0 active:scale-95 ${
              isSpeakingThis
                ? 'bg-rose-600 text-white animate-pulse'
                : settings.highContrast
                ? 'bg-zinc-800 text-amber-300 border border-amber-500 hover:bg-zinc-700'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            {isSpeakingThis ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-slate-500 font-medium pl-7">{scheme.nameEn}</p>
      </div>

      {/* 💡 Simple Tamil Explanation */}
      <div
        className={`p-3.5 rounded-2xl border text-xs sm:text-sm leading-relaxed ${
          settings.highContrast
            ? 'bg-zinc-900 border-zinc-700 text-amber-100'
            : 'bg-slate-50/80 border-slate-200/80 text-slate-700'
        }`}
      >
        <div className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-amber-300 mb-1">
          <span>💡</span>
          <span>எளிய விளக்கம்:</span>
        </div>
        <p>{scheme.simpleExplanationTa}</p>
      </div>

      {/* ✅ Why It May Be Relevant */}
      <div className="flex items-start gap-2 text-xs sm:text-sm">
        <span className="text-emerald-600 font-bold flex-shrink-0">✅</span>
        <div className="text-slate-700 dark:text-zinc-200">
          <strong className="font-semibold text-slate-900 dark:text-white">ஏன் உங்களுக்கு பொருந்தும்: </strong>
          <span>{scheme.whyRelevantTa}</span>
        </div>
      </div>

      {/* 💰 Benefits (Verified) */}
      <div
        className={`p-3 rounded-2xl border text-xs sm:text-sm ${
          settings.highContrast
            ? 'bg-amber-950/40 border-amber-500 text-amber-200'
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
        }`}
      >
        <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-amber-300 mb-0.5">
          <span>💰</span>
          <span>அரசு வழங்கும் பலன்கள்:</span>
        </div>
        <p className="font-semibold">{scheme.benefitsTa}</p>
      </div>

      {/* Collapsible / Expandable Details for Eligibility, Documents, How to Apply */}
      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={() => setShowAllDetails(!showAllDetails)}
          className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
            settings.highContrast
              ? 'bg-zinc-900 border-zinc-700 text-amber-300 hover:bg-zinc-800'
              : 'bg-rose-50/40 border-rose-200 text-rose-800 hover:bg-rose-50'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>
              {showAllDetails ? 'முழு விவரங்களை மறைக்க' : '📋 தகுதி, ஆவணங்கள் & விண்ணப்பிக்கும் முறை பார்க்க'}
            </span>
          </span>
          <span className="text-xs font-bold">{showAllDetails ? '▲' : '▼'}</span>
        </button>

        {showAllDetails && (
          <div className="space-y-3 pt-2 text-xs sm:text-sm border-t border-slate-100 dark:border-zinc-800">
            {/* 📋 Basic Eligibility */}
            <div className="space-y-1.5">
              <strong className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span>📋</span>
                <span>அடிப்படை தகுதி:</span>
              </strong>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-zinc-300 pl-1">
                {scheme.basicEligibilityTa.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            {/* 📄 Required Documents */}
            <div className="space-y-1.5">
              <strong className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span>📄</span>
                <span>தேவையான ஆவணங்கள் (நேரில் காட்ட மட்டும்):</span>
              </strong>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-zinc-300 pl-1">
                {scheme.requiredDocumentsTa.map((doc, idx) => (
                  <li key={idx}>{doc}</li>
                ))}
              </ul>
            </div>

            {/* 📝 How to Apply */}
            <div className="space-y-1">
              <strong className="font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span>📝</span>
                <span>விண்ணப்பிக்கும் முறை:</span>
              </strong>
              <p className="text-slate-700 dark:text-zinc-300">{scheme.howToApplyTa}</p>
            </div>
          </div>
        )}
      </div>

      {/* ⭐ Special Feature: "எளிமையாக சொல்லு" / "Explain Simply" */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={handleExplainSimply}
          disabled={isLoadingSimple}
          className={`w-full py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs active:scale-98 ${
            settings.highContrast
              ? 'bg-amber-400 text-black hover:bg-amber-300 ring-2 ring-white/50'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-orange-100'
          }`}
        >
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span>
            {isLoadingSimple
              ? 'NIRA AI எளிமையாக விளக்குகிறது...'
              : simpleExplanation
              ? '🔊 எளிய விளக்கத்தை மீண்டும் கேட்க'
              : '✨ இந்த திட்டத்தைப் பற்றி எளிமையாக சொல்லு'}
          </span>
        </button>

        {/* Display Simplified Explanation if fetched */}
        {simpleExplanation && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2 animate-fadeIn ${
              settings.highContrast
                ? 'bg-amber-950/70 border-amber-400 text-amber-100'
                : 'bg-amber-50/90 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300 text-xs">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                NIRA AI-யின் எளிய பேச்சுத் தமிழ் விளக்கம்:
              </span>
              <button
                type="button"
                onClick={() => setSimpleExplanation(null)}
                className="text-amber-800 hover:text-black"
              >
                ✕
              </button>
            </div>
            <p className="whitespace-pre-line leading-relaxed">{simpleExplanation}</p>
          </div>
        )}
      </div>

      {/* 🎯 "என் அடுத்த படி →" Practical Action Box */}
      <div
        className={`p-3.5 rounded-2xl border text-xs sm:text-sm ${
          settings.highContrast
            ? 'bg-zinc-900 border-zinc-700 text-emerald-300'
            : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 mb-1">
          <ArrowRight className="w-4 h-4 text-emerald-600" />
          <span>என் அடுத்த படி (Next Step):</span>
        </div>
        <p className="leading-relaxed">{scheme.nextStepTa}</p>
      </div>

      {/* Bottom Bar: Official Source Link & Ask Thozhi */}
      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2 flex-wrap text-xs">
        {/* Official Source Link */}
        <a
          href={scheme.officialSource}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-slate-600 dark:text-amber-200 hover:text-rose-600 dark:hover:text-amber-300 font-semibold"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>அதிகாரப்பூர்வ தளம் ({scheme.sourceName})</span>
        </a>

        {/* 👉 "இந்த திட்டத்தைப் பற்றி மேலும் தெரிந்துகொள்ள" */}
        <button
          type="button"
          onClick={() =>
            onAskThozhi(`எனக்கு ${scheme.nameTa} திட்டம் பற்றி மேலும் விரிவாக சொல்லுங்கள்.`)
          }
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer active:scale-95 ${
            settings.highContrast
              ? 'bg-zinc-800 text-amber-300 border border-amber-500 hover:bg-zinc-700'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <span>NIRA AI-யிடம் கேட்க</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
};
