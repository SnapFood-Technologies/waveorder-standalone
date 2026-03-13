'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Loader2, Mail, ShoppingBag, Calendar, Inbox } from 'lucide-react'

interface NotificationBusiness {
  id: string
  name: string
  slug: string
  businessType: string
  settings: {
    id: string
    notificationEmails: string[]
    orderNotificationsEnabled: boolean
    bookingNotificationsEnabled: boolean
    serviceRequestNotificationsEnabled: boolean
  } | null
}

interface SuperAdminNotificationModalProps {
  business: NotificationBusiness
  onClose: () => void
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SuperAdminNotificationModal({
  business,
  onClose
}: SuperAdminNotificationModalProps) {
  const [emails, setEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [orderEnabled, setOrderEnabled] = useState(false)
  const [bookingEnabled, setBookingEnabled] = useState(false)
  const [serviceRequestEnabled, setServiceRequestEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const s = business.settings
    setEmails(s?.notificationEmails ?? [])
    setOrderEnabled(s?.orderNotificationsEnabled ?? false)
    setBookingEnabled(s?.bookingNotificationsEnabled ?? false)
    setServiceRequestEnabled(s?.serviceRequestNotificationsEnabled ?? false)
  }, [business])

  const handleAddEmail = () => {
    const trimmed = newEmail.trim().toLowerCase()
    if (!trimmed) return
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address')
      return
    }
    if (emails.includes(trimmed)) {
      setError('Email already added')
      return
    }
    setEmails([...emails, trimmed])
    setNewEmail('')
    setError(null)
  }

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email))
  }

  const handleSave = async () => {
    if (orderEnabled || bookingEnabled || serviceRequestEnabled) {
      if (emails.length === 0) {
        setError('Add at least one email when notifications are enabled')
        return
      }
    }

    setSaving(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/superadmin/system/notifications/${business.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notificationEmails: emails,
            orderNotificationsEnabled: orderEnabled,
            bookingNotificationsEnabled: bookingEnabled,
            serviceRequestNotificationsEnabled: serviceRequestEnabled
          })
        }
      )

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to save')
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const isSalonOrServices =
    business.businessType === 'SALON' || business.businessType === 'SERVICES'
  const isServices = business.businessType === 'SERVICES'

  // RESTAURANT, CAFE, RETAIL, etc.: Order only
  // SALON, SERVICES: Booking (appointments) + Service request (SERVICES only)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            SuperAdmin Notifications – {business.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Email list */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emails to receive notifications
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEmail())}
                placeholder="email@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="inline-flex items-center gap-1 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {emails.length > 0 ? (
              <ul className="space-y-2">
                {emails.map((email) => (
                  <li
                    key={email}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
                  >
                    <span className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {email}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(email)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 py-2">
                No emails added. Add emails to receive SuperAdmin notifications.
              </p>
            )}
          </div>

          {/* Toggles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Notification types
            </label>
            <div className="space-y-3">
              {/* Order: RESTAURANT, CAFE, RETAIL, JEWELRY, FLORIST, GROCERY, OTHER */}
              {!isSalonOrServices && (
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <span className="flex items-center gap-2 text-gray-700">
                    <ShoppingBag className="w-4 h-4 text-teal-600" />
                    Order notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={orderEnabled}
                    onChange={(e) => setOrderEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </label>
              )}

              {/* Booking: SALON, SERVICES (appointments) */}
              {isSalonOrServices && (
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <span className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    Booking notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={bookingEnabled}
                    onChange={(e) => setBookingEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </label>
              )}

              {/* Service request: SERVICES only (form submissions) */}
              {isServices && (
                <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <span className="flex items-center gap-2 text-gray-700">
                    <Inbox className="w-4 h-4 text-teal-600" />
                    Service request notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={serviceRequestEnabled}
                    onChange={(e) =>
                      setServiceRequestEnabled(e.target.checked)
                    }
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </label>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
