'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  MessageSquare,
  Loader2,
  AlertCircle,
  Megaphone,
  Bot,
  Zap,
  Users,
  Send,
  Inbox,
  BarChart3
} from 'lucide-react'

interface UsageSummary {
  conversationsInPeriod: number
  totalConversationsAllTime: number
  messagesInbound: number
  messagesOutbound: number
  flowReplies: number
  aiReplies: number
  flowTriggersTotal: number
  flowRepliesInPeriod: number
  aiRepliesInPeriod: number
  campaignsSent: number
  broadcastsDelivered: number
  broadcastsFailed: number
  aiRepliesFromUsage: number
  unreadConversations: number
}

interface ApiResponse {
  business: {
    id: string
    name: string
    subscriptionPlan: string
    flowsEnabled: boolean
    phoneNumber: string | null
  }
  period: string
  dateRange: { start: string; end: string }
  summary: UsageSummary
}

export default function SuperAdminWhatsAppFlowsUsagePage() {
  const params = useParams()
  const businessId = params.businessId as string
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/superadmin/businesses/${businessId}/whatsapp-flows-usage?period=${period}`)
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.message || 'Failed to load')
        }

        setData(json)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load WaveOrder Flows usage')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [businessId, period])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 px-2 sm:px-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/superadmin/businesses/${businessId}`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">WaveOrder Flows Usage</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-800 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const s = data?.summary

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/superadmin/businesses/${businessId}`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WaveOrder Flows Usage</h1>
            <p className="text-sm text-gray-600 mt-1">
              {data?.business.name} — Conversations, messages, flows, broadcasts, AI
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

      {!data?.business.flowsEnabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900">WaveOrder Flows Not Enabled</h3>
            <p className="text-amber-800 text-sm mt-1">This business has not enabled WaveOrder Flows. Usage data may be empty.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Inbox className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Conversations (period)</p>
              <p className="text-2xl font-bold text-gray-900">{s?.conversationsInPeriod ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total conversations</p>
              <p className="text-2xl font-bold text-gray-900">{s?.totalConversationsAllTime ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Inbound messages</p>
              <p className="text-2xl font-bold text-gray-900">{s?.messagesInbound ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Outbound messages</p>
              <p className="text-2xl font-bold text-gray-900">{s?.messagesOutbound ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Flow replies (period)</p>
              <p className="text-2xl font-bold text-gray-900">{s?.flowRepliesInPeriod ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Bot className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">AI replies (period)</p>
              <p className="text-2xl font-bold text-gray-900">{s?.aiRepliesInPeriod ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <Megaphone className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Broadcasts sent</p>
              <p className="text-2xl font-bold text-gray-900">{s?.campaignsSent ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Broadcast delivered</p>
              <p className="text-2xl font-bold text-gray-900">{s?.broadcastsDelivered ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Broadcast failed</p>
              <p className="text-2xl font-bold text-gray-900">{s?.broadcastsFailed ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Inbox className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unread now</p>
              <p className="text-2xl font-bold text-gray-900">{s?.unreadConversations ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/superadmin/system/twilio-activities?businessId=${businessId}`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Twilio & Flows Activities
          </Link>
          <Link
            href={`/admin/stores/${businessId}/whatsapp-flows/conversations?impersonate=true&businessId=${businessId}`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Inbox className="w-4 h-4 mr-2" />
            Open Inbox (Admin)
          </Link>
        </div>
      </div>
    </div>
  )
}
