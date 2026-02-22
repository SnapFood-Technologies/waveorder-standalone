'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  Globe,
  MapPin,
  Server,
  Bug,
  FileCode,
  Image,
  KeyRound,
  Terminal,
  Folder,
  ChevronDown,
  ChevronUp,
  Filter,
  X
} from 'lucide-react'

interface ScannerLog {
  id: string
  slug: string | null
  ipAddress: string | null
  userAgent: string | null
  country: string | null
  city: string | null
  url: string
  category: string
  createdAt: string
}

interface ScannerResponse {
  logs: ScannerLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    total: number
    byCategory: Array<{ category: string; count: number }>
    topTargetedSlugs: Array<{ slug: string; count: number }>
    topSourceIPs: Array<{ ip: string; count: number }>
    topCountries: Array<{ country: string; count: number }>
    dailyTrend: Array<{ date: string; count: number }>
  }
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
  wordpress: { label: 'WordPress Probes', icon: Bug, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  server_probe: { label: 'Server Script Probes', icon: Terminal, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  config_file: { label: 'Config File Access', icon: KeyRound, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  asset_probe: { label: 'Asset/Favicon Probes', icon: Image, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  admin_panel: { label: 'Admin Panel Probes', icon: Server, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  path_traversal: { label: 'Path Traversal', icon: Folder, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  other: { label: 'Other', icon: FileCode, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
}

export default function ScannerTrafficPage() {
  const [data, setData] = useState<ScannerResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [currentPage, categoryFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
      })
      if (categoryFilter) params.set('category', categoryFilter)

      const response = await fetch(`/api/superadmin/system/scanner-traffic?${params}`)
      if (!response.ok) throw new Error('Failed to fetch scanner traffic')
      const result: ScannerResponse = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Failed to load scanner traffic')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const toggleExpand = (id: string) => {
    const next = new Set(expandedLogs)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setExpandedLogs(next)
  }

  const getCategoryConfig = (cat: string) => CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={fetchData} className="mt-3 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
          Retry
        </button>
      </div>
    )
  }

  const stats = data?.stats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/superadmin/system/logs"
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-orange-500" />
              Scanner Traffic
            </h1>
          </div>
          <p className="text-gray-600 mt-1 ml-10">
            Bot probes, vulnerability scanners, and spam 404 requests filtered from main logs
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Total Blocked</p>
                <p className="text-3xl font-bold text-orange-900">{stats.total.toLocaleString()}</p>
              </div>
              <ShieldAlert className="w-10 h-10 text-orange-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique IPs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.topSourceIPs.length}</p>
              </div>
              <Globe className="w-10 h-10 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unique Targets</p>
                <p className="text-3xl font-bold text-gray-900">{stats.topTargetedSlugs.length}</p>
              </div>
              <Server className="w-10 h-10 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Countries</p>
                <p className="text-3xl font-bold text-gray-900">{stats.topCountries.length}</p>
              </div>
              <MapPin className="w-10 h-10 text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown + Top Targets */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attack Categories */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attack Categories</h3>
            <div className="space-y-3">
              {stats.byCategory.map(({ category, count }) => {
                const config = getCategoryConfig(category)
                const IconComp = config.icon
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <button
                    key={category}
                    onClick={() => {
                      setCategoryFilter(categoryFilter === category ? '' : category)
                      setCurrentPage(1)
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      categoryFilter === category
                        ? `${config.bgColor} ${config.borderColor} ring-1 ring-offset-1`
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded ${config.bgColor}`}>
                      <IconComp className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{config.label}</p>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                        <div
                          className={`h-full rounded-full ${config.bgColor.replace('50', '400')}`}
                          style={{ width: `${pct}%`, backgroundColor: `var(--tw-${config.color.replace('text-', '')})` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{count.toLocaleString()}</span>
                    <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
                  </button>
                )
              })}
            </div>
            {categoryFilter && (
              <button
                onClick={() => { setCategoryFilter(''); setCurrentPage(1) }}
                className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="w-3.5 h-3.5" /> Clear filter
              </button>
            )}
          </div>

          {/* Top Targeted Paths */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Targeted Paths</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats.topTargetedSlugs.map(({ slug, count }, i) => (
                <div key={slug} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs font-mono text-gray-400 w-5 text-right">{i + 1}</span>
                  <code className="text-sm bg-gray-100 px-2 py-0.5 rounded flex-1 truncate font-mono text-gray-700">
                    /{slug}
                  </code>
                  <span className="text-sm font-medium text-gray-600">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Source IPs + Countries */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Source IPs */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Source IPs</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {stats.topSourceIPs.map(({ ip, count }, i) => (
                <div key={ip} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs font-mono text-gray-400 w-5 text-right">{i + 1}</span>
                  <code className="text-sm bg-gray-100 px-2 py-0.5 rounded flex-1 truncate font-mono text-gray-700">
                    {ip}
                  </code>
                  <span className="text-sm font-medium text-gray-600">{count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Countries */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Source Countries</h3>
            <div className="space-y-2">
              {stats.topCountries.map(({ country, count }, i) => {
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <div key={country} className="flex items-center gap-3 py-1.5">
                    <span className="text-xs font-mono text-gray-400 w-5 text-right">{i + 1}</span>
                    <span className="text-sm text-gray-900 flex-1">{country}</span>
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-12 text-right">{count.toLocaleString()}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Daily Trend */}
      {stats && stats.dailyTrend.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Scanner Activity (Last 7 Days)</h3>
          <div className="flex items-end gap-2 h-32">
            {stats.dailyTrend.map(({ date, count }) => {
              const max = Math.max(...stats.dailyTrend.map(d => d.count), 1)
              const heightPct = (count / max) * 100
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-gray-600">{count}</span>
                  <div className="w-full bg-gray-100 rounded-t relative" style={{ height: '100px' }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-500 to-orange-300 rounded-t transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Log List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Scanner Requests
            {categoryFilter && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                — {getCategoryConfig(categoryFilter).label}
              </span>
            )}
          </h3>
          {data?.pagination && (
            <span className="text-sm text-gray-500">
              {data.pagination.total.toLocaleString()} entries
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.logs.map(log => {
                const config = getCategoryConfig(log.category)
                const IconComp = config.icon
                const isExpanded = expandedLogs.has(log.id)
                return (
                  <>
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                          <IconComp className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-sm font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                          /{log.slug}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {[log.city, log.country].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-gray-500">{log.ipAddress || '—'}</code>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleExpand(log.id)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${log.id}-details`} className="bg-gray-50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="text-xs space-y-1">
                            <p><span className="font-medium text-gray-500">URL:</span> <span className="font-mono">{log.url}</span></p>
                            <p><span className="font-medium text-gray-500">User Agent:</span> <span className="font-mono">{log.userAgent || '—'}</span></p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
              {(!data?.logs || data.logs.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    No scanner traffic found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
              {data.pagination.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(data!.pagination.totalPages, p + 1))}
                disabled={currentPage === data.pagination.totalPages}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
