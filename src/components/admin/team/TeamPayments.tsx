// src/components/admin/team/TeamPayments.tsx
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
  Users
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TeamPaymentsProps {
  businessId: string
}

interface TeamMemberPayment {
  id: string
  amount: number
  currency: string
  paidFrom: string | null
  paidAt: string
  notes: string | null
  paymentMethod: string
  user: { id: string; name: string | null; email: string | null }
  recordedBy?: { id: string; name: string | null; email: string | null } | null
}

interface TotalsByMember {
  userId: string
  userName: string
  userEmail: string | null
  totalPaid: number
  paymentCount: number
}

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string | null
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'PAYPAL', label: 'PayPal' },
  { value: 'OTHER', label: 'Other' }
]

export function TeamPayments({ businessId }: TeamPaymentsProps) {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [currency, setCurrency] = useState('EUR')
  const [payments, setPayments] = useState<TeamMemberPayment[]>([])
  const [totalsByMember, setTotalsByMember] = useState<TotalsByMember[]>([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [memberFilter, setMemberFilter] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [addingPayment, setAddingPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({
    userId: '',
    amount: '',
    paidFrom: '',
    paidAt: new Date().toISOString().split('T')[0],
    notes: '',
    paymentMethod: 'BANK'
  })

  useEffect(() => {
    fetchPayments()
    fetchMembers()
  }, [businessId, page, memberFilter, dateFilter])

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/team/members`)
      if (response.ok) {
        const data = await response.json()
        setMembers((data.members || []).map((m: { userId: string; name: string; email: string | null }) => ({
          id: m.userId,
          userId: m.userId,
          name: m.name,
          email: m.email
        })))
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const fetchPayments = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (memberFilter !== 'ALL') params.append('userId', memberFilter)
      if (dateFilter !== 'all') {
        const now = new Date()
        let startDate: Date
        if (dateFilter === 'today') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        } else if (dateFilter === 'week') {
          startDate = new Date(now)
          startDate.setDate(startDate.getDate() - 7)
        } else {
          startDate = new Date(now)
          startDate.setMonth(startDate.getMonth() - 1)
        }
        params.append('startDate', startDate.toISOString())
        params.append('endDate', new Date().toISOString())
      }
      params.append('page', page.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/admin/stores/${businessId}/team-payments?${params}`)

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
      setTotalsByMember(data.data.totalsByMember || [])
      setGrandTotal(data.data.grandTotal || 0)
      setTotalPages(data.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching team payments:', error)
      toast.error('Failed to load team payments')
    } finally {
      setLoading(false)
    }
  }

  const openAddPayment = (memberId?: string) => {
    setNewPayment({
      userId: memberId ?? '',
      amount: '',
      paidFrom: '',
      paidAt: new Date().toISOString().split('T')[0],
      notes: '',
      paymentMethod: 'BANK'
    })
    setShowAddPayment(true)
  }

  const handleAddPayment = async () => {
    if (!newPayment.userId || !newPayment.amount || !newPayment.paymentMethod) {
      toast.error('Please fill in team member, amount, and payment method')
      return
    }

    setAddingPayment(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/team-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newPayment.userId,
          amount: parseFloat(newPayment.amount),
          currency,
          paidFrom: newPayment.paidFrom || null,
          paidAt: newPayment.paidAt,
          notes: newPayment.notes || null,
          paymentMethod: newPayment.paymentMethod
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create payment')
      }

      toast.success('Payment recorded successfully')
      setShowAddPayment(false)
      setNewPayment({
        userId: '',
        amount: '',
        paidFrom: '',
        paidAt: new Date().toISOString().split('T')[0],
        notes: '',
        paymentMethod: 'BANK'
      })
      fetchPayments()
      fetchMembers()
    } catch (error) {
      console.error('Error creating payment:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create payment')
    } finally {
      setAddingPayment(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
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

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      (payment.user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.notes?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.paidFrom?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
                Team Payment Tracking Not Enabled
              </h3>
              <p className="text-yellow-800">
                Team payment tracking is not enabled for this business. Please contact support to enable this feature.
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
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Team Payments</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Record and track internal payments to team members
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchPayments}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => openAddPayment()}
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
            <p className="text-sm text-gray-600">Total Paid to Team</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(grandTotal)}</p>
          </div>
          <CreditCard className="w-12 h-12 text-teal-600" />
        </div>
      </div>

      {/* Payments by Member */}
      {totalsByMember.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Payments by Team Member</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {totalsByMember.map((member) => (
              <div key={member.userId} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.userName}</p>
                    {member.userEmail && (
                      <p className="text-sm text-gray-500">{member.userEmail}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(member.totalPaid)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {member.paymentCount} payment{member.paymentCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => openAddPayment(member.userId)}
                    className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Record
                  </button>
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
            placeholder="Search by name, email, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={memberFilter}
            onChange={(e) => {
              setMemberFilter(e.target.value)
              setPage(1)
            }}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="ALL">All Team Members</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name}
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
              onClick={() => openAddPayment()}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Member
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid From
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid At
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.user.name || 'Unknown'}
                        </div>
                        {payment.user.email && (
                          <div className="text-xs text-gray-500">{payment.user.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.paidFrom || '—'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.paidAt)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {payment.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-700">Page {page} of {totalPages}</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAddPayment()
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Member *</label>
                <select
                  required
                  value={newPayment.userId}
                  onChange={(e) => setNewPayment({ ...newPayment, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select team member...</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  required
                  value={newPayment.paymentMethod}
                  onChange={(e) =>
                    setNewPayment({ ...newPayment, paymentMethod: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid From</label>
                <input
                  type="text"
                  value={newPayment.paidFrom}
                  onChange={(e) => setNewPayment({ ...newPayment, paidFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. Main account, Petty cash"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paid At *</label>
                <input
                  type="date"
                  required
                  value={newPayment.paidAt}
                  onChange={(e) => setNewPayment({ ...newPayment, paidAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
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
    </div>
  )
}
