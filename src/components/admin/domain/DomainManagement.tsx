// src/components/admin/domain/DomainManagement.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useBusiness } from '@/contexts/BusinessContext'
import { 
  Globe, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Copy, 
  ExternalLink, 
  Trash2,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  Shield,
  Server,
  FileText,
  ArrowRight,
  Loader2
} from 'lucide-react'

interface DomainConfig {
  customDomain: string | null
  status: 'NONE' | 'PENDING' | 'ACTIVE' | 'FAILED'
  verificationToken: string | null
  verificationExpiry: string | null
  provisionedAt: string | null
  lastChecked: string | null
  error: string | null
}

interface DnsStatus {
  txtVerified: boolean
  aRecordVerified: boolean
  cnameVerified: boolean
  configured: boolean
}

interface Instructions {
  serverIP: string
  txtRecordName: string
  txtRecordValue: string
}

interface DomainManagementProps {
  businessId: string
}

export function DomainManagement({ businessId }: DomainManagementProps) {
  const { subscription, currentBusiness } = useBusiness()
  
  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [removing, setRemoving] = useState(false)
  
  const [hasFeature, setHasFeature] = useState(false)
  const [domain, setDomain] = useState<DomainConfig | null>(null)
  const [dnsStatus, setDnsStatus] = useState<DnsStatus | null>(null)
  const [instructions, setInstructions] = useState<Instructions | null>(null)
  const [storefrontUrl, setStorefrontUrl] = useState<string>('')
  
  const [domainInput, setDomainInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Fetch domain configuration
  const fetchDomainConfig = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stores/${businessId}/domain`)
      if (response.ok) {
        const data = await response.json()
        setHasFeature(data.hasFeature)
        setDomain(data.domain)
        setInstructions(data.instructions)
        setStorefrontUrl(data.storefrontUrl)
        
        // Set input to current domain
        if (data.domain?.customDomain) {
          setDomainInput(data.domain.customDomain)
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to load domain configuration')
      }
    } catch (err) {
      console.error('Error fetching domain config:', err)
      setError('Failed to load domain configuration')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  // Fetch DNS status (for polling)
  const fetchDnsStatus = useCallback(async () => {
    if (!domain?.customDomain || domain.status === 'ACTIVE' || domain.status === 'NONE') {
      return
    }
    
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/domain/status`)
      if (response.ok) {
        const data = await response.json()
        setDnsStatus(data.dnsStatus)
        setDomain(prev => prev ? {
          ...prev,
          status: data.status,
          lastChecked: data.lastChecked,
          error: data.error
        } : null)
        setInstructions(data.instructions)
      }
    } catch (err) {
      console.error('Error fetching DNS status:', err)
    }
  }, [businessId, domain?.customDomain, domain?.status])

  // Initial load
  useEffect(() => {
    fetchDomainConfig()
  }, [fetchDomainConfig])

  // Poll DNS status when pending
  useEffect(() => {
    if (domain?.status === 'PENDING') {
      fetchDnsStatus()
      const interval = setInterval(fetchDnsStatus, 30000) // Poll every 30s
      return () => clearInterval(interval)
    }
  }, [domain?.status, fetchDnsStatus])

  // Auto-hide success message
  useEffect(() => {
    if (successMessage) {
      const timeout = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timeout)
    }
  }, [successMessage])

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Save domain
  const handleSaveDomain = async () => {
    if (!domainInput.trim()) {
      setError('Please enter a domain')
      return
    }

    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch(`/api/admin/stores/${businessId}/domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('Domain saved! Please configure DNS records.')
        setDomainInput(data.domain)
        await fetchDomainConfig()
      } else {
        setError(data.error || 'Failed to save domain')
      }
    } catch (err) {
      console.error('Error saving domain:', err)
      setError('Failed to save domain')
    } finally {
      setSaving(false)
    }
  }

  // Verify domain
  const handleVerifyDomain = async () => {
    try {
      setVerifying(true)
      setError(null)

      const response = await fetch(`/api/admin/stores/${businessId}/domain/verify`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccessMessage(data.message || 'Domain verified and activated!')
        await fetchDomainConfig()
      } else {
        // Update DNS status from response
        if (data.dnsStatus) {
          setDnsStatus(data.dnsStatus)
        }
        if (data.errors?.length) {
          setError(data.errors.join('. '))
        } else {
          setError(data.error || data.message || 'DNS verification failed')
        }
      }
    } catch (err) {
      console.error('Error verifying domain:', err)
      setError('Failed to verify domain')
    } finally {
      setVerifying(false)
    }
  }

  // Remove domain
  const handleRemoveDomain = async () => {
    try {
      setRemoving(true)
      setError(null)

      const response = await fetch(`/api/admin/stores/${businessId}/domain`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('Domain removed successfully')
        setDomainInput('')
        setShowRemoveConfirm(false)
        await fetchDomainConfig()
      } else {
        setError(data.error || 'Failed to remove domain')
      }
    } catch (err) {
      console.error('Error removing domain:', err)
      setError('Failed to remove domain')
    } finally {
      setRemoving(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      </div>
    )
  }

  // Get status badge color
  const getStatusBadge = () => {
    switch (domain?.status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending Verification
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Globe className="w-6 h-6 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Domain Management</h1>
        </div>
        <p className="text-gray-600">
          Connect your own domain to your storefront for a professional branded experience.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-red-600 text-sm underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Current Status Card */}
        {domain?.customDomain && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Current Domain</h2>
                {getStatusBadge()}
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Globe className="w-5 h-5 text-gray-500" />
                <span className="text-lg font-medium text-gray-900">{domain.customDomain}</span>
                {domain.status === 'ACTIVE' && (
                  <a 
                    href={`https://${domain.customDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit
                  </a>
                )}
              </div>

              {domain.status === 'ACTIVE' && domain.provisionedAt && (
                <p className="mt-3 text-sm text-gray-500">
                  Active since {new Date(domain.provisionedAt).toLocaleDateString()}
                </p>
              )}

              {domain.error && domain.status !== 'ACTIVE' && (
                <p className="mt-3 text-sm text-red-600">{domain.error}</p>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-3">
                {domain.status === 'PENDING' && (
                  <button
                    onClick={handleVerifyDomain}
                    disabled={verifying}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {verifying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {verifying ? 'Verifying...' : 'Verify DNS'}
                  </button>
                )}
                <button
                  onClick={() => setShowRemoveConfirm(true)}
                  disabled={removing}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Domain
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DNS Status Card (when PENDING) */}
        {domain?.status === 'PENDING' && dnsStatus && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">DNS Configuration Status</h2>
              
              <div className="space-y-3">
                {/* TXT Record */}
                <div className="flex items-center gap-3">
                  {dnsStatus.txtVerified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="text-gray-700">TXT Verification Record</span>
                  <span className={`ml-auto text-sm font-medium ${dnsStatus.txtVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {dnsStatus.txtVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                
                {/* A Record */}
                <div className="flex items-center gap-3">
                  {dnsStatus.aRecordVerified ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-500" />
                  )}
                  <span className="text-gray-700">A Record (Domain Pointing)</span>
                  <span className={`ml-auto text-sm font-medium ${dnsStatus.aRecordVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {dnsStatus.aRecordVerified ? 'Configured' : 'Pending'}
                  </span>
                </div>
              </div>

              {domain.lastChecked && (
                <p className="mt-4 text-xs text-gray-500">
                  Last checked: {new Date(domain.lastChecked).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* DNS Instructions Card (when PENDING) */}
        {domain?.status === 'PENDING' && instructions && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">DNS Configuration Instructions</h2>
              <p className="text-gray-600 mb-6">
                Add these DNS records at your domain registrar (Cloudflare, Namecheap, GoDaddy, etc.):
              </p>

              {/* Step 1: A Record */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">1</div>
                  <h3 className="font-medium text-gray-900">Add A Record (Point domain to server)</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Type</span>
                      <p className="font-mono font-medium">A</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Name / Host</span>
                      <p className="font-mono font-medium">@</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Value / Points to</span>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium">{instructions.serverIP}</p>
                        <button
                          onClick={() => copyToClipboard(instructions.serverIP, 'ip')}
                          className="text-gray-400 hover:text-teal-600"
                        >
                          {copiedField === 'ip' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: TXT Record */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">2</div>
                  <h3 className="font-medium text-gray-900">Add TXT Record (Verify ownership)</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Type</span>
                      <p className="font-mono font-medium">TXT</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Name / Host</span>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium text-xs break-all">{instructions.txtRecordName}</p>
                        <button
                          onClick={() => copyToClipboard(instructions.txtRecordName, 'txtName')}
                          className="text-gray-400 hover:text-teal-600 flex-shrink-0"
                        >
                          {copiedField === 'txtName' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Value</span>
                      <div className="flex items-center gap-2">
                        <p className="font-mono font-medium text-xs break-all">{instructions.txtRecordValue}</p>
                        <button
                          onClick={() => copyToClipboard(instructions.txtRecordValue, 'txtValue')}
                          className="text-gray-400 hover:text-teal-600 flex-shrink-0"
                        >
                          {copiedField === 'txtValue' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">DNS Propagation Time</p>
                  <p className="mt-1">Changes typically take 5-30 minutes but can take up to 48 hours. Click "Verify DNS" after adding records.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add New Domain Card (when no domain or can change) */}
        {(!domain?.customDomain || domain.status === 'FAILED') && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {domain?.status === 'FAILED' ? 'Try Again with a Domain' : 'Connect Your Domain'}
              </h2>
              <p className="text-gray-600 mb-6">
                Enter your domain name below. You'll need access to your domain's DNS settings.
              </p>

              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">https://</span>
                    <input
                      type="text"
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      placeholder="shop.example.com"
                      className="w-full pl-16 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Example: shop.yourdomain.com or yourdomain.com
                  </p>
                </div>
                <button
                  onClick={handleSaveDomain}
                  disabled={saving || !domainInput.trim()}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {saving ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Troubleshooting Section */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <button
            onClick={() => setShowTroubleshooting(!showTroubleshooting)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900">Troubleshooting & FAQ</span>
            </div>
            {showTroubleshooting ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {showTroubleshooting && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">DNS records not being detected?</h4>
                <p className="text-sm text-gray-600">
                  DNS changes can take 5 minutes to 48 hours to propagate. Try again in a few hours.
                  You can check propagation status at{' '}
                  <a href="https://dnschecker.org" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                    dnschecker.org
                  </a>
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Using Cloudflare?</h4>
                <p className="text-sm text-gray-600">
                  Make sure the proxy (orange cloud) is turned OFF for your A record while setting up. 
                  You can enable it after verification is complete.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Can I use a subdomain (shop.example.com)?</h4>
                <p className="text-sm text-gray-600">
                  Yes! Subdomains work the same way. Just enter the full subdomain in the domain field.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Need help?</h4>
                <p className="text-sm text-gray-600">
                  Contact our support team at{' '}
                  <a href="mailto:support@waveorder.app" className="text-teal-600 hover:underline">
                    support@waveorder.app
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Current Storefront URL */}
        {storefrontUrl && (
          <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Your storefront is currently accessible at:</p>
              <a 
                href={storefrontUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-teal-600 hover:underline font-medium"
              >
                {storefrontUrl}
              </a>
            </div>
            <ExternalLink className="w-5 h-5 text-gray-400" />
          </div>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Custom Domain?</h3>
            <p className="text-gray-600 mb-6">
              This will disconnect <strong>{domain?.customDomain}</strong> from your storefront. 
              Your store will still be accessible via the default WaveOrder URL.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRemoveConfirm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveDomain}
                disabled={removing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {removing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {removing ? 'Removing...' : 'Remove Domain'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
