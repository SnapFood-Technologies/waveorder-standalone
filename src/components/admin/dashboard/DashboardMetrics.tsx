// src/components/admin/dashboard/DashboardMetrics.tsx
'use client'

import { useState, useEffect } from 'react'
import { Eye, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react'

interface DashboardMetricsProps {
  businessId: string
}

interface Metrics {
  views: number
  orders: number
  revenue: number
  growth: number
}

export function DashboardMetrics({ businessId }: DashboardMetricsProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    views: 0,
    orders: 0,
    revenue: 0,
    growth: 0
  })
  const [loading, setLoading] = useState(true)
  const [dateRange] = useState('September 1, 2025 – September 17, 2025')

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/metrics`)
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
  }, [businessId])

  const metricItems = [
    {
      name: 'Views',
      value: metrics.views.toLocaleString(),
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Orders',
      value: metrics.orders.toLocaleString(),
      icon: ShoppingBag,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Revenue',
      value: `$${metrics.revenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100'
    },
    {
      name: 'Growth',
      value: `+${metrics.growth}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ]

  if (loading) {
    return (
        <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          <span className="text-sm text-gray-500">{dateRange}</span>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
        <span className="text-sm text-gray-500">{dateRange}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricItems.map((item) => (
          <div key={item.name} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{item.name}</p>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}