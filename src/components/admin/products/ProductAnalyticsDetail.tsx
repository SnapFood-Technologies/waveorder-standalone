// src/components/admin/products/ProductAnalyticsDetail.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Eye, 
  ShoppingCart, 
  ShoppingBag, 
  Wallet,
  Percent,
  RefreshCw,
  ArrowLeft,
  BarChart3,
  AlertCircle,
  Package,
  TrendingUp,
  TrendingDown,
  Calendar,
  Pencil
} from 'lucide-react'
import { useImpersonation } from '@/lib/impersonation'

interface ProductAnalyticsDetailProps {
  businessId: string
  productId: string
}

interface AnalyticsData {
  product: {
    id: string
    name: string
    image: string | null
    price: number
    category: string
  }
  summary: {
    totalViews: number
    totalAddToCarts: number
    totalOrdersPlaced: number     // All orders (customer intent)
    totalOrdersCompleted: number  // Fulfilled orders only
    totalQuantityPlaced: number
    totalQuantityCompleted: number
    totalRevenue: number
    viewToCartRate: number
    cartToOrderRate: number
    conversionRate: number
  }
  sourceBreakdown: Array<{
    source: string
    views: number
    addToCarts: number
  }>
  dailyTrends: Array<{
    date: string
    views: number
    addToCarts: number
    orders: number
  }>
  period: string
  dateRange: {
    start: string
    end: string
  }
}

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' }
]

export default function ProductAnalyticsDetail({ businessId, productId }: ProductAnalyticsDetailProps) {
  const { addParams } = useImpersonation(businessId)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [business, setBusiness] = useState<{ currency: string }>({ currency: 'USD' })

  useEffect(() => {
    fetchBusinessData()
    fetchAnalyticsData()
  }, [businessId, productId, selectedPeriod])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const result = await response.json()
        setBusiness({ currency: result.business.currency })
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `/api/admin/stores/${businessId}/products/${productId}/analytics?period=${selectedPeriod}`
      )
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found')
        }
        throw new Error('Failed to fetch analytics data')
      }
      
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      product_modal: 'Product Modal',
      product_card: 'Product Card',
      search: 'Search Results',
      featured: 'Featured Section',
      category: 'Category Page',
      related: 'Related Products',
      unknown: 'Other'
    }
    return labels[source] || source
  }

  // Calculate max value for chart scaling
  const getChartMax = () => {
    if (!data?.dailyTrends.length) return 10
    const maxViews = Math.max(...data.dailyTrends.map(d => d.views))
    const maxOrders = Math.max(...data.dailyTrends.map(d => d.orders))
    return Math.max(maxViews, maxOrders, 10)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="font-medium text-red-800">Error loading analytics</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
          <Link
            href={addParams(`/admin/stores/${businessId}/products`)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  if (!data) return null

  const chartMax = getChartMax()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/products/${productId}`)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-4">
            {data.product.image ? (
              <Image
                src={data.product.image}
                alt={data.product.name}
                width={56}
                height={56}
                className="w-14 h-14 rounded-lg object-cover"
              />
            ) : (
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.product.name}</h1>
              <p className="text-gray-600">
                {data.product.category} • {formatCurrency(data.product.price)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {PERIODS.map(period => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={fetchAnalyticsData}
            className="p-2 text-gray-600 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(data.summary.totalViews)}</p>
          <p className="text-sm text-gray-600">Views</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(data.summary.totalAddToCarts)}</p>
          <p className="text-sm text-gray-600">Add to Carts</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <ShoppingBag className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.summary.totalOrdersPlaced}</p>
          <p className="text-sm text-gray-600">Orders Placed ({data.summary.totalQuantityPlaced} items)</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.summary.totalOrdersCompleted}</p>
          <p className="text-sm text-gray-600">Completed ({data.summary.totalQuantityCompleted} items)</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.summary.totalRevenue)}</p>
          <p className="text-sm text-gray-600">Revenue</p>
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">View to Cart Rate</p>
              <p className="text-2xl font-bold text-blue-600">{data.summary.viewToCartRate}%</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.min(data.summary.viewToCartRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cart to Order Rate</p>
              <p className="text-2xl font-bold text-purple-600">{data.summary.cartToOrderRate}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${Math.min(data.summary.cartToOrderRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overall Conversion</p>
              <p className="text-2xl font-bold text-green-600">{data.summary.conversionRate}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Percent className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${Math.min(data.summary.conversionRate * 10, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      {data.dailyTrends.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Daily Trends</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                Views
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                Orders
              </span>
            </div>
          </div>
          
          {/* Simple bar chart */}
          <div className="relative h-48">
            <div className="absolute inset-0 flex items-end justify-between gap-1">
              {data.dailyTrends.slice(-14).map((day, index) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  {/* Views bar */}
                  <div 
                    className="w-full bg-blue-200 rounded-t relative group"
                    style={{ 
                      height: `${(day.views / chartMax) * 100}%`,
                      minHeight: day.views > 0 ? '4px' : '0'
                    }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {day.views} views
                    </div>
                  </div>
                  {/* Orders bar (overlaid) */}
                  <div 
                    className="w-full bg-green-500 rounded-t absolute bottom-0"
                    style={{ 
                      height: `${(day.orders / chartMax) * 100}%`,
                      minHeight: day.orders > 0 ? '4px' : '0'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* X-axis labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            {data.dailyTrends.slice(-14).filter((_, i) => i % 2 === 0).map(day => (
              <span key={day.date}>{formatDate(day.date)}</span>
            ))}
          </div>
        </div>
      )}

      {/* Traffic Sources */}
      {data.sourceBreakdown.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
          <div className="space-y-3">
            {data.sourceBreakdown.map(source => {
              const totalViews = data.summary.totalViews || 1
              const percentage = Math.round((source.views / totalViews) * 100)
              
              return (
                <div key={source.source} className="flex items-center gap-4">
                  <div className="w-32 text-sm text-gray-700">
                    {getSourceLabel(source.source)}
                  </div>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-sm">
                    <span className="font-medium text-gray-900">{source.views}</span>
                    <span className="text-gray-500 ml-1">({percentage}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
        <p className="text-sm text-gray-600 mb-4">Navigate to related pages</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/products/${productId}`)}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-teal-300 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-teal-200 transition-colors">
              <Pencil className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Edit Product</h4>
              <p className="text-sm text-gray-600">Update product details, pricing, and inventory</p>
            </div>
          </Link>
          
          <Link
            href={addParams(`/admin/stores/${businessId}/analytics/products`)}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">All Product Analytics</h4>
              <p className="text-sm text-gray-600">View analytics for all your products</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Info Banner - Understanding Metrics */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-3">Understanding Your Analytics</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-blue-900 mb-1">📊 Tracking Events</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li><strong>Views:</strong> When a customer opens the product modal</li>
                  <li><strong>Add to Cart:</strong> When a customer adds this item to cart</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-blue-900 mb-1">📦 Order Metrics</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li><strong className="text-teal-700">Orders Placed:</strong> All orders with this product (demand)</li>
                  <li><strong className="text-green-700">Orders Completed:</strong> Delivered/picked up + paid (fulfillment)</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-blue-900 mb-1">💰 Revenue & Conversion</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li><strong>Revenue:</strong> From completed orders only</li>
                  <li><strong>Conversion Rate:</strong> Based on orders placed</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-blue-900 mb-1">📈 Trends Chart</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>Shows daily views, carts, and orders placed</li>
                  <li>Helps identify patterns and peak days</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
