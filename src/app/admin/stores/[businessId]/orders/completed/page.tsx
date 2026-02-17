// src/app/admin/stores/[businessId]/orders/completed/page.tsx
'use client'

import React, { useState, useEffect, use } from 'react'
import { Search, ShoppingBag, Phone, Clock, MapPin, ChevronLeft, ChevronRight, Eye, Star, User, ArrowLeft, CheckCircle, Package } from 'lucide-react'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'

interface CompletedOrdersPageProps {
  params: Promise<{ businessId: string }>
}

interface Order {
  id: string
  orderNumber: string
  status: string
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
  }
  itemCount: number
  deliveryAddress: string | null
  notes: string | null
  paymentStatus: string
  paymentMethod: string | null
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function CompletedOrdersPage({ params }: CompletedOrdersPageProps) {
  const { businessId } = use(params)
  const { addParams } = useImpersonation(businessId)

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [currency, setCurrency] = useState('USD')
  const [timeFormat, setTimeFormat] = useState('24')
  const [businessType, setBusinessType] = useState('RESTAURANT')
  const [mobileStackedOrders, setMobileStackedOrders] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch completed orders (DELIVERED + PICKED_UP)
  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: debouncedSearchQuery,
        status: 'DELIVERED,PICKED_UP'
      })

      const response = await fetch(`/api/admin/stores/${businessId}/orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        setPagination(data.pagination)
        setCurrency(data.currency || 'USD')
        setTimeFormat(data.timeFormat || '24')
        setBusinessType(data.businessType || 'RESTAURANT')
        setMobileStackedOrders(data.mobileStackedOrdersEnabled || false)
      }
    } catch (error) {
      console.error('Error fetching completed orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [businessId, currentPage, debouncedSearchQuery])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const use12Hour = timeFormat === '12'
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: use12Hour
    })
  }

  const getStatusColor = (status: string) => {
    const styles: Record<string, string> = {
      DELIVERED: 'text-emerald-600 bg-emerald-100',
      PICKED_UP: 'text-emerald-600 bg-emerald-100'
    }
    return styles[status] || 'text-gray-600 bg-gray-100'
  }

  const formatStatusLabel = (status: string): string => {
    return status.replace('_', ' ')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DELIVERY': return <MapPin className="w-3 h-3" />
      case 'PICKUP': return <Package className="w-3 h-3" />
      default: return <ShoppingBag className="w-3 h-3" />
    }
  }

  const parseStreetFromAddress = (addr: string): string => {
    try {
      const parsed = JSON.parse(addr)
      return parsed.street || addr
    } catch {
      return addr
    }
  }

  const truncateAddress = (addr: string, maxLen = 40): string => {
    return addr.length > maxLen ? addr.substring(0, maxLen) + '...' : addr
  }

  // Calculate summary stats from current page orders
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/orders`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              Completed Orders
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {pagination.total} completed order{pagination.total !== 1 ? 's' : ''}
              {pagination.total > 0 && (
                <span className="ml-2 text-emerald-600 font-medium">
                  • Page total: {formatCurrency(totalRevenue)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number, customer name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Orders */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No completed orders</h3>
            <p className="text-gray-500 mt-1">Completed orders will appear here</p>
          </div>
        ) : (
          <>
            {/* Mobile stacked cards */}
            {mobileStackedOrders && (
              <div className="md:hidden divide-y divide-gray-200">
                {orders.map((order) => (
                  <Link
                    key={order.id}
                    href={addParams(`/admin/stores/${businessId}/orders/${order.id}`)}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">#{order.orderNumber}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</span>
                    </div>
                    <div className="flex items-center flex-wrap gap-1 mb-1.5">
                      <span className="text-sm font-medium text-gray-800">{order.customer.name}</span>
                      {order.customer.isFirstOrder && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">
                          <Star className="w-2.5 h-2.5 mr-0.5" /> New
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                      {order.customer.phone}
                    </div>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusColor(order.status)}`}>
                        {formatStatusLabel(order.status)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        order.type === 'DELIVERY' ? 'bg-blue-50 text-blue-700' :
                        order.type === 'PICKUP' ? 'bg-green-50 text-green-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        {getTypeIcon(order.type)}
                        <span className="ml-1">{order.type}</span>
                      </span>
                      <span className="text-[11px] text-gray-400 ml-auto flex items-center">
                        <Clock className="w-3 h-3 mr-0.5" />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Desktop table */}
            <div className={`overflow-x-auto ${mobileStackedOrders ? 'hidden md:block' : ''}`}>
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">#{order.orderNumber}</div>
                            <div className="text-xs text-gray-500">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-900">{order.customer.name}</span>
                            {order.customer.isFirstOrder && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700">
                                <Star className="w-2.5 h-2.5 mr-0.5" /> New
                              </span>
                            )}
                            {order.createdByAdmin && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                                <User className="w-2.5 h-2.5 mr-0.5" /> Admin
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <Phone className="w-3 h-3 mr-1" />
                            {order.customer.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          order.type === 'DELIVERY' ? 'bg-blue-100 text-blue-700' :
                          order.type === 'PICKUP' ? 'bg-green-100 text-green-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {getTypeIcon(order.type)}
                          <span className="ml-1">{order.type}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {formatStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</div>
                        {order.deliveryFee > 0 && (
                          <div className="text-xs text-gray-500">+{formatCurrency(order.deliveryFee)} delivery</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{formatDate(order.createdAt)}</div>
                        {order.paymentMethod && (
                          <div className="text-xs text-gray-500">{order.paymentMethod}</div>
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
