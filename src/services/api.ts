export interface ChatResponse {
  reply: string;
  isPrivacyWarning?: boolean;
  isFallback?: boolean;
}

export interface TTSResponse {
  audioBase64?: string;
  mimeType?: string;
  fallbackToBrowser: boolean;
}

export async function sendMessageToGemini(
  message: string,
  history: Array<{ role: 'user' | 'model'; text: string }> = [],
  stepMode: boolean = false
): Promise<ChatResponse> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, stepMode }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        reply: errData.reply || 'மன்னிக்கவும் சகோதரி, இணைய இணைப்பில் சிக்கல் உள்ளது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
        isFallback: true,
      };
    }

    return await res.json();
  } catch (error: any) {
    console.error('Error contacting chat endpoint:', error);
    return {
      reply: 'மன்னிக்கவும் சகோதரி, இணைய இணைப்பில் சிக்கல் உள்ளது. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
      isFallback: true,
    };
  }
}

export async function explainSchemeSimply(
  schemeName: string,
  officialContent: string
): Promise<{ simpleExplanation: string }> {
  try {
    const res = await fetch('/api/explain-simply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schemeName, officialContent }),
    });

    if (!res.ok) {
      return {
        simpleExplanation: `இந்த ${schemeName} திட்டம் மக்களுக்கான நேரடி அரசு உதவி திட்டம். தகுதியுள்ளவர்கள் தங்கள் பகுதி இ-சேவை மையம் அல்லது அரசு அலுவலகத்தில் விண்ணப்பிக்கலாம்.`,
      };
    }

    return await res.json();
  } catch (err) {
    console.error('Error fetching simple explanation:', err);
    return {
      simpleExplanation: `இந்த ${schemeName} திட்டம் தகுதியுள்ள பொதுமக்களுக்கு அரசு வழங்கும் பயனுள்ள திட்டம். உங்கள் பகுதி அரசு அலுவலரிடம் மேலும் விவரங்களை அறியலாம்.`,
    };
  }
}

export async function fetchTamilTTS(text: string): Promise<TTSResponse> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      return { fallbackToBrowser: true };
    }

    return await res.json();
  } catch (error) {
    console.warn('TTS request error, using browser fallback:', error);
    return { fallbackToBrowser: true };
  }
}
