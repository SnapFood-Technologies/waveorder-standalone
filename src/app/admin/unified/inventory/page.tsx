// src/app/admin/unified/inventory/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft,
  Boxes,
  Store,
  AlertTriangle,
  Package,
  Loader2,
  TrendingDown
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
  const [storeInventory, setStoreInventory] = useState<StoreInventory[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/unified/inventory')
      if (response.ok) {
        const data = await response.json()
        setStoreInventory(data.stores || [])
        setLowStockProducts(data.lowStockProducts || [])
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  // Calculate totals
  const totals = storeInventory.reduce((acc, store) => ({
    products: acc.products + store.totalProducts,
    lowStock: acc.lowStock + store.lowStockCount,
    outOfStock: acc.outOfStock + store.outOfStockCount
  }), { products: 0, lowStock: 0, outOfStock: 0 })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin/stores" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Stores
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Boxes className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Overview</h1>
              <p className="text-gray-600">Stock levels across all stores</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Package className="w-5 h-5" />
              <span className="text-sm">Total Products</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatNumber(totals.products)}</p>
            <p className="text-sm text-gray-500 mt-1">Across {storeInventory.length} stores</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-6">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <TrendingDown className="w-5 h-5" />
              <span className="text-sm">Low Stock</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">{formatNumber(totals.lowStock)}</p>
            <p className="text-sm text-amber-600 mt-1">Need attention</p>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-6">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm">Out of Stock</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{formatNumber(totals.outOfStock)}</p>
            <p className="text-sm text-red-600 mt-1">Urgent</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Inventory Summary */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Inventory by Store</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {storeInventory.map((store) => (
                <div key={store.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Store className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{store.name}</h3>
                        <p className="text-xs text-gray-500">/{store.slug}</p>
                      </div>
                    </div>
                    <Link
                      href={`/admin/stores/${store.id}/inventory`}
                      className="text-sm text-teal-600 hover:text-teal-700"
                    >
                      View →
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-gray-500 text-xs">Products</p>
                      <p className="font-semibold text-gray-900">{store.totalProducts}</p>
                    </div>
                    <div className={`rounded-lg p-2 text-center ${store.lowStockCount > 0 ? 'bg-amber-50' : 'bg-gray-50'}`}>
                      <p className="text-xs text-gray-500">Low Stock</p>
                      <p className={`font-semibold ${store.lowStockCount > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {store.lowStockCount}
                      </p>
                    </div>
                    <div className={`rounded-lg p-2 text-center ${store.outOfStockCount > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <p className="text-xs text-gray-500">Out of Stock</p>
                      <p className={`font-semibold ${store.outOfStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {store.outOfStockCount}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
              </div>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">All products are well-stocked!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{product.businessName}</span>
                          {product.sku && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">SKU: {product.sku}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${product.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                          {product.stock} left
                        </p>
                        <p className="text-xs text-gray-500">Alert at {product.lowStockAlert}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
