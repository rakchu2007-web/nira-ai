import React, { useState } from 'react';
import { CheckCircle2, ChevronRight, RotateCcw, Volume2, Sparkles, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { AppSettings } from '../types';
import { speakWithBrowserSynthesis, stopCurrentAudio } from '../services/speech';

interface EligibilityCheckerProps {
  settings: AppSettings;
  onAskThozhi: (prompt: string) => void;
}

export const EligibilityChecker: React.FC<EligibilityCheckerProps> = ({
  settings,
  onAskThozhi,
}) => {
  const [step, setStep] = useState<number>(1);
  const [answers, setAnswers] = useState<{
    pregnancyOrder?: 'first' | 'second' | 'third_plus';
    secondGender?: 'girl' | 'boy' | 'pregnant';
    isGovt?: boolean;
    hasMcp?: boolean;
    hasAadhaarBank?: boolean;
  }>({});
  const [isSpeaking, setIsSpeaking] = useState(false);

  const resetFlow = () => {
    stopCurrentAudio();
    setIsSpeaking(false);
    setStep(1);
    setAnswers({});
  };

  const handleReadResult = (text: string) => {
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

  const isComplete = step === 5 || (answers.isGovt === true && step >= 4);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 w-full space-y-6">
      {/* Header card */}
      <div
        className={`p-5 rounded-3xl border shadow-xs transition-colors ${
          settings.highContrast
            ? 'bg-zinc-900 border-amber-400 text-amber-100'
            : 'bg-gradient-to-r from-rose-50 via-pink-50 to-orange-50 border-rose-200 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-800 inline-block">
              எளிய 1-கேள்வி முறை
            </span>
            <h2 className="text-lg md:text-xl font-bold">
              PMMVY & தாய்மை நிதி உதவி தகுதி சோதிப்பான்
            </h2>
            <p className="text-xs md:text-sm text-slate-600 dark:text-amber-200">
              ஒவ்வொரு கேள்விக்கும் பதிலளித்து உங்களுக்கு எவ்வளவு நிதி உதவி கிடைக்கும் என்பதை உடனடியாக தெரிந்துகொள்ளுங்கள்.
            </p>
          </div>

          <button
            onClick={resetFlow}
            className={`p-2.5 rounded-2xl border transition cursor-pointer flex-shrink-0 ${
              settings.highContrast
                ? 'bg-zinc-800 text-amber-300 border-amber-500 hover:bg-zinc-700'
                : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'
            }`}
            title="மீண்டும் முதலிலிருந்து தொடங்கு"
            aria-label="மீண்டும் முதலிலிருந்து தொடங்கு"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Step progress dots */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-rose-200/50">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all flex-1 ${
                step >= s
                  ? settings.highContrast
                    ? 'bg-amber-400'
                    : 'bg-rose-600'
                  : settings.highContrast
                  ? 'bg-zinc-700'
                  : 'bg-rose-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Interactive Question Card */}
      {!isComplete && (
        <div
          className={`p-6 rounded-3xl border shadow-sm transition-all ${
            settings.highContrast
              ? 'bg-zinc-950 border-amber-400 text-white'
              : 'bg-white border-rose-100 text-slate-800'
          }`}
        >
          {/* Question 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-600 dark:text-amber-400">
                  கேள்வி 1/4
                </span>
                <h3 className="text-base md:text-lg font-bold">
                  இது உங்கள் எத்தனையாவது கர்ப்பம் அல்லது குழந்தை?
                </h3>
                <p className="text-xs text-slate-500">
                  (PMMVY திட்ட விதிமுறைகளின்படி முதல் மற்றும் இரண்டாவது பிரசவங்களுக்கு வெவ்வேறு சலுகைகள் உண்டு)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => {
                    setAnswers((p) => ({ ...p, pregnancyOrder: 'first' }));
                    setStep(3); // Skip gender question for 1st child
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between h-32 active:scale-98 ${
                    settings.highContrast
                      ? 'border-amber-400 hover:bg-zinc-800 text-white'
                      : 'border-rose-200 hover:border-rose-400 hover:bg-rose-50/50'
                  }`}
                >
                  <span className="text-2xl">👶</span>
                  <div>
                    <strong className="block text-sm md:text-base font-bold">முதல் குழந்தை</strong>
                    <span className="text-xs text-slate-500">₹5,000 உதவித்தொகை</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setAnswers((p) => ({ ...p, pregnancyOrder: 'second' }));
                    setStep(2);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between h-32 active:scale-98 ${
                    settings.highContrast
                      ? 'border-amber-400 hover:bg-zinc-800 text-white'
                      : 'border-rose-200 hover:border-rose-400 hover:bg-rose-50/50'
                  }`}
                >
                  <span className="text-2xl">👧</span>
                  <div>
                    <strong className="block text-sm md:text-base font-bold">இரண்டாவது குழந்தை</strong>
                    <span className="text-xs text-slate-500">பெண் குழந்தைக்கு ₹6,000</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setAnswers((p) => ({ ...p, pregnancyOrder: 'third_plus' }));
                    setStep(3);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between h-32 active:scale-98 ${
                    settings.highContrast
                      ? 'border-zinc-700 hover:bg-zinc-800 text-white'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl">👨‍👩‍👧‍👦</span>
                  <div>
                    <strong className="block text-sm md:text-base font-bold">மூன்றாவது அல்லது அதற்கு மேல்</strong>
                    <span className="text-xs text-slate-500">மாநில திட்டங்கள் பொருந்தும்</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Question 2 (Gender for 2nd Child) */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-600 dark:text-amber-400">
                  கேள்வி 2/4
                </span>
                <h3 className="text-base md:text-lg font-bold">
                  உங்கள் இரண்டாவது குழந்தை பெண் குழந்தையா அல்லது இப்போது கர்ப்பமாக உள்ளீர்களா?
                </h3>
                <p className="text-xs text-slate-500">
                  PMMVY மத்திய திட்டத்தின் கீழ் 2-வது குழந்தைக்கு நிதி உதவி பெண் குழந்தைகளுக்கு மட்டுமே வழங்கப்படுகிறது.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => {
                    setAnswers((p) => ({ ...p, secondGender: 'girl' }));
                    setStep(3);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between h-28 active:scale-98 ${
                    settings.highContrast
                      ? 'border-amber-400 hover:bg-zinc-800 text-white'
                      : 'border-rose-200 hover:border-rose-400 hover:bg-rose-50/50'
                  }`}
                >
                  <span className="text-2xl">👧</span>
                  <div>
                    <strong className="block font-bold">பெண் குழந்தை பிறந்துள்ளது</strong>
                    <span className="text-xs text-emerald-600 font-semibold">₹6,000 பெற முழு தகுதி!</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setAnswers((p) => ({ ...p, secondGender: 'pregnant' }));
                    setStep(3);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between h-28 active:scale-98 ${
                    settings.highContrast
                      ? 'border-amber-400 hover:bg-zinc-800 text-white'
                      : 'border-rose-200 hover:border-rose-400 hover:bg-rose-50/50'
                  }`}
                >
                  <span className="text-2xl">🤰</span>
                  <div>
                    <strong className="block font-bold">இப்போது கர்ப்பமாக உள்ளேன்</strong>
                    <span className="text-xs text-slate-500">பிறக்கும் குழந்தை பெண்ணாக இருந்தால் ₹6,000</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setAnswers((p) => ({ ...p, secondGender: 'boy' }));
                    setStep(3);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between h-28 active:scale-98 ${
                    settings.highContrast
                      ? 'border-zinc-700 hover:bg-zinc-800 text-white'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl">👶</span>
                  <div>
                    <strong className="block font-bold">ஆண் குழந்தை பிறந்துள்ளது</strong>
                    <span className="text-xs text-slate-500">PMMVY பொருந்தாது</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Question 3 (Government Employee Rule) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-600 dark:text-amber-400">
                  கேள்வி 3/4
                </span>
                <h3 className="text-base md:text-lg font-bold">
                  நீங்களோ அல்லது உங்கள் கணவரோ மத்திய / மாநில அரசு ஊழியரா அல்லது பொதுத்துறை நிறுவனத்தில் பணிபுரிகிறீர்களா?
                </h3>
                <p className="text-xs text-slate-500">
                  அரசு ஊழியர்களுக்கு சம்பளத்துடன் கூடிய மகப்பேறு விடுப்பு கிடைப்பதால், PMMVY திட்டம் அவர்களுக்கு பொருந்தாது.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setAnswers((p) => ({ ...p, isGovt: false }));
                    setStep(4);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between active:scale-98 ${
                    settings.highContrast
                      ? 'border-amber-400 hover:bg-zinc-800 text-white'
                      : 'border-rose-200 hover:border-rose-400 hover:bg-rose-50/50'
                  }`}
                >
                  <div>
                    <strong className="block font-bold">இல்லை (சுயதொழில் / தனியார் / இல்லத்தரசி)</strong>
                    <span className="text-xs text-slate-500">PMMVY திட்டத்திற்கு தகுதியானவர்</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-rose-500" />
                </button>

                <button
                  onClick={() => {
                    setAnswers((p) => ({ ...p, isGovt: true }));
                    setStep(4);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between active:scale-98 ${
                    settings.highContrast
                      ? 'border-zinc-700 hover:bg-zinc-800 text-white'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <strong className="block font-bold">ஆம், அரசு / பொதுத்துறை ஊழியர்</strong>
                    <span className="text-xs text-slate-500">அரசு மகப்பேறு பலன்கள் பொருந்தும்</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
          )}

          {/* Question 4 (MCP Card & Bank Details Readiness) */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-rose-600 dark:text-amber-400">
                  கேள்வி 4/4
                </span>
                <h3 className="text-base md:text-lg font-bold">
                  உங்களிடம் தாய் சேய் நல அட்டை (MCP Card) மற்றும் ஆதாருடன் இணைக்கப்பட்ட வங்கி கணக்கு உள்ளதா?
                </h3>
                <p className="text-xs text-slate-500">
                  பணம் நேரடியாக உங்கள் வங்கிக் கணக்கில் (DBT மூலம்) வரவு வைக்கப்பட இது அவசியம்.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setAnswers((p) => ({ ...p, hasMcp: true, hasAadhaarBank: true }));
                    setStep(5);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between active:scale-98 ${
                    settings.highContrast
                      ? 'border-amber-400 hover:bg-zinc-800 text-white'
                      : 'border-rose-200 hover:border-rose-400 hover:bg-rose-50/50'
                  }`}
                >
                  <div>
                    <strong className="block font-bold">ஆம், என்னிடம் இரண்டும் உள்ளது</strong>
                    <span className="text-xs text-emerald-600 font-semibold">நேரடியாக விண்ணப்பிக்கலாம்!</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-rose-500" />
                </button>

                <button
                  onClick={() => {
                    setAnswers((p) => ({ ...p, hasMcp: false, hasAadhaarBank: false }));
                    setStep(5);
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer flex items-center justify-between active:scale-98 ${
                    settings.highContrast
                      ? 'border-zinc-700 hover:bg-zinc-800 text-white'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <strong className="block font-bold">இன்னும் இல்லை / எனக்கு தெரியாது</strong>
                    <span className="text-xs text-slate-500">கிராம செவிலியர் மூலம் சுலபமாக பெறலாம்</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Final Eligibility Result Card */}
      {isComplete && (
        <div
          className={`p-6 rounded-3xl border shadow-md space-y-6 transition-colors ${
            settings.highContrast
              ? 'bg-zinc-950 border-amber-400 text-white'
              : 'bg-white border-rose-200 text-slate-800'
          }`}
        >
          {answers.isGovt ? (
            // Government Employee Notice
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle className="w-8 h-8" />
                <h3 className="text-lg md:text-xl font-bold">
                  அரசு ஊழியர் விதிவிலக்கு தகவல்
                </h3>
              </div>
              <p className="text-sm md:text-base leading-relaxed">
                நீங்கள் அல்லது உங்கள் கணவர் அரசு ஊழியராக இருப்பதால் PMMVY மத்திய திட்டத்தின் ரொக்க உதவித்தொகை பொருந்தாது. இருப்பினும் அரசு மருத்துவமனைகளில் இலவச பரிசோதனைகள், இலவச பிரசவம் மற்றும் குழந்தைகளுக்கு இலவச தடுப்பூசிகள் முழுமையாக கிடைக்கும்.
              </p>
            </div>
          ) : answers.pregnancyOrder === 'first' ? (
            // First Child Result
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-2xl">
                  ✓
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600 px-2 py-0.5 rounded-full bg-emerald-50">
                    முழு தகுதி உண்டு
                  </span>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                    உங்களுக்கு ₹5,000 நிதி உதவி கிடைக்கும்!
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 space-y-2 text-sm">
                <div className="font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  தவணை விவரங்கள்:
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs md:text-sm pl-1">
                  <li><strong>முதல் தவணை (₹3,000):</strong> கர்ப்பமான 180 நாட்களுக்குள் அங்கன்வாடியில் பதிவு செய்து குறைந்தது 1 மருத்துவ பரிசோதனை (ANC) முடித்தவுடன் கிடைக்கும்.</li>
                  <li><strong>இரண்டாவது தவணை (₹2,000):</strong> குழந்தை பிறப்பு பதிவு மற்றும் 14 வார முதன்மை தடுப்பூசிகள் முடிந்தவுடன் கிடைக்கும்.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs md:text-sm">
                <strong>தமிழ்நாடு கூடுதல் பலன்:</strong> தமிழ்நாட்டில் டாக்டர் முத்துலட்சுமி ரெட்டி திட்டத்தின் கீழ் (MRMBS) மொத்தம் ₹18,000 மதிப்புள்ள சலுகைகளும் ஊட்டச்சத்து பெட்டகங்களும் கிடைக்கும்!
              </div>
            </div>
          ) : answers.pregnancyOrder === 'second' && (answers.secondGender === 'girl' || answers.secondGender === 'pregnant') ? (
            // Second Girl Child Result
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold text-2xl">
                  ✓
                </div>
                <div>
                  <span className="text-xs font-bold text-pink-600 px-2 py-0.5 rounded-full bg-pink-50">
                    பெண் குழந்தை சிறப்பு சலுகை
                  </span>
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                    இரண்டாவது பெண் குழந்தைக்கு ₹6,000 நிதி உதவி!
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-pink-50/80 border border-pink-200 text-pink-950 space-y-2 text-sm">
                <div className="font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-600" />
                  ஒரே தவணையாக ₹6,000:
                </div>
                <p className="text-xs md:text-sm">
                  இரண்டாவது குழந்தை பிறந்து பிறப்பு பதிவு செய்யப்பட்டு, முதன்மை தடுப்பூசிகள் முழுமையாக போடப்பட்ட பின்னர் ஒரே தவணையாக உங்கள் ஆதார் இணைக்கப்பட்ட வங்கிக் கணக்கில் ₹6,000 செலுத்தப்படும்.
                </p>
              </div>
            </div>
          ) : (
            // Other cases
            <div className="space-y-4">
              <h3 className="text-lg md:text-xl font-bold">
                உங்கள் தகவலுக்கான வழிகாட்டல்
              </h3>
              <p className="text-sm leading-relaxed">
                PMMVY மத்திய அரசின் நேரடி நிதி உதவி முதல் குழந்தைக்கு (₹5,000) மற்றும் இரண்டாவது பெண் குழந்தைக்கு (₹6,000) மட்டுமே வழங்கப்படுகிறது. எனினும் தமிழ்நாட்டின் டாக்டர் முத்துலட்சுமி ரெட்டி திட்டத்தில் நீங்கள் தகுதியானவரா என்று உங்கள் பகுதி கிராம சுகாதார செவிலியரிடம் (VHN) சரிபார்க்கலாம்.
              </p>
            </div>
          )}

          {/* Action buttons: Read aloud, ask Thozhi, restart */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const speechText = answers.pregnancyOrder === 'first'
                    ? 'வாழ்த்துக்கள்! PMMVY திட்டத்தின் கீழ் முதல் குழந்தைக்கு மொத்தம் ஐந்தாயிரம் ரூபாய் நிதி உதவி இரண்டு தவணைகளாக கிடைக்கும்.'
                    : answers.secondGender === 'girl'
                    ? 'வாழ்த்துக்கள்! இரண்டாவது பெண் குழந்தைக்கு PMMVY திட்டத்தின் கீழ் ஆறாயிரம் ரூபாய் ஒரே தவணையாக கிடைக்கும்.'
                    : 'உங்கள் விவரங்களை அங்கன்வாடி மையத்தில் சரிபார்க்கவும்.';
                  handleReadResult(speechText);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition cursor-pointer active:scale-95 ${
                  isSpeaking
                    ? 'bg-rose-600 text-white animate-pulse'
                    : settings.highContrast
                    ? 'bg-zinc-800 text-amber-300 border border-amber-500'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{isSpeaking ? 'நிறுத்து' : 'முடிவை சத்தமாக வாசி'}</span>
              </button>

              <button
                onClick={resetFlow}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition cursor-pointer ${
                  settings.highContrast
                    ? 'text-amber-300 hover:bg-zinc-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>மீண்டும் சோதி</span>
              </button>
            </div>

            <button
              onClick={() => {
                const prompt = answers.pregnancyOrder === 'first'
                  ? 'நான் முதல் முறையாக கர்ப்பமாக உள்ளேன். PMMVY ₹5,000 பெற நான் இப்போது என்ன செய்ய வேண்டும்?'
                  : 'இரண்டாவது பெண் குழந்தைக்கு ₹6,000 விண்ணப்பிக்க என்ன செய்ய வேண்டும்?';
                onAskThozhi(prompt);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-sm transition cursor-pointer active:scale-95 ${
                settings.highContrast
                  ? 'bg-amber-400 text-black hover:bg-amber-300'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              <span>NIRA AI-யிடம் கூடுதல் விளக்கம் கேட்க</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
