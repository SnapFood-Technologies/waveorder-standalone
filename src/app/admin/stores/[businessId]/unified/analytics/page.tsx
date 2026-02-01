// src/app/admin/stores/[businessId]/unified/analytics/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft,
  PieChart,
  TrendingUp,
  DollarSign,
  Users,
  Eye,
  Loader2,
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
  const params = useParams()
  const businessId = params.businessId as string
  
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

  const uniqueCurrencies = [...new Set(stores.map(s => s.currency))]
  const hasMixedCurrencies = uniqueCurrencies.length > 1
  const primaryCurrency = stores[0]?.currency || 'USD'

  const totals = stores.reduce((acc, store) => ({
    revenue: acc.revenue + store.stats.revenue,
    orders: acc.orders + store.stats.orders,
    customers: acc.customers + store.stats.customers,
    views: acc.views + store.stats.views
  }), { revenue: 0, orders: 0, customers: 0, views: 0 })

  const revenueByCurrency = stores.reduce((acc, store) => {
    if (!acc[store.currency]) acc[store.currency] = 0
    acc[store.currency] += store.stats.revenue
    return acc
  }, {} as Record<string, number>)

  const conversionRate = totals.views > 0 ? ((totals.orders / totals.views) * 100).toFixed(2) : '0'
  const avgOrderValue = totals.orders > 0 ? totals.revenue / totals.orders : 0
  const colors = ['#0D9488', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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
            Cross-store analytics is available when you have 2 or more stores.
          </p>
          <Link
            href={`/admin/stores/${businessId}/all-stores`}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
      {/* Back Link */}
      <Link 
        href={`/admin/stores/${businessId}/all-stores`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Back to All Stores
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Cross-Store Analytics</h1>
            <p className="text-sm sm:text-base text-gray-600">Combined insights from all stores</p>
          </div>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button onClick={fetchData} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}

      {hasMixedCurrencies && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Multiple currencies detected</p>
            <p className="text-xs text-amber-700 mt-1">
              Your stores use different currencies ({uniqueCurrencies.join(', ')}).
            </p>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Total Revenue</span>
          </div>
          {hasMixedCurrencies ? (
            <div className="space-y-1">
              {Object.entries(revenueByCurrency).map(([currency, amount]) => (
                <p key={currency} className="text-lg sm:text-xl font-bold text-gray-900">
                  {formatCurrency(amount, currency)}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(totals.revenue, primaryCurrency)}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Avg Order</span>
          </div>
          {hasMixedCurrencies ? (
            <p className="text-base sm:text-lg font-medium text-gray-500">Per store</p>
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatCurrency(avgOrderValue, primaryCurrency)}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Conversion</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{conversionRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Customers</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatNumber(totals.customers)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Revenue by Store</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {stores.map((store, index) => {
              const sameCurrencyRevenue = stores.filter(s => s.currency === store.currency).reduce((sum, s) => sum + s.stats.revenue, 0)
              const percentage = sameCurrencyRevenue > 0 ? (store.stats.revenue / sameCurrencyRevenue) * 100 : 0
              return (
                <div key={store.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm mb-1 gap-0.5">
                    <span className="font-medium text-gray-900 truncate">{store.name}</span>
                    <span className="text-gray-600 text-xs sm:text-sm">{formatCurrency(store.stats.revenue, store.currency)} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-3 sm:h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: colors[index % colors.length] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Orders Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Orders by Store</h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            {stores.map((store, index) => {
              const percentage = totals.orders > 0 ? (store.stats.orders / totals.orders) * 100 : 0
              return (
                <div key={store.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm mb-1 gap-0.5">
                    <span className="font-medium text-gray-900 truncate">{store.name}</span>
                    <span className="text-gray-600 text-xs sm:text-sm">{store.stats.orders} orders ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-3 sm:h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, backgroundColor: colors[index % colors.length] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
