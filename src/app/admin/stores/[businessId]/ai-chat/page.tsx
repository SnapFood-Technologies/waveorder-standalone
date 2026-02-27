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
  X,
  Bot,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Message {
  id: string
  role: string
  content: string
  sessionId: string | null
  feedback?: 'thumbs_up' | 'thumbs_down' | null
  createdAt: string
}

// Group messages by session. Conversations sorted by LATEST first (Conversation 1 = most recent).
// Messages within each conversation sorted chronologically (user question before AI response).
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
      messages: msgs.sort((a, b) => {
        const ta = new Date(a.createdAt).getTime()
        const tb = new Date(b.createdAt).getTime()
        if (ta !== tb) return ta - tb
        return a.role === 'user' ? -1 : b.role === 'user' ? 1 : 0
      })
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
    thumbsUp?: number
    thumbsDown?: number
  }
  dateRange: { start: string; end: string }
}

type AiChatIcon = 'message' | 'help' | 'robot'
type AiChatIconSize = 'xs' | 'sm' | 'medium' | 'lg' | 'xl'
type AiChatPosition = 'left' | 'right'

interface AiChatSettings {
  aiChatIcon: AiChatIcon
  aiChatIconSize: AiChatIconSize
  aiChatName: string
  aiChatPosition: AiChatPosition
}

export default function AiChatPage() {
  const params = useParams()
  const businessId = params.businessId as string
  const [data, setData] = useState<AiChatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(true)
  const [period, setPeriod] = useState('month')
  const [showCustomizeModal, setShowCustomizeModal] = useState(false)
  const [settings, setSettings] = useState<AiChatSettings>({
    aiChatIcon: 'message',
    aiChatIconSize: 'medium',
    aiChatName: 'AI Assistant',
    aiChatPosition: 'left'
  })
  const [savingSettings, setSavingSettings] = useState(false)
  // Set of session IDs that are collapsed (empty = all expanded by default)
  const [collapsedSessions, setCollapsedSessions] = useState<Set<string>>(new Set())

  const toggleSession = (sessionId: string) => {
    setCollapsedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(sessionId)) next.delete(sessionId)
      else next.add(sessionId)
      return next
    })
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/ai-chat-settings`)
      if (res.ok) {
        const json = await res.json()
        setSettings({
          aiChatIcon: json.aiChatIcon || 'message',
          aiChatIconSize: json.aiChatIconSize || 'medium',
          aiChatName: json.aiChatName || 'AI Assistant',
          aiChatPosition: json.aiChatPosition || 'left'
        })
      }
    } catch {
      // Ignore - use defaults
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/admin/stores/${businessId}/ai-chat?period=${period}&limit=50`)
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.message || 'Failed to load')
        }

        if (!json.enabled) {
          setEnabled(false)
          setError(json.message)
          setData(null)
          return
        }

        setData(json.data)
        if (json.enabled) fetchSettings()
      } catch (err: any) {
        setError(err.message || 'Failed to load AI chat data')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [businessId, period])

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/ai-chat-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      toast.success('Chat settings saved')
      setShowCustomizeModal(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

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
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/stores/${businessId}/analytics`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">AI Chat Analytics</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">AI Store Assistant Not Enabled</h3>
            <p className="text-amber-800 mt-1">{error || 'This feature is not enabled for your business. Contact support to enable it.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/stores/${businessId}/analytics`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Chat Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">Questions customers ask and AI responses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchSettings(); setShowCustomizeModal(true) }}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-teal-500"
          >
            <Settings className="w-4 h-4" />
            Customize Chat
          </button>
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
      </div>

      {/* Customize Chat Modal */}
      {showCustomizeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCustomizeModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Customize Chat Widget</h2>
              <button onClick={() => setShowCustomizeModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Chat name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chat name</label>
                <input
                  type="text"
                  value={settings.aiChatName}
                  onChange={e => setSettings(s => ({ ...s, aiChatName: e.target.value }))}
                  placeholder="AI Assistant"
                  maxLength={50}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              {/* Icon type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                <div className="flex gap-2">
                  {(['message', 'help', 'robot'] as const).map(icon => (
                    <button
                      key={icon}
                      onClick={() => setSettings(s => ({ ...s, aiChatIcon: icon }))}
                      className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                        settings.aiChatIcon === icon ? 'border-teal-600 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {icon === 'message' && <MessageSquare className="w-6 h-6 text-gray-600" />}
                      {icon === 'help' && <HelpCircle className="w-6 h-6 text-gray-600" />}
                      {icon === 'robot' && <Bot className="w-6 h-6 text-gray-600" />}
                      <span className="text-xs font-medium capitalize">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Icon size</label>
                <select
                  value={settings.aiChatIconSize}
                  onChange={e => setSettings(s => ({ ...s, aiChatIconSize: e.target.value as AiChatIconSize }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="xs">Extra small</option>
                  <option value="sm">Small</option>
                  <option value="medium">Medium (default, same as scroll-to-top)</option>
                  <option value="lg">Large</option>
                  <option value="xl">Extra large</option>
                </select>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <select
                  value={settings.aiChatPosition}
                  onChange={e => setSettings(s => ({ ...s, aiChatPosition: e.target.value as AiChatPosition }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="left">Bottom left</option>
                  <option value="right">Bottom right</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowCustomizeModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-50"
              >
                {savingSettings ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ThumbsUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Thumbs up</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary.thumbsUp ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ThumbsDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Thumbs down</p>
              <p className="text-2xl font-bold text-gray-900">{data?.summary.thumbsDown ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

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
            groupMessagesBySession(data.messages).map((session, idx) => {
              const isExpanded = !collapsedSessions.has(session.sessionId)
              return (
                <div key={session.sessionId} className="border-b border-gray-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => toggleSession(session.sessionId)}
                    className="w-full px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 hover:bg-gray-100 flex items-center justify-between gap-2"
                  >
                    <span>
                      Conversation {idx + 1} • Started {session.messages[0] ? formatDate(session.messages[0].createdAt) : '—'} • {session.messages.length} messages
                    </span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                  </button>
                  {isExpanded && session.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`px-6 py-3 border-l-2 ${m.role === 'user' ? 'bg-gray-50 border-l-teal-200' : 'bg-white border-l-gray-200'}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${
                            m.role === 'user' ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {m.role === 'user' ? 'Customer' : 'AI'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{m.content}</p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(m.createdAt)}
                            </p>
                            {m.role === 'assistant' && m.feedback && (
                              <span className="text-xs flex items-center gap-1">
                                {m.feedback === 'thumbs_up' ? (
                                  <ThumbsUp className="w-3.5 h-3.5 text-green-600" />
                                ) : (
                                  <ThumbsDown className="w-3.5 h-3.5 text-red-600" />
                                )}
                                <span className="text-gray-500">{m.feedback === 'thumbs_up' ? 'Helpful' : 'Not helpful'}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No chat messages yet in this period</p>
              <p className="text-sm mt-1">Messages will appear when customers use the AI assistant on your storefront</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
