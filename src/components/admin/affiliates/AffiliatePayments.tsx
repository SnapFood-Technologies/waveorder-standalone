// src/components/admin/affiliates/AffiliatePayments.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  User,
  AlertCircle,
  RefreshCw,
  Loader2,
  TrendingUp,
  Download,
  Link2,
  Unlink2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { fetchAndDownloadAffiliatePaymentsReportPdf } from '@/lib/generateAffiliatePaymentsReportPdf'

interface AffiliatePaymentsProps {
  businessId: string
}

interface AffiliatePayment {
  id: string
  amount: number
  currency: string
  periodStart: string | null
  periodEnd: string | null
  paymentMethod: string | null
  reference: string | null
  notes: string | null
  paidAt: string
  earningsIds: string[]
  affiliate: {
    id: string
    name: string
    email: string | null
  }
}

interface PendingEarningRow {
  id: string
  amount: number
  order: { orderNumber: string }
}

interface TotalsByAffiliate {
  affiliateId: string
  affiliateName: string
  affiliateEmail: string | null
  totalPaid: number
  paymentCount: number
}

export function AffiliatePayments({ businessId }: AffiliatePaymentsProps) {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [currency, setCurrency] = useState('EUR')
  const [payments, setPayments] = useState<AffiliatePayment[]>([])
  const [totalsByAffiliate, setTotalsByAffiliate] = useState<TotalsByAffiliate[]>([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [affiliateFilter, setAffiliateFilter] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [affiliates, setAffiliates] = useState<Array<{ id: string; name: string; email: string | null }>>([])
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [addingPayment, setAddingPayment] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [newPayment, setNewPayment] = useState({
    affiliateId: '',
    amount: '',
    paymentMethod: '',
    reference: '',
    notes: '',
    periodStart: '',
    periodEnd: '',
    paidAt: new Date().toISOString().split('T')[0]
  })
  const [pendingForRecord, setPendingForRecord] = useState<PendingEarningRow[]>([])
  const [loadingPendingForRecord, setLoadingPendingForRecord] = useState(false)
  const [recordSelectedEarningIds, setRecordSelectedEarningIds] = useState<string[]>([])

  const [linkModalPayment, setLinkModalPayment] = useState<AffiliatePayment | null>(null)
  const [pendingForLink, setPendingForLink] = useState<PendingEarningRow[]>([])
  const [linkedOnPayment, setLinkedOnPayment] = useState<PendingEarningRow[]>([])
  const [loadingPendingForLink, setLoadingPendingForLink] = useState(false)
  const [linkModalSelectedIds, setLinkModalSelectedIds] = useState<string[]>([])
  const [unlinkSelectedIds, setUnlinkSelectedIds] = useState<string[]>([])
  /** Which save action is running in the manage-links modal (avoid shared spinner on both buttons) */
  const [linkModalSaving, setLinkModalSaving] = useState<'link' | 'unlink' | null>(null)

  useEffect(() => {
    fetchPayments()
    fetchAffiliates()
  }, [businessId, page, affiliateFilter, dateFilter])

  useEffect(() => {
    if (!showAddPayment || !newPayment.affiliateId) {
      setPendingForRecord([])
      setRecordSelectedEarningIds([])
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingPendingForRecord(true)
      try {
        const params = new URLSearchParams({
          affiliateId: newPayment.affiliateId,
          status: 'PENDING',
          limit: '200',
          page: '1',
        })
        const res = await fetch(
          `/api/admin/stores/${businessId}/affiliates/earnings?${params}`
        )
        const data = await res.json()
        if (cancelled) return
        const rows = (data.data?.earnings || []) as PendingEarningRow[]
        setPendingForRecord(rows)
        setRecordSelectedEarningIds([])
      } catch {
        if (!cancelled) {
          setPendingForRecord([])
          setRecordSelectedEarningIds([])
        }
      } finally {
        if (!cancelled) setLoadingPendingForRecord(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [showAddPayment, newPayment.affiliateId, businessId])

  useEffect(() => {
    if (!linkModalPayment) {
      setPendingForLink([])
      setLinkedOnPayment([])
      setLinkModalSelectedIds([])
      setUnlinkSelectedIds([])
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingPendingForLink(true)
      setLinkModalSelectedIds([])
      setUnlinkSelectedIds([])
      try {
        const pendingParams = new URLSearchParams({
          affiliateId: linkModalPayment.affiliate.id,
          status: 'PENDING',
          limit: '200',
          page: '1',
        })
        const linkedIds = linkModalPayment.earningsIds ?? []
        const linkedUrl =
          linkedIds.length > 0
            ? `/api/admin/stores/${businessId}/affiliates/earnings?ids=${encodeURIComponent(linkedIds.join(','))}`
            : null

        const [pendingRes, linkedRes] = await Promise.all([
          fetch(`/api/admin/stores/${businessId}/affiliates/earnings?${pendingParams}`),
          linkedUrl ? fetch(linkedUrl) : Promise.resolve(null),
        ])

        if (cancelled) return

        const pendingData = await pendingRes.json()
        if (!pendingRes.ok) throw new Error(pendingData.message || 'Failed to load pending')
        setPendingForLink((pendingData.data?.earnings || []) as PendingEarningRow[])

        if (linkedRes) {
          const linkedData = await linkedRes.json()
          if (linkedRes.ok) {
            setLinkedOnPayment((linkedData.data?.earnings || []) as PendingEarningRow[])
          } else {
            setLinkedOnPayment([])
          }
        } else {
          setLinkedOnPayment([])
        }
      } catch {
        if (!cancelled) {
          setPendingForLink([])
          setLinkedOnPayment([])
        }
      } finally {
        if (!cancelled) setLoadingPendingForLink(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [linkModalPayment, businessId])

  const fetchAffiliates = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/affiliates`)
      if (response.ok) {
        const data = await response.json()
        setAffiliates(data.data.affiliates.map((a: any) => ({
          id: a.id,
          name: a.name,
          email: a.email
        })))
      }
    } catch (error) {
      console.error('Error fetching affiliates:', error)
    }
  }

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
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

      const response = await fetch(`/api/admin/stores/${businessId}/affiliates/payments?${params}`)
      
      if (!response.ok) {
        const data = await response.json()
        if (data.enabled === false) {
          setEnabled(false)
          setLoading(false)
          return
        }
        throw new Error(data.message || 'Failed to fetch payments')
      }

      const data = await response.json()
      setEnabled(true)
      setCurrency(data.currency || 'EUR')
      setPayments(data.data.payments || [])
      setTotalsByAffiliate(data.data.totalsByAffiliate || [])
      setGrandTotal(data.data.grandTotal || 0)
      setTotalPages(data.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching affiliate payments:', error)
      toast.error('Failed to load affiliate payments')
    } finally {
      setLoading(false)
    }
  }

  const toggleRecordEarning = (id: string) => {
    setRecordSelectedEarningIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const fillAmountFromSelectedCommissions = () => {
    const sum = pendingForRecord
      .filter((e) => recordSelectedEarningIds.includes(e.id))
      .reduce((s, e) => s + e.amount, 0)
    setNewPayment((p) => ({ ...p, amount: sum > 0 ? sum.toFixed(2) : p.amount }))
  }

  const toggleLinkModalEarning = (id: string) => {
    setLinkModalSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleUnlinkSelection = (id: string) => {
    setUnlinkSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const submitUnlinkFromPayment = async () => {
    if (!linkModalPayment || unlinkSelectedIds.length === 0) {
      toast.error('Select at least one linked commission to remove')
      return
    }
    if (
      !confirm(
        'Remove the selected commissions from this payment? They will go back to pending until you link or pay them again.'
      )
    ) {
      return
    }
    setLinkModalSaving('unlink')
    try {
      const res = await fetch(
        `/api/admin/stores/${businessId}/affiliates/payments/${linkModalPayment.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ removeEarningsIds: unlinkSelectedIds }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to unlink')
      toast.success('Unlinked; commissions are pending again')
      setUnlinkSelectedIds([])
      const p = data.data?.payment as AffiliatePayment | undefined
      if (p) {
        setLinkModalPayment({
          ...p,
          earningsIds: p.earningsIds ?? [],
          affiliate: p.affiliate ?? linkModalPayment.affiliate,
        })
      }
      fetchPayments()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to unlink')
    } finally {
      setLinkModalSaving(null)
    }
  }

  const submitLinkEarningsToPayment = async () => {
    if (!linkModalPayment || linkModalSelectedIds.length === 0) {
      toast.error('Select at least one pending commission to link')
      return
    }
    setLinkModalSaving('link')
    try {
      const res = await fetch(
        `/api/admin/stores/${businessId}/affiliates/payments/${linkModalPayment.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addEarningsIds: linkModalSelectedIds }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to link earnings')
      toast.success('Commissions linked and marked paid')
      setLinkModalPayment(null)
      fetchPayments()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to link')
    } finally {
      setLinkModalSaving(null)
    }
  }

  const handleAddPayment = async () => {
    if (!newPayment.affiliateId || !newPayment.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    setAddingPayment(true)
    try {
      const payload: Record<string, unknown> = {
        affiliateId: newPayment.affiliateId,
        amount: parseFloat(newPayment.amount),
        currency: currency,
        paymentMethod: newPayment.paymentMethod || null,
        reference: newPayment.reference || null,
        notes: newPayment.notes || null,
        periodStart: newPayment.periodStart || null,
        periodEnd: newPayment.periodEnd || null,
        paidAt: newPayment.paidAt,
      }
      if (recordSelectedEarningIds.length > 0) {
        payload.earningsIds = recordSelectedEarningIds
      }

      const response = await fetch(`/api/admin/stores/${businessId}/affiliates/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create payment')
      }

      toast.success(
        recordSelectedEarningIds.length > 0
          ? 'Payment recorded and selected commissions marked paid'
          : 'Payment recorded successfully'
      )
      setShowAddPayment(false)
      setNewPayment({
        affiliateId: '',
        amount: '',
        paymentMethod: '',
        reference: '',
        notes: '',
        periodStart: '',
        periodEnd: '',
        paidAt: new Date().toISOString().split('T')[0]
      })
      setRecordSelectedEarningIds([])
      fetchPayments()
    } catch (error) {
      console.error('Error creating payment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create payment')
    } finally {
      setAddingPayment(false)
    }
  }

  const handleDownloadPdf = async () => {
    setPdfGenerating(true)
    const toastId = toast.loading(
      'Generating PDF... This may take a moment if you have many payments. Please be patient.',
      { duration: 5000 }
    )
    try {
      await fetchAndDownloadAffiliatePaymentsReportPdf(businessId)
      toast.success('PDF downloaded', { id: toastId })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate PDF', { id: toastId })
    } finally {
      setPdfGenerating(false)
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
      day: 'numeric'
    })
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.affiliate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.affiliate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.reference && payment.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Affiliate Payments</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Record and track payments made to affiliates</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownloadPdf}
            disabled={pdfGenerating}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pdfGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </>
            )}
          </button>
          <button
            onClick={fetchPayments}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddPayment(true)}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Paid to Affiliates</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(grandTotal)}</p>
          </div>
          <CreditCard className="w-12 h-12 text-teal-600" />
        </div>
      </div>

      {/* Payments by Affiliate */}
      {totalsByAffiliate.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Payments by Affiliate</h2>
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
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(affiliate.totalPaid)}</p>
                    <p className="text-sm text-gray-500">{affiliate.paymentCount} payment{affiliate.paymentCount !== 1 ? 's' : ''}</p>
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
            placeholder="Search by affiliate name or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
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

      {/* Payments List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        </div>
        
        {filteredPayments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No payments recorded</p>
            <button
              onClick={() => setShowAddPayment(true)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Record First Payment
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked orders</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.affiliate.name}</div>
                        {payment.affiliate.email && (
                          <div className="text-xs text-gray-500">{payment.affiliate.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                        {(payment.earningsIds ?? []).length} order
                        {(payment.earningsIds ?? []).length !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paymentMethod || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.reference || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.periodStart && payment.periodEnd
                          ? `${formatDate(payment.periodStart)} - ${formatDate(payment.periodEnd)}`
                          : 'N/A'
                        }
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.paidAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setLinkModalPayment(payment)}
                          className="inline-flex items-center text-xs font-medium text-teal-700 hover:text-teal-900"
                        >
                          <Link2 className="w-3.5 h-3.5 mr-1" />
                          Manage links
                        </button>
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

      {/* Add Payment Modal */}
      {showAddPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Record Payment</h2>
              <button
                onClick={() => setShowAddPayment(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleAddPayment() }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Affiliate *
                </label>
                <select
                  required
                  value={newPayment.affiliateId}
                  onChange={(e) => setNewPayment({ ...newPayment, affiliateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select affiliate...</option>
                  {affiliates.map((affiliate) => (
                    <option key={affiliate.id} value={affiliate.id}>
                      {affiliate.name}
                    </option>
                  ))}
                </select>
              </div>

              {newPayment.affiliateId && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    Include pending commissions (optional)
                  </p>
                  <p className="text-xs text-gray-600 mb-3">
                    Tick the orders this payout covers. They will be marked paid and linked to this payment.
                  </p>
                  {loadingPendingForRecord ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading pending commissions…
                    </div>
                  ) : pendingForRecord.length === 0 ? (
                    <p className="text-xs text-gray-500">No pending commissions for this affiliate.</p>
                  ) : (
                    <ul className="max-h-40 overflow-y-auto space-y-2 mb-3">
                      {pendingForRecord.map((e) => (
                        <li key={e.id}>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={recordSelectedEarningIds.includes(e.id)}
                              onChange={() => toggleRecordEarning(e.id)}
                              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <span>
                              {e.order.orderNumber} — {formatCurrency(e.amount)}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                  {recordSelectedEarningIds.length > 0 && (
                    <button
                      type="button"
                      onClick={fillAmountFromSelectedCommissions}
                      className="text-xs text-teal-700 font-medium hover:underline"
                    >
                      Set amount to sum of selected ({recordSelectedEarningIds.length})
                    </button>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={newPayment.paymentMethod}
                  onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select method...</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Invoice number, transaction ID, etc."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period Start
                  </label>
                  <input
                    type="date"
                    value={newPayment.periodStart}
                    onChange={(e) => setNewPayment({ ...newPayment, periodStart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period End
                  </label>
                  <input
                    type="date"
                    value={newPayment.periodEnd}
                    onChange={(e) => setNewPayment({ ...newPayment, periodEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paid At *
                </label>
                <input
                  type="date"
                  required
                  value={newPayment.paidAt}
                  onChange={(e) => setNewPayment({ ...newPayment, paidAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Additional notes about this payment..."
                />
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingPayment}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {addingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link pending earnings to an existing payment */}
      {linkModalPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Manage payment links</h2>
              <button
                type="button"
                disabled={linkModalSaving !== null}
                onClick={() => setLinkModalPayment(null)}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-gray-600">
                Payment {formatCurrency(linkModalPayment.amount)} to{' '}
                <span className="font-medium">{linkModalPayment.affiliate.name}</span> (
                {formatDate(linkModalPayment.paidAt)}).
              </p>

              {loadingPendingForLink ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Linked to this payment
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      Unlink to set commissions back to pending (they stay on this affiliate).
                    </p>
                    {linkedOnPayment.length === 0 ? (
                      <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-3">
                        No orders linked yet.
                      </p>
                    ) : (
                      <ul className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                        {linkedOnPayment.map((e) => (
                          <li key={e.id} className="px-3 py-2">
                            <label className="flex items-center gap-3 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={unlinkSelectedIds.includes(e.id)}
                                onChange={() => toggleUnlinkSelection(e.id)}
                                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                              />
                              <span>
                                {e.order.orderNumber} — {formatCurrency(e.amount)}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        disabled={
                          linkModalSaving !== null ||
                          unlinkSelectedIds.length === 0 ||
                          linkedOnPayment.length === 0
                        }
                        onClick={() => void submitUnlinkFromPayment()}
                        className="px-4 py-2 border border-amber-200 bg-amber-50 text-amber-900 rounded-lg hover:bg-amber-100 disabled:opacity-50 inline-flex items-center gap-2 text-sm font-medium"
                      >
                        {linkModalSaving === 'unlink' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Unlinking…
                          </>
                        ) : (
                          <>
                            <Unlink2 className="w-4 h-4" />
                            Unlink selected
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Pending — link to this payment
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      Select commissions to mark paid and attach to this payout.
                    </p>
                    {pendingForLink.length === 0 ? (
                      <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-3">
                        No pending commissions for this affiliate.
                      </p>
                    ) : (
                      <ul className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                        {pendingForLink.map((e) => (
                          <li key={e.id} className="px-3 py-2">
                            <label className="flex items-center gap-3 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={linkModalSelectedIds.includes(e.id)}
                                onChange={() => toggleLinkModalEarning(e.id)}
                                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                              />
                              <span>
                                {e.order.orderNumber} — {formatCurrency(e.amount)}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        disabled={linkModalSaving !== null}
                        onClick={() => setLinkModalPayment(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        disabled={
                          linkModalSaving !== null ||
                          linkModalSelectedIds.length === 0 ||
                          pendingForLink.length === 0
                        }
                        onClick={() => void submitLinkEarningsToPayment()}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        {linkModalSaving === 'link' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Linking…
                          </>
                        ) : (
                          <>
                            <Link2 className="w-4 h-4" />
                            Link selected
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
