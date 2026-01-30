// src/components/admin/analytics/ProductAnalytics.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Eye, 
  ShoppingCart, 
  ShoppingBag, 
  TrendingUp,
  TrendingDown,
  Wallet,
  Percent,
  RefreshCw,
  ArrowLeft,
  BarChart3,
  AlertCircle,
  ExternalLink,
  Package
} from 'lucide-react'
import { useImpersonation } from '@/lib/impersonation'

interface ProductAnalyticsProps {
  businessId: string
}

interface ProductData {
  productId: string
  productName: string
  productImage: string | null
  categoryName: string
  views: number
  addToCarts: number
  orders: number
  revenue: number
  quantity: number
  viewToCartRate: number
  cartToOrderRate: number
  conversionRate: number
}

interface AnalyticsData {
  summary: {
    totalViews: number
    totalAddToCarts: number
    totalOrders: number
    totalRevenue: number
    overallViewToCartRate: number
    overallCartToOrderRate: number
    overallConversionRate: number
    uniqueProducts: number
    // Abandoned cart metrics
    abandonedCarts: number
    convertedCarts: number
    totalCartSessions: number
    abandonedCartRate: number
  }
  bestSellers: ProductData[]
  mostViewed: ProductData[]
  opportunityProducts: ProductData[]
  lowPerforming: ProductData[]
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

export default function ProductAnalytics({ businessId }: ProductAnalyticsProps) {
  const { addParams } = useImpersonation(businessId)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [activeTab, setActiveTab] = useState<'best-sellers' | 'most-viewed' | 'opportunity' | 'low-performing'>('best-sellers')
  const [business, setBusiness] = useState<{ currency: string }>({ currency: 'USD' })

  useEffect(() => {
    fetchBusinessData()
    fetchAnalyticsData()
  }, [businessId, selectedPeriod])

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
        `/api/admin/stores/${businessId}/analytics/products?period=${selectedPeriod}&limit=10`
      )
      
      if (!response.ok) {
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

  const getProductsList = () => {
    if (!data) return []
    switch (activeTab) {
      case 'best-sellers':
        return data.bestSellers
      case 'most-viewed':
        return data.mostViewed
      case 'opportunity':
        return data.opportunityProducts
      case 'low-performing':
        return data.lowPerforming
      default:
        return data.bestSellers
    }
  }

  const tabs = [
    { id: 'best-sellers' as const, label: 'Best Sellers', icon: ShoppingBag, description: 'Products with most orders' },
    { id: 'most-viewed' as const, label: 'Most Viewed', icon: Eye, description: 'Products with most views' },
    { id: 'opportunity' as const, label: 'Opportunity', icon: TrendingUp, description: 'High views, low conversions' },
    { id: 'low-performing' as const, label: 'Needs Attention', icon: AlertCircle, description: 'Add to carts but no orders' }
  ]

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
        <button
          onClick={fetchAnalyticsData}
          className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!data) return null

  const products = getProductsList()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/analytics`)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Product Analytics</h1>
            <p className="text-gray-600 mt-1">
              Track product performance and conversion rates
            </p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(data.summary.totalViews)}</p>
          <p className="text-sm text-gray-600">Total Product Views</p>
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
            <ShoppingBag className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(data.summary.totalOrders)}</p>
          <p className="text-sm text-gray-600">Orders</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.summary.totalRevenue)}</p>
          <p className="text-sm text-gray-600">Revenue</p>
        </div>
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-700">{data.summary.overallViewToCartRate}%</span>
            </div>
            <p className="text-sm text-blue-600">View to Cart Rate</p>
            <p className="text-xs text-blue-500 mt-1">
              {formatNumber(data.summary.totalViews)} views → {formatNumber(data.summary.totalAddToCarts)} carts
            </p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
              <span className="text-2xl font-bold text-purple-700">{data.summary.overallCartToOrderRate}%</span>
            </div>
            <p className="text-sm text-purple-600">Cart to Order Rate</p>
            <p className="text-xs text-purple-500 mt-1">
              {formatNumber(data.summary.totalAddToCarts)} carts → {formatNumber(data.summary.totalOrders)} orders
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-700">{data.summary.overallConversionRate}%</span>
            </div>
            <p className="text-sm text-green-600">Overall Conversion</p>
            <p className="text-xs text-green-500 mt-1">
              {formatNumber(data.summary.totalViews)} views → {formatNumber(data.summary.totalOrders)} orders
            </p>
          </div>
        </div>
      </div>

      {/* Abandoned Cart Insights */}
      {data.summary.totalCartSessions > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cart Abandonment</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                <span className="text-2xl font-bold text-orange-700">{data.summary.abandonedCartRate}%</span>
              </div>
              <p className="text-sm text-orange-600">Cart Abandonment Rate</p>
              <p className="text-xs text-orange-500 mt-1">
                Carts not converted within 24h
              </p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-2xl font-bold text-red-700">{formatNumber(data.summary.abandonedCarts)}</span>
              </div>
              <p className="text-sm text-red-600">Abandoned Carts</p>
              <p className="text-xs text-red-500 mt-1">
                Sessions with items left in cart
              </p>
            </div>
            
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="text-2xl font-bold text-emerald-700">{formatNumber(data.summary.convertedCarts)}</span>
              </div>
              <p className="text-sm text-emerald-600">Converted Carts</p>
              <p className="text-xs text-emerald-500 mt-1">
                Sessions that completed purchase
              </p>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Based on {formatNumber(data.summary.totalCartSessions)} unique sessions with add-to-cart events. 
            A cart is considered abandoned if no order containing those products is placed within 24 hours.
          </p>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'text-teal-600 border-teal-600'
                    : 'text-gray-600 hover:text-gray-900 border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Description */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {tabs.find(t => t.id === activeTab)?.description}
          </p>
        </div>

        {/* Products List */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data yet</h3>
            <p className="text-gray-600">
              Product analytics will appear here as customers view and interact with your products.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Add to Cart
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product, index) => (
                  <tr key={product.productId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400 font-medium w-6">
                          {index + 1}
                        </span>
                        {product.productImage ? (
                          <Image
                            src={product.productImage}
                            alt={product.productName}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">
                            {product.productName}
                          </p>
                          <p className="text-xs text-gray-500">{product.categoryName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900">{formatNumber(product.views)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900">{formatNumber(product.addToCarts)}</span>
                      {product.views > 0 && (
                        <span className="text-xs text-gray-500 block">
                          {product.viewToCartRate}%
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">{product.orders}</span>
                      <span className="text-xs text-gray-500 block">
                        {product.quantity} items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(product.revenue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.conversionRate >= 5
                          ? 'bg-green-100 text-green-800'
                          : product.conversionRate >= 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.conversionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={addParams(`/admin/stores/${businessId}/products/${product.productId}/analytics`)}
                        className="inline-flex items-center text-sm text-teal-600 hover:text-teal-700"
                      >
                        Details
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Product Analytics</p>
            <p>
              This data tracks product views and add-to-cart events from your storefront.
              Views are tracked when customers open a product modal, and add-to-cart events
              are tracked when they add items to their cart.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
