// src/components/admin/analytics/AdvancedAnalytics.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Eye, 
  Clock,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Percent,
  Package,
  Repeat,
  Info,
  AlertCircle
} from 'lucide-react'
import { DateRangeFilter } from '../dashboard/DateRangeFilter'

interface AdvancedAnalyticsProps {
  businessId: string
}

export default function AdvancedAnalytics({ businessId }: AdvancedAnalyticsProps) {
  const [data, setData] = useState<any>(null)
  const [business, setBusiness] = useState<any>({ currency: 'USD' })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date()
  })
  const [selectedPeriod, setSelectedPeriod] = useState('this_month')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchBusinessData()
    fetchAnalyticsData()
  }, [businessId, dateRange])

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

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString()
      })
      
      const response = await fetch(`/api/admin/stores/${businessId}/analytics/advanced?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      
      // Create CSV content
      const csvContent = [
        ['Advanced Analytics Report'],
        [`Business ID: ${businessId}`],
        [`Period: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`],
        [''],
        ['Overview Metrics'],
        ['Metric', 'Value'],
        ['Total Views', data.overview.totalViews],
        ['Unique Visitors', data.overview.uniqueVisitors],
        ['Total Orders', data.overview.totalOrders],
        ['Revenue', formatCurrency(data.overview.revenue)],
        ['Conversion Rate', `${data.overview.conversionRate}%`],
        ['Avg Order Value', formatCurrency(data.overview.avgOrderValue)],
        [''],
        ['Top Products'],
        ['Product Name', 'Orders', 'Quantity', 'Revenue'],
        ...data.products.topProducts.map((p: any) => [
          p.name,
          p.orders,
          p.quantity,
          formatCurrency(p.revenue)
        ]),
        [''],
        ['Order Status Breakdown'],
        ['Status', 'Count', 'Percentage'],
        ...data.ordersByStatus.map((s: any) => [
          s.status,
          s.count,
          `${s.percentage}%`
        ])
      ].map(row => row.join(',')).join('\n')

      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${businessId}-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting:', error)
    } finally {
      setExporting(false)
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
    return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'time', label: 'Time Analysis', icon: Clock },
    { id: 'customers', label: 'Customers', icon: Users },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">
            Deep insights into your store performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <DateRangeFilter
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          
          <button
            onClick={fetchAnalyticsData}
            className="p-2 text-gray-600 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Analytics Information</p>
            <p>
              This dashboard uses data from your orders and existing analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span className={`text-xs flex items-center gap-1 ${
                  data.overview.viewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.overview.viewsGrowth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(data.overview.viewsGrowth)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.totalViews)}</p>
              <p className="text-sm text-gray-600">Total Views</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(data.overview.uniqueVisitors)}</p>
              <p className="text-sm text-gray-600">Unique Visitors</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <ShoppingBag className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.overview.totalOrders}</p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span className={`text-xs flex items-center gap-1 ${
                  data.overview.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {data.overview.revenueGrowth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(data.overview.revenueGrowth)}%
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.overview.revenue)}</p>
              <p className="text-sm text-gray-600">Revenue</p>
            </div>
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                  <p className="text-xl font-bold text-gray-900">{data.overview.conversionRate}%</p>
                </div>
                <Percent className="w-5 h-5 text-teal-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(data.overview.avgOrderValue)}</p>
                </div>
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bounce Rate</p>
                  <p className="text-xl font-bold text-gray-900">{data.overview.bounceRate}%</p>
                </div>
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Session</p>
                  <p className="text-xl font-bold text-gray-900">{Math.floor(data.overview.avgSessionDuration / 60)}m</p>
                </div>
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-6 border border-teal-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Traffic Growth</p>
                  <p className="text-sm text-gray-600">
                    Your views are {data.overview.viewsGrowth >= 0 ? 'up' : 'down'} {Math.abs(data.overview.viewsGrowth)}% 
                    compared to the previous period
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Revenue Performance</p>
                  <p className="text-sm text-gray-600">
                    Revenue is {data.overview.revenueGrowth >= 0 ? 'up' : 'down'} {Math.abs(data.overview.revenueGrowth)}% 
                    with an average order value of {formatCurrency(data.overview.avgOrderValue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {data.traffic.trends.length > 0 ? (
            <>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitors Over Time</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {data.traffic.trends.map((trend: any, index: number) => {
                    const maxVisitors = Math.max(...data.traffic.trends.map((t: any) => t.visitors))
                    const height = maxVisitors > 0 ? (trend.visitors / maxVisitors) * 100 : 5
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group">
                        <div className="text-xs text-gray-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap">
                          {trend.visitors} visitors
                        </div>
                        <div
                          className="w-full bg-teal-500 rounded-t hover:bg-teal-600 transition-colors cursor-pointer"
                          style={{ height: `${height}%`, minHeight: '8px' }}
                        />
                        <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                          {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Over Time</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {data.traffic.trends.map((trend: any, index: number) => {
                    const maxOrders = Math.max(...data.traffic.trends.map((t: any) => t.orders))
                    const height = maxOrders > 0 ? (trend.orders / maxOrders) * 100 : 5
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center group">
                        <div className="text-xs text-gray-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap">
                          {trend.orders} orders
                        </div>
                        <div
                          className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                          style={{ height: `${height}%`, minHeight: '8px' }}
                        />
                        <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                          {new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
              <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Trend Data Available</h3>
              <p className="text-gray-600">
                Trend data will appear here once you have analytics data for multiple days.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {data.products.topProducts.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                <p className="text-sm text-gray-600 mt-1">Best performing products by revenue in the selected period</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Rank</th>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-600">Product</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Orders</th>
                      <th className="text-center py-3 px-6 text-sm font-medium text-gray-600">Quantity Sold</th>
                      <th className="text-right py-3 px-6 text-sm font-medium text-gray-600">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.products.topProducts.map((product: any, index: number) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold text-sm">
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {product.orders}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-gray-900 font-medium">{product.quantity}</td>
                        <td className="py-4 px-6 text-right font-semibold text-gray-900">
                          {formatCurrency(product.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Product Data</h3>
              <p className="text-gray-600 mb-4">
                No products have been sold during the selected period.
              </p>
              <p className="text-sm text-gray-500">
                Once you have orders, your top-selling products will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Time Analysis Tab */}
      {activeTab === 'time' && (
        <div className="space-y-6">
          {/* Peak Hours */}
          {data.timeAnalysis.peakHours.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Peak Hours</h3>
              <p className="text-sm text-gray-600 mb-4">Times when your store receives the most orders</p>
              <div className="flex flex-wrap gap-3">
                {data.timeAnalysis.peakHours.map((hour: string, index: number) => (
                  <div key={hour} className="flex items-center gap-2 px-4 py-3 bg-teal-100 text-teal-700 rounded-lg font-semibold">
                    <Clock className="w-4 h-4" />
                    {hour}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hourly Activity */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hourly Activity</h3>
            <p className="text-sm text-gray-600 mb-4">Order distribution throughout the day</p>
            <div className="h-64 flex items-end justify-between gap-1">
              {data.timeAnalysis.hourly.map((hour: any) => {
                const maxOrders = Math.max(...data.timeAnalysis.hourly.map((h: any) => h.orders))
                const height = maxOrders > 0 ? (hour.orders / maxOrders) * 100 : 5
                
                return (
                  <div key={hour.hour} className="flex-1 flex flex-col items-center group">
                    <div className="text-xs text-gray-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap">
                      {hour.orders} orders
                    </div>
                    <div
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                      style={{ height: `${height}%`, minHeight: hour.orders > 0 ? '8px' : '2px' }}
                    />
                    <div className="text-xs text-gray-500 mt-2">{hour.hour.split(':')[0]}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Daily Activity */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Activity</h3>
            <p className="text-sm text-gray-600 mb-4">Order distribution by day of the week</p>
            <div className="h-64 flex items-end justify-between gap-4">
              {data.timeAnalysis.daily.map((day: any) => {
                const maxOrders = Math.max(...data.timeAnalysis.daily.map((d: any) => d.orders))
                const height = maxOrders > 0 ? (day.orders / maxOrders) * 100 : 5
                
                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center group">
                    <div className="text-xs text-gray-600 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white px-2 py-1 rounded whitespace-nowrap">
                      {day.orders} orders
                    </div>
                    <div
                      className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors cursor-pointer"
                      style={{ height: `${height}%`, minHeight: day.orders > 0 ? '12px' : '4px' }}
                    />
                    <div className="text-sm font-medium text-gray-700 mt-3">{day.day}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Time Insights */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Time-Based Insights</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Best Days:</strong> {data.timeAnalysis.daily
                    .sort((a: any, b: any) => b.orders - a.orders)
                    .slice(0, 2)
                    .map((d: any) => d.day)
                    .join(' and ')} have the highest order volume
                </p>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Peak Hours:</strong> Consider staffing up during {data.timeAnalysis.peakHours[0]} for optimal service
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.customers.total}</p>
              <p className="text-sm text-gray-600">Total Customers</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Repeat className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.customers.repeat}</p>
              <p className="text-sm text-gray-600">Repeat Customers</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Percent className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{data.customers.repeatRate}%</p>
              <p className="text-sm text-gray-600">Repeat Rate</p>
            </div>
          </div>

          {/* Customer Insights */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Behavior Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Customer Loyalty</p>
                  <p className="text-sm text-gray-600">
                    {data.customers.repeatRate}% of your customers have made repeat purchases, 
                    indicating {data.customers.repeatRate >= 30 ? 'strong' : 'moderate'} customer loyalty
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Repeat className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Growth Potential</p>
                  <p className="text-sm text-gray-600">
                    You have {data.customers.total - data.customers.repeat} customers who have ordered once. 
                    Focus on retention strategies to convert them into repeat buyers
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          {data.ordersByStatus.length > 0 ? (
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Orders by Status</h3>
              <p className="text-sm text-gray-600 mb-4">Distribution of orders across different statuses</p>
              <div className="space-y-3">
                {data.ordersByStatus.map((status: any) => {
                  const statusColors: Record<string, string> = {
                    PENDING: 'bg-yellow-500',
                    CONFIRMED: 'bg-blue-500',
                    PREPARING: 'bg-orange-500',
                    READY: 'bg-purple-500',
                    OUT_FOR_DELIVERY: 'bg-cyan-500',
                    DELIVERED: 'bg-green-500',
                    CANCELLED: 'bg-red-500',
                    REFUNDED: 'bg-gray-500'
                  }
                  
                  return (
                    <div key={status.status} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-2 h-12 ${statusColors[status.status] || 'bg-teal-500'} rounded`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 capitalize">
                            {status.status.toLowerCase().replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`${statusColors[status.status] || 'bg-teal-500'} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${status.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600 min-w-[60px] text-right">
                              {status.percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-gray-900">{status.count}</p>
                        <p className="text-sm text-gray-600">orders</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600">
                Order status distribution will appear here once you start receiving orders.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}