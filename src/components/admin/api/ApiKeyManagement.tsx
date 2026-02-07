'use client'

// src/components/admin/api/ApiKeyManagement.tsx
/**
 * API Key Management component for Business Plan users
 * Allows creating, viewing, and revoking API keys
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Shield,
  Activity,
  Clock,
  RefreshCw
} from 'lucide-react'

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
}

interface AvailableScope {
  id: string
  name: string
  description: string
}

interface ApiKeyManagementProps {
  businessId: string
}

export function ApiKeyManagement({ businessId }: ApiKeyManagementProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [availableScopes, setAvailableScopes] = useState<AvailableScope[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Create key modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  
  // Newly created key (shown once)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)
  
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
      
      const response = await fetch(`/api/admin/stores/${businessId}/api-keys`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch API keys')
      }
      
      setApiKeys(data.apiKeys || [])
      setAvailableScopes(data.availableScopes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchApiKeys()
  }, [fetchApiKeys])

  /**
   * Create a new API key
   */
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      return
    }
    
    try {
      setCreating(true)
      
      const response = await fetch(`/api/admin/stores/${businessId}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName.trim(),
          scopes: selectedScopes.length > 0 ? selectedScopes : undefined
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create API key')
      }
      
      // Store the plain key to show once
      setNewlyCreatedKey(data.apiKey.key)
      setShowCreateModal(false)
      setNewKeyName('')
      setSelectedScopes([])
      
      // Refresh the list
      fetchApiKeys()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  /**
   * Revoke an API key
   */
  const handleRevokeKey = async (keyId: string) => {
    try {
      setRevoking(true)
      
      const response = await fetch(`/api/admin/stores/${businessId}/api-keys/${keyId}`, {
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
   * Copy key to clipboard
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setKeyCopied(true)
      setTimeout(() => setKeyCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  /**
   * Toggle scope selection
   */
  const toggleScope = (scopeId: string) => {
    setSelectedScopes(prev =>
      prev.includes(scopeId)
        ? prev.filter(s => s !== scopeId)
        : [...prev, scopeId]
    )
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
   * Get scope display name
   */
  const getScopeName = (scopeId: string) => {
    const scope = availableScopes.find(s => s.id === scopeId)
    return scope?.name || scopeId
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Key className="h-6 w-6 text-teal-600" />
              API Access
            </h1>
            <p className="text-gray-600 mt-1">
              Manage API keys for external integrations
            </p>
          </div>
          <a
            href="/developers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm"
          >
            View API Docs
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-800 font-medium">API Key Created!</p>
              <p className="text-green-600 text-sm mt-1">
                Copy this key now — it won't be shown again.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-green-300 rounded font-mono text-sm break-all">
                  {newlyCreatedKey}
                </code>
                <button
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                >
                  {keyCopied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={() => setNewlyCreatedKey(null)}
                className="mt-3 text-sm text-green-700 hover:text-green-800"
              >
                I've saved the key, close this
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">How to use the API</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Base URL: <code className="bg-blue-100 px-1 rounded">/api/v1</code></li>
          <li>• Add header: <code className="bg-blue-100 px-1 rounded">Authorization: Bearer YOUR_API_KEY</code></li>
          <li>• Rate limit: 60 requests per minute</li>
        </ul>
      </div>

      {/* API Keys List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">API Keys ({apiKeys.filter(k => k.isActive).length}/5)</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchApiKeys}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={apiKeys.filter(k => k.isActive).length >= 5}
              className="px-3 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
            >
              <Plus className="h-4 w-4" />
              Create Key
            </button>
          </div>
        </div>

        {apiKeys.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No API keys yet</p>
            <p className="text-sm mt-1">Create your first API key to start using the API</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {apiKeys.map(key => (
              <div
                key={key.id}
                className={`p-4 ${!key.isActive ? 'bg-gray-50 opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{key.name}</span>
                      <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {key.keyPreview}
                      </code>
                      {!key.isActive && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          Revoked
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-1">
                      {key.scopes.map(scope => (
                        <span
                          key={scope}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                        >
                          {getScopeName(scope)}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created: {formatDate(key.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        Last used: {formatDate(key.lastUsedAt)}
                      </span>
                      <span>
                        {key.requestCount.toLocaleString()} requests
                      </span>
                    </div>
                  </div>
                  
                  {key.isActive && (
                    <button
                      onClick={() => setRevokeKeyId(key.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Revoke key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create API Key</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Name
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Mobile App, POS Integration"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Give your key a memorable name
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permissions
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableScopes.map(scope => (
                    <label
                      key={scope.id}
                      className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedScopes.includes(scope.id)}
                        onChange={() => toggleScope(scope.id)}
                        className="mt-0.5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{scope.name}</span>
                        <p className="text-xs text-gray-500">{scope.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedScopes.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Default: Read access to products, orders, and categories
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewKeyName('')
                  setSelectedScopes([])
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateKey}
                disabled={!newKeyName.trim() || creating}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  This action cannot be undone. Any applications using this key will immediately lose access.
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
