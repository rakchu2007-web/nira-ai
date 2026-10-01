import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, X, Info } from 'lucide-react';

interface PrivacyBannerProps {
  highContrast: boolean;
}

export const PrivacyBanner: React.FC<PrivacyBannerProps> = ({ highContrast }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div
      role="region"
      aria-label="பாதுகாப்பு மற்றும் ரகசியத்தன்மை அறிவிப்பு"
      className={`border-b transition-colors ${
        highContrast
          ? 'bg-amber-950 text-amber-100 border-amber-500'
          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheck className={`w-5 h-5 flex-shrink-0 ${highContrast ? 'text-amber-400' : 'text-emerald-600'}`} />
          <span>
            <strong className="font-bold">பாதுகாப்பு உறுதிமொழி:</strong> NIRA AI உங்கள் ஆதார் எண், வங்கி கணக்கு எண், OTP அல்லது கடவுச்சொல்லை ஒருபோதும் கேட்க மாட்டாது.
          </span>
        </div>

        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition font-semibold flex-shrink-0 ${
            highContrast
              ? 'bg-amber-900 text-amber-200 border-amber-600 hover:bg-amber-800'
              : 'bg-emerald-100/80 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
          }`}
          aria-expanded={showDetails}
        >
          <Info className="w-3.5 h-3.5" />
          <span>{showDetails ? 'மூடு' : 'விவரம்'}</span>
        </button>
      </div>

      {showDetails && (
        <div
          className={`px-4 py-3 border-t max-w-4xl mx-auto text-xs md:text-sm leading-relaxed ${
            highContrast ? 'bg-black text-amber-200 border-amber-700' : 'bg-white text-slate-700 border-emerald-100'
          }`}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">ஏன் இந்த விவரங்களை நாங்கள் சேகரிப்பதில்லை?</p>
              <p>
                1. PMMVY திட்டத்திற்கான பதிவு மற்றும் பணப் பரிவர்த்தனைகள் அனைத்தும் மத்திய & மாநில அரசுகளின் அதிகாரப்பூர்வ தளங்கள் (pmmvy.wcd.gov.in / PICME) மற்றும் உங்கள் பகுதி அங்கன்வாடி மையங்கள் மூலமாக மட்டுமே அதிகாரப்பூர்வமாக நடைபெறும்.
              </p>
              <p>
                2. எந்தவொரு தனியார் இணையதளத்திலோ, செயலியிலோ அல்லது தொலைபேசி அழைப்பிலோ உங்கள் 12 இலக்க ஆதார் எண் அல்லது வங்கி OTP-யை பகிர வேண்டாம்.
              </p>
            </div>
            <button
              onClick={() => setShowDetails(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded ml-auto"
              aria-label="மூடுக"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
