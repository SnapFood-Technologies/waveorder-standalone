'use client'

import { useState, useEffect } from 'react'
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Building2,
  Hash,
  XCircle,
  ArrowUpRight,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

// Types
interface Summary {
  totalSearches: number
  uniqueTerms: number
  zeroResultSearches: number
  zeroResultRate: string
  businessesWithSearches: number
}

interface SearchTerm {
  term: string
  count: number
  avgResults: number
}

interface ZeroResultTerm {
  term: string
  count: number
}

interface DayItem {
  date: string
  count: number
}

interface BusinessSearchStats {
  businessId: string
  businessName: string
  businessSlug: string
  businessType: string
  totalSearches: number
  uniqueTerms: number
  zeroResults: number
  topTerms: SearchTerm[]
}

interface GeneralData {
  summary: Summary
  topSearchTerms: SearchTerm[]
  zeroResultTerms: ZeroResultTerm[]
  searchTrend: DayItem[]
  perBusinessStats: BusinessSearchStats[]
}

const businessTypeLabels: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  CAFE: 'Cafe',
  RETAIL: 'Retail',
  JEWELRY: 'Jewelry',
  FLORIST: 'Florist',
  GROCERY: 'Grocery',
  BAKERY: 'Bakery',
  OTHER: 'Other'
}

export default function OperationsGeneralPage() {
  const [data, setData] = useState<GeneralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [period, setPeriod] = useState('last_30_days')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ period })
      const response = await fetch(`/api/superadmin/operations/general?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch data')
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getPeriodLabel = () => {
    const labels: Record<string, string> = {
      today: 'Today',
      this_week: 'This Week',
      last_7_days: 'Last 7 Days',
      last_30_days: 'Last 30 Days',
      last_90_days: 'Last 90 Days'
    }
    return labels[period] || 'Last 30 Days'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">General Analytics</h1>
          <p className="text-gray-600 mt-1">Platform-wide search analytics across all businesses</p>
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

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="last_7_days">Last 7 Days</option>
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
          <p className="text-gray-600">Loading search analytics...</p>
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
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Searches</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.totalSearches.toLocaleString()}</p>
                </div>
                <Search className="w-8 h-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unique Terms</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.uniqueTerms.toLocaleString()}</p>
                </div>
                <Hash className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Zero Results</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.zeroResultSearches.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{data.summary.zeroResultRate}% of searches</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Businesses</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary.businessesWithSearches}</p>
                  <p className="text-xs text-gray-500 mt-1">with search activity</p>
                </div>
                <Building2 className="w-8 h-8 text-teal-400" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg per Business</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.summary.businessesWithSearches > 0
                      ? (data.summary.totalSearches / data.summary.businessesWithSearches).toFixed(1)
                      : '0'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">searches / business</p>
                </div>
                <BarChart3 className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Search Trend Chart */}
          {data.searchTrend.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Searches by Day (Last 7 Days)
              </h3>
              <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
                {(() => {
                  const chartHeight = 100
                  const maxCount = Math.max(...data.searchTrend.map(d => d.count))

                  return data.searchTrend.map((item) => {
                    const heightPx = maxCount > 0
                      ? Math.max((item.count / maxCount) * chartHeight, item.count > 0 ? 4 : 2)
                      : 2
                    const date = new Date(item.date)

                    return (
                      <div key={item.date} className="flex flex-col items-center flex-1">
                        <span className="text-xs text-gray-600 mb-1">{item.count.toLocaleString()}</span>
                        <div
                          className="w-full bg-purple-500 rounded-t-sm"
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

          {/* Top Search Terms & Zero Result Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Search Terms */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Top Search Terms ({getPeriodLabel()})
              </h3>
              {data.topSearchTerms.length > 0 ? (
                <div className="space-y-2">
                  {data.topSearchTerms.map((term, index) => {
                    const maxCount = data.topSearchTerms[0]?.count || 1
                    const barWidth = (term.count / maxCount) * 100

                    return (
                      <div key={term.term} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-5 text-right">{index + 1}.</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 font-medium">{term.term}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{term.avgResults} avg results</span>
                              <span className="text-sm font-medium text-gray-900">{term.count}</span>
                            </div>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No search data in this period</p>
              )}
            </div>

            {/* Zero Result Terms */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-600" />
                Zero Result Searches
              </h3>
              <p className="text-xs text-gray-500 mb-4">Terms customers searched but found no results</p>
              {data.zeroResultTerms.length > 0 ? (
                <div className="space-y-2">
                  {data.zeroResultTerms.map((term, index) => {
                    const maxCount = data.zeroResultTerms[0]?.count || 1
                    const barWidth = (term.count / maxCount) * 100

                    return (
                      <div key={term.term} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-5 text-right">{index + 1}.</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700 font-medium">{term.term}</span>
                            <span className="text-sm font-medium text-red-600">{term.count}</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-400 rounded-full"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <XCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No zero-result searches</p>
                </div>
              )}
            </div>
          </div>

          {/* Per-Business Search Analytics */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                Search Analytics by Business
              </h3>
              <p className="text-sm text-gray-500 mt-1">Search activity breakdown per business ({getPeriodLabel()})</p>
            </div>

            {data.perBusinessStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Searches</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unique Terms</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Zero Results</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Top Terms</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.perBusinessStats.map((business, index) => (
                      <tr key={business.businessId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/superadmin/businesses/${business.businessId}`}
                            className="text-sm font-medium text-gray-900 hover:text-teal-600 flex items-center gap-1"
                          >
                            {business.businessName}
                            <ArrowUpRight className="w-3 h-3 text-gray-400" />
                          </Link>
                          <p className="text-xs text-gray-500">{business.businessSlug}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            {businessTypeLabels[business.businessType] || business.businessType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {business.totalSearches.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-right">
                          {business.uniqueTerms}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {business.zeroResults > 0 ? (
                            <span className="text-sm font-medium text-red-600">{business.zeroResults}</span>
                          ) : (
                            <span className="text-sm text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {business.topTerms.slice(0, 3).map((term) => (
                              <span
                                key={term.term}
                                className="inline-flex items-center px-2 py-0.5 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700"
                              >
                                {term.term} <span className="ml-1 text-purple-400">({term.count})</span>
                              </span>
                            ))}
                            {business.topTerms.length === 0 && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No search activity in this period</p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
