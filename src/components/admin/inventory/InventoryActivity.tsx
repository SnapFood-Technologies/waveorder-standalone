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
  Filter
} from 'lucide-react'

interface InventoryActivity {
  id: string
  type: string
  quantity: number
  oldStock: number
  newStock: number
  reason?: string
  createdAt: string
  product: {
    id: string
    name: string
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

export function InventoryActivity({ businessId, productId }: InventoryActivityProps) {
  const [activities, setActivities] = useState<InventoryActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'increase' | 'decrease'>('all')

  useEffect(() => {
    fetchActivities()
  }, [businessId, productId])

  const fetchActivities = async () => {
    try {
      const url = productId 
        ? `/api/admin/stores/${businessId}/products/${productId}/inventory`
        : `/api/admin/stores/${businessId}/inventory/activities`
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('Error fetching inventory activities:', error)
    } finally {
      setLoading(false)
    }
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

  const filteredActivities = activities.filter(activity => {
    if (filter === 'increase') return activity.quantity > 0
    if (filter === 'decrease') return activity.quantity < 0
    return true
  })

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="all">All Activities</option>
          <option value="increase">Stock Increases</option>
          <option value="decrease">Stock Decreases</option>
        </select>
      </div>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p>No inventory activities found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActivities.map(activity => (
            <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    {getActivityIcon(activity.type, activity.quantity)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {activity.product.name}
                      </span>
                      {activity.variant && (
                        <span className="text-sm text-gray-500">
                          ({activity.variant.name})
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">{getActivityLabel(activity.type)}</span>
                      {activity.reason && (
                        <span className="ml-2">• {activity.reason}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(activity.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-lg font-bold ${getActivityColor(activity.type, activity.quantity)}`}>
                    {activity.quantity > 0 ? '+' : ''}{activity.quantity}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.oldStock} → {activity.newStock}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}