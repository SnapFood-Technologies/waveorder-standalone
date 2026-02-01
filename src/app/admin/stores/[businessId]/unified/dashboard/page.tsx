// src/app/admin/stores/[businessId]/unified/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  LayoutDashboard, 
  ArrowLeft,
  DollarSign,
  ShoppingBag,
  Users,
  Store,
  Eye,
  Package,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface StoreStats {
  orders: number
  revenue: number
  products: number
  customers: number
  views: number
}

interface StoreData {
  id: string
  name: string
  slug: string
  logo: string | null
  currency: string
  stats: StoreStats
}

export default function UnifiedDashboardPage() {
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
        setError('Failed to load dashboard data')
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
    views: acc.views + store.stats.views,
    products: acc.products + store.stats.products
  }), { revenue: 0, orders: 0, customers: 0, views: 0, products: 0 })

  const revenueByCurrency = stores.reduce((acc, store) => {
    if (!acc[store.currency]) acc[store.currency] = 0
    acc[store.currency] += store.stats.revenue
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
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
            The unified dashboard is available when you have 2 or more stores. 
            Create another store to access cross-store analytics and management.
          </p>
          <Link
            href={`/admin/stores/${businessId}/all-stores`}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Unified Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600">Overview of all your stores</p>
          </div>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Multiple currencies detected</p>
            <p className="text-xs text-amber-700 mt-1">
              Your stores use different currencies ({uniqueCurrencies.join(', ')}). Revenue is shown separately by currency.
            </p>
          </div>
        </div>
      )}

      {/* Total Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 col-span-2 sm:col-span-1">
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
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Total Orders</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatNumber(totals.orders)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Customers</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatNumber(totals.customers)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Views</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatNumber(totals.views)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Products</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{formatNumber(totals.products)}</p>
        </div>
      </div>

      {/* Store Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Store Breakdown</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {stores.map((store) => {
            const sameCurrencyStores = stores.filter(s => s.currency === store.currency)
            const sameCurrencyTotal = sameCurrencyStores.reduce((sum, s) => sum + s.stats.revenue, 0)
            const revenuePercent = sameCurrencyTotal > 0 ? (store.stats.revenue / sameCurrencyTotal) * 100 : 0
            const orderPercent = totals.orders > 0 ? (store.stats.orders / totals.orders) * 100 : 0
            
            return (
              <div key={store.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {store.logo ? (
                      <img src={store.logo} alt={store.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Store className="w-5 h-5 text-teal-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{store.name}</h3>
                      <p className="text-sm text-gray-500 truncate">/{store.slug}</p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/stores/${store.id}/dashboard`}
                    className="w-full sm:w-auto text-center px-4 py-2 text-sm bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
                  >
                    View Dashboard →
                  </Link>
                </div>
                
                <div className="mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm mb-1 gap-1">
                    <span className="text-gray-600">Revenue ({store.currency})</span>
                    <span className="font-semibold">
                      {formatCurrency(store.stats.revenue, store.currency)}
                      <span className="text-gray-500 font-normal ml-1">
                        ({revenuePercent.toFixed(1)}%{hasMixedCurrencies ? ` of ${store.currency}` : ''})
                      </span>
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${hasMixedCurrencies ? orderPercent : revenuePercent}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                    <span className="text-gray-500 text-xs sm:text-sm">Orders</span>
                    <p className="font-semibold text-gray-900">{formatNumber(store.stats.orders)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                    <span className="text-gray-500 text-xs sm:text-sm">Customers</span>
                    <p className="font-semibold text-gray-900">{formatNumber(store.stats.customers)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                    <span className="text-gray-500 text-xs sm:text-sm">Views</span>
                    <p className="font-semibold text-gray-900">{formatNumber(store.stats.views)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2 sm:p-0 sm:bg-transparent">
                    <span className="text-gray-500 text-xs sm:text-sm">Products</span>
                    <p className="font-semibold text-gray-900">{formatNumber(store.stats.products)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
