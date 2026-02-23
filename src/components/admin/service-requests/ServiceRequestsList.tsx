'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Mail,
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye
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
  const limit = 20

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
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

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, message..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={requestTypeFilter}
          onChange={(e) => { setRequestTypeFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All types</option>
          <option value="EMAIL_REQUEST">Email request</option>
          <option value="WHATSAPP_REQUEST">WhatsApp request</option>
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No service requests found.</div>
      ) : (
        <>
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
                          {row.amount / 100} {row.paymentMethod || ''}
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

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Page {page} of {pages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
