'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  MessageSquare,
  Loader2,
  AlertCircle,
  BarChart3,
  HelpCircle,
  Calendar,
  Settings,
  Bot,
  Zap
} from 'lucide-react'

interface Message {
  id: string
  role: string
  content: string
  sessionId: string | null
  createdAt: string
}

// Group messages by session, sorted by most recent conversation first
function groupMessagesBySession(messages: Message[]): { sessionId: string; messages: Message[] }[] {
  const bySession = new Map<string, Message[]>()
  for (const m of messages) {
    const key = m.sessionId || `anon-${m.id}`
    if (!bySession.has(key)) bySession.set(key, [])
    bySession.get(key)!.push(m)
  }
  return Array.from(bySession.entries())
    .map(([sessionId, msgs]) => ({
      sessionId,
      messages: msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }))
    .sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1]?.createdAt || ''
      const bLast = b.messages[b.messages.length - 1]?.createdAt || ''
      return new Date(bLast).getTime() - new Date(aLast).getTime()
    })
}

interface TopQuestion {
  question: string
  count: number
}

interface AiChatData {
  messages: Message[]
  totalCount: number
  page: number
  limit: number
  period: string
  summary: {
    totalMessages: number
    totalUserMessages: number
    totalConversations: number
    topQuestions: TopQuestion[]
  }
  dateRange: { start: string; end: string }
}

export default function SuperAdminAiUsagePage() {
  const params = useParams()
  const businessId = params.businessId as string
  const [data, setData] = useState<AiChatData | null>(null)
  const [businessName, setBusinessName] = useState<string>('')
  const [chatConfig, setChatConfig] = useState<{
    aiChatIcon: string
    aiChatIconSize: string
    aiChatName: string
    aiChatPosition: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/superadmin/businesses/${businessId}/ai-usage?period=${period}&limit=50`)
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.message || 'Failed to load')
        }

        if (!json.enabled) {
          setEnabled(false)
          setError('AI Store Assistant is not enabled for this business.')
          setData(null)
          setBusinessName(json.business?.name || '')
          return
        }

        setBusinessName(json.business?.name || '')
        setChatConfig(json.business?.chatConfig || null)
        setData(json.data)
      } catch (err: any) {
        setError(err.message || 'Failed to load AI chat data')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [businessId, period])

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!enabled || error) {
    return (
      <div className="space-y-6 px-2 sm:px-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/superadmin/businesses/${businessId}`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">AI Chat Usage</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">AI Store Assistant Not Enabled</h3>
            <p className="text-amber-800 mt-1">{error}</p>
            <Link
              href={`/superadmin/businesses/${businessId}/custom-features`}
              className="inline-block mt-2 text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Enable in Custom Features →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/superadmin/businesses/${businessId}`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Chat Usage</h1>
            <p className="text-sm text-gray-600 mt-1">
              {businessName} — Questions customers ask and AI responses
            </p>
          </div>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 days</option>
          <option value="month">This month</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary.totalMessages ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Customer Questions</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary.totalUserMessages ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary.totalConversations ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat widget configuration */}
      {chatConfig && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-teal-600" />
              Chat Widget Configuration
            </h2>
            <p className="text-sm text-gray-600 mt-1">Settings the store has chosen for their AI assistant</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Chat name</p>
                  <p className="text-sm font-medium text-gray-900">{chatConfig.aiChatName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {chatConfig.aiChatIcon === 'robot' ? (
                    <Bot className="w-4 h-4 text-blue-600" />
                  ) : chatConfig.aiChatIcon === 'help' ? (
                    <HelpCircle className="w-4 h-4 text-blue-600" />
                  ) : (
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Icon</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">{chatConfig.aiChatIcon}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Icon size</p>
                  <p className="text-sm font-medium text-gray-900">
                    {chatConfig.aiChatIconSize === 'xs' ? 'Extra small' :
                     chatConfig.aiChatIconSize === 'sm' ? 'Small' :
                     chatConfig.aiChatIconSize === 'medium' ? 'Medium' :
                     chatConfig.aiChatIconSize === 'lg' ? 'Large' : 'Extra large'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Settings className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Position</p>
                  <p className="text-sm font-medium text-gray-900">
                    {chatConfig.aiChatPosition === 'left' ? 'Bottom left' : 'Bottom right'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top questions */}
      {data?.summary.topQuestions && data.summary.topQuestions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Most Asked Questions</h2>
            <p className="text-sm text-gray-600 mt-1">What customers are asking the AI assistant</p>
          </div>
          <div className="divide-y divide-gray-200">
            {data.summary.topQuestions.map((q, i) => (
              <div key={i} className="px-6 py-3 flex items-center justify-between">
                <p className="text-sm text-gray-900 truncate flex-1 mr-4">{q.question}</p>
                <span className="text-sm font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded">
                  {q.count}×
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message history - grouped by session */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Chat History</h2>
          <p className="text-sm text-gray-600 mt-1">Conversations grouped by session</p>
        </div>
        <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
          {data?.messages && data.messages.length > 0 ? (
            groupMessagesBySession(data.messages).map((session, idx) => (
              <div key={session.sessionId} className="border-b border-gray-100 last:border-b-0">
                <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
                  Conversation {idx + 1} • Started {session.messages[0] ? formatDate(session.messages[0].createdAt) : '—'}
                </div>
                {session.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`px-6 py-3 ${m.role === 'user' ? 'bg-gray-50' : 'bg-white'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          m.role === 'user' ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {m.role === 'user' ? 'Customer' : 'AI'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{m.content}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No chat messages yet in this period</p>
              <p className="text-sm mt-1">Messages will appear when customers use the AI assistant on the storefront</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
