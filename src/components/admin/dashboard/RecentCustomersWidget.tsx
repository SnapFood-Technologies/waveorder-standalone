// src/components/admin/dashboard/RecentCustomersWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Phone, Mail } from 'lucide-react'
import Link from 'next/link'

interface RecentCustomersWidgetProps {
  businessId: string
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  totalOrders: number
  lastOrderDate: string | null
  lastOrderTotal: number
  lastOrderStatus: string | null
  createdAt: string
}

export function RecentCustomersWidget({ businessId }: RecentCustomersWidgetProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentCustomers = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/customers/recent`)
        if (response.ok) {
          const data = await response.json()
          setCustomers(data.customers || [])
        }
      } catch (error) {
        console.error('Error fetching recent customers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentCustomers()
  }, [businessId])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No orders'
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const getCustomerTypeInfo = (totalOrders: number) => {
    if (totalOrders === 1) return { label: 'New', color: 'text-blue-600 bg-blue-100' }
    if (totalOrders < 5) return { label: 'Regular', color: 'text-green-600 bg-green-100' }
    return { label: 'VIP', color: 'text-purple-600 bg-purple-100' }
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
        <h3 className="text-lg font-semibold text-gray-900">Recent Customers</h3>
        <span className="text-sm text-gray-500">Active in last 30 days</span>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h4>
          <p className="text-gray-600 mb-6">
            When customers place orders, they'll appear here. You can also add customers manually to build your customer base.
          </p>
          <Link
            href={`/admin/stores/${businessId}/customers/create`}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Customer</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Contact</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-gray-500">Orders</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-gray-500">Type</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((customer) => {
                const customerType = getCustomerTypeInfo(customer.totalOrders)
                
                return (
                  <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center space-x-1 mb-1">
                          <Phone className="w-3 h-3" />
                          <span className="truncate">{customer.phone}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate text-xs">{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-sm font-medium text-gray-900">
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${customerType.color}`}>
                        {customerType.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-sm text-gray-600">
                        {formatDate(customer.lastOrderDate)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          
          <div className="pt-4 border-t border-gray-200 space-y-2">
            <Link
              href={`/admin/stores/${businessId}/customers`}
              className="block text-center py-2 text-teal-600 hover:text-teal-700 font-medium"
            >
              View All Customers
            </Link>
            <Link
              href={`/admin/stores/${businessId}/customers/create`}
              className="block text-center py-2 px-4 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium"
            >
              Add Customer
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}