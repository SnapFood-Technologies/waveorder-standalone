'use client'

// src/app/superadmin/system/api-keys/page.tsx
/**
 * SuperAdmin page for viewing and managing all API keys across businesses
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Key,
  Search,
  Trash2,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Activity,
  Clock,
  Building2,
  Filter
} from 'lucide-react'
import Link from 'next/link'

interface ApiKey {
  id: string
  name: string
  keyPreview: string
  scopes: string[]
  lastUsedAt: string | null
  requestCount: number
  expiresAt: string | null
  isActive: boolean
  createdAt: string
  business: {
    id: string
    name: string
    slug: string
    subscriptionPlan: string
  }
}

interface Stats {
  totalKeys: number
  totalRequests: number
}

interface Counts {
  all: number
  active: number
  revoked: number
}

export default function SuperAdminApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [stats, setStats] = useState<Stats>({ totalKeys: 0, totalRequests: 0 })
  const [counts, setCounts] = useState<Counts>({ all: 0, active: 0, revoked: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'revoked'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Revoke confirmation
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null)
  const [revoking, setRevoking] = useState(false)

  /**
   * Fetch API keys from server
   */
  const fetchApiKeys = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status,
        ...(search && { search })
      })
      
      const response = await fetch(`/api/superadmin/api-keys?${params}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch API keys')
      }
      
      setApiKeys(data.apiKeys || [])
      setStats(data.stats || { totalKeys: 0, totalRequests: 0 })
      setCounts(data.counts || { all: 0, active: 0, revoked: 0 })
      setTotalPages(data.pagination?.pages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => {
    fetchApiKeys()
  }, [fetchApiKeys])

  /**
   * Handle search with debounce
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  /**
   * Revoke an API key
   */
  const handleRevokeKey = async (keyId: string) => {
    try {
      setRevoking(true)
      
      const response = await fetch(`/api/superadmin/api-keys/${keyId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to revoke API key')
      }
      
      setRevokeKeyId(null)
      fetchApiKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key')
    } finally {
      setRevoking(false)
    }
  }

  /**
   * Format date
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Format relative time
   */
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Key className="h-6 w-6 text-purple-600" />
          API Keys Management
        </h1>
        <p className="text-gray-600 mt-1">
          Monitor and manage API keys across all businesses
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Total Keys</span>
            <Key className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalKeys}</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Active Keys</span>
            <Activity className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">{counts.active}</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Revoked Keys</span>
            <Trash2 className="h-5 w-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">{counts.revoked}</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">Total Requests</span>
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">{stats.totalRequests.toLocaleString()}</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by key name, business..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'active', 'revoked'] as const).map(s => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s)
                  setPage(1)
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  status === s
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="ml-1 opacity-75">
                  ({s === 'all' ? counts.all : counts[s]})
                </span>
              </button>
            ))}
          </div>
          
          {/* Refresh */}
          <button
            onClick={fetchApiKeys}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600 mx-auto" />
            <p className="text-gray-500 mt-2">Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No API keys found</p>
            {search && (
              <p className="text-sm mt-1">Try adjusting your search</p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Key</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Scopes</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Requests</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Used</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {apiKeys.map(key => (
                    <tr key={key.id} className={!key.isActive ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-gray-900">{key.name}</span>
                          <code className="ml-2 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {key.keyPreview}
                          </code>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Created {formatRelativeTime(key.createdAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/superadmin/businesses/${key.business.id}`}
                          className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
                        >
                          <Building2 className="h-4 w-4" />
                          <span className="font-medium">{key.business.name}</span>
                        </Link>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {key.business.slug}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {key.scopes.slice(0, 2).map(scope => (
                            <span
                              key={scope}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                            >
                              {scope.replace(':', ' ')}
                            </span>
                          ))}
                          {key.scopes.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{key.scopes.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {key.requestCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {formatRelativeTime(key.lastUsedAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {key.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {key.isActive && (
                          <button
                            onClick={() => setRevokeKeyId(key.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Revoke key"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Revoke Confirmation Modal */}
      {revokeKeyId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Revoke API Key?</h3>
                <p className="text-gray-600 mt-2">
                  This action cannot be undone. Any applications using this key will immediately lose access to the API.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => setRevokeKeyId(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevokeKey(revokeKeyId)}
                disabled={revoking}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {revoking ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Revoke Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
