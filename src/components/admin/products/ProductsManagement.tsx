// app/admin/stores/[businessId]/products/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Star, 
  AlertTriangle,
  Eye,
  EyeOff,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useSubscription } from '@/hooks/useSubscription'
import { useImpersonation } from '@/lib/impersonation'

interface Product {
  id: string
  name: string
  description?: string
  images: string[]
  price: number
  originalPrice?: number
  sku?: string
  stock: number
  trackInventory: boolean
  lowStockAlert?: number
  isActive: boolean
  featured: boolean
  categoryId: string
  category: {
    id: string
    name: string
  }
  business: {
    id: string
    name: string
  }
  variants: ProductVariant[]
  modifiers: ProductModifier[]
  createdAt: string
  updatedAt: string
}

interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
  sku?: string
}

interface ProductModifier {
  id: string
  name: string
  price: number
  required: boolean
}

interface Category {
  id: string
  name: string
  isActive: boolean
  _count: {
    products: number
  }
}

interface Business {
  currency: string
}

interface ProductsPageProps {
  businessId: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function ProductsManagement({ businessId }: ProductsPageProps) {
  const { addParams } = useImpersonation(businessId)
  
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [business, setBusiness] = useState<Business>({ currency: 'USD' })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'low-stock'>('all')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  })
  const [stats, setStats] = useState({
    active: 0,
    lowStock: 0,
    featured: 0
  })

  const { isPro } = useSubscription()

  // Fetch categories only once on mount (they rarely change)
  useEffect(() => {
    fetchBusinessData()
    fetchCategories()
  }, [businessId])

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts()
  }, [businessId, currentPage, debouncedSearchTerm, selectedCategory, filterStatus])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      if (searchTerm !== debouncedSearchTerm) {
        setCurrentPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Check for low-stock filter from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const filter = urlParams.get('filter')
    if (filter === 'low-stock') {
      setFilterStatus('low-stock')
    }
  }, [])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusiness({ currency: data.business.currency })
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    }
  }

  // Fetch categories once (they rarely change)
  const fetchCategories = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/categories?lightweight=true`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  // Fetch products (called on filter/page changes)
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        search: debouncedSearchTerm,
        category: selectedCategory,
        status: filterStatus
      })

      const productsRes = await fetch(`/api/admin/stores/${businessId}/products?${params}`)

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.products || [])
        setPagination(productsData.pagination)
        if (productsData.stats) {
          setStats(productsData.stats)
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L',
      BHD: 'BD',
      BBD: 'Bds$',
    }
    
    const symbol = currencySymbols[business.currency] || business.currency
    return `${symbol}${amount.toFixed(2)}`
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const toggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, isActive } : p
        ))
      }
    } catch (error) {
      console.error('Error updating product status:', error)
    }
  }

  const toggleFeatured = async (productId: string, featured: boolean) => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured })
      })

      if (response.ok) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? { ...p, featured } : p
        ))
      }
    } catch (error) {
      console.error('Error updating product featured status:', error)
    }
  }

  const confirmDelete = async () => {
    if (!deleteModalProduct) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/products/${deleteModalProduct.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== deleteModalProduct.id))
        setDeleteModalProduct(null)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const bulkUpdateStatus = async (isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/products/bulk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productIds: selectedProducts,
          action: 'updateStatus',
          data: { isActive }
        })
      })

      if (response.ok) {
        setProducts(prev => prev.map(p => 
          selectedProducts.includes(p.id) ? { ...p, isActive } : p
        ))
        setSelectedProducts([])
      }
    } catch (error) {
      console.error('Error bulk updating products:', error)
    }
  }

  const getStockStatus = (product: Product) => {
    if (!product.trackInventory) return { status: 'Unlimited', color: 'text-gray-500', bgColor: 'bg-gray-100' }
    if (product.stock === 0) return { status: 'Out of stock', color: 'text-red-600', bgColor: 'bg-red-100' }
    if (product.lowStockAlert && product.stock <= product.lowStockAlert) {
      return { status: 'Low stock', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    }
    return { status: 'In stock', color: 'text-green-600', bgColor: 'bg-green-100' }
  }

  const exportProducts = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/products/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'products.csv'
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting products:', error)
    }
  }

  // Use stats from API (not calculated from current page)
  const activeProducts = stats.active
  const lowStockProducts = stats.lowStock
  const featuredProducts = stats.featured

  if (loading && products.length === 0) {
    return (
      <div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex flex-col gap-4">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">
            Manage your product catalog and inventory
            </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex flex-1 gap-3">
            <button
                onClick={exportProducts}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <Download className="w-4 h-4 mr-2" />
                Export
            </button>
            
            <Link
                href={addParams(`/admin/stores/${businessId}/products/import`)}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <Upload className="w-4 h-4 mr-2" />
                Import
            </Link>
            </div>
            
            <Link
            href={addParams(`/admin/stores/${businessId}/products/new`)}
            className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
            </Link>
        </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
            <Package className="w-8 h-8 text-teal-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-green-600">{activeProducts}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStockProducts}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-purple-600">{featuredProducts}</p>
            </div>
            <Star className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, description, or SKU..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full sm:w-auto flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any)
                setCurrentPage(1)
              }}
              className="w-full sm:w-auto flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="low-stock">Low Stock</option>
            </select>
          </div>
        </div>

        {/* Search info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {products.length} of {pagination.total} products
            {filterStatus === 'low-stock' && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Low Stock Filter Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-teal-800">
              {selectedProducts.length} product(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => bulkUpdateStatus(true)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Activate
              </button>
              <button
                onClick={() => bulkUpdateStatus(false)}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Deactivate
              </button>
              <button
                onClick={() => setSelectedProducts([])}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {pagination.total === 0 ? 'No products yet' : 'No products found'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {pagination.total === 0 
              ? 'Start building your catalog by adding your first product. You can also import products in bulk using a CSV file.'
              : 'Try adjusting your search terms or filter criteria to find the products you\'re looking for.'
            }
          </p>
          {pagination.total === 0 && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={addParams(`/admin/stores/${businessId}/products/new`)}
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Product
              </Link>
              <Link
                href={addParams(`/admin/stores/${businessId}/products/import`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Products
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map(product => {
              const stockStatus = getStockStatus(product)
              
              return (
                <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    
                    {/* Status badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.business.id !== businessId && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                          {product.business.name}
                        </span>
                      )}
                      {product.featured && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded font-medium">
                          Featured
                        </span>
                      )}
                      {!product.isActive && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded font-medium">
                          Inactive
                        </span>
                      )}
                      {product.trackInventory && (
                        <span className={`px-2 py-1 text-xs rounded font-medium ${stockStatus.color} ${stockStatus.bgColor}`}>
                          {stockStatus.status}
                        </span>
                      )}
                    </div>

                    {/* Selection checkbox */}
                    <div className="absolute top-2 right-2">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts(prev => [...prev, product.id])
                          } else {
                            setSelectedProducts(prev => prev.filter(id => id !== product.id))
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 truncate flex-1 mr-2">
                        {product.name}
                      </h3>
                      <div className="relative">
                        <button 
                          onClick={() => setOpenDropdown(openDropdown === product.id ? null : product.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openDropdown === product.id && (
                          <div className="absolute right-0 top-8 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <div className="py-1">
                               {isPro && (
                                  <>
                                    <Link
                                      href={addParams(`/admin/stores/${businessId}/products/${product.id}/inventory/activities`)}
                                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      onClick={() => setOpenDropdown(null)}
                                    >
                                      <Activity className="w-4 h-4 mr-3" />
                                      View Activities
                                    </Link>
                                    <Link
                                      href={addParams(`/admin/stores/${businessId}/inventory/adjustments?productId=${product.id}`)}
                                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      onClick={() => setOpenDropdown(null)}
                                    >
                                      <Settings className="w-4 h-4 mr-3" />
                                      Stock Adjustment
                                    </Link>
                                  </>
                                )}
                              <button
                                onClick={() => {
                                  setDeleteModalProduct(product)
                                  setOpenDropdown(null)
                                }}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-3" />
                                Delete Product
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {product.description ? (
                      <div 
                        className="text-sm text-gray-600 mb-3 line-clamp-2"
                        dangerouslySetInnerHTML={{ 
                          __html: product.description
                            .replace(/&amp;/g, '&')
                            .replace(/&lt;/g, '<')
                            .replace(/&gt;/g, '>')
                            .replace(/&quot;/g, '"')
                            .replace(/&#39;/g, "'")
                            .replace(/&nbsp;/g, ' ')
                        }} 
                      />
                    ) : (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        No description
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {formatCurrency(product.price)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {product.category.name}
                      </span>
                    </div>

                    {/* Stock info */}
                    <div className="mb-3">
                      <span className="text-sm text-gray-600">
                        {product.trackInventory ? (
                          `${product.stock} units in stock`
                        ) : (
                          'Unlimited stock'
                        )}
                      </span>
                    </div>

                    {/* Variants & Modifiers info */}
                    {(product.variants.length > 0 || product.modifiers.length > 0) && (
                      <div className="flex gap-2 mb-3">
                        {product.variants.length > 0 && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                            {product.variants.length} variant(s)
                          </span>
                        )}
                        {product.modifiers.length > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                            {product.modifiers.length} modifier(s)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={addParams(`/admin/stores/${businessId}/products/${product.id}`)}
                        className="flex-1 px-3 py-2 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 transition-colors text-center"
                      >
                        <Edit className="w-3 h-3 inline mr-1" />
                        Manage
                      </Link>
                      
                      <button
                        onClick={() => toggleProductStatus(product.id, !product.isActive)}
                        className={`px-3 py-2 text-sm rounded transition-colors ${
                          product.isActive 
                            ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                        title={product.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {product.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => toggleFeatured(product.id, !product.featured)}
                        className={`px-3 py-2 text-sm rounded transition-colors ${
                          product.featured
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                        title={product.featured ? 'Remove from featured' : 'Add to featured'}
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} products
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 py-1 text-sm text-gray-900">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Product
                </h3>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete "{deleteModalProduct.name}"?
                </p>
                
                {deleteModalProduct.variants.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          This product has {deleteModalProduct.variants.length} variant(s)
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          All variants will also be permanently deleted.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  This action cannot be undone. All product data, including images, variants, and order history will be permanently removed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteModalProduct(null)}
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  )
}