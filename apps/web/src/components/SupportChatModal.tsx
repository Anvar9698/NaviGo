import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Send, Bot, User, PhoneCall, ShieldAlert } from 'lucide-react';
import { SupportMessage } from '@yol/shared';

export const SupportChatModal: React.FC = () => {
  const { activeTab, setActiveTab, t, locale, user } = useApp();
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: 'init-1',
      conversationId: 'user-conv',
      senderType: 'AI_ASSISTANT',
      senderName: 'Yol AI Assistant',
      text: locale === 'uz' 
        ? "Assalomu alaykum! Men Yo'l Ma'lumoti sun'iy intellekt yordamchisiman. Sizga yo'l holati, ob-havo yoki ilovadan foydalanish bo'yicha qanday yordam bera olaman?"
        : locale === 'ru'
        ? "Здравствуйте! Я ИИ-помощник сервиса «Йўл Маълумоти». Чем могу помочь вам по дорожной ситуации или работе приложения?"
        : "Hello! I am the Yol Ma'lumoti AI support assistant. How can I assist you with road conditions, weather, or navigation today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (activeTab !== 'help') return null;

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const userText = inputText;
    setInputText('');
    setIsSending(true);

    const tempUserMsg: SupportMessage = {
      id: `tmp-${Date.now()}`,
      conversationId: 'user-conv',
      senderType: 'USER',
      senderName: user ? user.name : 'You',
      text: userText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/v1/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: 'user-conv',
          text: userText,
          lang: locale
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.reply]);
      }
    } catch (e) {
      console.warn('Support chat error:', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleEscalateToPerson = async () => {
    try {
      const res = await fetch('/api/v1/support/escalate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: 'user-conv' })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, data.staffMessage]);
      }
    } catch (e) {
      console.warn('Escalate error:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-support-title"
        className="w-full max-w-xl bg-white dark:bg-darkCard rounded-card shadow-float border border-yolBorder dark:border-darkBorder p-6 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-yolBorder dark:border-darkBorder">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accentOrange text-white flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 id="help-support-title" className="text-xl font-bold text-textPrimary dark:text-darkText">
                AI Road Assistant & Support
              </h2>
              <span className="text-xs text-textSecondary dark:text-darkTextSec flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Verified responses only • Human handoff available
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('map')}
            className="w-10 h-10 rounded-full bg-innerSoftArea dark:bg-gray-800 flex items-center justify-center text-textSecondary dark:text-darkTextSec hover:text-textPrimary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Alert & Talk to Person Banner */}
        <div className="flex items-center justify-between p-3 my-3 bg-innerSoftArea dark:bg-gray-800 rounded-2xl border border-yolBorder dark:border-darkBorder">
          <div className="text-xs text-textSecondary dark:text-darkTextSec">
            Need urgent human verification?
          </div>
          <button
            onClick={handleEscalateToPerson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blackPill text-white text-xs font-bold hover:bg-blackPillHover"
          >
            <PhoneCall className="w-3.5 h-3.5 text-accentOrange" />
            <span>Talk to a person</span>
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto space-y-3 p-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.senderType === 'USER' ? 'items-end' : 'items-start'
              }`}
            >
              <span className="text-[10px] font-bold text-textSecondary dark:text-darkTextSec mb-1 px-1">
                {m.senderName} ({m.senderType === 'AI_ASSISTANT' ? 'AI' : m.senderType === 'STAFF' ? 'Staff' : 'Citizen'})
              </span>
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                  m.senderType === 'USER'
                    ? 'bg-blackPill text-white rounded-br-none'
                    : m.senderType === 'STAFF'
                    ? 'bg-green-100 text-green-900 border border-green-300 rounded-bl-none'
                    : 'bg-innerSoftArea dark:bg-gray-800 text-textPrimary dark:text-darkText rounded-bl-none border border-yolBorder dark:border-gray-700'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="mt-4 pt-3 border-t border-yolBorder dark:border-darkBorder flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question or request..."
            className="flex-1 p-3 rounded-full bg-innerSoftArea dark:bg-gray-800 text-textPrimary dark:text-darkText text-sm border border-yolBorder dark:border-darkBorder focus:outline-none focus:ring-2 focus:ring-accentOrange"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-11 h-11 rounded-full bg-blackPill text-white flex items-center justify-center hover:bg-blackPillHover disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4 text-accentOrange" />
          </button>
        </form>
      </div>
    </div>
  );
};
