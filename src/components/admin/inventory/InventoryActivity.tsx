// src/components/admin/inventory/InventoryActivity.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  RefreshCcw, 
  Minus, 
  Plus,
  Calendar,
  User,
  Filter,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface InventoryActivity {
  id: string
  type: string
  quantity: number
  oldStock: number
  newStock: number
  reason?: string
  changedBy?: string  // Add this field
  createdAt: string
  user?: {
    id: string
    name: string
  }
  product: {
    id: string
    name: string
    images?: string[]  // Change to images array
  }
  variant?: {
    id: string
    name: string
  }
}

interface InventoryActivityProps {
  businessId: string
  productId?: string // Optional filter by product
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export function InventoryActivity({ businessId, productId }: InventoryActivityProps) {
  const [activities, setActivities] = useState<InventoryActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'increase' | 'decrease'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchActivities()
  }, [businessId, productId, currentPage, debouncedSearchQuery])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      if (searchQuery !== debouncedSearchQuery) {
        setCurrentPage(1) // Reset page only when search actually changes
      }
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: debouncedSearchQuery
      })

      const url = productId 
        ? `/api/admin/stores/${businessId}/products/${productId}/inventory?${params}`
        : `/api/admin/stores/${businessId}/inventory/activities?${params}`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching inventory activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    // Don't reset page here - let the debounced effect handle it
  }

  const getActivityIcon = (type: string, quantity: number) => {
    switch (type) {
      case 'MANUAL_INCREASE':
      case 'RESTOCK':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'MANUAL_DECREASE':
      case 'ORDER_SALE':
      case 'LOSS':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      case 'ADJUSTMENT':
        return quantity > 0 
          ? <Plus className="w-4 h-4 text-green-600" />
          : <Minus className="w-4 h-4 text-red-600" />
      default:
        return <RefreshCcw className="w-4 h-4 text-gray-600" />
    }
  }

  const getActivityColor = (type: string, quantity: number) => {
    if (type.includes('INCREASE') || type === 'RESTOCK' || quantity > 0) {
      return 'text-green-600'
    }
    if (type.includes('DECREASE') || type === 'ORDER_SALE' || type === 'LOSS' || quantity < 0) {
      return 'text-red-600'
    }
    return 'text-gray-600'
  }

  const getActivityBadge = (type: string, quantity: number) => {
    if (type.includes('INCREASE') || type === 'RESTOCK' || quantity > 0) {
      return 'bg-green-100 text-green-700'
    }
    if (type.includes('DECREASE') || type === 'ORDER_SALE' || type === 'LOSS' || quantity < 0) {
      return 'bg-red-100 text-red-700'
    }
    return 'bg-gray-100 text-gray-700'
  }

  const getActivityLabel = (type: string) => {
    const labels = {
      'MANUAL_INCREASE': 'Manual Increase',
      'MANUAL_DECREASE': 'Manual Decrease',
      'ORDER_SALE': 'Order Sale',
      'RESTOCK': 'Restocked',
      'ADJUSTMENT': 'Adjustment',
      'LOSS': 'Loss/Damage',
      'RETURN': 'Return'
    }
    return labels[type as keyof typeof labels] || type
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const filteredActivities = activities.filter(activity => {
    if (filter === 'increase') return activity.quantity > 0
    if (filter === 'decrease') return activity.quantity < 0
    return true
  })

  if (loading && activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div>
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            title="Back to Inventory"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-teal-600" />
              Inventory Activities
            </h2>
            <p className="text-gray-600 mt-1">
              Track all inventory movements and changes
            </p>
          </div>
        </div>
      </div>

      {productId && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">
            Viewing activities for specific product
          </h3>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          Showing inventory activities for this product only
        </p>
      </div>
    )}


      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by product name or reason..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Activity Type Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="all">All Activities</option>
                <option value="increase">Stock Increases</option>
                <option value="decrease">Stock Decreases</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              {pagination.total} activities
            </div>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-50 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {debouncedSearchQuery ? 'No activities found' : 'No inventory activities yet'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {debouncedSearchQuery 
                ? 'Try adjusting your search terms or filters to find inventory activities.'
                : 'Inventory activities will appear here when stock levels change through adjustments, sales, or restocks. Start managing your inventory to see activity logs.'}
            </p>
            {!debouncedSearchQuery && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                  href={`/admin/stores/${businessId}/inventory/adjustments`}
                  className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Make Stock Adjustment
                </a>
                <a 
                  href={`/admin/stores/${businessId}/products`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Package className="w-4 h-4 mr-2" />
                  View Products
                </a>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredActivities.map((activity) => {
                    const formatted = formatDate(activity.createdAt)
                    
                    return (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              {activity.product.images?.[0] ? (
                                <img
                                  src={activity.product.images[0]}
                                  alt={activity.product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {activity.product.name}
                              </div>
                              {activity.variant && (
                                <div className="text-sm text-gray-500">
                                  {activity.variant.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center gap-2">
                              {getActivityIcon(activity.type, activity.quantity)}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityBadge(activity.type, activity.quantity)}`}>
                                {getActivityLabel(activity.type)}
                              </span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <div className={`text-lg font-bold ${getActivityColor(activity.type, activity.quantity)}`}>
                            {activity.quantity > 0 ? '+' : ''}{activity.quantity}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-center">
                          <div className="text-sm">
                            <div className="text-gray-500">
                              {activity.oldStock} → {activity.newStock}
                            </div>
                            <div className="font-medium text-gray-900">
                              Current: {activity.newStock}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {activity.reason || '-'}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-3 h-3 text-teal-600" />
                            </div>
                            <div className="ml-2 text-sm text-gray-900">
                              {activity.changedBy || 'System'}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-right">
                          <div className="text-sm">
                            <div className="text-gray-900">{formatted.date}</div>
                            <div className="text-gray-500">{formatted.time}</div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} activities
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