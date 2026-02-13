// src/app/admin/stores/[businessId]/packaging/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, DollarSign, TrendingUp, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface DashboardStats {
  totalPackagingTypes: number
  totalPurchases: number
  totalSpent: number
  totalPackagesUsed: number
  totalOrderCost: number
}

interface TopSupplier {
  supplier: string
  totalSpent: number
  purchaseCount: number
}

interface MostUsedType {
  packagingType: {
    id: string
    name: string
    unit: string
  } | null
  quantityUsed: number
  usageCount: number
}

interface RecentPurchase {
  id: string
  supplier: string
  quantity: number
  totalCost: number
  purchaseDate: string
  packagingType: {
    id: string
    name: string
    unit: string
  }
}

export default function PackagingDashboardPage() {
  const params = useParams()
  const businessId = params.businessId as string

  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('30d')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topSuppliers, setTopSuppliers] = useState<TopSupplier[]>([])
  const [mostUsedTypes, setMostUsedTypes] = useState<MostUsedType[]>([])
  const [recentPurchases, setRecentPurchases] = useState<RecentPurchase[]>([])
  const [currency, setCurrency] = useState('USD')

  useEffect(() => {
    fetchDashboard()
  }, [businessId, range])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/stores/${businessId}/packaging/dashboard?range=${range}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setTopSuppliers(data.topSuppliers || [])
        setMostUsedTypes(data.mostUsedTypes || [])
        setRecentPurchases(data.recentPurchases || [])
        setCurrency(data.currency || 'USD')
      } else {
        toast.error('Failed to load dashboard data')
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      toast.error('Failed to load dashboard')
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
    const symbol = currencySymbols[currency] || currency
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-teal-600" />
            <h1 className="text-xl font-semibold text-gray-900">Packaging Dashboard</h1>
          </div>
          <p className="text-gray-600 mt-1">Overview of your packaging tracking</p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Packaging Types</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPackagingTypes}</p>
                </div>
                <Package className="w-8 h-8 text-teal-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Purchases</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPurchases}</p>
                </div>
                <ShoppingBag className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalSpent)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Packages Used</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPackagesUsed}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Order Costs</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalOrderCost)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Top Suppliers */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers</h2>
              {topSuppliers.length === 0 ? (
                <p className="text-sm text-gray-500">No supplier data available</p>
              ) : (
                <div className="space-y-3">
                  {topSuppliers.map((supplier, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{supplier.supplier}</p>
                        <p className="text-xs text-gray-500">{supplier.purchaseCount} purchase{supplier.purchaseCount !== 1 ? 's' : ''}</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatCurrency(supplier.totalSpent)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Most Used Types */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Used Packaging Types</h2>
              {mostUsedTypes.length === 0 ? (
                <p className="text-sm text-gray-500">No usage data available</p>
              ) : (
                <div className="space-y-3">
                  {mostUsedTypes.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.packagingType?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">{item.usageCount} order{item.usageCount !== 1 ? 's' : ''}</p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {item.quantityUsed} {item.packagingType?.unit || ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Purchases */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Purchases</h2>
            {recentPurchases.length === 0 ? (
              <p className="text-sm text-gray-500">No recent purchases</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Packaging Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentPurchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(purchase.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {purchase.packagingType.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{purchase.supplier}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {purchase.quantity} {purchase.packagingType.unit}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(purchase.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
