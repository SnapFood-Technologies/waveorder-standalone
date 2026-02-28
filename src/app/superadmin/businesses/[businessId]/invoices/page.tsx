'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  FileText,
  ChevronRight,
  ExternalLink,
  Eye,
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string
  note: string | null
  generatedAt: string
  orderId: string
  orderNumber: string
  total: number
  customerName: string
}

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function SuperAdminInvoicesPage() {
  const params = useParams()
  const businessId = params.businessId as string
  const [businessName, setBusinessName] = useState('')
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/superadmin/businesses/${businessId}/invoices?page=${page}&limit=20`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load invoices')
        setBusinessName(data.business?.name || '')
        setInvoices(data.invoices || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoices')
        setInvoices([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [businessId, page])

  const invoiceViewUrl = (inv: Invoice, print = false) =>
    print
      ? `/print/invoice/${businessId}/${inv.id}?print=1`
      : `/admin/stores/${businessId}/invoices/${inv.id}`

  if (loading && invoices.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  if (error && invoices.length === 0) {
    return (
      <div className="space-y-6 px-2 sm:px-0">
        <div className="flex items-center gap-4">
          <Link
            href={`/superadmin/businesses/${businessId}`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-800 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/superadmin/businesses/${businessId}`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Internal Invoices</h1>
            <p className="text-gray-600 text-sm">{businessName}</p>
          </div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
          <p className="text-gray-600">
            This business has not generated any internal invoices.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{inv.orderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{inv.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(inv.generatedAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(inv.total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <a
                          href={invoiceViewUrl(inv)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={invoiceViewUrl(inv, true)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <Link
                          href={`/admin/stores/${businessId}/orders/${inv.orderId}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="View order"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 inline" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                >
                  Next <ChevronRight className="w-4 h-4 inline" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
