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
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'
import Image from 'next/image'

interface StoreStats {
  orders: number
  revenue: number
  products: number
  customers: number
  views: number
  avgOrderValue: number
}

interface StoreData {
  id: string
  name: string
  slug: string
  logo: string | null
  currency: string
  stats: StoreStats
}

interface StoreComparisonProps {
  className?: string
}

export function StoreComparison({ className = '' }: StoreComparisonProps) {
  const [stores, setStores] = useState<StoreData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchComparison()
  }, [period])

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

  // Find best performer for each metric
  const getBestStore = (metric: keyof StoreStats): string | null => {
    if (stores.length === 0) return null
    const best = stores.reduce((prev, curr) => 
      curr.stats[metric] > prev.stats[metric] ? curr : prev
    )
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

  const metrics = [
    { key: 'orders', label: 'Orders', icon: ShoppingBag, format: formatNumber },
    { key: 'revenue', label: 'Revenue', icon: DollarSign, format: (v: number, store: StoreData) => formatCurrency(v, store.currency) },
    { key: 'customers', label: 'Customers', icon: Users, format: formatNumber },
    { key: 'views', label: 'Page Views', icon: Eye, format: formatNumber },
    { key: 'products', label: 'Products', icon: Package, format: formatNumber },
    { key: 'avgOrderValue', label: 'Avg Order', icon: TrendingUp, format: (v: number, store: StoreData) => formatCurrency(v, store.currency) },
  ] as const

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-semibold text-gray-900">Store Comparison</h3>
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

      {/* Comparison Table */}
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
                  const isBest = getBestStore(metric.key) === store.id && stores.length > 1
                  const value = store.stats[metric.key]
                  
                  return (
                    <td 
                      key={metric.key} 
                      className={`px-4 py-4 text-center whitespace-nowrap ${
                        isBest ? 'bg-green-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className={`font-semibold ${isBest ? 'text-green-700' : 'text-gray-900'}`}>
                          {metric.format(value, store)}
                        </span>
                        {isBest && (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Comparing {stores.length} stores over the last {period} days. 
        <span className="text-green-600 ml-1">Green highlights</span> indicate best performance.
      </div>
    </div>
  )
}
