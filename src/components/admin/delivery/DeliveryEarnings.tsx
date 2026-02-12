// src/components/admin/delivery/DeliveryEarnings.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Coins,
  Truck,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  User,
  Package,
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DeliveryEarningsProps {
  businessId: string
}

interface DeliveryEarning {
  id: string
  amount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  deliveredAt: string | null
  order: {
    orderNumber: string
    status: string
    deliveryAddress: string | null
    deliveredAt: string | null
  }
  deliveryPerson: {
    id: string
    name: string
    email: string
  }
}

interface SummaryData {
  grandTotal: number
  totalOrders: number
  pendingTotal: number
  pendingOrders: number
  paidTotal: number
  paidOrders: number
}

interface TotalsByPerson {
  deliveryPersonId: string
  deliveryPersonName: string
  deliveryPersonEmail: string
  totalEarnings: number
  orderCount: number
}

export function DeliveryEarnings({ businessId }: DeliveryEarningsProps) {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [currency, setCurrency] = useState('EUR')
  const [earnings, setEarnings] = useState<DeliveryEarning[]>([])
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [totalsByPerson, setTotalsByPerson] = useState<TotalsByPerson[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [personFilter, setPersonFilter] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deliveryPersons, setDeliveryPersons] = useState<Array<{ id: string; name: string; email: string }>>([])

  useEffect(() => {
    fetchEarnings()
    fetchDeliveryPersons()
  }, [businessId, page, statusFilter, personFilter, dateFilter])

  const fetchDeliveryPersons = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/team/members`)
      if (response.ok) {
        const data = await response.json()
        const deliveryPersonsList = data.members
          .filter((m: any) => m.role === 'DELIVERY')
          .map((m: any) => ({
            id: m.userId,
            name: m.name,
            email: m.email
          }))
        setDeliveryPersons(deliveryPersonsList)
      }
    } catch (error) {
      console.error('Error fetching delivery persons:', error)
    }
  }

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      
      // Build query params
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      if (personFilter !== 'ALL') {
        params.append('deliveryPersonId', personFilter)
      }
      if (dateFilter !== 'all') {
        const now = new Date()
        let startDate: Date
        if (dateFilter === 'today') {
          startDate = new Date(now.setHours(0, 0, 0, 0))
        } else if (dateFilter === 'week') {
          startDate = new Date(now.setDate(now.getDate() - 7))
        } else {
          startDate = new Date(now.setMonth(now.getMonth() - 1))
        }
        params.append('startDate', startDate.toISOString())
        params.append('endDate', new Date().toISOString())
      }
      params.append('page', page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/admin/stores/${businessId}/delivery/earnings?${params}`)
      
      if (!response.ok) {
        const data = await response.json()
        if (data.enabled === false) {
          setEnabled(false)
          setLoading(false)
          return
        }
        throw new Error(data.message || 'Failed to fetch earnings')
      }

      const data = await response.json()
      setEnabled(true)
      setCurrency(data.currency || 'EUR')
      setEarnings(data.data.earnings || [])
      setSummary(data.data.summary || null)
      setTotalsByPerson(data.data.totalsByPerson || [])
      setTotalPages(data.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching delivery earnings:', error)
      toast.error('Failed to load delivery earnings')
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-gray-600" />
      default:
        return null
    }
  }

  // Filter earnings by search term
  const filteredEarnings = earnings.filter(earning => {
    const matchesSearch = 
      earning.order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.deliveryPerson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.deliveryPerson.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (earning.order.deliveryAddress && earning.order.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSearch
  })

  if (!enabled) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Delivery Management Not Enabled
              </h3>
              <p className="text-yellow-800">
                Delivery management is not enabled for this business. Please contact support to enable this feature.
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Delivery Earnings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track delivery fees earned by delivery staff</p>
        </div>
        <button
          onClick={fetchEarnings}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Coins className="w-5 h-5 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.grandTotal)}</p>
            <p className="text-sm text-gray-600">Total Earnings</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.pendingTotal)}</p>
            <p className="text-sm text-gray-600">Pending ({summary.pendingOrders} orders)</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.paidTotal)}</p>
            <p className="text-sm text-gray-600">Paid ({summary.paidOrders} orders)</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.totalOrders}</p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>
        </div>
      )}

      {/* Earnings by Person */}
      {totalsByPerson.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Earnings by Delivery Person</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {totalsByPerson.map((person) => (
              <div key={person.deliveryPersonId} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{person.deliveryPersonName}</p>
                      <p className="text-sm text-gray-500">{person.deliveryPersonEmail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(person.totalEarnings)}</p>
                    <p className="text-sm text-gray-500">{person.orderCount} order{person.orderCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number, delivery person, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={personFilter}
            onChange={(e) => {
              setPersonFilter(e.target.value)
              setPage(1)
            }}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="ALL">All Delivery Persons</option>
            {deliveryPersons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')
              setPage(1)
            }}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Earnings List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Earnings History</h2>
        </div>
        
        {filteredEarnings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No earnings found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Person</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEarnings.map((earning) => (
                    <tr key={earning.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{earning.order.orderNumber}</div>
                        <div className="text-xs text-gray-500">{earning.order.status}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{earning.deliveryPerson.name}</div>
                        <div className="text-xs text-gray-500">{earning.deliveryPerson.email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(earning.amount)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(earning.status)}`}>
                          {getStatusIcon(earning.status)}
                          <span className="ml-1">{earning.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(earning.deliveredAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {earning.order.deliveryAddress || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
