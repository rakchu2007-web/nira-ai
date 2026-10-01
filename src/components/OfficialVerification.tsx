import React, { useState } from 'react';
import { ExternalLink, Phone, ShieldCheck, FileCheck, CheckCircle2, AlertOctagon, HelpCircle, Volume2 } from 'lucide-react';
import { VERIFIED_HELPLINES, OFFICIAL_PORTALS, MANDATORY_DOCUMENTS, PMMVY_SCHEME_INFO } from '../data/pmmvyData';
import { AppSettings } from '../types';
import { speakWithBrowserSynthesis, stopCurrentAudio } from '../services/speech';

interface OfficialVerificationProps {
  settings: AppSettings;
}

export const OfficialVerification: React.FC<OfficialVerificationProps> = ({ settings }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleReadAloud = (text: string) => {
    if (isSpeaking) {
      stopCurrentAudio();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakWithBrowserSynthesis(
        text,
        () => setIsSpeaking(false),
        () => setIsSpeaking(false)
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full space-y-6">
      {/* Official Verification Header */}
      <div
        className={`p-6 rounded-3xl border shadow-xs transition-colors ${
          settings.highContrast
            ? 'bg-zinc-900 border-amber-400 text-amber-100'
            : 'bg-white border-rose-200 text-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                100% அரசாங்கத்தால் சரிபார்க்கப்பட்டது
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold">
              அதிகாரப்பூர்வ தகவல்கள் & உதவி மையங்கள்
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-amber-200">
              மத்திய பெண்கள் மற்றும் குழந்தைகள் மேம்பாட்டு அமைச்சகம் (WCD) மற்றும் தமிழ்நாடு அரசு சுகாதார வழிகாட்டுதல்கள்.
            </p>
          </div>

          <button
            onClick={() =>
              handleReadAloud(
                'அதிகாரப்பூர்வ தகவல்கள் சரிபார்ப்பு பகுதி. மத்திய அரசின் PMMVY இணையதளம் pmmvy.wcd.gov.in. பெண்கள் உதவி எண் 181, சுகாதார உதவி எண் 104.'
              )
            }
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold self-start sm:self-auto transition cursor-pointer active:scale-95 ${
              isSpeaking
                ? 'bg-rose-600 text-white animate-pulse'
                : settings.highContrast
                ? 'bg-zinc-800 text-amber-300 border border-amber-500'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isSpeaking ? 'நிறுத்து' : 'பகுதியை வாசி'}</span>
          </button>
        </div>
      </div>

      {/* Official Government Portals Section */}
      <div className="space-y-3">
        <h3 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-amber-300">
          <ExternalLink className="w-4 h-4 text-rose-600 dark:text-amber-400" />
          அதிகாரப்பூர்வ அரசு இணையதளங்கள் (Official Portals)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OFFICIAL_PORTALS.map((portal, idx) => (
            <a
              key={idx}
              href={portal.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-4 rounded-2xl border transition group block ${
                settings.highContrast
                  ? 'bg-zinc-950 border-amber-400 hover:bg-zinc-900 text-white'
                  : 'bg-white border-slate-200 hover:border-rose-400 hover:shadow-xs text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm md:text-base group-hover:text-rose-600 dark:group-hover:text-amber-300">
                  {portal.titleTa}
                </span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
              </div>
              <p className="text-xs text-slate-500 mt-1">{portal.descTa}</p>
              <span className="text-[11px] font-mono text-rose-700 dark:text-amber-400 mt-2 block break-all">
                {portal.url}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Verified Government Toll-Free Helplines */}
      <div className="space-y-3">
        <h3 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-amber-300">
          <Phone className="w-4 h-4 text-emerald-600" />
          சரிபார்க்கப்பட்ட அரசு இலவச உதவி எண்கள் (Toll-Free Helplines)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VERIFIED_HELPLINES.map((helpline, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                settings.highContrast
                  ? 'bg-zinc-950 border-amber-400 text-white'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="space-y-1">
                <strong className="block text-sm font-bold text-slate-900 dark:text-white">
                  {helpline.nameTa}
                </strong>
                <p className="text-xs text-slate-500">{helpline.descTa}</p>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block font-medium">
                  {helpline.available}
                </span>
              </div>

              <a
                href={`tel:${helpline.number}`}
                className={`px-3 py-1.5 rounded-xl font-mono font-bold text-sm flex items-center gap-1.5 transition flex-shrink-0 ${
                  settings.highContrast
                    ? 'bg-amber-400 text-black'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                {helpline.number}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Physical Verification Documents */}
      <div className="space-y-3">
        <h3 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-amber-300">
          <FileCheck className="w-4 h-4 text-rose-600 dark:text-amber-400" />
          அங்கன்வாடியில் சமர்ப்பிக்க வேண்டிய அசல் ஆவணங்கள் சரிபார்ப்பு
        </h3>
        <div
          className={`p-5 rounded-3xl border space-y-3 ${
            settings.highContrast
              ? 'bg-zinc-950 border-amber-400 text-white'
              : 'bg-white border-rose-100 text-slate-800'
          }`}
        >
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              <strong>கவனிக்க:</strong> இந்த ஆவணங்களின் நகல்களை உங்கள் கிராம சுகாதார செவிலியர் (VHN) அல்லது அங்கன்வாடி மையத்தில் மட்டுமே சமர்ப்பிக்க வேண்டும். எந்த இணையதளத்திலும் உங்கள் அசல் எண்களைப் பதிவு செய்யக் கூடாது.
            </span>
          </div>

          <div className="space-y-2">
            {MANDATORY_DOCUMENTS.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs md:text-sm text-slate-900 dark:text-white">
                    {doc.nameTa}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{doc.descTa}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fraud Prevention Advice */}
      <div
        className={`p-4 rounded-2xl border text-xs md:text-sm leading-relaxed ${
          settings.highContrast
            ? 'bg-amber-950/40 border-amber-500 text-amber-200'
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}
      >
        <h4 className="font-bold mb-1 flex items-center gap-1.5">
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          மோசடி எச்சரிக்கை & விழிப்புணர்வு:
        </h4>
        <p>
          அரசு திட்டங்களுக்காக எந்தவொரு அரசு அதிகாரியோ, செவிலியரோ உங்களிடம் பணம் கேட்க மாட்டார்கள். வங்கி விவரங்கள், ஆதார் OTP அல்லது பணம் செலுத்தக் கோரும் எந்த குறுஞ்செய்தி (SMS) அல்லது தொலைபேசி அழைப்புகளையும் நம்பாதீர்கள். சந்தேகம் இருந்தால் உடனடியாக 181 பெண்கள் உதவி மையத்தை அழைக்கவும்.
        </p>
      </div>
    </div>
  );
};
