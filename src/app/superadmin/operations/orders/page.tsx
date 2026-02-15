'use client'

import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  CheckCircle,
  XCircle,
  Building2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BarChart3,
  PieChart,
  Truck,
  Package,
  UtensilsCrossed,
  CreditCard,
  Clock,
  ArrowUpRight
} from 'lucide-react'
import Link from 'next/link'

// Types
interface OverviewStats {
  totalOrders: number
  prevTotalOrders: number
  periodChange: number
  completedOrders: number
  cancelledOrders: number
  activeBusinesses: number
  totalBusinesses: number
  avgOrdersPerBusiness: number
}

interface StatusItem {
  status: string
  count: number
}

interface TypeItem {
  type: string
  count: number
}

interface PaymentItem {
  status: string
  count: number
}

interface BusinessTypeItem {
  type: string
  count: number
}

interface DayItem {
  date: string
  count: number
}

interface TopBusiness {
  id: string
  name: string
  slug: string
  businessType: string
  currency: string
  orderCount: number
  totalValue: number
}

interface InactiveBusiness {
  id: string
  name: string
  slug: string
  businessType: string
  createdAt: string
}

interface OperationsData {
  overview: OverviewStats
  ordersByStatus: StatusItem[]
  ordersByType: TypeItem[]
  ordersByPayment: PaymentItem[]
  ordersByBusinessType: BusinessTypeItem[]
  ordersByDay: DayItem[]
  topBusinesses: TopBusiness[]
  businessesWithNoOrders: InactiveBusiness[]
}

// Status display config
const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-500' },
  PREPARING: { label: 'Preparing', color: 'bg-indigo-500' },
  READY: { label: 'Ready', color: 'bg-purple-500' },
  PICKED_UP: { label: 'Picked Up', color: 'bg-teal-500' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-orange-500' },
  DELIVERED: { label: 'Delivered', color: 'bg-green-500' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-500' },
  RETURNED: { label: 'Returned', color: 'bg-orange-500' },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-500' }
}

const typeConfig: Record<string, { label: string; icon: typeof Truck }> = {
  DELIVERY: { label: 'Delivery', icon: Truck },
  PICKUP: { label: 'Pickup', icon: Package },
  DINE_IN: { label: 'Dine-in', icon: UtensilsCrossed }
}

const paymentConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-500' },
  PAID: { label: 'Paid', color: 'bg-green-500' },
  FAILED: { label: 'Failed', color: 'bg-red-500' },
  REFUNDED: { label: 'Refunded', color: 'bg-gray-500' }
}

const businessTypeLabels: Record<string, string> = {
  RESTAURANT: 'Restaurant',
  CAFE: 'Cafe',
  RETAIL: 'Retail',
  JEWELRY: 'Jewelry',
  FLORIST: 'Florist',
  GROCERY: 'Grocery',
  BAKERY: 'Bakery',
  OTHER: 'Other'
}

export default function OperationsOrdersPage() {
  const [data, setData] = useState<OperationsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [period, setPeriod] = useState('this_month')
  const [businessType, setBusinessType] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchData()
  }, [period, businessType])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ period, businessType })
      const response = await fetch(`/api/superadmin/operations/orders?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch operations data')
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getPeriodLabel = () => {
    const labels: Record<string, string> = {
      today: 'Today',
      this_week: 'This Week',
      this_month: 'This Month',
      last_30_days: 'Last 30 Days',
      last_90_days: 'Last 90 Days'
    }
    return labels[period] || 'This Month'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Analytics</h1>
          <p className="text-gray-600 mt-1">Platform-wide order activity and business performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="last_90_days">Last 90 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                {Object.entries(businessTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading orders analytics...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Retry
          </button>
        </div>
      ) : data ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Orders */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{data.overview.totalOrders.toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {data.overview.periodChange >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-600" />
                    )}
                    <span className={`text-xs font-medium ${
                      data.overview.periodChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.overview.periodChange >= 0 ? '+' : ''}{data.overview.periodChange}%
                    </span>
                    <span className="text-xs text-gray-500">vs prev period</span>
                  </div>
                </div>
                <ShoppingCart className="w-8 h-8 text-teal-400" />
              </div>
            </div>

            {/* Completed Orders */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{data.overview.completedOrders.toLocaleString()}</p>
                  {data.overview.totalOrders > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {((data.overview.completedOrders / data.overview.totalOrders) * 100).toFixed(1)}% completion rate
                    </p>
                  )}
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>

            {/* Businesses with Orders */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">With Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{data.overview.activeBusinesses}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    of {data.overview.totalBusinesses} businesses
                  </p>
                </div>
                <Building2 className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            {/* Avg Orders per Business */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{data.overview.avgOrdersPerBusiness}</p>
                  <p className="text-xs text-gray-500 mt-1">per business with orders</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Orders Trend Chart */}
          {data.ordersByDay.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Orders by Day ({getPeriodLabel()})
              </h3>
              <div className="flex items-end justify-between gap-2" style={{ height: 140 }}>
                {(() => {
                  const chartHeight = 100
                  // Show last 7 days for clean display (matches logs chart pattern)
                  const displayDays = data.ordersByDay.slice(-7)
                  const maxCount = Math.max(...displayDays.map(d => d.count))

                  return displayDays.map((item) => {
                    const heightPx = maxCount > 0
                      ? Math.max((item.count / maxCount) * chartHeight, item.count > 0 ? 4 : 2)
                      : 2
                    const date = new Date(item.date)

                    return (
                      <div key={item.date} className="flex flex-col items-center flex-1">
                        <span className="text-xs text-gray-600 mb-1">{item.count.toLocaleString()}</span>
                        <div
                          className="w-full bg-teal-500 rounded-t-sm"
                          style={{ height: heightPx }}
                        />
                        <span className="text-xs text-gray-500 mt-2">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-xs text-gray-400">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          {/* Orders Breakdown Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Orders by Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-purple-600" />
                By Status
              </h3>
              <div className="space-y-3">
                {data.ordersByStatus
                  .sort((a, b) => b.count - a.count)
                  .map((item) => {
                    const config = statusConfig[item.status] || { label: item.status, color: 'bg-gray-500' }
                    const percentage = data.overview.totalOrders > 0
                      ? (item.count / data.overview.totalOrders) * 100
                      : 0

                    return (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${config.color}`} />
                          <span className="text-sm text-gray-700">{config.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                          <span className="text-sm font-medium text-gray-900 w-10 text-right">{item.count}</span>
                        </div>
                      </div>
                    )
                  })}
                {data.ordersByStatus.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No orders in this period</p>
                )}
              </div>
            </div>

            {/* Orders by Type */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-teal-600" />
                By Type
              </h3>
              <div className="space-y-3">
                {data.ordersByType
                  .sort((a, b) => b.count - a.count)
                  .map((item) => {
                    const config = typeConfig[item.type] || { label: item.type, icon: Package }
                    const percentage = data.overview.totalOrders > 0
                      ? (item.count / data.overview.totalOrders) * 100
                      : 0
                    const maxCount = Math.max(...data.ordersByType.map(t => t.count), 1)

                    return (
                      <div key={item.type}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <config.icon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{config.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                            <span className="text-sm font-medium text-gray-900 w-10 text-right">{item.count}</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${(item.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                {data.ordersByType.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No orders in this period</p>
                )}
              </div>
            </div>

            {/* Orders by Payment Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-green-600" />
                By Payment
              </h3>
              <div className="space-y-3">
                {data.ordersByPayment
                  .sort((a, b) => b.count - a.count)
                  .map((item) => {
                    const config = paymentConfig[item.status] || { label: item.status, color: 'bg-gray-500' }
                    const percentage = data.overview.totalOrders > 0
                      ? (item.count / data.overview.totalOrders) * 100
                      : 0

                    return (
                      <div key={item.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${config.color}`} />
                          <span className="text-sm text-gray-700">{config.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{percentage.toFixed(1)}%</span>
                          <span className="text-sm font-medium text-gray-900 w-10 text-right">{item.count}</span>
                        </div>
                      </div>
                    )
                  })}
                {data.ordersByPayment.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No orders in this period</p>
                )}
              </div>
            </div>
          </div>

          {/* Orders by Business Type */}
          {data.ordersByBusinessType.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-blue-600" />
                Orders by Business Type
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {data.ordersByBusinessType.map((item) => {
                  const percentage = data.overview.totalOrders > 0
                    ? ((item.count / data.overview.totalOrders) * 100).toFixed(1)
                    : '0'
                  return (
                    <div key={item.type} className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                      <p className="text-sm text-gray-600 mt-1">{businessTypeLabels[item.type] || item.type}</p>
                      <p className="text-xs text-gray-400">{percentage}%</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top Businesses & No Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Businesses */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Top Businesses by Orders
                </h3>
              </div>
              {data.topBusinesses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Order Value</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.topBusinesses.map((business, index) => {
                        const avgValue = business.orderCount > 0
                          ? (business.totalValue / business.orderCount).toFixed(2)
                          : '0'

                        return (
                          <tr key={business.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                            <td className="px-4 py-3">
                              <Link
                                href={`/superadmin/businesses/${business.id}`}
                                className="text-sm font-medium text-gray-900 hover:text-teal-600 flex items-center gap-1"
                              >
                                {business.name}
                                <ArrowUpRight className="w-3 h-3 text-gray-400" />
                              </Link>
                              <p className="text-xs text-gray-500">{business.slug}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                                {businessTypeLabels[business.businessType] || business.businessType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{business.orderCount}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {business.currency} {business.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">
                              {business.currency} {avgValue}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No orders in this period</p>
                </div>
              )}
            </div>

            {/* Businesses with No Orders */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  No Orders
                </h3>
                <p className="text-xs text-gray-500 mt-1">Active businesses with no orders in this period</p>
              </div>
              {data.businessesWithNoOrders.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {data.businessesWithNoOrders.map((business) => (
                    <Link
                      key={business.id}
                      href={`/superadmin/businesses/${business.id}`}
                      className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{business.name}</p>
                          <p className="text-xs text-gray-500">{businessTypeLabels[business.businessType] || business.businessType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Created</p>
                          <p className="text-xs text-gray-500">{formatDate(business.createdAt)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-300" />
                  <p className="text-sm">All active businesses have orders</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
