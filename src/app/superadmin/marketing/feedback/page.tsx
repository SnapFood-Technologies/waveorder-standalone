'use client'

import { useState, useEffect } from 'react'
import { 
  Star, 
  MessageSquare, 
  Building2, 
  Filter,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface Feedback {
  id: string
  businessId: string
  type: string
  source: string
  rating: number
  feedback: string | null
  submittedByEmail: string | null
  submittedByName: string | null
  createdAt: string
  business: {
    id: string
    name: string
    slug: string
    logo: string | null
    businessType: string
    subscriptionPlan: string
  }
}

interface FeedbackStats {
  totalFeedbacks: number
  averageRating: number
  ratingDistribution: Record<number, number>
  sourceDistribution: Record<string, number>
  typeDistribution: Record<string, number>
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const sourceLabels: Record<string, string> = {
  ADMIN_FORM: 'Admin Form',
  SUPERADMIN_MANUAL: 'SuperAdmin',
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

export default function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [ratingFilter, setRatingFilter] = useState('')

  const fetchFeedbacks = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (search) params.append('search', search)
      if (typeFilter) params.append('type', typeFilter)
      if (sourceFilter) params.append('source', sourceFilter)
      if (ratingFilter) params.append('rating', ratingFilter)

      const response = await fetch(`/api/superadmin/feedback?${params}`)
      if (response.ok) {
        const data = await response.json()
        setFeedbacks(data.feedbacks)
        setStats(data.stats)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedbacks()
  }, [typeFilter, sourceFilter, ratingFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchFeedbacks(1)
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

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Business Feedback</h1>
        <p className="text-gray-600 mt-1">View and manage feedback from all businesses</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Total Feedbacks */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFeedbacks}</p>
                <p className="text-sm text-gray-500">Total Feedbacks</p>
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${getRatingColor(stats.averageRating)}`}>
                  {stats.averageRating.toFixed(1)}
                </p>
                <p className="text-sm text-gray-500">Average Rating</p>
              </div>
            </div>
          </div>

          {/* Rating Distribution Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">Rating Distribution</p>
                <div className="flex gap-1">
                  {[5, 4, 3, 2, 1].map((r) => (
                    <div key={r} className="flex-1">
                      <div className="text-[10px] text-center text-gray-500">{r}</div>
                      <div 
                        className="h-4 bg-gray-100 rounded-sm overflow-hidden"
                        title={`${r} stars: ${stats.ratingDistribution[r] || 0}`}
                      >
                        <div 
                          className={`h-full ${r >= 4 ? 'bg-green-500' : r === 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ 
                            height: stats.totalFeedbacks > 0 
                              ? `${((stats.ratingDistribution[r] || 0) / stats.totalFeedbacks) * 100}%` 
                              : '0%' 
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 mb-1">By Source</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.sourceDistribution).slice(0, 3).map(([source, count]) => (
                    <span 
                      key={source} 
                      className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-600"
                    >
                      {sourceLabels[source] || source}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by business name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-gray-900 bg-white"
              />
            </div>
          </form>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-gray-900 bg-white"
            >
              <option value="">All Types</option>
              <option value="INITIAL">Initial</option>
              <option value="PERIODIC">Periodic</option>
              <option value="NPS">NPS</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="SUPPORT">Support</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-gray-900 bg-white"
          >
            <option value="">All Sources</option>
            <option value="ADMIN_FORM">Admin Form</option>
            <option value="SUPERADMIN_MANUAL">SuperAdmin</option>
            <option value="EMAIL">Email</option>
            <option value="PHONE">Phone</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-gray-900 bg-white"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No feedback found</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {feedbacks.map((fb) => (
                <div key={fb.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    {/* Business Logo */}
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {fb.business.logo ? (
                        <img
                          src={fb.business.logo}
                          alt={fb.business.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/superadmin/businesses/${fb.businessId}`}
                            className="font-medium text-gray-900 hover:text-teal-600"
                          >
                            {fb.business.name}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(fb.rating)}
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              fb.type === 'INITIAL' ? 'bg-blue-100 text-blue-700' :
                              fb.type === 'PERIODIC' ? 'bg-purple-100 text-purple-700' :
                              fb.type === 'NPS' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {typeLabels[fb.type] || fb.type}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {sourceLabels[fb.source] || fb.source}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(fb.createdAt)}
                        </span>
                      </div>

                      {fb.feedback && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">{fb.feedback}</p>
                      )}

                      {(fb.submittedByName || fb.submittedByEmail) && (
                        <p className="text-xs text-gray-500 mt-1">
                          by {fb.submittedByName || fb.submittedByEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchFeedbacks(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="flex items-center px-3 text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchFeedbacks(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
