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
  Bell,
  X,
  Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface FinancialNotifSettings {
  financialNotificationEmails: string[]
  notifyNewPaidSignup: boolean
  notifyPlanUpgrade: boolean
  notifyPlanDowngrade: boolean
  notifySubscriptionCanceled: boolean
  notifyPaymentFailed: boolean
  notifyTrialEnding: boolean
  notifyRenewalApproaching: boolean
  trialDaysBefore: number
  renewalDaysBefore: number
}

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

const defaultNotifSettings: FinancialNotifSettings = {
  financialNotificationEmails: [],
  notifyNewPaidSignup: true,
  notifyPlanUpgrade: true,
  notifyPlanDowngrade: true,
  notifySubscriptionCanceled: true,
  notifyPaymentFailed: true,
  notifyTrialEnding: true,
  notifyRenewalApproaching: true,
  trialDaysBefore: 3,
  renewalDaysBefore: 3,
}

export default function SubscriptionsPage() {
  const [data, setData] = useState<SubscriptionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [payingOnly, setPayingOnly] = useState(true)
  const [search, setSearch] = useState('')
  const [showNotifModal, setShowNotifModal] = useState(false)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifForm, setNotifForm] = useState<FinancialNotifSettings>(defaultNotifSettings)
  const [newEmail, setNewEmail] = useState('')

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

  const loadNotifSettings = useCallback(async () => {
    setNotifLoading(true)
    try {
      const res = await fetch('/api/superadmin/settings/financial-notifications')
      if (!res.ok) throw new Error('Failed to load notification settings')
      const json = await res.json()
      setNotifForm({
        financialNotificationEmails: json.financialNotificationEmails ?? [],
        notifyNewPaidSignup: json.notifyNewPaidSignup ?? true,
        notifyPlanUpgrade: json.notifyPlanUpgrade ?? true,
        notifyPlanDowngrade: json.notifyPlanDowngrade ?? true,
        notifySubscriptionCanceled: json.notifySubscriptionCanceled ?? true,
        notifyPaymentFailed: json.notifyPaymentFailed ?? true,
        notifyTrialEnding: json.notifyTrialEnding ?? true,
        notifyRenewalApproaching: json.notifyRenewalApproaching ?? true,
        trialDaysBefore: json.trialDaysBefore ?? 3,
        renewalDaysBefore: json.renewalDaysBefore ?? 3,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load settings')
    } finally {
      setNotifLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showNotifModal) loadNotifSettings()
  }, [showNotifModal, loadNotifSettings])

  const saveNotifSettings = async () => {
    setNotifSaving(true)
    try {
      const res = await fetch('/api/superadmin/settings/financial-notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifForm),
      })
      if (!res.ok) throw new Error('Failed to save')
      const json = await res.json()
      setNotifForm({
        financialNotificationEmails: json.financialNotificationEmails,
        notifyNewPaidSignup: json.notifyNewPaidSignup,
        notifyPlanUpgrade: json.notifyPlanUpgrade,
        notifyPlanDowngrade: json.notifyPlanDowngrade,
        notifySubscriptionCanceled: json.notifySubscriptionCanceled,
        notifyPaymentFailed: json.notifyPaymentFailed,
        notifyTrialEnding: json.notifyTrialEnding,
        notifyRenewalApproaching: json.notifyRenewalApproaching,
        trialDaysBefore: json.trialDaysBefore,
        renewalDaysBefore: json.renewalDaysBefore,
      })
      toast.success('Notification settings saved')
      setShowNotifModal(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setNotifSaving(false)
    }
  }

  const addEmail = () => {
    const e = newEmail.trim().toLowerCase()
    if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      toast.error('Enter a valid email')
      return
    }
    if (notifForm.financialNotificationEmails.includes(e)) {
      toast.error('Already added')
      return
    }
    setNotifForm((f) => ({
      ...f,
      financialNotificationEmails: [...f.financialNotificationEmails, e],
    }))
    setNewEmail('')
  }

  const triggerRow = (
    checked: boolean,
    onChange: (v: boolean) => void,
    label: string,
    hint: string
  ) => (
    <label className="flex items-start gap-3 cursor-pointer py-2 border-b border-gray-100 last:border-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
      />
      <div>
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
      </div>
    </label>
  )

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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600 mt-1">
            Active subscriptions and renewal dates — live data from Stripe
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNotifModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Bell className="w-4 h-4 text-teal-600" />
          Notification settings
        </button>
      </div>

      {showNotifModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Financial notification emails</h2>
              <button
                type="button"
                onClick={() => setShowNotifModal(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {notifLoading ? (
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
                  Loading…
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Who receives alerts
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Paid and trial subscriptions only — not SuperAdmin free ($0) plans.
                    </p>
                    <ul className="space-y-2 mb-3">
                      {notifForm.financialNotificationEmails.map((em) => (
                        <li
                          key={em}
                          className="flex items-center justify-between gap-2 text-sm bg-gray-50 px-3 py-2 rounded-lg"
                        >
                          <span className="text-gray-800 truncate">{em}</span>
                          <button
                            type="button"
                            className="text-red-600 text-xs font-medium hover:underline flex-shrink-0"
                            onClick={() =>
                              setNotifForm((f) => ({
                                ...f,
                                financialNotificationEmails:
                                  f.financialNotificationEmails.filter((x) => x !== em),
                              }))
                            }
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Add email…"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                      />
                      <button
                        type="button"
                        onClick={addEmail}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Triggers</h3>
                    <div className="rounded-lg border border-gray-200 px-3">
                      {triggerRow(
                        notifForm.notifyNewPaidSignup,
                        (v) => setNotifForm((f) => ({ ...f, notifyNewPaidSignup: v })),
                        'New paid signup',
                        'New subscription with a paid Stripe price (includes starting a trial).'
                      )}
                      {triggerRow(
                        notifForm.notifyPlanUpgrade,
                        (v) => setNotifForm((f) => ({ ...f, notifyPlanUpgrade: v })),
                        'Plan upgrade',
                        'Customer moves to a higher plan tier.'
                      )}
                      {triggerRow(
                        notifForm.notifyPlanDowngrade,
                        (v) => setNotifForm((f) => ({ ...f, notifyPlanDowngrade: v })),
                        'Plan downgrade',
                        'Customer moves to a lower plan tier.'
                      )}
                      {triggerRow(
                        notifForm.notifySubscriptionCanceled,
                        (v) => setNotifForm((f) => ({ ...f, notifySubscriptionCanceled: v })),
                        'Subscription canceled',
                        'Stripe subscription deleted / ended.'
                      )}
                      {triggerRow(
                        notifForm.notifyPaymentFailed,
                        (v) => setNotifForm((f) => ({ ...f, notifyPaymentFailed: v })),
                        'Payment failed',
                        'Stripe invoice payment failed.'
                      )}
                      {triggerRow(
                        notifForm.notifyTrialEnding,
                        (v) => setNotifForm((f) => ({ ...f, notifyTrialEnding: v })),
                        'Trial ending',
                        `Once per trial — daily job when trial ends in N days (UTC).`
                      )}
                      {triggerRow(
                        notifForm.notifyRenewalApproaching,
                        (v) => setNotifForm((f) => ({ ...f, notifyRenewalApproaching: v })),
                        'Renewal approaching',
                        'Once per billing period — daily job when period ends in N days (UTC).'
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Trial reminder (days before)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={notifForm.trialDaysBefore}
                        onChange={(e) =>
                          setNotifForm((f) => ({
                            ...f,
                            trialDaysBefore: Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 3)),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Renewal reminder (days before)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={notifForm.renewalDaysBefore}
                        onChange={(e) =>
                          setNotifForm((f) => ({
                            ...f,
                            renewalDaysBefore: Math.min(30, Math.max(1, parseInt(e.target.value, 10) || 3)),
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Schedule a daily request to{' '}
                    <code className="bg-gray-100 px-1 rounded text-[11px]">
                      GET /api/cron/financial-superadmin-reminders
                    </code>{' '}
                    with header{' '}
                    <code className="bg-gray-100 px-1 rounded text-[11px]">
                      Authorization: Bearer CRON_SECRET
                    </code>
                    .
                  </p>
                </>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowNotifModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-white text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={notifSaving || notifLoading}
                onClick={saveNotifSettings}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
              >
                {notifSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <th className="px-4 py-3">Business(es)</th>
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
