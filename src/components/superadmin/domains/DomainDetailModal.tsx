'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Globe, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Shield,
  Server,
  Clock,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Calendar,
  Wifi,
  Lock
} from 'lucide-react'

// ===========================================
// Types
// ===========================================
interface DomainDiagnostics {
  domain: string
  business: {
    id: string
    name: string
    slug: string
  }
  currentStatus: string
  lastError: string | null
  provisionedAt: string | null
  lastChecked: string
  
  dns: {
    aRecords: {
      found: boolean
      records: string[]
      pointsToServer: boolean
      expectedIP: string
      error?: string
    }
    verification: {
      found: boolean
      valid: boolean
      expectedToken: string | null
      expiry: string | null
      isExpired: boolean
      error?: string
    }
  }
  
  ssl: {
    valid: boolean
    issuer?: string
    validFrom?: string
    validTo?: string
    daysRemaining?: number
    expiringWarning?: boolean
    error?: string
  }
  
  connectivity: {
    https: boolean
    latency?: number
    statusCode?: number
    error?: string
  }
  
  health: {
    dns: 'healthy' | 'unhealthy'
    ssl: 'healthy' | 'warning' | 'unhealthy'
    connectivity: 'healthy' | 'unhealthy'
  }
}

interface DomainDetailModalProps {
  domain: string
  onClose: () => void
  onRefresh?: () => void
}

// ===========================================
// Component
// ===========================================
export default function DomainDetailModal({ domain, onClose, onRefresh }: DomainDetailModalProps) {
  const [loading, setLoading] = useState(true)
  const [diagnostics, setDiagnostics] = useState<DomainDiagnostics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Fetch diagnostics
  const fetchDiagnostics = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/superadmin/domains/${encodeURIComponent(domain)}/check`)
      if (res.ok) {
        const data = await res.json()
        setDiagnostics(data)
      } else {
        const errData = await res.json()
        setError(errData.message || 'Failed to fetch diagnostics')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnostics()
  }, [domain])

  // Copy to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Health status icon
  const HealthIcon = ({ status }: { status: 'healthy' | 'warning' | 'unhealthy' }) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />
    }
  }

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      PENDING: 'bg-amber-100 text-amber-700',
      FAILED: 'bg-red-100 text-red-700'
    }
    return (
      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Globe className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{domain}</h2>
              <p className="text-sm text-gray-500">Domain Diagnostics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDiagnostics}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <span className="ml-3 text-gray-600">Running diagnostics...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <XCircle className="w-12 h-12 text-red-400 mb-3" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={fetchDiagnostics}
                className="mt-4 px-4 py-2 text-sm text-teal-600 hover:text-teal-700"
              >
                Try Again
              </button>
            </div>
          ) : diagnostics ? (
            <div className="space-y-6">
              {/* Overview Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    Business Info
                  </h3>
                  <StatusBadge status={diagnostics.currentStatus} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Business:</span>
                    <a 
                      href={`/superadmin/businesses/${diagnostics.business.id}`}
                      className="ml-2 text-teal-600 hover:underline"
                    >
                      {diagnostics.business.name}
                    </a>
                  </div>
                  <div>
                    <span className="text-gray-500">Slug:</span>
                    <span className="ml-2 font-mono text-gray-700">{diagnostics.business.slug}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Provisioned:</span>
                    <span className="ml-2">{formatDate(diagnostics.provisionedAt)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Checked:</span>
                    <span className="ml-2">{formatDate(diagnostics.lastChecked)}</span>
                  </div>
                </div>
                {diagnostics.lastError && (
                  <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                    <p className="text-sm text-red-600">
                      <strong>Last Error:</strong> {diagnostics.lastError}
                    </p>
                  </div>
                )}
              </div>

              {/* Health Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${
                  diagnostics.health.dns === 'healthy' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <HealthIcon status={diagnostics.health.dns} />
                    <span className="font-medium">DNS</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {diagnostics.health.dns === 'healthy' ? 'Properly configured' : 'Configuration issues'}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  diagnostics.health.ssl === 'healthy' ? 'bg-green-50 border-green-200' : 
                  diagnostics.health.ssl === 'warning' ? 'bg-amber-50 border-amber-200' : 
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <HealthIcon status={diagnostics.health.ssl} />
                    <span className="font-medium">SSL</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {diagnostics.health.ssl === 'healthy' ? 'Certificate valid' : 
                     diagnostics.health.ssl === 'warning' ? 'Expiring soon' : 
                     'Certificate issues'}
                  </p>
                </div>

                <div className={`p-4 rounded-lg border ${
                  diagnostics.health.connectivity === 'healthy' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <HealthIcon status={diagnostics.health.connectivity} />
                    <span className="font-medium">Connectivity</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {diagnostics.health.connectivity === 'healthy' 
                      ? `${diagnostics.connectivity.latency}ms latency` 
                      : 'Not reachable'}
                  </p>
                </div>
              </div>

              {/* DNS Details */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-500" />
                    DNS Configuration
                  </h3>
                </div>
                <div className="p-4 space-y-4">
                  {/* A Records */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">A Record</span>
                      {diagnostics.dns.aRecords.pointsToServer ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Correctly configured
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Not pointing to server
                        </span>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Expected:</span>
                        <div className="flex items-center gap-2">
                          <span>{diagnostics.dns.aRecords.expectedIP || 'Not configured'}</span>
                          {diagnostics.dns.aRecords.expectedIP && (
                            <button
                              onClick={() => copyToClipboard(diagnostics.dns.aRecords.expectedIP, 'ip')}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {copiedField === 'ip' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-gray-500">Found:</span>
                        <span className={diagnostics.dns.aRecords.found ? '' : 'text-red-500'}>
                          {diagnostics.dns.aRecords.found ? diagnostics.dns.aRecords.records.join(', ') : diagnostics.dns.aRecords.error || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* TXT Verification */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">TXT Verification</span>
                      {diagnostics.dns.verification.valid ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : diagnostics.dns.verification.isExpired ? (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Token expired
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Not verified
                        </span>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Record name:</span>
                        <span>_waveorder-verification.{domain}</span>
                      </div>
                      {diagnostics.dns.verification.expectedToken && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-500">Token:</span>
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[200px]" title={diagnostics.dns.verification.expectedToken}>
                              {diagnostics.dns.verification.expectedToken}
                            </span>
                            <button
                              onClick={() => copyToClipboard(diagnostics.dns.verification.expectedToken!, 'token')}
                              className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                            >
                              {copiedField === 'token' ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                            </button>
                          </div>
                        </div>
                      )}
                      {diagnostics.dns.verification.expiry && (
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-500">Expires:</span>
                          <span className={diagnostics.dns.verification.isExpired ? 'text-red-500' : ''}>
                            {formatDate(diagnostics.dns.verification.expiry)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* SSL Details */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    SSL Certificate
                  </h3>
                </div>
                <div className="p-4">
                  {diagnostics.ssl.valid ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <Shield className="w-5 h-5" />
                        <span className="font-medium">Certificate Valid</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Issuer:</span>
                          <span className="ml-2">{diagnostics.ssl.issuer}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Valid From:</span>
                          <span className="ml-2">{formatDate(diagnostics.ssl.validFrom)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Valid Until:</span>
                          <span className="ml-2">{formatDate(diagnostics.ssl.validTo)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Days Remaining:</span>
                          <span className={`ml-2 font-medium ${
                            (diagnostics.ssl.daysRemaining || 0) <= 14 ? 'text-amber-600' : 'text-green-600'
                          }`}>
                            {diagnostics.ssl.daysRemaining} days
                            {diagnostics.ssl.expiringWarning && (
                              <AlertTriangle className="w-4 h-4 inline ml-1 text-amber-500" />
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-red-600">
                      <XCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Certificate Invalid or Missing</p>
                        <p className="text-sm text-gray-500">{diagnostics.ssl.error || 'No SSL certificate found'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Connectivity Details */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-gray-500" />
                    HTTPS Connectivity
                  </h3>
                </div>
                <div className="p-4">
                  {diagnostics.connectivity.https ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Site Reachable</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <span className="mr-4">Status: {diagnostics.connectivity.statusCode}</span>
                        <span>Latency: {diagnostics.connectivity.latency}ms</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-red-600">
                      <XCircle className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Site Not Reachable</p>
                        <p className="text-sm text-gray-500">{diagnostics.connectivity.error || 'Connection failed'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* External Link */}
              <div className="flex justify-center pt-2">
                <a
                  href={`https://${domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit {domain}
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
