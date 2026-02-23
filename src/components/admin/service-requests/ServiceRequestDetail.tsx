'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        } else if (res.status === 404) {
          setError('Service request not found')
        } else {
          setError('Failed to load service request')
        }
      } catch (e) {
        console.error(e)
        setError('Network error loading service request')
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
        setError(null)
        setSuccessMessage('Changes saved successfully')
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        const err = await res.json().catch(() => ({}))
        setError(err.message || 'Failed to save')
      }
    } catch (e) {
      console.error(e)
      setError('Network error saving')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link
          href={addParams(`/admin/stores/${businessId}/service-requests`)}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Back to Service requests
        </Link>
      </div>
    )
  }

  if (!data) return null

  const serviceIdsArray = Array.isArray(data.serviceIds) ? data.serviceIds : []
  const requestLabel = data.requestType === 'WHATSAPP_REQUEST' ? 'WhatsApp' : 'Email'
  const createdAtFormatted = new Date(data.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Header - same pattern as AppointmentDetails */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/service-requests`)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service request</h1>
            <p className="text-gray-600 mt-1">
              {requestLabel} request · {createdAtFormatted}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase">Requester</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-gray-700">Type</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{data.requesterType === 'COMPANY' ? 'Company' : 'Person'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-700">Name</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{data.contactName}</dd>
              </div>
              {data.requesterType === 'COMPANY' && data.companyName && (
                <div>
                  <dt className="text-sm font-medium text-gray-700">Company</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{data.companyName}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-700">Email</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{data.email}</dd>
              </div>
              {data.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-700">Phone</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{data.phone}</dd>
                </div>
              )}
            </dl>

            {data.message && (
              <>
                <h3 className="text-sm font-medium text-gray-500 uppercase pt-2">Message</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap mt-0.5">{data.message}</p>
              </>
            )}

            {serviceIdsArray.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-gray-500 uppercase pt-2">Service IDs</h3>
                <p className="text-sm text-gray-600 mt-0.5">{serviceIdsArray.join(', ')}</p>
              </>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 uppercase">Status & payment</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment status</label>
                <input
                  type="text"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  placeholder="e.g. Pending, Paid"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
                <input
                  type="text"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="e.g. Card, Cash"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (e.g. 99.00)</label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  placeholder="Internal notes..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium transition-colors"
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
