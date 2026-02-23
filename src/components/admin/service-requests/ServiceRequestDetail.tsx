'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare, Save, Loader2 } from 'lucide-react'
import { useImpersonation } from '@/lib/impersonation'

interface ServiceRequestDetailProps {
  businessId: string
  requestId: string
}

interface RequestData {
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

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'QUOTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

export default function ServiceRequestDetail({ businessId, requestId }: ServiceRequestDetailProps) {
  const { addParams } = useImpersonation(businessId)
  const [data, setData] = useState<RequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [amount, setAmount] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/admin/stores/${businessId}/service-requests/${requestId}`)
        if (res.ok) {
          const row = await res.json()
          setData(row)
          setStatus(row.status || 'NEW')
          setPaymentStatus(row.paymentStatus || '')
          setPaymentMethod(row.paymentMethod || '')
          setAmount(row.amount != null ? String(row.amount / 100) : '')
          setAdminNotes(row.adminNotes || '')
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [businessId, requestId])

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/service-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          paymentStatus: paymentStatus || null,
          paymentMethod: paymentMethod || null,
          amount: amount === '' ? null : Math.round(parseFloat(amount) * 100),
          adminNotes: adminNotes || null
        })
      })
      if (res.ok) {
        const updated = await res.json()
        setData(updated)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  const serviceIdsArray = Array.isArray(data.serviceIds) ? data.serviceIds : []

  return (
    <div className="space-y-6">
      <Link
        href={addParams(`/admin/stores/${businessId}/service-requests`)}
        className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Service requests
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
          {data.requestType === 'WHATSAPP_REQUEST' ? (
            <MessageSquare className="w-5 h-5 text-gray-500" />
          ) : (
            <Mail className="w-5 h-5 text-gray-500" />
          )}
          <span className="font-medium text-gray-900">
            {data.requestType === 'WHATSAPP_REQUEST' ? 'WhatsApp' : 'Email'} request · {new Date(data.createdAt).toLocaleString()}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase">Requester</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-500">Type</dt>
                <dd className="text-sm font-medium">{data.requesterType === 'COMPANY' ? 'Company' : 'Person'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Name</dt>
                <dd className="text-sm">{data.contactName}</dd>
              </div>
              {data.requesterType === 'COMPANY' && data.companyName && (
                <div>
                  <dt className="text-xs text-gray-500">Company</dt>
                  <dd className="text-sm">{data.companyName}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-500">Email</dt>
                <dd className="text-sm">{data.email}</dd>
              </div>
              {data.phone && (
                <div>
                  <dt className="text-xs text-gray-500">Phone</dt>
                  <dd className="text-sm">{data.phone}</dd>
                </div>
              )}
            </dl>

            {data.message && (
              <>
                <h3 className="text-sm font-medium text-gray-500 uppercase pt-2">Message</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.message}</p>
              </>
            )}

            {serviceIdsArray.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-gray-500 uppercase pt-2">Service IDs</h3>
                <p className="text-sm text-gray-600">{serviceIdsArray.join(', ')}</p>
              </>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase">Status & payment</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs text-gray-500">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Payment status</span>
                <input
                  type="text"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  placeholder="e.g. Pending, Paid"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Payment method</span>
                <input
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="e.g. Card, Cash"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Amount (e.g. 99.00)</span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Admin notes</span>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  placeholder="Internal notes..."
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
