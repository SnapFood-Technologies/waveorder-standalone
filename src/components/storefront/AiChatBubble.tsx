'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Minus, Send, Loader2 } from 'lucide-react'

interface AiChatBubbleProps {
  storeSlug: string
  storeName: string
  primaryColor: string
  storefrontLanguage?: string
  businessType?: string
}

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  RESTAURANT: ["What's on the menu?", 'Are you open now?', 'How do I order?', 'Do you deliver?'],
  CAFE: ["What's on the menu?", 'Are you open now?', 'How do I order?', 'Do you deliver?'],
  RETAIL: ['What products do you have?', 'Are you open now?', 'How do I order?', 'Do you deliver?'],
  GROCERY: ['What products do you have?', 'Are you open now?', 'How do I order?', 'Do you deliver?'],
  SALON: ['What services do you offer?', 'Are you open now?', 'How do I book?', 'What are your prices?'],
  SERVICES: ['What services do you offer?', 'Are you open now?', 'How do I book?', 'What are your prices?'],
  OTHER: ['What do you offer?', 'Are you open now?', 'How do I order?', 'Do you deliver?']
}

export function AiChatBubble({ storeSlug, storeName, primaryColor, storefrontLanguage = 'en', businessType = 'OTHER' }: AiChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}`)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const suggestedQuestions = SUGGESTED_QUESTIONS[businessType] || SUGGESTED_QUESTIONS.OTHER

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

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not connect. Please try again.' }])
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

  return (
    <>
      {/* Chat bubble button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-5 z-[45] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 md:w-14 md:h-14"
        style={{ backgroundColor: primaryColor }}
        aria-label="Chat with store assistant"
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 left-5 z-[50] w-[380px] max-w-[calc(100vw-2.5rem)] h-[500px] max-h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200"
          aria-label="AI Assistant chat panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 rounded-t-2xl">
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Minimize"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                  style={m.role === 'user' ? { backgroundColor: primaryColor } : {}}
                >
                  {m.content}
                </div>
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
          <div className="p-4 border-t border-gray-200 rounded-b-2xl">
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
            <p className="text-xs text-gray-400 mt-2">Powered by WaveOrder</p>
          </div>
        </div>
      )}
    </>
  )
}
