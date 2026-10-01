import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Search,
  Filter,
} from 'lucide-react';
import { GovernmentScheme, AppSettings, UserAnswers, NavigatorStep, SchemeCategory } from '../types';
import { ALL_GOVERNMENT_SCHEMES, CategoryMeta } from '../data/schemesData';
import { SchemeCard } from './SchemeCard';
import { CategoryBar } from './CategoryBar';
import { ProgressIndicator } from './ProgressIndicator';
import { speakWithBrowserSynthesis, stopCurrentAudio } from '../services/speech';

interface SchemeNavigatorWizardProps {
  settings: AppSettings;
  onAskThozhi: (prompt: string) => void;
  initialQuery?: string;
}

export const SchemeNavigatorWizard: React.FC<SchemeNavigatorWizardProps> = ({
  settings,
  onAskThozhi,
}) => {
  const [currentStep, setCurrentStep] = useState<NavigatorStep>(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<SchemeCategory | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeSpeakingText, setActiveSpeakingText] = useState<string | null>(null);

  // One-Question-at-a-Time Questions Flow
  const questionsList = [
    {
      id: 'state',
      titleTa: 'சரி தோழி ❤️ உங்களுக்கு பொருத்தமான திட்டத்தை கண்டுபிடிக்க சில கேள்விகள் கேட்கிறேன்.\n\nமுதலில், நீங்கள் எந்த மாநிலத்தில் வசிக்கிறீர்கள்?',
      options: [
        { label: 'தமிழ்நாடு (Tamil Nadu)', value: 'tamil_nadu' },
        { label: 'பிற மாநிலங்கள் (Other States)', value: 'other' },
      ],
    },
    {
      id: 'target_group',
      titleTa: 'அருமை! நீங்கள் யாருக்காக அரசு திட்டங்களைத் தேடுகிறீர்கள்?',
      options: [
        { label: '🌸 பெண்களுக்கு / கர்ப்பிணித் தாய்மார்களுக்கு', value: 'women' },
        { label: '🎓 பள்ளி / கல்லூரி மாணவர்களுக்கு (கல்வி)', value: 'education' },
        { label: '💼 வேலை தேடும் இளைஞர்களுக்கு (திறன்)', value: 'employment' },
        { label: '🏪 தொழில் / வியாபாரம் தொடங்குபவர்களுக்கு', value: 'entrepreneurship' },
        { label: '🌾 விவசாயிகளுக்கு', value: 'farmers' },
        { label: '❤️ முதியோர் / குடும்ப மருத்துவக் காப்பீடு', value: 'social_security' },
      ],
    },
    {
      id: 'age',
      titleTa: 'உங்கள் அல்லது பயனாளியின் வயது வரம்பு என்ன?',
      options: [
        { label: '18 வயதுக்கு கீழ் (மாணவர்/குழந்தை)', value: 'under_18' },
        { label: '18 முதல் 35 வயது (இளைஞர்/பெரியவர்)', value: '18_35' },
        { label: '35 முதல் 60 வயது', value: '35_60' },
        { label: '60 வயதுக்கு மேல் (முதியவர்)', value: 'above_60' },
      ],
    },
    {
      id: 'occupation',
      titleTa: 'தற்போதைய தொழில் அல்லது வாழ்வாதார நிலை என்ன?',
      options: [
        { label: 'பள்ளி / கல்லூரி மாணவர்', value: 'student' },
        { label: 'இல்லத்தரசி / கர்ப்பிணித் தாய்', value: 'homemaker' },
        { label: 'வேலை தேடுபவர் / வேலையில்லாதவர்', value: 'unemployed' },
        { label: 'சுயதொழில் / சிறு வியாபாரி / கடை', value: 'self_employed' },
        { label: 'விவசாயி / விவசாய நிலம் உள்ளவர்', value: 'farmer' },
        { label: 'கூலித்தொழிலாளி / குறைந்த வருமானம்', value: 'wage_earner' },
      ],
    },
  ];

  const handleStartDiscovery = () => {
    setCurrentStep(2);
    setCurrentQuestionIndex(0);
    const firstQ = questionsList[0].titleTa;
    if (settings.autoReadAloud) {
      handleReadAloud(firstQ);
    }
  };

  const handleAnswerQuestion = (val: string) => {
    const q = questionsList[currentQuestionIndex];

    const updatedAnswers = { ...answers };
    if (q.id === 'state') updatedAnswers.state = val;
    if (q.id === 'target_group') {
      if (val === 'women') updatedAnswers.gender = 'female';
      if (val === 'farmers') updatedAnswers.occupation = 'farmer';
    }
    if (q.id === 'age') updatedAnswers.ageGroup = val as any;
    if (q.id === 'occupation') updatedAnswers.occupation = val as any;

    setAnswers(updatedAnswers);

    if (currentQuestionIndex < questionsList.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      if (settings.autoReadAloud) {
        handleReadAloud(questionsList[nextIdx].titleTa);
      }
    } else {
      // Reached the end of questions -> move to step 3 (Matched Schemes)
      setCurrentStep(3);
      if (settings.autoReadAloud) {
        handleReadAloud('உங்களுக்கு பொருத்தமாக இருக்கக்கூடிய அரசு திட்டங்கள் கீழே பட்டியலிடப்பட்டுள்ளன.');
      }
    }
  };

  const handleReset = () => {
    stopCurrentAudio();
    setActiveSpeakingText(null);
    setCurrentStep(1);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setSelectedCategoryFilter('all');
    setSearchKeyword('');
  };

  const handleReadAloud = (text: string) => {
    stopCurrentAudio();
    setActiveSpeakingText(text);
    speakWithBrowserSynthesis(
      text,
      () => setActiveSpeakingText(null),
      () => setActiveSpeakingText(null)
    );
  };

  const handleStopSpeaking = () => {
    stopCurrentAudio();
    setActiveSpeakingText(null);
  };

  // Filter schemes based on answers and search/category selection
  const matchedSchemes = ALL_GOVERNMENT_SCHEMES.filter((scheme) => {
    // Category filter
    if (selectedCategoryFilter !== 'all' && scheme.category !== selectedCategoryFilter) {
      return false;
    }

    // Keyword search filter
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const match =
        scheme.nameTa.toLowerCase().includes(q) ||
        scheme.nameEn.toLowerCase().includes(q) ||
        scheme.simpleExplanationTa.toLowerCase().includes(q) ||
        scheme.tags.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }

    // If answers provided in Step 3, match specifically
    if (currentStep >= 3) {
      if (answers.occupation === 'farmer' && scheme.category === 'farmers') return true;
      if (answers.gender === 'female' && scheme.category === 'women') return true;
      if (answers.ageGroup === 'above_60' && scheme.id === 'oap_pension') return true;
      if (answers.occupation === 'student' && scheme.category === 'education') return true;
      if (answers.occupation === 'self_employed' && scheme.category === 'entrepreneurship') return true;
      if (answers.occupation === 'unemployed' && scheme.category === 'employment') return true;
    }

    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 w-full space-y-4">
      {/* 4-Step Progress Indicator */}
      <ProgressIndicator
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step <= currentStep) {
            setCurrentStep(step);
          }
        }}
        highContrast={settings.highContrast}
      />

      {/* Trust & Safety Message (Mandatory) */}
      <div
        className={`px-4 py-2.5 rounded-2xl border text-xs leading-relaxed flex items-center justify-between gap-3 ${
          settings.highContrast
            ? 'bg-zinc-900 border-amber-500 text-amber-200'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base flex-shrink-0">🛡️</span>
          <span>
            <strong>பாதுகாப்பு குறிப்பு:</strong> NIRA AI அரசு தகவல்களை எளிமையாக புரிய வைக்க உதவுகிறது. விண்ணப்பிக்கும் முன் அதிகாரப்பூர்வ இணையதளத்தில் தகவலை சரிபார்க்கவும். ஆதார், OTP அல்லது கடவுச்சொல்லை எங்கும் பகிராதீர்கள்.
          </span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition cursor-pointer flex-shrink-0 ${
            settings.highContrast
              ? 'bg-zinc-800 text-amber-300 border-amber-600 hover:bg-zinc-700'
              : 'bg-white text-slate-700 border-emerald-200 hover:bg-emerald-100'
          }`}
          title="மீண்டும் முதலிலிருந்து தொடங்க"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">மீண்டும் தொடங்கு</span>
        </button>
      </div>

      {/* STEP 1: புரிந்துகொள் (Understand) */}
      {currentStep === 1 && (
        <div
          className={`p-6 rounded-3xl border shadow-xs transition-colors space-y-5 ${
            settings.highContrast
              ? 'bg-zinc-950 border-amber-400 text-white'
              : 'bg-gradient-to-br from-rose-50/70 via-white to-orange-50/40 border-rose-200 text-slate-800'
          }`}
        >
          <div className="space-y-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 inline-block">
              தமிழ் அரசு திட்ட வழிகாட்டி
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              உங்களுக்கு என்ன அரசு திட்டம் கிடைக்கும் என்று அறிய வேண்டுமா?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-amber-100 leading-relaxed max-w-2xl">
              சிக்கலான அரசு ஆவணங்களைப் பார்த்து குழம்ப வேண்டாம். NIRA AI-யிடம் சில எளிய கேள்விகளுக்குப் பதிலளித்து, பெண்கள், கல்வி, வேலை, சுயதொழில், விவசாயம் மற்றும் சமூக நலத்திட்டங்களை நொடியில் கண்டறியுங்கள்!
            </p>
          </div>

          {/* Quick Voice / Text Demo Trigger */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleStartDiscovery}
              className={`py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-sm transition cursor-pointer active:scale-98 ${
                settings.highContrast
                  ? 'bg-amber-400 text-black hover:bg-amber-300 ring-2 ring-white/60'
                  : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>"எனக்கு என்ன அரசு திட்டம் கிடைக்கும்?" — தொடங்குங்கள்</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentStep(3);
              }}
              className={`py-3.5 px-5 rounded-2xl font-semibold text-xs sm:text-sm border transition cursor-pointer text-center ${
                settings.highContrast
                  ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-900'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              அனைத்து அரசு திட்டங்களையும் நேரடியாகப் பார்க்க
            </button>
          </div>

          {/* Core Categories preview pills */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 space-y-2">
            <span className="text-xs font-semibold text-slate-500 block">
              வழங்கப்படும் திட்டப் பிரிவுகள்:
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">🌸 பெண்கள் & கர்ப்பகாலம் (PMMVY, செல்வமகள்)</span>
              <span className="px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">🎓 கல்வி (புதுமைப் பெண், கல்வி உதவித்தொகை)</span>
              <span className="px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">💼 திறன் & வேலை (PMKVY, நான் முதல்வன்)</span>
              <span className="px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">🏪 தொழில் (முத்ரா கடன், மகளிர் தொழில்)</span>
              <span className="px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">🌾 விவசாயம் (PM-KISAN ₹6,000, பயிர் காப்பீடு)</span>
              <span className="px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700">❤️ சமூக நலன் (முதியோர் ஓய்வூதியம், முதலமைச்சர் காப்பீடு)</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: கேள்விகள் (One Question at a Time) */}
      {currentStep === 2 && (
        <div
          className={`p-6 rounded-3xl border shadow-sm transition-all space-y-6 ${
            settings.highContrast
              ? 'bg-zinc-950 border-amber-400 text-white'
              : 'bg-white border-rose-100 text-slate-800'
          }`}
        >
          {/* Question progress and voice readout */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <span className="text-xs font-bold text-rose-600 dark:text-amber-300">
              கேள்வி {currentQuestionIndex + 1} / {questionsList.length}
            </span>

            <button
              type="button"
              onClick={() => {
                const qText = questionsList[currentQuestionIndex].titleTa;
                if (activeSpeakingText === qText) {
                  handleStopSpeaking();
                } else {
                  handleReadAloud(qText);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeSpeakingText === questionsList[currentQuestionIndex].titleTa
                  ? 'bg-rose-600 text-white animate-pulse'
                  : settings.highContrast
                  ? 'bg-zinc-800 text-amber-300 border border-amber-500'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {activeSpeakingText === questionsList[currentQuestionIndex].titleTa ? (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>நிறுத்து</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>கேள்வியை வாசி</span>
                </>
              )}
            </button>
          </div>

          {/* Current Single Question Display */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-xl font-bold whitespace-pre-line leading-relaxed text-slate-900 dark:text-white">
              {questionsList[currentQuestionIndex].titleTa}
            </h3>
            <p className="text-xs text-slate-500">
              சரியான விருப்பத்தை கிளிக் செய்யவும்:
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {questionsList[currentQuestionIndex].options.map((opt, oIdx) => (
              <button
                key={oIdx}
                type="button"
                onClick={() => handleAnswerQuestion(opt.value)}
                className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between active:scale-98 ${
                  settings.highContrast
                    ? 'border-amber-400 hover:bg-zinc-800 text-white'
                    : 'border-rose-100 hover:border-rose-400 hover:bg-rose-50/60 text-slate-800'
                }`}
              >
                <span className="font-semibold text-xs sm:text-sm">{opt.label}</span>
                <ArrowRight className="w-4 h-4 text-rose-500 flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3 & 4: பொருத்தமான திட்டங்கள் (Matched Schemes) & அடுத்த படி (Next Step) */}
      {currentStep >= 3 && (
        <div className="space-y-4">
          {/* Matched Header Card */}
          <div
            className={`p-5 rounded-3xl border shadow-xs transition-colors ${
              settings.highContrast
                ? 'bg-zinc-900 border-amber-400 text-amber-100'
                : 'bg-gradient-to-r from-rose-50 via-white to-pink-50 border-rose-200 text-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-block">
                  கண்டறியப்பட்ட திட்டங்கள்
                </span>
                <h2 className="text-lg sm:text-xl font-bold">
                  உங்களுக்கு பொருத்தமாக இருக்கக்கூடிய திட்டங்கள் ❤️
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-amber-200">
                  நீங்கள் தேர்ந்தெடுத்த விவரங்களின் அடிப்படையில் பொருத்தமான அரசு திட்டங்கள் கீழே காட்டப்பட்டுள்ளன.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                    settings.highContrast
                      ? 'bg-zinc-800 text-amber-300 border-amber-500'
                      : 'bg-white text-slate-700 border-rose-200 hover:bg-rose-50'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>மீண்டும் கேள்விகள்</span>
                </button>
              </div>
            </div>

            {/* Quick Search & Category Bar inside Step 3 */}
            <div className="mt-4 pt-3 border-t border-rose-200/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="திட்டத்தின் பெயர் அல்லது தேடல் சொல் தட்டச்சு செய்யவும்..."
                  className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm border transition focus:outline-hidden ${
                    settings.highContrast
                      ? 'bg-zinc-950 border-amber-400 text-white placeholder-zinc-500'
                      : 'bg-white border-rose-200 text-slate-800 placeholder-slate-400 focus:border-rose-400'
                  }`}
                />
              </div>

              <div className="text-xs text-slate-500 font-semibold px-1">
                {matchedSchemes.length} திட்டங்கள் உள்ளன
              </div>
            </div>
          </div>

          {/* Category Filter Bar */}
          <CategoryBar
            selectedCategory={selectedCategoryFilter}
            onSelectCategory={setSelectedCategoryFilter}
            highContrast={settings.highContrast}
          />

          {/* Scheme Cards Stream */}
          {matchedSchemes.length > 0 ? (
            <div className="space-y-4">
              {matchedSchemes.map((scheme) => (
                <SchemeCard
                  key={scheme.id}
                  scheme={scheme}
                  settings={settings}
                  onAskThozhi={onAskThozhi}
                  isSpeakingThis={activeSpeakingText === `${scheme.nameTa}. ${scheme.simpleExplanationTa}. பலன்கள்: ${scheme.benefitsTa}. விண்ணப்பிக்கும் முறை: ${scheme.howToApplyTa}. அடுத்த படி: ${scheme.nextStepTa}.`}
                  onReadAloud={(text) => handleReadAloud(text)}
                  onStopSpeaking={handleStopSpeaking}
                />
              ))}
            </div>
          ) : (
            <div
              className={`p-8 rounded-3xl border text-center space-y-3 ${
                settings.highContrast
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-300'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <p className="text-sm font-semibold">
                தேடலுக்குரிய திட்டங்கள் எதுவும் கிடைக்கவில்லை.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryFilter('all');
                  setSearchKeyword('');
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                அனைத்து திட்டங்களையும் காட்டு
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
