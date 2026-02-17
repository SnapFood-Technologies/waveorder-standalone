// src/components/admin/stores/StoreComparison.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  Eye, 
  DollarSign,
  Package,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  LayoutDashboard,
  Boxes,
  PieChart,
  ArrowRight,
  AlertCircle,
  Calendar,
  Scissors
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface StoreStats {
  orders: number
  appointments?: number
  revenue: number
  products: number
  services?: number
  customers: number
  views: number
  avgOrderValue: number
  avgAppointmentValue?: number
}

interface StoreData {
  id: string
  name: string
  slug: string
  logo: string | null
  currency: string
  businessType?: string
  stats: StoreStats
}

interface StoreComparisonProps {
  className?: string
  showQuickActions?: boolean
  businessId?: string
}

export function StoreComparison({ className = '', showQuickActions = true, businessId }: StoreComparisonProps) {
  const [stores, setStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [error, setError] = useState<string | null>(null)
  const [currentBusinessType, setCurrentBusinessType] = useState<string>('RESTAURANT')

  useEffect(() => {
    fetchComparison()
  }, [period])

  useEffect(() => {
    const fetchCurrentBusinessType = async () => {
      if (!businessId) return
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setCurrentBusinessType(data.business?.businessType || 'RESTAURANT')
        }
      } catch (error) {
        console.error('Error fetching business type:', error)
      }
    }
    fetchCurrentBusinessType()
  }, [businessId])

  const fetchComparison = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/analytics/compare-stores?period=${period}`)
      
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores)
      } else {
        const errorData = await response.json()
        setError(errorData.message)
      }
    } catch (err) {
      setError('Failed to load comparison data')
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
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Check if all stores use the same currency
  const getUniqueCurrencies = () => {
    const currencies = [...new Set(stores.map(s => s.currency))]
    return currencies
  }

  const hasMixedCurrencies = () => {
    return getUniqueCurrencies().length > 1
  }

  // Calculate totals across all stores (only meaningful if same currency)
  const getTotals = (): StoreStats => {
    return stores.reduce((totals, store) => ({
      orders: totals.orders + (store.stats.orders || 0),
      appointments: (totals.appointments || 0) + (store.stats.appointments || 0),
      revenue: totals.revenue + store.stats.revenue,
      products: totals.products + (store.stats.products || 0),
      services: (totals.services || 0) + (store.stats.services || 0),
      customers: totals.customers + store.stats.customers,
      views: totals.views + store.stats.views,
      avgOrderValue: 0, // Will calculate separately
      avgAppointmentValue: 0 // Will calculate separately
    }), { orders: 0, appointments: 0, revenue: 0, products: 0, services: 0, customers: 0, views: 0, avgOrderValue: 0, avgAppointmentValue: 0 })
  }

  // Check if we have mixed business types
  const hasMixedBusinessTypes = () => {
    const businessTypes = [...new Set(stores.map(s => s.businessType).filter(Boolean))]
    return businessTypes.length > 1
  }

  // Determine if we should show salon metrics (if all or majority are salons)
  const shouldShowSalonMetrics = () => {
    if (stores.length === 0) return false
    const salonCount = stores.filter(s => s.businessType === 'SALON').length
    return salonCount > stores.length / 2 // Majority are salons
  }

  // Find best performer for each metric
  const getBestStore = (metric: keyof StoreStats): string | null => {
    if (stores.length === 0) return null
    const best = stores.reduce((prev, curr) => {
      const prevValue = prev.stats[metric] || 0
      const currValue = curr.stats[metric] || 0
      return currValue > prevValue ? curr : prev
    })
    return best.id
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || stores.length < 2) {
    return null // Don't show if not enough stores
  }

  const mixedCurrencies = hasMixedCurrencies()
  const uniqueCurrencies = getUniqueCurrencies()
  const primaryCurrency = stores[0]?.currency || 'USD'
  const totals = getTotals()
  const avgOrderValue = totals.orders > 0 ? totals.revenue / totals.orders : 0
  const avgAppointmentValue = (totals.appointments || 0) > 0 ? totals.revenue / (totals.appointments || 1) : 0
  const totalOrdersAndAppts = totals.orders + (totals.appointments || 0)
  const avgMixedValue = totalOrdersAndAppts > 0 ? totals.revenue / totalOrdersAndAppts : 0

  // For mixed currencies, show revenue per currency
  const revenueByProperty = mixedCurrencies
    ? stores.reduce((acc, store) => {
        const key = store.currency
        if (!acc[key]) acc[key] = 0
        acc[key] += store.stats.revenue
        return acc
      }, {} as Record<string, number>)
    : null

  // Determine if we have mixed business types
  const hasSalons = stores.some(s => s.businessType === 'SALON')
  const hasNonSalons = stores.some(s => s.businessType !== 'SALON')
  const isMixedTypes = hasSalons && hasNonSalons

  // Get metrics based on business type
  const getMetrics = () => {
    if (isMixedTypes) {
      // Mixed types: show both orders and appointments, products and services
      return [
        { key: 'orders', label: 'Orders', icon: ShoppingBag, format: formatNumber },
        { key: 'appointments', label: 'Appointments', icon: Calendar, format: formatNumber },
        { key: 'revenue', label: 'Revenue', icon: DollarSign, format: (v: number, store: StoreData) => formatCurrency(v, store.currency) },
        { key: 'customers', label: 'Customers', icon: Users, format: formatNumber },
        { key: 'views', label: 'Page Views', icon: Eye, format: formatNumber },
        { key: 'products', label: 'Products', icon: Package, format: formatNumber },
        { key: 'services', label: 'Services', icon: Scissors, format: formatNumber },
      ] as const
    } else if (hasSalons) {
      // All salons: use salon-specific labels and fields
      return [
        { key: 'appointments', label: 'Appointments', icon: Calendar, format: formatNumber },
        { key: 'revenue', label: 'Revenue', icon: DollarSign, format: (v: number, store: StoreData) => formatCurrency(v, store.currency) },
        { key: 'customers', label: 'Customers', icon: Users, format: formatNumber },
        { key: 'views', label: 'Page Views', icon: Eye, format: formatNumber },
        { key: 'services', label: 'Services', icon: Scissors, format: formatNumber },
      ] as const
    } else {
      // All non-salons: use standard labels
      return [
        { key: 'orders', label: 'Orders', icon: ShoppingBag, format: formatNumber },
        { key: 'revenue', label: 'Revenue', icon: DollarSign, format: (v: number, store: StoreData) => formatCurrency(v, store.currency) },
        { key: 'customers', label: 'Customers', icon: Users, format: formatNumber },
        { key: 'views', label: 'Page Views', icon: Eye, format: formatNumber },
        { key: 'products', label: 'Products', icon: Package, format: formatNumber },
      ] as const
    }
  }

  const metrics = getMetrics()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Mixed Currency Warning */}
      {mixedCurrencies && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Multiple currencies detected</p>
            <p className="text-xs text-amber-700 mt-1">
              Your stores use different currencies ({uniqueCurrencies.join(', ')}). Revenue totals are shown separately by currency.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards - Totals Across All Stores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Total Revenue
          </div>
          {mixedCurrencies ? (
            <div className="space-y-1">
              {Object.entries(revenueByProperty!).map(([currency, amount]) => (
                <p key={currency} className="text-lg font-bold text-gray-900">
                  {formatCurrency(amount, currency)}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.revenue, primaryCurrency)}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Last {period} days</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            {hasSalons && !hasNonSalons ? <Calendar className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            {hasSalons && !hasNonSalons ? 'Total Appointments' : hasSalons && hasNonSalons ? 'Total Orders/Appts' : 'Total Orders'}
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(
              hasSalons && !hasNonSalons 
                ? (totals.appointments || 0) 
                : hasSalons && hasNonSalons 
                  ? totalOrdersAndAppts 
                  : totals.orders
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">Across {stores.length} stores</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <Users className="w-4 h-4" />
            Total Customers
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(totals.customers)}</p>
          <p className="text-xs text-gray-500 mt-1">Unique customers</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            {hasSalons && !hasNonSalons ? 'Avg Appointment Value' : hasSalons && hasNonSalons ? 'Avg Order/Appt Value' : 'Avg Order Value'}
          </div>
          {mixedCurrencies ? (
            <p className="text-lg font-medium text-gray-500">Per store</p>
          ) : (
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(
                hasSalons && !hasNonSalons 
                  ? avgAppointmentValue 
                  : hasSalons && hasNonSalons 
                    ? avgMixedValue 
                    : avgOrderValue, 
                primaryCurrency
              )}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">{mixedCurrencies ? 'Mixed currencies' : 'Combined average'}</p>
        </div>
      </div>

      {/* Quick Actions - CTAs to Cross-Store Features */}
      {showQuickActions && businessId && (
        <div className={`grid grid-cols-2 ${currentBusinessType === 'SALON' ? 'md:grid-cols-3' : 'md:grid-cols-4'} gap-4`}>
          <Link
            href={`/admin/stores/${businessId}/unified/dashboard`}
            className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg border border-teal-200 p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-2">
              <LayoutDashboard className="w-5 h-5 text-teal-600" />
              <ArrowRight className="w-4 h-4 text-teal-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-semibold text-gray-900">Unified Dashboard</h4>
            <p className="text-xs text-gray-600 mt-1">Overview of all stores</p>
          </Link>
          
          <Link
            href={`/admin/stores/${businessId}/unified/analytics`}
            className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between mb-2">
              <PieChart className="w-5 h-5 text-purple-600" />
              <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="font-semibold text-gray-900">Cross-Store Analytics</h4>
            <p className="text-xs text-gray-600 mt-1">Combined insights</p>
          </Link>
          
          {currentBusinessType === 'SALON' ? (
            <Link
              href={`/admin/stores/${businessId}/appointments`}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h4 className="font-semibold text-gray-900">All Appointments</h4>
              <p className="text-xs text-gray-600 mt-1">Appointments from all stores</p>
            </Link>
          ) : (
            <>
              <Link
                href={`/admin/stores/${businessId}/unified/orders`}
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-2">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                  <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-semibold text-gray-900">All Orders</h4>
                <p className="text-xs text-gray-600 mt-1">Orders from all stores</p>
              </Link>
              
              <Link
                href={`/admin/stores/${businessId}/unified/inventory`}
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200 p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Boxes className="w-5 h-5 text-amber-600" />
                  <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <h4 className="font-semibold text-gray-900">Inventory Overview</h4>
                <p className="text-xs text-gray-600 mt-1">Stock across stores</p>
              </Link>
            </>
          )}
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-semibold text-gray-900">Store Performance</h3>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button
              onClick={fetchComparison}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tables - Separate for Salons and Non-Salons */}
        {isMixedTypes ? (
          <>
            {/* Salons Table */}
            {hasSalons && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-teal-600" />
                    Salon Stores Performance
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Store
                        </th>
                        {metrics.filter(m => m.key === 'appointments' || m.key === 'revenue' || m.key === 'customers' || m.key === 'views' || m.key === 'services').map((metric) => (
                          <th 
                            key={metric.key}
                            className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <metric.icon className="w-3.5 h-3.5" />
                              {metric.label}
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stores.filter(s => s.businessType === 'SALON').map((store) => (
                        <tr key={store.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {store.logo ? (
                                <Image
                                  src={store.logo}
                                  alt={store.name}
                                  width={32}
                                  height={32}
                                  className="rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                                  <span className="text-teal-700 font-semibold text-sm">
                                    {store.name[0]?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{store.name}</p>
                                <p className="text-xs text-gray-500">/{store.slug}</p>
                              </div>
                            </div>
                          </td>
                          {metrics.filter(m => m.key === 'appointments' || m.key === 'revenue' || m.key === 'customers' || m.key === 'views' || m.key === 'services').map((metric) => {
                            const salonStores = stores.filter(s => s.businessType === 'SALON')
                            // Compare best within salon stores only
                            const bestSalonStore = salonStores.length > 1 
                              ? salonStores.reduce((prev, curr) => {
                                  const prevValue = prev.stats[metric.key as keyof StoreStats] || 0
                                  const currValue = curr.stats[metric.key as keyof StoreStats] || 0
                                  return currValue > prevValue ? curr : prev
                                })
                              : null
                            const isBest = bestSalonStore && bestSalonStore.id === store.id && salonStores.length > 1 && (metric.key !== 'revenue' || !mixedCurrencies)
                            const value = store.stats[metric.key as keyof StoreStats] || 0
                            
                            return (
                              <td 
                                key={metric.key} 
                                className={`px-4 py-4 text-center whitespace-nowrap ${
                                  isBest ? 'bg-green-50' : ''
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span className={`font-semibold ${isBest ? 'text-green-700' : 'text-gray-900'}`}>
                                    {metric.key === 'revenue' 
                                      ? formatCurrency(value as number, store.currency) 
                                      : (metric.format as (v: number) => string)(value as number)
                                    }
                                  </span>
                                  {isBest && (
                                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                              </td>
                            )
                          })}
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <Link
                              href={`/admin/stores/${store.id}/dashboard`}
                              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                            >
                              View →
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {/* Totals Row for Salons */}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="text-gray-900">Total (Salon Stores)</span>
                          </div>
                        </td>
                        {metrics.filter(m => m.key === 'appointments' || m.key === 'revenue' || m.key === 'customers' || m.key === 'views' || m.key === 'services').map((metric) => {
                          const salonStores = stores.filter(s => s.businessType === 'SALON')
                          const salonTotals = salonStores.reduce((acc, s) => ({
                            ...acc,
                            [metric.key]: (acc[metric.key as keyof StoreStats] || 0) + (s.stats[metric.key as keyof StoreStats] || 0)
                          }), {} as StoreStats)
                          const totalValue = salonTotals[metric.key as keyof StoreStats] || 0
                          return (
                            <td key={metric.key} className="px-4 py-4 text-center whitespace-nowrap">
                              {metric.key === 'revenue' && mixedCurrencies ? (
                                <div className="text-xs space-y-0.5">
                                  {Object.entries(revenueByProperty!).map(([currency, amount]) => (
                                    <div key={currency} className="text-gray-900">
                                      {formatCurrency(amount, currency)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-900">
                                  {metric.key === 'revenue' 
                                    ? formatCurrency(totalValue as number, primaryCurrency)
                                    : formatNumber(totalValue as number)
                                  }
                                </span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-4 py-4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Non-Salon Stores Table */}
            {hasNonSalons && (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-blue-600" />
                    Restaurant/Retail Stores Performance
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Store
                        </th>
                        {metrics.filter(m => m.key === 'orders' || m.key === 'revenue' || m.key === 'customers' || m.key === 'views' || m.key === 'products').map((metric) => (
                          <th 
                            key={metric.key}
                            className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <metric.icon className="w-3.5 h-3.5" />
                              {metric.label}
                            </div>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stores.filter(s => s.businessType !== 'SALON').map((store) => (
                        <tr key={store.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {store.logo ? (
                                <Image
                                  src={store.logo}
                                  alt={store.name}
                                  width={32}
                                  height={32}
                                  className="rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                                  <span className="text-teal-700 font-semibold text-sm">
                                    {store.name[0]?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{store.name}</p>
                                <p className="text-xs text-gray-500">/{store.slug}</p>
                              </div>
                            </div>
                          </td>
                          {metrics.filter(m => m.key === 'orders' || m.key === 'revenue' || m.key === 'customers' || m.key === 'views' || m.key === 'products').map((metric) => {
                            const nonSalonStores = stores.filter(s => s.businessType !== 'SALON')
                            // Compare best within non-salon stores only
                            const bestNonSalonStore = nonSalonStores.length > 1
                              ? nonSalonStores.reduce((prev, curr) => {
                                  const prevValue = prev.stats[metric.key as keyof StoreStats] || 0
                                  const currValue = curr.stats[metric.key as keyof StoreStats] || 0
                                  return currValue > prevValue ? curr : prev
                                })
                              : null
                            const isBest = bestNonSalonStore && bestNonSalonStore.id === store.id && nonSalonStores.length > 1 && (metric.key !== 'revenue' || !mixedCurrencies)
                            const value = store.stats[metric.key as keyof StoreStats] || 0
                            
                            return (
                              <td 
                                key={metric.key} 
                                className={`px-4 py-4 text-center whitespace-nowrap ${
                                  isBest ? 'bg-green-50' : ''
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span className={`font-semibold ${isBest ? 'text-green-700' : 'text-gray-900'}`}>
                                    {metric.key === 'revenue' 
                                      ? formatCurrency(value as number, store.currency) 
                                      : (metric.format as (v: number) => string)(value as number)
                                    }
                                  </span>
                                  {isBest && (
                                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                              </td>
                            )
                          })}
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <Link
                              href={`/admin/stores/${store.id}/dashboard`}
                              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                            >
                              View →
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {/* Totals Row for Non-Salons */}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="text-gray-900">Total (Restaurant/Retail Stores)</span>
                          </div>
                        </td>
                        {metrics.filter(m => m.key === 'orders' || m.key === 'revenue' || m.key === 'customers' || m.key === 'views' || m.key === 'products').map((metric) => {
                          const nonSalonStores = stores.filter(s => s.businessType !== 'SALON')
                          const nonSalonTotals = nonSalonStores.reduce((acc, s) => ({
                            ...acc,
                            [metric.key]: (acc[metric.key as keyof StoreStats] || 0) + (s.stats[metric.key as keyof StoreStats] || 0)
                          }), {} as StoreStats)
                          const totalValue = nonSalonTotals[metric.key as keyof StoreStats] || 0
                          return (
                            <td key={metric.key} className="px-4 py-4 text-center whitespace-nowrap">
                              {metric.key === 'revenue' && mixedCurrencies ? (
                                <div className="text-xs space-y-0.5">
                                  {Object.entries(revenueByProperty!).map(([currency, amount]) => (
                                    <div key={currency} className="text-gray-900">
                                      {formatCurrency(amount, currency)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-900">
                                  {metric.key === 'revenue' 
                                    ? formatCurrency(totalValue as number, primaryCurrency)
                                    : formatNumber(totalValue as number)
                                  }
                                </span>
                              )}
                            </td>
                          )
                        })}
                        <td className="px-4 py-4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Single Table for All Same Type */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  {metrics.map((metric) => (
                    <th 
                      key={metric.key}
                      className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <metric.icon className="w-3.5 h-3.5" />
                        {metric.label}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {store.logo ? (
                          <Image
                            src={store.logo}
                            alt={store.name}
                            width={32}
                            height={32}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                            <span className="text-teal-700 font-semibold text-sm">
                              {store.name[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{store.name}</p>
                          <p className="text-xs text-gray-500">/{store.slug}</p>
                        </div>
                      </div>
                    </td>
                    {metrics.map((metric) => {
                      const isBest = getBestStore(metric.key) === store.id && stores.length > 1 && (metric.key !== 'revenue' || !mixedCurrencies)
                      const value = store.stats[metric.key as keyof StoreStats] || 0
                      
                      return (
                        <td 
                          key={metric.key} 
                          className={`px-4 py-4 text-center whitespace-nowrap ${
                            isBest ? 'bg-green-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-semibold ${isBest ? 'text-green-700' : 'text-gray-900'}`}>
                              {metric.key === 'revenue' 
                                ? formatCurrency(value as number, store.currency) 
                                : (metric.format as (v: number) => string)(value as number)
                              }
                            </span>
                            {isBest && (
                              <ArrowUpRight className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </td>
                      )
                    })}
                    <td className="px-4 py-4 text-center whitespace-nowrap">
                      <Link
                        href={`/admin/stores/${store.id}/dashboard`}
                        className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
                
                {/* Totals Row */}
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-gray-900">Total (All Stores)</span>
                    </div>
                  </td>
                  {metrics.map((metric) => {
                    const totalValue = totals[metric.key as keyof StoreStats] || 0
                    return (
                      <td key={metric.key} className="px-4 py-4 text-center whitespace-nowrap">
                        {metric.key === 'revenue' && mixedCurrencies ? (
                          <div className="text-xs space-y-0.5">
                            {Object.entries(revenueByProperty!).map(([currency, amount]) => (
                              <div key={currency} className="text-gray-900">
                                {formatCurrency(amount, currency)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-900">
                            {metric.key === 'revenue' 
                              ? formatCurrency(totalValue as number, primaryCurrency)
                              : formatNumber(totalValue as number)
                            }
                          </span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-4 py-4"></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Comparing {stores.length} stores over the last {period} days. 
          <span className="text-green-600 ml-1">Green highlights</span> indicate best performance.
        </div>
      </div>
    </div>
  )
}
