// src/app/admin/stores/[businessId]/unified/orders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  ArrowLeft,
  ShoppingBag,
  Store,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  businessId: string
  businessName: string
  businessSlug: string
  currency: string
  customerName: string
  total: number
  status: string
  createdAt: string
}

const ORDERS_PER_PAGE = 25

export default function UnifiedOrdersPage() {
  const params = useParams()
  const businessId = params.businessId as string
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [storeCount, setStoreCount] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    checkStoreCount()
  }, [])

  useEffect(() => {
    if (storeCount !== null && storeCount >= 2) {
      fetchOrders()
    }
  }, [statusFilter, storeCount, page])

  const checkStoreCount = async () => {
    try {
      const response = await fetch('/api/user/businesses')
      if (response.ok) {
        const data = await response.json()
        setStoreCount(data.businesses?.length || 0)
      } else {
        setError('Failed to load store information')
        setStoreCount(0)
      }
    } catch (error) {
      setError('Failed to connect to server')
      setStoreCount(0)
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const skip = (page - 1) * ORDERS_PER_PAGE
      const response = await fetch(`/api/admin/unified/orders?status=${statusFilter}&limit=${ORDERS_PER_PAGE}&skip=${skip}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setTotalOrders(data.total || 0)
        setHasMore(data.hasMore || false)
      } else {
        setError('Failed to load orders')
      }
    } catch (error) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    setPage(1)
  }

  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE)

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      PREPARING: 'bg-orange-100 text-orange-800',
      READY: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (storeCount === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (storeCount < 2) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Multi-Store Feature</h2>
          <p className="text-gray-600 mb-6">
            The unified orders view is available when you have 2 or more stores.
          </p>
          <Link
            href={`/admin/stores/${businessId}/all-stores`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">All Orders</h1>
            <p className="text-sm sm:text-base text-gray-600">Orders from all your stores</p>
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PREPARING">Preparing</option>
          <option value="READY">Ready</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button onClick={fetchOrders} className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-500 mt-2">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">Orders from all your stores will appear here.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order.id} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  {/* Mobile Layout */}
                  <div className="sm:hidden space-y-3">
                    <div className="flex items-center justify-between">
                      <Link 
                        href={`/admin/stores/${order.businessId}/orders/${order.id}`}
                        className="font-semibold text-gray-900 hover:text-blue-600"
                      >
                        #{order.orderNumber}
                      </Link>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-600 truncate max-w-[120px]">{order.businessName}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(order.total, order.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="truncate max-w-[150px]">{order.customerName}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">{order.businessName}</span>
                      </div>
                      <div>
                        <Link 
                          href={`/admin/stores/${order.businessId}/orders/${order.id}`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          #{order.orderNumber}
                        </Link>
                        <p className="text-sm text-gray-500">{order.customerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(order.total, order.currency)}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {totalOrders > ORDERS_PER_PAGE && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50">
                <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Showing {((page - 1) * ORDERS_PER_PAGE) + 1} - {Math.min(page * ORDERS_PER_PAGE, totalOrders)} of {totalOrders}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-sm font-medium text-gray-700">{page} / {totalPages}</span>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMore}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
