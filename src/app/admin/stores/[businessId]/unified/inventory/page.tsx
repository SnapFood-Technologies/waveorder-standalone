// src/app/admin/stores/[businessId]/unified/inventory/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft,
  Boxes,
  Store,
  AlertTriangle,
  Package,
  Loader2,
  TrendingDown,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface LowStockProduct {
  id: string
  name: string
  sku: string
  stock: number
  lowStockAlert: number
  businessId: string
  businessName: string
  businessSlug: string
}

interface StoreInventory {
  id: string
  name: string
  slug: string
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalValue: number
}

export default function UnifiedInventoryPage() {
  const params = useParams()
  const businessId = params.businessId as string
  
  const [storeInventory, setStoreInventory] = useState<StoreInventory[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [insufficientStores, setInsufficientStores] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/unified/inventory')
      if (response.ok) {
        const data = await response.json()
        if (!data.stores || data.stores.length < 2) {
          setInsufficientStores(true)
        } else {
          setStoreInventory(data.stores)
          setLowStockProducts(data.lowStockProducts || [])
        }
      } else {
        setError('Failed to load inventory data')
      }
    } catch (error) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const totals = storeInventory.reduce((acc, store) => ({
    products: acc.products + store.totalProducts,
    lowStock: acc.lowStock + store.lowStockCount,
    outOfStock: acc.outOfStock + store.outOfStockCount
  }), { products: 0, lowStock: 0, outOfStock: 0 })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    )
  }

  if (insufficientStores) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Multi-Store Feature</h2>
          <p className="text-gray-600 mb-6">
            The unified inventory view is available when you have 2 or more stores.
          </p>
          <Link
            href={`/admin/stores/${businessId}/all-stores`}
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Stores
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Boxes className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inventory Overview</h1>
          <p className="text-sm sm:text-base text-gray-600">Stock levels across all stores</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button onClick={fetchInventory} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Total Products</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatNumber(totals.products)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Across {storeInventory.length} stores</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Low Stock</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-600">{formatNumber(totals.lowStock)}</p>
          <p className="text-xs sm:text-sm text-amber-600 mt-1">Need attention</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Out of Stock</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-red-600">{formatNumber(totals.outOfStock)}</p>
          <p className="text-xs sm:text-sm text-red-600 mt-1">Urgent</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Store Inventory Summary */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Inventory by Store</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {storeInventory.map((store) => (
              <div key={store.id} className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Store className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{store.name}</h3>
                      <p className="text-xs text-gray-500 truncate">/{store.slug}</p>
                    </div>
                  </div>
                  <Link href={`/admin/stores/${store.id}/inventory`} className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 flex-shrink-0 ml-2">
                    View →
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-sm">
                  <div className="bg-gray-50 rounded-lg p-1.5 sm:p-2 text-center">
                    <p className="text-gray-500 text-[10px] sm:text-xs">Products</p>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{store.totalProducts}</p>
                  </div>
                  <div className={`rounded-lg p-1.5 sm:p-2 text-center ${store.lowStockCount > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                    <p className="text-[10px] sm:text-xs text-gray-500">Low Stock</p>
                    <p className={`font-semibold text-sm sm:text-base ${store.lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{store.lowStockCount}</p>
                  </div>
                  <div className={`rounded-lg p-1.5 sm:p-2 text-center ${store.outOfStockCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <p className="text-[10px] sm:text-xs text-gray-500">Out</p>
                    <p className={`font-semibold text-sm sm:text-base ${store.outOfStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{store.outOfStockCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-amber-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
            </div>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm sm:text-base text-gray-500">All products are well-stocked!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-80 sm:max-h-96 overflow-y-auto">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{product.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                        <span className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-none">{product.businessName}</span>
                        {product.sku && <span className="text-xs bg-gray-100 px-1.5 sm:px-2 py-0.5 rounded truncate max-w-[80px] sm:max-w-none">SKU: {product.sku}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold text-sm sm:text-base ${product.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>{product.stock} left</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">Alert at {product.lowStockAlert}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
