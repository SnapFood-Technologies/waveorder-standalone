// src/app/admin/unified/analytics/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  PieChart,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Eye,
  Loader2,
  BarChart3,
  AlertCircle,
  Store,
  RefreshCw
} from 'lucide-react'

interface StoreData {
  id: string
  name: string
  slug: string
  logo: string | null
  currency: string
  stats: {
    orders: number
    revenue: number
    customers: number
    views: number
    products: number
  }
}

export default function UnifiedAnalyticsPage() {
  const router = useRouter()
  const [stores, setStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30')
  const [insufficientStores, setInsufficientStores] = useState(false)

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/analytics/compare-stores?period=${period}`)
      if (response.ok) {
        const data = await response.json()
        // Check if user has enough stores
        if (!data.stores || data.stores.length < 2) {
          setInsufficientStores(true)
        } else {
          setStores(data.stores)
        }
      } else {
        setError('Failed to load analytics data')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  // Check for mixed currencies
  const uniqueCurrencies = [...new Set(stores.map(s => s.currency))]
  const hasMixedCurrencies = uniqueCurrencies.length > 1
  const primaryCurrency = stores[0]?.currency || 'USD'

  // Calculate totals
  const totals = stores.reduce((acc, store) => ({
    revenue: acc.revenue + store.stats.revenue,
    orders: acc.orders + store.stats.orders,
    customers: acc.customers + store.stats.customers,
    views: acc.views + store.stats.views
  }), { revenue: 0, orders: 0, customers: 0, views: 0 })

  // Revenue by currency
  const revenueByCurrency = stores.reduce((acc, store) => {
    if (!acc[store.currency]) acc[store.currency] = 0
    acc[store.currency] += store.stats.revenue
    return acc
  }, {} as Record<string, number>)

  // Calculate conversion rate
  const conversionRate = totals.views > 0 ? ((totals.orders / totals.views) * 100).toFixed(2) : '0'

  // Calculate avg order value (only meaningful for same currency)
  const avgOrderValue = totals.orders > 0 ? totals.revenue / totals.orders : 0

  // Generate colors for pie chart
  const colors = ['#0D9488', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  // Show message if user doesn't have enough stores
  if (insufficientStores) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Multi-Store Feature</h2>
            <p className="text-gray-600 mb-6">
              Cross-store analytics is available when you have 2 or more stores. 
              Create another store to compare performance across your stores.
            </p>
            <Link
              href="/admin/stores"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Stores
            </Link>
          </div>
        </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cross-Store Analytics</h1>
                <p className="text-gray-600">Combined insights from all stores</p>
              </div>
            </div>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-1">Please try again or contact support if the issue persists.</p>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Mixed Currency Warning */}
        {hasMixedCurrencies && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mb-8">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Multiple currencies detected</p>
              <p className="text-xs text-amber-700 mt-1">
                Your stores use different currencies ({uniqueCurrencies.join(', ')}). Revenue metrics are shown separately or per store.
              </p>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">Total Revenue</span>
            </div>
            {hasMixedCurrencies ? (
              <div className="space-y-1">
                {Object.entries(revenueByCurrency).map(([currency, amount]) => (
                  <p key={currency} className="text-xl font-bold text-gray-900">
                    {formatCurrency(amount, currency)}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totals.revenue, primaryCurrency)}</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm">Avg Order Value</span>
            </div>
            {hasMixedCurrencies ? (
              <p className="text-lg font-medium text-gray-500">Per store</p>
            ) : (
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(avgOrderValue, primaryCurrency)}</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Eye className="w-5 h-5" />
              <span className="text-sm">Conversion Rate</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{conversionRate}%</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Users className="w-5 h-5" />
              <span className="text-sm">Total Customers</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatNumber(totals.customers)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Revenue by Store</h2>
              {hasMixedCurrencies && (
                <p className="text-xs text-gray-500 mt-1">Percentages are within same currency</p>
              )}
            </div>
            <div className="p-6">
              {/* Simple bar chart visualization */}
              <div className="space-y-4">
                {stores.map((store, index) => {
                  // For mixed currencies, calculate percentage within same currency
                  const sameCurrencyRevenue = stores
                    .filter(s => s.currency === store.currency)
                    .reduce((sum, s) => sum + s.stats.revenue, 0)
                  const percentage = sameCurrencyRevenue > 0 ? (store.stats.revenue / sameCurrencyRevenue) * 100 : 0
                  
                  return (
                    <div key={store.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900">
                          {store.name}
                          {hasMixedCurrencies && (
                            <span className="text-xs text-gray-400 ml-1">({store.currency})</span>
                          )}
                        </span>
                        <span className="text-gray-600">
                          {formatCurrency(store.stats.revenue, store.currency)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: colors[index % colors.length]
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Orders Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Orders by Store</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stores.map((store, index) => {
                  const percentage = totals.orders > 0 ? (store.stats.orders / totals.orders) * 100 : 0
                  return (
                    <div key={store.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900">{store.name}</span>
                        <span className="text-gray-600">{store.stats.orders} orders ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: colors[index % colors.length]
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Traffic Distribution */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Page Views by Store</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stores.map((store, index) => {
                  const percentage = totals.views > 0 ? (store.stats.views / totals.views) * 100 : 0
                  return (
                    <div key={store.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900">{store.name}</span>
                        <span className="text-gray-600">{formatNumber(store.stats.views)} views ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: colors[index % colors.length]
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Performance Comparison */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Store Performance</h2>
              {hasMixedCurrencies && (
                <p className="text-xs text-gray-500 mt-1">Sorted by orders (mixed currencies)</p>
              )}
            </div>
            <div className="divide-y divide-gray-200">
              {stores
                .sort((a, b) => hasMixedCurrencies 
                  ? b.stats.orders - a.stats.orders  // Sort by orders if mixed currencies
                  : b.stats.revenue - a.stats.revenue
                )
                .map((store, index) => {
                  const storeConversion = store.stats.views > 0 
                    ? ((store.stats.orders / store.stats.views) * 100).toFixed(2) 
                    : '0'
                  const storeAOV = store.stats.orders > 0 
                    ? store.stats.revenue / store.stats.orders 
                    : 0
                  
                  return (
                    <div key={store.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white`}
                            style={{ backgroundColor: colors[index % colors.length] }}
                          >
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-900">
                            {store.name}
                            {hasMixedCurrencies && (
                              <span className="text-xs text-gray-400 ml-1">({store.currency})</span>
                            )}
                          </span>
                        </div>
                        <Link
                          href={`/admin/stores/${store.id}/analytics`}
                          className="text-sm text-purple-600 hover:text-purple-700"
                        >
                          Details →
                        </Link>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <p className="text-gray-500 text-xs">Revenue</p>
                          <p className="font-semibold">{formatCurrency(store.stats.revenue, store.currency)}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <p className="text-gray-500 text-xs">Conversion</p>
                          <p className="font-semibold">{storeConversion}%</p>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <p className="text-gray-500 text-xs">AOV</p>
                          <p className="font-semibold">{formatCurrency(storeAOV, store.currency)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
