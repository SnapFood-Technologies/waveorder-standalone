// src/components/admin/postals/PostalsManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Edit2, Trash2, Save, X, Upload, Image as ImageIcon, AlertTriangle } from 'lucide-react'

interface Postal {
  id?: string
  name: string
  nameAl?: string
  type: string
  description?: string
  descriptionAl?: string
  deliveryTime?: string
  deliveryTimeAl?: string
  logo?: string
  isActive: boolean
  _count?: {
    pricing: number
  }
}

interface PostalsManagementProps {
  businessId: string
}

export function PostalsManagement({ businessId }: PostalsManagementProps) {
  const [postals, setPostals] = useState<Postal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingPostal, setEditingPostal] = useState<Postal | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; postal: Postal | null }>({
    isOpen: false,
    postal: null
  })

  useEffect(() => {
    fetchPostals()
  }, [businessId])

  const fetchPostals = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/postals`)
      if (response.ok) {
        const data = await response.json()
        setPostals(data.postals || [])
      }
    } catch (error) {
      console.error('Error fetching postals:', error)
      setError('Failed to load postal services')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (postal: Postal) => {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const url = postal.id
        ? `/api/admin/stores/${businessId}/postals/${postal.id}`
        : `/api/admin/stores/${businessId}/postals`
      
      const method = postal.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postal)
      })

      if (response.ok) {
        setSuccessMessage(postal.id ? 'Postal service updated successfully' : 'Postal service created successfully')
        setEditingPostal(null)
        setShowAddForm(false)
        fetchPostals()
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to save postal service')
      }
    } catch (error) {
      console.error('Error saving postal:', error)
      setError('Failed to save postal service')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (postal: Postal) => {
    if (postal.id) {
      setDeleteModal({ isOpen: true, postal })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteModal.postal?.id) return

    const postalId = deleteModal.postal.id

    try {
      const response = await fetch(`/api/admin/stores/${businessId}/postals/${postalId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccessMessage('Postal service deleted successfully')
        setDeleteModal({ isOpen: false, postal: null })
        fetchPostals()
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to delete postal service')
        setDeleteModal({ isOpen: false, postal: null })
      }
    } catch (error) {
      console.error('Error deleting postal:', error)
      setError('Failed to delete postal service')
      setDeleteModal({ isOpen: false, postal: null })
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, postal: null })
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Postal Services</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage postal services for your retail business
          </p>
        </div>
        {!showAddForm && !editingPostal && (
          <button
            onClick={() => {
              setShowAddForm(true)
              setEditingPostal(null)
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span className="whitespace-nowrap">Add Postal Service</span>
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingPostal) && (
        <PostalForm
          postal={editingPostal || {
            name: '',
            nameAl: '',
            type: 'normal',
            description: '',
            descriptionAl: '',
            deliveryTime: '',
            deliveryTimeAl: '',
            logo: '',
            isActive: true
          }}
          onSave={handleSave}
          onCancel={() => {
            setShowAddForm(false)
            setEditingPostal(null)
          }}
          saving={saving}
        />
      )}

      {/* Postals List */}
      <div className="space-y-3">
        {postals.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No postal services yet</p>
            <p className="text-sm text-gray-500 mt-1">Add your first postal service to get started</p>
          </div>
        ) : (
          postals.map((postal) => (
            <div
              key={postal.id}
              className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {postal.logo && (
                        <img
                          src={postal.logo}
                          alt={postal.name}
                          className="w-12 h-12 object-contain rounded flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{postal.name}</h3>
                        {postal.nameAl && (
                          <p className="text-sm text-gray-600 truncate">{postal.nameAl}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                        postal.type === 'fast' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {postal.type === 'fast' ? 'Fast' : 'Normal'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                        postal.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {postal.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  {postal.description && (
                    <p className="text-sm text-gray-600 mt-2 break-words">{postal.description}</p>
                  )}
                  {postal.deliveryTime && (
                    <p className="text-sm text-gray-500 mt-1 break-words">
                      Delivery: {postal.deliveryTime}
                    </p>
                  )}
                  {postal._count && postal._count.pricing > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {postal._count.pricing} pricing {postal._count.pricing === 1 ? 'record' : 'records'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingPostal(postal)
                      setShowAddForm(false)
                    }}
                    className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(postal)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                    disabled={postal._count && postal._count.pricing > 0}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.postal && (
        <DeleteConfirmationModal
          postal={deleteModal.postal}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  )
}

// Delete Confirmation Modal Component
interface DeleteConfirmationModalProps {
  postal: Postal
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmationModal({ postal, onConfirm, onCancel }: DeleteConfirmationModalProps) {
  const hasPricing = postal._count && postal._count.pricing > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Delete Postal Service
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-3">
              Are you sure you want to delete <strong>"{postal.name}"</strong>?
            </p>
            {hasPricing && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ This postal service has {postal._count?.pricing} pricing {postal._count?.pricing === 1 ? 'record' : 'records'}. 
                  Deleting it may affect existing orders.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete Postal Service
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PostalFormProps {
  postal: Postal
  onSave: (postal: Postal) => void
  onCancel: () => void
  saving: boolean
}

function PostalForm({ postal, onSave, onCancel, saving }: PostalFormProps) {
  const [formData, setFormData] = useState<Postal>(postal)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name (English) *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name (Albanian)
          </label>
          <input
            type="text"
            value={formData.nameAl || ''}
            onChange={(e) => setFormData({ ...formData, nameAl: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo URL
          </label>
          <input
            type="text"
            value={formData.logo || ''}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            placeholder="https://example.com/logo.png"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (English)
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Albanian)
          </label>
          <textarea
            value={formData.descriptionAl || ''}
            onChange={(e) => setFormData({ ...formData, descriptionAl: e.target.value })}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Time (English)
          </label>
          <input
            type="text"
            value={formData.deliveryTime || ''}
            onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
            placeholder="e.g., 3-5 days"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Time (Albanian)
          </label>
          <input
            type="text"
            value={formData.deliveryTimeAl || ''}
            onChange={(e) => setFormData({ ...formData, deliveryTimeAl: e.target.value })}
            placeholder="e.g., 3-5 ditë"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Active
        </label>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  )
}
