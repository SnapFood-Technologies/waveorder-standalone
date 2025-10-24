// src/components/admin/support/MessageThread.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, User, Clock, MessageSquare } from 'lucide-react'

interface Message {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    name: string
    email: string
  }
  recipient: {
    id: string
    name: string
    email: string
  }
  isRead: boolean
}

interface MessageThreadProps {
  businessId: string
  threadId: string
}

export function MessageThread({ businessId, threadId }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [threadInfo, setThreadInfo] = useState<{
    subject: string
    business: { id: string; name: string }
  } | null>(null)

  useEffect(() => {
    fetchThread()
  }, [businessId, threadId])

  const fetchThread = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stores/${businessId}/support/messages/${threadId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setThreadInfo(data.threadInfo)
      }
    } catch (error) {
      console.error('Failed to fetch message thread:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/support/messages/${threadId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim()
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, data.message])
        setNewMessage('')
        fetchThread() // Refresh to get updated read status
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isCurrentUser = (senderId: string) => {
    // This would need to be passed from the parent or fetched
    // For now, we'll assume the current user is the one with the most recent message
    return messages.length > 0 && messages[messages.length - 1].sender.id === senderId
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href={`/admin/stores/${businessId}/support/messages`}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {threadInfo?.subject || 'Message Thread'}
          </h1>
          <p className="text-gray-600">
            {threadInfo?.business.name && `Business: ${threadInfo.business.name}`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white border border-gray-200 rounded-lg">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-600">This conversation hasn't started yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {messages.map((message) => (
              <div key={message.id} className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {message.sender.name}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply Form */}
        <div className="border-t border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Reply
              </label>
              <textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Type your message here..."
                required
              />
            </div>
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting || !newMessage.trim()}
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
