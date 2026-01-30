// src/components/admin/dashboard/ProductPerformanceWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  BarChart3, 
  Eye, 
  ShoppingCart, 
  TrendingUp,
  Package,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { useImpersonation } from '@/lib/impersonation'

interface ProductPerformanceWidgetProps {
  businessId: string
}

interface ProductData {
  productId: string
  productName: string
  productImage: string | null
  views: number
  addToCarts: number
  ordersPlaced: number
  ordersCompleted: number
  conversionRate: number
}

interface SummaryData {
  totalViews: number
  totalAddToCarts: number
  totalOrdersPlaced: number
  totalOrdersCompleted: number
  overallConversionRate: number
}

export function ProductPerformanceWidget({ businessId }: ProductPerformanceWidgetProps) {
  const { addParams } = useImpersonation(businessId)
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [topProducts, setTopProducts] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProductAnalytics()
  }, [businessId])

  const fetchProductAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/stores/${businessId}/analytics/products?period=month&limit=5`
      )
      
      if (response.ok) {
        const result = await response.json()
        setSummary(result.data.summary)
        setTopProducts(result.data.bestSellers)
      }
    } catch (error) {
      console.error('Error fetching product analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Don't show widget if no data
  if (!summary || summary.totalViews === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900">Product Performance</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchProductAnalytics}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href={addParams(`/admin/stores/${businessId}/analytics/products`)}
            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
            title="View All Analytics"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="text-xl font-bold text-blue-700">{formatNumber(summary.totalViews)}</span>
          </div>
          <p className="text-xs text-blue-600">Views</p>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ShoppingCart className="w-4 h-4 text-purple-600" />
            <span className="text-xl font-bold text-purple-700">{formatNumber(summary.totalAddToCarts)}</span>
          </div>
          <p className="text-xs text-purple-600">Add to Carts</p>
        </div>
        
        <div className="text-center p-3 bg-teal-50 rounded-lg" title="All orders submitted by customers">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Package className="w-4 h-4 text-teal-600" />
            <span className="text-xl font-bold text-teal-700">{formatNumber(summary.totalOrdersPlaced)}</span>
          </div>
          <p className="text-xs text-teal-600">Orders Placed</p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xl font-bold text-green-700">{summary.overallConversionRate}%</span>
          </div>
          <p className="text-xs text-green-600">Conversion</p>
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Top Selling Products</h4>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="w-10 text-center">Views</span>
              <span className="w-10 text-center" title="Orders placed by customers">Placed</span>
              <span className="w-10 text-center" title="Completed & paid orders">Done</span>
            </div>
          </div>
          <div className="space-y-1">
            {topProducts.slice(0, 5).map((product, index) => (
              <div 
                key={product.productId}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-xs text-gray-400 font-medium w-4">{index + 1}</span>
                {product.productImage ? (
                  <Image
                    src={product.productImage}
                    alt={product.productName}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.productName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 text-center">
                    <span className="text-sm text-gray-600">{formatNumber(product.views)}</span>
                  </div>
                  <div className="w-10 text-center">
                    <span className="text-sm font-medium text-teal-700">{product.ordersPlaced}</span>
                  </div>
                  <div className="w-10 text-center">
                    <span className="text-sm font-medium text-green-700">{product.ordersCompleted}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="border-t border-gray-100 pt-3 mt-4">
        <p className="text-xs text-gray-500">
          <strong>Placed:</strong> All orders • <strong>Done:</strong> Delivered & paid • Data from this month
        </p>
      </div>
    </div>
  )
}
