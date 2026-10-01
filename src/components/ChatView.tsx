import React from 'react';
import { Volume2, VolumeX, RotateCcw, ShieldCheck, Heart, Sparkles, AlertTriangle } from 'lucide-react';
import { Message, AppSettings } from '../types';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  settings: AppSettings;
  activeSpeakingId: string | null;
  onReadAloud: (msgId: string, text: string) => void;
  onStopSpeaking: () => void;
  onRepeatAnswer: (msgId: string, text: string) => void;
  onStartAgain: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isLoading,
  settings,
  activeSpeakingId,
  onReadAloud,
  onStopSpeaking,
  onRepeatAnswer,
  onStartAgain,
}) => {
  const getTextSizeClass = () => {
    switch (settings.fontSize) {
      case 'normal':
        return 'text-sm md:text-base leading-relaxed';
      case 'large':
        return 'text-base md:text-lg leading-loose';
      case 'xlarge':
        return 'text-lg md:text-xl leading-loose font-medium';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-4xl mx-auto w-full">
      {/* Welcome Card if no or few messages */}
      {messages.length <= 1 && (
        <div
          className={`p-4 md:p-6 rounded-3xl border shadow-xs transition-colors ${
            settings.highContrast
              ? 'bg-zinc-900 border-amber-400 text-amber-100'
              : 'bg-gradient-to-br from-rose-50/80 via-white to-orange-50/50 border-rose-200 text-slate-800'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-xl shadow-sm ${
                settings.highContrast
                  ? 'bg-amber-400 text-black'
                  : 'bg-gradient-to-tr from-rose-500 to-pink-600 text-white'
              }`}
            >
              👩‍⚕️
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base md:text-lg text-rose-900 dark:text-amber-300">
                  வணக்கம்! நான் உங்கள் NIRA AI
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-800 font-semibold">
                  அரசு திட்ட வழிகாட்டி
                </span>
              </div>
              <p className={getTextSizeClass()}>
                தமிழ்நாடு மற்றும் மத்திய அரசு வழங்கும் <strong>பெண்கள் நலம், கல்வி உதவித்தொகை, இளைஞர் திறன் பயிற்சி, தொழில் முத்ரா கடன், விவசாயிகள் PM-KISAN</strong> மற்றும் <strong>முதலமைச்சர் மருத்துவக் காப்பீடு</strong> போன்ற அனைத்து அரசு நலத்திட்டங்களையும் தமிழில் எளிய முறையில் கண்டறியலாம்.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 border border-rose-200 text-slate-700">
                  🌸 பெண்கள் & கர்ப்பகாலம் (PMMVY, செல்வமகள்)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 border border-rose-200 text-slate-700">
                  🎓 கல்வி (புதுமைப் பெண், ஸ்காலர்ஷிப்)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 border border-rose-200 text-slate-700">
                  🏪 தொழில் முத்ரா கடன் (PMMY)
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 border border-rose-200 text-slate-700">
                  🌾 PM-KISAN ₹6,000
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  100% அதிகாரப்பூர்வ தகவல்கள் (ஆதார்/OTP தேவையில்லை)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages stream */}
      {messages.map((message) => {
        const isThozhi = message.sender === 'thozhi';
        const isSpeaking = activeSpeakingId === message.id;

        return (
          <div
            key={message.id}
            className={`flex flex-col ${isThozhi ? 'items-start' : 'items-end'} space-y-1.5`}
          >
            <div
              className={`flex items-start gap-2.5 max-w-[92%] md:max-w-[82%] ${
                isThozhi ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-xs ${
                  isThozhi
                    ? settings.highContrast
                      ? 'bg-amber-400 text-black border border-white'
                      : 'bg-rose-600 text-white'
                    : settings.highContrast
                    ? 'bg-zinc-800 text-amber-200 border border-amber-500'
                    : 'bg-slate-700 text-white'
                }`}
              >
                {isThozhi ? 'NIRA' : 'நீ'}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-4 rounded-3xl transition-all shadow-xs ${getTextSizeClass()} ${
                  isThozhi
                    ? settings.highContrast
                      ? 'bg-zinc-900 border-2 border-amber-400 text-white rounded-tl-xs'
                      : 'bg-white border border-rose-100 text-slate-800 rounded-tl-xs'
                    : settings.highContrast
                    ? 'bg-amber-400 text-black font-semibold rounded-tr-xs'
                    : 'bg-rose-600 text-white rounded-tr-xs'
                }`}
              >
                {/* Privacy Warning Header if triggered */}
                {message.isPrivacyWarning && (
                  <div className="mb-2 p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>பாதுகாப்பு தகவல்: தனிப்பட்ட எண்கள் சேமிக்கப்படாது.</span>
                  </div>
                )}

                {/* Message Body with clean paragraph breaks */}
                <div className="whitespace-pre-line space-y-2">
                  {message.text}
                </div>

                {/* Action buttons on Thozhi messages */}
                {isThozhi && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Read Aloud Button */}
                      <button
                        onClick={() =>
                          isSpeaking
                            ? onStopSpeaking()
                            : onReadAloud(message.id, message.text)
                        }
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-medium transition cursor-pointer active:scale-95 ${
                          isSpeaking
                            ? 'bg-rose-600 text-white animate-pulse'
                            : settings.highContrast
                            ? 'bg-zinc-800 text-amber-300 border border-amber-500 hover:bg-zinc-700'
                            : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                        }`}
                        title="பதிலை சத்தமாக வாசிக்க"
                        aria-label="பதிலை சத்தமாக வாசிக்க"
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-white" />
                            <span>நிறுத்து</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>சத்தமாக வாசி</span>
                          </>
                        )}
                      </button>

                      {/* Repeat Answer Button */}
                      <button
                        onClick={() => onRepeatAnswer(message.id, message.text)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-medium transition cursor-pointer active:scale-95 ${
                          settings.highContrast
                            ? 'bg-zinc-800 text-amber-300 border border-amber-500 hover:bg-zinc-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                        title="பதிலை மீண்டும் கூறுக"
                        aria-label="பதிலை மீண்டும் கூறுக"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>மீண்டும் கூறு</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {message.timestamp}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex items-start gap-2.5 max-w-[82%]">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-xs ${
              settings.highContrast ? 'bg-amber-400 text-black' : 'bg-rose-600 text-white'
            }`}
          >
            NIRA
          </div>
          <div
            className={`p-4 rounded-3xl rounded-tl-xs border transition-colors shadow-xs ${
              settings.highContrast
                ? 'bg-zinc-900 border-amber-400 text-amber-200'
                : 'bg-white border-rose-100 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-xs font-medium">NIRA AI யோசித்து பதிலளிக்கிறது...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
