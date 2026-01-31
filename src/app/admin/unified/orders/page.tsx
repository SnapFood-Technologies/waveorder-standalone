// src/app/admin/unified/orders/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  ShoppingBag,
  Store,
  Clock,
  Loader2,
  Filter,
  Search,
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
  const router = useRouter()
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
      console.error('Error checking store count:', error)
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
      console.error('Error fetching orders:', error)
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus)
    setPage(1) // Reset to first page when filter changes
  }

  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE)

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  // Show loading while checking store count
  if (storeCount === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Show message if user doesn't have enough stores
  if (storeCount < 2) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Multi-Store Feature</h2>
            <p className="text-gray-600 mb-6">
              The unified orders view is available when you have 2 or more stores. 
              Create another store to see orders from all stores in one place.
            </p>
            <Link
              href="/admin/stores"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
                <p className="text-gray-600">Orders from all your stores</p>
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
              <p className="text-xs text-red-600 mt-1">Please try again or contact support if the issue persists.</p>
            </div>
            <button
              onClick={fetchOrders}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
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
                  <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
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
              
              {/* Pagination */}
              {totalOrders > ORDERS_PER_PAGE && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Showing {((page - 1) * ORDERS_PER_PAGE) + 1} - {Math.min(page * ORDERS_PER_PAGE, totalOrders)} of {totalOrders} orders
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm font-medium text-gray-700">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={!hasMore}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    </div>
  )
}
