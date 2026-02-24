// components/superadmin/SuperAdminAnalytics.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Eye,
  ShoppingCart,
  DollarSign,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  Filter,
  HelpCircle,
  Archive,
  ArrowRight,
  Store,
  FlaskConical,
  UserCheck
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    totalBusinesses: number
    activeBusinesses: number
    incompleteBusinesses: number
    totalUsers: number
    activeUsers: number
    multiStoreUsers: number
    testModeBusinesses: number
    totalOrders: number
    totalRevenue: number
    pageViews: number
    conversionRate: number
  }
  revenueByPlan: {
    plan: string
    billingType?: string
    revenue: number
    businesses: number
  }[]
  incompleteBusinessesCount: number
  inactiveBusinessesCount: number
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
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse">
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

      {/* Overview Stats - Row 1: Business & User metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
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

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Businesses</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(data.overview.activeBusinesses)}
              </p>
            </div>
            <Activity className="w-10 h-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Incomplete Businesses</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(data.overview.incompleteBusinesses)}
              </p>
            </div>
            <AlertTriangle className="w-10 h-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(data.overview.totalUsers)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {formatNumber(data.overview.activeUsers)} active
              </p>
            </div>
            <Users className="w-10 h-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Overview Stats - Row 2: Platform metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Multi-Store Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(data.overview.multiStoreUsers)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Users with 2+ stores</p>
            </div>
            <Store className="w-10 h-10 text-teal-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Test Mode Businesses</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(data.overview.testModeBusinesses)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Hidden from analytics</p>
            </div>
            <FlaskConical className="w-10 h-10 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Page Views</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {data.overview.pageViews.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Across all storefronts</p>
            </div>
            <Eye className="w-10 h-10 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {data.overview.conversionRate.toFixed(1)}%
              </p>
            </div>
            <BarChart3 className="w-10 h-10 text-pink-500" />
          </div>
        </div>
      </div>

      {/* Operations Analytics CTA */}
      <Link
        href="/superadmin/operations/orders"
        className="block bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg p-6 hover:from-teal-600 hover:to-emerald-600 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Operations Analytics</h3>
              <p className="text-sm text-teal-100">View orders, appointments, service requests, reservations, bookings, and search analytics across all businesses</p>
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-white" />
        </div>
      </Link>

      {/* Revenue by Plan */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Subscription Plan</h3>
        <div className="space-y-4">
          {data.revenueByPlan.map((plan, index) => {
            const billingTypeDisplay = plan.billingType 
              ? plan.billingType === 'free' ? 'Free' 
                : plan.billingType === 'monthly' ? 'Monthly' 
                : plan.billingType === 'yearly' ? 'Yearly' 
                : plan.billingType === 'trial' ? 'Trial'
                : plan.billingType
              : null
            const displayKey = `${plan.plan}_${plan.billingType || 'unknown'}_${index}`
            
            return (
              <div key={displayKey} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    plan.plan === 'BUSINESS' ? 'bg-indigo-100' :
                    plan.plan === 'PRO' ? 'bg-purple-100' : 'bg-gray-100'
                  }`}>
                    <span className={`text-xs font-bold ${
                      plan.plan === 'BUSINESS' ? 'text-indigo-700' :
                      plan.plan === 'PRO' ? 'text-purple-700' : 'text-gray-700'
                    }`}>
                      {plan.plan === 'BUSINESS' ? 'BIZ' : plan.plan === 'PRO' ? 'PRO' : 'STR'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {plan.plan}
                      {billingTypeDisplay && (
                        <span className="ml-2 text-gray-600 font-normal">
                          ({billingTypeDisplay})
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{plan.businesses} businesses</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(plan.revenue)}</p>
                  <p className="text-xs text-gray-500">MRR (monthly recurring)</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Analytics Guide Section */}
      <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Analytics Guide</h3>
            <p className="text-sm text-gray-600">Understand how metrics are calculated and what they mean</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overview Metrics Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="text-base font-semibold text-gray-900">Overview Metrics</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Total Businesses</p>
                  <p className="text-xs text-gray-600 mt-1">All businesses created on the platform (active and inactive)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Activity className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Active Businesses</p>
                  <p className="text-xs text-gray-600 mt-1">Currently active and visible to customers</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Incomplete Businesses</p>
                  <p className="text-xs text-gray-600 mt-1">Missing essential setup (WhatsApp number or address)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Users className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Total Users</p>
                  <p className="text-xs text-gray-600 mt-1">All registered users (excluding super admins). Active count shows users with at least one active, non-test business.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Store className="w-4 h-4 text-teal-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Multi-Store Users</p>
                  <p className="text-xs text-gray-600 mt-1">Users who own or manage more than one store (multi-catalog feature users)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <FlaskConical className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Test Mode Businesses</p>
                  <p className="text-xs text-gray-600 mt-1">Businesses marked as test mode. Excluded from all other analytics metrics.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Eye className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Page Views</p>
                  <p className="text-xs text-gray-600 mt-1">Total storefront visits across all businesses in the selected period</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <BarChart3 className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Conversion Rate</p>
                  <p className="text-xs text-gray-600 mt-1">Percentage of storefront visits that result in orders, appointments, or service requests</p>
                </div>
              </div>
            </div>
          </div>

          {/* Business Statuses Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="text-base font-semibold text-gray-900">Business Statuses</h4>
            </div>
            <div className="space-y-3">
              <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-sm font-semibold text-gray-900">Active</p>
                </div>
                <p className="text-xs text-gray-700">Business is live and visible to customers. Can receive orders, appointments, and service requests and operate normally.</p>
              </div>
              <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm font-semibold text-gray-900">Inactive</p>
                </div>
                <p className="text-xs text-gray-700">Business has been deactivated. Not visible to customers and cannot receive orders, appointments, or service requests. Data is preserved and can be reactivated.</p>
              </div>
              <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-r-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm font-semibold text-gray-900">Incomplete</p>
                </div>
                <p className="text-xs text-gray-700">Business is missing essential setup information (WhatsApp number or business address). These businesses may be active but need attention to function properly.</p>
              </div>
            </div>

            {/* CTA for Archived Data */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Link 
                href="/superadmin/analytics/archived"
                className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                    <Archive className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">View Archived Data</p>
                    <p className="text-xs text-gray-600">
                      {data.incompleteBusinessesCount || data.overview.incompleteBusinesses} incomplete, {data.inactiveBusinessesCount || 0} inactive businesses
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>
            </div>
          </div>

          {/* Revenue by Plan Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="text-base font-semibold text-gray-900">Revenue by Subscription Plan</h4>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm font-medium text-gray-900 mb-1">Businesses Count</p>
                <p className="text-xs text-gray-600">Number of <strong>active</strong> businesses on each subscription plan</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <p className="text-sm font-medium text-gray-900 mb-1">MRR (Revenue)</p>
                <p className="text-xs text-gray-600">Monthly recurring revenue from each plan. Yearly plans shown as /month equivalent.</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800"><strong>Note:</strong> Only active businesses are counted. Inactive businesses are excluded from plan statistics.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Date Range Filter Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Filter className="w-5 h-5 text-indigo-600" />
              </div>
              <h4 className="text-base font-semibold text-gray-900">Date Range Filter</h4>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <p className="text-sm font-medium text-gray-900">Affected Metrics</p>
                </div>
                <p className="text-xs text-gray-700">Business Growth, User Growth, Orders/Appointments/Service Requests, and Conversion Rate calculations</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <p className="text-sm font-medium text-gray-900">Always Shown</p>
                </div>
                <p className="text-xs text-gray-700">Overview metrics (Total Businesses, Active Businesses, Incomplete Businesses) show all-time counts regardless of date range</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="w-4 h-4 text-indigo-600" />
                  <p className="text-sm font-medium text-gray-900">Operations Analytics</p>
                </div>
                <p className="text-xs text-gray-700">Order, appointment, and service request counts, trends, and detailed analytics are available in the Operations Analytics section</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
