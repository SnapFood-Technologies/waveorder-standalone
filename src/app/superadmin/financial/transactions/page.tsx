'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DollarSign, Search, RefreshCw, Loader2, ChevronLeft, ChevronRight,
  FileText, CreditCard, ArrowDownLeft, ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Transaction {
  id: string
  type: string
  status: string
  amount: number
  currency: string
  customerEmail: string | null
  customerName: string | null
  description: string | null
  plan: string | null
  billingType: string | null
  refundedAmount: number | null
  date: string
  isDeactivated?: boolean
}

interface Stats {
  totalTransactions: number
  netAmount: number
  totalCharges: number
  totalChargeAmount: number
  totalRefunds: number
  totalRefundAmount: number
}

interface SourceData {
  transactions: Transaction[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  stats: Stats
}

export default function TransactionsPage() {
  const [stripeData, setStripeData] = useState<SourceData | null>(null)
  const [dbData, setDbData] = useState<SourceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageStripe, setPageStripe] = useState(1)
  const [pageDb, setPageDb] = useState(1)

  // Filters (apply to both tables)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const limit = 25

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        source: 'both',
        page_stripe: String(pageStripe),
        page_db: String(pageDb),
        limit: String(limit),
        type: typeFilter,
        status: statusFilter,
        ...(search ? { search } : {}),
      })

      const res = await fetch(`/api/superadmin/financial/transactions?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()

      setStripeData(data.stripe)
      setDbData(data.db)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [pageStripe, pageDb, typeFilter, statusFilter, search])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPageStripe(1)
    setPageDb(1)
    fetchTransactions()
  }

  const handleFilterChange = () => {
    setPageStripe(1)
    setPageDb(1)
  }

  const fmt = (n: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(n)
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'charge': return <CreditCard className="w-4 h-4 text-green-600" />
      case 'invoice': return <FileText className="w-4 h-4 text-blue-600" />
      case 'refund': return <ArrowDownLeft className="w-4 h-4 text-red-600" />
      default: return <DollarSign className="w-4 h-4 text-gray-600" />
    }
  }

  const TransactionRow = ({ t, showDeactivatedBadge = false }: { t: Transaction; showDeactivatedBadge?: boolean }) => (
    <tr key={t.id} className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {typeIcon(t.type)}
          <div>
            <p className="text-sm font-medium text-gray-900 capitalize">{t.type}</p>
            <p className="text-xs text-gray-500 font-mono truncate max-w-[140px]">{t.id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-900">{t.customerName || 'Unknown'}</p>
          <p className="text-xs text-gray-500">{t.customerEmail}</p>
          {showDeactivatedBadge && t.isDeactivated && (
            <span className="inline-flex w-fit mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
              Deactivated
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {t.plan ? (
          <div className="flex flex-col gap-0.5">
            <span className={`inline-flex w-fit px-2 py-0.5 text-xs font-medium rounded ${
              t.plan === 'BUSINESS' ? 'bg-indigo-100 text-indigo-700' :
              t.plan === 'PRO' ? 'bg-purple-100 text-purple-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {t.plan}
            </span>
            {t.billingType && (
              <span className="text-xs text-gray-500 capitalize">{t.billingType}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`text-sm font-medium ${
          t.amount < 0 ? 'text-red-600' : 'text-gray-900'
        }`}>
          {t.amount < 0 ? '-' : ''}{t.currency.toUpperCase()} ${Math.abs(t.amount).toFixed(2)}
        </span>
        {t.refundedAmount && t.refundedAmount > 0 && (
          <p className="text-xs text-red-500">Refunded: ${t.refundedAmount.toFixed(2)}</p>
        )}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
          t.status === 'succeeded' || t.status === 'paid'
            ? 'bg-green-100 text-green-700'
            : t.status === 'failed'
            ? 'bg-red-100 text-red-700'
            : t.status === 'refunded'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {t.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {new Date(t.date).toLocaleDateString('en-US', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        })}
        <br />
        {new Date(t.date).toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit',
        })}
      </td>
      <td className="px-4 py-3">
        <a
          href={`https://dashboard.stripe.com/${t.type === 'invoice' ? 'invoices' : 'payments'}/${t.id.replace('re_', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-teal-600"
          title="View in Stripe"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </td>
    </tr>
  )

  const Pagination = ({
    page,
    totalPages,
    total,
    onPrev,
    onNext,
  }: {
    page: number
    totalPages: number
    total: number
    onPrev: () => void
    onNext: () => void
  }) => (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Showing {total === 0 ? 0 : (page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages || 1}
        </span>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  const TableSection = ({
    title,
    description,
    data,
    page,
    setPage,
    loading,
    emptyMessage,
  }: {
    title: string
    description: string
    data: SourceData | null
    page: number
    setPage: (fn: (p: number) => number) => void
    loading: boolean
    emptyMessage: string
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      {loading ? (
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
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
      ) : !data || data.transactions.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.transactions.map((t) => (
                  <TransactionRow key={t.id} t={t} showDeactivatedBadge={title === 'From Our Platform'} />
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={data.pagination.totalPages}
            total={data.pagination.total}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
          />
        </>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-1">
          Payments, refunds, and invoices — from Stripe and from our platform
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email, name, ID, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </form>

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); handleFilterChange() }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All Types</option>
            <option value="charge">Charges</option>
            <option value="invoice">Invoices</option>
            <option value="refund">Refunds</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); handleFilterChange() }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All Status</option>
            <option value="succeeded">Succeeded</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <button
            onClick={() => { setPageStripe(1); setPageDb(1); fetchTransactions() }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Loading Banner */}
      {loading && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-teal-800">Fetching transaction data...</p>
            <p className="text-xs text-teal-600 mt-0.5">
              Loading from Stripe API and our database. This may take a few seconds.
            </p>
          </div>
        </div>
      )}

      {/* From Stripe Table */}
      <TableSection
        title="From Stripe"
        description="All charges and refunds for WaveOrder customers from Stripe. Includes invoices and subscriptions triggered manually or via payment links directly in Stripe."
        data={stripeData}
        page={pageStripe}
        setPage={setPageStripe}
        loading={loading}
        emptyMessage="No Stripe charges for WaveOrder customers"
      />

      {/* From Our Platform Table */}
      <TableSection
        title="From Our Platform"
        description="Transactions captured by our webhooks when users subscribe through WaveOrder. If you see fewer records here, it means some subscriptions happened outside our platform (e.g. manual invoices or payment links created directly in Stripe)."
        data={dbData}
        page={pageDb}
        setPage={setPageDb}
        loading={loading}
        emptyMessage="No transactions captured by our webhooks yet"
      />
    </div>
  )
}
