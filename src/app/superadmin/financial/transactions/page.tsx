'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign, Search, RefreshCw, Loader2, ChevronLeft, ChevronRight,
  FileText, CreditCard, ArrowDownLeft, ExternalLink
} from 'lucide-react'
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
}

interface Stats {
  totalTransactions: number
  netAmount: number
  totalCharges: number
  totalChargeAmount: number
  totalRefunds: number
  totalRefundAmount: number
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { fetchTransactions() }, [page, typeFilter, statusFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        type: typeFilter,
        status: statusFilter,
        ...(search ? { search } : {})
      })

      const res = await fetch(`/api/superadmin/financial/transactions?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()

      setTransactions(data.transactions)
      setStats(data.stats)
      setTotalPages(data.pagination.totalPages)
      setTotal(data.pagination.total)
      setSource(data.source)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchTransactions()
  }

  const fmt = (n: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-1">
          All payments, refunds, and invoices from Stripe
          {source === 'stripe_api' && (
            <span className="ml-2 text-xs text-amber-600">(Reading directly from Stripe API — transactions will be stored locally once captured by webhooks)</span>
          )}
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Total Transactions</p>
            <p className="text-xl font-bold text-gray-900">{stats.totalTransactions}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Net Amount</p>
            <p className="text-xl font-bold text-gray-900">{fmt(stats.netAmount)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Charges</p>
            <p className="text-xl font-bold text-green-700">{stats.totalCharges}</p>
            <p className="text-xs text-gray-500">{fmt(stats.totalChargeAmount)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Refunds</p>
            <p className="text-xl font-bold text-red-700">{stats.totalRefunds}</p>
            <p className="text-xs text-gray-500">{fmt(stats.totalRefundAmount)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by email, name, ID, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </form>

          <select
            value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All Types</option>
            <option value="charge">Charges</option>
            <option value="invoice">Invoices</option>
            <option value="refund">Refunds</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All Status</option>
            <option value="succeeded">Succeeded</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <button
            onClick={() => { setPage(1); fetchTransactions() }}
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
            <p className="text-sm font-medium text-teal-800">Communicating with Stripe...</p>
            <p className="text-xs text-teal-600 mt-0.5">Fetching WaveOrder transaction data for each customer. This may take a few seconds.</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-32" />
                </div>
                <div className="h-4 bg-gray-200 rounded w-20" />
                <div className="h-5 bg-gray-200 rounded-full w-16" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions found</p>
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
                  {transactions.map((t) => (
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
                        <p className="text-sm text-gray-900">{t.customerName || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{t.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        {t.plan ? (
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                            t.plan === 'BUSINESS' ? 'bg-indigo-100 text-indigo-700' :
                            t.plan === 'PRO' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {t.plan}
                          </span>
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
                          day: '2-digit', month: '2-digit', year: 'numeric'
                        })}
                        <br />
                        {new Date(t.date).toLocaleTimeString('en-US', {
                          hour: '2-digit', minute: '2-digit'
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
