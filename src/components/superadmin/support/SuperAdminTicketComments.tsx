// src/components/superadmin/support/SuperAdminTicketComments.tsx
'use client'

import { useState, useEffect } from 'react'
import { Send, User, Clock } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Comment {
  id: string
  content: string
  isInternal: boolean
  createdAt: string
  author: {
    id: string
    name: string
    email: string
  }
}

interface SuperAdminTicketCommentsProps {
  ticketId: string
  onUpdate: () => void
}

export function SuperAdminTicketComments({ ticketId, onUpdate }: SuperAdminTicketCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    fetchComments()
  }, [ticketId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/superadmin/support/tickets/${ticketId}/comments`)
      if (response.ok) {
        const data = await response.json()
        // API now returns the correct names, just add "(You)" for SuperAdmin
        const updatedComments = (data.comments || []).map((comment: any) => ({
          ...comment,
          author: {
            ...comment.author,
            name: comment.author.role === 'SUPER_ADMIN' ? `${comment.author.name} (You)` : comment.author.name
          }
        }))
        setComments(updatedComments)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/superadmin/support/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        // API now returns the correct names, just add "(You)" for SuperAdmin
        const updatedComment = {
          ...data.comment,
          author: {
            ...data.comment.author,
            name: data.comment.author.role === 'SUPER_ADMIN' ? `${data.comment.author.name} (You)` : data.comment.author.name
          }
        }
        setComments(prev => [...prev, updatedComment])
        setNewComment('')
        onUpdate() // Refresh ticket details
      } else {
        console.error('Failed to add comment:', response.statusText)
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    const diffInHours = diffInMinutes / 60
    const diffInDays = diffInHours / 24
    
    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
          <p className="text-gray-600">Be the first to add a comment to this ticket.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.isInternal && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Internal
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4">
        <div className="space-y-3">
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Add a comment
            </label>
            <textarea
              id="comment"
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Type your comment here..."
              disabled={submitting}
            ></textarea>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Add Comment
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
