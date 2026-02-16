// src/components/admin/affiliates/AffiliateDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  Users,
  Coins,
  Clock,
  DollarSign,
  ShoppingBag,
  Plus,
  ArrowRight,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AffiliateDashboardProps {
  businessId: string
}

interface SummaryData {
  totalAffiliates: number
  totalCommissionsPaid: number
  pendingCommissions: number
  pendingOrders: number
  totalOrdersFromAffiliates: number
}

interface TopAffiliate {
  affiliateId: string
  affiliateName: string
  affiliateEmail: string | null
  totalEarnings: number
  orderCount: number
}

interface RecentEarning {
  id: string
  amount: number
  currency: string
  status: string
  orderCompletedAt: string
  affiliate: {
    id: string
    name: string
  }
  order: {
    orderNumber: string
    total: number
  }
}

export function AffiliateDashboard({ businessId }: AffiliateDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [currency, setCurrency] = useState('EUR')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [topAffiliates, setTopAffiliates] = useState<TopAffiliate[]>([])
  const [recentEarnings, setRecentEarnings] = useState<RecentEarning[]>([])

  useEffect(() => {
    fetchSummary()
  }, [businessId])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stores/${businessId}/affiliates/summary`)
      
      if (!response.ok) {
        const data = await response.json()
        if (data.enabled === false) {
          setEnabled(false)
          setLoading(false)
          return
        }
        throw new Error(data.message || 'Failed to fetch summary')
      }

      const data = await response.json()
      setEnabled(true)
      setCurrency(data.currency || 'EUR')
      setSummary(data.data.summary)
      setTopAffiliates(data.data.topAffiliates || [])
      setRecentEarnings(data.data.recentEarnings || [])
    } catch (error) {
      console.error('Error fetching affiliate summary:', error)
      toast.error('Failed to load affiliate summary')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!enabled) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Affiliate System Not Enabled
              </h3>
              <p className="text-yellow-800">
                Affiliate system is not enabled for this business. Please contact support to enable this feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Affiliates</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage affiliates, track commissions, and process payments</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/stores/${businessId}/affiliates/list`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="w-4 h-4 mr-2" />
            View All Affiliates
          </Link>
          <Link
            href={`/admin/stores/${businessId}/affiliates/create`}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Affiliate
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.totalAffiliates}</p>
            <p className="text-sm text-gray-600">Total Affiliates</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalCommissionsPaid)}</p>
            <p className="text-sm text-gray-600">Total Commissions Paid</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.pendingCommissions)}</p>
            <p className="text-sm text-gray-600">Pending Commissions ({summary.pendingOrders} orders)</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.totalOrdersFromAffiliates}</p>
            <p className="text-sm text-gray-600">Orders from Affiliates</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`/admin/stores/${businessId}/affiliates/list`}
          className="bg-white p-6 rounded-lg border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Manage Affiliates</h3>
              <p className="text-sm text-gray-600">Create, edit, and manage affiliate accounts</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link
          href={`/admin/stores/${businessId}/affiliates/earnings`}
          className="bg-white p-6 rounded-lg border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">View Earnings</h3>
              <p className="text-sm text-gray-600">Track affiliate commissions and earnings</p>
            </div>
            <Coins className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link
          href={`/admin/stores/${businessId}/affiliates/payments`}
          className="bg-white p-6 rounded-lg border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Record Payment</h3>
              <p className="text-sm text-gray-600">Process payments to affiliates</p>
            </div>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
      </div>

      {/* Top Affiliates */}
      {topAffiliates.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Top Affiliates</h2>
            <Link
              href={`/admin/stores/${businessId}/affiliates/list`}
              className="text-sm text-teal-600 hover:text-teal-700"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {topAffiliates.map((affiliate) => (
              <div key={affiliate.affiliateId} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{affiliate.affiliateName}</p>
                      {affiliate.affiliateEmail && (
                        <p className="text-sm text-gray-500">{affiliate.affiliateEmail}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(affiliate.totalEarnings)}</p>
                    <p className="text-sm text-gray-500">{affiliate.orderCount} order{affiliate.orderCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Earnings */}
      {recentEarnings.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Earnings</h2>
            <Link
              href={`/admin/stores/${businessId}/affiliates/earnings`}
              className="text-sm text-teal-600 hover:text-teal-700"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentEarnings.map((earning) => (
              <div key={earning.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{earning.affiliate.name}</p>
                    <p className="text-sm text-gray-500">
                      Order {earning.order.orderNumber} • {formatDate(earning.orderCompletedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(earning.amount)}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      earning.status === 'PAID' ? 'bg-green-100 text-green-800' :
                      earning.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {earning.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
