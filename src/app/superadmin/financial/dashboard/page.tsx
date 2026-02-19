'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign, TrendingUp, CreditCard, Wallet, Users, Clock,
  RefreshCw, Loader2, ArrowUpRight, ArrowDownRight, BarChart3,
  Zap, AlertCircle, CheckCircle2, ChevronRight, X
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface DashboardData {
  revenue: {
    total: number
    totalCharges: number
    totalRefunded: number
    thisMonth: number
    lastMonth: number
    monthOverMonthChange: number
  }
  mrr: number
  arr: number
  arpu: number
  stripeBalance: { available: number; pending: number }
  subscriptions: {
    paidActive: number
    trialing: number
    paused: number
    canceled: number
    free: number
    total: number
  }
  revenueByPlan: Record<string, { subscribers: number; mrr: number }>
  trialFunnel: {
    activeTrials: number
    endedTrials: number
    converted: number
    conversionRate: number
  }
  monthlyRevenue: Array<{ month: string; revenue: number; charges: number; refunds: number }>
  recentTransactions: Array<{
    id: string
    type: string
    customerEmail: string | null
    customerName: string | null
    description: string | null
    amount: number
    currency: string
    status: string
    date: string
  }>
  currency: string
}

interface SyncData {
  totalBusinesses: number
  inSync: number
  withIssues: number
  noStripeCustomer: number
  businesses: Array<{
    businessId: string
    businessName: string
    ownerEmail: string | null
    status: string
    issueCount: number
    issues: string[]
  }>
}

export default function FinancialDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [syncData, setSyncData] = useState<SyncData | null>(null)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncFixing, setSyncFixing] = useState(false)

  useEffect(() => { fetchDashboard() }, [])

  const fetchDashboard = async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/superadmin/financial/dashboard')
      if (!res.ok) throw new Error('Failed to fetch')
      setData(await res.json())
    } catch (err: any) {
      toast.error(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const openSyncModal = async () => {
    setShowSyncModal(true)
    setSyncLoading(true)
    try {
      const res = await fetch('/api/superadmin/stripe-sync')
      if (!res.ok) throw new Error('Failed to analyse')
      setSyncData(await res.json())
    } catch (err: any) {
      toast.error(err.message || 'Failed to run sync analysis')
    } finally {
      setSyncLoading(false)
    }
  }

  const runGlobalFix = async () => {
    setSyncFixing(true)
    try {
      const res = await fetch('/api/superadmin/stripe-sync', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to sync')
      const result = await res.json()
      toast.success(`Synced ${result.totalFixed} business(es)`)
      // Re-run analysis
      const res2 = await fetch('/api/superadmin/stripe-sync')
      if (res2.ok) setSyncData(await res2.json())
      fetchDashboard()
    } catch (err: any) {
      toast.error(err.message || 'Failed to sync')
    } finally {
      setSyncFixing(false)
    }
  }

  const fmt = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load financial data</p>
        <button onClick={fetchDashboard} className="mt-4 text-teal-600 hover:underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time revenue and subscription data from Stripe</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openSyncModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium"
          >
            <Zap className="w-4 h-4" />
            Sync
          </button>
          <button
            onClick={fetchDashboard}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={fmt(data.revenue.total)}
          subtitle={`${data.recentTransactions.length > 0 ? data.monthlyRevenue.reduce((s, m) => s + m.charges, 0) : 0} payments - ${fmt(data.revenue.totalRefunded)} refunded`}
          icon={DollarSign}
          color="green"
        />
        <KPICard
          title="This Month"
          value={fmt(data.revenue.thisMonth)}
          subtitle={`Last month: ${fmt(data.revenue.lastMonth)}`}
          icon={TrendingUp}
          color="blue"
          change={data.revenue.monthOverMonthChange}
        />
        <KPICard
          title="MRR"
          value={fmt(data.mrr)}
          subtitle={`ARR: ${fmt(data.arr)}`}
          icon={BarChart3}
          color="purple"
        />
        <KPICard
          title="Stripe Balance"
          value={fmt(data.stripeBalance.available)}
          subtitle={`Pending: ${fmt(data.stripeBalance.pending)}`}
          icon={Wallet}
          color="indigo"
        />
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Paid Subscriptions"
          value={String(data.subscriptions.paidActive)}
          subtitle={`ARPU: ${fmt(data.arpu)}`}
          icon={CreditCard}
          color="teal"
        />
        <KPICard
          title="Active Trials"
          value={String(data.subscriptions.trialing)}
          subtitle={`${data.trialFunnel.conversionRate}% conversion rate`}
          icon={Clock}
          color="amber"
        />
        <KPICard
          title="Total Customers"
          value={String(data.subscriptions.total)}
          subtitle={`${data.subscriptions.paidActive} paid, ${data.subscriptions.trialing} trial, ${data.subscriptions.free} free`}
          icon={Users}
          color="gray"
        />
        <KPICard
          title="Canceled"
          value={String(data.subscriptions.canceled)}
          subtitle={`${data.subscriptions.paused} paused`}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Monthly Revenue + Revenue by Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
          <div className="space-y-3">
            {data.monthlyRevenue.map((m) => (
              <div key={m.month} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-16">{m.month}</span>
                <div className="flex-1 mx-4">
                  <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, data.monthlyRevenue.length > 0
                          ? (m.revenue / Math.max(...data.monthlyRevenue.map(x => x.revenue), 1)) * 100
                          : 0)}%`
                      }}
                    />
                  </div>
                </div>
                <div className="text-right w-28">
                  <span className="text-sm font-medium text-gray-900">{fmt(m.revenue)}</span>
                  <span className="text-xs text-gray-500 ml-2">{m.charges} ch.</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Plan + Trial Funnel */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h2>
            {Object.keys(data.revenueByPlan).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(data.revenueByPlan).map(([plan, info]) => (
                  <div key={plan} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                        plan === 'BUSINESS' ? 'bg-indigo-100 text-indigo-700' :
                        plan === 'PRO' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{plan}</span>
                      <span className="text-xs text-gray-500 ml-2">{info.subscribers} subscribers</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{fmt(info.mrr)}/mo</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No paid subscriptions yet</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Trial Funnel</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Trials</span>
                <span className="font-medium">{data.trialFunnel.activeTrials}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ended Trials</span>
                <span className="font-medium">{data.trialFunnel.endedTrials}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Converted</span>
                <span className="font-medium">{data.trialFunnel.converted}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600 font-medium">Conversion Rate</span>
                <span className="font-semibold text-teal-600">{data.trialFunnel.conversionRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <Link
            href="/superadmin/financial/transactions"
            className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {data.recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 pr-4 text-right">Amount</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.recentTransactions.map((t) => (
                  <tr key={t.id} className="text-sm hover:bg-gray-50">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">{t.customerName || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{t.customerEmail}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{t.description}</td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-900">
                      {t.currency.toUpperCase()} {t.amount < 0 ? `-$${Math.abs(t.amount).toFixed(2)}` : `$${t.amount.toFixed(2)}`}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        t.status === 'succeeded' || t.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : t.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">
                      {new Date(t.date).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">No transactions recorded yet</p>
        )}
      </div>

      {/* Global Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowSyncModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Global Stripe Sync</h2>
                <p className="text-sm text-gray-500">Compare all Stripe subscriptions with database records</p>
              </div>
              <button onClick={() => setShowSyncModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {syncLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600 mr-3" />
                  <span className="text-gray-600">Analysing all businesses...</span>
                </div>
              ) : syncData ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-700">{syncData.inSync}</p>
                      <p className="text-xs text-green-600">In Sync</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-700">{syncData.withIssues}</p>
                      <p className="text-xs text-red-600">With Issues</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-700">{syncData.noStripeCustomer}</p>
                      <p className="text-xs text-gray-600">No Stripe</p>
                    </div>
                  </div>

                  {/* Businesses with issues */}
                  {syncData.businesses.filter(b => b.status === 'issues_found').length > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Businesses with Issues</h3>
                      <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                        {syncData.businesses.filter(b => b.status === 'issues_found').map(b => (
                          <div key={b.businessId} className="p-3 flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{b.businessName}</p>
                              <p className="text-xs text-gray-500">{b.ownerEmail}</p>
                              {b.issues.map((issue, i) => (
                                <p key={i} className="text-xs text-red-600 mt-1">{issue}</p>
                              ))}
                            </div>
                            <Link
                              href={`/superadmin/businesses/${b.businessId}`}
                              className="text-xs text-teal-600 hover:underline whitespace-nowrap"
                            >
                              View
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-green-800 font-medium">All businesses are in sync with Stripe</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {syncData && syncData.withIssues > 0 && (
              <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowSyncModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={runGlobalFix}
                  disabled={syncFixing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium disabled:opacity-50"
                >
                  {syncFixing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Sync All ({syncData.withIssues} businesses)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function KPICard({
  title, value, subtitle, icon: Icon, color, change
}: {
  title: string
  value: string
  subtitle: string
  icon: any
  color: string
  change?: number
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    teal: 'bg-teal-50 text-teal-600',
    amber: 'bg-amber-50 text-amber-600',
    gray: 'bg-gray-50 text-gray-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.gray}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {change !== undefined && change !== 0 && (
          <span className={`inline-flex items-center text-xs font-medium ${
            change > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(change)}%
          </span>
        )}
        <span className="text-xs text-gray-500">{subtitle}</span>
      </div>
    </div>
  )
}
