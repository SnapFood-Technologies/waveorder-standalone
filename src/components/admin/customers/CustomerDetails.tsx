'use client'

import React, { useState, useEffect } from 'react'
import { ArrowLeft, Users, Phone, Mail, MapPin, Tag, FileText, Edit, ShoppingBag, Calendar, Wallet, Trash2, AlertCircle, CheckCircle, X } from 'lucide-react'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'

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
  type: string
  total: number
  subtotal: number
  deliveryFee: number
  createdAt: string
  itemCount: number
  items: {
    id: string
    quantity: number
    productName: string
    variantName?: string
  }[]
}

interface CustomerStats {
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  firstOrderDate: string | null
  lastOrderDate: string | null
}

interface FavoriteProduct {
  productId: string
  productName: string
  productImage: string | null
  timesOrdered: number
  totalQuantity: number
}

interface Business {
  currency: string
  name: string
  businessType?: string
}

export default function CustomerDetails({ businessId, customerId }: CustomerDetailsProps) {
  const { addParams } = useImpersonation(businessId)
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<CustomerStats>({
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    firstOrderDate: null,
    lastOrderDate: null
  })
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [business, setBusiness] = useState<Business>({ currency: 'USD', name: '', businessType: 'RESTAURANT' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'details' | 'orders'>('details')
  const isSalon = business.businessType === 'SALON'
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch business data for currency
        const businessResponse = await fetch(`/api/admin/stores/${businessId}`)
        if (businessResponse.ok) {
          const businessData = await businessResponse.json()
          setBusiness({
            currency: businessData.business.currency || 'USD',
            name: businessData.business.name || ''
          })
        }

        // Fetch customer details
        const customerResponse = await fetch(`/api/admin/stores/${businessId}/customers/${customerId}`)
        if (customerResponse.ok) {
          const customerData = await customerResponse.json()
          setCustomer(customerData.customer)
          
          // Calculate stats from customer data
          const totalOrders = customerData.customer.totalOrders || 0
          setStats({
            totalOrders,
            totalSpent: 0, // Will be calculated from orders
            averageOrderValue: 0,
            firstOrderDate: null,
            lastOrderDate: null
          })
        } else if (customerResponse.status === 404) {
          setError('Customer not found')
        } else {
          setError('Failed to load customer data')
        }

        // Fetch customer orders
        const ordersResponse = await fetch(`/api/admin/stores/${businessId}/customers/${customerId}/orders`)
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          const fetchedOrders = ordersData.orders || []
          setOrders(fetchedOrders)
          
          // Calculate real stats from orders
          const completedOrders = fetchedOrders.filter((order: Order) => 
            order.status === 'DELIVERED' || order.status === 'READY'
          )
          const totalSpent = completedOrders.reduce((sum: number, order: Order) => sum + order.total, 0)
          const avgOrderValue = completedOrders.length > 0 ? totalSpent / completedOrders.length : 0
          
          // Get first and last order dates
          const orderDates = fetchedOrders.map((o: Order) => new Date(o.createdAt).getTime())
          const firstOrder = orderDates.length > 0 ? new Date(Math.min(...orderDates)).toISOString() : null
          const lastOrder = orderDates.length > 0 ? new Date(Math.max(...orderDates)).toISOString() : null
          
          setStats(prev => ({
            ...prev,
            totalSpent,
            averageOrderValue: avgOrderValue,
            firstOrderDate: firstOrder,
            lastOrderDate: lastOrder
          }))
        }

        // Fetch customer favorites
        const favoritesResponse = await fetch(`/api/admin/stores/${businessId}/customers/${customerId}/favorites`)
        if (favoritesResponse.ok) {
          const favoritesData = await favoritesResponse.json()
          setFavorites(favoritesData.favorites?.slice(0, 5) || [])
        }
      } catch (error) {
        console.error('Error fetching customer data:', error)
        setError('Network error loading customer data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [businessId, customerId])

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L',
      BHD: 'BD',
      BBD: 'Bds$',
      GEL: '₾',
    }
    
    const symbol = currencySymbols[business.currency] || business.currency
    return `${symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

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

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleEdit = () => {
    window.location.href = addParams(`/admin/stores/${businessId}/customers/${customerId}/edit`)
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admin/stores/${businessId}/customers/${customerId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDeleteSuccess(true)
        setIsDeleting(false)
        
        setTimeout(() => {
          window.location.href = addParams(`/admin/stores/${businessId}/customers`)
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to delete customer')
        setIsDeleting(false)
      }
    } catch (error) {
      setError('Network error deleting customer')
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
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

  if (error) {
    return (
      <div className="max-w-8xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Customer</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Link
            href={addParams(`/admin/stores/${businessId}/customers`)}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Link>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="max-w-8xl mx-auto">
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
          <p className="text-gray-600 mb-6">
            The customer you're looking for doesn't exist or you don't have access to view it.
          </p>
          <Link
            href={addParams(`/admin/stores/${businessId}/customers`)}
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
    <div className="max-w-8xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/customers`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{customer.name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierBadge(customer.tier)}`}>
                {customer.tier}
              </span>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {isSalon ? 'Customer details and appointment history' : 'Customer details and order history'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            <Edit className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Edit Customer</span>
            <span className="sm:hidden">Edit</span>
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </button>
          <Link
            href={addParams(isSalon 
              ? `/admin/stores/${businessId}/appointments/create?customerId=${customerId}`
              : `/admin/stores/${businessId}/orders/create?customerId=${customerId}`
            )}
            className="inline-flex items-center px-3 sm:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm sm:text-base"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{isSalon ? 'Create Appointment' : 'Create Order'}</span>
            <span className="sm:hidden">{isSalon ? 'Appt' : 'Order'}</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Total Spent</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(stats.totalSpent)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">{isSalon ? 'Avg Appointment' : 'Avg Order'}</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.averageOrderValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Calendar className="w-5 h-5 text-teal-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">First Order</p>
              <p className="text-sm font-bold text-gray-900">
                {stats.firstOrderDate 
                  ? formatDateShort(stats.firstOrderDate)
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">{isSalon ? 'Last Appointment' : 'Last Order'}</p>
              <p className="text-sm font-bold text-gray-900">
                {stats.lastOrderDate 
                  ? formatDateShort(stats.lastOrderDate)
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Favorite Products */}
      {favorites.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Favorite Products</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {favorites.map((product, index) => (
              <div key={product.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg font-bold text-gray-300">#{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.productName}</p>
                  <p className="text-xs text-gray-500">
                    {product.timesOrdered} orders • {product.totalQuantity} items
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Customer Details
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {isSalon ? 'Appointment History' : 'Order History'} ({orders.length})
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
                      <span className="text-sm text-gray-900 font-medium">{customer.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Phone</span>
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <a href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="hover:text-teal-600 transition-colors">
                          {customer.phone}
                        </a>
                      </div>
                    </div>
                    
                    {customer.email && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-500">Email</span>
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <a href={`mailto:${customer.email}`}
                             className="hover:text-teal-600 transition-colors">
                            {customer.email}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Customer Type</span>
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
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-500">Member since</span>
                      <span className="text-sm text-gray-900">
                        {formatDateShort(customer.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <span className="text-sm font-medium text-gray-500">Last updated</span>
                      <span className="text-sm text-gray-900">
                        {formatDateShort(customer.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                {customer.addressJson && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-teal-600" />
                      Delivery Address
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

              {/* Tags, Notes, and Quick Actions */}
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
                      Internal Notes
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
                      href={addParams(isSalon 
                        ? `/admin/stores/${businessId}/appointments/create?customerId=${customerId}`
                        : `/admin/stores/${businessId}/orders/create?customerId=${customerId}`
                      )}
                      className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ShoppingBag className="w-5 h-5 mr-3 text-teal-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {isSalon ? 'Create New Appointment' : 'Create New Order'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {isSalon ? 'Create an appointment for this customer' : 'Place an order for this customer'}
                        </div>
                      </div>
                    </Link>
                    
                    <a
                      href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Phone className="w-5 h-5 mr-3 text-green-600" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Send WhatsApp Message</div>
                        <div className="text-xs text-gray-600">Contact customer directly</div>
                      </div>
                    </a>
                    
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-5 h-5 mr-3 text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">Edit Customer Information</div>
                        <div className="text-xs text-gray-600">Update customer information</div>
                      </div>
                    </button>
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
                    href={addParams(`/admin/stores/${businessId}/orders/create?customerId=${customerId}`)}
                    className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Create First Order
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              #{order.orderNumber}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {formatDate(order.createdAt)} • {order.type} • {order.itemCount} items
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
                      
                      {/* Order Items Preview */}
                      <div className="space-y-2 mb-4">
                        <h5 className="text-sm font-medium text-gray-700">Items:</h5>
                        {order.items.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">
                              {item.quantity}x {item.productName}
                              {item.variantName && ` (${item.variantName})`}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>

                      {/* Order Summary */}
                      <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.deliveryFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery:</span>
                            <span className="text-gray-900">{formatCurrency(order.deliveryFee)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium pt-1 border-t border-gray-200">
                          <span className="text-gray-900">Total:</span>
                          <span className="text-gray-900">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Link
                          href={addParams(isSalon 
                            ? `/admin/stores/${businessId}/appointments/${order.id}`
                            : `/admin/stores/${businessId}/orders/${order.id}`
                          )}
                          className="text-teal-600 hover:text-teal-700 text-sm font-medium inline-flex items-center"
                        >
                          {isSalon ? 'View Appointment Details' : 'View Order Details'}
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  {orders.length > 10 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600">
                        Showing recent {Math.min(orders.length, 10)} {isSalon ? 'appointments' : 'orders'}
                      </p>
                      <Link
                        href={addParams(isSalon 
                          ? `/admin/stores/${businessId}/appointments?customer=${customerId}`
                          : `/admin/stores/${businessId}/orders?customer=${customerId}`
                        )}
                        className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                      >
                        {isSalon ? 'View All Appointments' : 'View All Orders'} →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            {!deleteSuccess ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    Delete Customer
                  </h3>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    disabled={isDeleting}
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to permanently delete <strong>{customer.name}</strong>?
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div className="ml-3">
                        <p className="text-red-800 text-sm">
                          <strong>This action cannot be undone.</strong> All customer data will be permanently removed.
                        </p>
                      </div>
                    </div>
                  </div>
                  {stats.totalOrders > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex">
                        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        <div className="ml-3">
                          <p className="text-yellow-800 text-sm">
                            <strong>Warning:</strong> This customer has {stats.totalOrders} {isSalon ? 'appointments' : 'orders'}. Deletion may not be allowed if there are existing {isSalon ? 'appointments' : 'orders'}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {isDeleting ? 'Deleting...' : 'Delete Customer'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Deleted Successfully</h3>
                <p className="text-gray-600 mb-6">
                  <strong>{customer.name}</strong> has been permanently removed from your system.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-green-800 text-sm">
                    Redirecting you back to the customers list...
                  </p>
                </div>
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}