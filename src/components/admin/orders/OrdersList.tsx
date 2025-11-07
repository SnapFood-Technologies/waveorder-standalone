// src/components/admin/orders/OrdersList.tsx
import React, { useState, useEffect } from 'react'
import { Search, Plus, ShoppingBag, Phone, Clock, MapPin, ChevronLeft, ChevronRight, Eye, Filter, X, Star, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useImpersonation } from '@/lib/impersonation'

interface OrdersListProps {
  businessId: string
  customerId?: string // Optional filter for specific customer
}

interface Order {
  id: string
  orderNumber: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  type: 'DELIVERY' | 'PICKUP' | 'DINE_IN'
  total: number
  subtotal: number
  deliveryFee: number
  createdByAdmin: boolean
  customer: {
    id: string
    name: string
    phone: string
    email: string | null
    isFirstOrder?: boolean
    orderCount?: number
  }
  itemCount: number
  items: {
    id: string
    quantity: number
    productName: string
    variantName?: string | null
  }[]
  deliveryAddress: string | null
  notes: string | null
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentMethod: string | null
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function OrdersList({ businessId, customerId }: OrdersListProps) {
  const { addParams } = useImpersonation(businessId)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get('search') || '')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [currency, setCurrency] = useState('USD')
  const [timeFormat, setTimeFormat] = useState('24')
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search query for user typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: debouncedSearchQuery
      })

      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterType !== 'all') params.append('type', filterType)
      if (customerId) params.append('customer', customerId)

      const response = await fetch(`/api/admin/stores/${businessId}/orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setPagination(data.pagination)
        setCurrency(data.currency || 'USD')
        setTimeFormat(data.timeFormat || '24')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [businessId, currentPage, debouncedSearchQuery, filterStatus, filterType, customerId])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    // Update URL params without navigation
    const currentParams = new URLSearchParams(window.location.search)
    if (value.trim()) {
      currentParams.set('search', value)
    } else {
      currentParams.delete('search')
    }
    
    const newUrl = `${window.location.pathname}${currentParams.toString() ? `?${currentParams.toString()}` : ''}`
    window.history.replaceState({}, '', newUrl)
  }

  const clearFilters = () => {
    setFilterStatus('all')
    setFilterType('all')
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setCurrentPage(1)
    
    // Clear URL params
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }

  const getStatusColor = (status: string) => {
    const styles = {
      PENDING: 'text-yellow-600 bg-yellow-100',
      CONFIRMED: 'text-blue-600 bg-blue-100',
      PREPARING: 'text-orange-600 bg-orange-100',
      READY: 'text-green-600 bg-green-100',
      OUT_FOR_DELIVERY: 'text-cyan-600 bg-cyan-100',
      DELIVERED: 'text-emerald-600 bg-emerald-100',
      CANCELLED: 'text-red-600 bg-red-100',
      REFUNDED: 'text-gray-600 bg-gray-100'
    }
    return styles[status as keyof typeof styles] || styles.PENDING
  }

  const getPaymentStatusColor = (status: string) => {
    const styles = {
      PAID: 'text-green-600 bg-green-100',
      PENDING: 'text-yellow-600 bg-yellow-100',
      FAILED: 'text-red-600 bg-red-100',
      REFUNDED: 'text-gray-600 bg-gray-100'
    }
    return styles[status as keyof typeof styles] || styles.PENDING
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DELIVERY':
        return <MapPin className="w-4 h-4" />
      case 'PICKUP':
        return <ShoppingBag className="w-4 h-4" />
      case 'DINE_IN':
        return <Clock className="w-4 h-4" />
      default:
        return <ShoppingBag className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L',
    }
    
    const symbol = currencySymbols[currency] || currency
    return `${symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const use24Hour = timeFormat === '24'
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour
    })
  }

  const truncateAddress = (address: string | null, maxLength: number = 50) => {
    if (!address) return null
    return address.length > maxLength ? `${address.substring(0, maxLength)}...` : address
  }

  const parseStreetFromAddress = (address: string | null) => {
    if (!address) return null
    
    try {
      const parsedAddress = JSON.parse(address)
      if (parsedAddress && typeof parsedAddress === 'object') {
        return parsedAddress.street || parsedAddress.address || address
      }
    } catch {
      // Not JSON, continue with string parsing
    }
    
    const parts = address.split(/[,\n\r]/)
    const streetPart = parts[0].trim()
    
    const cleanStreet = streetPart
      .replace(/^(deliver to:?|address:?|ship to:?)\s*/i, '')
      .replace(/\s+(apt|apartment|unit|suite|floor|fl|#)\s*\w+.*$/i, '')
      .trim()
    
    return cleanStreet || streetPart
  }

  const activeFiltersCount = [
    filterStatus !== 'all',
    filterType !== 'all',
    debouncedSearchQuery.trim()
  ].filter(Boolean).length

  if (loading && orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">
            {customerId 
              ? 'Customer order history'
              : 'Manage customer orders and track fulfillment'
            }
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Link
            href={addParams(`/admin/stores/${businessId}/orders/create`)}
            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, customer name, or phone..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 border rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-teal-50 border-teal-200 text-teal-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
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

            <div className="text-sm text-gray-600">
              {pagination.total} orders
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">All Types</option>
                  <option value="DELIVERY">Delivery</option>
                  <option value="PICKUP">Pickup</option>
                  <option value="DINE_IN">Dine In</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {debouncedSearchQuery || activeFiltersCount > 0 ? 'No orders found' : 'No orders yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {debouncedSearchQuery || activeFiltersCount > 0
                ? 'Try adjusting your search terms or filters to find the orders you\'re looking for.'
                : 'Start taking orders from customers. You can manually create orders or customers can place them through your storefront.'
              }
            </p>
            {!debouncedSearchQuery && activeFiltersCount === 0 && (
              <Link
                href={addParams(`/admin/stores/${businessId}/orders/create`)}
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Order
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type & Address
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-5 h-5 text-teal-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              #{order.orderNumber}
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-xs text-gray-500">
                                {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                              </div>
                              {order.notes && (
                                <>
                                  <span className="text-xs text-gray-300">•</span>
                                  <div className="text-xs text-gray-500 truncate max-w-32" title={order.notes}>
                                    {order.notes}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-medium text-gray-900">
                              {order.customer.name}
                            </div>
                            {order.customer.isFirstOrder && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                <Star className="w-3 h-3 mr-1" />
                                First Order
                              </span>
                            )}
                            {order.createdByAdmin && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                <User className="w-3 h-3 mr-1" />
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Phone className="w-3 h-3 mr-1" />
                            {order.customer.phone}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-2">
                          <div className="flex items-center justify-center">
                            <div className={`flex items-center px-2 py-1 rounded text-xs font-medium ${
                              order.type === 'DELIVERY' ? 'bg-blue-100 text-blue-700' :
                              order.type === 'PICKUP' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {getTypeIcon(order.type)}
                              <span className="ml-1">{order.type}</span>
                            </div>
                          </div>
                          {order.type === 'DELIVERY' && order.deliveryAddress && (
                            <div className="flex items-center justify-center">
                              <div className="text-xs text-gray-600 flex items-center max-w-56">
                                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate" title={order.deliveryAddress}>
                                  {truncateAddress(parseStreetFromAddress(order.deliveryAddress))}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.total)}
                        </div>
                        {order.deliveryFee > 0 && (
                          <div className="text-xs text-gray-500">
                            +{formatCurrency(order.deliveryFee)} delivery
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(order.createdAt)}
                        </div>
                        {order.paymentMethod && (
                          <div className="text-xs text-gray-500">
                            {order.paymentMethod}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={addParams(`/admin/stores/${businessId}/orders/${order.id}`)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} orders
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={pagination.page === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="px-3 py-1 text-sm">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                      disabled={pagination.page === pagination.pages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}