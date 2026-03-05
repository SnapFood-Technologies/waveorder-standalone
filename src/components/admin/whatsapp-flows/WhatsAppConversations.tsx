'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Loader2,
  Send,
  MessageSquare,
  Phone,
  AlertCircle,
  ChevronLeft
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface Conversation {
  id: string
  customerPhone: string
  customerName: string | null
  lastMessageAt: string
  lastMessageBy: string
  isRead: boolean
  status: string
  messages: Array<{
    body: string | null
    messageType: string
    sender: string
    createdAt: string
  }>
}

interface Message {
  id: string
  direction: string
  sender: string
  messageType: string
  body: string | null
  mediaUrl: string | null
  createdAt: string
}

interface WhatsAppConversationsProps {
  businessId: string
}

export function WhatsAppConversations({ businessId }: WhatsAppConversationsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (search.trim()) params.set('search', search.trim())
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/conversations?${params}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to load conversations')
      }
      const data = await res.json()
      setConversations(data.conversations)
      setPagination(data.pagination)
      if (selectedConversation) {
        const stillSelected = data.conversations.find((c: Conversation) => c.id === selectedConversation.id)
        if (!stillSelected) setSelectedConversation(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [businessId, page, search, selectedConversation])

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setMessagesLoading(true)
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/conversations/${conversationId}`)
      if (!res.ok) throw new Error('Failed to load messages')
      const data = await res.json()
      setMessages(data.conversation?.messages || [])
      // Mark as read
      await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })
      fetchConversations()
    } catch (err) {
      toast.error('Failed to load messages')
    } finally {
      setMessagesLoading(false)
    }
  }, [businessId, fetchConversations])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    } else {
      setMessages([])
    }
  }, [selectedConversation?.id, fetchMessages])

  const handleSendReply = async () => {
    if (!selectedConversation || !replyText.trim()) return
    try {
      setSending(true)
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/conversations/${selectedConversation.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to send')
      setReplyText('')
      toast.success('Message sent')
      fetchMessages(selectedConversation.id)
      fetchConversations()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Conversations</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            View and reply to WhatsApp messages from customers
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col lg:flex-row" style={{ minHeight: 'min(600px, 80vh)' }}>
        {/* Left panel - conversation list (hidden on mobile when thread is shown) */}
        <div className={`lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => fetchConversations()}
              className="mt-2 text-sm text-teal-600 hover:text-teal-700"
            >
              Search
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Messages will appear here when customers message your WhatsApp</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-teal-50 border-l-4 border-l-teal-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {conv.customerName || conv.customerPhone}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conv.messages[0]?.body || 'No messages'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!conv.isRead && (
                      <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel - message thread */}
        <div className={`flex-1 flex flex-col min-w-0 ${selectedConversation ? 'flex' : 'hidden lg:flex'}`}>
          {selectedConversation ? (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-200 text-gray-600"
                  aria-label="Back to conversations"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {selectedConversation.customerName || selectedConversation.customerPhone}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{selectedConversation.customerPhone}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messagesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === 'inbound' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.direction === 'inbound'
                            ? 'bg-gray-200 text-gray-900'
                            : 'bg-teal-600 text-white'
                        }`}
                      >
                        {(msg.sender === 'flow' || msg.sender === 'ai') && (
                          <span className="text-xs opacity-75 mr-1">{msg.sender === 'ai' ? 'AI' : 'Flow'}</span>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{msg.body || '[Media]'}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.direction === 'inbound' ? 'text-gray-500' : 'text-teal-100'
                          }`}
                        >
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                    placeholder="Type your reply..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                    className="inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Reply within 24 hours of the customer&apos;s last message. Outside this window, only templates work.
                </p>
              </div>
            </>
          ) : (
            <div className="hidden lg:flex flex-1 items-center justify-center text-gray-500 p-8">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p>Select a conversation to view and reply</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
