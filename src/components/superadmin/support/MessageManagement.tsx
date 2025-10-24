// src/components/superadmin/support/MessageManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, MessageSquare, Clock, User, Building2 } from 'lucide-react'
import { InitiateMessageModal } from './InitiateMessageModal'

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
  participants: {
    id: string
    name: string
    email: string
  }[]
}

export function MessageManagement() {
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [loading, setLoading] = useState(true)
  const [showInitiateModal, setShowInitiateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [businessFilter, setBusinessFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchThreads()
  }, [])

  const fetchThreads = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/superadmin/support/messages')
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

  const handleMessageInitiated = (newThread: MessageThread) => {
    setThreads(prev => [newThread, ...prev])
    setShowInitiateModal(false)
  }

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

  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thread.lastMessage.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thread.business.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesBusiness = businessFilter === 'all' || thread.business.id === businessFilter
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'unread' && thread.unreadCount > 0) ||
                         (statusFilter === 'read' && thread.unreadCount === 0)

    return matchesSearch && matchesBusiness && matchesStatus
  })

  const uniqueBusinesses = Array.from(new Set(threads.map(t => t.business.id)))
    .map(id => threads.find(t => t.business.id === id)?.business)
    .filter(Boolean)

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
            Manage communication with business administrators.
          </p>
        </div>
        <button
          onClick={() => setShowInitiateModal(true)}
          className="mt-4 lg:mt-0 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Message
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Threads</p>
              <p className="text-2xl font-bold text-gray-900">{threads.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-gray-900">
                {threads.reduce((sum, thread) => sum + thread.unreadCount, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Businesses</p>
              <p className="text-2xl font-bold text-gray-900">{uniqueBusinesses.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={businessFilter}
              onChange={(e) => setBusinessFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Businesses</option>
              {uniqueBusinesses.map((business) => (
                <option key={business!.id} value={business!.id}>
                  {business!.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
        </div>
      </div>

      {/* Threads List */}
      {filteredThreads.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No messages found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery || businessFilter !== 'all' || statusFilter !== 'all'
              ? 'No messages match your current filters. Try adjusting your search criteria.'
              : 'No message threads have been created yet. Start a conversation with a business administrator.'}
          </p>
          {searchQuery || businessFilter !== 'all' || statusFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('')
                setBusinessFilter('all')
                setStatusFilter('all')
              }}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors mr-3"
            >
              Clear Filters
            </button>
          ) : null}
          {(!searchQuery && businessFilter === 'all' && statusFilter === 'all') && (
            <button
              onClick={() => setShowInitiateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Start First Conversation
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredThreads.map((thread) => (
            <div
              key={thread.threadId}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/superadmin/support/messages/${thread.threadId}`}
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
                      <Building2 className="w-4 h-4 mr-1" />
                      {thread.business.name}
                    </span>
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

      {/* Initiate Message Modal */}
      {showInitiateModal && (
        <InitiateMessageModal
          onClose={() => setShowInitiateModal(false)}
          onMessageInitiated={handleMessageInitiated}
        />
      )}
    </div>
  )
}
