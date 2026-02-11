'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Search, RefreshCw, Filter, ChevronLeft, ChevronRight,
  Eye, X, Clock, Globe, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

// ===========================================
// Types
// ===========================================
interface LogEntry {
  id: string
  integrationId: string
  businessId: string | null
  endpoint: string
  method: string
  statusCode: number
  requestBody: Record<string, unknown> | null
  responseBody: Record<string, unknown> | null
  ipAddress: string | null
  duration: number | null
  error: string | null
  createdAt: string
  integration: { id: string; name: string; slug: string }
  business?: { id: string; name: string; slug: string } | null
}

interface IntegrationOption {
  id: string
  name: string
  slug: string
}

interface StatusBreakdown {
  statusCode: number
  count: number
}

// ===========================================
// Component
// ===========================================
export default function IntegrationLogsPage() {
  // State
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [integrations, setIntegrations] = useState<IntegrationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 })
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([])

  // Filters
  const [integrationFilter, setIntegrationFilter] = useState('')
  const [statusCodeFilter, setStatusCodeFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)

  // ===========================================
  // Data fetching
  // ===========================================

  // Fetch integration options for the filter dropdown
  useEffect(() => {
    async function fetchIntegrations() {
      try {
        const res = await fetch('/api/superadmin/integrations')
        if (res.ok) {
          const data = await res.json()
          setIntegrations(
            data.integrations.map((i: IntegrationOption) => ({ id: i.id, name: i.name, slug: i.slug }))
          )
        }
      } catch {
        // Silently fail, dropdown will be empty
      }
    }
    fetchIntegrations()
  }, [])

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', pagination.limit.toString())

      if (integrationFilter) params.set('integrationId', integrationFilter)
      if (statusCodeFilter) params.set('statusCode', statusCodeFilter)
      if (methodFilter) params.set('method', methodFilter)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      const res = await fetch(`/api/superadmin/integrations/logs?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch logs')

      const data = await res.json()
      setLogs(data.logs)
      setPagination(data.pagination)
      setStatusBreakdown(data.stats?.statusBreakdown || [])
    } catch {
      toast.error('Failed to load integration logs')
    } finally {
      setLoading(false)
    }
  }, [integrationFilter, statusCodeFilter, methodFilter, dateFrom, dateTo, pagination.limit])

  useEffect(() => {
    fetchLogs(1)
  }, [fetchLogs])

  // ===========================================
  // Render helpers
  // ===========================================
  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-100 text-blue-700',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-yellow-100 text-yellow-700',
      DELETE: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium ${colors[method] || 'bg-gray-100 text-gray-700'}`}>
        {method}
      </span>
    )
  }

  const getStatusCodeBadge = (code: number) => {
    const color = code >= 200 && code < 300
      ? 'bg-green-100 text-green-700'
      : code >= 400 && code < 500
        ? 'bg-yellow-100 text-yellow-700'
        : code >= 500
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-700'
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium ${color}`}>
        {code}
      </span>
    )
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  // ===========================================
  // Render
  // ===========================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            Integration API Logs
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor all API calls made by external integrations
          </p>
        </div>
        <button
          onClick={() => fetchLogs(pagination.page)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors self-end"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status Breakdown Stats */}
      {statusBreakdown.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {statusBreakdown
            .sort((a, b) => b.count - a.count)
            .map((stat) => (
              <div
                key={stat.statusCode}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setStatusCodeFilter(stat.statusCode.toString())}
              >
                {getStatusCodeBadge(stat.statusCode)}
                <span className="text-gray-600 font-medium">{stat.count}</span>
              </div>
            ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-gray-200 flex flex-col sm:flex-row flex-wrap gap-3">
        <select
          value={integrationFilter}
          onChange={(e) => setIntegrationFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Integrations</option>
          {integrations.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Methods</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>

        <select
          value={statusCodeFilter}
          onChange={(e) => setStatusCodeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Status Codes</option>
          <option value="200">200 OK</option>
          <option value="400">400 Bad Request</option>
          <option value="401">401 Unauthorized</option>
          <option value="403">403 Forbidden</option>
          <option value="404">404 Not Found</option>
          <option value="409">409 Conflict</option>
          <option value="429">429 Rate Limited</option>
          <option value="500">500 Server Error</option>
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="From"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="To"
        />

        {(integrationFilter || statusCodeFilter || methodFilter || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setIntegrationFilter('')
              setStatusCodeFilter('')
              setMethodFilter('')
              setDateFrom('')
              setDateTo('')
            }}
            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No logs found</p>
            <p className="text-gray-400 text-sm mt-1">
              API calls from integrations will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Integration</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Endpoint</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Duration</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-700">{log.integration.name}</span>
                    </td>
                    <td className="px-4 py-3">{getMethodBadge(log.method)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-600 truncate block max-w-[250px]" title={log.endpoint}>
                        {log.endpoint}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusCodeBadge(log.statusCode)}</td>
                    <td className="px-4 py-3">
                      {log.business ? (
                        <span className="text-xs text-gray-600">{log.business.name}</span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">
                      {log.duration ? `${log.duration}ms` : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedLog(log)
                          setShowDetailModal(true)
                        }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 font-medium">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================= */}
      {/* Log Detail Modal */}
      {/* ========================================= */}
      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Log Detail</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Integration</p>
                  <p className="text-sm font-medium text-gray-900">{selectedLog.integration.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Timestamp</p>
                  <p className="text-sm text-gray-700">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Method & Endpoint</p>
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    {getMethodBadge(selectedLog.method)}
                    <code className="font-mono text-xs">{selectedLog.endpoint}</code>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status Code</p>
                  <p className="text-sm">{getStatusCodeBadge(selectedLog.statusCode)}</p>
                </div>
                {selectedLog.business && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Business</p>
                    <p className="text-sm text-gray-700">{selectedLog.business.name}</p>
                  </div>
                )}
                {selectedLog.duration && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Duration</p>
                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {selectedLog.duration}ms
                    </p>
                  </div>
                )}
                {selectedLog.ipAddress && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">IP Address</p>
                    <p className="text-sm text-gray-700 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      {selectedLog.ipAddress}
                    </p>
                  </div>
                )}
              </div>

              {/* Error */}
              {selectedLog.error && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Error</p>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {selectedLog.error}
                    </p>
                  </div>
                </div>
              )}

              {/* Request Body */}
              {selectedLog.requestBody && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Request Body</p>
                  <pre className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              {/* Response Body */}
              {selectedLog.responseBody && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Response Body</p>
                  <pre className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-700 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.responseBody, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end p-5 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
