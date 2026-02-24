'use client'

import { useState, useEffect } from 'react'
import {
  Inbox,
  CheckCircle,
  XCircle,
  Building2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BarChart3,
  PieChart,
  Clock,
  ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'

interface OverviewStats {
  totalRequests: number
  prevTotalRequests: number
  periodChange: number
  completedRequests: number
  cancelledRequests: number
  activeBusinesses: number
  totalBusinesses: number
  avgRequestsPerBusiness: number
}

interface StatusItem {
  status: string
  count: number
}

interface DayItem {
  date: string
  count: number
}

interface TopBusiness {
  id: string
  name: string
  slug: string
  businessType: string
  requestCount: number
}

interface InactiveBusiness {
  id: string
  name: string
  slug: string
  businessType: string
  createdAt: string
}

interface ServiceRequestsData {
  overview: OverviewStats
  requestsByStatus: StatusItem[]
  requestsByDay: DayItem[]
  topBusinesses: TopBusiness[]
  businessesWithNoRequests: InactiveBusiness[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: 'bg-yellow-500' },
  CONTACTED: { label: 'Contacted', color: 'bg-blue-500' },
  QUOTED: { label: 'Quoted', color: 'bg-indigo-500' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-teal-500' },
  COMPLETED: { label: 'Completed', color: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500' }
}

const businessTypeLabels: Record<string, string> = {
  SERVICES: 'Services',
  OTHER: 'Other'
}

export default function OperationsServiceRequestsPage() {
  const [data, setData] = useState<ServiceRequestsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('this_month')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({ period })
      const response = await fetch(`/api/superadmin/operations/service-requests?${params}`)
      if (!response.ok) throw new Error('Failed to fetch service requests analytics')
      const result = await response.json()
      setData(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getPeriodLabel = () => {
    const labels: Record<string, string> = {
      today: 'Today',
      this_week: 'This Week',
      this_month: 'This Month',
      last_30_days: 'Last 30 Days',
      last_90_days: 'Last 90 Days'
    }
    return labels[period] || 'This Month'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Requests Analytics</h1>
          <p className="text-gray-600 mt-1">
            Inbound service requests (email/WhatsApp) across SERVICES businesses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading service requests analytics...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{data.overview.totalRequests.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {data.overview.periodChange >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        data.overview.periodChange >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {data.overview.periodChange >= 0 ? '+' : ''}
                      {data.overview.periodChange}%
                    </span>
                    <span className="text-xs text-gray-500">vs prev period</span>
                  </div>
                </div>
                <Inbox className="w-8 h-8 text-teal-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.overview.completedRequests.toLocaleString()}
                  </p>
                  {data.overview.totalRequests > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {((data.overview.completedRequests / data.overview.totalRequests) * 100).toFixed(
                        1
                      )}
                      % completion rate
                    </p>
                  )}
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">With Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{data.overview.activeBusinesses}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    of {data.overview.totalBusinesses} SERVICES businesses
                  </p>
                </div>
                <Building2 className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Requests</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.overview.avgRequestsPerBusiness}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">per business with requests</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.overview.cancelledRequests.toLocaleString()}
                  </p>
                  {data.overview.totalRequests > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {((data.overview.cancelledRequests / data.overview.totalRequests) * 100).toFixed(
                        1
                      )}
                      % cancellation rate
                    </p>
                  )}
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>

          {data.requestsByDay.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Requests by Day ({getPeriodLabel()})
              </h3>
              <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
                {(() => {
                  const chartHeight = 100
                  const displayDays = data.requestsByDay.slice(-7)
                  const maxCount = Math.max(...displayDays.map((d) => d.count), 1)
                  return displayDays.map((item) => {
                    const heightPx =
                      maxCount > 0
                        ? Math.max((item.count / maxCount) * chartHeight, item.count > 0 ? 4 : 2)
                        : 2
                    const date = new Date(item.date)
                    return (
                      <div key={item.date} className="flex flex-col items-center flex-1">
                        <span className="text-xs text-gray-600 mb-1">{item.count.toLocaleString()}</span>
                        <div
                          className="w-full bg-teal-500 rounded-t-sm"
                          style={{ height: heightPx }}
                        />
                        <span className="text-xs text-gray-500 mt-2">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-xs text-gray-400">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-purple-600" />
                By Status
              </h3>
              <div className="space-y-3">
                {data.requestsByStatus
                  .sort((a, b) => b.count - a.count)
                  .map((item) => {
                    const config = statusConfig[item.status] || {
                      label: item.status,
                      color: 'bg-gray-500'
                    }
                    const percentage =
                      data.overview.totalRequests > 0
                        ? (item.count / data.overview.totalRequests) * 100
                        : 0
                    return (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${config.color}`} />
                          <span className="text-sm text-gray-700">{config.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                          <span className="text-sm font-medium text-gray-900 w-10 text-right">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                {data.requestsByStatus.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No requests in this period</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Top Businesses by Service Requests
                </h3>
              </div>
              {data.topBusinesses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Business
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Requests
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.topBusinesses.map((business, index) => (
                        <tr key={business.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/superadmin/businesses/${business.id}`}
                              className="text-sm font-medium text-gray-900 hover:text-teal-600 flex items-center gap-1"
                            >
                              {business.name}
                              <ArrowUpRight className="w-3 h-3 text-gray-400" />
                            </Link>
                            <p className="text-xs text-gray-500">{business.slug}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                              {businessTypeLabels[business.businessType] || business.businessType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {business.requestCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No requests in this period</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  No Requests
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  SERVICES businesses with no requests in this period
                </p>
              </div>
              {data.businessesWithNoRequests.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {data.businessesWithNoRequests.map((business) => (
                    <Link
                      key={business.id}
                      href={`/superadmin/businesses/${business.id}`}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{business.name}</p>
                          <p className="text-xs text-gray-500">
                            {businessTypeLabels[business.businessType] || business.businessType}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Created</p>
                          <p className="text-xs text-gray-500">{formatDate(business.createdAt)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-300" />
                  <p className="text-sm">All SERVICES businesses have requests</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
