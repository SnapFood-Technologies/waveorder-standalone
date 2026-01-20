'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Plus,
  Settings,
  Loader2,
  AlertTriangle,
  CheckCircle,
  X,
  Edit,
  Trash2,
  Power,
  PowerOff,
  ExternalLink,
  Clock,
  Info
} from 'lucide-react'
import Link from 'next/link'

interface ExternalSync {
  id: string
  name: string
  externalSystemName?: string | null
  externalSystemBaseUrl?: string | null
  externalSystemApiKey?: string | null
  externalSystemEndpoints?: any
  externalBrandIds?: any
  isActive: boolean
  lastSyncAt?: string | null
  lastSyncStatus?: string | null
  lastSyncError?: string | null
  createdAt: string
  updatedAt: string
}

interface Business {
  id: string
  name: string
}

export default function ExternalSyncsPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [syncs, setSyncs] = useState<ExternalSync[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSync, setEditingSync] = useState<ExternalSync | null>(null)
  const [deletingSync, setDeletingSync] = useState<ExternalSync | null>(null)

  useEffect(() => {
    fetchBusiness()
    fetchSyncs()
  }, [businessId])

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

  const fetchSyncs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/superadmin/businesses/${businessId}/external-syncs`)
      if (!response.ok) {
        throw new Error('Failed to fetch external syncs')
      }
      const data = await response.json()
      setSyncs(data.syncs || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load external syncs')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sync: ExternalSync) => {
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/external-syncs/${sync.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to delete sync')
      }
      setDeletingSync(null)
      fetchSyncs()
    } catch (err: any) {
      alert(err.message || 'Failed to delete sync')
    }
  }

  const handleToggleActive = async (sync: ExternalSync) => {
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/external-syncs/${sync.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !sync.isActive })
      })
      if (!response.ok) {
        throw new Error('Failed to update sync')
      }
      fetchSyncs()
    } catch (err: any) {
      alert(err.message || 'Failed to update sync')
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={`/superadmin/businesses/${businessId}`}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">External Syncs</h1>
                <p className="text-sm text-gray-600">{business?.name}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add External Sync
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading external syncs...</p>
          </div>
        ) : syncs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No External Syncs</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first external sync configuration.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add External Sync
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    System
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Sync
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {syncs.map((sync) => (
                  <tr key={sync.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{sync.name}</div>
                      {sync.externalSystemBaseUrl && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {sync.externalSystemBaseUrl}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {sync.externalSystemName || 'Not specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sync.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {sync.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {sync.lastSyncStatus === 'success' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {sync.lastSyncStatus === 'failed' && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      {sync.lastSyncError && (
                        <div className="mt-1 text-xs text-red-600 truncate max-w-xs" title={sync.lastSyncError}>
                          {sync.lastSyncError}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(sync.lastSyncAt)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(sync)}
                          className={`p-2 rounded-lg ${
                            sync.isActive
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={sync.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {sync.isActive ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingSync(sync)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingSync(sync)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingSync) && (
        <ExternalSyncModal
          businessId={businessId}
          sync={editingSync}
          onClose={() => {
            setShowAddModal(false)
            setEditingSync(null)
          }}
          onSuccess={() => {
            setShowAddModal(false)
            setEditingSync(null)
            fetchSyncs()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingSync && (
        <DeleteConfirmModal
          sync={deletingSync}
          onClose={() => setDeletingSync(null)}
          onConfirm={() => handleDelete(deletingSync)}
        />
      )}
    </div>
  )
}

// External Sync Modal Component
interface ExternalSyncModalProps {
  businessId: string
  sync?: ExternalSync | null
  onClose: () => void
  onSuccess: () => void
}

function ExternalSyncModal({ businessId, sync, onClose, onSuccess }: ExternalSyncModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: sync?.name || '',
    externalSystemName: sync?.externalSystemName || '',
    externalSystemBaseUrl: sync?.externalSystemBaseUrl || '',
    externalSystemApiKey: sync?.externalSystemApiKey || '',
    externalSystemEndpoints: sync?.externalSystemEndpoints ? JSON.stringify(sync.externalSystemEndpoints, null, 2) : '',
    externalBrandIds: sync?.externalBrandIds ? JSON.stringify(sync.externalBrandIds, null, 2) : ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Parse JSON fields
      let endpoints = null
      let brandIds = null
      
      if (formData.externalSystemEndpoints.trim()) {
        try {
          endpoints = JSON.parse(formData.externalSystemEndpoints)
        } catch {
          throw new Error('Invalid JSON in Endpoints field')
        }
      }
      
      if (formData.externalBrandIds.trim()) {
        try {
          brandIds = JSON.parse(formData.externalBrandIds)
        } catch {
          throw new Error('Invalid JSON in Brand IDs field')
        }
      }

      const payload = {
        name: formData.name,
        externalSystemName: formData.externalSystemName || null,
        externalSystemBaseUrl: formData.externalSystemBaseUrl || null,
        externalSystemApiKey: formData.externalSystemApiKey || null,
        externalSystemEndpoints: endpoints,
        externalBrandIds: brandIds
      }

      const url = sync
        ? `/api/superadmin/businesses/${businessId}/external-syncs/${sync.id}`
        : `/api/superadmin/businesses/${businessId}/external-syncs`
      
      const method = sync ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to save external sync')
      }

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to save external sync')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {sync ? 'Edit External Sync' : 'Add External Sync'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., OmniStack Product Sync"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              External System Name
            </label>
            <input
              type="text"
              value={formData.externalSystemName}
              onChange={(e) => setFormData({ ...formData, externalSystemName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., OmniStack, Shopify, WooCommerce"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base URL
            </label>
            <input
              type="url"
              value={formData.externalSystemBaseUrl}
              onChange={(e) => setFormData({ ...formData, externalSystemBaseUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://api.example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="text"
              value={formData.externalSystemApiKey}
              onChange={(e) => setFormData({ ...formData, externalSystemApiKey: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your API key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endpoint Paths (JSON)
            </label>
            <textarea
              value={formData.externalSystemEndpoints}
              onChange={(e) => setFormData({ ...formData, externalSystemEndpoints: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              rows={4}
              placeholder='{"products": "/api/products", "categories": "/api/categories"}'
            />
            <p className="mt-1 text-xs text-gray-500">
              JSON object with endpoint paths for products, categories, etc.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand IDs (JSON)
            </label>
            <textarea
              value={formData.externalBrandIds}
              onChange={(e) => setFormData({ ...formData, externalBrandIds: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              rows={2}
              placeholder='"brand-123" or ["brand-123", "brand-456"]'
            />
            <p className="mt-1 text-xs text-gray-500">
              Single brand ID as string, or array of brand IDs
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Delete Confirmation Modal
interface DeleteConfirmModalProps {
  sync: ExternalSync
  onClose: () => void
  onConfirm: () => void
}

function DeleteConfirmModal({ sync, onClose, onConfirm }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete External Sync</h3>
              <p className="text-sm text-gray-600">This action cannot be undone.</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-6">
            Are you sure you want to delete <strong>{sync.name}</strong>? This will remove all sync configuration.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
