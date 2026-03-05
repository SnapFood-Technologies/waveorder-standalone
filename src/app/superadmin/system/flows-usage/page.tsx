'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  MessageSquare,
  Loader2,
  AlertCircle,
  Zap,
  Inbox,
  Building2,
  Send,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react'

interface ApiResponse {
  period: string
  dateRange: { start: string; end: string }
  summary: {
    flowsEnabled: number
    businessPlanCount: number
    adoptionRate: number
    totalConversations: number
    messagesInPeriod: number
  }
  topBusinesses: Array<{
    id: string
    name: string
    slug: string
    subscriptionPlan: string
    conversationsCount: number
  }>
}

export default function GlobalFlowsUsagePage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/superadmin/system/flows-overview?period=${period}`)
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.message || 'Failed to load')
        }

        setData(json)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load Flows overview')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period])

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
          <Link href="/superadmin/system" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">WaveOrder Flows Overview</h1>
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
          <Link href="/superadmin/dashboard" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WaveOrder Flows Overview</h1>
            <p className="text-sm text-gray-600 mt-1">
              Global adoption, usage, and top businesses
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Zap className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Flows Enabled</p>
              <p className="text-2xl font-bold text-gray-900">{s?.flowsEnabled ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Adoption Rate</p>
              <p className="text-2xl font-bold text-gray-900">{s?.adoptionRate ?? 0}%</p>
              <p className="text-xs text-gray-500">
                of {s?.businessPlanCount ?? 0} BUSINESS plan
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Inbox className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Conversations</p>
              <p className="text-2xl font-bold text-gray-900">{s?.totalConversations ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Messages (period)</p>
              <p className="text-2xl font-bold text-gray-900">{s?.messagesInPeriod ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/superadmin/system/twilio-activities"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100"
          >
            <Send className="w-4 h-4 mr-2" />
            Twilio & Flows Activities
          </Link>
          <Link
            href="/superadmin/businesses"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
          >
            <Building2 className="w-4 h-4 mr-2" />
            All Businesses
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Businesses by Conversations</h2>
        {data?.topBusinesses && data.topBusinesses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Business</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Plan</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    Conversations
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.topBusinesses.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{b.name}</p>
                      <p className="text-xs text-gray-500">{b.slug}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{b.subscriptionPlan}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {b.conversationsCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/superadmin/businesses/${b.id}/whatsapp-flows-usage`}
                        className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        View Usage
                        <ArrowUpRight className="w-4 h-4 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No businesses with Flows enabled yet.</p>
        )}
      </div>
    </div>
  )
}
