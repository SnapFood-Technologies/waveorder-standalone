'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Send,
  CheckCircle,
  XCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react'

interface Activity {
  id: string
  logType: string
  status: 'sent' | 'error'
  orderNumber: string
  orderId: string | null
  businessId: string | null
  businessName: string
  businessSlug: string | null
  businessType: string | null
  messageType: string
  template: string
  phone: string | null
  errorMessage: string | null
  createdAt: string
}

/** Template = which Twilio template was used. Derived from business type (matches .env: CONTENT_SID / APPOINTMENT / SERVICE_REQUEST) */
function getTemplateFromBusinessType(businessType: string | null, messageType: string): string {
  if (businessType === 'SALON') return 'Appointment'
  if (businessType === 'SERVICES') return messageType === 'service_request_notification' ? 'Service request' : 'Appointment'
  return 'Order' // RESTAURANT, RETAIL, or null
}

function getReferenceLabel(businessType: string | null, messageType: string, orderNumber: string): string {
  const ref = orderNumber && orderNumber !== '-' ? `#${orderNumber}` : ''
  if (businessType === 'SALON' || (businessType === 'SERVICES' && messageType !== 'service_request_notification')) return ref ? `Booking ${ref}` : 'Booking'
  if (messageType === 'service_request_notification') return 'Service Request'
  return ref ? `Order ${ref}` : 'Order'
}

interface ApiResponse {
  activities: Activity[]
  businesses: Array<{ id: string; name: string; slug: string }>
  pagination: { page: number; limit: number; total: number; pages: number }
}

export default function TwilioActivitiesPage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    businessId: '',
    status: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchData()
  }, [currentPage, filters])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      })
      if (filters.businessId) params.set('businessId', filters.businessId)
      if (filters.status) params.set('status', filters.status)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)

      const response = await fetch(`/api/superadmin/system/twilio-activities?${params}`)
      if (!response.ok) throw new Error('Failed to fetch Twilio activities')
      const result: ApiResponse = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

  const clearFilters = () => {
    setFilters({ businessId: '', status: '', startDate: '', endDate: '' })
    setCurrentPage(1)
  }

  const activeFiltersCount = [filters.businessId, filters.status, filters.startDate, filters.endDate].filter(Boolean).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Twilio Activities</h1>
        <p className="text-gray-600 mt-1">WhatsApp message sends and errors across all businesses</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-900">
                Clear filters
              </button>
            )}
            <button onClick={fetchData} className="p-2 text-gray-600 hover:text-gray-900">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
              <select
                value={filters.businessId}
                onChange={(e) => setFilters({ ...filters, businessId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Businesses</option>
                {data?.businesses.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All</option>
                <option value="sent">Sent</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Activity list */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading activities...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-600">{error}</p>
            <button onClick={fetchData} className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
              Retry
            </button>
          </div>
        ) : !data?.activities.length ? (
          <div className="p-12 text-center">
            <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No Twilio activities found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.activities.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(a.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        {a.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" />
                            Message sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3" />
                            Error
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {getReferenceLabel(a.businessType, a.messageType, a.orderNumber)}
                      </td>
                      <td className="px-4 py-3">
                        {a.businessId ? (
                          <Link
                            href={`/superadmin/businesses/${a.businessId}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700"
                          >
                            <Building2 className="w-4 h-4" />
                            {a.businessName}
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-500">{a.businessName}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {getTemplateFromBusinessType(a.businessType, a.messageType)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {a.phone ? (
                          <span className="font-mono text-xs">{a.phone}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {a.status === 'error' && a.errorMessage ? (
                          <span className="text-sm text-red-600" title={a.errorMessage}>
                            {a.errorMessage.length > 80 ? `${a.errorMessage.substring(0, 80)}…` : a.errorMessage}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * data.pagination.limit + 1} to{' '}
                  {Math.min(currentPage * data.pagination.limit, data.pagination.total)} of {data.pagination.total}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(data.pagination.pages, p + 1))}
                    disabled={currentPage === data.pagination.pages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
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
