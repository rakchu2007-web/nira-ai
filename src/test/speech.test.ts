import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  cleanTextForSpeech,
  splitTextIntoSpeechChunks,
  getTamilVoice,
  mergeSpeechSegments,
  speakWithBrowserSynthesis,
  stopCurrentAudio,
  isSpeechRecognitionSupported,
} from '../services/speech';

describe('Speech & Audio Service - Tamil Voice & Text Handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('cleanTextForSpeech', () => {
    it('removes single emoji like red heart while preserving Tamil text', () => {
      const input = 'வணக்கம் ❤️';
      const output = cleanTextForSpeech(input);
      expect(output).toBe('வணக்கம்');
      expect(output).not.toContain('❤️');
      expect(output).not.toContain('இதயம்');
    });

    it('removes multiple diverse emojis and decorative symbols without affecting Tamil letters', () => {
      const input = 'வணக்கம்! நான் உங்கள் NIRA AI ❤️ 😊 🌸 ⭐ 🙏 👩‍⚕️ 🏛️ 💡 📋 💰 🛑';
      const output = cleanTextForSpeech(input);
      expect(output).toBe('வணக்கம்! நான் உங்கள் NIRA AI');
    });

    it('converts Rupee currency symbol to spoken Tamil word "ரூபாய்"', () => {
      const input = 'மாதம் ₹ 1000 உதவித்தொகை மற்றும் ₹5,000 மானியம்';
      const output = cleanTextForSpeech(input);
      expect(output).toContain('ரூபாய்');
      expect(output).not.toContain('₹');
    });

    it('converts web links to friendly Tamil text', () => {
      const input = 'விவரங்களுக்கு https://pmmvy.wcd.gov.in என்ற இணையதளத்தை பார்க்கவும்.';
      const output = cleanTextForSpeech(input);
      expect(output).toContain('அதிகாரப்பூர்வ இணையதளம்');
      expect(output).not.toContain('https://');
    });

    it('strips bullet symbols and markdown formatting', () => {
      const input = '**முக்கிய தகவல்:**\n• முதல் தவணை\n• இரண்டாவது தவணை';
      const output = cleanTextForSpeech(input);
      expect(output).not.toContain('**');
      expect(output).not.toContain('•');
      expect(output).toContain('முக்கிய தகவல்:');
      expect(output).toContain('முதல் தவணை');
    });

    it('returns empty string for empty or whitespace input', () => {
      expect(cleanTextForSpeech('')).toBe('');
      expect(cleanTextForSpeech('   ')).toBe('');
    });
  });

  describe('splitTextIntoSpeechChunks', () => {
    it('returns empty array when text has no spoken content', () => {
      expect(splitTextIntoSpeechChunks('')).toEqual([]);
      expect(splitTextIntoSpeechChunks('❤️ 😊 ⭐')).toEqual([]);
    });

    it('splits Tamil text into natural sentence chunks based on punctuation and newlines', () => {
      const text = 'வணக்கம் சகோதரி! உங்களுக்கு என்ன உதவி வேண்டும்? நான் உங்களுக்கு வழிகாட்டுகிறேன்.';
      const chunks = splitTextIntoSpeechChunks(text);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks[0]).toContain('வணக்கம் சகோதரி');
    });

    it('splits long segments further at commas to maintain responsiveness', () => {
      const longSentence =
        'தமிழ்நாடு அரசு வழங்கும் புதுமைப் பெண் திட்டத்தின் மூலம், அரசுப் பள்ளிகளில் 6 முதல் 12 ஆம் வகுப்பு வரை பயின்று உயர்கல்வி சேரும் மாணவிகளுக்கு, ஒவ்வொரு மாதமும் அவர்களின் வங்கிக் கணக்கில் நேரடியாக ஆயிரம் ரூபாய் உதவித்தொகையாக வழங்கப்படுகிறது.';
      const chunks = splitTextIntoSpeechChunks(longSentence);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      chunks.forEach((chunk) => {
        expect(chunk.length).toBeLessThan(180);
      });
    });
  });

  describe('getTamilVoice ranking and selection', () => {
    it('selects natural female Tamil voice as top priority', () => {
      const selected = getTamilVoice();
      expect(selected).not.toBeNull();
      // Should pick Microsoft Pallavi (natural female) over Microsoft Valluvar (male)
      expect(selected?.name).toContain('Pallavi');
    });

    it('falls back to Indian female voice if no Tamil voice is available', () => {
      // Temporarily mock getVoices with only male Tamil and female Indian English
      const originalGetVoices = window.speechSynthesis.getVoices;
      window.speechSynthesis.getVoices = () => [
        {
          name: 'Microsoft Valluvar Online (Natural) - Tamil (India)',
          lang: 'ta-IN',
          voiceURI: 'Microsoft Valluvar Online (Natural)',
          default: false,
          localService: false,
        } as any,
        {
          name: 'Microsoft Neerja Online (Natural) - English (India)',
          lang: 'en-IN',
          voiceURI: 'Microsoft Neerja Online (Natural)',
          default: false,
          localService: false,
        } as any,
      ];

      const selected = getTamilVoice();
      expect(selected).not.toBeNull();
      // Indian female voice must be selected rather than male Tamil voice
      expect(selected?.name).toContain('Neerja');

      window.speechSynthesis.getVoices = originalGetVoices;
    });
  });

  describe('mergeSpeechSegments (Transcript Handling)', () => {
    it('returns empty string for empty array', () => {
      expect(mergeSpeechSegments([])).toBe('');
    });

    it('returns single segment directly', () => {
      expect(mergeSpeechSegments(['வணக்கம்'])).toBe('வணக்கம்');
    });

    it('merges progressive voice recognition segments cleanly', () => {
      const segments = ['எனக்கு', 'என்ன அரசு திட்டம் கிடைக்கும்'];
      const merged = mergeSpeechSegments(segments);
      expect(merged).toContain('எனக்கு என்ன அரசு திட்டம் கிடைக்கும்');
    });

    it('handles overlapping duplicate prefix from speech recognition engine', () => {
      const segments = ['ஒரு', 'ஒரு விவசாயி திட்டம்'];
      const merged = mergeSpeechSegments(segments);
      expect(merged).toBe('ஒரு விவசாயி திட்டம்');
    });
  });

  describe('speakWithBrowserSynthesis', () => {
    it('calls cancel and resume on speechSynthesis before speaking', () => {
      const cancelSpy = vi.spyOn(window.speechSynthesis, 'cancel');
      const resumeSpy = vi.spyOn(window.speechSynthesis, 'resume');
      const speakSpy = vi.spyOn(window.speechSynthesis, 'speak');

      speakWithBrowserSynthesis('வணக்கம் தோழி');

      expect(cancelSpy).toHaveBeenCalled();
      expect(resumeSpy).toHaveBeenCalled();
      expect(speakSpy).toHaveBeenCalled();

      // Check utterance configuration
      const lastCall = speakSpy.mock.calls[0];
      const utterance = lastCall[0] as any;
      expect(utterance.rate).toBeCloseTo(0.95);
      expect(utterance.pitch).toBeCloseTo(1.05);
      expect(utterance.text).toBe('வணக்கம் தோழி');
    });

    it('immediately cancels speech when stopCurrentAudio is called', () => {
      const cancelSpy = vi.spyOn(window.speechSynthesis, 'cancel');
      stopCurrentAudio();
      expect(cancelSpy).toHaveBeenCalled();
    });
  });

  describe('isSpeechRecognitionSupported', () => {
    it('returns true when window.SpeechRecognition or webkitSpeechRecognition is present', () => {
      (window as any).SpeechRecognition = class {};
      expect(isSpeechRecognitionSupported()).toBe(true);
      delete (window as any).SpeechRecognition;
    });

    it('returns false when neither recognition API is present', () => {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
      expect(isSpeechRecognitionSupported()).toBe(false);
    });
  });
});
