// src/components/admin/support/MessageThreadList.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, MessageSquare, Clock, User, Search } from 'lucide-react'
import { ComposeMessageModal } from './ComposeMessageModal'

interface MessageThread {
  threadId: string
  subject: string
  lastMessage: {
    content: string
    createdAt: string
    sender: {
      id: string
      name: string
    }
  }
  unreadCount: number
  totalMessages: number
  business: {
    id: string
    name: string
  }
}

interface MessageThreadListProps {
  businessId: string
}

export function MessageThreadList({ businessId }: MessageThreadListProps) {
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [loading, setLoading] = useState(true)
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchThreads()
    
    // Refresh threads when user returns to the page (e.g., from a thread)
    const handleFocus = () => {
      fetchThreads()
    }
    
    const handlePageShow = (event: PageTransitionEvent) => {
      // Refresh when user navigates back (including from thread page)
      if (event.persisted || document.visibilityState === 'visible') {
        fetchThreads()
      }
    }
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchThreads()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [businessId])

  const fetchThreads = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stores/${businessId}/support/messages?t=${Date.now()}`, {
        cache: 'no-store'
      })
      if (response.ok) {
        const data = await response.json()
        setThreads(data.threads || [])
      }
    } catch (error) {
      console.error('Failed to fetch message threads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMessageSent = (newThread: MessageThread) => {
    setThreads(prev => [newThread, ...prev])
    setShowComposeModal(false)
  }

  const filteredThreads = threads.filter(thread =>
    (thread.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (thread.lastMessage.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-6 border border-teal-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="w-6 h-6 mr-3 text-teal-600" />
              Messages
            </h1>
            <p className="text-gray-600 mt-1">
              Communicate with our support team directly.
            </p>
          </div>
          <button
            onClick={() => setShowComposeModal(true)}
            className="mt-4 lg:mt-0 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
        />
      </div>

      {/* Threads List */}
      {filteredThreads.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No messages found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery
              ? 'No messages match your search criteria. Try adjusting your search terms.'
              : 'You haven\'t started any conversations with our support team yet. Get help with your WaveOrder store by sending a message.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={() => setShowComposeModal(true)}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Start Your First Conversation
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredThreads.map((thread) => (
            <div
              key={thread.threadId}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-teal-200 transition-all duration-200 cursor-pointer group"
              onClick={async () => {
                // Mark messages as read before navigating
                if (thread.unreadCount > 0) {
                  try {
                    await fetch(`/api/admin/stores/${businessId}/support/messages/${thread.threadId}`, {
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
                window.location.href = `/admin/stores/${businessId}/support/messages/${thread.threadId}`
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-teal-700 transition-colors">
                      {thread.subject || 'No Subject'}
                    </h3>
                    {thread.unreadCount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 animate-pulse">
                        {thread.unreadCount} new
                      </span>
                    )}
                  </div>
                  
                  {/* Most Recent Message */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 border-l-4 border-teal-200">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-teal-600 uppercase tracking-wide">
                        Most Recent Message
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(thread.lastMessage.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {thread.lastMessage.content}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <User className="w-3 h-3 mr-1" />
                      From {thread.lastMessage.sender.name}
                    </div>
                  </div>
                  
                  {/* Thread Stats */}
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center bg-gray-100 px-2 py-1 rounded-md">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {thread.totalMessages} message{thread.totalMessages !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center bg-gray-100 px-2 py-1 rounded-md">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(thread.lastMessage.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compose Message Modal */}
      {showComposeModal && (
        <ComposeMessageModal
          businessId={businessId}
          onClose={() => setShowComposeModal(false)}
          onMessageSent={handleMessageSent}
        />
      )}
    </div>
  )
}
