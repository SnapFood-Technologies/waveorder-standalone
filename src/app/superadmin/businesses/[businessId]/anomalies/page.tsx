'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  PlayCircle,
  Eye,
  XCircle,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface Anomaly {
  id: string
  type: string
  severity: string
  status: string
  title: string
  description: string
  entityType?: string | null
  entityId?: string | null
  entityName?: string | null
  resolvedAt?: string | null
  resolvedBy?: string | null
  detectedAt: string
  lastChecked: string
  createdAt: string
  updatedAt: string
}

interface Business {
  id: string
  name: string
}

interface StatusCounts {
  total: number
  open: number
  resolved: number
  ignored: number
}

export default function AnomaliesPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [counts, setCounts] = useState<StatusCounts>({ total: 0, open: 0, resolved: 0, ignored: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [detectionResult, setDetectionResult] = useState<{
    success: boolean
    message: string
    detectedAnomalies?: Anomaly[]
    counts?: StatusCounts
  } | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('OPEN')

  useEffect(() => {
    fetchBusiness()
    fetchAnomalies()
  }, [businessId, statusFilter])

  const fetchBusiness = async () => {
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusiness(data.business)
      }
    } catch (err) {
      console.error('Failed to fetch business:', err)
    }
  }

  const fetchAnomalies = async () => {
    try {
      setLoading(true)
      setError(null)
      const url = `/api/superadmin/businesses/${businessId}/anomalies${statusFilter ? `?status=${statusFilter}` : ''}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch anomalies')
      }
      const data = await response.json()
      setAnomalies(data.anomalies || [])
      setCounts(data.counts || { total: 0, open: 0, resolved: 0, ignored: 0 })
    } catch (err: any) {
      setError(err.message || 'Failed to load anomalies')
    } finally {
      setLoading(false)
    }
  }

  const handleRunDetection = async () => {
    try {
      setDetecting(true)
      setDetectionResult(null)
      const response = await fetch(`/api/superadmin/businesses/${businessId}/anomalies/detect`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to run anomaly detection')
      }

      const result = await response.json()
      setDetectionResult({
        success: result.success,
        message: result.message,
        detectedAnomalies: result.detectedAnomalies,
        counts: result.counts
      })
      
      // Refresh anomalies list
      fetchAnomalies()
    } catch (err: any) {
      setDetectionResult({
        success: false,
        message: err.message || 'Failed to run anomaly detection'
      })
    } finally {
      setDetecting(false)
    }
  }

  const handleUpdateStatus = async (anomalyId: string, status: string) => {
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/anomalies`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomalyId, status })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update anomaly')
      }
      
      // Refresh anomalies
      fetchAnomalies()
      setSelectedAnomaly(null)
    } catch (err: any) {
      setError(err.message || 'Failed to update anomaly')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertTriangle className="w-4 h-4" />
      case 'HIGH': return <AlertCircle className="w-4 h-4" />
      case 'MEDIUM': return <Clock className="w-4 h-4" />
      case 'LOW': return <TrendingUp className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  if (loading && !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const handleExportCSV = () => {
    // Prepare CSV data
    const headers = ['Type', 'Severity', 'Status', 'Title', 'Description', 'Entity Type', 'Entity Name', 'Detected At', 'Resolved At']
    const rows = anomalies.map(anomaly => [
      anomaly.type.replace(/_/g, ' '),
      anomaly.severity,
      anomaly.status,
      anomaly.title,
      anomaly.description,
      anomaly.entityType || '',
      anomaly.entityName || '',
      formatDate(anomaly.detectedAt),
      anomaly.resolvedAt ? formatDate(anomaly.resolvedAt) : ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `anomalies_${business?.name || 'business'}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/superadmin/businesses/${businessId}`}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                Anomalies {business && <span className="text-gray-500">- {business.name}</span>}
              </h1>
              <p className="text-sm text-gray-600 mt-1">Detect and manage data quality issues</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              disabled={anomalies.length === 0}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={handleRunDetection}
              disabled={detecting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {detecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Run Check
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Issues</p>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{counts.total}</p>
          <p className="text-xs text-gray-500 mt-1">All detected anomalies</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-orange-700 uppercase tracking-wider">Open</p>
            <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-900">{counts.open}</p>
          <p className="text-xs text-orange-600 mt-1">Requires attention</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-green-700 uppercase tracking-wider">Resolved</p>
            <div className="w-8 h-8 bg-white/80 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-900">{counts.resolved}</p>
          <p className="text-xs text-green-600 mt-1">Successfully fixed</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ignored</p>
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-4 h-4 text-gray-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-700">{counts.ignored}</p>
          <p className="text-xs text-gray-500 mt-1">Acknowledged issues</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {[
            { value: '', label: 'All' },
            { value: 'OPEN', label: 'Open' },
            { value: 'RESOLVED', label: 'Resolved' },
            { value: 'IGNORED', label: 'Ignored' }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === tab.value
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Detection Result */}
      {detectionResult && (
        <div className={`p-4 rounded-lg border-2 ${
          detectionResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            {detectionResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
            <p className="font-semibold text-gray-900">{detectionResult.message}</p>
          </div>
          <button
            onClick={() => setDetectionResult(null)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Content */}
      <div>
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading anomalies...</p>
          </div>
        ) : anomalies.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Anomalies Found</h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'OPEN' 
                ? 'Great! No open issues detected.' 
                : 'No anomalies match the selected filter.'}
            </p>
            <button
              onClick={handleRunDetection}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Run Detection
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anomaly
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detected
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {anomalies.map((anomaly) => (
                  <tr key={anomaly.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{anomaly.title}</div>
                      {anomaly.entityName && (
                        <div className="text-xs text-gray-500 mt-1">
                          {anomaly.entityType}: {anomaly.entityName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${getSeverityColor(anomaly.severity)}`}>
                        {getSeverityIcon(anomaly.severity)}
                        {anomaly.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        anomaly.status === 'OPEN'
                          ? 'bg-orange-100 text-orange-800'
                          : anomaly.status === 'RESOLVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {anomaly.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(anomaly.detectedAt)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedAnomaly(anomaly)}
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"
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
      </div>

      {/* Anomaly Details Modal */}
      {selectedAnomaly && (
        <AnomalyDetailsModal
          anomaly={selectedAnomaly}
          onClose={() => setSelectedAnomaly(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  )
}

// Anomaly Details Modal Component
interface AnomalyDetailsModalProps {
  anomaly: Anomaly
  onClose: () => void
  onUpdateStatus: (anomalyId: string, status: string) => void
}

function AnomalyDetailsModal({ anomaly, onClose, onUpdateStatus }: AnomalyDetailsModalProps) {
  const [updating, setUpdating] = useState(false)

  const handleStatusChange = async (status: string) => {
    setUpdating(true)
    await onUpdateStatus(anomaly.id, status)
    setUpdating(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-50'
      case 'HIGH': return 'text-orange-600 bg-orange-50'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50'
      case 'LOW': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Anomaly Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className={`p-4 rounded-lg ${getSeverityColor(anomaly.severity)}`}>
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-semibold">{anomaly.title}</h3>
            </div>
            <p className="text-sm">{anomaly.description}</p>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Type</p>
                <p className="text-sm text-gray-900 mt-1">{anomaly.type.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Severity</p>
                <p className="text-sm text-gray-900 mt-1">{anomaly.severity}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-sm text-gray-900 mt-1">{anomaly.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Detected</p>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(anomaly.detectedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {anomaly.entityName && (
              <div>
                <p className="text-sm font-medium text-gray-500">Affected {anomaly.entityType}</p>
                <p className="text-sm text-gray-900 mt-1">{anomaly.entityName}</p>
              </div>
            )}

            {anomaly.resolvedAt && (
              <div>
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(anomaly.resolvedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {anomaly.status === 'OPEN' && (
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleStatusChange('RESOLVED')}
                  disabled={updating}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Mark as Resolved
                </button>
                <button
                  onClick={() => handleStatusChange('IGNORED')}
                  disabled={updating}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Ignore
                </button>
              </div>
            </div>
          )}

          {anomaly.status !== 'OPEN' && (
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => handleStatusChange('OPEN')}
                disabled={updating}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                Reopen
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
