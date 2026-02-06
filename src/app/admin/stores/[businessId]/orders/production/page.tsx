'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ChefHat,
  Package,
  ShoppingBag,
  Clock,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Filter,
  Calendar,
  Users,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info
} from 'lucide-react'
import { useImpersonation } from '@/lib/impersonation'

interface ProductionOrder {
  orderId: string
  orderNumber: string
  quantity: number
  customerName: string
  deliveryTime: string | null
  createdAt: string
  status: string
}

interface ProductionItem {
  productId: string
  productName: string
  productImage: string | null
  categoryName: string
  totalQuantity: number
  orderCount: number
  orders: ProductionOrder[]
}

interface ProductionData {
  productionItems: ProductionItem[]
  summary: {
    totalProducts: number
    totalItems: number
    totalOrders: number
    ordersByStatus: {
      pending: number
      confirmed: number
      preparing: number
      ready: number
    }
  }
  categories: Array<{ id: string; name: string }>
  period: string
  timezone: string
  currency: string
}

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'week', label: 'This Week' },
  { id: 'all_pending', label: 'All Pending' }
]

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
  CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Confirmed' },
  PREPARING: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Preparing' },
  READY: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ready' }
}

export default function ProductionQueuePage({ 
  params 
}: { 
  params: Promise<{ businessId: string }> 
}) {
  const { businessId } = use(params)
  const { addParams } = useImpersonation(businessId)
  
  const [data, setData] = useState<ProductionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [showInfo, setShowInfo] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({ period: selectedPeriod })
      if (selectedCategory) params.set('category', selectedCategory)
      
      const response = await fetch(
        `/api/admin/stores/${businessId}/orders/production?${params}`
      )
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Production planning is not enabled for this business')
        } else {
          throw new Error('Failed to fetch production data')
        }
        return
      }
      
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [businessId, selectedPeriod, selectedCategory])

  const toggleExpanded = (productId: string) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedProducts(newExpanded)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/orders`)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Production Queue</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/orders`)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <ChefHat className="w-7 h-7 text-orange-600" />
              Production Queue
            </h1>
            <p className="text-gray-600 mt-1">
              Products to prepare from pending orders
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Period Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {PERIODS.map(period => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  selectedPeriod === period.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          {data.categories.length > 0 && (
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
            >
              <option value="">All Categories</option>
              {data.categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          )}
          
          <button
            onClick={fetchData}
            className="p-2 text-gray-600 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-lg transition-colors ${
              showInfo ? 'text-teal-600 bg-teal-50' : 'text-gray-600 hover:text-teal-600 hover:bg-gray-100'
            }`}
            title="How it works"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info Banner */}
      {showInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">How Production Queue Works</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Shows products that need to be prepared from <strong>pending orders</strong> (Pending, Confirmed, Preparing, Ready)</li>
                <li>• Quantities are grouped by product so you know exactly how much to make</li>
                <li>• Click on a product to see individual order details</li>
                <li>• When you mark an order as <strong>Delivered</strong> or <strong>Picked Up</strong>, it automatically disappears from this list</li>
                <li>• Use time filters to plan production for today, tomorrow, or the week ahead</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-gray-500">Products</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.summary.totalProducts}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <ChefHat className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-gray-500">Total Items</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.summary.totalItems}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-4 h-4 text-teal-600" />
            <span className="text-sm text-gray-500">Orders</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.summary.totalOrders}</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.summary.ordersByStatus.pending}</p>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Orders by Status</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(data.summary.ordersByStatus).map(([status, count]) => {
            const statusInfo = STATUS_COLORS[status.toUpperCase()] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status }
            return (
              <div 
                key={status}
                className={`px-3 py-2 rounded-lg ${statusInfo.bg}`}
              >
                <span className={`text-sm font-medium ${statusInfo.text}`}>
                  {statusInfo.label}: {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Production Items */}
      {data.productionItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
          <p className="text-gray-600">
            No products to prepare for {selectedPeriod === 'all_pending' ? 'pending orders' : `the selected period (${PERIODS.find(p => p.id === selectedPeriod)?.label})`}.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">Products to Prepare</h3>
            <p className="text-sm text-gray-500">Click on a product to see order details</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {data.productionItems.map((item) => {
              const isExpanded = expandedProducts.has(item.productId)
              
              return (
                <div key={item.productId} className="hover:bg-gray-50">
                  {/* Product Row */}
                  <button
                    onClick={() => toggleExpanded(item.productId)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4">
                      {item.productImage ? (
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">{item.categoryName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">{item.totalQuantity}</p>
                        <p className="text-xs text-gray-500">
                          from {item.orderCount} order{item.orderCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  {/* Expanded Order Details */}
                  {isExpanded && (
                    <div className="px-6 pb-4 bg-gray-50">
                      <div className="ml-16 space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Order Details
                        </p>
                        {item.orders.map((order) => {
                          const statusInfo = STATUS_COLORS[order.status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: order.status }
                          return (
                            <div 
                              key={`${item.productId}-${order.orderId}`}
                              className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200"
                            >
                              <div className="flex items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{order.orderNumber}</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {order.customerName}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {order.deliveryTime 
                                        ? formatDate(order.deliveryTime)
                                        : formatDate(order.createdAt)
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <span className="text-lg font-bold text-gray-900">
                                  ×{order.quantity}
                                </span>
                                <Link
                                  href={addParams(`/admin/stores/${businessId}/orders?orderId=${order.orderId}`)}
                                  className="p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                                  title="View Order"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Print-friendly Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 print:shadow-none">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Summary (Print-friendly)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.productionItems.map((item) => (
            <div 
              key={`summary-${item.productId}`}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <p className="font-medium text-gray-900 truncate">{item.productName}</p>
              <p className="text-2xl font-bold text-orange-600">{item.totalQuantity}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
