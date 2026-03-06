'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CreditCard,
  RefreshCw,
  Loader2,
  ExternalLink,
  Calendar,
  Search,
  Building2,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Subscription {
  id: string
  stripeSubscriptionId: string
  customerId: string
  customerEmail: string | null
  customerName: string | null
  businessNames: string[]
  plan: string
  billingType: string
  status: string
  renewalDate: string
  amount: number
  currency: string
}

interface SubscriptionsData {
  subscriptions: Subscription[]
  meta: {
    total: number
    active: number
    trialing: number
    canceled: number
    source: string
  }
}

export default function SubscriptionsPage() {
  const [data, setData] = useState<SubscriptionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [payingOnly, setPayingOnly] = useState(true)
  const [search, setSearch] = useState('')

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/financial/subscriptions')
      if (!res.ok) throw new Error('Failed to fetch subscriptions')
      const json = await res.json()
      setData(json)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load subscriptions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const fmt = (n: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(n)
  }

  const fmtDate = (iso: string) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const filtered =
    data?.subscriptions.filter((s) => {
      if (payingOnly && s.billingType === 'free') return false
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.status === 'active') ||
        (statusFilter === 'trialing' && s.status === 'trialing') ||
        (statusFilter === 'canceled' &&
          ['canceled', 'incomplete_expired'].includes(s.status)) ||
        (statusFilter === 'other' &&
          !['active', 'trialing', 'canceled', 'incomplete_expired'].includes(s.status))
      if (!matchStatus) return false
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        (s.customerEmail?.toLowerCase().includes(q) ?? false) ||
        (s.customerName?.toLowerCase().includes(q) ?? false) ||
        s.customerId.toLowerCase().includes(q) ||
        s.stripeSubscriptionId.toLowerCase().includes(q) ||
        s.plan.toLowerCase().includes(q) ||
        s.businessNames.some((b) => b.toLowerCase().includes(q))
      )
    }) ?? []

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      trialing: 'bg-blue-100 text-blue-700',
      canceled: 'bg-gray-100 text-gray-700',
      incomplete_expired: 'bg-red-100 text-red-700',
      paused: 'bg-amber-100 text-amber-700',
    }
    return (
      <span
        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
          styles[status] ?? 'bg-gray-100 text-gray-700'
        }`}
      >
        {status}
      </span>
    )
  }

  const planBadge = (plan: string, billingType: string) => {
    const styles: Record<string, string> = {
      BUSINESS: 'bg-indigo-100 text-indigo-700',
      PRO: 'bg-purple-100 text-purple-700',
      STARTER: 'bg-gray-100 text-gray-700',
    }
    const typeLabel = billingType === 'free' ? 'Free' : billingType === 'yearly' ? 'Yearly' : billingType === 'monthly' ? 'Monthly' : ''
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
          styles[plan] ?? 'bg-gray-100 text-gray-700'
        }`}
      >
        {plan}
        <span className="font-normal opacity-75">
          {typeLabel ? `— ${typeLabel}` : ''}
        </span>
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-600 mt-1">
          Active subscriptions and renewal dates — live data from Stripe
        </p>
      </div>

      {/* Stats + Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          {data?.meta && (
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-gray-600">
                <strong className="text-gray-900">{data.meta.active}</strong> active
              </span>
              <span className="text-gray-600">
                <strong className="text-gray-900">{data.meta.trialing}</strong> trialing
              </span>
              <span className="text-gray-600">
                <strong className="text-gray-900">{data.meta.canceled}</strong> canceled
              </span>
              <span className="text-gray-500">
                Total: {data.meta.total} (source: {data.meta.source})
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={payingOnly}
                onChange={(e) => setPayingOnly(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Paying only</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email, name, ID..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full md:w-56"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="canceled">Canceled</option>
              <option value="other">Other</option>
              <option value="all">All</option>
            </select>
            <button
              onClick={fetchSubscriptions}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-teal-800">
              Fetching subscriptions from Stripe...
            </p>
            <p className="text-xs text-teal-600 mt-0.5">
              Data is fetched live from Stripe — no sync delay.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Subscriptions</h2>
          <p className="text-sm text-gray-500 mt-1">
            WaveOrder subscriptions only. Renewal dates come from Stripe&apos;s
            current_period_end.
          </p>
        </div>
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-5 bg-gray-200 rounded-full w-16" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              No subscriptions match the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Renewal Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium text-gray-900">
                          {s.customerName || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">{s.customerEmail}</p>
                        <p className="text-xs text-gray-400 font-mono truncate max-w-[180px]">
                          {s.customerId}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.businessNames.length > 0 ? (
                        <div className="space-y-1">
                          {s.businessNames.slice(0, 2).map((name) => (
                            <div key={name} className="flex items-center text-sm">
                              <Building2 className="w-3 h-3 mr-2 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-900">{name}</span>
                            </div>
                          ))}
                          {s.businessNames.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{s.businessNames.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {planBadge(s.plan, s.billingType)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {fmt(s.amount, s.currency)}/mo
                      </span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(s.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {fmtDate(s.renewalDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://dashboard.stripe.com/subscriptions/${s.stripeSubscriptionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-teal-600"
                        title="View in Stripe"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
