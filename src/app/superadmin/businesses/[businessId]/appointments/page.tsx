'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Scissors,
  Search,
  Filter,
  X,
  Eye,
  Phone,
  Clock,
  BarChart3,
  LineChart as LineChartIcon,
  RefreshCw,
  Info,
  User
} from 'lucide-react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { format, parseISO, startOfWeek, startOfMonth } from 'date-fns'

interface BusinessAppointmentStats {
  business: {
    id: string
    name: string
    currency: string
    businessType?: string
  }
  stats: {
    totalAppointments: number
    totalRevenue: number
    averageAppointmentValue: number
    completionRate: number
    statusBreakdown: Record<string, number>
  }
  chartData: Array<{ date: string; appointments: number }>
  appointments: Array<{
    id: string
    orderId: string
    orderNumber: string
    status: string
    appointmentDate: string
    startTime: string
    endTime: string
    duration: number
    total: number
    customerName: string
    customerPhone: string
    customerEmail: string | null
    staffName: string | null
    createdAt: string
    updatedAt: string
    itemCount: number
  }>
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

type ChartType = 'line' | 'bar'
type TimePeriod = 'last_7_days' | 'last_30_days' | 'last_3_months' | 'last_6_months' | 'this_year' | 'last_year'

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#fbbf24',
  CONFIRMED: '#3b82f6',
  IN_PROGRESS: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  NO_SHOW: '#6b7280'
}

const PIE_COLORS = ['#059669', '#3b82f6', '#8b5cf6', '#10b981', '#06b6d4', '#fbbf24', '#ef4444', '#6b7280']

export default function BusinessAppointmentsStatsPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string
  
  // In superadmin, always add impersonation params
  const addParams = (href: string) => {
    try {
      const url = new URL(href, window.location.origin)
      url.searchParams.set('impersonate', 'true')
      url.searchParams.set('businessId', businessId)
      return url.pathname + url.search
    } catch (error) {
      return `${href}?impersonate=true&businessId=${businessId}`
    }
  }

  const [data, setData] = useState<BusinessAppointmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('last_30_days')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchData()
  }, [businessId, selectedPeriod, currentPage, debouncedSearchQuery, filterStatus])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        period: selectedPeriod
      })

      if (debouncedSearchQuery.trim()) params.append('search', debouncedSearchQuery.trim())
      if (filterStatus !== 'all') params.append('status', filterStatus)

      const response = await fetch(`/api/superadmin/businesses/${businessId}/appointments/stats?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to fetch business appointment stats (${response.status})`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching appointment stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    const symbol = data?.business.currency === 'EUR' ? '€' :
                   data?.business.currency === 'USD' ? '$' :
                   data?.business.currency === 'GBP' ? '£' :
                   data?.business.currency === 'ALL' ? 'L' :
                   data?.business.currency || ''
    return `${symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const formatStatusLabel = (status: string): string => {
    return status.replace('_', ' ')
  }

  const getStatusColor = (status: string): string => {
    return STATUS_COLORS[status] || '#6b7280'
  }

  // Process chart data based on period
  const processedChartData = data?.chartData.map(item => ({
    ...item,
    label: formatXAxisLabel(item.date, selectedPeriod === 'last_7_days' || selectedPeriod === 'last_30_days' ? 'day' :
                             selectedPeriod === 'last_3_months' || selectedPeriod === 'last_6_months' ? 'week' :
                             'month')
  })) || []

  const formatXAxisLabel = (dateStr: string, grouping: 'day' | 'week' | 'month'): string => {
    const date = parseISO(dateStr)
    switch (grouping) {
      case 'week':
        return format(startOfWeek(date, { weekStartsOn: 1 }), 'MMM d')
      case 'month':
        return format(startOfMonth(date), 'MMM yyyy')
      case 'day':
      default:
        return format(date, 'MMM d')
    }
  }

  // Prepare status breakdown for pie chart
  const statusChartData = data?.stats.statusBreakdown ? Object.entries(data.stats.statusBreakdown).map(([status, count]) => ({
    name: formatStatusLabel(status),
    value: count,
    status
  })) : []

  const clearFilters = () => {
    setFilterStatus('all')
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setCurrentPage(1)
  }

  const activeFiltersCount = [
    filterStatus !== 'all',
    debouncedSearchQuery.trim()
  ].filter(Boolean).length

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
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
      </div>
    )
  }

  if (!data) {
    return null
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-gray-600 text-sm mb-1">{label}</p>
          <p className="text-gray-900 font-semibold">
            {payload[0].value} {payload[0].value === 1 ? 'appointment' : 'appointments'}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/superadmin/businesses/${businessId}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Business Details
        </Link>
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointment Statistics</h1>
            <p className="text-gray-600 mt-1">
              Appointments for <span className="font-medium">{data.business.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{data.stats.totalAppointments}</p>
            </div>
            <Calendar className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(data.stats.totalRevenue)}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Appointment Value</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(data.stats.averageAppointmentValue)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {data.stats.completionRate.toFixed(1)}%
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-teal-500" />
          </div>
        </div>
      </div>

      {/* Appointments Over Time Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Appointments Over Time</h3>
              <p className="text-sm text-gray-600">All appointments for this business</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
            >
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="this_year">This Year</option>
              <option value="last_year">Last Year</option>
            </select>

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

        {processedChartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={processedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="appointments" 
                    stroke="#059669" 
                    strokeWidth={3}
                    dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#059669' }}
                  />
                </LineChart>
              ) : (
                <BarChart data={processedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="appointments" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p>No appointment data available for this period</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Breakdown */}
      {statusChartData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Appointment Status Breakdown</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => {
                      const total = statusChartData.reduce((sum, item) => sum + item.value, 0)
                      const percent = total > 0 ? (entry.value / total) * 100 : 0
                      return `${entry.name}: ${percent.toFixed(0)}%`
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {statusChartData.map((item, index) => (
                <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{item.value}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({data.stats.totalAppointments > 0
                        ? ((item.value / data.stats.totalAppointments) * 100).toFixed(1)
                        : '0.0'
                      }%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Appointments List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Filters and Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by appointment number, customer name, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 py-2 border rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-teal-50 border-teal-200 text-teal-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 bg-teal-100 text-teal-800 text-xs rounded-full px-2 py-1">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <div className="text-sm text-gray-600">
                {data.pagination.total} appointments
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="REQUESTED">Requested</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="NO_SHOW">No Show</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Appointments Table */}
        {data.appointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {debouncedSearchQuery || activeFiltersCount > 0 ? 'No appointments found' : 'No appointments yet'}
            </h3>
            <p className="text-gray-600">
              {debouncedSearchQuery || activeFiltersCount > 0
                ? 'Try adjusting your search terms or filters.'
                : 'This business has not received any appointments yet.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.appointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Scissors className="w-5 h-5 text-teal-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              #{appointment.orderNumber}
                            </div>
                            <div className="text-xs text-gray-500">
                              {appointment.itemCount} {appointment.itemCount === 1 ? 'service' : 'services'}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.customerName}
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Phone className="w-3 h-3 mr-1" />
                            {appointment.customerPhone}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {format(new Date(appointment.appointmentDate), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center justify-center text-xs text-gray-600">
                            <Clock className="w-3 h-3 mr-1" />
                            {appointment.startTime} - {appointment.endTime}
                          </div>
                          <div className="text-xs text-gray-500">
                            {appointment.duration} min
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        {appointment.staffName ? (
                          <div className="flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">{appointment.staffName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 text-center">
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: `${getStatusColor(appointment.status)}20`,
                            color: getStatusColor(appointment.status)
                          }}
                        >
                          {formatStatusLabel(appointment.status)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(appointment.total)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(appointment.createdAt)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={addParams(`/admin/stores/${businessId}/appointments/${appointment.id}`)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-700">
                    Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                    {data.pagination.total} appointments
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={data.pagination.page === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="px-3 py-1 text-sm">
                      Page {data.pagination.page} of {data.pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, data.pagination.pages))}
                      disabled={data.pagination.page === data.pagination.pages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
