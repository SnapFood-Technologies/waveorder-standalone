'use client'

import { useState, useEffect } from 'react'
import { ChevronUp, MessageSquare, X, Send, Map, Filter, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'

interface RoadmapItem {
  id: string
  title: string
  description: string | null
  status: string
  category: string
  isPinned: boolean
  upvoteCount: number
  createdAt: string
  _count: { comments: number }
}

interface Comment {
  id: string
  name: string
  body: string
  createdAt: string
}

const statusColumns = [
  { key: 'IN_PROGRESS', label: 'In Progress', dotColor: 'bg-teal-500', borderColor: 'border-teal-200', headerBg: 'bg-teal-50' },
  { key: 'PLANNED', label: 'Planned', dotColor: 'bg-blue-500', borderColor: 'border-blue-200', headerBg: 'bg-blue-50' },
  { key: 'THINKING', label: 'Under Consideration', dotColor: 'bg-amber-500', borderColor: 'border-amber-200', headerBg: 'bg-amber-50' },
  { key: 'COMPLETED', label: 'Completed', dotColor: 'bg-green-500', borderColor: 'border-green-200', headerBg: 'bg-green-50' },
]

const categoryLabels: Record<string, string> = {
  STOREFRONT: 'Storefront',
  ADMIN: 'Admin',
  PAYMENTS: 'Payments',
  WHATSAPP_FLOWS: 'WhatsApp Flows',
  INTEGRATIONS: 'Integrations',
  ANALYTICS: 'Analytics',
  PERFORMANCE: 'Performance',
  MOBILE: 'Mobile',
  OTHER: 'Other',
}

const categoryColors: Record<string, string> = {
  STOREFRONT: 'bg-blue-100 text-blue-700',
  ADMIN: 'bg-indigo-100 text-indigo-700',
  PAYMENTS: 'bg-green-100 text-green-700',
  WHATSAPP_FLOWS: 'bg-teal-100 text-teal-700',
  INTEGRATIONS: 'bg-orange-100 text-orange-700',
  ANALYTICS: 'bg-pink-100 text-pink-700',
  PERFORMANCE: 'bg-red-100 text-red-700',
  MOBILE: 'bg-cyan-100 text-cyan-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

export default function PublicRoadmap() {
  const [items, setItems] = useState<RoadmapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [votedItems, setVotedItems] = useState<Set<string>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Comment modal state
  const [commentModalItem, setCommentModalItem] = useState<RoadmapItem | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentForm, setCommentForm] = useState({ name: '', email: '', body: '' })
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    fetchItems()
    const stored = localStorage.getItem('roadmap_votes')
    if (stored) {
      try {
        setVotedItems(new Set(JSON.parse(stored)))
      } catch { /* ignore */ }
    }
  }, [])

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/roadmap')
      const data = await res.json()
      if (res.ok) {
        setItems(data.items)
      }
    } catch {
      // Silent fail on public page
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (itemId: string) => {
    try {
      const res = await fetch(`/api/roadmap/${itemId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        setItems(prev => prev.map(item =>
          item.id === itemId ? { ...item, upvoteCount: data.upvoteCount } : item
        ))

        const newVoted = new Set(votedItems)
        if (data.voted) {
          newVoted.add(itemId)
        } else {
          newVoted.delete(itemId)
        }
        setVotedItems(newVoted)
        localStorage.setItem('roadmap_votes', JSON.stringify([...newVoted]))
      }
    } catch {
      toast.error('Failed to vote')
    }
  }

  const openComments = async (item: RoadmapItem) => {
    setCommentModalItem(item)
    setComments([])
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/roadmap/${item.id}/comments`)
      const data = await res.json()
      if (res.ok) {
        setComments(data.comments)
      }
    } catch {
      // Silent
    } finally {
      setLoadingComments(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!commentModalItem) return
    if (!commentForm.name.trim() || !commentForm.email.trim() || !commentForm.body.trim()) {
      toast.error('All fields are required')
      return
    }

    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/roadmap/${commentModalItem.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentForm),
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => [data.comment, ...prev])
        setCommentForm({ ...commentForm, body: '' })
        setItems(prev => prev.map(item =>
          item.id === commentModalItem.id
            ? { ...item, _count: { comments: item._count.comments + 1 } }
            : item
        ))
        toast.success('Comment added')
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to comment')
      }
    } catch {
      toast.error('Error submitting comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const filteredItems = categoryFilter === 'all'
    ? items
    : items.filter(i => i.category === categoryFilter)

  const getItemsByStatus = (status: string) =>
    filteredItems.filter(i => i.status === status)

  const activeCategories = [...new Set(items.map(i => i.category))]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Map className="w-8 h-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Product Roadmap
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See what we&apos;re building, what&apos;s planned, and what&apos;s next. Upvote the features you care about most.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      {activeCategories.length > 1 && (
        <section className="py-6 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400" />
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {activeCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    categoryFilter === cat
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ideas section */}
      {!loading && getItemsByStatus('IDEA').length > 0 && (
        <section className="pt-10 pb-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold text-gray-900">Ideas &amp; Suggestions</h2>
              <span className="text-sm text-gray-400 ml-1">Vote to help us prioritize</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getItemsByStatus('IDEA').map(item => (
                <div
                  key={item.id}
                  className="bg-white border border-purple-100 rounded-xl p-4 hover:border-purple-200 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleVote(item.id)}
                      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                        votedItems.has(item.id)
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <ChevronUp className="w-4 h-4" />
                      <span>{item.upvoteCount}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${categoryColors[item.category] || 'bg-gray-100 text-gray-700'}`}>
                          {categoryLabels[item.category] || item.category}
                        </span>
                        <button
                          onClick={() => openComments(item)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          {item._count.comments}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Roadmap columns */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading roadmap...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <Map className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
              <p className="text-gray-500">Our roadmap is being prepared. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statusColumns.map(col => {
                const colItems = getItemsByStatus(col.key)
                return (
                  <div key={col.key}>
                    {/* Column header */}
                    <div className={`rounded-xl ${col.headerBg} ${col.borderColor} border px-4 py-3 mb-4`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`}></div>
                        <h2 className="font-semibold text-gray-900">{col.label}</h2>
                        <span className="ml-auto text-sm text-gray-500">{colItems.length}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-3">
                      {colItems.map(item => (
                        <div
                          key={item.id}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                        >
                          <h3 className="font-medium text-gray-900 text-sm mb-1">{item.title}</h3>
                          {item.description && (
                            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                          )}

                          <div className="flex items-center gap-1.5 mb-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${categoryColors[item.category] || 'bg-gray-100 text-gray-700'}`}>
                              {categoryLabels[item.category] || item.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleVote(item.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                votedItems.has(item.id)
                                  ? 'bg-teal-100 text-teal-700 border border-teal-200'
                                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                              {item.upvoteCount}
                            </button>
                            <button
                              onClick={() => openComments(item)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              {item._count.comments}
                            </button>
                          </div>
                        </div>
                      ))}

                      {colItems.length === 0 && (
                        <div className="text-center py-8 text-sm text-gray-400">
                          No items yet
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Comment Modal */}
      {commentModalItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-gray-200 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{commentModalItem.title}</h2>
                {commentModalItem.description && (
                  <p className="text-sm text-gray-500 mt-1">{commentModalItem.description}</p>
                )}
              </div>
              <button
                onClick={() => setCommentModalItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loadingComments ? (
                <div className="text-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No comments yet. Be the first!
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-semibold">
                        {comment.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{comment.name}</span>
                      <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-9">{comment.body}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment form */}
            <div className="p-5 border-t border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your name"
                  value={commentForm.name}
                  onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white"
                />
                <input
                  type="email"
                  placeholder="Your email"
                  value={commentForm.email}
                  onChange={(e) => setCommentForm({ ...commentForm, email: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentForm.body}
                  onChange={(e) => setCommentForm({ ...commentForm, body: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white"
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={submittingComment}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-gray-400">Your email won&apos;t be displayed publicly.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
