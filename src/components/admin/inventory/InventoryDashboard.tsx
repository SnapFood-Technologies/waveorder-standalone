// src/components/admin/inventory/InventoryDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  BarChart3, 
  Activity, 
  Plus,
  Minus,
  RefreshCcw,
  Calendar,
  Search,
  Filter,
  Download
} from 'lucide-react'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'

interface InventoryDashboardProps {
  businessId: string
}

interface InventoryStats {
  totalProducts: number
  totalValue: number
  lowStockProducts: number
  outOfStockProducts: number
  lowStockAlerts: Product[]
  recentActivities: InventoryActivity[]
}

interface Business {
  currency: string
  showStockBadge?: boolean
}

interface Product {
  id: string
  name: string
  stock: number
  lowStockAlert?: number
  price: number
  category: {
    name: string
  }
}

interface InventoryActivity {
  id: string
  type: string
  quantity: number
  oldStock: number
  newStock: number
  reason?: string
  createdAt: string
  product: {
    name: string
  }
}

export default function InventoryDashboard({ businessId }: InventoryDashboardProps) {
  const { addParams } = useImpersonation(businessId)
  
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [business, setBusiness] = useState<Business>({ currency: 'USD', showStockBadge: false })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [savingBadge, setSavingBadge] = useState(false)

  useEffect(() => {
    fetchBusinessData()
    fetchInventoryStats()
  }, [businessId, timeRange])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setBusiness({ 
          currency: data.business.currency,
          showStockBadge: data.business.showStockBadge ?? false
        })
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    }
  }
  
  const toggleStockBadge = async () => {
    setSavingBadge(true)
    const newValue = !business.showStockBadge
    
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showStockBadge: newValue })
      })
      
      if (response.ok) {
        setBusiness(prev => ({ ...prev, showStockBadge: newValue }))
      }
    } catch (error) {
      console.error('Error updating stock badge setting:', error)
    } finally {
      setSavingBadge(false)
    }
  }

  const fetchInventoryStats = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/inventory/dashboard?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching inventory stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L',
    }
    
    const symbol = currencySymbols[business.currency] || business.currency
    return `${symbol}${amount.toLocaleString()}`
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'MANUAL_INCREASE':
      case 'RESTOCK':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'MANUAL_DECREASE':
      case 'ORDER_SALE':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <RefreshCcw className="w-4 h-4 text-gray-600" />
    }
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

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { status: 'Out of Stock', color: 'text-red-600 bg-red-100' }
    if (product.lowStockAlert && product.stock <= product.lowStockAlert) {
      return { status: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' }
    }
    return { status: 'In Stock', color: 'text-green-600 bg-green-100' }
  }

  if (loading) {
    return (
      <div>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor stock levels, track movements, and manage inventory
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
          </select>
          
          <Link
            href={addParams(`/admin/stores/${businessId}/inventory/adjustments`)}
            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adjust Stock
          </Link>
        </div>
      </div>

      {/* Stock Badge Display Setting */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Show Stock Status Badge on Storefront</h3>
            <p className="text-sm text-gray-500 mt-1">
              When enabled, customers will see "In Stock", "Low Stock", or "Out of Stock" badges on product cards. 
              Out of stock products will be visible (but not purchasable) instead of hidden.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleStockBadge}
            disabled={savingBadge}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
              business.showStockBadge ? 'bg-teal-600' : 'bg-gray-200'
            } ${savingBadge ? 'opacity-50 cursor-wait' : ''}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                business.showStockBadge ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inventory Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalValue || 0)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-yellow-600">{stats?.lowStockProducts || 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats?.outOfStockProducts || 0}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Low Stock Alerts
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Products running low that need attention
                </p>
              </div>
              <Link
                href={addParams(`/admin/stores/${businessId}/products?filter=low-stock`)}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 ? (
              <div className="space-y-3">
                {stats.lowStockAlerts.slice(0, 5).map(product => {
                  const stockStatus = getStockStatus(product)
                  return (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-yellow-200 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.category.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{product.stock} units</p>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">All Good!</h4>
                <p className="text-gray-600">No low stock alerts</p>
                <p className="text-sm text-gray-500 mt-1">All products have sufficient stock</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Inventory Activities */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-600" />
                  Recent Activities
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Latest inventory movements and changes
                </p>
              </div>
              <Link
                href={addParams(`/admin/stores/${businessId}/inventory/activities`)}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                View all
              </Link>
            </div>
          </div>
          
          <div className="p-6">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              <div className="space-y-3">
                {stats.recentActivities.slice(0, 5).map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-teal-200 transition-colors">
                    <div className="flex items-center space-x-3">
                      {getActivityIcon(activity.type)}
                      <div>
                        <h4 className="font-medium text-gray-900">{activity.product.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className={`font-medium ${
                            activity.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {activity.quantity > 0 ? '+' : ''}{activity.quantity} units
                          </span>
                          <span className="text-gray-400">•</span>
                          <span>{getActivityLabel(activity.type)}</span>
                        </div>
                        {activity.reason && (
                          <p className="text-xs text-gray-500 mt-1">{activity.reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(activity.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Activity className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">No Recent Activities</h4>
                <p className="text-gray-600">Inventory movements will appear here</p>
                <p className="text-sm text-gray-500 mt-1">Start managing inventory to see activity logs</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h3>
        <p className="text-sm text-gray-600 mb-4">Manage your inventory with these essential tools</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/inventory/adjustments`)}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-teal-300 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-teal-200 transition-colors">
              <Plus className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Adjust Stock</h4>
              <p className="text-sm text-gray-600">Manually update product quantities</p>
            </div>
          </Link>
          
          <Link
            href={addParams(`/admin/stores/${businessId}/inventory/activities`)}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">View Activities</h4>
              <p className="text-sm text-gray-600">Track all inventory movements</p>
            </div>
          </Link>
          
          <Link
            href={addParams(`/admin/stores/${businessId}/products`)}
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Manage Products</h4>
              <p className="text-sm text-gray-600">View and edit your product catalog</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}