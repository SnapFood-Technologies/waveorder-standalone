// src/components/superadmin/ExternalSyncLogs.tsx
'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, MoreVertical, X, Check } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface SyncLog {
  id: string
  syncId: string
  businessId: string
  status: 'success' | 'failed' | 'partial' | 'running'
  error?: string | null
  processedCount: number
  skippedCount: number
  errorCount: number
  currentPage?: number | null
  totalPages?: number | null
  perPage?: number | null
  syncAllPages: boolean
  startedAt: string
  completedAt?: string | null
  duration?: number | null
  metadata?: any
  sync: {
    id: string
    name: string
    externalSystemName?: string | null
  }
}

interface ExternalSyncLogsProps {
  businessId: string
  syncId?: string // Optional: filter by specific sync
}

export function ExternalSyncLogs({ businessId, syncId }: ExternalSyncLogsProps) {
  const [logs, setLogs] = useState<SyncLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    logId: string
    newStatus: 'failed' | 'success'
    logName: string
  } | null>(null)
  const [updating, setUpdating] = useState(false)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({ limit: '50' })
      if (syncId) {
        params.append('syncId', syncId)
      }
      
      const response = await fetch(`/api/superadmin/businesses/${businessId}/external-syncs/logs?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch sync logs')
      }
      
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sync logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    
    // Auto-refresh every 10 seconds if there are running syncs
    const interval = setInterval(() => {
      fetchLogs()
    }, 10000)
    
    return () => clearInterval(interval)
  }, [businessId, syncId])

  const updateLogStatus = async (logId: string, newStatus: 'failed' | 'success') => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/superadmin/businesses/${businessId}/external-syncs/logs/${logId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update log status')
      }

      // Refresh logs
      await fetchLogs()
      setConfirmModal(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update log status')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (ms: number | null | undefined) => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${Math.round(ms / 1000)}s`
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.round((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  if (loading && logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Sync History</h3>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {logs.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No sync history available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sync
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Results
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{log.sync.name}</div>
                    {log.sync.externalSystemName && (
                      <div className="text-xs text-gray-500">{log.sync.externalSystemName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(log.status)}`}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      {log.error && (
                        <div className="text-xs text-red-600 max-w-md break-words" title={log.error}>
                          {log.error}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="space-y-1">
                      <div className="flex items-center gap-4">
                        <div>Processed: <span className="font-medium text-gray-900">{log.processedCount}</span></div>
                        {log.skippedCount > 0 && (
                          <div className="text-gray-600">Skipped: <span className="font-medium">{log.skippedCount}</span></div>
                        )}
                        {log.errorCount > 0 && (
                          <div className="text-red-600">Errors: <span className="font-medium">{log.errorCount}</span></div>
                        )}
                      </div>
                      {(log.currentPage || log.perPage) && (
                        <div className="text-xs text-gray-500 space-x-2">
                          {log.currentPage && (
                            <span>
                              Page {log.currentPage}
                              {log.totalPages ? ` of ${log.totalPages}` : ''}
                            </span>
                          )}
                          {log.perPage && (
                            <span>• {log.perPage} per page</span>
                          )}
                          {log.syncAllPages && (
                            <span className="text-blue-600">• All pages</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.status === 'running' ? (
                      <span className="text-blue-600">Running...</span>
                    ) : (
                      formatDuration(log.duration)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="font-medium">{formatDistanceToNow(new Date(log.startedAt), { addSuffix: true })}</div>
                      <div className="text-xs text-gray-400">
                        Started: {new Date(log.startedAt).toLocaleString()}
                      </div>
                      {log.completedAt && (
                        <div className="text-xs text-gray-400">
                          Completed: {new Date(log.completedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.status === 'running' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setConfirmModal({
                            logId: log.id,
                            newStatus: 'failed',
                            logName: log.sync.name
                          })}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 hover:border-red-300 transition-colors"
                          title="Mark as Failed"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmModal({
                            logId: log.id,
                            newStatus: 'success',
                            logName: log.sync.name
                          })}
                          className="px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded border border-green-200 hover:border-green-300 transition-colors"
                          title="Mark as Completed"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Status Change
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to mark this sync log as <strong>{confirmModal.newStatus === 'failed' ? 'FAILED' : 'COMPLETED'}</strong>?
              <br />
              <span className="text-xs text-gray-500 mt-2 block">
                Sync: {confirmModal.logName}
              </span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal(null)}
                disabled={updating}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => updateLogStatus(confirmModal.logId, confirmModal.newStatus)}
                disabled={updating}
                className={`px-4 py-2 text-sm text-white rounded-lg transition-colors disabled:opacity-50 ${
                  confirmModal.newStatus === 'failed'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {updating ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
