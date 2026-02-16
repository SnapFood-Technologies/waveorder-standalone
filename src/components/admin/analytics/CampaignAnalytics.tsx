// src/components/admin/analytics/CampaignAnalytics.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Eye,
  ShoppingCart,
  Package,
  DollarSign,
  Percent,
  Calendar,
  AlertCircle,
  Loader2,
  Lock,
  Info
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useImpersonation } from '@/lib/impersonation'
import { useSubscription } from '@/hooks/useSubscription'

interface CampaignAnalyticsProps {
  businessId: string
}

interface CampaignData {
  campaign: string | null
  source: string | null
  medium: string | null
  views: number
  addToCarts: number
  orders: number
  revenue: number
  viewToCartRate: number
  cartToOrderRate: number
  conversionRate: number
}

interface CampaignAnalyticsData {
  campaigns: CampaignData[]
  summary: {
    totalCampaigns: number
    totalViews: number
    totalAddToCarts: number
    totalOrders: number
    totalRevenue: number
    overallViewToCartRate: number
    overallCartToOrderRate: number
    overallConversionRate: number
  }
  period: string
  dateRange: {
    start: string
    end: string
  }
}

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'all', label: 'All Time' }
]

export function CampaignAnalytics({ businessId }: CampaignAnalyticsProps) {
  const { addParams } = useImpersonation(businessId)
  const { isPro } = useSubscription()
  const [data, setData] = useState<CampaignAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [business, setBusiness] = useState<{ currency: string }>({ currency: 'EUR' })

  useEffect(() => {
    fetchBusinessData()
    fetchCampaignData()
  }, [businessId, selectedPeriod])

  const fetchBusinessData = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const result = await response.json()
        setBusiness({ currency: result.business.currency })
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    }
  }

  const fetchCampaignData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `/api/admin/stores/${businessId}/analytics/campaigns?period=${selectedPeriod}`
      )
      
      if (!response.ok) {
        if (response.status === 403) {
          setError('Campaign Analytics is only available for PRO and BUSINESS plans')
        } else {
          throw new Error('Failed to fetch campaign analytics')
        }
        return
      }
      
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error('Error fetching campaign analytics:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: business.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  // Check if user has PRO or BUSINESS plan
  if (!isPro) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <Lock className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Campaign Analytics - PRO Feature
              </h3>
              <p className="text-yellow-800 mb-4">
                Campaign Analytics is available for PRO and BUSINESS plans. Upgrade to track UTM campaign performance, conversion rates, and revenue by campaign.
              </p>
              <Link
                href={addParams(`/admin/stores/${businessId}/settings/billing`)}
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Upgrade to PRO
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/analytics`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Campaign Analytics</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Track UTM campaign performance and conversions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {PERIODS.map((period) => (
              <option key={period.id} value={period.id}>
                {period.label}
              </option>
            ))}
          </select>
          <button
            onClick={fetchCampaignData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {data.summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.summary.totalCampaigns}</p>
            <p className="text-sm text-gray-600">Active Campaigns</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.summary.totalViews.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Views</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.summary.totalOrders.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Orders from Campaigns</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.summary.totalRevenue)}</p>
            <p className="text-sm text-gray-600">Campaign Revenue</p>
          </div>
        </div>
      )}

      {/* Overall Conversion Rates */}
      {data.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Percent className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.summary.overallConversionRate}%</p>
            <p className="text-sm text-gray-600">Overall Conversion Rate</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.summary.overallViewToCartRate}%</p>
            <p className="text-sm text-gray-600">View to Cart Rate</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.summary.overallCartToOrderRate}%</p>
            <p className="text-sm text-gray-600">Cart to Order Rate</p>
          </div>
        </div>
      )}

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Campaign Performance</h2>
        </div>
        
        {data.campaigns.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaign Data</h3>
            <p className="text-gray-600 mb-4">
              Campaign analytics will appear here when customers visit your storefront with UTM parameters.
            </p>
            <p className="text-sm text-gray-500">
              Share links like: <code className="bg-gray-100 px-2 py-1 rounded">yoursite.com/store?utm_campaign=summer_sale&utm_source=instagram</code>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medium</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Add to Cart</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.campaigns.map((campaign, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {campaign.campaign || 'No Campaign'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{campaign.source || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{campaign.medium || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{campaign.views.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm text-gray-900">{campaign.addToCarts.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-semibold text-gray-900">{campaign.orders.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(campaign.revenue)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-gray-900">{campaign.conversionRate}%</span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-gray-500">View→Cart:</span>
                          <span className="text-xs text-gray-700">{campaign.viewToCartRate}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Cart→Order:</span>
                          <span className="text-xs text-gray-700">{campaign.cartToOrderRate}%</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">How Campaign Analytics Works</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Campaigns are tracked via UTM parameters in your storefront URLs</li>
              <li>Views and add-to-cart events are linked to orders via sessionId for accurate conversion tracking</li>
              <li>Only campaigns with UTM parameters (utm_campaign, utm_source, or utm_medium) are shown</li>
              <li>Share links like: <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">yoursite.com/store?utm_campaign=summer_sale&utm_source=instagram</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
