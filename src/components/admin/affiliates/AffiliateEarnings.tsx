// src/components/admin/affiliates/AffiliateEarnings.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  Coins,
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
  Plus,
  X
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface AffiliateEarningsProps {
  businessId: string
}

interface AffiliateEarning {
  id: string
  amount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  orderCompletedAt: string | null
  order: {
    orderNumber: string
    status: string
    total: number
  }
  affiliate: {
    id: string
    name: string
    email: string | null
    trackingCode: string
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

interface TotalsByAffiliate {
  affiliateId: string
  affiliateName: string
  affiliateEmail: string | null
  totalEarnings: number
  orderCount: number
}

export function AffiliateEarnings({ businessId }: AffiliateEarningsProps) {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [currency, setCurrency] = useState('EUR')
  const [earnings, setEarnings] = useState<AffiliateEarning[]>([])
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [totalsByAffiliate, setTotalsByAffiliate] = useState<TotalsByAffiliate[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [affiliateFilter, setAffiliateFilter] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [affiliates, setAffiliates] = useState<Array<{ id: string; name: string }>>([])

  // Manual earning modal
  const [showManualModal, setShowManualModal] = useState(false)
  const [eligibleOrders, setEligibleOrders] = useState<Array<{
    id: string
    orderNumber: string
    total: number
    status: string
    createdAt: string
    customerName: string | null
  }>>([])
  const [manualAffiliateId, setManualAffiliateId] = useState('')
  const [manualOrderId, setManualOrderId] = useState('')
  const [manualCommissionType, setManualCommissionType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE')
  const [manualCommissionValue, setManualCommissionValue] = useState('')
  const [manualSubmitting, setManualSubmitting] = useState(false)
  const [loadingEligible, setLoadingEligible] = useState(false)

  useEffect(() => {
    fetchEarnings()
    fetchAffiliates()
  }, [businessId, page, statusFilter, affiliateFilter, dateFilter])

  const fetchAffiliates = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/affiliates`)
      if (response.ok) {
        const data = await response.json()
        setAffiliates(data.data.affiliates.map((a: any) => ({ id: a.id, name: a.name })))
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error)
    }
  }

  const fetchEligibleOrders = async () => {
    setLoadingEligible(true)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/affiliates/earnings/eligible-orders`)
      const data = await res.json()
      if (data.enabled && data.data?.orders) {
        setEligibleOrders(data.data.orders)
      } else {
        setEligibleOrders([])
      }
    } catch (error) {
      console.error('Error fetching eligible orders:', error)
      setEligibleOrders([])
    } finally {
      setLoadingEligible(false)
    }
  }

  const openManualModal = () => {
    setShowManualModal(true)
    setManualAffiliateId('')
    setManualOrderId('')
    setManualCommissionType('PERCENTAGE')
    setManualCommissionValue('')
    fetchEligibleOrders()
  }

  const handleManualEarningSubmit = async () => {
    if (!manualAffiliateId || !manualOrderId || !manualCommissionValue.trim()) {
      toast.error('Please select affiliate, order, and enter commission value')
      return
    }
    const val = parseFloat(manualCommissionValue)
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid commission value')
      return
    }
    if (manualCommissionType === 'PERCENTAGE' && (val > 100 || val < 0)) {
      toast.error('Percentage must be between 0 and 100')
      return
    }
    setManualSubmitting(true)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/affiliates/earnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: manualAffiliateId,
          orderId: manualOrderId,
          commissionType: manualCommissionType,
          commissionValue: val
        })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create earning')
      }
      toast.success('Manual earning created')
      setShowManualModal(false)
      fetchEarnings()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create earning')
    } finally {
      setManualSubmitting(false)
    }
  }

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }
      if (affiliateFilter !== 'ALL') {
        params.append('affiliateId', affiliateFilter)
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

      const response = await fetch(`/api/admin/stores/${businessId}/affiliates/earnings?${params}`)
      
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
      setTotalsByAffiliate(data.data.totalsByAffiliate || [])
      setTotalPages(data.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching affiliate earnings:', error)
      toast.error('Failed to load affiliate earnings')
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

  const filteredEarnings = earnings.filter(earning => {
    const matchesSearch = 
      earning.order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      earning.affiliate.trackingCode.toLowerCase().includes(searchTerm.toLowerCase())
    
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Affiliate Earnings</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Track commissions earned by affiliates</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openManualModal}
            disabled={affiliates.length === 0}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Manual Earning
          </button>
          <button
            onClick={fetchEarnings}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
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

      {/* Earnings by Affiliate */}
      {totalsByAffiliate.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Earnings by Affiliate</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {totalsByAffiliate.map((affiliate) => (
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order number, affiliate name, or tracking code..."
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
            value={affiliateFilter}
            onChange={(e) => {
              setAffiliateFilter(e.target.value)
              setPage(1)
            }}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="ALL">All Affiliates</option>
            {affiliates.map((affiliate) => (
              <option key={affiliate.id} value={affiliate.id}>
                {affiliate.name}
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
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No earnings found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed At</th>
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
                        <div className="text-sm text-gray-900">{earning.affiliate.name}</div>
                        <div className="text-xs text-gray-500">{earning.affiliate.trackingCode}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(earning.order.total)}</div>
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
                        {formatDate(earning.orderCompletedAt)}
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

      {/* Manual Earning Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowManualModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Add Manual Earning</h2>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Assign an affiliate commission to a delivered and paid order that has no earning yet.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Affiliate</label>
                  <select
                    value={manualAffiliateId}
                    onChange={(e) => setManualAffiliateId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select affiliate</option>
                    {affiliates.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <select
                    value={manualOrderId}
                    onChange={(e) => setManualOrderId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={loadingEligible}
                  >
                    <option value="">
                      {loadingEligible ? 'Loading...' : eligibleOrders.length === 0 ? 'No eligible orders' : 'Select order'}
                    </option>
                    {eligibleOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.orderNumber} {o.customerName ? `(${o.customerName})` : ''} — {formatCurrency(o.total)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Commission type</label>
                  <select
                    value={manualCommissionType}
                    onChange={(e) => setManualCommissionType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="PERCENTAGE">Percentage of order total</option>
                    <option value="FIXED">Fixed amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {manualCommissionType === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={manualCommissionType === 'PERCENTAGE' ? 100 : undefined}
                    step={manualCommissionType === 'PERCENTAGE' ? 0.5 : 0.01}
                    value={manualCommissionValue}
                    onChange={(e) => setManualCommissionValue(e.target.value)}
                    placeholder={manualCommissionType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 5.00'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                  {manualOrderId && manualCommissionValue && (
                    <p className="mt-1 text-xs text-gray-500">
                      Commission: {formatCurrency(
                        manualCommissionType === 'PERCENTAGE'
                          ? (eligibleOrders.find((o) => o.id === manualOrderId)?.total ?? 0) * (parseFloat(manualCommissionValue) || 0) / 100
                          : parseFloat(manualCommissionValue) || 0
                      )}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualEarningSubmit}
                  disabled={manualSubmitting || !manualAffiliateId || !manualOrderId || !manualCommissionValue.trim()}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {manualSubmitting ? 'Adding...' : 'Add Earning'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
