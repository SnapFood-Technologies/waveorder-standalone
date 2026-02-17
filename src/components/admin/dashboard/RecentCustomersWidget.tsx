// src/components/admin/dashboard/RecentCustomersWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Phone, Mail } from 'lucide-react'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'

interface RecentCustomersWidgetProps {
  businessId: string
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  tier: 'REGULAR' | 'VIP' | 'WHOLESALE'
  totalOrders: number
  lastOrderDate: string | null
  lastOrderTotal: number
  lastOrderStatus: string | null
  createdAt: string
}

export function RecentCustomersWidget({ businessId }: RecentCustomersWidgetProps) {
  const { addParams } = useImpersonation(businessId)
  
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [businessType, setBusinessType] = useState<string>('RESTAURANT')

  useEffect(() => {
    const fetchBusinessType = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setBusinessType(data.business.businessType || 'RESTAURANT')
        }
      } catch (error) {
        console.error('Error fetching business type:', error)
      }
    }
    fetchBusinessType()
  }, [businessId])

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
  
  const isSalon = businessType === 'SALON'

  const formatDate = (dateString: string | null) => {
    if (!dateString) return isSalon ? 'No appointments' : 'No orders'
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const getTierBadge = (tier: string) => {
    const styles = {
      REGULAR: 'bg-gray-100 text-gray-700',
      VIP: 'bg-purple-100 text-purple-700',
      WHOLESALE: 'bg-blue-100 text-blue-700'
    }
    return styles[tier as keyof typeof styles] || styles.REGULAR
  }

  const handleCustomerClick = (customerId: string) => {
    window.location.href = addParams(`/admin/stores/${businessId}/customers/${customerId}`)
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
      <div className="flex sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h3 className="text-lg font-semibold text-gray-900">Recent Customers</h3>
        <div className="flex space-y-2 sm:space-y-0 sm:space-x-2">
          {customers.length > 0 && (
            <div className="flex items-center space-x-2">
              <Link
                href={addParams(`/admin/stores/${businessId}/customers/create`)}
                className="inline-flex cursor-pointer items-center px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add
              </Link>
              <Link
                href={addParams(`/admin/stores/${businessId}/customers`)}
                className="inline-flex cursor-pointer items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                View All
              </Link>
            </div>
          )}
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No customers yet</h4>
          <p className="text-gray-600 mb-6">
            When customers place orders, they'll appear here. You can also add customers manually to build your customer base.
          </p>
          <Link
            href={addParams(`/admin/stores/${businessId}/customers/create`)}
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
                <th className="text-center py-2 px-3 text-sm font-medium text-gray-500">{isSalon ? 'Appointments' : 'Orders'}</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-gray-500">Type</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">{isSalon ? 'Last Appointment' : 'Last Order'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((customer) => (
                <tr 
                  key={customer.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleCustomerClick(customer.id)}
                >
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierBadge(customer.tier)}`}>
                      {customer.tier}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-sm text-gray-600">
                      {formatDate(customer.lastOrderDate)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}