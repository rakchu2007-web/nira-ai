import '@testing-library/jest-dom/vitest';

// Polyfill window.SpeechSynthesis and related classes for tests
export class MockSpeechSynthesisUtterance {
  text: string;
  lang: string = 'ta-IN';
  voice: any = null;
  rate: number = 1.0;
  pitch: number = 1.0;
  volume: number = 1.0;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((err: any) => void) | null = null;

  constructor(text: string = '') {
    this.text = text;
  }
}

export const mockDefaultVoices = [
  {
    name: 'Microsoft Pallavi Online (Natural) - Tamil (India)',
    lang: 'ta-IN',
    voiceURI: 'Microsoft Pallavi Online (Natural) - Tamil (India)',
    default: true,
    localService: false,
  },
  {
    name: 'Microsoft Valluvar Online (Natural) - Tamil (India)',
    lang: 'ta-IN',
    voiceURI: 'Microsoft Valluvar Online (Natural) - Tamil (India)',
    default: false,
    localService: false,
  },
  {
    name: 'Google தமிழ்',
    lang: 'ta-IN',
    voiceURI: 'ta-in-x-taf-network',
    default: false,
    localService: false,
  },
  {
    name: 'Microsoft Neerja Online (Natural) - English (India)',
    lang: 'en-IN',
    voiceURI: 'Microsoft Neerja Online (Natural) - English (India)',
    default: false,
    localService: false,
  },
];

export const mockSpeechSynthesis = {
  getVoices: () => mockDefaultVoices,
  speak: (utterance: any) => {
    if (utterance.onstart) setTimeout(() => utterance.onstart(), 5);
    if (utterance.onend) setTimeout(() => utterance.onend(), 15);
  },
  cancel: () => {},
  resume: () => {},
  pause: () => {},
  speaking: false,
  pending: false,
  paused: false,
  onvoiceschanged: null as any,
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'speechSynthesis', {
    value: mockSpeechSynthesis,
    writable: true,
  });

  (window as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  (globalThis as any).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;

  // Mock scrollTo
  window.scrollTo = () => {};
}
