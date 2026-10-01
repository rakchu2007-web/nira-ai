/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { PrivacyBanner } from './components/PrivacyBanner';
import { ChatView } from './components/ChatView';
import { VoiceInputBar } from './components/VoiceInputBar';
import { SchemeNavigatorWizard } from './components/SchemeNavigatorWizard';
import { EligibilityChecker } from './components/EligibilityChecker';
import { OfficialVerification } from './components/OfficialVerification';
import { Message, AppSettings } from './types';
import { sendMessageToGemini } from './services/api';
import { speakWithBrowserSynthesis, stopCurrentAudio } from './services/speech';

const INITIAL_MESSAGE: Message = {
  id: 'msg-initial',
  sender: 'thozhi',
  text: `வணக்கம்! நான் உங்கள் "NIRA AI" (நிரா AI) — உங்கள் குடும்பத்திற்கான அரசு நலத்திட்ட வழிகாட்டி. 🙏\n\nபெண்களுக்கான உதவித்தொகை, மாணவிகளுக்கான கல்வி உதவித்தொகை (புதுமைப் பெண்), இளைஞர் வேலைவாய்ப்பு திறன் பயிற்சிகள், சுயதொழில் முத்ரா கடன்கள், விவசாயிகளுக்கான PM-KISAN, மற்றும் ₹5 லட்சம் மருத்துவக் காப்பீடு போன்ற பல்வேறு அரசு திட்டங்களை அறிந்து பயன்பெற நான் உங்களுக்கு எளிய முறையில் வழிகாட்டுகிறேன்.\n\n"எனக்கு என்ன அரசு திட்டம் கிடைக்கும்?" என்று கீழே உள்ள மைக் பட்டனை அழுத்தி தமிழில் பேசலாம் அல்லது தட்டச்சு செய்யலாம். உங்களுக்கு என்ன உதவி வேண்டும்?`,
  timestamp: 'இப்போது',
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'navigator' | 'chat' | 'eligibility' | 'official'>('navigator');

  // App Settings with Accessible Preferences
  const [settings, setSettings] = useState<AppSettings>(() => {
    return {
      fontSize: 'normal',
      highContrast: false,
      autoReadAloud: false,
      stepByStepMode: false,
    };
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat when messages update
  useEffect(() => {
    if (activeTab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, activeTab]);

  // Handle TTS playback for a specific message immediately with browser SpeechSynthesis
  const handleReadAloud = (msgId: string, text: string) => {
    // If user taps Read Aloud again while speech is playing, stop current and start new response immediately
    stopCurrentAudio();
    setActiveSpeakingId(msgId);

    speakWithBrowserSynthesis(
      text,
      () => setActiveSpeakingId(null),
      () => setActiveSpeakingId(null),
      () => setActiveSpeakingId(msgId)
    );
  };

  const handleStopSpeaking = () => {
    stopCurrentAudio();
    setActiveSpeakingId(null);
  };

  const handleRepeatAnswer = (msgId: string, text: string) => {
    handleReadAloud(msgId, text);
  };

  // Send message to Gemini server endpoint
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // If on navigator tab, switch to chat to view conversational reply
    if (activeTab !== 'chat') {
      setActiveTab('chat');
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Build history for context
    const historyPayload = messages.map((m) => ({
      role: m.sender === 'thozhi' ? ('model' as const) : ('user' as const),
      text: m.text,
    }));

    try {
      const response = await sendMessageToGemini(text, historyPayload, settings.stepByStepMode);

      const thozhiMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'thozhi',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isPrivacyWarning: response.isPrivacyWarning,
      };

      setMessages((prev) => [...prev, thozhiMessage]);

      // If autoReadAloud is enabled, speak automatically
      if (settings.autoReadAloud) {
        handleReadAloud(thozhiMessage.id, thozhiMessage.text);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'thozhi',
        text: 'மன்னிக்கவும் சகோதரி, தொழில்நுட்ப கோளாறு ஏற்பட்டுள்ளது. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Start Again action
  const handleStartAgain = () => {
    stopCurrentAudio();
    setActiveSpeakingId(null);
    setMessages([
      {
        ...INITIAL_MESSAGE,
        id: `msg-reset-${Date.now()}`,
        timestamp: 'இப்போது',
      },
    ]);
  };

  // Ask Thozhi directly from Scheme Navigator or other tab
  const handleAskThozhiFromOtherTab = (prompt: string) => {
    setActiveTab('chat');
    handleSendMessage(prompt);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors ${
        settings.highContrast ? 'bg-black text-white' : 'bg-rose-50/40 text-slate-800'
      }`}
    >
      {/* Header with accessibility toggles & navigation */}
      <Header
        settings={settings}
        onUpdateSettings={setSettings}
        onStartAgain={handleStartAgain}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Strict Privacy Guarantee Banner */}
      <PrivacyBanner highContrast={settings.highContrast} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'navigator' && (
          <div className="flex-1 flex flex-col overflow-y-auto">
            <SchemeNavigatorWizard
              settings={settings}
              onAskThozhi={handleAskThozhiFromOtherTab}
            />

            {/* Sticky Voice & Text Input Bar at bottom of navigator too */}
            <div className="sticky bottom-0 z-20">
              <VoiceInputBar
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                settings={settings}
              />
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div ref={chatContainerRef} className="flex-1 flex flex-col overflow-y-auto">
            <ChatView
              messages={messages}
              isLoading={isLoading}
              settings={settings}
              activeSpeakingId={activeSpeakingId}
              onReadAloud={handleReadAloud}
              onStopSpeaking={handleStopSpeaking}
              onRepeatAnswer={handleRepeatAnswer}
              onStartAgain={handleStartAgain}
            />

            {/* Sticky Voice & Text Input Bar */}
            <div className="sticky bottom-0 z-20">
              <VoiceInputBar
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                settings={settings}
              />
            </div>
          </div>
        )}

        {activeTab === 'eligibility' && (
          <div className="flex-1 overflow-y-auto">
            <EligibilityChecker
              settings={settings}
              onAskThozhi={handleAskThozhiFromOtherTab}
            />
          </div>
        )}

        {activeTab === 'official' && (
          <div className="flex-1 overflow-y-auto">
            <OfficialVerification settings={settings} />
          </div>
        )}
      </main>
    </div>
  );
}
