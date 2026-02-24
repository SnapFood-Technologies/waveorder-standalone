'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  ChevronLeft,
  Inbox,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  BarChart3,
  MessageSquare,
  ExternalLink,
  User
} from 'lucide-react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface BusinessServiceRequestStats {
  business: {
    id: string
    name: string
    currency: string
    businessType: string
  }
  stats: {
    totalRequests: number
    completedRequests: number
    cancelledRequests: number
    completionRate: number
    statusBreakdown: Record<string, number>
  }
  chartData: Array<{ date: string; requests: number }>
  requests: Array<{
    id: string
    requestType: string
    requesterType: string
    contactName: string
    companyName: string | null
    email: string
    phone: string | null
    message: string | null
    status: string
    amount: number | null
    createdAt: string
    updatedAt: string
  }>
  pagination: { page: number; limit: number; total: number; pages: number }
}

type TimePeriod = 'last_7_days' | 'last_30_days' | 'last_3_months' | 'last_6_months' | 'this_year' | 'last_year'

const STATUS_COLORS: Record<string, string> = {
  NEW: '#fbbf24',
  CONTACTED: '#3b82f6',
  QUOTED: '#8b5cf6',
  CONFIRMED: '#059669',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444'
}

const PIE_COLORS = ['#fbbf24', '#3b82f6', '#8b5cf6', '#059669', '#10b981', '#ef4444', '#6b7280']

function formatDateStr(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export default function BusinessServiceRequestsPage() {
  const params = useParams()
  const businessId = params.businessId as string

  const addParams = (path: string) => {
    try {
      const url = new URL(path, window.location.origin)
      url.searchParams.set('impersonate', 'true')
      url.searchParams.set('businessId', businessId)
      return url.pathname + url.search
    } catch {
      return `${path}?impersonate=true&businessId=${businessId}`
    }
  }

  const [data, setData] = useState<BusinessServiceRequestStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('last_30_days')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    fetchData()
  }, [businessId, selectedPeriod, currentPage, debouncedSearch, filterStatus])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const sp = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        period: selectedPeriod
      })
      if (debouncedSearch.trim()) sp.append('search', debouncedSearch.trim())
      if (filterStatus !== 'all') sp.append('status', filterStatus)

      const res = await fetch(`/api/superadmin/businesses/${businessId}/service-requests/stats?${sp}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || `Failed to load (${res.status})`)
      }
      const result = await res.json()
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const formatStatus = (s: string) => s.replace('_', ' ')
  const statusChartData = data?.stats.statusBreakdown
    ? Object.entries(data.stats.statusBreakdown).map(([status, value]) => ({
        name: formatStatus(status),
        value,
        status
      }))
    : []

  const processedChartData = data?.chartData.map((item) => ({
    ...item,
    label: formatDateStr(new Date(item.date))
  })) || []

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header: back + title left, View in Admin end right */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link
            href={`/superadmin/businesses/${businessId}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2 sm:mb-0"
          >
            <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            Back to Business Details
          </Link>
          <div className="mt-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Service Request Statistics</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Service requests for <span className="font-medium">{data.business.name}</span>
            </p>
          </div>
        </div>
        <Link
          href={addParams(`/admin/stores/${businessId}/service-requests`)}
          className="inline-flex items-center justify-center sm:justify-end px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium border border-teal-200 rounded-lg hover:bg-teal-50 flex-shrink-0 self-start sm:self-center"
        >
          <ExternalLink className="w-4 h-4 mr-1 flex-shrink-0" />
          View in Admin
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{data.stats.totalRequests}</p>
            </div>
            <Inbox className="w-10 h-10 text-teal-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{data.stats.completedRequests}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{data.stats.cancelledRequests}</p>
            </div>
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {data.stats.completionRate.toFixed(1)}%
              </p>
            </div>
            <MessageSquare className="w-10 h-10 text-blue-500" />
          </div>
        </div>
      </div>

      {processedChartData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              Requests Over Time
            </h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Bar dataKey="requests" fill="#059669" radius={[4, 4, 0, 0]} name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {statusChartData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => {
                      const total = statusChartData.reduce((s, i) => s + i.value, 0)
                      const num = typeof value === 'number' ? value : Number(value)
                      const pct = total > 0 ? ((num / total) * 100).toFixed(0) : '0'
                      return `${name}: ${pct}%`
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {statusChartData.map((item, i) => (
                <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Service Requests</h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search contact, email, message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-48"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All statuses</option>
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUOTED">Quoted</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email / Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No service requests in this period
                  </td>
                </tr>
              ) : (
                data.requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{r.contactName}</p>
                          {r.companyName && (
                            <p className="text-xs text-gray-500">{r.companyName}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {r.email}
                      {r.phone && ` · ${r.phone}`}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex px-2 py-1 text-xs font-medium rounded"
                        style={{
                          backgroundColor: `${STATUS_COLORS[r.status] || '#6b7280'}20`,
                          color: STATUS_COLORS[r.status] || '#374151'
                        }}
                      >
                        {formatStatus(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={addParams(`/admin/stores/${businessId}/service-requests/${r.id}`)}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data.pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {data.pagination.page} of {data.pagination.pages} ({data.pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={data.pagination.page <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(data.pagination.pages, p + 1))}
                disabled={data.pagination.page >= data.pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
