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
  }, [businessId])

  const fetchThreads = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stores/${businessId}/support/messages`)
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
    thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return 'Just now'
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">
            Communicate with our support team directly.
          </p>
        </div>
        <button
          onClick={() => setShowComposeModal(true)}
          className="mt-4 lg:mt-0 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        />
      </div>

      {/* Threads List */}
      {filteredThreads.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? 'No messages match your search.'
              : 'You haven\'t sent any messages to support yet.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowComposeModal(true)}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Send Your First Message
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredThreads.map((thread) => (
            <div
              key={thread.threadId}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/admin/stores/${businessId}/support/messages/${thread.threadId}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {thread.subject}
                    </h3>
                    {thread.unreadCount > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        {thread.unreadCount} new
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {thread.lastMessage.content}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {thread.lastMessage.sender.name}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(thread.lastMessage.createdAt)}
                    </span>
                    <span>{thread.totalMessages} message{thread.totalMessages !== 1 ? 's' : ''}</span>
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
