// components/superadmin/SuperAdminAnalytics.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Eye,
  ShoppingCart,
  DollarSign,
  Activity,
  AlertTriangle
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalBusinesses: number
    totalUsers: number
    totalOrders: number
    totalRevenue: number
    avgOrderValue: number
    conversionRate: number
  }
  businessGrowth: {
    date: string
    count: number
  }[]
  userGrowth: {
    date: string
    count: number
  }[]
  topBusinesses: {
    id: string
    name: string
    orders: number
    revenue: number
    plan: string
  }[]
  revenueByPlan: {
    plan: string
    revenue: number
    businesses: number
  }[]
}

export function SuperAdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/superadmin/analytics?range=${dateRange}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError(error instanceof Error ? error.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600 mt-1">Overview of platform performance</p>
        </div>
        
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="mt-4 lg:mt-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Businesses</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(data.overview.totalBusinesses)}
              </p>
            </div>
            <Building2 className="w-10 h-10 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(data.overview.totalUsers)}
              </p>
            </div>
            <Users className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(data.overview.totalOrders)}
              </p>
            </div>
            <ShoppingCart className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                { data.overview.totalRevenue ? formatCurrency(data.overview.totalRevenue) : 0}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(data.overview.avgOrderValue)}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-teal-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {data.overview.conversionRate.toFixed(1)}%
              </p>
            </div>
            <Activity className="w-10 h-10 text-pink-500" />
          </div>
        </div>
      </div>

      {/* Top Businesses */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Businesses</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Business</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Plan</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Orders</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.topBusinesses.map((business) => (
                <tr key={business.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{business.name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      business.plan === 'PRO' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {business.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">{formatNumber(business.orders)}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(business.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Subscription Plan</h3>
        <div className="space-y-4">
          {data.revenueByPlan.map((plan) => (
            <div key={plan.plan} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  plan.plan === 'PRO' ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <span className={`font-bold ${plan.plan === 'PRO' ? 'text-purple-700' : 'text-gray-700'}`}>
                    {plan.plan}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{plan.plan} Plan</p>
                  <p className="text-xs text-gray-500">{plan.businesses} businesses</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(plan.revenue)}</p>
                <p className="text-xs text-gray-500">Total revenue</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}