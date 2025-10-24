// src/components/superadmin/support/SuperAdminMessageThread.tsx
'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Send, User, Building2, Clock, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    name: string
    email: string
  }
  isRead: boolean
}

interface MessageThread {
  threadId: string
  subject: string
  business: {
    id: string
    name: string
  }
  participants: {
    id: string
    name: string
    email: string
  }[]
  messages: Message[]
  unreadCount: number
}

interface SuperAdminMessageThreadProps {
  threadId: string
}

export function SuperAdminMessageThread({ threadId }: SuperAdminMessageThreadProps) {
  const [thread, setThread] = useState<MessageThread | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    fetchThread()
  }, [threadId])

  const fetchThread = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/superadmin/support/messages/${threadId}`)
      if (response.ok) {
        const data = await response.json()
        setThread(data.thread)
        
        // Mark messages as read after fetching
        await markMessagesAsRead()
      }
    } catch (error) {
      console.error('Failed to fetch message thread:', error)
    } finally {
      setLoading(false)
    }
  }

  const markMessagesAsRead = async () => {
    try {
      await fetch(`/api/superadmin/support/messages/${threadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAsRead: true })
      })
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const response = await fetch(`/api/superadmin/support/messages/${threadId}/reply`, {
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
        setThread(prev => prev ? {
          ...prev,
          messages: [...prev.messages, data.message],
          unreadCount: 0
        } : null)
        setNewMessage('')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    const diffInHours = diffInMinutes / 60
    
    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)} minutes ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Thread not found</h3>
        <p className="text-gray-600 mb-6">This message thread could not be found.</p>
        <button
          onClick={() => router.push('/superadmin/support/messages')}
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Messages
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.push('/superadmin/support/messages')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{thread.subject || 'No Subject'}</h1>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Building2 className="w-4 h-4 mr-1" />
              {thread.business.name}
            </div>
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-1" />
              {thread.messages.length} message{thread.messages.length !== 1 ? 's' : ''}
            </div>
            {thread.unreadCount > 0 && (
              <div className="flex items-center text-teal-600">
                <div className="w-2 h-2 bg-teal-500 rounded-full mr-1"></div>
                {thread.unreadCount} unread
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto scrollbar-hide">
          {thread.messages.map((message) => (
            <div key={message.id} className="flex space-x-3">
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-teal-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {message.sender.name}
                    {message.sender.id === session?.user?.id && ' (You)'}
                  </span>
                  <span className="text-xs text-gray-500">{message.sender.email}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(message.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Form */}
        <div className="border-t border-gray-200 p-6">
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Reply to this conversation
              </label>
              <textarea
                id="message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
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
