// components/admin/dashboard/BusinessStorefrontViewsChart.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar 
} from 'recharts'
import { 
  Eye, 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  LineChart as LineChartIcon,
  RefreshCw,
  Info
} from 'lucide-react'
import { format, parseISO, startOfWeek, startOfMonth, addDays, addWeeks, addMonths } from 'date-fns'

interface PageViewData {
  date: string
  views: number
}

interface BusinessStorefrontViewsChartProps {
  businessId: string
  className?: string
}

type ChartType = 'line' | 'bar'
type TimeGrouping = 'day' | 'week' | 'month'

interface DateRange {
  start: Date
  end: Date
  grouping: TimeGrouping
}

const getDateRange = (period: string): DateRange => {
  const now = new Date()
  let start: Date
  let grouping: TimeGrouping = 'day'

  switch (period) {
    case 'last_7_days':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      grouping = 'day'
      break
    case 'last_30_days':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      grouping = 'day'
      break
    case 'last_3_months':
      start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      grouping = 'week'
      break
    case 'last_6_months':
      start = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      grouping = 'week'
      break
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1)
      grouping = 'month'
      break
    case 'last_year':
      start = new Date(now.getFullYear() - 1, 0, 1)
      grouping = 'month'
      break
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      grouping = 'day'
  }

  return { start, end: now, grouping }
}

const formatXAxisLabel = (dateStr: string, grouping: TimeGrouping): string => {
  const date = parseISO(dateStr)
  
  switch (grouping) {
    case 'day':
      return format(date, 'MMM d')
    case 'week':
      return format(date, 'MMM d')
    case 'month':
      return format(date, 'MMM yyyy')
    default:
      return format(date, 'MMM d')
  }
}

const groupDataByPeriod = (data: PageViewData[], grouping: TimeGrouping): PageViewData[] => {
  if (!data || data.length === 0) return []

  const grouped = new Map<string, number>()

  data.forEach(item => {
    const date = parseISO(item.date)
    let groupKey: string

    switch (grouping) {
      case 'week':
        // Group by week (start of week)
        const weekStart = startOfWeek(date, { weekStartsOn: 1 }) // Monday
        groupKey = format(weekStart, 'yyyy-MM-dd')
        break
      case 'month':
        // Group by month
        const monthStart = startOfMonth(date)
        groupKey = format(monthStart, 'yyyy-MM-dd')
        break
      case 'day':
      default:
        // Keep daily granularity
        groupKey = item.date
        break
    }

    grouped.set(groupKey, (grouped.get(groupKey) || 0) + item.views)
  })

  return Array.from(grouped.entries())
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function BusinessStorefrontViewsChart({ businessId, className = '' }: BusinessStorefrontViewsChartProps) {
  const [data, setData] = useState<PageViewData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('last_30_days')
  const [chartType, setChartType] = useState<ChartType>('line')

  const dateRange = useMemo(() => getDateRange(selectedPeriod), [selectedPeriod])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        range: selectedPeriod === 'last_7_days' ? '7d' :
               selectedPeriod === 'last_30_days' ? '30d' :
               selectedPeriod === 'last_3_months' ? '90d' :
               selectedPeriod === 'last_6_months' ? '90d' :
               selectedPeriod === 'this_year' ? '1y' :
               selectedPeriod === 'last_year' ? '1y' : '30d'
      })

      const response = await fetch(`/api/admin/stores/${businessId}/analytics/page-views?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const result = await response.json()
      setData(result.pageViewsTimeSeries || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedPeriod, businessId])

  // Process data based on selected grouping
  const processedData = useMemo(() => {
    return groupDataByPeriod(data, dateRange.grouping)
  }, [data, dateRange.grouping])

  // Calculate summary stats
  const totalViews = processedData.reduce((sum, item) => sum + item.views, 0)
  const avgViews = processedData.length > 0 ? Math.round(totalViews / processedData.length) : 0
  const maxViews = processedData.length > 0 ? Math.max(...processedData.map(item => item.views)) : 0

  // Calculate trend (comparing first half vs second half)
  const midPoint = Math.floor(processedData.length / 2)
  const firstHalf = processedData.slice(0, midPoint)
  const secondHalf = processedData.slice(midPoint)
  
  const firstHalfAvg = firstHalf.length > 0 ? firstHalf.reduce((sum, item) => sum + item.views, 0) / firstHalf.length : 0
  const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, item) => sum + item.views, 0) / secondHalf.length : 0
  
  const trendPercentage = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-gray-600 text-sm mb-1">
            {formatXAxisLabel(label, dateRange.grouping)}
          </p>
          <p className="text-gray-900 font-semibold">
            {payload[0].value.toLocaleString()} views
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-48"></div>
            <div className="h-8 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Info className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}>
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Storefront Page Views</h3>
            <p className="text-sm text-gray-600">Views for your storefront</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Time Period Selector */}
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="this_year">This Year</option>
            <option value="last_year">Last Year</option>
          </select>

          {/* Chart Type Selector */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                chartType === 'line' 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                chartType === 'bar' 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
            </div>
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg per {dateRange.grouping === 'day' ? 'Day' : dateRange.grouping === 'week' ? 'Week' : 'Month'}
              </p>
              <p className="text-2xl font-bold text-gray-900">{avgViews.toLocaleString()}</p>
            </div>
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Trend</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-900">
                  {Math.abs(trendPercentage).toFixed(1)}%
                </p>
                {trendPercentage >= 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />
                )}
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              trendPercentage >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <TrendingUp className={`w-5 h-5 ${
                trendPercentage >= 0 ? 'text-green-600' : 'text-red-600 rotate-180'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {processedData.length > 0 ? (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatXAxisLabel(value, dateRange.grouping)}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#059669" 
                  strokeWidth={3}
                  dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#059669' }}
                />
              </LineChart>
            ) : (
              <BarChart data={processedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatXAxisLabel(value, dateRange.grouping)}
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="views" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Eye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p>No page view data available for this period</p>
          </div>
        </div>
      )}
    </div>
  )
}
