// src/components/admin/dashboard/SalonDashboardMetrics.tsx
'use client'

import { useState, useEffect } from 'react'
import { Eye, Calendar, TrendingUp, Info, Wallet } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { DateRangeFilter } from './DateRangeFilter'
import GeographicAnalytics from '../analytics/GeographicAnalytics'

interface SalonDashboardMetricsProps {
  businessId: string
}

interface Metrics {
  views: number
  appointments: number
  revenue: number
  growth: number
  appointmentsByStatus: Array<{ status: string; count: number }>
}

interface Business {
  currency: string
  businessType?: string
}

export function SalonDashboardMetrics({ businessId }: SalonDashboardMetricsProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    views: 0,
    appointments: 0,
    revenue: 0,
    growth: 0,
    appointmentsByStatus: []
  })
  const [business, setBusiness] = useState<Business>({ currency: 'USD', businessType: undefined })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start, end }
  })
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [showRevenueModal, setShowRevenueModal] = useState(false)

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setBusiness({ currency: data.business.currency, businessType: data.business.businessType })
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
        
        // Use the same metrics endpoint - it queries orders which appointments are linked to
        const response = await fetch(`/api/admin/stores/${businessId}/metrics?${params}`)
        if (response.ok) {
          const data = await response.json()
          // Adapt the metrics data - orders become appointments
          setMetrics({
            views: data.metrics.views,
            appointments: data.metrics.orders, // Orders count = appointments count
            revenue: data.metrics.revenue,
            growth: data.metrics.growth,
            appointmentsByStatus: data.metrics.ordersByStatus || [] // Adapt status labels
          })
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
      ALL: 'L',
      BHD: 'BD',
      BBD: 'Bds$',
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
      name: business.businessType === 'SERVICES' ? 'Scheduled sessions' : 'Appointments',
      value: metrics.appointments.toLocaleString(),
      icon: Calendar,
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
      tooltip: business.businessType === 'SERVICES'
      ? 'Total revenue from completed sessions with paid status in the selected period. Only sessions with COMPLETED status and PAID payment status are included. This represents actual money received and includes the final total after discounts, taxes, and other adjustments.'
      : 'Total revenue from completed appointments with paid status in the selected period. Only appointments with COMPLETED status and PAID payment status are included. This represents actual money received and includes the final order total after discounts, taxes, and other adjustments.'
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
        
        {/* Appointments by Status Chart Loading */}
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

      {/* Appointments / Scheduled sessions by Status Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">{business.businessType === 'SERVICES' ? 'Scheduled sessions by Status' : 'Appointments by Status'}</h3>
        </div>
        
        {metrics.appointmentsByStatus.length > 0 ? (
          <>
            <div className="h-64 flex items-end justify-center gap-4 mb-6">
              {metrics.appointmentsByStatus.map((item, index) => {
                const maxCount = Math.max(...metrics.appointmentsByStatus.map(s => s.count))
                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: '256px' }}>
                      <div
                        className="w-full bg-teal-500 rounded-t transition-all hover:bg-teal-600 cursor-pointer"
                        style={{ height: `${height}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                        title={`${item.status}: ${item.count}`}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      <div className="font-medium">{item.count}</div>
                      <div className="text-gray-500 mt-1 break-words max-w-[80px]">
                        {item.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
              {metrics.appointmentsByStatus.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-3 h-3 bg-teal-500 rounded mr-2"></div>
                  <span className="text-sm text-gray-600">
                    {item.status.replace('_', ' ')}: {item.count}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {business.businessType === 'SERVICES' ? 'No session data available for this period' : 'No appointment data available for this period'}
          </div>
        )}
      </div>

      {/* Revenue Modal */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Calculation</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Total revenue from completed {business.businessType === 'SERVICES' ? 'sessions' : 'appointments'} with paid status in the selected period. Only {business.businessType === 'SERVICES' ? 'sessions' : 'appointments'} with COMPLETED status and PAID payment status are included.
              </p>
              <button
                onClick={() => setShowRevenueModal(false)}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
