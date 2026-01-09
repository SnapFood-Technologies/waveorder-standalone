// src/components/admin/postals/PostalsManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Edit2, Trash2, Save, X, Upload, Image as ImageIcon } from 'lucide-react'

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

  const handleDelete = async (postalId: string) => {
    if (!confirm('Are you sure you want to delete this postal service? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/stores/${businessId}/postals/${postalId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccessMessage('Postal service deleted successfully')
        fetchPostals()
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to delete postal service')
      }
    } catch (error) {
      console.error('Error deleting postal:', error)
      setError('Failed to delete postal service')
    }
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
      <div className="flex items-center justify-between">
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
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Postal Service
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
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {postal.logo && (
                      <img
                        src={postal.logo}
                        alt={postal.name}
                        className="w-12 h-12 object-contain rounded"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{postal.name}</h3>
                      {postal.nameAl && (
                        <p className="text-sm text-gray-600">{postal.nameAl}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      postal.type === 'fast' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {postal.type === 'fast' ? 'Fast' : 'Normal'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      postal.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {postal.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {postal.description && (
                    <p className="text-sm text-gray-600 mt-2">{postal.description}</p>
                  )}
                  {postal.deliveryTime && (
                    <p className="text-sm text-gray-500 mt-1">
                      Delivery: {postal.deliveryTime}
                    </p>
                  )}
                  {postal._count && postal._count.pricing > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {postal._count.pricing} pricing {postal._count.pricing === 1 ? 'record' : 'records'}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
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
                    onClick={() => postal.id && handleDelete(postal.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
      <div className="flex items-center gap-3 pt-4 border-t">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  )
}
