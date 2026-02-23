'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Mail,
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  X
} from 'lucide-react'
import { useImpersonation } from '@/lib/impersonation'

interface ServiceRequestRow {
  id: string
  requestType: string
  requesterType: string
  contactName: string
  companyName: string | null
  email: string
  phone: string | null
  serviceIds: unknown
  message: string | null
  status: string
  paymentStatus: string | null
  paymentMethod: string | null
  amount: number | null
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

interface ServiceRequestsListProps {
  businessId: string
}

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'QUOTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

export default function ServiceRequestsList({ businessId }: ServiceRequestsListProps) {
  const { addParams } = useImpersonation(businessId)
  const [items, setItems] = useState<ServiceRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [requestTypeFilter, setRequestTypeFilter] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const limit = 20

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500)
    return () => clearTimeout(t)
  }, [search])

  const fetchList = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter) params.set('status', statusFilter)
      if (requestTypeFilter) params.set('requestType', requestTypeFilter)
      const res = await fetch(`/api/admin/stores/${businessId}/service-requests?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setTotal(data.total ?? 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [businessId, page, statusFilter, requestTypeFilter, debouncedSearch])

  const clearFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setStatusFilter('')
    setRequestTypeFilter('')
    setPage(1)
  }

  const activeFiltersCount = [statusFilter, requestTypeFilter, debouncedSearch.trim()].filter(Boolean).length
  const pages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  if (loading && items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - same pattern as AppointmentsList */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service requests</h1>
          <p className="text-gray-600 mt-1">
            Form submissions from Request by email and Request by WhatsApp. For appointment-based requests, see Appointments.
          </p>
        </div>
      </div>

      {/* Filters - separate card, same pattern as AppointmentsList */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, message..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-teal-50 border-teal-200 text-teal-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
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
              {total} request{total !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                >
                  <option value="">All statuses</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request type</label>
                <select
                  value={requestTypeFilter}
                  onChange={(e) => { setRequestTypeFilter(e.target.value); setPage(1) }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                >
                  <option value="">All types</option>
                  <option value="EMAIL_REQUEST">Email request</option>
                  <option value="WHATSAPP_REQUEST">WhatsApp request</option>
                </select>
              </div>
              {activeFiltersCount > 0 && (
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* List or empty state */}
      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {total === 0 ? 'No service requests yet' : 'No service requests found'}
          </h3>
          <p className="text-gray-600">
            {total === 0
              ? 'Requests will appear here when customers submit the Request by email or Request by WhatsApp form.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Requester</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {row.requestType === 'WHATSAPP_REQUEST' ? (
                          <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                            <MessageSquare className="w-4 h-4" /> WhatsApp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm text-gray-700">
                            <Mail className="w-4 h-4" /> Email
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className="font-medium text-gray-900">{row.contactName}</span>
                        {row.requesterType === 'COMPANY' && row.companyName && (
                          <span className="block text-xs text-gray-500">{row.companyName}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {row.email}
                        {row.phone && <span className="block text-xs">{row.phone}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {row.paymentStatus || '—'}
                        {row.amount != null && (
                          <span className="block text-xs">
                            {(row.amount / 100).toFixed(2)} {row.paymentMethod || ''}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={addParams(`/admin/stores/${businessId}/service-requests/${row.id}`)}
                          className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" /> View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pages > 1 && (
            <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {from} to {to} of {total} requests
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-900">
                    Page {page} of {pages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(p + 1, pages))}
                    disabled={page === pages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
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
  )
}
