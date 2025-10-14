// src/components/admin/profile/EmailChangeSection.tsx
'use client'

import { useState } from 'react'
import { Mail, AlertCircle, CheckCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface EmailChangeSectionProps {
  currentEmail: string
  emailVerified: boolean
  pendingEmail?: string | null
  onEmailChanged: () => void
}

export default function EmailChangeSection({
  currentEmail,
  emailVerified,
  pendingEmail,
  onEmailChanged
}: EmailChangeSectionProps) {
  const [newEmail, setNewEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/user/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newEmail })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request email change')
      }

      toast.success('Verification email sent! Check your new email address.')
      setNewEmail('')
      onEmailChanged()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to request email change')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEmailChange = async () => {
    setCancelling(true)
    
    try {
      const response = await fetch('/api/user/cancel-email-change', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to cancel email change')
      }

      toast.success('Email change cancelled')
      onEmailChanged()
    } catch (error) {
      toast.error('Failed to cancel email change')
    } finally {
      setCancelling(false)
    }
  }

  if (pendingEmail) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-900 mb-1">Email Change Pending</h3>
            <p className="text-sm text-amber-800 mb-2">
              We've sent a verification email to <strong>{pendingEmail}</strong>.
              Click the link in that email to complete the change.
            </p>
            <p className="text-xs text-amber-700">
              The verification link will expire in 24 hours.
            </p>
          </div>
        </div>
        <button
          onClick={handleCancelEmailChange}
          disabled={cancelling}
          className="flex items-center px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4 mr-2" />
          {cancelling ? 'Cancelling...' : 'Cancel Email Change'}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <form onSubmit={handleRequestEmailChange} className="space-y-4">
      <div>
      <h3 className="text-lg font-semibold text-gray-900">
          Change Email Address
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          Enter a new email address. We'll send a verification link to confirm the change.
        </p>
        <div className="relative">
          <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            placeholder="new@email.com"
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading || !newEmail}
        className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {loading ? 'Sending...' : 'Send Verification Email'}
        </button>
      </form>
    </div>
  )
}