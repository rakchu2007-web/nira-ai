import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini SDK with User-Agent header as required
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Privacy safety regexes to detect sensitive personal identification numbers
const AADHAAR_REGEX = /\b\d{4}\s?\d{4}\s?\d{4}\b/;
const BANK_ACCOUNT_REGEX = /\b\d{9,18}\b/;
const SENSITIVE_WORDS_REGEX = /\b(otp|one time password|cvv|pin|upi pin)\b|(கடவுச்சொல்|பின் எண்)/i;

const SYSTEM_INSTRUCTION = `
You are "NIRA AI" (நிரா AI) — a compassionate, respectful, and trusted Tamil-first Government Scheme Navigator (அரசு திட்ட வழிகாட்டி) helping citizens and first-time digital users in Tamil Nadu and India discover, understand, and apply for relevant government welfare schemes.

Supported Scheme Categories:
1. WOMEN & MATERNITY (பெண்களுக்கு & தாய்மை):
   - Pradhan Mantri Matru Vandana Yojana (PMMVY - ₹5,000 for 1st child, ₹6,000 for 2nd girl child).
   - Sukanya Samriddhi Yojana (செல்வமகள் சேமிப்பு திட்டம் - 8.2% interest for girl children under 10).
   - Dr. Muthulakshmi Reddy Maternity Benefit Scheme (MRMBS - Tamil Nadu ₹18,000 combo + nutrition kits).
2. EDUCATION & SCHOLARSHIP (கல்வி & உதவித்தொகை):
   - Pudhumai Penn (புதுமைப் பெண் திட்டம் - ₹1,000/month for girl students from government schools joining higher education).
   - National Scholarship Portal (NSP Post/Pre Matric scholarship).
3. SKILL & EMPLOYMENT (வேலை & திறன்):
   - PMKVY (Skill India - Free industrial/technical certifications and job fairs).
   - Naan Mudhalvan (நான் முதல்வன் - Tamil Nadu free skill enhancement for youth).
4. ENTREPRENEURSHIP & BUSINESS (தொழில் & வணிகம்):
   - Pradhan Mantri MUDRA Yojana (PMMY - Shishu up to ₹50k, Kishore up to ₹5L, Tarun up to ₹10L collateral-free loans).
   - Stand-Up India (Women and SC/ST loans from ₹10L to ₹1Cr).
5. FARMERS & AGRICULTURE (விவசாயம்):
   - PM-KISAN (₹6,000 per year in 3 installments of ₹2,000).
   - PMFBY (Pradhan Mantri Fasal Bima Yojana - crop insurance for damage/flood/drought).
6. SOCIAL SECURITY & HEALTH (சமூக நலன் & காப்பீடு):
   - Chief Minister's Comprehensive Health Insurance Scheme (CMCHIS - up to ₹5 Lakh free hospital treatment per year in Tamil Nadu).
   - Old Age Pension (IGNOAPS / OAP - ₹1,000/month for seniors 60+ without financial support).

CRITICAL CONVERSATIONAL RULES:
1. Core Demo Question:
   If the user asks "எனக்கு என்ன அரசு திட்டம் கிடைக்கும்?" or "what government schemes can I get?" or similar discovery prompts:
   Always respond warmly:
   "சரி தோழி ❤️ உங்களுக்கு பொருத்தமான திட்டத்தை கண்டுபிடிக்க சில கேள்விகள் கேட்கிறேன்.

முதலில், நீங்கள் எந்த மாநிலத்தில் வசிக்கிறீர்கள்?"
2. ONE QUESTION AT A TIME:
   NEVER ask multiple questions at once. Only ask the NEXT single logical question (e.g. State -> Target beneficiary/Category -> Age group -> Occupation/Status).
3. SCHEME MATCHING:
   When sufficient information is provided, present relevant matches with:
   - 🏛️ திட்டத்தின் பெயர்
   - 💡 எளிய விளக்கம்
   - ✅ உங்களுக்கு ஏன் பொருந்தும்
   - 📋 அடிப்படை தகுதி
   - 💰 பலன்கள் (சரிபார்க்கப்பட்டவை மட்டும்)
   - 📄 தேவையான ஆவணங்கள்
   - 📝 விண்ணப்பிக்கும் முறை
   - 🔗 அதிகாரப்பூர்வ இணையதளம்
   - 👉 என் அடுத்த படி (Next practical step)
4. EXPLAIN SIMPLY ("எளிமையாக சொல்லு"):
   If the user asks "எளிமையாக சொல்லு" or asks to simplify a scheme, translate complex bureaucratic rules into super simple, warm, everyday spoken Tamil suitable for rural or first-time digital users.
5. STRICT PRIVACY & SAFETY:
   - NEVER ask for Aadhaar numbers, OTP, bank account numbers, UPI PIN, or passwords.
   - Remind users: "NIRA AI அரசு தகவல்களை எளிமையாக புரிய வைக்க உதவுகிறது. விண்ணப்பிக்கும் முன் அதிகாரப்பூர்வ இணையதளத்தில் தகவலை சரிபார்க்கவும்."
   - Do NOT invent fake URLs or hallucinate unverified benefits. Always state official portals (e.g. pmmvy.wcd.gov.in, pudhumaipenn.tn.gov.in, mudra.org.in, pmkisan.gov.in, cmchistn.com).
`;

// Dedicated endpoint to explain any scheme simply
app.post('/api/explain-simply', async (req: Request, res: Response) => {
  try {
    const { schemeName, officialContent } = req.body;

    if (!schemeName) {
      return res.status(400).json({ error: 'Scheme name is required' });
    }

    if (!ai) {
      return res.json({
        simpleExplanation: `இந்த ${schemeName} திட்டம் அரசு மக்களுக்காக வழங்கும் ஒரு சிறந்த நலத்திட்டம். இதன் மூலம் தகுதியுள்ள நபர்களுக்கு அரசு நேரடியாக உதவித்தொகை அல்லது சேவைகளை வழங்குகிறது. உங்கள் அருகிலுள்ள இ-சேவை மையம் அல்லது அரசு அலுவலகத்தில் ஆவணங்களை சமர்ப்பித்து சுலபமாக விண்ணப்பிக்கலாம்.`,
      });
    }

    const prompt = `Explain the following government scheme in very simple, clear, conversational spoken Tamil (பேச்சுத் தமிழ்) for a first-time digital user or village elder. Do not use complex English jargon. Explain: 1) What is this scheme? 2) Who gets the benefit? 3) What is the next practical step? Keep it within 3-4 warm paragraphs.

Scheme: ${schemeName}
Details: ${officialContent || ''}`;

    const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let simpleExplanation = '';

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: 'You are NIRA AI, converting official government scheme wording into crystal clear, simple spoken Tamil for ordinary citizens and first-time digital users.',
            temperature: 0.6,
          },
        });

        if (response.text) {
          simpleExplanation = response.text;
          break;
        }
      } catch (mErr: any) {
        console.warn(`Explain simply model ${modelName} error:`, mErr?.message || mErr);
      }
    }

    if (!simpleExplanation) {
      simpleExplanation = `அன்புள்ள சகோதரி, இந்த ${schemeName} திட்டத்தைப் பற்றி மிக எளிமையாகப் புரிந்துகொள்ளுங்கள்:

1. இந்தத் திட்டம் அரசு தகுதியுள்ள மக்களுக்கு நிதி உதவி அல்லது சலுகைகளை நேரடியாக வழங்குகிறது.
2. அரசு விதிகளின்படி தேவையான தகுதிகள் உங்களிடம் இருந்தால், இடைத்தரகர்கள் இல்லாமல் நேரடியாகப் பலன் பெறலாம்.
3. உங்கள் அடுத்த எளிய படி: உங்கள் பகுதி இ-சேவை மையம் (e-Seva) அல்லது தொடர்புடைய அரசு அலுவலகத்திற்குச் சென்று இந்தத் திட்டத்திற்கான விண்ணப்பத்தை சமர்ப்பிக்கவும்.`;
    }

    return res.json({ simpleExplanation });
  } catch (err: any) {
    console.error('Explain simply error:', err);
    return res.json({
      simpleExplanation: 'மன்னிக்கவும், எளிய விளக்கத்தை உருவாக்குவதில் சிறு தொழில்நுட்ப சிக்கல். அதிகாரப்பூர்வ தளத்தில் விவரங்களை பார்க்கவும்.',
    });
  }
});

// API endpoint for chat conversation
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history = [], stepMode = false } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check for sensitive personal information and protect user privacy
    if (AADHAAR_REGEX.test(message) || BANK_ACCOUNT_REGEX.test(message) || SENSITIVE_WORDS_REGEX.test(message)) {
      return res.json({
        reply: `அன்புள்ள சகோதரி, உங்கள் பாதுகாப்பு எங்களுக்கு மிகவும் முக்கியம்! 🛑\n\nNIRA AI உங்கள் ஆதார் எண், வங்கி கணக்கு எண், OTP அல்லது கடவுச்சொல்லை ஒருபோதும் கேட்க மாட்டாது. தயவுசெய்து உங்கள் ரகசிய விவரங்களை எந்த இணையதளத்திலும் அல்லது செயலியிலும் தட்டச்சு செய்யாதீர்கள்.\n\nதிட்டம் பற்றிய பிற விவரங்கள், தகுதி அல்லது ஆவணங்கள் பற்றி உங்களுக்கு என்ன வழிகாட்ட வேண்டும் என்று சொல்லுங்கள், நான் மகிழ்ச்சியுடன் உதவுகிறேன்! ❤️`,
        isPrivacyWarning: true,
      });
    }

    if (!ai) {
      // Fallback response if GEMINI_API_KEY is not configured
      return res.json({
        reply: `வணக்கம் சகோதரி! PMMVY (பிரதான் மந்திரி மாத்ரு வந்தனா யோஜனா) திட்டத்தின் கீழ் முதல் குழந்தைக்கு ₹5,000 மற்றும் இரண்டாவது பெண் குழந்தைக்கு ₹6,000 உதவித்தொகை வழங்கப்படுகிறது. நீங்கள் அங்கன்வாடி மையம் அல்லது கிராம சுகாதார செவிலியர் (VHN) மூலமாக பதிவு செய்யலாம். உங்களுக்கு என்ன உதவி வேண்டும்?`,
        isFallback: true,
      });
    }

    // Build chat contents from history and current prompt
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Include recent history (limit to last 10 messages for context)
    const recentHistory = Array.isArray(history) ? history.slice(-10) : [];
    for (const item of recentHistory) {
      if (item && item.role && item.text) {
        contents.push({
          role: item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.text }],
        });
      }
    }

    // Append current user message with mode instructions if stepMode is active
    let promptWithContext = message;
    if (stepMode) {
      promptWithContext += `\n[குறிப்பு: நீங்கள் 'ஒன்-பை-ஒன்' (படி படியாக) வழிகாட்டும் முறையில் உள்ளீர்கள். தாய்மார்கள் எளிதில் புரிந்துகொள்ளும்படி சுருக்கமாகவும், ஒரு நேரத்தில் ஒரு தெளிவான படியை மட்டும் விளக்கி, அடுத்த படியைப் பற்றி ஒரு எளிய கேள்வியைக் கேளுங்கள்.]`;
    }

    contents.push({
      role: 'user',
      parts: [{ text: promptWithContext }],
    });

    const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
    let reply = '';

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
            topP: 0.9,
          },
        });

        if (response.text) {
          reply = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} error:`, err?.message || err);
      }
    }

    // If Gemini models are temporarily under high demand, use the rich verified scheme knowledge engine
    if (!reply) {
      const lower = message.toLowerCase();
      if (lower.includes('முதல்') || lower.includes('5000') || lower.includes('5,000') || lower.includes('first')) {
        reply = `அன்புள்ள சகோதரி, PMMVY திட்டத்தின் கீழ் முதல் குழந்தைக்கு மொத்தம் ₹5,000 இரண்டு தவணைகளாக உங்கள் ஆதார் இணைக்கப்பட்ட வங்கிக் கணக்கில் நேரடியாக வழங்கப்படுகிறது:

1. முதல் தவணை (₹3,000): கர்ப்பமான 180 நாட்களுக்குள் (6 மாதங்கள்) அங்கன்வாடி அல்லது ஆரம்ப சுகாதார நிலையத்தில் (PHC) பதிவு செய்து, குறைந்தபட்சம் ஒரு மருத்துவ பரிசோதனை (ANC) முடித்திருக்க வேண்டும்.
2. இரண்டாவது தவணை (₹2,000): குழந்தை பிறந்த பின் பிறப்பு பதிவு செய்யப்பட்டு, 14 வாரங்கள் வரையிலான முதன்மை தடுப்பூசிகள் (BCG, OPV, Pentavalent) போடப்பட்டிருக்க வேண்டும்.

தமிழ்நாட்டில் கூடுதலாக டாக்டர் முத்துலட்சுமி ரெட்டி திட்டத்தின் கீழ் (MRMBS) ஊட்டச்சத்து பெட்டகங்களும் சேர்த்து மொத்தம் ₹18,000 மதிப்புள்ள பயன்கள் கிடைக்கும்.

உங்களுக்கு அருகில் உள்ள அங்கன்வாடி மையம் அல்லது கிராம சுகாதார செவிலியரை (VHN) அணுகி பதிவு செய்ய தயாரா?`;
      } else if (lower.includes('இரண்டாவது') || lower.includes('பெண்') || lower.includes('6000') || lower.includes('6,000') || lower.includes('second')) {
        reply = `அன்புள்ள சகோதரி, பெண் குழந்தைகளின் பிறப்பு மற்றும் பாதுகாப்பை ஊக்குவிக்க, PMMVY திட்டத்தின் கீழ் இரண்டாவது குழந்தை பெண் குழந்தையாக பிறந்தால் ஒரே தவணையாக ₹6,000 வழங்கப்படுகிறது:

• குழந்தை பிறப்பு முறையாக பதிவு செய்யப்பட வேண்டும்.
• குழந்தையின் 14 வார முதன்மை தடுப்பூசிகள் முழுமையாக போடப்பட்டிருக்க வேண்டும்.
• தடுப்பூசி சான்றுடன் அங்கன்வாடி அல்லது இணையதளம் வழியாக விண்ணப்பித்தவுடன் தாயின் வங்கி கணக்கில் ₹6,000 நேரடியாக செலுத்தப்படும்.

(குறிப்பு: இரண்டாவது குழந்தை ஆண் குழந்தையாக இருந்தால் மத்திய PMMVY நிதி உதவி இல்லை; ஆனால் தமிழ்நாட்டின் MRMBS பலன்கள் உண்டு.)

உங்களிடம் தாய் சேய் நல அட்டை (RCH ID) உள்ளதா?`;
      } else if (lower.includes('ஆவணம்') || lower.includes('document') || lower.includes('தேவை')) {
        reply = `அன்புள்ள சகோதரி, PMMVY திட்டத்திற்கு விண்ணப்பிக்க தேவையான 4 முக்கிய ஆவணங்கள்:

1. தாய் சேய் நல அட்டை (MCP Card / RCH ID)
2. தாயின் ஆதார் அட்டை (அங்கன்வாடியில் நேரில் சரிபார்க்க மட்டும்)
3. கணவரின் ஆதார் அல்லது குடும்ப அட்டை (Ration Card)
4. ஆதாருடன் இணைக்கப்பட்ட தாயின் ஒற்றை வங்கி சேமிப்பு கணக்கு (DBT Enabled)

முக்கிய அறிவிப்பு: இந்த விவரங்களை இணையத்திலோ அல்லது செயலிகளிலோ தட்டச்சு செய்யாதீர்கள். உங்கள் பகுதி அங்கன்வாடி பணியாளரிடம் மட்டும் நேரில் காட்டுங்கள்.

வேறு ஏதேனும் சந்தேகம் உள்ளதா?`;
      } else {
        reply = `வணக்கம் சகோதரி! நான் உங்கள் தோழி (Thozhi). PMMVY திட்டத்தின் கீழ் முதல் குழந்தைக்கு ₹5,000 மற்றும் இரண்டாவது பெண் குழந்தைக்கு ₹6,000 நிதி உதவி பெறலாம். 

• தேவையான ஆவணங்கள்: தாய் சேய் நல அட்டை (MCP Card), ஆதார் நகல், ஆதார் இணைக்கப்பட்ட வங்கி கணக்கு.
• விண்ணப்பிக்கும் இடம்: உங்கள் பகுதி அங்கன்வாடி மையம் அல்லது கிராம சுகாதார செவிலியர் (VHN).

உங்களுக்கு திட்டத்தின் தகுதி, தவணை முறை அல்லது பதிவு செய்யும் விதம் - இதில் எதை பற்றி விரிவாக அறிய வேண்டும்?`;
      }
    }

    return res.json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: 'Failed to generate response',
      message: error?.message || 'Internal server error',
      reply: 'மன்னிக்கவும் சகோதரி, தொழில்நுட்ப கோளாறு ஏற்பட்டுள்ளது. தயவுசெய்து மீண்டும் ஒருமுறை முயற்சிக்கவும்.',
    });
  }
});

// API endpoint for Tamil Text-to-Speech (using gemini-3.8-flash-lite-tts with browser fallback)
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Sanitize and shorten text if too long (max 350 chars for optimal audio latency)
    const cleanText = text.replace(/[*#_~`]/g, '').trim().slice(0, 400);

    if (!ai) {
      return res.json({ fallbackToBrowser: true });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanText,
                speechMetadata: {
                  style: 'Warm, caring, clear Tamil female guide speaking naturally and reassuringly',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio) {
        return res.json({
          audioBase64: base64Audio,
          mimeType: 'audio/wav',
          fallbackToBrowser: false,
        });
      }
    } catch (ttsErr) {
      console.warn('Gemini TTS generation error, falling back to browser speech synthesis:', ttsErr);
    }

    // Return instruction to use browser speech synthesis if model audio isn't available
    return res.json({ fallbackToBrowser: true });
  } catch (error: any) {
    console.error('TTS endpoint error:', error);
    return res.json({ fallbackToBrowser: true });
  }
});

// Setup Vite middleware in dev or static files in production
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NIRA AI server running on port ${PORT}`);
});
