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
  Info,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { ExternalSyncLogs } from '@/components/superadmin/ExternalSyncLogs'

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
  const [syncConfirmModal, setSyncConfirmModal] = useState<ExternalSync | null>(null)
  const [syncResult, setSyncResult] = useState<{ 
    success: boolean
    message: string
    processedCount?: number
    skippedCount?: number
    errors?: any[]
    pagination?: {
      total?: number
      perPage?: number
      currentPage?: number
      totalPages?: number
      remainingPages?: number
      syncAllPages?: boolean
    }
  } | null>(null)
  const [syncingInModal, setSyncingInModal] = useState(false)
  const [showDeduplicateModal, setShowDeduplicateModal] = useState(false)
  const [deduplicating, setDeduplicating] = useState(false)
  const [deduplicateResult, setDeduplicateResult] = useState<{
    duplicatesFound: number
    duplicatesRemoved: number
    productsMoved: number
    childrenMoved: number
    details?: Array<{
      externalId: string
      kept: string
      keptId: string
      removed: Array<{ name: string; id: string }>
    }>
  } | null>(null)

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
      setSyncResult({
        success: false,
        message: err.message || 'Failed to delete sync'
      })
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
      setError(err.message || 'Failed to update sync')
    }
  }

  const handleSyncNow = async (sync: ExternalSync) => {
    if (!sync.isActive) {
      setSyncResult({
        success: false,
        message: 'Please activate the sync before running it'
      })
      return
    }

    if (!sync.externalSystemBaseUrl || !sync.externalSystemApiKey) {
      setSyncResult({
        success: false,
        message: 'External system base URL and API key are required'
      })
      return
    }

    setSyncConfirmModal(sync)
  }

  const confirmSync = async (perPage?: number, currentPage?: number, syncAllPages?: boolean) => {
    if (!syncConfirmModal) return

    const sync = syncConfirmModal

    try {
      setSyncingInModal(true)
      setSyncResult(null) // Clear previous results
      
      const url = new URL(`/api/superadmin/businesses/${businessId}/external-syncs/${sync.id}/sync`, window.location.origin)
      if (perPage) {
        url.searchParams.set('per_page', perPage.toString())
      }
      if (currentPage !== undefined) {
        url.searchParams.set('current_page', currentPage.toString())
      }
      if (syncAllPages !== undefined) {
        url.searchParams.set('sync_all_pages', syncAllPages.toString())
      }
      
      const response = await fetch(url.toString(), {
        method: 'POST'
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to start sync')
      }

      const result = await response.json()
      setSyncResult({
        success: result.status === 'success' || result.status === 'partial',
        message: result.status === 'success' 
          ? 'Sync completed successfully!' 
          : result.status === 'partial'
          ? 'Sync completed with some errors'
          : 'Sync failed',
        processedCount: result.processedCount || 0,
        skippedCount: result.skippedCount || 0,
        errors: result.errors || [],
        pagination: result.pagination ? {
          total: result.pagination.total,
          perPage: result.pagination.per_page || result.pagination.perPage,
          currentPage: result.pagination.current_page || result.pagination.currentPage,
          totalPages: result.pagination.total_pages || result.pagination.totalPages,
          remainingPages: result.pagination.remaining_pages !== undefined ? result.pagination.remaining_pages : result.pagination.remainingPages,
          syncAllPages: syncAllPages
        } : undefined
      })
      fetchSyncs() // Refresh to show updated sync status
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'Failed to start sync',
        processedCount: 0,
        skippedCount: 0,
        errors: []
      })
    } finally {
      setSyncingInModal(false)
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

  const handleDeduplicate = async () => {
    setDeduplicating(true)
    setDeduplicateResult(null)
    
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/categories/deduplicate`, {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        setDeduplicateResult(result)
      } else {
        const errorData = await response.json()
        setDeduplicateResult({
          duplicatesFound: 0,
          duplicatesRemoved: 0,
          productsMoved: 0,
          childrenMoved: 0
        })
        setError(errorData.message || 'Error deduplicating categories')
      }
    } catch (error: any) {
      console.error('Error deduplicating categories:', error)
      setError('Error deduplicating categories. Please try again.')
    } finally {
      setDeduplicating(false)
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
                External Syncs {business && <span className="text-gray-500">- {business.name}</span>}
              </h1>
              <p className="text-sm text-gray-600 mt-1">Manage product synchronization with external systems</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowDeduplicateModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Deduplicate Categories</span>
              <span className="sm:hidden">Deduplicate</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Add External Sync</span>
              <span className="sm:hidden">Add Sync</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
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
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No External Syncs</h3>
            <p className="text-gray-600 mb-6">Get started by adding your first external sync configuration.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add External Sync
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                          onClick={() => handleSyncNow(sync)}
                          disabled={!sync.isActive}
                          className={`p-2 rounded-lg ${
                            sync.isActive
                              ? 'text-teal-600 hover:bg-teal-50'
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          title={sync.isActive ? 'Sync Now' : 'Activate sync first'}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
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

      {/* Sync Logs History */}
      <div className="mt-8">
        <ExternalSyncLogs businessId={businessId} />
      </div>

      {/* Modals */}
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

      {/* Sync Confirmation Modal */}
      {syncConfirmModal && (
        <SyncConfirmModal
          sync={syncConfirmModal}
          syncing={syncingInModal}
          syncResult={syncResult}
          onClose={() => {
            setSyncConfirmModal(null)
            setSyncResult(null)
            setSyncingInModal(false)
          }}
          onConfirm={confirmSync}
        />
      )}

      {/* Sync Result Modal */}
      {syncResult && (
        <SyncResultModal
          result={syncResult}
          onClose={() => setSyncResult(null)}
        />
      )}

      {/* Deduplicate Categories Modal */}
      {showDeduplicateModal && (
        <DeduplicateCategoriesModal
          businessId={businessId}
          businessName={business?.name || 'Business'}
          deduplicating={deduplicating}
          result={deduplicateResult}
          onClose={() => {
            setShowDeduplicateModal(false)
            setDeduplicateResult(null)
          }}
          onConfirm={handleDeduplicate}
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
    externalBrandIds: sync?.externalBrandIds ? JSON.stringify(sync.externalBrandIds, null, 2) : '',
    perPage: sync?.externalSystemEndpoints && typeof sync.externalSystemEndpoints === 'object' && 'perPage' in sync.externalSystemEndpoints 
      ? (sync.externalSystemEndpoints as any).perPage?.toString() || '100'
      : '100'
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
      
      // Add perPage to endpoints config if provided
      if (endpoints && formData.perPage) {
        endpoints.perPage = parseInt(formData.perPage) || 100
      } else if (!endpoints && formData.perPage) {
        endpoints = { perPage: parseInt(formData.perPage) || 100 }
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
              placeholder='{"products-by-brand": "/brand-products-export"}'
            />
            <p className="mt-1 text-xs text-gray-500">
              JSON object with endpoint paths. Use "products-by-brand" key for product sync endpoint (e.g., "/brand-products-export")
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
              placeholder='"13" or ["13", "5"]'
            />
            <p className="mt-1 text-xs text-gray-500">
              Single brand ID as string (e.g., "13" for Villeroy), or array of brand IDs
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Products Per Page
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={formData.perPage}
              onChange={(e) => setFormData({ ...formData, perPage: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Number of products to fetch per API request (default: 100, max: 500)
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
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

// Sync Confirmation Modal
interface SyncConfirmModalProps {
  sync: ExternalSync
  syncing: boolean
  syncResult: { 
    success: boolean
    message: string
    processedCount?: number
    skippedCount?: number
    errors?: any[]
    pagination?: {
      total?: number
      perPage?: number
      currentPage?: number
      totalPages?: number
      remainingPages?: number
      syncAllPages?: boolean
    }
  } | null
  onClose: () => void
  onConfirm: (perPage?: number, currentPage?: number, syncAllPages?: boolean) => void
}

function SyncConfirmModal({ sync, syncing, syncResult, onClose, onConfirm }: SyncConfirmModalProps) {
  const [perPage, setPerPage] = useState<string>(() => {
    // Get default perPage from sync config
    if (sync.externalSystemEndpoints && typeof sync.externalSystemEndpoints === 'object' && 'perPage' in sync.externalSystemEndpoints) {
      return (sync.externalSystemEndpoints as any).perPage?.toString() || '100'
    }
    return '100'
  })
  const [currentPage, setCurrentPage] = useState<string>('1')
  const [syncAllPages, setSyncAllPages] = useState<boolean>(false) // Default to false to prevent timeouts
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)

  // Elapsed time timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (syncing) {
      // Reset and start timer when sync begins
      setElapsedSeconds(0)
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      // Clear timer when sync stops
      if (interval) {
        clearInterval(interval)
      }
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [syncing])

  // Format elapsed time display
  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`
    } else {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Start Sync</h3>
              <p className="text-sm text-gray-600">Sync products from external system</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-4">
            Start syncing products from <strong>{sync.externalSystemName || sync.name}</strong>? This will fetch and update products in your store.
          </p>
          
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Products Per Page
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={perPage}
                onChange={(e) => setPerPage(e.target.value)}
                disabled={syncing || !!syncResult}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Number of products to fetch per API request (default: {sync.externalSystemEndpoints && typeof sync.externalSystemEndpoints === 'object' && 'perPage' in sync.externalSystemEndpoints ? (sync.externalSystemEndpoints as any).perPage || 100 : 100})
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={syncAllPages}
                  onChange={(e) => setSyncAllPages(e.target.checked)}
                  disabled={syncing || !!syncResult}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-sm font-medium text-gray-700">Sync All Pages</span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                If unchecked, only sync the specified page below
              </p>
            </div>

            {!syncAllPages && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Page
                </label>
                <input
                  type="number"
                  min="1"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                  disabled={syncing || !!syncResult}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Page number to sync (starts from 1)
                </p>
              </div>
            )}
          </div>

          {/* Sync Results Section */}
          {syncResult && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              syncResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {syncResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                <h4 className="font-semibold text-gray-900">
                  {syncResult.success ? 'Sync Completed' : 'Sync Failed'}
                </h4>
              </div>
              <p className="text-sm text-gray-700 mb-3">{syncResult.message}</p>
              
              {syncResult.processedCount !== undefined && (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processed:</span>
                    <span className="font-medium text-gray-900">{syncResult.processedCount}</span>
                  </div>
                  {syncResult.skippedCount !== undefined && syncResult.skippedCount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Skipped:</span>
                      <span className="font-medium text-orange-600">{syncResult.skippedCount}</span>
                    </div>
                  )}
                  {syncResult.pagination && (
                    <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total Products:</span>
                        <span className="font-medium text-gray-900">{syncResult.pagination.total?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Page:</span>
                        <span className="font-medium text-gray-900">{syncResult.pagination.currentPage || 'N/A'} / {syncResult.pagination.totalPages || 'N/A'}</span>
                      </div>
                      {syncResult.pagination.remainingPages !== undefined && syncResult.pagination.remainingPages > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Remaining Pages:</span>
                          <span className="font-medium text-teal-600">{syncResult.pagination.remainingPages}</span>
                        </div>
                      )}
                      {syncResult.pagination.syncAllPages === false && syncResult.pagination.totalPages && syncResult.pagination.totalPages > 1 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            {syncResult.pagination.totalPages - (syncResult.pagination.currentPage || 1)} more pages available. Check "Sync All Pages" to sync everything.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {syncResult.errors && syncResult.errors.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">Errors ({syncResult.errors.length}):</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {syncResult.errors.slice(0, 5).map((error: any, idx: number) => (
                      <div key={idx} className="text-xs text-red-600 bg-red-100 p-2 rounded">
                        {error.productId || 'Unknown'}: {error.error || 'Unknown error'}
                      </div>
                    ))}
                    {syncResult.errors.length > 5 && (
                      <p className="text-xs text-gray-500">... and {syncResult.errors.length - 5} more errors</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Elapsed Time Display */}
          {syncing && (
            <div className="mb-6 bg-teal-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-teal-900">Sync in Progress</p>
                  <p className="text-lg font-bold text-teal-800">
                    {formatElapsedTime(elapsedSeconds)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={syncing}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncResult ? 'Close' : 'Cancel'}
            </button>
            {!syncResult && (
              <button
                onClick={() => onConfirm(
                  parseInt(perPage) || undefined,
                  syncAllPages ? undefined : (parseInt(currentPage) || undefined),
                  syncAllPages
                )}
                disabled={syncing}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                {syncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  'Start Sync'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Sync Result Modal
interface SyncResultModalProps {
  result: { 
    success: boolean
    message: string
    processedCount?: number
    skippedCount?: number
    errors?: any[]
    pagination?: {
      total?: number
      perPage?: number
      currentPage?: number
      totalPages?: number
      remainingPages?: number
      syncAllPages?: boolean
    }
  }
  onClose: () => void
}

// Deduplicate Categories Modal
interface DeduplicateCategoriesModalProps {
  businessId: string
  businessName: string
  deduplicating: boolean
  result: {
    duplicatesFound: number
    duplicatesRemoved: number
    productsMoved: number
    childrenMoved: number
    details?: Array<{
      externalId: string
      kept: string
      keptId: string
      removed: Array<{ name: string; id: string }>
    }>
  } | null
  onClose: () => void
  onConfirm: () => void
}

function DeduplicateCategoriesModal({ 
  businessId, 
  businessName, 
  deduplicating, 
  result, 
  onClose, 
  onConfirm 
}: DeduplicateCategoriesModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {!result ? (
            // Confirmation View
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Deduplicate Categories</h3>
                  <p className="text-sm text-gray-600">Remove duplicate categories for {businessName}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-700 mb-4">
                  This will find and remove duplicate categories that have the same <strong>externalCategoryId</strong> in their metadata.
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-yellow-900 mb-2">What will happen:</h4>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Categories with the same external ID will be grouped</li>
                    <li>The category with the most products (or most children, or oldest) will be kept</li>
                    <li>All products from duplicates will be moved to the kept category</li>
                    <li>All subcategories from duplicates will be moved to the kept category</li>
                    <li>Duplicate categories will be deleted</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This action cannot be undone. Make sure you want to proceed.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={deduplicating}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={deduplicating}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                  {deduplicating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deduplicating...
                    </>
                  ) : (
                    'Confirm & Deduplicate'
                  )}
                </button>
              </div>
            </>
          ) : (
            // Results View
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  result.duplicatesRemoved > 0 ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {result.duplicatesRemoved > 0 ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Info className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Deduplication Complete</h3>
                  <p className="text-sm text-gray-600">Results for {businessName}</p>
                </div>
              </div>
              
              <div className="mb-6 space-y-4">
                {result.duplicatesRemoved === 0 ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      No duplicate categories found. All categories are unique.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">Duplicates Found</p>
                        <p className="text-2xl font-bold text-gray-900">{result.duplicatesFound}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">Removed</p>
                        <p className="text-2xl font-bold text-orange-600">{result.duplicatesRemoved}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">Products Moved</p>
                        <p className="text-2xl font-bold text-teal-600">{result.productsMoved}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-600 mb-1">Children Moved</p>
                        <p className="text-2xl font-bold text-blue-600">{result.childrenMoved}</p>
                      </div>
                    </div>
                    
                    {result.details && result.details.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Details:</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {result.details.map((detail, idx) => (
                            <div key={idx} className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-gray-500 mb-1">
                                    External ID: <span className="text-gray-900">{detail.externalId}</span>
                                  </p>
                                  <p className="text-sm text-gray-700 mb-1">
                                    Kept: <span className="font-medium text-green-700">{detail.kept}</span>
                                  </p>
                                  {detail.removed.length > 0 && (
                                    <p className="text-sm text-gray-600">
                                      Removed: <span className="font-medium text-orange-600">{detail.removed.length}</span> duplicate{detail.removed.length !== 1 ? 's' : ''}
                                      {detail.removed.length <= 3 && (
                                        <span className="text-gray-500 ml-1">
                                          ({detail.removed.map(r => r.name).join(', ')})
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>
                                {detail.removed.length > 3 && (
                                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {detail.removed.length} removed
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SyncResultModal({ result, onClose }: SyncResultModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              result.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {result.success ? 'Sync Completed' : 'Sync Failed'}
              </h3>
            </div>
          </div>
          <p className="text-sm text-gray-700 mb-4">{result.message}</p>
          {result.success && result.processedCount !== undefined && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processed:</span>
                <span className="font-medium text-gray-900">{result.processedCount}</span>
              </div>
              {result.skippedCount !== undefined && result.skippedCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Skipped:</span>
                  <span className="font-medium text-orange-600">{result.skippedCount}</span>
                </div>
              )}
              {result.pagination && (
                <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Products:</span>
                    <span className="font-medium text-gray-900">{result.pagination.total?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current Page:</span>
                    <span className="font-medium text-gray-900">{result.pagination.currentPage || 'N/A'} / {result.pagination.totalPages || 'N/A'}</span>
                  </div>
                  {result.pagination.perPage && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Per Page:</span>
                      <span className="font-medium text-gray-900">{result.pagination.perPage}</span>
                    </div>
                  )}
                  {result.pagination.remainingPages !== undefined && result.pagination.remainingPages > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining Pages:</span>
                      <span className="font-medium text-teal-600">{result.pagination.remainingPages}</span>
                    </div>
                  )}
                  {result.pagination.syncAllPages === false && result.pagination.totalPages && result.pagination.totalPages > 1 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-teal-600">
                        💡 {result.pagination.totalPages - (result.pagination.currentPage || 1)} more pages available. Check "Sync All Pages" to sync everything.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
