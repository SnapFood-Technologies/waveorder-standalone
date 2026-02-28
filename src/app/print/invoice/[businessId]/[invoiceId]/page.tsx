// Print-only invoice page - renders ONLY the invoice for PDF. No admin layout.
'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { InvoiceDocument } from '@/components/admin/invoices/InvoiceDocument'

interface InvoicePrintPageProps {
  params: Promise<{ businessId: string; invoiceId: string }>
}

export default function InvoicePrintPage({ params }: InvoicePrintPageProps) {
  const [businessId, setBusinessId] = useState<string>('')
  const [invoiceId, setInvoiceId] = useState<string>('')
  const [data, setData] = useState<{ invoice: any; business: any } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const hasAutoPrinted = useRef(false)

  useEffect(() => {
    params.then((p) => {
      setBusinessId(p.businessId)
      setInvoiceId(p.invoiceId)
    })
  }, [params])

  useEffect(() => {
    if (!businessId || !invoiceId) return
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse h-64 w-96 bg-gray-100 rounded-lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 max-w-md">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <InvoiceDocument invoice={data.invoice} business={data.business} />
    </div>
  )
}
