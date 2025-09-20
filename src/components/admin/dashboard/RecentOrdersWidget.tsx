// src/components/admin/dashboard/RecentOrdersWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, Plus } from 'lucide-react'
import Link from 'next/link'

interface RecentOrdersWidgetProps {
  businessId: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  total: number
  status: string
  createdAt: string
}

export function RecentOrdersWidget({ businessId }: RecentOrdersWidgetProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/orders/recent`)
        if (response.ok) {
          const data = await response.json()
          setOrders(data.orders || [])
        }
      } catch (error) {
        console.error('Error fetching recent orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentOrders()
  }, [businessId])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'confirmed': return 'text-blue-600 bg-blue-100'
      case 'preparing': return 'text-orange-600 bg-orange-100'
      case 'ready': return 'text-green-600 bg-green-100'
      case 'out_for_delivery': return 'text-cyan-600 bg-cyan-100'
      case 'delivered': return 'text-emerald-600 bg-emerald-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      case 'refunded': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const formatStatus = (status: string) => {
    return status.toLowerCase().replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        <span className="text-sm text-gray-500">Latest 10 orders</span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h4>
          <p className="text-gray-600 mb-6">
            When customers place orders, they'll appear here. You can also create orders manually for walk-in customers.
          </p>
          <Link
            href={`/admin/stores/${businessId}/orders/create`}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Order
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Order</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Customer</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Total</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-sm text-gray-900 truncate">{order.customerName}</p>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <p className="font-medium text-gray-900">${order.total.toFixed(2)}</p>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-sm text-gray-600">
                      {formatDate(order.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <Link
              href={`/admin/stores/${businessId}/orders`}
              className="block text-center py-2 text-teal-600 hover:text-teal-700 font-medium"
            >
              View All Orders
            </Link>
            <Link
              href={`/admin/stores/${businessId}/orders/create`}
              className="block text-center py-2 px-4 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium"
            >
              Create Order
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}