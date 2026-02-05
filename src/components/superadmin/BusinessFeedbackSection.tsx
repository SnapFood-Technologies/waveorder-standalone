'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Star, Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface Feedback {
  id: string
  type: string
  source: string
  rating: number
  feedback: string | null
  submittedByEmail: string | null
  submittedByName: string | null
  createdAt: string
}

interface BusinessFeedbackSectionProps {
  businessId: string
  businessName: string
}

const sourceLabels: Record<string, string> = {
  ADMIN_FORM: 'Admin Form',
  SUPERADMIN_MANUAL: 'SuperAdmin (Manual)',
  EMAIL: 'Email',
  PHONE: 'Phone',
  OTHER: 'Other'
}

const typeLabels: Record<string, string> = {
  INITIAL: 'Initial',
  PERIODIC: 'Periodic',
  NPS: 'NPS',
  FEATURE_REQUEST: 'Feature Request',
  SUPPORT: 'Support',
  OTHER: 'Other'
}

export function BusinessFeedbackSection({ businessId, businessName }: BusinessFeedbackSectionProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [initialFeedbackCompletedAt, setInitialFeedbackCompletedAt] = useState<string | null>(null)

  // Form state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState('INITIAL')
  const [source, setSource] = useState('SUPERADMIN_MANUAL')
  const [submittedByName, setSubmittedByName] = useState('')

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/feedback`)
      if (response.ok) {
        const data = await response.json()
        setFeedbacks(data.feedbacks || [])
        setInitialFeedbackCompletedAt(data.business?.initialFeedbackCompletedAt || null)
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [businessId])

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          feedback: feedback || null,
          type: feedbackType,
          source,
          submittedByName: submittedByName || null
        })
      })

      if (response.ok) {
        toast.success('Feedback added successfully')
        setShowAddForm(false)
        setRating(0)
        setFeedback('')
        setFeedbackType('INITIAL')
        setSource('SUPERADMIN_MANUAL')
        setSubmittedByName('')
        fetchFeedbacks()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to add feedback')
      }
    } catch (error) {
      console.error('Error adding feedback:', error)
      toast.error('Failed to add feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  // Calculate average rating
  const averageRating = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-teal-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Business Feedback</h2>
            {feedbacks.length > 0 && (
              <div className="flex items-center gap-2 mt-1">
                {renderStars(Math.round(averageRating))}
                <span className="text-sm text-gray-600">
                  {averageRating.toFixed(1)} ({feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''})
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Feedback
          </button>
          {feedbacks.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Initial Feedback Status */}
      {!loading && (
        <div className={`p-3 rounded-lg mb-4 ${
          initialFeedbackCompletedAt 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <p className={`text-sm font-medium ${
            initialFeedbackCompletedAt ? 'text-green-900' : 'text-amber-900'
          }`}>
            {initialFeedbackCompletedAt 
              ? `Initial feedback completed on ${formatDate(initialFeedbackCompletedAt)}`
              : 'Initial feedback not yet collected'}
          </p>
        </div>
      )}

      {/* Add Feedback Form */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Add New Feedback</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              >
                <option value="INITIAL">Initial</option>
                <option value="PERIODIC">Periodic</option>
                <option value="NPS">NPS</option>
                <option value="FEATURE_REQUEST">Feature Request</option>
                <option value="SUPPORT">Support</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              >
                <option value="SUPERADMIN_MANUAL">Manual Entry</option>
                <option value="EMAIL">Email</option>
                <option value="PHONE">Phone Call</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Submitted By Name (optional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name (optional)
            </label>
            <input
              type="text"
              value={submittedByName}
              onChange={(e) => setSubmittedByName(e.target.value)}
              placeholder="Name of person who gave feedback"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
            />
          </div>

          {/* Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feedback (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter the feedback received..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAddForm(false)
                setRating(0)
                setFeedback('')
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Add Feedback'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
        </div>
      )}

      {/* No Feedback */}
      {!loading && feedbacks.length === 0 && !showAddForm && (
        <div className="text-center py-6 text-gray-500">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm">No feedback collected yet</p>
        </div>
      )}

      {/* Feedback List */}
      {!loading && feedbacks.length > 0 && isExpanded && (
        <div className="space-y-3 mt-4">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {renderStars(fb.rating)}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    fb.type === 'INITIAL' ? 'bg-blue-100 text-blue-700' :
                    fb.type === 'PERIODIC' ? 'bg-purple-100 text-purple-700' :
                    fb.type === 'NPS' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {typeLabels[fb.type] || fb.type}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                    {sourceLabels[fb.source] || fb.source}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(fb.createdAt)}</span>
              </div>
              {fb.feedback && (
                <p className="text-sm text-gray-700 mt-2">{fb.feedback}</p>
              )}
              {(fb.submittedByName || fb.submittedByEmail) && (
                <p className="text-xs text-gray-500 mt-2">
                  Submitted by: {fb.submittedByName || fb.submittedByEmail}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Show More/Less */}
      {!loading && feedbacks.length > 0 && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full text-center py-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          Show {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  )
}
