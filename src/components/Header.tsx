import React from 'react';
import { RotateCcw, Volume2, VolumeX, Eye, Sparkles, MessageCircleQuestion, HelpCircle, Compass, Layers } from 'lucide-react';
import { AppSettings, FontSize } from '../types';

interface HeaderProps {
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  onStartAgain: () => void;
  activeTab: 'navigator' | 'chat' | 'eligibility' | 'official';
  setActiveTab: (tab: 'navigator' | 'chat' | 'eligibility' | 'official') => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onUpdateSettings,
  onStartAgain,
  activeTab,
  setActiveTab,
}) => {
  const handleFontSizeCycle = () => {
    onUpdateSettings((prev) => {
      const order: FontSize[] = ['normal', 'large', 'xlarge'];
      const nextIdx = (order.indexOf(prev.fontSize) + 1) % order.length;
      return { ...prev, fontSize: order[nextIdx] };
    });
  };

  const getFontSizeLabel = (size: FontSize) => {
    switch (size) {
      case 'normal':
        return 'எழுத்து: இயல்பு';
      case 'large':
        return 'எழுத்து: பெரிது';
      case 'xlarge':
        return 'எழுத்து: மிகப்பெரிது';
    }
  };

  return (
    <header
      className={`border-b sticky top-0 z-30 shadow-xs transition-colors ${
        settings.highContrast
          ? 'bg-black text-white border-amber-500'
          : 'bg-white/95 backdrop-blur-md text-slate-800 border-rose-100'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-2.5">
        {/* Top bar with branding & core actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Logo & Persona Name */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center shadow-sm font-extrabold text-xs md:text-sm tracking-tight transition-transform hover:scale-105 flex-shrink-0 ${
                settings.highContrast
                  ? 'bg-amber-400 text-black border-2 border-white'
                  : 'bg-gradient-to-tr from-rose-500 via-pink-600 to-orange-500 text-white shadow-rose-200'
              }`}
            >
              NIRA
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-bold text-base md:text-lg tracking-tight flex items-center gap-1.5">
                  NIRA AI
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      settings.highContrast
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    அரசு திட்ட வழிகாட்டி
                  </span>
                </h1>
              </div>
              <p
                className={`text-[11px] md:text-xs truncate max-w-[200px] sm:max-w-md ${
                  settings.highContrast ? 'text-amber-200' : 'text-slate-500'
                }`}
              >
                பெண்கள் • கல்வி • வேலை • தொழில் • விவசாயம் • சமூக நலன்
              </p>
            </div>
          </div>

          {/* Accessibility & Action controls */}
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Start Again / Reset button */}
            <button
              onClick={onStartAgain}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-medium transition cursor-pointer active:scale-95 ${
                settings.highContrast
                  ? 'bg-zinc-800 text-amber-300 border border-amber-500 hover:bg-zinc-700'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
              title="மீண்டும் தொடங்கு"
              aria-label="உரையாடலை மீண்டும் தொடங்குக"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">மீண்டும் தொடங்கு</span>
            </button>

            {/* Font Size Toggle */}
            <button
              onClick={handleFontSizeCycle}
              className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                settings.highContrast
                  ? 'bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={getFontSizeLabel(settings.fontSize)}
              aria-label="எழுத்து அளவை மாற்று"
            >
              <span className="text-xs md:text-sm font-bold">
                {settings.fontSize === 'normal' ? 'A' : settings.fontSize === 'large' ? 'A+' : 'A++'}
              </span>
            </button>

            {/* High Contrast Toggle */}
            <button
              onClick={() => onUpdateSettings((p) => ({ ...p, highContrast: !p.highContrast }))}
              className={`p-2 rounded-xl text-xs transition cursor-pointer active:scale-95 ${
                settings.highContrast
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={settings.highContrast ? 'இயல்பு நிறம்' : 'உயர் மாறுபாடு நிறம் (High Contrast)'}
              aria-label="உயர் மாறுபாடு வண்ணத்திற்கு மாற்று"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Auto Read-Aloud Toggle */}
            <button
              onClick={() => onUpdateSettings((p) => ({ ...p, autoReadAloud: !p.autoReadAloud }))}
              className={`p-2 rounded-xl text-xs transition cursor-pointer active:scale-95 ${
                settings.autoReadAloud
                  ? settings.highContrast
                    ? 'bg-amber-400 text-black'
                    : 'bg-rose-600 text-white shadow-xs'
                  : settings.highContrast
                  ? 'bg-zinc-800 text-zinc-400'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title={settings.autoReadAloud ? 'தானியங்கி வாசிப்பு செயலில் உள்ளது' : 'தானியங்கி வாசிப்பு அணைக்கப்பட்டுள்ளது'}
              aria-label="பதில்களை தானாக வாசிப்பதை மாற்று"
            >
              {settings.autoReadAloud ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100/60 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('navigator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'navigator'
                ? settings.highContrast
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-rose-600 text-white shadow-xs'
                : settings.highContrast
                ? 'text-amber-200 hover:bg-zinc-800'
                : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>திட்ட வழிகாட்டி (Navigator)</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'chat'
                ? settings.highContrast
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-rose-600 text-white shadow-xs'
                : settings.highContrast
                ? 'text-amber-200 hover:bg-zinc-800'
                : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>NIRA AI குரல் & உரை</span>
          </button>

          <button
            onClick={() => setActiveTab('eligibility')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'eligibility'
                ? settings.highContrast
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-rose-600 text-white shadow-xs'
                : settings.highContrast
                ? 'text-amber-200 hover:bg-zinc-800'
                : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <MessageCircleQuestion className="w-3.5 h-3.5" />
            <span>PMMVY & தாய்மை தகுதி</span>
          </button>

          <button
            onClick={() => setActiveTab('official')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'official'
                ? settings.highContrast
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-rose-600 text-white shadow-xs'
                : settings.highContrast
                ? 'text-amber-200 hover:bg-zinc-800'
                : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>அரசு தளங்கள் & உதவி எண்கள்</span>
          </button>
        </div>
      </div>
    </header>
  );
};
