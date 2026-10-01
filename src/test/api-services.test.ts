import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendMessageToGemini, explainSchemeSimply, fetchTamilTTS } from '../services/api';

describe('API Services - Gemini & Backend Communication', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendMessageToGemini', () => {
    it('returns parsed chat response from server on success', async () => {
      const mockResponse = {
        reply: 'வணக்கம் சகோதரி! நான் NIRA AI.',
        isPrivacyWarning: false,
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await sendMessageToGemini('வணக்கம்', []);
      expect(result.reply).toBe('வணக்கம் சகோதரி! நான் NIRA AI.');
      expect(result.isFallback).toBeFalsy();
    });

    it('returns warm fallback message when network request fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

      const result = await sendMessageToGemini('எனக்கு உதவி தேவை');
      expect(result.isFallback).toBe(true);
      expect(result.reply).toContain('மன்னிக்கவும் சகோதரி');
    });

    it('returns fallback message when server returns non-200 HTTP status', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Internal Server Error' }),
      } as Response);

      const result = await sendMessageToGemini('திட்டம் பற்றி சொல்லுங்கள்');
      expect(result.isFallback).toBe(true);
      expect(result.reply).toContain('மன்னிக்கவும் சகோதரி');
    });

    it('sends message, history, and stepMode in POST request payload', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ reply: 'பதில்' }),
      } as Response);

      const history = [{ role: 'user' as const, text: 'ஹலோ' }];
      await sendMessageToGemini('அடுத்த படி என்ன?', history, true);

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/chat',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'அடுத்த படி என்ன?',
            history,
            stepMode: true,
          }),
        })
      );
    });
  });

  describe('explainSchemeSimply', () => {
    it('returns simplified explanation from API on success', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          simpleExplanation: 'இது பெண்களுக்கு உதவும் ஒரு சிறந்த திட்டம்.',
        }),
      } as Response);

      const result = await explainSchemeSimply('புதுமைப் பெண்', 'அரசுப் பள்ளி மாணவிகளுக்கு ₹1,000');
      expect(result.simpleExplanation).toBe('இது பெண்களுக்கு உதவும் ஒரு சிறந்த திட்டம்.');
    });

    it('returns graceful default explanation if request fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Fetch failed'));

      const result = await explainSchemeSimply('முத்ரா கடன்', 'சுயதொழில் கடன்');
      expect(result.simpleExplanation).toContain('முத்ரா கடன்');
      expect(result.simpleExplanation).toContain('திட்டம்');
    });
  });

  describe('fetchTamilTTS', () => {
    it('returns browser fallback flag when server TTS fails or is unavailable', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
      } as Response);

      const result = await fetchTamilTTS('வணக்கம்');
      expect(result.fallbackToBrowser).toBe(true);
    });

    it('returns audio data when backend TTS returns success', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          audioBase64: 'UklGRi...',
          mimeType: 'audio/wav',
          fallbackToBrowser: false,
        }),
      } as Response);

      const result = await fetchTamilTTS('வணக்கம்');
      expect(result.fallbackToBrowser).toBe(false);
      expect(result.audioBase64).toBe('UklGRi...');
    });
  });
});
