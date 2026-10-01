import { describe, it, expect } from 'vitest';

// Privacy safety regexes as defined in server and client validation
const AADHAAR_REGEX = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
const BANK_ACCOUNT_REGEX = /\b\d{9,18}\b/;
const SENSITIVE_WORDS_REGEX = /\b(otp|one time password|cvv|pin|upi pin)\b|(கடவுச்சொல்|பின் எண்)/i;

function checkPrivacySafety(message: string): { isSafe: boolean; warningTrigger?: string } {
  if (AADHAAR_REGEX.test(message)) {
    return { isSafe: false, warningTrigger: 'AADHAAR' };
  }
  if (BANK_ACCOUNT_REGEX.test(message)) {
    return { isSafe: false, warningTrigger: 'BANK_ACCOUNT' };
  }
  if (SENSITIVE_WORDS_REGEX.test(message)) {
    return { isSafe: false, warningTrigger: 'SENSITIVE_KEYWORD' };
  }
  return { isSafe: true };
}

describe('Safety & Privacy Guardrails for First-time Digital Users', () => {
  describe('Aadhaar Number Detection', () => {
    it('detects 12-digit Aadhaar number with space separation', () => {
      const input = 'என் ஆதார் எண் 1234 5678 9012 இதற்கு திட்டம் கிடைக்குமா?';
      const result = checkPrivacySafety(input);
      expect(result.isSafe).toBe(false);
      expect(result.warningTrigger).toBe('AADHAAR');
    });

    it('detects 12-digit Aadhaar number without spaces', () => {
      const input = 'My number is 987654321098';
      const result = checkPrivacySafety(input);
      expect(result.isSafe).toBe(false);
      expect(result.warningTrigger).toBe('AADHAAR');
    });

    it('does not trigger on standard scheme amounts, years, or ages', () => {
      const input = '2024 ஆம் ஆண்டில் ₹5,000 உதவித்தொகை பெற 18 வயது பூர்த்தியாகியிருக்க வேண்டுமா?';
      const result = checkPrivacySafety(input);
      expect(result.isSafe).toBe(true);
    });

    it('allows questions asking whether Aadhaar is required as a document', () => {
      const input = 'PMMVY விண்ணப்பிக்க ஆதார் அட்டை அவசியமா?';
      const result = checkPrivacySafety(input);
      expect(result.isSafe).toBe(true);
    });
  });

  describe('Bank Account & Financial ID Detection', () => {
    it('flags 11 to 16 digit bank account numbers', () => {
      const input = 'எனது வங்கி கணக்கு 12345678901234 பணம் வருமா?';
      const result = checkPrivacySafety(input);
      expect(result.isSafe).toBe(false);
      expect(result.warningTrigger).toBe('BANK_ACCOUNT');
    });

    it('does not flag normal phone numbers (10 digits separated by dashes or spaces)', () => {
      const input = 'அங்கன்வாடி தொலைபேசி எண் 044-2345678';
      const result = checkPrivacySafety(input);
      expect(result.isSafe).toBe(true);
    });
  });

  describe('Sensitive Credentials & OTP Detection', () => {
    it('detects OTP in English and Tamil', () => {
      expect(checkPrivacySafety('my OTP is 4589').isSafe).toBe(false);
      expect(checkPrivacySafety('எனக்கு வந்த ஒருமுறை கடவுச்சொல் (one time password)').isSafe).toBe(false);
    });

    it('detects PIN, UPI PIN, and CVV keywords', () => {
      expect(checkPrivacySafety('UPI PIN என்ன போட வேண்டும்?').isSafe).toBe(false);
      expect(checkPrivacySafety('ATM PIN எண் 4321').isSafe).toBe(false);
      expect(checkPrivacySafety('CVV எண் கேட்கிறார்கள்').isSafe).toBe(false);
      expect(checkPrivacySafety('என் கடவுச்சொல் இதுதான்').isSafe).toBe(false);
    });

    it('allows normal policy questions without sensitive credentials', () => {
      const queries = [
        'புதுமைப் பெண் திட்டத்திற்கு என்னென்ன ஆவணங்கள் தேவை?',
        'விவசாயிகளுக்கான பி.எம் கிசான் திட்டம் விவரம் சொல்லுங்கள்',
        'முதலமைச்சர் காப்பீடு மூலம் எவ்வளவு மருத்துவ உதவி கிடைக்கும்?',
        'எனக்கு என்ன அரசு திட்டம் கிடைக்கும்?',
      ];
      for (const q of queries) {
        expect(checkPrivacySafety(q).isSafe).toBe(true);
      }
    });
  });
});
