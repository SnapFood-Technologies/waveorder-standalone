// src/components/admin/invoices/InvoiceView.tsx
'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { useImpersonation } from '@/lib/impersonation'

interface InvoiceViewProps {
  businessId: string
  invoiceId: string
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
    month: 'long',
    day: 'numeric'
  })
}

export function InvoiceView({ businessId, invoiceId }: InvoiceViewProps) {
  const { addParams } = useImpersonation(businessId)
  const [data, setData] = useState<{
    invoice: any
    business: any
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const hasAutoPrinted = useRef(false)

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

  // Auto-print when ?print=1
  useEffect(() => {
    if (!data || loading || hasAutoPrinted.current) return
    if (searchParams.get('print') === '1') {
      hasAutoPrinted.current = true
      setTimeout(() => window.print(), 500)
    }
  }, [data, loading, searchParams])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse h-64 bg-gray-100 rounded-lg" />
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
  const primaryColor = business.primaryColor || '#0d9488'

  return (
    <div className="max-w-4xl mx-auto">
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
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print / Save as PDF
        </button>
      </div>

      {/* Invoice document */}
      <div
        className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden print:shadow-none print:border-0"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8 pb-6 border-b-2" style={{ borderColor: primaryColor }}>
            <div>
              {business.logo ? (
                <div className="relative w-32 h-12 mb-2">
                  <Image
                    src={business.logo}
                    alt={business.name}
                    width={128}
                    height={48}
                    className="object-contain object-left"
                  />
                </div>
              ) : null}
              <h1 className={`font-bold ${business.logo ? 'text-xl' : 'text-2xl'}`} style={{ color: primaryColor }}>{business.name}</h1>
              {business.address && <p className="text-sm text-gray-600 mt-1">{business.address}</p>}
              {business.phone && <p className="text-sm text-gray-600">{business.phone}</p>}
              {business.email && <p className="text-sm text-gray-600">{business.email}</p>}
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
              <p className="text-lg font-semibold mt-1" style={{ color: primaryColor }}>#{invoice.invoiceNumber}</p>
            </div>
          </div>

          {/* Bill to */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Bill to</h3>
            <p className="font-medium text-gray-900">{order.customer?.name || '—'}</p>
            {order.customer?.phone && <p className="text-sm text-gray-600">{order.customer.phone}</p>}
            {order.customer?.email && <p className="text-sm text-gray-600">{order.customer.email}</p>}
            {order.deliveryAddress && <p className="text-sm text-gray-600 mt-1">{order.deliveryAddress}</p>}
          </div>

          {/* Order info */}
          <div className="mb-6 flex flex-wrap gap-4 text-sm">
            <span><strong>Order #</strong> {order.orderNumber}</span>
            <span><strong>Date</strong> {formatDate(order.createdAt)}</span>
          </div>

          {/* Line items */}
          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="border-b-2" style={{ borderColor: primaryColor }}>
                <th className="text-left py-3 text-sm font-medium text-gray-700">Item</th>
                <th className="text-right py-3 text-sm font-medium text-gray-700 w-16">Qty</th>
                <th className="text-right py-3 text-sm font-medium text-gray-700 w-24">Price</th>
                <th className="text-right py-3 text-sm font-medium text-gray-700 w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item: any) => (
                <Fragment key={item.id}>
                  <tr className="border-b border-gray-100">
                    <td className="py-3">
                      <div>
                        <span className="font-medium text-gray-900">{item.productName}</span>
                        {item.variantName && (
                          <span className="text-gray-600 ml-1">({item.variantName})</span>
                        )}
                        {item.modifiers?.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {item.modifiers.map((m: { id?: string; name: string; price: number }, i: number) => (
                              <span key={m.id || `${i}-${m.name}`} className="block">+ {m.name} ({formatCurrency(m.price, business.currency)})</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-3 text-gray-600 align-top">{item.quantity}</td>
                    <td className="text-right py-3 text-gray-600 align-top">
                      {formatCurrency(item.price, business.currency)}
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-xs text-gray-400 line-through block">{formatCurrency(item.originalPrice, business.currency)}</span>
                      )}
                    </td>
                    <td className="text-right py-3 font-medium text-gray-900 align-top">
                      {formatCurrency(item.quantity * item.price, business.currency)}
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-xs text-green-600 block">-{formatCurrency(item.quantity * (item.originalPrice - item.price), business.currency)}</span>
                      )}
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>

          {/* Totals - same structure as Order Details */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              {order.subtotal != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(order.subtotal, business.currency)}</span>
                </div>
              )}
              {order.deliveryFee != null && order.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery</span>
                  <span>{formatCurrency(order.deliveryFee, business.currency)}</span>
                </div>
              )}
              {order.tax != null && order.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span>{formatCurrency(order.tax, business.currency)}</span>
                </div>
              )}
              {order.discount != null && order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span>-{formatCurrency(order.discount, business.currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t-2" style={{ borderColor: primaryColor }}>
                <span>Total</span>
                <span style={{ color: primaryColor }}>{formatCurrency(order.total, business.currency)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          {order.paymentMethod && (
            <p className="mt-6 text-sm text-gray-600">
              Payment: {order.paymentMethod} • Paid
            </p>
          )}

          {/* Note */}
          {invoice.note && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.note}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            <p className="font-medium text-gray-700">This document is for internal record-keeping only. It is not a tax invoice.</p>
            <p className="mt-1">Powered by WaveOrder</p>
          </div>
        </div>
      </div>
    </div>
  )
}
