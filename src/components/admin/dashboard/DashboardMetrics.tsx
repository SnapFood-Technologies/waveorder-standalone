// src/components/admin/dashboard/DashboardMetrics.tsx
'use client'

import { useState, useEffect } from 'react'
import { Eye, ShoppingBag, TrendingUp, Calendar, Info, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { DateRangeFilter } from './DateRangeFilter'
import GeographicAnalytics from '../analytics/GeographicAnalytics'

interface DashboardMetricsProps {
  businessId: string
}

interface Metrics {
  views: number
  orders: number
  revenue: number
  growth: number
  ordersByStatus: OrderStatusData[]
}

interface OrderStatusData {
  status: string
  count: number
  color: string
  label: string
}

interface Business {
  currency: string
}

export function DashboardMetrics({ businessId }: DashboardMetricsProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    views: 0,
    orders: 0,
    revenue: 0,
    growth: 0,
    ordersByStatus: []
  })
  const [business, setBusiness] = useState<Business>({ currency: 'USD' })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  })
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [showRevenueModal, setShowRevenueModal] = useState(false)

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setBusiness({ currency: data.business.currency })
        }
      } catch (error) {
        console.error('Error fetching business data:', error)
      }
    }

    fetchBusinessData()
  }, [businessId])

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          startDate: dateRange.start.toISOString(),
          endDate: dateRange.end.toISOString()
        })
        
        const response = await fetch(`/api/admin/stores/${businessId}/metrics?${params}`)
        if (response.ok) {
          const data = await response.json()
          setMetrics(data.metrics)
        }
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [businessId, dateRange])

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L', // Albanian Lek
      // Add more currencies as needed
    }
    
    const symbol = currencySymbols[business.currency] || business.currency
    return `${symbol}${amount.toLocaleString()}`
  }

  const formatDateRange = () => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }
    
    return `${dateRange.start.toLocaleDateString('en-US', options)} – ${dateRange.end.toLocaleDateString('en-US', options)}`
  }

  const metricItems = [
    {
      name: 'Views',
      value: metrics.views.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      hasTooltip: false
    },
    {
      name: 'Orders',
      value: metrics.orders.toLocaleString(),
      icon: ShoppingBag,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      hasTooltip: false
    },
    {
      name: 'Revenue',
      value: formatCurrency(metrics.revenue),
      icon: Wallet,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      hasTooltip: true,
      tooltip: 'Total revenue from completed orders with paid status in the selected period. Delivery orders must be DELIVERED, pickup/dine-in orders must be PICKED_UP. Only orders with PAID payment status are included. This represents actual money received and includes the final order total after discounts, taxes, delivery fees, and other adjustments.'
    },
    {
      name: 'Growth',
      value: `${metrics.growth >= 0 ? '+' : ''}${metrics.growth}%`,
      icon: TrendingUp,
      color: metrics.growth >= 0 ? 'text-purple-600' : 'text-red-600',
      bgColor: metrics.growth >= 0 ? 'bg-purple-100' : 'bg-red-100',
      hasTooltip: false
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
            <div className="h-4 bg-gray-200 rounded w-48 mt-1 animate-pulse"></div>
          </div>
          <div className="mt-2 lg:mt-0">
            <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        
        {/* Metrics Cards Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        
        {/* Orders by Status Chart Loading */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200 mt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center animate-pulse">
                <div className="w-3 h-3 bg-gray-200 rounded mr-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          <span className="text-sm text-gray-500">{formatDateRange()}</span>
        </div>
        <div className="mt-2 lg:mt-0 w-full lg:w-auto">
        <DateRangeFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricItems.map((item) => (
          <div key={item.name} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center">
                  <p className="text-sm font-medium text-gray-500">{item.name}</p>
                  {item.hasTooltip && (
                    <button
                      onClick={() => setShowRevenueModal(true)}
                      className="ml-1 p-0.5 rounded hover:bg-gray-100 cursor pointer transition-colors"
                    >
                      <Info className="w-3 h-3 text-gray-400" />
                    </button>
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Orders by Status Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Orders by Status</h3>
          <div className="flex items-center text-sm text-gray-500">
            <Info className="w-4 h-4 mr-1" />
            Total: {metrics.orders} orders
          </div>
        </div>
        
        {metrics.ordersByStatus.length > 0 ? (
          <div className="space-y-6">
            {/* Custom Bar Chart */}
            <div className="h-64 relative">
              {/* Calculate max value once outside map for efficiency and accuracy */}
              {(() => {
                const maxValue = Math.max(...metrics.ordersByStatus.map(item => item.count), 1)
                return (
                  <>
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500 py-2">
                      {Array.from({ length: 6 }, (_, i) => {
                        const value = Math.ceil((maxValue * (5 - i)) / 5)
                        return (
                          <span key={i} className="text-right">
                            {value > 0 ? value : ''}
                          </span>
                        )
                      })}
                    </div>
                    
                    {/* Chart area */}
                    <div className="ml-10 h-full relative">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between">
                        {Array.from({ length: 6 }, (_, i) => (
                          <div key={i} className="border-t border-gray-100"></div>
                        ))}
                      </div>
                      
                      {/* Bars */}
                      <div className="absolute inset-0 flex items-end justify-between px-2">
                        {metrics.ordersByStatus.map((item, index) => {
                          // Calculate height with proper scaling and minimum visibility
                          const height = maxValue > 0 ? Math.max((item.count / maxValue) * 100, item.count > 0 ? 5 : 2) : 2
                          
                          return (
                            <div
                              key={item.status}
                              className="flex flex-col items-center group cursor-pointer"
                              style={{ width: `${100 / metrics.ordersByStatus.length - 2}%` }}
                            >
                              {/* Tooltip */}
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10">
                                {item.label}: {item.count} orders
                              </div>
                              
                              {/* Bar */}
                              <div
                                className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                                style={{
                                  height: `${height}%`,
                                  backgroundColor: item.color,
                                  minHeight: item.count > 0 ? '8px' : '2px'
                                }}
                              ></div>
                              
                              {/* X-axis label */}
                              <div className="mt-2 text-xs text-gray-600 text-center leading-tight">
                                {item.label.split(' ').map((word, i) => (
                                  <div key={i}>{word}</div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
              {metrics.ordersByStatus.map((item) => (
                <div key={item.status} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded mr-2" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {item.label} ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders found for this period</p>
            </div>
          </div>
        )}
      </div>

      {/* Geographic Analytics Preview */}
      <GeographicAnalytics businessId={businessId} dateRange={dateRange} />

      {/* Revenue Info Modal */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Wallet className="w-5 h-5 text-emerald-600 mr-2" />
                Revenue Calculation
              </h3>
              <button
                onClick={() => setShowRevenueModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong className="text-gray-900">What's included:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Only completed orders with <strong>PAID</strong> payment status</li>
                <li>Final order total after all adjustments</li>
                <li>Includes delivery fees and taxes</li>
                <li>Accounts for any discounts applied</li>
              </ul>
              
              <div className="pt-2 border-t border-gray-200 mt-3">
                <p className="font-semibold text-gray-900 mb-2">Order completion status by type:</p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-start">
                    <span className="font-medium text-gray-700 mr-2">• Delivery orders:</span>
                    <span className="text-gray-600">Must be <strong>DELIVERED</strong> + PAID</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium text-gray-700 mr-2">• Pickup orders:</span>
                    <span className="text-gray-600">Must be <strong>PICKED_UP</strong> + PAID</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium text-gray-700 mr-2">• Dine-in orders:</span>
                    <span className="text-gray-600">Must be <strong>PICKED_UP</strong> + PAID</span>
                  </li>
                </ul>
              </div>
              
              <p className="pt-2 border-t border-gray-200">
                <strong className="text-gray-900">Time period:</strong> {formatDateRange()}
              </p>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowRevenueModal(false)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
