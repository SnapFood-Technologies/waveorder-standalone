'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Filter,
  Calendar,
  MapPin,
  Globe,
  Server,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  ShoppingCart,
  Eye,
  TrendingUp,
  BarChart3,
  PieChart
} from 'lucide-react'

interface SystemLog {
  id: string
  logType: string
  severity: 'error' | 'warning' | 'info'
  slug?: string
  businessId?: string
  business?: {
    id: string
    name: string
    slug: string
  }
  endpoint: string
  method: string
  statusCode?: number
  errorMessage?: string
  errorStack?: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
  url: string
  country?: string
  city?: string
  region?: string
  metadata?: any
  createdAt: string
}

interface LogsResponse {
  logs: SystemLog[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: {
    total: number
    errors: number
    warnings: number
    info: number
    storefront404s: number
  }
  analytics: {
    logTypeDistribution: Array<{ logType: string; count: number }>
    orderStats: { created: number; errors: number; total: number }
    storefrontStats: { success: number; errors: number; notFound: number; total: number }
    topSlugsByLogs: Array<{ slug: string; count: number }>
    logsByDay: Array<{ date: string; count: number }>
  }
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<LogsResponse['stats'] | null>(null)
  const [pagination, setPagination] = useState<LogsResponse['pagination'] | null>(null)
  const [analytics, setAnalytics] = useState<LogsResponse['analytics'] | null>(null)
  
  // Filters
  const [filters, setFilters] = useState({
    logType: '',
    severity: '',
    slug: '',
    businessId: '',
    statusCode: '',
    startDate: '',
    endDate: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchLogs()
  }, [currentPage, filters])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      })
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        }
      })
      
      const response = await fetch(`/api/superadmin/system/logs?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch logs')
      }
      
      const data: LogsResponse = await response.json()
      setLogs(data.logs)
      setStats(data.stats)
      setPagination(data.pagination)
      setAnalytics(data.analytics)
    } catch (err: any) {
      setError(err.message || 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const clearFilters = () => {
    setFilters({
      logType: '',
      severity: '',
      slug: '',
      businessId: '',
      statusCode: '',
      startDate: '',
      endDate: ''
    })
    setCurrentPage(1)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLogTypeLabel = (logType: string) => {
    const labels: Record<string, string> = {
      storefront_404: 'Storefront 404',
      storefront_error: 'Storefront Error',
      storefront_success: 'Storefront Success',
      products_error: 'Products Error',
      order_created: 'Order Created',
      order_error: 'Order Error',
      system_error: 'System Error',
      trial_error: 'Trial Error',
      trial_start_error: 'Trial Start Error',
      admin_action: 'Admin Action',
      subscription_error: 'Subscription Error',
      checkout_error: 'Checkout Error',
      client_error: 'Client Error'
    }
    return labels[logType] || logType
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
        <p className="text-gray-600 mt-1">Monitor storefront errors, 404s, and system events</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{stats.errors.toLocaleString()}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-amber-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-amber-600">{stats.warnings.toLocaleString()}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Info</p>
                <p className="text-2xl font-bold text-blue-600">{stats.info.toLocaleString()}</p>
              </div>
              <Info className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-purple-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">404 Errors</p>
                <p className="text-2xl font-bold text-purple-600">{stats.storefront404s.toLocaleString()}</p>
              </div>
              <Server className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2">
            {(filters.logType || filters.severity || filters.slug || filters.statusCode || filters.startDate || filters.endDate) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            )}
            <button
              onClick={fetchLogs}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Log Type</label>
              <select
                value={filters.logType}
                onChange={(e) => setFilters({ ...filters, logType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Types</option>
                <optgroup label="Storefront">
                  <option value="storefront_success">Storefront Success</option>
                  <option value="storefront_404">Storefront 404</option>
                  <option value="storefront_error">Storefront Error</option>
                  <option value="products_error">Products Error</option>
                </optgroup>
                <optgroup label="Orders">
                  <option value="order_created">Order Created</option>
                  <option value="order_error">Order Error</option>
                </optgroup>
                <optgroup label="Onboarding">
                  <option value="trial_error">Trial Error</option>
                  <option value="trial_start_error">Trial Start Error</option>
                  <option value="subscription_error">Subscription Error</option>
                  <option value="checkout_error">Checkout Error</option>
                </optgroup>
                <optgroup label="System">
                  <option value="system_error">System Error</option>
                  <option value="client_error">Client Error</option>
                </optgroup>
                <optgroup label="Admin">
                  <option value="admin_action">Admin Action</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Severities</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input
                type="text"
                value={filters.slug}
                onChange={(e) => setFilters({ ...filters, slug: e.target.value })}
                placeholder="e.g., bybest-shop"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Code</label>
              <input
                type="number"
                value={filters.statusCode}
                onChange={(e) => setFilters({ ...filters, statusCode: e.target.value })}
                placeholder="e.g., 404"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading logs...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchLogs}
              className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {logs.map((log) => (
                    <>
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {getLogTypeLabel(log.logType)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getSeverityColor(log.severity)}`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {log.slug || '-'}
                          {log.business && (
                            <div className="text-xs text-gray-500 mt-0.5">{log.business.name}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {log.statusCode ? (
                            <span className={`font-medium ${
                              log.statusCode >= 500 ? 'text-red-600' :
                              log.statusCode >= 400 ? 'text-amber-600' :
                              'text-green-600'
                            }`}>
                              {log.statusCode}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.city && log.country ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {log.city}, {log.country}
                            </div>
                          ) : log.ipAddress ? (
                            <div className="text-xs text-gray-500">{log.ipAddress}</div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleLogExpansion(log.id)}
                            className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                          >
                            {expandedLogs.has(log.id) ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      {/* Expanded Log Details - directly below the row */}
                      {expandedLogs.has(log.id) && (
                        <tr key={`details-${log.id}`}>
                          <td colSpan={7} className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-gray-900 mb-2">Request Details</p>
                                <div className="space-y-1 text-gray-600">
                                  <p><span className="font-medium">Endpoint:</span> {log.endpoint}</p>
                                  <p><span className="font-medium">Method:</span> {log.method}</p>
                                  <p><span className="font-medium">URL:</span> <span className="text-xs break-all">{log.url}</span></p>
                                  {log.ipAddress && <p><span className="font-medium">IP:</span> {log.ipAddress}</p>}
                                  {log.referrer && <p><span className="font-medium">Referrer:</span> <span className="text-xs break-all">{log.referrer}</span></p>}
                                </div>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 mb-2">Error Details</p>
                                <div className="space-y-1 text-gray-600">
                                  {log.errorMessage && (
                                    <p><span className="font-medium">Message:</span> {log.errorMessage}</p>
                                  )}
                                  {log.errorStack && (
                                    <div>
                                      <p className="font-medium mb-1">Stack Trace:</p>
                                      <pre className="text-xs bg-gray-800 text-gray-100 p-2 rounded overflow-x-auto max-h-40">
                                        {log.errorStack}
                                      </pre>
                                    </div>
                                  )}
                                  {log.metadata && (
                                    <div>
                                      <p className="font-medium mb-1">Metadata:</p>
                                      <pre className="text-xs bg-gray-800 text-gray-100 p-2 rounded overflow-x-auto max-h-40">
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pagination.limit + 1} to {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} logs
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Analytics Section */}
      {analytics && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-teal-600" />
              Log Analytics
            </h2>
            <p className="text-gray-600 text-sm mt-1">Insights and distribution of system logs</p>
          </div>

          {/* Storefront vs Orders Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Storefront Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Storefront Activity
                </h3>
                <span className="text-2xl font-bold text-gray-900">{analytics.storefrontStats.total.toLocaleString()}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Successful Loads</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: `${analytics.storefrontStats.total > 0 ? (analytics.storefrontStats.success / analytics.storefrontStats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">{analytics.storefrontStats.success.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span 
                    className="text-sm text-gray-600 cursor-help border-b border-dotted border-gray-400"
                    title="Includes bot probes, hack attempts, and invalid URLs. Not all are real store lookups."
                  >
                    404 Not Found *
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${analytics.storefrontStats.total > 0 ? (analytics.storefrontStats.notFound / analytics.storefrontStats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">{analytics.storefrontStats.notFound.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">* May include bot probes, hack attempts, and noisy traffic</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Errors</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full" 
                        style={{ width: `${analytics.storefrontStats.total > 0 ? (analytics.storefrontStats.errors / analytics.storefrontStats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">{analytics.storefrontStats.errors.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              {analytics.storefrontStats.total > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    Success Rate: <span className="font-semibold text-green-600">
                      {((analytics.storefrontStats.success / analytics.storefrontStats.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Order Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-teal-600" />
                  Order Activity
                </h3>
                <span className="text-2xl font-bold text-gray-900">{analytics.orderStats.total.toLocaleString()}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Orders Created</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full" 
                        style={{ width: `${analytics.orderStats.total > 0 ? (analytics.orderStats.created / analytics.orderStats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">{analytics.orderStats.created.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Order Errors</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full" 
                        style={{ width: `${analytics.orderStats.total > 0 ? (analytics.orderStats.errors / analytics.orderStats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">{analytics.orderStats.errors.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              {analytics.orderStats.total > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    Success Rate: <span className="font-semibold text-teal-600">
                      {((analytics.orderStats.created / analytics.orderStats.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Log Type Distribution & Top Stores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Log Type Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-purple-600" />
                Log Type Distribution
              </h3>
              <div className="space-y-3">
                {analytics.logTypeDistribution.slice(0, 8).map((item, index) => {
                  const total = analytics.logTypeDistribution.reduce((sum, i) => sum + i.count, 0)
                  const percentage = total > 0 ? (item.count / total) * 100 : 0
                  const colors = [
                    'bg-teal-500', 'bg-blue-500', 'bg-amber-500', 'bg-red-500',
                    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-green-500'
                  ]
                  return (
                    <div key={item.logType} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`} />
                        <span className="text-sm text-gray-700">{getLogTypeLabel(item.logType)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                        <span className="text-sm font-medium text-gray-900 w-16 text-right">{item.count.toLocaleString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top Stores by Activity (Last 7 Days) */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                Most Active Stores (Last 7 Days)
              </h3>
              {analytics.topSlugsByLogs.length > 0 ? (
                <div className="space-y-3">
                  {analytics.topSlugsByLogs.map((item, index) => {
                    const maxCount = analytics.topSlugsByLogs[0]?.count || 1
                    const percentage = (item.count / maxCount) * 100
                    return (
                      <div key={item.slug} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-4">{index + 1}.</span>
                          <span className="text-sm text-gray-700 font-medium truncate max-w-[150px]">{item.slug}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-500 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.count.toLocaleString()}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No store activity in the last 7 days</p>
              )}
            </div>
          </div>

          {/* Logs by Day Chart */}
          {analytics.logsByDay.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Logs by Day (Last 7 Days)
              </h3>
              <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
                {(() => {
                  const chartHeight = 100 // pixels for bar area
                  const maxCount = Math.max(...analytics.logsByDay.map(d => d.count))
                  
                  return analytics.logsByDay.slice().reverse().map((item) => {
                    // Calculate height in pixels (not percentage) for accurate rendering
                    const heightPx = maxCount > 0 
                      ? Math.max((item.count / maxCount) * chartHeight, item.count > 0 ? 4 : 2)
                      : 2
                    const date = new Date(item.date)
                    
                    return (
                      <div key={item.date} className="flex flex-col items-center flex-1">
                        <span className="text-xs text-gray-600 mb-1">{item.count.toLocaleString()}</span>
                        <div 
                          className="w-full bg-indigo-500 rounded-t-sm" 
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
        </div>
      )}
    </div>
  )
}
