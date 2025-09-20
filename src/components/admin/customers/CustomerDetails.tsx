import React, { useState, useEffect } from 'react'
import { ArrowLeft, Users, Phone, Mail, MapPin, Tag, FileText, Edit, ShoppingBag, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface CustomerDetailsProps {
  businessId: string
  customerId: string
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  tier: 'REGULAR' | 'VIP' | 'WHOLESALE'
  addressJson: {
    street: string
    additional: string
    zipCode: string
    city: string
    country: string
    latitude?: number
    longitude?: number
  } | null
  tags: string[]
  notes: string | null
  addedByAdmin: boolean
  createdAt: string
  updatedAt: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: {
    id: string
    quantity: number
    price: number
    product: {
      name: string
    }
  }[]
}

interface CustomerStats {
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lastOrderDate: string | null
}

export default function CustomerDetails({ businessId, customerId }: CustomerDetailsProps) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<CustomerStats>({
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    lastOrderDate: null
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'orders'>('details')

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true)
        
        // Fetch customer details
        const customerResponse = await fetch(`/api/admin/stores/${businessId}/customers/${customerId}`)
        if (customerResponse.ok) {
          const customerData = await customerResponse.json()
          setCustomer(customerData.customer)
          setStats(customerData.stats)
        }

        // Fetch customer orders
        const ordersResponse = await fetch(`/api/admin/stores/${businessId}/customers/${customerId}/orders`)
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          setOrders(ordersData.orders || [])
        }
      } catch (error) {
        console.error('Error fetching customer data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerData()
  }, [businessId, customerId])

  const getTierBadge = (tier: string) => {
    const styles = {
      REGULAR: 'bg-gray-100 text-gray-700',
      VIP: 'bg-purple-100 text-purple-700',
      WHOLESALE: 'bg-blue-100 text-blue-700'
    }
    return styles[tier as keyof typeof styles] || styles.REGULAR
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
          <p className="text-gray-600 mb-6">
            The customer you're looking for doesn't exist or you don't have access to view it.
          </p>
          <Link
            href={`/admin/stores/${businessId}/customers`}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/admin/stores/${businessId}/customers`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">Customer details and order history</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            href={`/admin/stores/${businessId}/customers/${customerId}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Customer
          </Link>
          <Link
            href={`/admin/stores/${businessId}/orders/create?customerId=${customerId}`}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Create Order
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.averageOrderValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last Order</p>
              <p className="text-sm font-bold text-gray-900">
                {stats.lastOrderDate 
                  ? new Date(stats.lastOrderDate).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Customer Details
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Order History ({orders.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-teal-600" />
                    Basic Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Name</span>
                      <span className="text-sm text-gray-900">{customer.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Phone</span>
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {customer.phone}
                      </div>
                    </div>
                    
                    {customer.email && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Email</span>
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {customer.email}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Tier</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierBadge(customer.tier)}`}>
                        {customer.tier}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Added by</span>
                      <span className="text-sm text-gray-900">
                        {customer.addedByAdmin ? 'Admin' : 'Self-registered'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-gray-500">Member since</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(customer.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                {customer.addressJson && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-teal-600" />
                      Address
                    </h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div className="font-medium text-gray-900">
                          {customer.addressJson.street}
                        </div>
                        {customer.addressJson.additional && (
                          <div className="text-gray-700">
                            {customer.addressJson.additional}
                          </div>
                        )}
                        <div className="text-gray-700">
                          {customer.addressJson.city}, {customer.addressJson.zipCode}
                        </div>
                        <div className="text-gray-600">
                          {customer.addressJson.country}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags and Notes */}
              <div className="space-y-6">
                {/* Tags */}
                {customer.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Tag className="w-5 h-5 mr-2 text-teal-600" />
                      Tags
                    </h3>
                    
                    <div className="flex flex-wrap gap-2">
                      {customer.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {customer.notes && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-teal-600" />
                      Notes
                    </h3>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {customer.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  
                  <div className="space-y-3">
                    <Link
                      href={`/admin/stores/${businessId}/orders/create?customerId=${customerId}`}
                      className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ShoppingBag className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Create New Order</div>
                        <div className="text-xs text-gray-600">Place an order for this customer</div>
                      </div>
                    </Link>
                    
                    <Link
                      href={`/admin/stores/${businessId}/customers/${customerId}/edit`}
                      className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Edit Customer</div>
                        <div className="text-xs text-gray-600">Update customer information</div>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Orders Tab */
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-6">
                    This customer hasn't placed any orders yet.
                  </p>
                  <Link
                    href={`/admin/stores/${businessId}/orders/create?customerId=${customerId}`}
                    className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Create First Order
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Order {order.orderNumber}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(order.total)}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Order Items */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Items:</h5>
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">
                              {item.quantity}x {item.product.name}
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Link
                          href={`/admin/stores/${businessId}/orders/${order.id}`}
                          className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                        >
                          View Order Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}