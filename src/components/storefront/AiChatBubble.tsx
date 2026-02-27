'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, HelpCircle, Bot, X, Send, Loader2, ThumbsUp, ThumbsDown } from 'lucide-react'

export type AiChatIconType = 'message' | 'help' | 'robot'
export type AiChatIconSizeType = 'xs' | 'sm' | 'medium' | 'lg' | 'xl'
export type AiChatPositionType = 'left' | 'right'

interface AiChatBubbleProps {
  storeSlug: string
  storeName: string
  primaryColor: string
  storefrontLanguage?: string
  businessType?: string
  aiChatIcon?: AiChatIconType
  aiChatIconSize?: AiChatIconSizeType
  aiChatName?: string
  aiChatPosition?: AiChatPositionType
  /** Matches scroll-to-top: bottom-24 when cart/booking bar visible, bottom-10 otherwise */
  bottomOffset?: 'bottom-10' | 'bottom-24'
}

// Suggested questions by business type and language
const SUGGESTED_QUESTIONS_EN: Record<string, string[]> = {
  RESTAURANT: ["What's on the menu?", 'Are you open now?', 'How do I order?', 'Do you deliver?'],
  CAFE: ["What's on the menu?", 'Are you open now?', 'How do I order?', 'Do you deliver?'],
  RETAIL: ['What products do you have?', 'Are you open now?', 'How do I order?', 'Do you deliver?'],
  GROCERY: ['What products do you have?', 'Are you open now?', 'How do I order?', 'Do you deliver?'],
  SALON: ['What services do you offer?', 'Are you open now?', 'How do I book?', 'What are your prices?'],
  SERVICES: ['What services do you offer?', 'Are you open now?', 'How do I book?', 'What are your prices?'],
  OTHER: ['What do you offer?', 'Are you open now?', 'How do I order?', 'Do you deliver?']
}

const SUGGESTED_QUESTIONS_EL: Record<string, string[]> = {
  RESTAURANT: ['Τι έχετε στο μενού;', 'Είστε ανοιχτά τώρα;', 'Πώς μπορώ να παραγγείλω;', 'Κάνετε διανομή;'],
  CAFE: ['Τι έχετε στο μενού;', 'Είστε ανοιχτά τώρα;', 'Πώς μπορώ να παραγγείλω;', 'Κάνετε διανομή;'],
  RETAIL: ['Τι προϊόντα έχετε;', 'Είστε ανοιχτά τώρα;', 'Πώς μπορώ να παραγγείλω;', 'Κάνετε διανομή;'],
  GROCERY: ['Τι προϊόντα έχετε;', 'Είστε ανοιχτά τώρα;', 'Πώς μπορώ να παραγγείλω;', 'Κάνετε διανομή;'],
  SALON: ['Τι υπηρεσίες προσφέρετε;', 'Είστε ανοιχτά τώρα;', 'Πώς μπορώ να κάνω κράτηση;', 'Ποιες είναι οι τιμές σας;'],
  SERVICES: ['Τι υπηρεσίες προσφέρετε;', 'Είστε ανοιχτά τώρα;', 'Πώς μπορώ να κάνω κράτηση;', 'Ποιες είναι οι τιμές σας;'],
  OTHER: ['Τι προσφέρετε;', 'Είστε ανοιχτά τώρα;', 'Πώς μπορώ να παραγγείλω;', 'Κάνετε διανομή;']
}

const SUGGESTED_QUESTIONS_SQ: Record<string, string[]> = {
  RESTAURANT: ['Çfarë keni në menü?', 'Jeni të hapur tani?', 'Si mund të porosis?', 'A bëni dërgesë?'],
  CAFE: ['Çfarë keni në menü?', 'Jeni të hapur tani?', 'Si mund të porosis?', 'A bëni dërgesë?'],
  RETAIL: ['Çfarë produkte keni?', 'Jeni të hapur tani?', 'Si mund të porosis?', 'A bëni dërgesë?'],
  GROCERY: ['Çfarë produkte keni?', 'Jeni të hapur tani?', 'Si mund të porosis?', 'A bëni dërgesë?'],
  SALON: ['Çfarë shërbimesh ofroni?', 'Jeni të hapur tani?', 'Si mund të rezervoj?', 'Cilat janë çmimet?'],
  SERVICES: ['Çfarë shërbimesh ofroni?', 'Jeni të hapur tani?', 'Si mund të rezervoj?', 'Cilat janë çmimet?'],
  OTHER: ['Çfarë ofroni?', 'Jeni të hapur tani?', 'Si mund të porosis?', 'A bëni dërgesë?']
}

const SUGGESTED_QUESTIONS_ES: Record<string, string[]> = {
  RESTAURANT: ['¿Qué tienen en el menú?', '¿Están abiertos ahora?', '¿Cómo puedo pedir?', '¿Hacen entregas?'],
  CAFE: ['¿Qué tienen en el menú?', '¿Están abiertos ahora?', '¿Cómo puedo pedir?', '¿Hacen entregas?'],
  RETAIL: ['¿Qué productos tienen?', '¿Están abiertos ahora?', '¿Cómo puedo pedir?', '¿Hacen entregas?'],
  GROCERY: ['¿Qué productos tienen?', '¿Están abiertos ahora?', '¿Cómo puedo pedir?', '¿Hacen entregas?'],
  SALON: ['¿Qué servicios ofrecen?', '¿Están abiertos ahora?', '¿Cómo puedo reservar?', '¿Cuáles son los precios?'],
  SERVICES: ['¿Qué servicios ofrecen?', '¿Están abiertos ahora?', '¿Cómo puedo reservar?', '¿Cuáles son los precios?'],
  OTHER: ['¿Qué ofrecen?', '¿Están abiertos ahora?', '¿Cómo puedo pedir?', '¿Hacen entregas?']
}

function getSuggestedQuestions(businessType: string, storefrontLanguage?: string): string[] {
  const lang = storefrontLanguage || 'en'
  const isGreek = lang === 'el' || lang === 'gr'
  const isAlbanian = lang === 'sq' || lang === 'al'
  const isSpanish = lang === 'es'
  const base = SUGGESTED_QUESTIONS_EN[businessType] || SUGGESTED_QUESTIONS_EN.OTHER
  if (isGreek) return SUGGESTED_QUESTIONS_EL[businessType] || SUGGESTED_QUESTIONS_EL.OTHER
  if (isAlbanian) return SUGGESTED_QUESTIONS_SQ[businessType] || SUGGESTED_QUESTIONS_SQ.OTHER
  if (isSpanish) return SUGGESTED_QUESTIONS_ES[businessType] || SUGGESTED_QUESTIONS_ES.OTHER
  return base
}

const SCROLL_THRESHOLD = 800 // Same as scroll-to-top button

const SIZE_CLASSES: Record<AiChatIconSizeType, { button: string; icon: string }> = {
  xs: { button: 'w-9 h-9', icon: 'w-4 h-4' },
  sm: { button: 'w-10 h-10', icon: 'w-5 h-5' },
  medium: { button: 'w-12 h-12', icon: 'w-5 h-5' },
  lg: { button: 'w-14 h-14', icon: 'w-6 h-6' },
  xl: { button: 'w-16 h-16', icon: 'w-7 h-7' }
}

export function AiChatBubble({
  storeSlug,
  storeName,
  primaryColor,
  storefrontLanguage = 'en',
  businessType = 'OTHER',
  aiChatIcon = 'message',
  aiChatIconSize = 'medium',
  aiChatName = 'AI Assistant',
  aiChatPosition = 'left',
  bottomOffset = 'bottom-10'
}: AiChatBubbleProps) {
  const storageKey = `ai-chat-${storeSlug}`

  // Persist chat across refresh (same tab). New tab = fresh session (sessionStorage is per-tab).
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window === 'undefined') return `sess-${Date.now()}`
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.sessionId) return data.sessionId
      }
    } catch {}
    return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}`
  })

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; messageId?: string; feedback?: 'thumbs_up' | 'thumbs_down' }>>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.messages && Array.isArray(data.messages)) return data.messages
      }
    } catch {}
    return []
  })

  const [isOpen, setIsOpen] = useState(false)
  const [showBubble, setShowBubble] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Save to sessionStorage when messages change (persists across refresh)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ sessionId, messages }))
    } catch {}
  }, [sessionId, messages, storageKey])

  const sizeClasses = SIZE_CLASSES[aiChatIconSize]
  const positionClass = aiChatPosition === 'left' ? 'left-5' : 'right-5'

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
      setShowBubble(scrollY > SCROLL_THRESHOLD)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Lock body scroll when modal is open. Use overflow-only (no position:fixed) to avoid
  // keyboard-induced viewport shift when input is focused on mobile.
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // No auto-focus: prevents mobile keyboard/scroll shift when modal opens

  const ChatIcon = aiChatIcon === 'help' ? HelpCircle : aiChatIcon === 'robot' ? Bot : MessageSquare

  const suggestedQuestions = getSuggestedQuestions(businessType, storefrontLanguage)

  const handleFeedback = async (messageIndex: number, feedback: 'thumbs_up' | 'thumbs_down') => {
    const msg = messages[messageIndex]
    if (msg.role !== 'assistant' || !msg.messageId || msg.feedback) return
    setMessages(prev => prev.map((m, i) => i === messageIndex ? { ...m, feedback } : m))
    try {
      await fetch(`/api/storefront/${storeSlug}/ai-chat-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.messageId, feedback })
      })
    } catch {
      setMessages(prev => prev.map((m, i) => i === messageIndex ? { ...m, feedback: undefined } : m))
    }
  }

  const handleSend = async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return

    setInput('')
    const userMessage = { role: 'user' as const, content }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const res = await fetch(`/api/storefront/${storeSlug}/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          sessionId
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Sorry, something went wrong.' }])
        return
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply, messageId: data.messageId }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not connect. Please try again.' }] as any)
    } finally {
      setLoading(false)
    }
  }

  const welcomeText = storefrontLanguage === 'el'
    ? `Γεια σας! Είμαι ο βοηθός AI για το ${storeName}. Ρωτήστε με για προϊόντα, ώρες λειτουργίας ή πώς να παραγγείλετε.`
    : storefrontLanguage === 'sq' || storefrontLanguage === 'al'
      ? `Përshëndetje! Unë jam asistenti AI për ${storeName}. Më pyesni për produkte, oraret ose si të porosisni.`
      : storefrontLanguage === 'es'
        ? `¡Hola! Soy el asistente de IA de ${storeName}. Pregúntame sobre productos, horarios o cómo pedir.`
        : `Hi! I'm the AI assistant for ${storeName}. Ask me about our products, hours, or how to order.`

  const poweredByText = storefrontLanguage === 'el'
    ? 'Με την υποστήριξη της WaveOrder'
    : storefrontLanguage === 'sq' || storefrontLanguage === 'al'
      ? 'Mundësuar nga WaveOrder'
      : storefrontLanguage === 'es'
        ? 'Desarrollado por WaveOrder'
        : 'Powered by WaveOrder'

  return (
    <>
      {/* Chat bubble button - only visible after scroll (same threshold as scroll-to-top) */}
      {showBubble && (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${bottomOffset} ${positionClass} z-[45] ${sizeClasses.button} rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105`}
        style={{ backgroundColor: primaryColor }}
        aria-label={`Chat with ${aiChatName}`}
      >
        <ChatIcon className={`${sizeClasses.icon} text-white`} />
        {messages.length > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"
            aria-hidden
          />
        )}
      </button>
      )}

      {/* Chat modal - same pattern as product modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[50] flex items-start justify-center overflow-y-auto pt-4 pb-4"
          onClick={() => setIsOpen(false)}
          aria-label={`${aiChatName} chat modal backdrop`}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md h-[500px] max-h-[85dvh] flex flex-col overflow-hidden shadow-xl border border-gray-200 shrink-0"
            onClick={e => e.stopPropagation()}
            aria-label={`${aiChatName} chat panel`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 rounded-t-2xl flex-shrink-0">
              <h3 className="font-semibold text-gray-900">{aiChatName}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            <div className="text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-2 max-w-[85%]">
              {welcomeText}
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-xs px-3 py-2 rounded-full border border-gray-300 hover:border-gray-400 text-gray-700 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                  style={m.role === 'user' ? { backgroundColor: primaryColor } : {}}
                >
                  {m.content}
                </div>
                {m.role === 'assistant' && m.messageId && (
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => handleFeedback(i, 'thumbs_up')}
                      disabled={!!m.feedback}
                      className={`p-1 rounded transition-colors ${
                        m.feedback === 'thumbs_up' ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
                      } disabled:opacity-70`}
                      aria-label="Helpful"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(i, 'thumbs_down')}
                      disabled={!!m.feedback}
                      className={`p-1 rounded transition-colors ${
                        m.feedback === 'thumbs_down' ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
                      } disabled:opacity-70`}
                      aria-label="Not helpful"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2 flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 rounded-b-2xl flex-shrink-0">
              <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={storefrontLanguage === 'el' ? 'Γράψτε την ερώτησή σας...' : storefrontLanguage === 'sq' ? 'Shkruani pyetjen tuaj...' : 'Type your question...'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                maxLength={500}
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="p-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: primaryColor }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">{poweredByText}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
