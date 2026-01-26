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
  X
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
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<LogsResponse['stats'] | null>(null)
  const [pagination, setPagination] = useState<LogsResponse['pagination'] | null>(null)
  
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
      products_error: 'Products Error',
      system_error: 'System Error',
      storefront_success: 'Storefront Success'
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
                <option value="storefront_404">Storefront 404</option>
                <option value="storefront_error">Storefront Error</option>
                <option value="products_error">Products Error</option>
                <option value="system_error">System Error</option>
                <option value="storefront_success">Storefront Success</option>
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Expanded Log Details */}
            {logs.map((log) => (
              expandedLogs.has(log.id) && (
                <div key={`details-${log.id}`} className="border-t border-gray-200 bg-gray-50 p-4">
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
                </div>
              )
            ))}

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
    </div>
  )
}
