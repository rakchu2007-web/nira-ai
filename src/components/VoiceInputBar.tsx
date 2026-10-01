import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import {
  createTamilSpeechRecognizer,
  isSpeechRecognitionSupported,
  requestMicrophonePermission,
  mergeSpeechSegments,
  SpeechRecognizerController,
  SpeechErrorType,
} from '../services/speech';
import { SAMPLE_QUESTIONS } from '../data/pmmvyData';
import { AppSettings } from '../types';

interface VoiceInputBarProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  settings: AppSettings;
}

export const VoiceInputBar: React.FC<VoiceInputBarProps> = ({
  onSendMessage,
  isLoading,
  settings,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [privacyError, setPrivacyError] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [transcriptionDoneNotice, setTranscriptionDoneNotice] = useState(false);

  const recognizerRef = useRef<SpeechRecognizerController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestTranscriptRef = useRef<string>('');

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
    };
  }, []);

  // Validation function to safeguard user from accidentally transmitting Aadhaar, OTP or Bank Numbers
  const validateAndSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    // Detect 12 digits (Aadhaar format: 1234 5678 9012 or 123456789012)
    const aadhaarPattern = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
    // Detect 9 to 18 consecutive digits (Bank accounts)
    const bankPattern = /\b\d{9,18}\b/;
    // Detect OTP or password references
    const otpPattern = /\b(otp|one time password|கடவுச்சொல்|பின் எண்|cvv|pin)\b/i;

    if (aadhaarPattern.test(trimmed) || bankPattern.test(trimmed) || otpPattern.test(trimmed)) {
      setPrivacyError(
        'பாதுகாப்பு எச்சரிக்கை: ஆதார் எண், வங்கி கணக்கு எண் அல்லது OTP போன்ற ரகசிய எண்களை உள்ளிட வேண்டாம். NIRA AI உங்கள் தனிப்பட்ட எண்களை சேகரிக்காது!'
      );
      setInputText('');
      setInterimText('');
      latestTranscriptRef.current = '';
      return;
    }

    setPrivacyError(null);
    setSpeechError(null);
    setTranscriptionDoneNotice(false);
    setInputText('');
    setInterimText('');
    latestTranscriptRef.current = '';

    // Requirement 12: Send only the transcribed text to Gemini
    onSendMessage(trimmed);
  };

  const handleToggleListening = async () => {
    if (isListening) {
      // User clicked stop
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // 1. Clear previous errors and reset state
    setSpeechError(null);
    setPrivacyError(null);
    setTranscriptionDoneNotice(false);

    // 2. Check browser SpeechRecognition support
    if (!isSpeechRecognitionSupported()) {
      setSpeechError(
        'உங்கள் உலாவியில் குரல் அறிதல் (Speech Recognition) வசதி இல்லை. தயவுசெய்து Google Chrome அல்லது Microsoft Edge உலாவியைப் பயன்படுத்தவும் அல்லது கீழே தட்டச்சு செய்து கேட்கவும்.'
      );
      return;
    }

    // 3. Immediately show visual "Listening..." state to user
    setIsListening(true);
    setInterimText('மைக்ரோஃபோன் சரிபார்க்கப்படுகிறது... தயவுசெய்து பேசவும்...');

    // 4. Request microphone permission explicitly via getUserMedia (mandatory inside iframes)
    const permissionResult = await requestMicrophonePermission();
    if (!permissionResult.granted) {
      setIsListening(false);
      setInterimText('');
      setSpeechError(
        permissionResult.error || 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவியின் அமைப்பில் மைக் அனுமதியை இயக்கவும்.'
      );
      return;
    }

    // 5. Initialize Tamil Speech Recognition (ta-IN)
    latestTranscriptRef.current = '';
    setInterimText('');

    try {
      recognizerRef.current = createTamilSpeechRecognizer(
        // onTranscript: real-time capture
        (finalTranscript: string, interimTranscript: string) => {
          // Show interim text temporarily while the user is speaking
          setInterimText(interimTranscript || finalTranscript);

          // Combined clean text for live input box display
          const displayCombined = mergeSpeechSegments([finalTranscript, interimTranscript]);
          if (displayCombined) {
            latestTranscriptRef.current = displayCombined;
            setInputText(displayCombined);
          }
        },
        // onError: robust handling for all speech errors
        (errorType: SpeechErrorType, errorMsg: string) => {
          console.warn('Speech recognition error encountered:', errorType, errorMsg);
          setIsListening(false);
          setSpeechError(errorMsg);

          // Preserve any spoken words in the input box
          if (latestTranscriptRef.current) {
            setInputText(latestTranscriptRef.current);
          }
        },
        // onEnd: recognition completed
        (cleanFinalTranscript: string) => {
          setIsListening(false);
          const textToSet = cleanFinalTranscript.trim();

          if (textToSet) {
            latestTranscriptRef.current = textToSet;
            // Put exactly one clean transcript into chat input box
            setInputText(textToSet);
            // Requirement 7: DO NOT auto send to Gemini. Prompt user to click Send.
            setTranscriptionDoneNotice(true);

            // Focus the input box and set cursor to end
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
                const len = inputRef.current.value.length;
                inputRef.current.setSelectionRange(len, len);
              }
            }, 60);
          }
          setInterimText('');
        },
        // onStart: recognition hardware started
        () => {
          setIsListening(true);
          setInterimText('');
        }
      );

      recognizerRef.current.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition session:', err);
      setIsListening(false);
      setSpeechError('மைக்ரோஃபோனைத் தொடங்குவதில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    // If still listening, stop recognition before sending
    if (isListening && recognizerRef.current) {
      recognizerRef.current.stop();
      setIsListening(false);
    }

    validateAndSend(inputText);
  };

  const handleSuggestionClick = (question: string) => {
    if (isLoading) return;
    if (isListening && recognizerRef.current) {
      recognizerRef.current.stop();
      setIsListening(false);
    }
    validateAndSend(question);
  };

  const hasTextToSend = Boolean(inputText.trim()) && !isLoading;

  return (
    <div
      className={`border-t transition-colors ${
        settings.highContrast
          ? 'bg-zinc-950 border-amber-500 text-white'
          : 'bg-white border-rose-100 text-slate-800'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-3 space-y-2.5">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span
            className={`font-semibold flex items-center gap-1 flex-shrink-0 mr-1 ${
              settings.highContrast ? 'text-amber-300' : 'text-rose-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            விரைவு வினாக்கள்:
          </span>
          {SAMPLE_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(q.textTa)}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer flex-shrink-0 font-medium ${
                settings.highContrast
                  ? 'bg-zinc-800 text-amber-200 border border-amber-600 hover:bg-zinc-700 disabled:opacity-50'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 disabled:opacity-50'
              }`}
            >
              {q.textTa}
            </button>
          ))}
        </div>

        {/* Live Listening Voice Indicator (Requirement 3: Clear "கேட்கிறேன்..." / Listening state) */}
        {isListening && (
          <div
            role="status"
            aria-live="polite"
            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-sm ${
              settings.highContrast
                ? 'bg-amber-950 border-amber-400 text-amber-100'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Animated audio equalizer bars */}
              <div className="flex items-end gap-1 h-6 px-1 flex-shrink-0">
                <div className={`w-1 rounded-full ${settings.highContrast ? 'bg-amber-400' : 'bg-rose-600'} voice-bar-1`} />
                <div className={`w-1 rounded-full ${settings.highContrast ? 'bg-amber-400' : 'bg-rose-600'} voice-bar-2`} />
                <div className={`w-1 rounded-full ${settings.highContrast ? 'bg-amber-400' : 'bg-rose-600'} voice-bar-3`} />
                <div className={`w-1 rounded-full ${settings.highContrast ? 'bg-amber-400' : 'bg-rose-600'} voice-bar-4`} />
                <div className={`w-1 rounded-full ${settings.highContrast ? 'bg-amber-400' : 'bg-rose-600'} voice-bar-5`} />
              </div>

              <div className="text-xs md:text-sm flex-1 min-w-0">
                <p className="font-bold flex items-center gap-1.5 text-rose-800 dark:text-amber-300">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                  கேட்கிறேன்... (Listening) தமிழில் பேசுங்கள்:
                </p>
                <p className="italic text-xs font-semibold truncate max-w-full text-slate-800 dark:text-amber-100 mt-0.5">
                  {interimText || 'பேசுங்கள்... உங்கள் குரல் தமிழில் இங்கே வரும்...'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleListening}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 flex-shrink-0 ${
                settings.highContrast
                  ? 'bg-amber-400 text-black hover:bg-amber-300'
                  : 'bg-rose-600 text-white hover:bg-rose-700'
              }`}
            >
              நிறுத்து (Stop)
            </button>
          </div>
        )}

        {/* Speech Finished Ready-to-Send Guidance Banner (Requirements 7 & 8) */}
        {transcriptionDoneNotice && !isListening && inputText && (
          <div
            className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 border transition ${
              settings.highContrast
                ? 'bg-zinc-900 border-amber-400 text-amber-200'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>
                குரல் உரை தயாராக உள்ளது! அனுப்ப <strong>அனுப்பு (Send) பட்டனை</strong> கிளிக் செய்யவும் அல்லது <strong>Enter</strong> அழுத்தவும்.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTranscriptionDoneNotice(false)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Privacy Safeguard Alert */}
        {privacyError && (
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500 text-amber-900 text-xs md:text-sm flex items-start gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold block">ரகசிய எண் பாதுகாப்பு:</strong>
              {privacyError}
            </div>
            <button
              onClick={() => setPrivacyError(null)}
              className="text-amber-800 hover:text-black font-bold text-xs p-1"
            >
              சரி
            </button>
          </div>
        )}

        {/* Speech Recognition Error Notice with clear Tamil guidance (Requirement 10) */}
        {speechError && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{speechError}</span>
            </div>
            <button
              onClick={() => setSpeechError(null)}
              className="text-red-700 font-bold hover:underline text-xs"
            >
              சரி
            </button>
          </div>
        )}

        {/* Main Input Form with Tamil Voice & Send buttons */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Tamil Voice Input Button (Requirement 3: Changes state when active) */}
          <button
            type="button"
            onClick={handleToggleListening}
            disabled={isLoading}
            aria-label={isListening ? 'குரல் பதிவை நிறுத்து' : 'தமிழில் பேச மைக் பட்டனை அழுத்தவும்'}
            title={isListening ? 'குரல் பதிவை நிறுத்த கிளிக் செய்யவும் (Stop Listening)' : 'தமிழில் பேச மைக் பட்டனை அழுத்தவும் (ta-IN)'}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition cursor-pointer relative shadow-sm active:scale-95 flex-shrink-0 ${
              isListening
                ? settings.highContrast
                  ? 'bg-red-600 text-white ring-4 ring-amber-400'
                  : 'bg-rose-600 text-white ring-4 ring-rose-300 animate-pulse'
                : settings.highContrast
                ? 'bg-amber-400 text-black hover:bg-amber-300 ring-2 ring-white/50'
                : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200'
            }`}
          >
            {isListening ? <MicOff className="w-6 h-6 animate-pulse" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Text Input Box (Requirement 6: Holds recognized Tamil transcript, allows manual editing) */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setTranscriptionDoneNotice(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={isListening ? 'கேட்கிறேன்... உங்கள் குரல் தமிழில் இங்கே வரும்...' : 'தமிழில் பேச மைக் அழுத்தவும் அல்லது இங்கே தட்டச்சு செய்யவும்...'}
              disabled={isLoading}
              className={`w-full px-4 py-3 rounded-2xl text-sm md:text-base border transition focus:outline-hidden ${
                settings.highContrast
                  ? 'bg-zinc-900 border-amber-400 text-white placeholder-zinc-400 focus:ring-2 focus:ring-amber-300'
                  : isListening
                  ? 'bg-rose-50/70 border-rose-400 text-slate-900 placeholder-rose-400 focus:bg-white focus:border-rose-500'
                  : 'bg-slate-50 border-rose-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-200'
              }`}
            />
          </div>

          {/* Clearly Visible Send Button (Requirements 8 & 9: sends transcript to Gemini) */}
          <button
            type="submit"
            disabled={!hasTextToSend}
            aria-label="கேள்வியை அனுப்புக (Send)"
            title="கேள்வியை அனுப்புக (Send)"
            className={`h-12 px-4 rounded-2xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95 flex-shrink-0 ${
              !hasTextToSend
                ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-400'
                : settings.highContrast
                ? 'bg-amber-400 text-black hover:bg-amber-300 font-bold ring-2 ring-white'
                : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200 font-bold'
            }`}
          >
            <Send className="w-5 h-5" />
            <span className="hidden sm:inline text-xs font-bold">அனுப்பு</span>
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>* ஆதார் அல்லது வங்கி எண்கள் எதையும் உள்ளிட வேண்டாம்</span>
          <span className="font-semibold text-slate-500">குரல் மொழி: தமிழ் (ta-IN)</span>
        </div>
      </div>
    </div>
  );
};
