'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
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
  X,
  AlertTriangle,
  Crown
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  nameAl?: string
  nameEl?: string
  description?: string
  descriptionAl?: string
  descriptionEl?: string
  parentId?: string
  parent?: {
    id: string
    name: string
    nameAl?: string
  }
  children?: Array<{
    id: string
    name: string
    nameAl?: string
    sortOrder: number
  }>
  business?: {
    id: string
    name: string
  }
  hideParentInStorefront?: boolean
  image?: string
  sortOrder: number
  isActive: boolean
  _count: {
    products: number
    children?: number
  }
}

interface CategoriesPageProps {
    businessId: string
}

export default function CategoriesPage({ businessId }: CategoriesPageProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [totalProducts, setTotalProducts] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [limitError, setLimitError] = useState<{ currentCount: number; limit: number; plan: string } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    fetchCategories()
  }, [businessId, currentPage])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stores/${businessId}/categories?page=${currentPage}&limit=${ITEMS_PER_PAGE}`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
        setTotalProducts(data.totalProducts || 0)
        setPagination(data.pagination || null)
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

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
  }

  const confirmDelete = async (confirmationText?: string) => {
    if (!categoryToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: confirmationText || undefined })
      })

      if (response.ok) {
        // Remove the deleted category and all its children from the list
        const categoryIdToDelete = categoryToDelete.id
        setCategories(prev => prev.filter(c => 
          c.id !== categoryIdToDelete && c.parentId !== categoryIdToDelete
        ))
        setCategoryToDelete(null)
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Error deleting category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Error deleting category. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setCategoryToDelete(null)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
          className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors w-full sm:w-auto"
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
                {totalProducts || categories.reduce((sum, c) => sum + (c.parentId ? 0 : c._count.products), 0)}
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
              Categories
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Organize categories and subcategories
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {(() => {
              // Separate parent and child categories
              const parentCategories = categories.filter(c => !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder)
              const childCategories = categories.filter(c => c.parentId)
              
              return parentCategories.map((category) => {
                const children = childCategories.filter(c => c.parentId === category.id).sort((a, b) => a.sortOrder - b.sortOrder)
                const isExpanded = expandedParents.has(category.id)
                
                return (
                  <div key={category.id}>
                    {/* Parent Category */}
                    <div
                      draggable
                      onDragStart={() => handleDragStart(category.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, category.id)}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-move ${
                        draggedCategory === category.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Expand/Collapse & Drag Handle */}
                        <div className="flex items-center gap-2">
                          {children.length > 0 && (
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedParents)
                                if (isExpanded) {
                                  newExpanded.delete(category.id)
                                } else {
                                  newExpanded.add(category.id)
                                }
                                setExpandedParents(newExpanded)
                              }}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          )}
                          {children.length === 0 && <div className="w-6" />}
                          <div className="cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-5 h-5 text-gray-400" />
                          </div>
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
                            {category.nameAl && (
                              <span className="text-xs text-gray-500">({category.nameAl})</span>
                            )}
                            {category.business && category.business.id !== businessId && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                                {category.business.name}
                              </span>
                            )}
                            {!category.isActive && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                Inactive
                              </span>
                            )}
                            {category.hideParentInStorefront && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                                Hidden in storefront
                              </span>
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{category._count.products} product(s)</span>
                            {category._count.children && category._count.children > 0 && (
                              <span>{category._count.children} subcategor{category._count.children !== 1 ? 'ies' : 'y'}</span>
                            )}
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
                            onClick={() => handleDeleteClick(category)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Child Categories */}
                    {isExpanded && children.length > 0 && (
                      <div className="bg-gray-50">
                        {children.map((child) => (
                          <div
                            key={child.id}
                            draggable
                            onDragStart={() => handleDragStart(child.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, child.id)}
                            className={`pl-12 pr-4 py-3 hover:bg-gray-100 transition-colors cursor-move border-t border-gray-200 ${
                              draggedCategory === child.id ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              {/* Drag Handle */}
                              <div className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                              </div>

                              {/* Category Image */}
                              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                                {child.image ? (
                                  <img
                                    src={child.image}
                                    alt={child.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-5 h-5 text-gray-400" />
                                )}
                              </div>

                              {/* Category Info */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-700 text-sm">{child.name}</h4>
                                  {child.nameAl && (
                                    <span className="text-xs text-gray-500">({child.nameAl})</span>
                                  )}
                                  {!child.isActive && (
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                                {child.description && (
                                  <p className="text-xs text-gray-600 mt-1">{child.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                  <span>{child._count.products} product(s)</span>
                                  <span>Sort: {child.sortOrder}</span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => toggleCategoryStatus(child.id, !child.isActive)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    child.isActive 
                                      ? 'text-green-600 hover:bg-green-50'
                                      : 'text-gray-400 hover:bg-gray-50'
                                  }`}
                                >
                                  {child.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => {
                                    setEditingCategory(child)
                                    setShowForm(true)
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteClick(child)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={currentPage === pagination.pages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)}</span> of{' '}
                    <span className="font-medium">{pagination.total}</span> categories
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronRight className="h-5 w-5 rotate-180" />
                    </button>
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      let pageNum
                      if (pagination.pages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= pagination.pages - 2) {
                        pageNum = pagination.pages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === pageNum
                              ? 'z-10 bg-teal-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={currentPage === pagination.pages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Limit Reached Alert */}
      {limitError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="bg-amber-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-amber-800 mb-1">Category Limit Reached</h3>
              <p className="text-amber-700 mb-2">
                You have reached the maximum number of categories for your plan.
              </p>
              <p className="text-sm text-amber-600 mb-4">
                Your <span className="font-semibold">{limitError.plan}</span> plan allows up to{' '}
                <span className="font-semibold">{limitError.limit}</span> categories. You currently have{' '}
                <span className="font-semibold">{limitError.currentCount}</span>.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/admin/stores/${businessId}/settings/billing`}
                  className="inline-flex items-center px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to add more categories
                </Link>
                <button
                  onClick={() => setLimitError(null)}
                  className="px-4 py-2 text-amber-700 hover:text-amber-800"
                >
                  Dismiss
                </button>
              </div>
            </div>
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
          onLimitError={(error) => setLimitError(error)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <DeleteConfirmationModal
          category={categoryToDelete}
          isDeleting={isDeleting}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  )
}

// Delete Confirmation Modal Component
interface DeleteConfirmationModalProps {
  category: Category
  isDeleting: boolean
  onConfirm: (confirmationText?: string) => void
  onCancel: () => void
}

function DeleteConfirmationModal({ category, isDeleting, onConfirm, onCancel }: DeleteConfirmationModalProps) {
  const [confirmationText, setConfirmationText] = useState('')
  const hasProducts = category._count.products > 0
  const hasChildren = (category._count.children || 0) > 0
  const requiresConfirmation = hasChildren

  const canConfirm = !requiresConfirmation || confirmationText === 'DELETE'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Category
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the category "{category.name}"?
            </p>
            
            {hasChildren && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      ⚠️ This category has {category._count.children} subcategor{(category._count.children || 0) !== 1 ? 'ies' : 'y'}
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      Deleting this category will <strong>permanently delete all subcategories and their products</strong>. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type <strong>DELETE</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Type DELETE here"
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={isDeleting}
                  />
                  {confirmationText && confirmationText !== 'DELETE' && (
                    <p className="text-xs text-red-600 mt-1">
                      Please type exactly "DELETE" to confirm
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {hasProducts && !hasChildren && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Warning: This category contains {category._count.products} product(s)
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      Deleting this category will also permanently delete all products within it. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {!hasChildren && (
              <p className="text-sm text-gray-500">
                This action cannot be undone.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => {
              setConfirmationText('')
              onCancel()
            }}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(requiresConfirmation ? confirmationText : undefined)}
            disabled={isDeleting || !canConfirm}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Category
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Category Form Component
interface CategoryFormProps {
  businessId: string
  category: Category | null
  onSave: (category: Category) => void
  onCancel: () => void
  onLimitError?: (error: { currentCount: number; limit: number; plan: string }) => void
}

function CategoryForm({ businessId, category, onSave, onCancel, onLimitError }: CategoryFormProps) {
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [businessLanguage, setBusinessLanguage] = useState<string>('en')
  const [form, setForm] = useState({
    name: category?.name || '',
    nameAl: category?.nameAl || '',
    nameEl: category?.nameEl || '',
    description: category?.description || '',
    descriptionAl: category?.descriptionAl || '',
    descriptionEl: category?.descriptionEl || '',
    parentId: category?.parentId || '',
    hideParentInStorefront: category?.hideParentInStorefront ?? false,
    image: category?.image || '',
    isActive: category?.isActive ?? true
  })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'al' | 'el'>('en')

  // Fetch business language
  useEffect(() => {
    const fetchBusinessLanguage = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          const lang = data.business.storefrontLanguage || data.business.language || 'en'
          setBusinessLanguage(lang)
        }
      } catch (error) {
        console.error('Error fetching business language:', error)
      }
    }
    fetchBusinessLanguage()
  }, [businessId])

  // Fetch all categories for parent selector (lightweight for dropdown)
  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/categories?lightweight=true`)
        if (response.ok) {
          const data = await response.json()
          setAllCategories(data.categories || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchAllCategories()
  }, [businessId])

  // Filter out current category and its descendants from parent options
  const getAvailableParents = () => {
    if (!category) return allCategories.filter(c => !c.parentId) // Only top-level categories for new items
    return allCategories.filter(c => 
      c.id !== category.id && // Not self
      c.parentId === null && // Only top-level categories can be parents
      !isDescendant(c.id, category.id) // Not a descendant of current category
    )
  }

  const isDescendant = (categoryId: string, ancestorId: string): boolean => {
    const cat = allCategories.find(c => c.id === categoryId)
    if (!cat || !cat.parentId) return false
    if (cat.parentId === ancestorId) return true
    return isDescendant(cat.parentId, ancestorId)
  }

 // Fixed handleImageUpload function in CategoryForm component
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file) // Keep existing field name
      formData.append('folder', 'categories') // Specify category folder
      if (form.image) {
        formData.append('oldImageUrl', form.image) // Pass old image for cleanup
      }

      const response = await fetch(`/api/admin/stores/${businessId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setForm(prev => ({ ...prev, image: data.imageUrl })) // Use imageUrl (your existing field name)
      } else {
        const errorData = await response.json()
        console.error('Upload failed:', errorData.message)
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
        body: JSON.stringify({
          ...form,
          parentId: form.parentId || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        onSave(data.category)
      } else {
        const errorData = await response.json()
        // Handle category limit reached error
        if (errorData.code === 'CATEGORY_LIMIT_REACHED' && onLimitError) {
          onLimitError({
            currentCount: errorData.currentCount,
            limit: errorData.limit,
            plan: errorData.plan
          })
          onCancel() // Close the form
        } else {
          toast.error(errorData.message || 'Error saving category')
        }
      }
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Error saving category. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const availableParents = getAvailableParents()
  const isParentCategory = !form.parentId
  const hasChildren = category?.children && category.children.length > 0
  const canShowHideParentToggle = isParentCategory && (hasChildren || !category)

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

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          {/* Language Toggle - Show for Albanian or Greek businesses */}
          {(businessLanguage === 'sq' || businessLanguage === 'el') && (
            <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setActiveLanguage('en')}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                  activeLanguage === 'en'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                English
              </button>
              {businessLanguage === 'sq' && (
                <button
                  type="button"
                  onClick={() => setActiveLanguage('al')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                    activeLanguage === 'al'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Albanian
                </button>
              )}
              {businessLanguage === 'el' && (
                <button
                  type="button"
                  onClick={() => setActiveLanguage('el')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                    activeLanguage === 'el'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Greek
                </button>
              )}
            </div>
          )}

          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name {activeLanguage === 'en' ? '(English)' : activeLanguage === 'el' ? '(Greek)' : '(Albanian)'} *
            </label>
            <input
              type="text"
              required={activeLanguage === 'en'}
              value={activeLanguage === 'en' ? form.name : activeLanguage === 'el' ? form.nameEl : form.nameAl}
              onChange={(e) => setForm(prev => ({ 
                ...prev, 
                [activeLanguage === 'en' ? 'name' : activeLanguage === 'el' ? 'nameEl' : 'nameAl']: e.target.value 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder={activeLanguage === 'en' ? "e.g., Main Courses" : activeLanguage === 'el' ? "π.χ., Κυρίως Πιάτα" : "e.g., Kryesor"}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description {activeLanguage === 'en' ? '(English)' : activeLanguage === 'el' ? '(Greek)' : '(Albanian)'}
            </label>
            <textarea
              value={activeLanguage === 'en' ? form.description : activeLanguage === 'el' ? form.descriptionEl : form.descriptionAl}
              onChange={(e) => setForm(prev => ({ 
                ...prev, 
                [activeLanguage === 'en' ? 'description' : activeLanguage === 'el' ? 'descriptionEl' : 'descriptionAl']: e.target.value 
              }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              placeholder="Optional description"
            />
          </div>

          {/* Parent Category Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Category
            </label>
            <select
              value={form.parentId}
              onChange={(e) => setForm(prev => ({ ...prev, parentId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
            >
              <option value="">None (Top-level category)</option>
              {availableParents.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {form.parentId ? 'This will be a subcategory' : 'This will be a top-level category'}
            </p>
          </div>

          {/* Hide Parent in Storefront Toggle - Only for parent categories */}
          {canShowHideParentToggle && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="hideParentInStorefront"
                  checked={form.hideParentInStorefront}
                  onChange={(e) => setForm(prev => ({ ...prev, hideParentInStorefront: e.target.checked }))}
                  className="mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="hideParentInStorefront" className="ml-3 text-sm text-gray-700">
                  <span className="font-medium">Hide parent category in storefront</span>
                  <p className="mt-1 text-xs text-gray-600">
                    When there's only one parent category, hide it and show only subcategories in a flat horizontal layout
                  </p>
                </label>
              </div>
            </div>
          )}

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