'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Sparkles,
  Package,
  Loader2,
  X,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle,
  Star
} from 'lucide-react'

interface Collection {
  id: string
  name: string
  nameAl?: string | null
  description?: string | null
  image?: string | null
  sortOrder: number
  isActive: boolean
  featured: boolean
  business: {
    id: string
    name: string
  }
  _count: {
    products: number
  }
}

export default function CollectionsPage() {
  const params = useParams()
  const businessId = params.businessId as string

  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [featureDisabled, setFeatureDisabled] = useState(false)
  const [business, setBusiness] = useState<{ language?: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nameAl: '',
    description: '',
    image: '',
    isActive: true,
    featured: false
  })

  useEffect(() => {
    fetchBusiness()
    fetchCollections()
  }, [businessId])

  const fetchBusiness = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusiness(data.business)
      }
    } catch (error) {
      console.error('Error fetching business:', error)
    }
  }

  const fetchCollections = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/collections`)
      if (response.status === 403) {
        // Feature is disabled
        setFeatureDisabled(true)
        setLoading(false)
        return
      }
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections)
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenForm = (collection?: Collection) => {
    if (collection) {
      setEditingCollection(collection)
      setFormData({
        name: collection.name,
        nameAl: collection.nameAl || '',
        description: collection.description || '',
        image: collection.image || '',
        isActive: collection.isActive,
        featured: collection.featured
      })
    } else {
      setEditingCollection(null)
      setFormData({
        name: '',
        nameAl: '',
        description: '',
        image: '',
        isActive: true,
        featured: false
      })
    }
    setShowForm(true)
    setError(null)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCollection(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const url = editingCollection
        ? `/api/admin/stores/${businessId}/collections/${editingCollection.id}`
        : `/api/admin/stores/${businessId}/collections`
      
      const method = editingCollection ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save collection')
      }

      await fetchCollections()
      handleCloseForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!collectionToDelete) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/collections/${collectionToDelete.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete collection')
      }

      await fetchCollections()
      setCollectionToDelete(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (featureDisabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Collections Feature Not Enabled</h3>
        <p className="text-gray-600 mb-4">
          The collections feature is not enabled for your business. Please contact your administrator to enable this feature.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-sm text-gray-600 mt-1">Manage product collections</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Collection
        </button>
      </div>

      {/* Collections Grid */}
      {collections.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No collections yet</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first collection.</p>
          <button
            onClick={() => handleOpenForm()}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Collection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <div key={collection.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative h-48 bg-gray-100">
                {collection.image ? (
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {collection.featured && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-400 text-yellow-900 rounded-lg flex items-center gap-1 text-xs font-medium">
                    <Star className="w-3 h-3" />
                    Featured
                  </div>
                )}
                {!collection.isActive && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-gray-900 bg-opacity-75 text-white rounded text-xs font-medium">
                    Inactive
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900">{collection.name}</h3>
                  {collection.business.id !== businessId && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {collection.business.name}
                    </span>
                  )}
                </div>
                {collection.description && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{collection.description}</p>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
                  <Package className="w-4 h-4" />
                  <span>{collection._count.products} products</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenForm(collection)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => setCollectionToDelete(collection)}
                    className="px-3 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                    disabled={collection._count.products > 0}
                    title={collection._count.products > 0 ? 'Cannot delete collection with products' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCollection ? 'Edit Collection' : 'Add Collection'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
              </div>

              {business?.language === 'sq' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Collection Name (Albanian)
                  </label>
                  <input
                    type="text"
                    value={formData.nameAl}
                    onChange={(e) => setFormData({ ...formData, nameAl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://example.com/collection-image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                  />
                  <label htmlFor="featured" className="text-sm text-gray-700">
                    Featured
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 inline-flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {editingCollection ? 'Update' : 'Create'} Collection
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {collectionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Collection</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to delete <strong>{collectionToDelete.name}</strong>?
              {collectionToDelete._count.products > 0 && (
                <span className="block mt-2 text-red-600">
                  This collection has {collectionToDelete._count.products} associated products and cannot be deleted.
                </span>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCollectionToDelete(null)
                  setError(null)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting || collectionToDelete._count.products > 0}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
