// src/components/admin/invoices/InvoiceView.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer, FileText } from 'lucide-react'
import { useImpersonation } from '@/lib/impersonation'
import { InvoiceDocument } from './InvoiceDocument'
import { generateInvoicePdf } from '@/lib/generateInvoicePdf'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

interface InvoiceViewProps {
  businessId: string
  invoiceId: string
}

export function InvoiceView({ businessId, invoiceId }: InvoiceViewProps) {
  const { addParams } = useImpersonation(businessId)
  const [data, setData] = useState<{
    invoice: any
    business: any
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/admin/stores/${businessId}/invoices/${invoiceId}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to load invoice')
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [businessId, invoiceId])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="mb-6 flex gap-3">
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="flex justify-between mb-8 pb-6 border-b-2 border-gray-200">
              <div className="space-y-2">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-36 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="text-right space-y-2">
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
              </div>
            </div>
            <div className="mb-8">
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mt-2" />
            </div>
            <div className="mb-6">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-48 bg-gray-50 rounded animate-pulse" />
            <div className="mt-6 flex justify-end">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          {error}
        </div>
        <Link
          href={addParams(`/admin/stores/${businessId}/settings/invoices`)}
          className="inline-flex items-center mt-4 text-teal-600 hover:text-teal-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Invoices
        </Link>
      </div>
    )
  }

  const { invoice, business } = data
  const order = invoice.order

  const handleDownloadPdf = () => generateInvoicePdf(invoice, business)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Invoice document - 3/4 width */}
      <div className="lg:col-span-3">
        {/* Actions - hidden when printing */}
        <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
          <Link
            href={addParams(`/admin/stores/${businessId}/settings/invoices`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Link>
          <Link
            href={addParams(`/admin/stores/${businessId}/orders/${order.id}`)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            View Order
          </Link>
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Printer className="w-4 h-4 mr-2" />
            Save as PDF
          </button>
        </div>

        {/* Invoice document */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-0">
          <InvoiceDocument invoice={invoice} business={business} />
        </div>
      </div>

      {/* Informative sidebar - 1/4 width, hidden when printing */}
      <div className="lg:col-span-1 print:hidden">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-teal-600" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              href={addParams(`/admin/stores/${businessId}/settings/invoices`)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium text-center"
            >
              Back to Invoices
            </Link>
            <Link
              href={addParams(`/admin/stores/${businessId}/orders/${order.id}`)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium text-center"
            >
              View Order
            </Link>
            <button
              onClick={handleDownloadPdf}
              className="block w-full px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
            >
              <Printer className="w-4 h-4 inline mr-2" />
              Save as PDF
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">About This Invoice</h4>
            <p className="text-xs text-gray-600">
              This is an internal document for record-keeping only. It is not a tax invoice and cannot be used for tax purposes.
            </p>
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-800 mb-1">Invoice Details</h4>
            <p className="text-xs text-gray-600">#{invoice.invoiceNumber}</p>
            <p className="text-xs text-gray-500 mt-1">Order #{order.orderNumber}</p>
            <p className="text-xs text-gray-500">{formatDate(invoice.generatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
