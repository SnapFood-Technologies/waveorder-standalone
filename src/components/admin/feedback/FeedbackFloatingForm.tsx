'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, X, Star, Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface FeedbackFloatingFormProps {
  businessId: string
}

export function FeedbackFloatingForm({ businessId }: FeedbackFloatingFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [shouldShow, setShouldShow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Check if we should show the feedback form
  useEffect(() => {
    const checkFeedbackStatus = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/feedback`)
        if (response.ok) {
          const data = await response.json()
          setShouldShow(data.shouldShowFeedbackForm)
        }
      } catch (error) {
        console.error('Error checking feedback status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkFeedbackStatus()
  }, [businessId])

  const handleDismiss = async () => {
    try {
      await fetch(`/api/admin/stores/${businessId}/feedback`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismiss' })
      })
      setShouldShow(false)
      setIsOpen(false)
    } catch (error) {
      console.error('Error dismissing feedback:', error)
    }
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback })
      })

      if (response.ok) {
        setSubmitted(true)
        toast.success('Thank you for your feedback!')
        setTimeout(() => {
          setShouldShow(false)
          setIsOpen(false)
        }, 2000)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  // Don't render if loading or shouldn't show
  if (loading || !shouldShow) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm font-medium pr-1">Share Feedback</span>
        </button>
      )}

      {/* Feedback Form */}
      {isOpen && (
        <div className="bg-white rounded-xl shadow-2xl w-80 sm:w-96 overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-3 flex items-center justify-between">
            <div className="text-white">
              <h3 className="font-semibold">How are we doing?</h3>
              <p className="text-xs text-teal-100">Your feedback helps us improve</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {submitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-teal-600 fill-teal-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">Thank You!</h4>
                <p className="text-sm text-gray-600">Your feedback means a lot to us.</p>
              </div>
            ) : (
              <>
                {/* Star Rating */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate your experience
                  </label>
                  <div className="flex justify-center gap-1">
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
                  {rating > 0 && (
                    <p className="text-center text-sm text-gray-500 mt-1">
                      {rating === 1 && 'Poor'}
                      {rating === 2 && 'Fair'}
                      {rating === 3 && 'Good'}
                      {rating === 4 && 'Very Good'}
                      {rating === 5 && 'Excellent'}
                    </p>
                  )}
                </div>

                {/* Feedback Text */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tell us more (optional)
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What do you like? What can we improve?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || rating === 0}
                    className="flex-1 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
