'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  GripVertical, 
  Package, 
  Eye, 
  EyeOff,
  Image as ImageIcon,
  Save,
  X
} from 'lucide-react'

interface Category {
  id: string
  name: string
  description?: string
  image?: string
  sortOrder: number
  isActive: boolean
  _count: {
    products: number
  }
}

interface CategoriesPageProps {
    businessId: string
}

export default function CategoriesPage({ businessId }: CategoriesPageProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [businessId])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/categories`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (categoryId: string) => {
    setDraggedCategory(categoryId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault()
    
    if (!draggedCategory || draggedCategory === targetCategoryId) {
      setDraggedCategory(null)
      return
    }

    const draggedIndex = categories.findIndex(c => c.id === draggedCategory)
    const targetIndex = categories.findIndex(c => c.id === targetCategoryId)
    
    if (draggedIndex === -1 || targetIndex === -1) return

    // Create new array with reordered categories
    const newCategories = [...categories]
    const [removed] = newCategories.splice(draggedIndex, 1)
    newCategories.splice(targetIndex, 0, removed)

    // Update sort orders
    const updatedCategories = newCategories.map((cat, index) => ({
      ...cat,
      sortOrder: index
    }))

    setCategories(updatedCategories)
    setDraggedCategory(null)

    // Save new order to backend
    try {
      await fetch(`/api/admin/stores/${businessId}/categories/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: updatedCategories.map(cat => ({
            id: cat.id,
            sortOrder: cat.sortOrder
          }))
        })
      })
    } catch (error) {
      console.error('Error updating category order:', error)
      // Revert on error
      fetchCategories()
    }
  }

  const toggleCategoryStatus = async (categoryId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        setCategories(prev => prev.map(c => 
          c.id === categoryId ? { ...c, isActive } : c
        ))
      }
    } catch (error) {
      console.error('Error updating category status:', error)
    }
  }

  const deleteCategory = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    
    if (category && category._count.products > 0) {
      if (!confirm(`This category has ${category._count.products} product(s). Are you sure you want to delete it? This will also delete all products in this category.`)) {
        return
      }
    } else if (!confirm('Are you sure you want to delete this category?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/stores/${businessId}/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCategories(prev => prev.filter(c => c.id !== categoryId))
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">
            Organize your products into categories
          </p>
        </div>
        
        <button
          onClick={() => {
            setEditingCategory(null)
            setShowForm(true)
          }}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <Package className="w-8 h-8 text-teal-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Categories</p>
              <p className="text-2xl font-bold text-green-600">
                {categories.filter(c => c.isActive).length}
              </p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-purple-600">
                {categories.reduce((sum, c) => sum + c._count.products, 0)}
              </p>
            </div>
            <Package className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories yet</h3>
          <p className="text-gray-600 mb-6">
            Start organizing your products by creating your first category
          </p>
          <button
            onClick={() => {
              setEditingCategory(null)
              setShowForm(true)
            }}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Category
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">
              Drag and drop to reorder categories
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              The order here determines how categories appear to customers
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {categories.map((category) => (
              <div
                key={category.id}
                draggable
                onDragStart={() => handleDragStart(category.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, category.id)}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-move ${
                  draggedCategory === category.id ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Category Image */}
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>

                  {/* Category Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{category.name}</h4>
                      {!category.isActive && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{category._count.products} product(s)</span>
                      <span>Sort order: {category.sortOrder}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleCategoryStatus(category.id, !category.isActive)}
                      className={`p-2 rounded-lg transition-colors ${
                        category.isActive 
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {category.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        setEditingCategory(category)
                        setShowForm(true)
                      }}
                      className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm
          businessId={businessId}
          category={editingCategory}
          onSave={(savedCategory) => {
            if (editingCategory) {
              setCategories(prev => prev.map(c => 
                c.id === savedCategory.id ? savedCategory : c
              ))
            } else {
              setCategories(prev => [...prev, savedCategory])
            }
            setShowForm(false)
            setEditingCategory(null)
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingCategory(null)
          }}
        />
      )}
    </div>
  )
}

// Category Form Component
interface CategoryFormProps {
  businessId: string
  category: Category | null
  onSave: (category: Category) => void
  onCancel: () => void
}

function CategoryForm({ businessId, category, onSave, onCancel }: CategoryFormProps) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || '',
    image: category?.image || '',
    isActive: category?.isActive ?? true
  })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch(`/api/admin/stores/${businessId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setForm(prev => ({ ...prev, image: data.imageUrl }))
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = category 
        ? `/api/admin/stores/${businessId}/categories/${category.id}`
        : `/api/admin/stores/${businessId}/categories`
      
      const method = category ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      if (response.ok) {
        const data = await response.json()
        onSave(data.category)
      }
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {category ? 'Edit Category' : 'Add New Category'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g., Main Courses"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Image
            </label>
            
            {form.image ? (
              <div className="relative">
                <img
                  src={form.image}
                  alt="Category"
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                  className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-teal-500 transition-colors">
                {uploadingImage ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mx-auto mb-2"></div>
                    <span className="text-xs text-gray-500">Uploading...</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-gray-500">Add Image</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Active category
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : (category ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}