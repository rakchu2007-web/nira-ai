// Voice Recognition and Speech Synthesis Utilities for Tamil

// Speech Recognition Type Definitions
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

declare const window: IWindow;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export type SpeechErrorType =
  | 'not-allowed'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'not-supported'
  | 'aborted'
  | 'generic';

export interface SpeechRecognizerController {
  start: () => void;
  stop: () => void;
  abort: () => void;
  isListening: () => boolean;
}

/**
 * Merges speech recognition segments while preventing duplicate phrase insertions
 * caused by browser speech engine re-emissions (e.g. "ஒரு" -> "ஒரு ஒரு விவசாயி").
 * Preserves genuine intentional repetitions spoken within natural sentences (e.g. "நான் நான் போகிறேன்").
 */
export function mergeSpeechSegments(segments: string[]): string {
  const cleaned = segments.map((s) => (s || '').trim()).filter(Boolean);
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0];

  let result = cleaned[0];

  for (let i = 1; i < cleaned.length; i++) {
    const nextSeg = cleaned[i];
    if (!nextSeg) continue;

    // 1. Exact duplicate segment
    if (nextSeg === result) {
      continue;
    }

    // 2. Next segment is a superset of the previous result
    // e.g. result = "நான் ஒரு", nextSeg = "நான் ஒரு விவசாயி"
    if (nextSeg.startsWith(result + ' ') || nextSeg === result) {
      result = nextSeg;
      continue;
    }

    // 3. Result already ends with the entire next segment
    // e.g. result = "நான் ஒரு விவசாயி", nextSeg = "விவசாயி"
    if (result.endsWith(' ' + nextSeg) || result === nextSeg) {
      continue;
    }

    // 4. Overlap at the boundary (suffix of result matching prefix of nextSeg)
    const resultWords = result.split(/\s+/);
    const nextWords = nextSeg.split(/\s+/);

    let maxOverlap = 0;
    const maxPossible = Math.min(resultWords.length, nextWords.length);

    for (let overlapLen = maxPossible; overlapLen >= 1; overlapLen--) {
      const resultTail = resultWords.slice(resultWords.length - overlapLen).join(' ');
      const nextHead = nextWords.slice(0, overlapLen).join(' ');
      if (resultTail === nextHead) {
        maxOverlap = overlapLen;
        break;
      }
    }

    if (maxOverlap > 0) {
      const nonOverlapping = nextWords.slice(maxOverlap).join(' ');
      if (nonOverlapping) {
        result = result + ' ' + nonOverlapping;
      }
    } else {
      result = result + ' ' + nextSeg;
    }
  }

  return result.trim();
}

/**
 * Explicitly requests microphone permission via getUserMedia.
 * Mandatory inside iframes where SpeechRecognition cannot prompt directly.
 */
export async function requestMicrophonePermission(): Promise<{ granted: boolean; error?: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      granted: false,
      error: 'உங்கள் உலாவியில் மைக்ரோஃபோன் வசதி இல்லை. தயவுசெய்து தட்டச்சு செய்து கேட்கவும்.',
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Immediately stop the temporary stream tracks so hardware mic is released for SpeechRecognition
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err: any) {
    console.warn('Microphone permission request error:', err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return {
        granted: false,
        error:
          'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. தயவுசெய்து உலாவியின் முகவரிப் பட்டியில் உள்ள பூட்டு (Lock) அல்லது மைக்ரோஃபோன் ஐகானை கிளிக் செய்து "Allow" அனுமதியை இயக்கவும்.',
      };
    }
    if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      return {
        granted: false,
        error: 'உங்கள் சாதனத்தில் மைக்ரோஃபோன் எதுவும் கண்டறியப்படவில்லை. மைக்கை இணைக்கவும்.',
      };
    }
    return {
      granted: false,
      error: 'மைக்ரோஃபோன் அனுமதி பிழை: ' + (err.message || 'அனுமதிக்கப்படவில்லை.'),
    };
  }
}

/**
 * Creates a robust Tamil Speech Recognizer session.
 * Fixes duplicate word accumulation by indexing final segments and separating interim text.
 */
export function createTamilSpeechRecognizer(
  onTranscript: (finalTranscript: string, interimTranscript: string) => void,
  onError: (type: SpeechErrorType, message: string) => void,
  onEnd: (cleanFinalTranscript: string) => void,
  onStart?: () => void
): SpeechRecognizerController {
  let recognition: any = null;
  let isCurrentlyListening = false;
  let finalSegmentsByIndex: string[] = [];
  let lastCommittedFinal = '';
  let lastInterim = '';
  let watchdogTimeout: any = null;
  let isManuallyStopped = false;

  const clearWatchdog = () => {
    if (watchdogTimeout) {
      clearTimeout(watchdogTimeout);
      watchdogTimeout = null;
    }
  };

  const cleanupSession = () => {
    clearWatchdog();
    isCurrentlyListening = false;
    if (recognition) {
      try {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      } catch {}
      recognition = null;
    }
  };

  const start = () => {
    if (!isSpeechRecognitionSupported()) {
      onError(
        'not-supported',
        'உங்கள் உலாவியில் குரல் அறிதல் (Speech Recognition) வசதி இல்லை. தயவுசெய்து Google Chrome அல்லது Microsoft Edge உலாவியைப் பயன்படுத்தவும் அல்லது கீழே தட்டச்சு செய்து கேட்கவும்.'
      );
      return;
    }

    // Stop any existing instance
    if (recognition) {
      try {
        recognition.abort();
      } catch {}
      cleanupSession();
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ta-IN'; // Tamil (India)
      recognition.maxAlternatives = 1;

      // Reset state for new recording session
      finalSegmentsByIndex = [];
      lastCommittedFinal = '';
      lastInterim = '';
      isManuallyStopped = false;

      recognition.onstart = () => {
        isCurrentlyListening = true;
        if (onStart) onStart();
      };

      recognition.onresult = (event: any) => {
        let interim = '';

        // Iterate through all results in the current session
        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = (item[0]?.transcript || '').trim();
          if (!text) continue;

          if (item.isFinal) {
            // Assign directly to slot i (never append blindly to accumulated string)
            finalSegmentsByIndex[i] = text;
          } else {
            interim += (interim ? ' ' : '') + text;
          }
        }

        // Deduplicate and merge committed final segments
        const mergedFinal = mergeSpeechSegments(finalSegmentsByIndex);
        lastCommittedFinal = mergedFinal;
        lastInterim = interim.trim();

        // Send separated final and interim texts
        onTranscript(mergedFinal, lastInterim);
      };

      recognition.onerror = (event: any) => {
        const errorKey = event.error || 'generic';
        console.warn('Tamil Speech Recognition error:', errorKey);

        let userMsg = 'குரல் அறிதலில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் பேசவும்.';
        let type: SpeechErrorType = 'generic';

        if (errorKey === 'not-allowed' || errorKey === 'service-not-allowed') {
          type = 'not-allowed';
          userMsg =
            'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. தயவுசெய்து உலாவியின் முகவரிப் பட்டியில் உள்ள மைக் ஐகானை கிளிக் செய்து அனுமதியை இயக்கவும்.';
        } else if (errorKey === 'no-speech') {
          type = 'no-speech';
          userMsg = 'குரல் எதுவும் கேட்கவில்லை. தயவுசெய்து மைக் அருகே வந்து தெளிவாக தமிழில் பேசவும்.';
        } else if (errorKey === 'audio-capture') {
          type = 'audio-capture';
          userMsg = 'மைக்ரோஃபோன் கண்டறியப்படவில்லை. உங்கள் மைக் சரியாக இணைக்கப்பட்டுள்ளதா என பார்க்கவும்.';
        } else if (errorKey === 'network') {
          type = 'network';
          userMsg = 'இணைய நெட்வொர்க் பிழை. தயவுசெய்து இணைய இணைப்பை சரிபார்க்கவும்.';
        } else if (errorKey === 'aborted') {
          type = 'aborted';
          userMsg = 'குரல் பதிவு நிறுத்தப்பட்டது.';
        }

        isCurrentlyListening = false;
        clearWatchdog();

        if (type !== 'aborted' && !isManuallyStopped) {
          onError(type, userMsg);
        }
      };

      recognition.onend = () => {
        // If there was uncommitted interim speech at the end, merge it safely
        const finalMerged = mergeSpeechSegments([lastCommittedFinal, lastInterim]);
        cleanupSession();
        onEnd(finalMerged);
      };

      recognition.start();
      isCurrentlyListening = true;
    } catch (e: any) {
      console.error('Failed to start speech recognition:', e);
      cleanupSession();
      onError('generic', 'மைக்ரோஃபோனைத் தொடங்குவதில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.');
    }
  };

  const stop = () => {
    isManuallyStopped = true;
    if (recognition && isCurrentlyListening) {
      try {
        recognition.stop();
      } catch (e) {
        console.warn('Recognition stop error:', e);
      }

      // Safety watchdog: ensure UI never stays stuck if browser stalls onend
      watchdogTimeout = setTimeout(() => {
        if (isCurrentlyListening) {
          const finalMerged = mergeSpeechSegments([lastCommittedFinal, lastInterim]);
          cleanupSession();
          onEnd(finalMerged);
        }
      }, 700);
    } else {
      const finalMerged = mergeSpeechSegments([lastCommittedFinal, lastInterim]);
      cleanupSession();
      onEnd(finalMerged);
    }
  };

  const abort = () => {
    isManuallyStopped = true;
    if (recognition) {
      try {
        recognition.abort();
      } catch {}
    }
    const finalMerged = mergeSpeechSegments([lastCommittedFinal, lastInterim]);
    cleanupSession();
    onEnd(finalMerged);
  };

  return {
    start,
    stop,
    abort,
    isListening: () => isCurrentlyListening,
  };
}

// Retain legacy createSpeechRecognizer for backward compatibility
export function createSpeechRecognizer(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onEnd: () => void
): { start: () => void; stop: () => void } | null {
  if (!isSpeechRecognitionSupported()) return null;
  const controller = createTamilSpeechRecognizer(
    (finalT, interimT) => {
      const combined = mergeSpeechSegments([finalT, interimT]);
      onResult(combined, !interimT && !!finalT);
    },
    (_errType, msg) => onError(msg),
    () => onEnd()
  );
  return {
    start: controller.start,
    stop: controller.stop,
  };
}

let currentAudioElement: HTMLAudioElement | null = null;
let activeSessionId = 0;
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && window.speechSynthesis) {
  // Pre-load and cache voices as soon as browser is ready
  cachedVoices = window.speechSynthesis.getVoices() || [];
  window.speechSynthesis.onvoiceschanged = () => {
    try {
      cachedVoices = window.speechSynthesis.getVoices() || [];
    } catch {}
  };
}

/**
 * Finds the most natural, soft, warm, and clear female Tamil voice available for ta-IN.
 * Dynamically queries window.speechSynthesis.getVoices().
 * 1. Prioritizes natural female Tamil voices (e.g. Microsoft Pallavi Natural, Google ta-in female, Apple Vani/Kavya).
 * 2. Avoids robotic, deep, or male voices (e.g. Valluvar, Ravi, -tam- male engine identifiers).
 * 3. Gracefully falls back to the closest natural female Indian voice (e.g. Neerja, Veena, Swara, Heera)
 *    if a natural Tamil female voice is unavailable.
 */
export function getTamilVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;

  // Dynamically query latest voices from speechSynthesis
  const liveVoices = window.speechSynthesis.getVoices();
  const voices = liveVoices && liveVoices.length > 0 ? liveVoices : cachedVoices;
  if (!voices || voices.length === 0) return null;

  // Keywords that identify male voices to strictly deprioritize or avoid
  const maleKeywords = [
    'male', 'man', 'valluvar', 'ravi', 'prabhat', 'madhav', 'hemant',
    '-tam-', '-enm-', '-him-', 'david', 'mark', 'george', 'stefan',
    'microsoft ravi', 'google हिन्दी male'
  ];

  // Keywords that identify female voices
  const femaleKeywords = [
    'female', 'woman', 'girl', 'pallavi', 'vani', 'kavya', 'neerja',
    'heera', 'veena', 'swara', 'kalpana', 'lekha', 'sangeeta', 'sunita',
    '-taf-', '-enf-', '-hif-', 'female_1', 'female_2', 'smtf', 'f00', 'f01'
  ];

  // Keywords that indicate robotic / mechanical synth
  const roboticKeywords = ['espeak', 'classic', 'compact', 'legacy'];

  // Keywords that indicate high-quality natural, conversational human-like voices
  const naturalKeywords = [
    'natural', 'online', 'neural', 'wavenet', 'google', 'apple',
    'conversational', 'premium', 'highquality', 'enhanced'
  ];

  const scoreVoice = (voice: SpeechSynthesisVoice): number => {
    const name = voice.name.toLowerCase();
    const uri = voice.voiceURI.toLowerCase();
    const lang = voice.lang.toLowerCase().replace('_', '-');

    const isTa = lang.startsWith('ta') || name.includes('tamil') || uri.includes('tamil');
    const isEnIn = lang === 'en-in' || (lang.startsWith('en') && (name.includes('india') || uri.includes('india')));
    const isHiIn = lang === 'hi-in' || lang.startsWith('hi');
    const isIndian = isTa || isEnIn || isHiIn || lang.endsWith('-in');

    const isMale = maleKeywords.some((kw) => name.includes(kw) || uri.includes(kw));
    const isFemale = femaleKeywords.some((kw) => name.includes(kw) || uri.includes(kw));
    const isNatural = naturalKeywords.some((kw) => name.includes(kw) || uri.includes(kw));
    const isRobotic = roboticKeywords.some((kw) => name.includes(kw) || uri.includes(kw));

    let score = 0;

    // 1. Tamil voices (highest tier)
    if (isTa) {
      score += 1000;
      if (lang === 'ta-in' || lang === 'ta_in') score += 150;
      if (isFemale) score += 800; // prioritize female Tamil
      if (isNatural) score += 250; // prioritize natural human-like models
      if (isMale) score -= 1200; // strictly avoid male Tamil voices (e.g. Valluvar, -tam-)
      if (isRobotic) score -= 400; // penalize robotic/espeak engines
    }
    // 2. Indian female fallback (English-India or Hindi-India female)
    else if (isIndian) {
      score += 350;
      if (isFemale) score += 450;
      if (isNatural) score += 150;
      if (isMale) score -= 800;
      if (isRobotic) score -= 300;
    }
    // 3. Other female voices
    else if (isFemale) {
      score += 60;
      if (isNatural) score += 50;
    }

    if (voice.default && !isMale) {
      score += 10;
    }

    return score;
  };

  // Sort candidates by score descending
  const sorted = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));

  if (sorted.length > 0 && scoreVoice(sorted[0]) > 0) {
    return sorted[0];
  }

  // Graceful fallback: find first non-male voice
  const fallback = voices.find((v) => {
    const n = v.name.toLowerCase();
    const u = v.voiceURI.toLowerCase();
    return !maleKeywords.some((kw) => n.includes(kw) || u.includes(kw));
  });

  return fallback || voices[0] || null;
}

/**
 * Strips emojis, decorative symbols, and non-spoken formatting characters
 * from text before sending to SpeechSynthesis, ensuring symbols like ❤️, 😊, 🌸, ⭐
 * are never vocalized as emoji names (e.g. "சிவப்பு நிற இதயம்").
 * Preserves all Tamil letters, digits, and spoken punctuation.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  return (
    text
      // 1. Remove all Unicode emojis and pictographs (❤️, 😊, 🌸, ⭐, 🙏, etc.)
      .replace(/\p{Extended_Pictographic}/gu, '')
      // 2. Remove variation selectors (VS-15, VS-16), skin tone modifiers, zero-width joiners, enclosing keycaps
      .replace(/[\uFE0E\uFE0F\u200D\u20E3]/gu, '')
      // 3. Remove decorative unicode symbols, dingbats, stars, and shapes
      .replace(
        /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}-\u{2B59}\u{25A0}-\u{25FF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}]/gu,
        ''
      )
      // 4. Remove decorative bullet symbols and marks: • ● ▪ ▫ ◆ ◇ ★ ☆ ✓ ✔ ✕ ✖ ✦ ✧ ► ▸ → ⇒ 🛡 ⏱
      .replace(/[•●▪▫◆◇★☆✓✔✕✖✦✧►▸→⇒🛡⏱]/g, '')
      // 5. Remove markdown formatting symbols
      .replace(/[*#_~`]/g, '')
      // 6. Clarify currency symbol and links into natural Tamil speech
      .replace(/₹/g, ' ரூபாய் ')
      .replace(/https?:\/\/\S+/g, ' அதிகாரப்பூர்வ இணையதளம் ')
      // 7. Clean up leftover extra whitespace
      .replace(/[ \t]+/g, ' ')
      .trim()
  );
}

/**
 * Splits long Tamil text into clean, manageable sentence chunks for instant start
 * with emoji filtering and currency normalization, preserving exact Tamil Unicode text.
 */
export function splitTextIntoSpeechChunks(text: string): string[] {
  if (!text) return [];

  const cleaned = cleanTextForSpeech(text);
  if (!cleaned) return [];

  // Split by newlines and sentence punctuation: ., ?, !, ;, \n
  const rawSegments = cleaned.split(/(?<=[.!?;\n।])\s+/);
  const chunks: string[] = [];

  for (const seg of rawSegments) {
    const trimmed = seg.trim();
    if (!trimmed) continue;

    // If segment is very long (> 150 characters), split further by commas to keep speech responsive
    if (trimmed.length > 150) {
      const subParts = trimmed.split(/(?<=[,])\s+/);
      let buffer = '';
      for (const part of subParts) {
        if ((buffer + ' ' + part).trim().length > 140) {
          if (buffer) chunks.push(buffer.trim());
          buffer = part;
        } else {
          buffer = (buffer ? buffer + ' ' : '') + part;
        }
      }
      if (buffer.trim()) {
        chunks.push(buffer.trim());
      }
    } else {
      chunks.push(trimmed);
    }
  }

  return chunks.filter(Boolean);
}

export function stopCurrentAudio(): void {
  activeSessionId++;

  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch (e) {
      console.warn('Audio pause error:', e);
    }
    currentAudioElement = null;
  }

  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('speechSynthesis cancel error:', e);
    }
  }
}

export function playBase64Audio(
  base64Data: string,
  mimeType: string = 'audio/wav',
  onEnd?: () => void,
  onError?: (err: any) => void
): () => void {
  stopCurrentAudio();

  try {
    const audioSrc = `data:${mimeType};base64,${base64Data}`;
    const audio = new Audio(audioSrc);
    currentAudioElement = audio;

    audio.onended = () => {
      currentAudioElement = null;
      if (onEnd) onEnd();
    };

    audio.onerror = (err) => {
      console.error('Audio playback error:', err);
      currentAudioElement = null;
      if (onError) onError(err);
    };

    audio.play().catch((playErr) => {
      console.warn('Autoplay prevented or play error:', playErr);
      if (onError) onError(playErr);
    });

    return () => {
      try {
        audio.pause();
      } catch {}
      currentAudioElement = null;
    };
  } catch (err) {
    console.error('Failed to instantiate Audio:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Fast, responsive Tamil Text-to-Speech using browser SpeechSynthesis.
 * - Cancels previous speech immediately.
 * - Resumes speech synthesis engine to avoid Chrome freezes.
 * - Splits into chunks so speech starts immediately without delay.
 * - Never queues multiple requests.
 * - Resets speaking state reliably on end or error.
 */
export function speakWithBrowserSynthesis(
  text: string,
  onEnd?: () => void,
  onError?: (err: any) => void,
  onStart?: () => void
): void {
  // 1. Immediately cancel any ongoing speech and prevent stale callbacks
  stopCurrentAudio();

  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onError) onError(new Error('Speech synthesis not supported'));
    return;
  }

  // 2. Prepare chunks for immediate sequential playback
  const chunks = splitTextIntoSpeechChunks(text);
  if (chunks.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  const thisSessionId = activeSessionId;
  let currentChunkIndex = 0;
  let hasStarted = false;

  // 3. Resume audio engine immediately (critical for Chrome after pause or inactivity)
  try {
    window.speechSynthesis.resume();
  } catch {}

  const playChunk = (index: number) => {
    // If user tapped Read Aloud again or tapped Stop, discard this session immediately
    if (thisSessionId !== activeSessionId) return;

    if (index >= chunks.length) {
      if (onEnd) onEnd();
      return;
    }

    const chunkText = chunks[index];
    const utterance = new SpeechSynthesisUtterance(chunkText);

    const selectedVoice = getTamilVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang || 'ta-IN';
    } else {
      utterance.lang = 'ta-IN';
    }

    // Soft, warm, clear, conversational female Tamil tone: natural speed (0.95) and pleasant pitch (1.05)
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      if (thisSessionId !== activeSessionId) return;
      if (!hasStarted) {
        hasStarted = true;
        if (onStart) onStart();
      }
    };

    utterance.onend = () => {
      if (thisSessionId !== activeSessionId) return;
      currentChunkIndex++;
      playChunk(currentChunkIndex);
    };

    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      if (thisSessionId !== activeSessionId) return;

      // 'interrupted' or 'canceled' happens normally when stopped by user
      if (event.error === 'interrupted' || event.error === 'canceled') {
        if (onEnd) onEnd();
        return;
      }

      console.warn('Speech chunk error:', event.error);
      currentChunkIndex++;
      if (currentChunkIndex < chunks.length) {
        playChunk(currentChunkIndex);
      } else {
        if (onError) onError(event);
        if (onEnd) onEnd();
      }
    };

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('SpeechSynthesis.speak failed:', err);
      if (onError) onError(err);
      if (onEnd) onEnd();
    }
  };

  // 4. Start first chunk immediately with zero delay
  playChunk(0);
}
