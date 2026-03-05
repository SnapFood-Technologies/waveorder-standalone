'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Loader2,
  Send,
  MessageSquare,
  Phone,
  AlertCircle,
  ChevronLeft,
  UserPlus,
  StickyNote,
  FileText,
  Users,
  BarChart3,
  Zap
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
  assignedTo?: string | null
  priority?: string
  assignedToUser?: { id: string; name: string | null; email: string } | null
  slaWaitingMinutes?: number | null
  slaBreached?: boolean
  notes?: Array<{ id: string; body: string; authorId: string; createdAt: string }>
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
  const [teamMembers, setTeamMembers] = useState<Array<{ userId: string; name: string }>>([])
  const [cannedResponses, setCannedResponses] = useState<Array<{ id: string; title: string; body: string; shortcut?: string }>>([])
  const [notes, setNotes] = useState<Array<{ id: string; body: string; authorId: string; createdAt: string }>>([])
  const [noteInput, setNoteInput] = useState('')
  const [addingNote, setAddingNote] = useState(false)
  const [updatingMeta, setUpdatingMeta] = useState(false)
  const [view, setView] = useState<'all' | 'mine' | 'unassigned'>('all')
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  const [agentMetrics, setAgentMetrics] = useState<Array<{ userId: string; name: string; assigned: number; resolved: number; resolutionRate: number; avgResponseMinutes: number | null }>>([])
  const [showMetrics, setShowMetrics] = useState(false)

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (search.trim()) params.set('search', search.trim())
      if (view !== 'all') params.set('view', view)
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
  }, [businessId, page, search, view, selectedConversation])

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      setMessagesLoading(true)
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/conversations/${conversationId}`)
      if (!res.ok) throw new Error('Failed to load messages')
      const data = await res.json()
      setMessages(data.conversation?.messages || [])
      setNotes(data.conversation?.notes || [])
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
    const heartbeat = () => fetch(`/api/admin/stores/${businessId}/whatsapp-flows/presence`, { method: 'POST' }).catch(() => {})
    heartbeat()
    const id = setInterval(heartbeat, 60 * 1000)
    return () => clearInterval(id)
  }, [businessId])

  useEffect(() => {
    const load = () => fetch(`/api/admin/stores/${businessId}/whatsapp-flows/presence`)
      .then((r) => r.ok ? r.json() : { online: [] })
      .then((d) => setOnlineUserIds(new Set((d.online || []).map((o: { userId: string }) => o.userId))))
      .catch(() => {})
    load()
    const id = setInterval(load, 30 * 1000)
    return () => clearInterval(id)
  }, [businessId])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
    } else {
      setMessages([])
      setNotes([])
    }
  }, [selectedConversation?.id, fetchMessages])

  useEffect(() => {
    if (selectedConversation) {
      Promise.all([
        fetch(`/api/admin/stores/${businessId}/whatsapp-flows/agents`).then((r) => r.ok ? r.json() : { agents: [] }),
        fetch(`/api/admin/stores/${businessId}/whatsapp-flows/canned-responses`).then((r) => r.ok ? r.json() : { responses: [] })
      ]).then(([agentsData, cannedData]) => {
        setTeamMembers((agentsData.agents || []).map((m: { userId: string; name: string }) => ({ userId: m.userId, name: m.name })))
        setCannedResponses(cannedData.responses || [])
      })
    }
  }, [businessId, selectedConversation?.id])

  const handleAssign = async (userId: string | null) => {
    if (!selectedConversation) return
    try {
      setUpdatingMeta(true)
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/conversations/${selectedConversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: userId })
      })
      if (!res.ok) throw new Error('Failed to assign')
      await fetchConversations()
      const updated = (await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/conversations/${selectedConversation.id}`).then((r) => r.json())).conversation
      if (updated) setSelectedConversation((p) => (p ? { ...p, assignedTo: updated.assignedTo, assignedToUser: updated.assignedToUser } : p))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setUpdatingMeta(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!selectedConversation) return
    try {
      setUpdatingMeta(true)
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/conversations/${selectedConversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update')
      await fetchConversations()
      setSelectedConversation((p) => (p ? { ...p, status } : p))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setUpdatingMeta(false)
    }
  }

  const handleAddNote = async () => {
    if (!selectedConversation || !noteInput.trim()) return
    try {
      setAddingNote(true)
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/conversations/${selectedConversation.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: noteInput.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      setNotes((n) => [...n, data.note])
      setNoteInput('')
      toast.success('Note added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setAddingNote(false)
    }
  }

  const handleInsertCanned = (body: string) => {
    setReplyText((t) => t + (t ? '\n' : '') + body)
  }

  const handleAutoAssign = async () => {
    if (!selectedConversation) return
    try {
      setUpdatingMeta(true)
      const res = await fetch(`/api/admin/stores/${businessId}/whatsapp-flows/conversations/${selectedConversation.id}/auto-assign`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      await fetchConversations()
      if (data.conversation) setSelectedConversation((p) => (p ? { ...p, assignedTo: data.conversation.assignedTo, assignedToUser: data.conversation.assignedToUser, status: 'assigned' } : p))
      toast.success(`Assigned to ${data.conversation?.assignedToUser?.name || 'agent'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setUpdatingMeta(false)
    }
  }

  const fetchAgentMetrics = () => {
    fetch(`/api/admin/stores/${businessId}/whatsapp-flows/agent-metrics`)
      .then((r) => r.ok ? r.json() : { metrics: [] })
      .then((d) => setAgentMetrics(d.metrics || []))
      .catch(() => {})
  }

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
        <button
          onClick={() => { setShowMetrics(!showMetrics); if (!showMetrics) fetchAgentMetrics() }}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
        >
          <BarChart3 className="w-4 h-4" />
          Agent metrics
        </button>
      </div>

      {showMetrics && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
          <h3 className="font-semibold text-gray-900 mb-3">Performance by agent</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2">Agent</th>
                <th className="text-right py-2 px-2">Assigned</th>
                <th className="text-right py-2 px-2">Resolved</th>
                <th className="text-right py-2 px-2">Resolution %</th>
                <th className="text-right py-2 px-2">Avg response (min)</th>
              </tr>
            </thead>
            <tbody>
              {agentMetrics.map((m) => (
                <tr key={m.userId} className="border-b border-gray-100">
                  <td className="py-2 px-2">{m.name}</td>
                  <td className="text-right py-2 px-2">{m.assigned}</td>
                  <td className="text-right py-2 px-2">{m.resolved}</td>
                  <td className="text-right py-2 px-2">{m.resolutionRate}%</td>
                  <td className="text-right py-2 px-2">{m.avgResponseMinutes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {agentMetrics.length === 0 && <p className="text-sm text-gray-500 py-4">No agent data yet.</p>}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col lg:flex-row" style={{ minHeight: 'min(600px, 80vh)' }}>
        {/* Left panel - conversation list (hidden on mobile when thread is shown) */}
        <div className={`lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200 space-y-2">
            <div className="flex gap-1">
              {(['all', 'mine', 'unassigned'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg ${view === v ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {v === 'all' ? 'All' : v === 'mine' ? 'Mine' : 'Unassigned'}
                </button>
              ))}
            </div>
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
            <button onClick={() => fetchConversations()} className="text-sm text-teal-600 hover:text-teal-700">
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                        </p>
                        {conv.assignedToUser && (
                          <span className="text-xs text-teal-600 truncate">→ {conv.assignedToUser.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      {!conv.isRead && (
                        <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0" />
                      )}
                      {conv.slaBreached && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" /> SLA
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${conv.status === 'resolved' ? 'bg-green-100 text-green-700' : conv.status === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {conv.status}
                      </span>
                    </div>
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
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-200 text-gray-600"
                    aria-label="Back to conversations"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">
                      {selectedConversation.customerName || selectedConversation.customerPhone}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{selectedConversation.customerPhone}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleAutoAssign}
                    disabled={updatingMeta}
                    className="text-xs px-2 py-1 border border-teal-600 text-teal-600 rounded hover:bg-teal-50"
                  >
                    <Zap className="w-3.5 h-3.5 inline mr-1" />
                    Auto-assign
                  </button>
                  <label className="flex items-center gap-1 text-xs">
                    <UserPlus className="w-3.5 h-3.5 text-gray-500" />
                    Assign:
                    <select
                      value={selectedConversation.assignedTo ?? ''}
                      onChange={(e) => handleAssign(e.target.value || null)}
                      disabled={updatingMeta}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.name}{onlineUserIds.has(m.userId) ? ' ●' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-1 text-xs">
                    Status:
                    <select
                      value={selectedConversation.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={updatingMeta}
                      className="text-xs border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="open">Open</option>
                      <option value="assigned">Assigned</option>
                      <option value="waiting">Waiting</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </label>
                  {selectedConversation.assignedToUser && (
                    <span className="text-xs text-gray-600">→ {selectedConversation.assignedToUser.name || 'Assigned'}</span>
                  )}
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
              <div className="border-t border-gray-200 p-4 bg-amber-50/50">
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 py-1">
                    <StickyNote className="w-4 h-4" />
                    Internal notes ({notes.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {notes.map((n) => (
                      <div key={n.id} className="text-sm bg-white border border-amber-200 rounded p-2">
                        <p className="text-gray-800">{n.body}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Add internal note..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button onClick={handleAddNote} disabled={addingNote || !noteInput.trim()} className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 disabled:opacity-50">
                        {addingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                      </button>
                    </div>
                  </div>
                </details>
              </div>
              <div className="p-4 border-t border-gray-200">
                {cannedResponses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Canned:</span>
                    {cannedResponses.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleInsertCanned(c.body)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-100"
                      >
                        {c.shortcut || c.title}
                      </button>
                    ))}
                  </div>
                )}
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
