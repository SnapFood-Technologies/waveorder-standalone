// src/components/admin/postals/PostalPricingManagement.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, Plus, Edit2, Trash2, Save, X, Package, ChevronDown, Search, AlertTriangle, Loader2 } from 'lucide-react'

interface Postal {
  id: string
  name: string
  nameAl?: string
  nameEl?: string
  type: string
  logo?: string
}

interface PostalPricing {
  id?: string
  postalId: string
  cityName: string
  type: string
  price: number
  priceWithoutTax?: number
  minOrderValue?: number
  maxOrderValue?: number
  deliveryTime?: string
  deliveryTimeAl?: string
  deliveryTimeEl?: string
  notes?: string
  postal?: Postal
}

interface PostalPricingManagementProps {
  businessId: string
}

export function PostalPricingManagement({ businessId }: PostalPricingManagementProps) {
  const [pricing, setPricing] = useState<PostalPricing[]>([])
  const [postals, setPostals] = useState<Postal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingPricing, setEditingPricing] = useState<PostalPricing | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [filterCity, setFilterCity] = useState<string>('')
  const [filterPostal, setFilterPostal] = useState<string>('')
  const [deleteModalPricing, setDeleteModalPricing] = useState<PostalPricing | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [businessId])

  const fetchData = async () => {
    try {
      const [pricingRes, postalsRes] = await Promise.all([
        fetch(`/api/admin/stores/${businessId}/postal-pricing`),
        fetch(`/api/admin/stores/${businessId}/postals`)
      ])

      if (pricingRes.ok) {
        const data = await pricingRes.json()
        setPricing(data.pricing || [])
      }

      if (postalsRes.ok) {
        const data = await postalsRes.json()
        setPostals(data.postals || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load postal pricing')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (pricingData: PostalPricing) => {
    setSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const url = pricingData.id
        ? `/api/admin/stores/${businessId}/postal-pricing/${pricingData.id}`
        : `/api/admin/stores/${businessId}/postal-pricing`
      
      const method = pricingData.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingData)
      })

      if (response.ok) {
        setSuccessMessage(pricingData.id ? 'Pricing updated successfully' : 'Pricing created successfully')
        setEditingPricing(null)
        setShowAddForm(false)
        fetchData()
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to save pricing')
      }
    } catch (error) {
      console.error('Error saving pricing:', error)
      setError('Failed to save pricing')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (pricingItem: PostalPricing) => {
    setDeleteModalPricing(pricingItem)
  }

  const confirmDelete = async () => {
    if (!deleteModalPricing) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/postal-pricing/${deleteModalPricing.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccessMessage('Pricing deleted successfully')
        setDeleteModalPricing(null)
        fetchData()
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to delete pricing')
      }
    } catch (error) {
      console.error('Error deleting pricing:', error)
      setError('Failed to delete pricing')
    } finally {
      setIsDeleting(false)
    }
  }

  // Get unique cities from pricing
  const cities = Array.from(new Set(pricing.map(p => p.cityName))).sort()

  // Filter pricing
  const filteredPricing = pricing.filter(p => {
    if (filterCity && p.cityName.toLowerCase() !== filterCity.toLowerCase()) return false
    if (filterPostal && p.postalId !== filterPostal) return false
    return true
  })

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
          <h2 className="text-xl font-bold text-gray-900">Postal Pricing</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage pricing for postal services by city
          </p>
        </div>
        {!showAddForm && !editingPricing && (
          <button
            onClick={() => {
              setShowAddForm(true)
              setEditingPricing(null)
            }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span className="whitespace-nowrap">Add Pricing</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by City
          </label>
          <SearchableCityFilter
            cities={cities}
            value={filterCity}
            onChange={setFilterCity}
            placeholder="All Cities"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Postal Service
          </label>
          <select
            value={filterPostal}
            onChange={(e) => setFilterPostal(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">All Services</option>
            {postals.map(postal => (
              <option key={postal.id} value={postal.id}>{postal.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingPricing) && (
        <PricingForm
          pricing={editingPricing || {
            postalId: '',
            cityName: '',
            type: 'normal',
            price: 0,
            priceWithoutTax: undefined,
            minOrderValue: undefined,
            maxOrderValue: undefined,
            deliveryTime: '',
            deliveryTimeAl: '',
            deliveryTimeEl: '',
            notes: ''
          }}
          postals={postals}
          onSave={handleSave}
          onCancel={() => {
            setShowAddForm(false)
            setEditingPricing(null)
          }}
          saving={saving}
        />
      )}

      {/* Pricing List */}
      <div className="space-y-3">
        {filteredPricing.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No pricing records yet</p>
            <p className="text-sm text-gray-500 mt-1">Add pricing for your postal services by city</p>
          </div>
        ) : (
          filteredPricing.map((p) => {
            const postal = postals.find(po => po.id === p.postalId)
            return (
              <div
                key={p.id}
                className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {postal?.logo && (
                          <img
                            src={postal.logo}
                            alt={postal.name}
                            className="w-10 h-10 object-contain rounded flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {postal?.name || 'Unknown Postal'}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{p.cityName}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0 ${
                        p.type === 'fast' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {p.type === 'fast' ? 'Fast' : 'Normal'}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <span className="font-semibold text-gray-900 ml-2">{p.price.toFixed(2)}</span>
                      </div>
                      {p.minOrderValue !== undefined && p.minOrderValue !== null && (
                        <div>
                          <span className="text-gray-500">Min Order:</span>
                          <span className="font-semibold text-gray-900 ml-2">{p.minOrderValue.toFixed(2)}</span>
                        </div>
                      )}
                      {p.deliveryTime && (
                        <div className="break-words">
                          <span className="text-gray-500">Delivery:</span>
                          <span className="font-semibold text-gray-900 ml-2">{p.deliveryTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-4 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditingPricing(p)
                        setShowAddForm(false)
                      }}
                      className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalPricing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Delete Postal Pricing
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to delete pricing for "{deleteModalPricing.cityName}"? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteModalPricing(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface PricingFormProps {
  pricing: PostalPricing
  postals: Postal[]
  onSave: (pricing: PostalPricing) => void
  onCancel: () => void
  saving: boolean
}

function PricingForm({ pricing, postals, onSave, onCancel, saving }: PricingFormProps) {
  const [formData, setFormData] = useState<PostalPricing>(pricing)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Postal Service *
          </label>
          <select
            value={formData.postalId}
            onChange={(e) => setFormData({ ...formData, postalId: e.target.value })}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="">Select postal service</option>
            {postals.map(postal => (
              <option key={postal.id} value={postal.id}>{postal.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City Name *
          </label>
          <input
            type="text"
            value={formData.cityName}
            onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
            required
            placeholder="e.g., Tirana"
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
            Price *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price Without Tax
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.priceWithoutTax || ''}
            onChange={(e) => setFormData({ ...formData, priceWithoutTax: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Order Value
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.minOrderValue || ''}
            onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="Optional"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Order Value
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.maxOrderValue || ''}
            onChange={(e) => setFormData({ ...formData, maxOrderValue: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="Optional"
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Time (Greek)
          </label>
          <input
            type="text"
            value={formData.deliveryTimeEl || ''}
            onChange={(e) => setFormData({ ...formData, deliveryTimeEl: e.target.value })}
            placeholder="e.g., 3-5 ημέρες"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
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

// Searchable City Filter Component
function SearchableCityFilter({
  cities,
  value,
  onChange,
  placeholder = 'All Cities'
}: {
  cities: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)

  // Filter cities based on search term
  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedCity = value ? cities.find(c => c === value) : null

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-left flex items-center justify-between bg-white hover:border-gray-400 transition-colors"
      >
        <span className={selectedCity ? 'text-gray-900' : 'text-gray-500'}>
          {selectedCity || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-48">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setIsOpen(false)
                setSearchTerm('')
              }}
              className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                !value ? 'bg-teal-50 text-teal-900 font-medium' : 'text-gray-900'
              }`}
            >
              {placeholder}
            </button>
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    onChange(city)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    value === city ? 'bg-teal-50 text-teal-900 font-medium' : 'text-gray-900'
                  }`}
                >
                  {city}
                </button>
              ))
            ) : searchTerm ? (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No cities found
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
