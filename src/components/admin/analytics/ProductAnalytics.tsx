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
  Package,
  HelpCircle,
  X
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
  ordersPlaced: number      // All orders (customer intent)
  ordersCompleted: number   // Fulfilled orders only
  revenue: number
  quantityPlaced: number
  quantityCompleted: number
  viewToCartRate: number
  cartToOrderRate: number
  conversionRate: number
}

interface AnalyticsData {
  summary: {
    totalViews: number
    totalAddToCarts: number
    totalOrdersPlaced: number     // All orders (customer intent)
    totalOrdersCompleted: number  // Fulfilled orders only
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
  const [showHelpModal, setShowHelpModal] = useState(false)

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
      BHD: 'BD',
      BBD: 'Bds$',
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
    { id: 'best-sellers' as const, label: 'Best Sellers', icon: ShoppingBag, description: 'Products with most orders placed' },
    { id: 'most-viewed' as const, label: 'Most Viewed', icon: Eye, description: 'Products with most views' },
    { id: 'opportunity' as const, label: 'Opportunity', icon: TrendingUp, description: 'High views, low conversions' },
    { id: 'low-performing' as const, label: 'Needs Attention', icon: AlertCircle, description: 'Add to carts but no orders placed' }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <ShoppingBag className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(data.summary.totalOrdersPlaced)}</p>
          <p className="text-sm text-gray-600">Orders Placed</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(data.summary.totalOrdersCompleted)}</p>
          <p className="text-sm text-gray-600">Orders Completed</p>
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
              {formatNumber(data.summary.totalAddToCarts)} carts → {formatNumber(data.summary.totalOrdersPlaced)} orders placed
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold text-green-700">{data.summary.overallConversionRate}%</span>
            </div>
            <p className="text-sm text-green-600">Overall Conversion</p>
            <p className="text-xs text-green-500 mt-1">
              {formatNumber(data.summary.totalViews)} views → {formatNumber(data.summary.totalOrdersPlaced)} orders placed
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
                    <span title="All orders placed by customers">Placed</span>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <span title="Orders that have been delivered/completed and paid">Completed</span>
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
                      <span className="text-sm font-medium text-teal-700">{product.ordersPlaced}</span>
                      <span className="text-xs text-gray-500 block">
                        {product.quantityPlaced} items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-green-700">{product.ordersCompleted}</span>
                      <span className="text-xs text-gray-500 block">
                        {product.quantityCompleted} items
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

      {/* Info Banner - Understanding Metrics */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 w-full">
            <p className="font-medium mb-3">Understanding Your Analytics</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-blue-900 mb-1">📊 Tracking Events</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li><strong>Views:</strong> When a customer opens a product modal</li>
                  <li><strong>Add to Cart:</strong> When a customer adds an item to their cart</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-blue-900 mb-1">📦 Order Metrics</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li><strong className="text-teal-700">Orders Placed:</strong> All orders submitted by customers (shows demand)</li>
                  <li><strong className="text-green-700">Orders Completed:</strong> Delivered/picked up orders that are paid (actual fulfillment)</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-blue-900 mb-1">💰 Revenue & Conversion</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li><strong>Revenue:</strong> Calculated from completed orders only</li>
                  <li><strong>Conversion Rate:</strong> Based on orders placed (customer action)</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-blue-900 mb-1">🛒 Cart Abandonment</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>A cart is abandoned if no order is placed within 24 hours</li>
                  <li>Helps identify checkout friction points</li>
                </ul>
              </div>
            </div>

            {/* CTA for detailed help */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <button
                onClick={() => setShowHelpModal(true)}
                className="text-sm font-medium text-blue-700 hover:text-blue-900 underline transition-colors"
              >
                Learn more
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowHelpModal(false)} />
            
            <div className="relative inline-block w-full max-w-3xl p-6 my-8 text-left align-middle bg-white rounded-xl shadow-xl transform transition-all">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <HelpCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Analytics Guide</h3>
                    <p className="text-sm text-gray-500">Detailed explanation of all metrics</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {/* Summary Cards Section */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-600" />
                    Summary Cards
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3">
                      <Eye className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800">Total Product Views</p>
                        <p className="text-gray-600">Number of times customers opened product details. Each view indicates customer interest.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <ShoppingCart className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800">Add to Carts</p>
                        <p className="text-gray-600">Number of times products were added to cart. Shows purchase intent.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <ShoppingBag className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800">Orders Placed</p>
                        <p className="text-gray-600">Total unique orders submitted by customers (any status). Represents customer demand.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Package className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800">Orders Completed</p>
                        <p className="text-gray-600">Orders that are delivered/picked up AND paid. Represents actual fulfillment.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Wallet className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800">Revenue</p>
                        <p className="text-gray-600">Total money earned from completed orders only. Does not include pending orders.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversion Funnel Section */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    Conversion Funnel
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">View to Cart Rate</p>
                      <p className="text-gray-600">Percentage of views that resulted in add-to-cart. Formula: (Add to Carts ÷ Views) × 100</p>
                      <p className="text-xs text-purple-600 mt-1">Higher = Products are appealing to customers</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Cart to Order Rate</p>
                      <p className="text-gray-600">Percentage of cart additions that became orders. Formula: (Orders Placed ÷ Add to Carts) × 100</p>
                      <p className="text-xs text-purple-600 mt-1">Lower rate may indicate checkout issues or price concerns</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Overall Conversion</p>
                      <p className="text-gray-600">Percentage of views that resulted in orders. Formula: (Orders Placed ÷ Views) × 100</p>
                      <p className="text-xs text-purple-600 mt-1">Your overall sales effectiveness metric</p>
                    </div>
                  </div>
                </div>

                {/* Product Table Section */}
                <div className="bg-teal-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    📋 Product Table Columns
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">Views</p>
                      <p className="text-gray-600">How many times this specific product was viewed</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Add to Cart (with %)</p>
                      <p className="text-gray-600">Number of cart additions. The percentage shows view-to-cart rate for this product.</p>
                      <p className="text-xs text-teal-600 mt-1">Example: "2 (100%)" = 2 add-to-carts from 2 views</p>
                      <p className="text-xs text-orange-600">Note: Can exceed 100% if product is added multiple times without viewing</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Placed (with items)</p>
                      <p className="text-gray-600">Number of orders containing this product. "X items" shows total quantity ordered.</p>
                      <p className="text-xs text-teal-600 mt-1">Example: "1 (2 items)" = 1 order with 2 units of this product</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Completed (with items)</p>
                      <p className="text-gray-600">Number of fulfilled orders containing this product. Only counts delivered & paid orders.</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Revenue</p>
                      <p className="text-gray-600">Total revenue from completed orders for this product only.</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Conversion %</p>
                      <p className="text-gray-600">Overall conversion rate for this product. Formula: (Orders Placed ÷ Views) × 100</p>
                      <p className="text-xs text-teal-600 mt-1">Green = 5%+, Yellow = 2-5%, Red = below 2%</p>
                    </div>
                  </div>
                </div>

                {/* Cart Abandonment Section */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    🛒 Cart Abandonment
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-800">Cart Abandonment Rate</p>
                      <p className="text-gray-600">Percentage of shopping sessions where items were added to cart but no order was placed within 24 hours.</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Abandoned Carts</p>
                      <p className="text-gray-600">Number of sessions with items left in cart without completing purchase.</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Converted Carts</p>
                      <p className="text-gray-600">Number of sessions that successfully completed a purchase.</p>
                    </div>
                    <p className="text-xs text-orange-600 mt-2">
                      Tip: High abandonment rate may indicate issues with checkout process, shipping costs, or payment options.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
