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
  ChevronRight,
  Bug
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

  // Debug panel state
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [debugBrandId, setDebugBrandId] = useState('')
  const [debugData, setDebugData] = useState<any>(null)
  const [debugLoading, setDebugLoading] = useState(false)
  const [brands, setBrands] = useState<Array<{id: string, name: string}>>([])

  const { isPro } = useSubscription()

  useEffect(() => {
    fetchBusinessData()
    fetchData()
    fetchBrands()
  }, [businessId, currentPage, debouncedSearchTerm, selectedCategory, filterStatus])

  // Fetch brands for debug dropdown
  const fetchBrands = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/brands`)
      if (response.ok) {
        const data = await response.json()
        setBrands(data.brands || [])
      }
    } catch (error) {
      console.error('Error fetching brands:', error)
    }
  }

  // Fetch brand debug data
  const fetchBrandDebug = async (brandId: string) => {
    if (!brandId) return
    setDebugLoading(true)
    setDebugData(null)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/debug/brand/${brandId}`)
      if (response.ok) {
        const data = await response.json()
        setDebugData(data)
      } else {
        const error = await response.json()
        setDebugData({ error: error.message || 'Failed to fetch debug data' })
      }
    } catch (error) {
      console.error('Error fetching brand debug:', error)
      setDebugData({ error: 'Failed to fetch debug data' })
    } finally {
      setDebugLoading(false)
    }
  }

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

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        search: debouncedSearchTerm,
        category: selectedCategory,
        status: filterStatus
      })

      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/stores/${businessId}/products?${params}`),
        fetch(`/api/admin/stores/${businessId}/categories`)
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.products || [])
        setPagination(productsData.pagination)
        if (productsData.stats) {
          setStats(productsData.stats)
        }
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData.categories)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
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

            <button
                onClick={() => setShowDebugPanel(true)}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors"
                title="Debug Brand Products"
            >
                <Bug className="w-4 h-4 mr-2" />
                Debug
            </button>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
              className="w-full sm:w-auto flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category._count.products})
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any)
                setCurrentPage(1)
              }}
              className="w-full sm:w-auto flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
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

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description || 'No description'}
                    </p>

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
                        Edit
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
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 py-1 text-sm">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Debug Panel Modal */}
      {showDebugPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold text-gray-900">Brand Debug Panel</h2>
              </div>
              <button
                onClick={() => {
                  setShowDebugPanel(false)
                  setDebugData(null)
                  setDebugBrandId('')
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Brand Selector */}
              <div className="flex gap-3">
                <select
                  value={debugBrandId}
                  onChange={(e) => setDebugBrandId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a brand to debug...</option>
                  {brands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name} ({brand.id})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => fetchBrandDebug(debugBrandId)}
                  disabled={!debugBrandId || debugLoading}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {debugLoading ? 'Loading...' : 'Analyze'}
                </button>
              </div>

              {/* Manual Brand ID Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Or enter brand ID manually..."
                  value={debugBrandId}
                  onChange={(e) => setDebugBrandId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                />
              </div>

              {/* Debug Results */}
              {debugLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  <span className="ml-3 text-gray-600">Analyzing brand products...</span>
                </div>
              )}

              {debugData && !debugLoading && (
                <div className="space-y-4">
                  {debugData.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                      Error: {debugData.error}
                    </div>
                  ) : (
                    <>
                      {/* Brand Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Brand Info</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-500">Name:</span> <span className="font-medium">{debugData.brand?.name}</span></div>
                          <div><span className="text-gray-500">ID:</span> <span className="font-mono text-xs">{debugData.brand?.id}</span></div>
                          <div><span className="text-gray-500">Type:</span> 
                            <span className={`ml-1 px-2 py-0.5 rounded text-xs ${debugData.brand?.isOriginatorBrand ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                              {debugData.brand?.isOriginatorBrand ? 'Originator' : 'Supplier'}
                            </span>
                          </div>
                          <div><span className="text-gray-500">Active:</span> <span className={debugData.brand?.isActive ? 'text-green-600' : 'text-red-600'}>{debugData.brand?.isActive ? 'Yes' : 'No'}</span></div>
                        </div>
                      </div>

                      {/* Analysis Summary */}
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Product Analysis</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-2xl font-bold text-gray-900">{debugData.analysis?.total || 0}</div>
                            <div className="text-xs text-gray-500">Total Products</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-2xl font-bold text-green-600">{debugData.storefrontDisplayable?.count || 0}</div>
                            <div className="text-xs text-gray-500">Storefront Displayable</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-2xl font-bold text-red-600">{debugData.notDisplayableSample?.count || 0}</div>
                            <div className="text-xs text-gray-500">Not Displayable</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-2xl font-bold text-blue-600">{debugData.analysis?.hasVariants || 0}</div>
                            <div className="text-xs text-gray-500">With Variants</div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">By Status</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span>Active:</span> <span className="font-medium text-green-600">{debugData.analysis?.active || 0}</span></div>
                            <div className="flex justify-between"><span>Inactive:</span> <span className="font-medium text-red-600">{debugData.analysis?.inactive || 0}</span></div>
                          </div>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">By Price</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span>Price &gt; 0:</span> <span className="font-medium text-green-600">{debugData.analysis?.priceGreaterThanZero || 0}</span></div>
                            <div className="flex justify-between"><span>Price = 0:</span> <span className="font-medium text-red-600">{debugData.analysis?.priceZero || 0}</span></div>
                          </div>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">By Stock (No Variants)</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span>Stock &gt; 0:</span> <span className="font-medium text-green-600">{debugData.analysis?.stockGreaterThanZero || 0}</span></div>
                            <div className="flex justify-between"><span>Stock = 0:</span> <span className="font-medium text-red-600">{debugData.analysis?.stockZero || 0}</span></div>
                            <div className="flex justify-between"><span>No Inventory Track:</span> <span className="font-medium text-gray-600">{debugData.analysis?.noTrackInventory || 0}</span></div>
                          </div>
                        </div>

                        <div className="bg-white border rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">By Images</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span>Has Images:</span> <span className="font-medium text-green-600">{debugData.analysis?.hasImages || 0}</span></div>
                            <div className="flex justify-between"><span>No Images:</span> <span className="font-medium text-red-600">{debugData.analysis?.noImages || 0}</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Variant Analysis */}
                      {debugData.analysis?.variantAnalysis && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">⚠️ Variant Stock Analysis (IMPORTANT)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="bg-white rounded p-2">
                              <div className="text-lg font-bold">{debugData.analysis.variantAnalysis.totalProductsWithVariants}</div>
                              <div className="text-xs text-gray-500">Products with Variants</div>
                            </div>
                            <div className="bg-white rounded p-2">
                              <div className="text-lg font-bold text-red-600">{debugData.analysis.variantAnalysis.allVariantsZeroStock}</div>
                              <div className="text-xs text-gray-500">ALL Variants = 0 Stock</div>
                            </div>
                            <div className="bg-white rounded p-2">
                              <div className="text-lg font-bold text-yellow-600">{debugData.analysis.variantAnalysis.someVariantsHaveStock}</div>
                              <div className="text-xs text-gray-500">Some Variants Have Stock</div>
                            </div>
                            <div className="bg-white rounded p-2">
                              <div className="text-lg font-bold text-green-600">{debugData.analysis.variantAnalysis.allVariantsHaveStock}</div>
                              <div className="text-xs text-gray-500">ALL Variants Have Stock</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Not Displayable Sample */}
                      {debugData.notDisplayableSample?.first10?.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-2">❌ Sample of Non-Displayable Products (First 10)</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-red-200">
                                  <th className="text-left py-2 px-2">Name</th>
                                  <th className="text-left py-2 px-2">Price</th>
                                  <th className="text-left py-2 px-2">Stock</th>
                                  <th className="text-left py-2 px-2">Active</th>
                                  <th className="text-left py-2 px-2">Images</th>
                                  <th className="text-left py-2 px-2">Variants</th>
                                  <th className="text-left py-2 px-2">Reason</th>
                                </tr>
                              </thead>
                              <tbody>
                                {debugData.notDisplayableSample.first10.map((p: any, i: number) => (
                                  <tr key={i} className="border-b border-red-100">
                                    <td className="py-2 px-2 max-w-[150px] truncate" title={p.name}>{p.name}</td>
                                    <td className="py-2 px-2">{p.price}</td>
                                    <td className="py-2 px-2">{p.stock}</td>
                                    <td className="py-2 px-2">{p.isActive ? '✓' : '✗'}</td>
                                    <td className="py-2 px-2">{p.hasImages ? '✓' : '✗'}</td>
                                    <td className="py-2 px-2">{p.variantsCount} ({p.variantsWithStock} w/stock)</td>
                                    <td className="py-2 px-2">
                                      <span className="px-1.5 py-0.5 bg-red-200 text-red-800 rounded text-xs">
                                        {p.reason}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* API URL */}
                      <div className="bg-gray-100 rounded-lg p-3 text-xs font-mono">
                        <span className="text-gray-500">Storefront API:</span> {debugData.apiComparison?.storefrontUrl}
                      </div>
                    </>
                  )}
                </div>
              )}

              {!debugData && !debugLoading && (
                <div className="text-center py-12 text-gray-500">
                  Select a brand and click "Analyze" to see debug information
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}