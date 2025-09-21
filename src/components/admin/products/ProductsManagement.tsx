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
  TrendingDown
} from 'lucide-react'
import Link from 'next/link'

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

interface ProductsPageProps {
    businessId: string // Changed from params object to direct businessId   
}

export default function ProductsManagement({ businessId }: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'low-stock'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])

  useEffect(() => {
    fetchData()
  }, [businessId])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/stores/${businessId}/products`),
        fetch(`/api/admin/stores/${businessId}/categories`)
      ])

      if (productsRes.ok) {
        const productsData = await productsRes.json()
        setProducts(productsData.products)
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && product.isActive) ||
                         (filterStatus === 'inactive' && !product.isActive) ||
                         (filterStatus === 'low-stock' && product.trackInventory && product.lowStockAlert && product.stock <= product.lowStockAlert)

    return matchesSearch && matchesCategory && matchesStatus
  })

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

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/admin/stores/${businessId}/products/${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProducts(prev => prev.filter(p => p.id !== productId))
      }
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const getStockStatus = (product: Product) => {
    if (!product.trackInventory) return { status: 'unlimited', color: 'text-gray-500' }
    if (product.stock === 0) return { status: 'Out of stock', color: 'text-red-600' }
    if (product.lowStockAlert && product.stock <= product.lowStockAlert) {
      return { status: 'Low stock', color: 'text-yellow-600' }
    }
    return { status: 'In stock', color: 'text-green-600' }
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

  if (loading) {
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your product catalog and inventory
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={exportProducts}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
          
          <Link
            href={`/admin/stores/${businessId}/products/import`}
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Link>
          
          <Link
            href={`/admin/stores/${businessId}/products/new`}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
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
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <Package className="w-8 h-8 text-teal-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.isActive).length}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">
                {products.filter(p => p.trackInventory && p.lowStockAlert && p.stock <= p.lowStockAlert).length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-purple-600">
                {products.filter(p => p.featured).length}
              </p>
            </div>
            <Star className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="low-stock">Low Stock</option>
            </select>
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
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {products.length === 0 ? 'No products yet' : 'No products found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {products.length === 0 
              ? 'Start building your catalog by adding your first product'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {products.length === 0 && (
            <Link
              href={`/admin/stores/${businessId}/products/new`}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Product
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => {
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
                  <div className="absolute top-2 left-2 flex gap-1">
                    {product.featured && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        Featured
                      </span>
                    )}
                    {!product.isActive && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        Inactive
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
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate flex-1">
                      {product.name}
                    </h3>
                    <div className="relative ml-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {product.description || 'No description'}
                  </p>

                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {product.category.name}
                    </span>
                  </div>

                  {/* Stock info */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-sm ${stockStatus.color}`}>
                      {product.trackInventory ? (
                        `${product.stock} in stock • ${stockStatus.status}`
                      ) : (
                        'Unlimited stock'
                      )}
                    </span>
                  </div>

                  {/* Variants & Modifiers info */}
                  {(product.variants.length > 0 || product.modifiers.length > 0) && (
                    <div className="flex gap-2 mb-3">
                      {product.variants.length > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {product.variants.length} variant(s)
                        </span>
                      )}
                      {product.modifiers.length > 0 && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          {product.modifiers.length} modifier(s)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/stores/${businessId}/products/${product.id}`}
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
                    >
                      <Star className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="px-3 py-2 border border-red-300 text-red-700 text-sm rounded hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}