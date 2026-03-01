'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Search,
  Filter,
  X,
  Eye,
  Phone,
  MapPin,
  RefreshCw,
  Send,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface OrderItem {
  id: string
  orderNumber: string
  status: string
  type: string
  total: number
  subtotal: number
  deliveryFee: number
  customerName: string
  deliveryAddress: string | null
  notes: string | null
  paymentStatus: string
  paymentMethod: string | null
  createdAt: string
  business: { id: string; name: string; slug: string; currency: string } | null
  customer: { id: string; name: string; phone: string; email: string | null }
  itemCount: number
  items: Array<{ id: string; quantity: number; price: number; product: { name: string }; variant: { name: string } | null }>
  twilioStatus: { status: 'sent' | 'error'; error?: string } | null
}

interface BusinessOption {
  id: string
  name: string
  slug: string
  currency: string
}

interface ApiResponse {
  orders: OrderItem[]
  businesses: BusinessOption[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#fbbf24',
  CONFIRMED: '#3b82f6',
  PREPARING: '#8b5cf6',
  READY: '#10b981',
  PICKED_UP: '#059669',
  OUT_FOR_DELIVERY: '#06b6d4',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
  RETURNED: '#f97316',
  REFUNDED: '#6b7280'
}

export default function AllOrdersPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterBusiness, setFilterBusiness] = useState('')
  const [period, setPeriod] = useState('last_30_days')
  const [showFilters, setShowFilters] = useState(false)
  const [resendModalOrder, setResendModalOrder] = useState<OrderItem | null>(null)
  const [resendPreview, setResendPreview] = useState<any>(null)
  const [resendDebug, setResendDebug] = useState<{ contentSid: string; contentVariables: Record<string, string>; from: string; to: string; templateType: string } | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSending, setResendSending] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchData()
  }, [currentPage, debouncedSearchQuery, filterStatus, filterType, filterBusiness, period])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        period
      })
      if (debouncedSearchQuery.trim()) params.append('search', debouncedSearchQuery.trim())
      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterType !== 'all') params.append('type', filterType)
      if (filterBusiness) params.append('businessId', filterBusiness)

      const response = await fetch(`/api/superadmin/orders?${params}`)
      if (!response.ok) throw new Error('Failed to fetch orders')
      const result: ApiResponse = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    const symbol =
      currency === 'EUR' ? '€' :
      currency === 'USD' ? '$' :
      currency === 'GBP' ? '£' :
      currency === 'ALL' ? 'L' :
      currency === 'BBD' ? 'BBD' :
      currency || ''
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

  const formatStatusLabel = (status: string) => status.replace('_', ' ')
  const getStatusColor = (status: string) => STATUS_COLORS[status] || '#6b7280'

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DELIVERY': return '🚚'
      case 'PICKUP': return '🏪'
      case 'DINE_IN': return '🍽️'
      default: return '📦'
    }
  }

  const truncateAddress = (address: string | null, maxLength = 50) => {
    if (!address) return null
    return address.length > maxLength ? `${address.substring(0, maxLength)}...` : address
  }

  const parseStreetFromAddress = (address: string | null) => {
    if (!address) return null
    try {
      const parsed = JSON.parse(address)
      if (parsed && typeof parsed === 'object') return parsed.street || parsed.address || address
    } catch {}
    return address.split(/[,\n\r]/)[0]?.trim() || address
  }

  const clearFilters = () => {
    setFilterStatus('all')
    setFilterType('all')
    setFilterBusiness('')
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setCurrentPage(1)
  }

  const openResendModal = async (order: OrderItem) => {
    if (!order.business) return
    setResendModalOrder(order)
    setResendPreview(null)
    setResendDebug(null)
    setResendLoading(true)
    try {
      const res = await fetch(`/api/superadmin/businesses/${order.business.id}/orders/${order.id}/resend-twilio`)
      const json = await res.json()
      if (res.ok) {
        setResendPreview(json.preview)
        setResendDebug(json.debug || null)
      }
      else {
        toast.error(json.message || 'Failed to load preview')
        setResendModalOrder(null)
      }
    } catch (e) {
      toast.error('Failed to load preview')
      setResendModalOrder(null)
    } finally {
      setResendLoading(false)
    }
  }

  const closeResendModal = () => {
    setResendModalOrder(null)
    setResendPreview(null)
    setResendDebug(null)
  }

  const handleResendTwilio = async () => {
    if (!resendModalOrder?.business) return
    setResendSending(true)
    try {
      const res = await fetch(
        `/api/superadmin/businesses/${resendModalOrder.business.id}/orders/${resendModalOrder.id}/resend-twilio`,
        { method: 'POST' }
      )
      const json = await res.json()
      if (json.debug) setResendDebug(json.debug)
      if (json.success) {
        toast.success('WhatsApp notification sent')
        closeResendModal()
        fetchData()
      } else {
        toast.error(json.error || 'Failed to send')
      }
    } catch {
      toast.error('Failed to send')
    } finally {
      setResendSending(false)
    }
  }

  const activeFiltersCount = [
    filterStatus !== 'all',
    filterType !== 'all',
    !!filterBusiness,
    debouncedSearchQuery.trim()
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/superadmin/operations/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Orders</h1>
            <p className="text-gray-600 mt-1">All orders across all businesses</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, customer name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-teal-50 border-teal-200 text-teal-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-teal-100 text-teal-800 text-xs rounded-full px-2 py-1">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <div className="text-sm text-gray-600">{data?.pagination.total ?? '-'} orders</div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
                <select
                  value={filterBusiness}
                  onChange={(e) => setFilterBusiness(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">All Businesses</option>
                  {data?.businesses.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Types</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="PICKUP">Pickup</option>
                  <option value="DINE_IN">Dine In</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
                >
                  <option value="last_7_days">Last 7 Days</option>
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_3_months">Last 3 Months</option>
                  <option value="last_6_months">Last 6 Months</option>
                  <option value="this_year">This Year</option>
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={clearFilters} className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800">
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600">{error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              Retry
            </button>
          </div>
        ) : !data?.orders.length ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Type & Address</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.orders.map((order) => {
                    const currency = order.business?.currency || 'USD'
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">#{order.orderNumber}</div>
                            <div className="text-xs text-gray-500">{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {order.business ? (
                            <Link
                              href={`/superadmin/businesses/${order.business.id}`}
                              className="text-sm font-medium text-teal-600 hover:text-teal-700"
                            >
                              {order.business.name}
                            </Link>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                            <div className="flex items-center text-xs text-gray-600">
                              <Phone className="w-3 h-3 mr-1" />
                              {order.customer.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="space-y-2">
                            <div className={`flex items-center justify-center px-2 py-1 rounded text-xs font-medium ${
                              order.type === 'DELIVERY' ? 'bg-blue-100 text-blue-700' :
                              order.type === 'PICKUP' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {getTypeIcon(order.type)} {order.type}
                            </div>
                            {order.type === 'DELIVERY' && order.deliveryAddress && (
                              <div className="text-xs text-gray-600 flex items-center justify-center max-w-56 mx-auto">
                                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate" title={order.deliveryAddress}>
                                  {truncateAddress(parseStreetFromAddress(order.deliveryAddress))}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status) }}
                            >
                              {formatStatusLabel(order.status)}
                            </span>
                            {order.twilioStatus?.status === 'error' && (
                              <span className="inline-flex items-center text-amber-600 text-xs" title={order.twilioStatus?.error}>
                                <AlertCircle className="w-3 h-3 mr-0.5" />
                                WhatsApp failed
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.total, currency)}
                          </div>
                          {order.deliveryFee > 0 && (
                            <div className="text-xs text-gray-500">
                              +{formatCurrency(order.deliveryFee, currency)} delivery
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                          {order.paymentMethod && (
                            <div className="text-xs text-gray-500">{order.paymentMethod}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {order.twilioStatus?.status === 'error' && order.business && (
                              <button
                                onClick={() => openResendModal(order)}
                                className="inline-flex items-center px-2 py-1 border border-amber-300 bg-amber-50 text-amber-800 rounded text-xs hover:bg-amber-100"
                                title={order.twilioStatus?.error}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Resend WhatsApp
                              </button>
                            )}
                            {order.business && (
                              <Link
                                href={`/admin/stores/${order.business.id}/orders/${order.id}?impersonate=true&businessId=${order.business.id}`}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {data.pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of {data.pagination.total}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={data.pagination.page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-sm">
                    Page {data.pagination.page} of {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, data.pagination.pages))}
                    disabled={data.pagination.page === data.pagination.pages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Resend WhatsApp Modal */}
      {resendModalOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Resend WhatsApp Notification</h3>
                <button onClick={closeResendModal} className="text-gray-400 hover:text-gray-600">×</button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                The previous WhatsApp notification for order #{resendModalOrder.orderNumber} failed.
                This will send the same message again to the business&apos;s WhatsApp number.
              </p>
              {resendLoading ? (
                <div className="py-8 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
                </div>
              ) : resendPreview ? (
                <>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
                    <p><strong>Order:</strong> {resendPreview.orderNumber}</p>
                    <p><strong>Customer:</strong> {resendPreview.customerName}</p>
                    <p><strong>Phone:</strong> {resendPreview.customerPhone}</p>
                    <p><strong>Address:</strong> {resendPreview.deliveryAddress || 'N/A'}</p>
                    <p><strong>Items:</strong> {resendPreview.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}</p>
                    <p><strong>Total:</strong> {resendPreview.currencySymbol}{resendPreview.total?.toFixed(2)}</p>
                  </div>
                  {resendDebug && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                      <h4 className="font-semibold text-amber-900 mb-2">Debug: Twilio payload (ContentSid + ContentVariables)</h4>
                      <p className="mb-1"><strong>ContentSid:</strong> <code className="bg-white px-1 rounded">{resendDebug.contentSid}</code></p>
                      <p className="mb-1"><strong>From:</strong> <code className="bg-white px-1 rounded">{resendDebug.from}</code></p>
                      <p className="mb-2"><strong>To:</strong> <code className="bg-white px-1 rounded">{resendDebug.to}</code></p>
                      <p className="mb-1 font-medium">ContentVariables:</p>
                      <pre className="bg-white p-2 rounded border border-amber-200 text-xs overflow-x-auto max-h-48 overflow-y-auto">{JSON.stringify(resendDebug.contentVariables, null, 2)}</pre>
                    </div>
                  )}
                </>
              ) : null}
              <div className="flex gap-3 justify-end">
                <button onClick={closeResendModal} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleResendTwilio}
                  disabled={resendSending || resendLoading}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {resendSending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Yes, Resend</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
