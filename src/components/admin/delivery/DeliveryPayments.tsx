// src/components/admin/delivery/DeliveryPayments.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  CreditCard,
  Truck,
  User,
  Plus,
  Search,
  Filter,
  Calendar,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle,
  Edit2,
  Trash2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface DeliveryPaymentsProps {
  businessId: string
}

interface DeliveryPayment {
  id: string
  amount: number
  currency: string
  periodStart: string | null
  periodEnd: string | null
  paymentMethod: string | null
  reference: string | null
  notes: string | null
  paidAt: string
  createdAt: string
  deliveryPerson: {
    id: string
    name: string
    email: string
  }
  earningsIds: string[]
}

interface TotalsByPerson {
  deliveryPersonId: string
  deliveryPersonName: string
  deliveryPersonEmail: string
  totalPaid: number
  paymentCount: number
}

export default function DeliveryPayments({ businessId }: DeliveryPaymentsProps) {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [currency, setCurrency] = useState('EUR')
  const [payments, setPayments] = useState<DeliveryPayment[]>([])
  const [totalsByPerson, setTotalsByPerson] = useState<TotalsByPerson[]>([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [personFilter, setPersonFilter] = useState<string>('ALL')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deliveryPersons, setDeliveryPersons] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [addingPayment, setAddingPayment] = useState(false)
  const [newPayment, setNewPayment] = useState({
    deliveryPersonId: '',
    amount: '',
    paymentMethod: '',
    reference: '',
    notes: '',
    periodStart: '',
    periodEnd: '',
    paidAt: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchPayments()
    fetchDeliveryPersons()
  }, [businessId, page, personFilter, dateFilter])

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

  const fetchPayments = async () => {
    try {
      setLoading(true)
      
      // Build query params
      const params = new URLSearchParams()
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

      const response = await fetch(`/api/admin/stores/${businessId}/delivery/payments?${params}`)
      
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
      setTotalsByPerson(data.data.totalsByPerson || [])
      setGrandTotal(data.data.grandTotal || 0)
      setTotalPages(data.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Error fetching delivery payments:', error)
      toast.error('Failed to load delivery payments')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = async () => {
    if (!newPayment.deliveryPersonId || !newPayment.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    setAddingPayment(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/delivery/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryPersonId: newPayment.deliveryPersonId,
          amount: parseFloat(newPayment.amount),
          currency: currency,
          paymentMethod: newPayment.paymentMethod || null,
          reference: newPayment.reference || null,
          notes: newPayment.notes || null,
          periodStart: newPayment.periodStart || null,
          periodEnd: newPayment.periodEnd || null,
          paidAt: newPayment.paidAt
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create payment')
      }

      toast.success('Payment recorded successfully')
      setShowAddPayment(false)
      setNewPayment({
        deliveryPersonId: '',
        amount: '',
        paymentMethod: '',
        reference: '',
        notes: '',
        periodStart: '',
        periodEnd: '',
        paidAt: new Date().toISOString().split('T')[0]
      })
      fetchPayments()
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

  // Filter payments by search term
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.deliveryPerson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.deliveryPerson.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Delivery Payments</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Record and track payments made to delivery staff</p>
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
            <p className="text-sm text-gray-600">Total Paid to Delivery Persons</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(grandTotal)}</p>
          </div>
          <CreditCard className="w-12 h-12 text-teal-600" />
        </div>
      </div>

      {/* Payments by Person */}
      {totalsByPerson.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Payments by Delivery Person</h2>
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
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(person.totalPaid)}</p>
                    <p className="text-sm text-gray-500">{person.paymentCount} payment{person.paymentCount !== 1 ? 's' : ''}</p>
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
            placeholder="Search by delivery person or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Person</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.paidAt)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.deliveryPerson.name}</div>
                        <div className="text-xs text-gray-500">{payment.deliveryPerson.email}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</div>
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
                          : 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {payment.notes || '-'}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Record Payment</h2>
              <button
                onClick={() => setShowAddPayment(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Person *
                </label>
                <select
                  value={newPayment.deliveryPersonId}
                  onChange={(e) => setNewPayment({ ...newPayment, deliveryPersonId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  <option value="">Select delivery person</option>
                  {deliveryPersons.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} ({person.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPayment.amount}
                  onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select method</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                    <option value="mobile_payment">Mobile Payment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={newPayment.paidAt}
                    onChange={(e) => setNewPayment({ ...newPayment, paidAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  value={newPayment.reference}
                  onChange={(e) => setNewPayment({ ...newPayment, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Additional notes about this payment..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingPayment}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
