// src/components/superadmin/support/InitiateMessageModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Send, AlertCircle, Building2, User } from 'lucide-react'

interface Business {
  id: string
  name: string
  users: {
    id: string
    name: string
    email: string
    role: string
  }[]
}

interface InitiateMessageModalProps {
  onClose: () => void
  onMessageInitiated: (thread: any) => void
}

export function InitiateMessageModal({ onClose, onMessageInitiated }: InitiateMessageModalProps) {
  const [loading, setLoading] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [formData, setFormData] = useState({
    subject: '',
    content: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBusinesses()
  }, [])

  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/superadmin/businesses')
      if (response.ok) {
        const data = await response.json()
        setBusinesses(data.businesses || [])
      }
    } catch (error) {
      console.error('Failed to fetch businesses:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/superadmin/support/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          businessId: selectedBusinessId,
          recipientId: selectedUserId
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onMessageInitiated(data.thread)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to send message')
      }
    } catch (error) {
      setError('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId)
  const availableUsers = selectedBusiness?.users || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Initiate Message</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="businessId" className="block text-sm font-medium text-gray-700 mb-2">
              Business *
            </label>
            <select
              id="businessId"
              value={selectedBusinessId}
              onChange={(e) => {
                setSelectedBusinessId(e.target.value)
                setSelectedUserId('') // Reset user selection
              }}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select a business</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
          </div>

          {selectedBusiness && (
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                Recipient *
              </label>
              <select
                id="userId"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Select a user</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.role.toLowerCase().replace('_', ' ')}
                  </option>
                ))}
              </select>
              {availableUsers.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No users found for this business.
                </p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Brief description of your message"
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Please provide detailed information about your message..."
            />
            <p className="text-sm text-gray-500 mt-1">
              This message will start a new conversation thread with the selected user.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.subject.trim() || !formData.content.trim() || !selectedBusinessId || !selectedUserId}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
