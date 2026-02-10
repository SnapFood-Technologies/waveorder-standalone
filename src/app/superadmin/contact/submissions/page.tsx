'use client'

// src/app/superadmin/contact/submissions/page.tsx
/**
 * SuperAdmin: Web Contact Form Submissions
 * Lists all contact form submissions with filters, actions, and analytics
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Inbox,
  Search,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Filter,
  Eye,
  Mail,
  UserPlus,
  CheckCircle,
  XCircle,
  MessageSquare,
  X,
  Send,
  Globe,
  MapPin,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Shield
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Link from 'next/link'

// ===========================================
// Types
// ===========================================
interface Submission {
  id: string
  name: string
  email: string
  company: string | null
  useCase: string | null
  subject: string
  message: string
  isSpam: boolean
  spamScore: number | null
  ipAddress: string | null
  userAgent: string | null
  referer: string | null
  country: string | null
  city: string | null
  region: string | null
  countryCode: string | null
  status: string
  adminNotes: string | null
  respondedAt: string | null
  respondedBy: string | null
  emailSent: boolean
  emailSentAt: string | null
  createdAt: string
  updatedAt: string
}

interface Analytics {
  total: number
  byStatus: {
    pending: number
    inProgress: number
    resolved: number
    spam: number
    closed: number
  }
  bySubject: Array<{ subject: string; count: number }>
  byDay: Array<{ date: string; count: number }>
  topCountries: Array<{ country: string; count: number }>
  topCities: Array<{ city: string; count: number }>
}

// ===========================================
// Helpers
// ===========================================
const subjectLabels: Record<string, string> = {
  GENERAL: 'General',
  DEMO: 'Demo Request',
  SETUP: 'Setup Help',
  BILLING: 'Billing',
  TECHNICAL: 'Technical',
  FEATURE: 'Feature Request'
}

// Use case labels for display
const useCaseLabels: Record<string, string> = {
  restaurant: 'Restaurant / Cafe',
  retail: 'Retail / E-commerce',
  instagram: 'Instagram Seller',
  salon: 'Salon / Beauty Studio',
  other: 'Other'
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  RESOLVED: 'bg-green-100 text-green-800',
  SPAM: 'bg-red-100 text-red-800',
  CLOSED: 'bg-gray-100 text-gray-800'
}

const statusLabels: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  SPAM: 'Spam',
  CLOSED: 'Closed'
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days <= 7) return `${days}d ago`
  return formatDate(dateString)
}

// ===========================================
// Page Component
// ===========================================
export default function WebSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [spamFilter, setSpamFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modals
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showConvertModal, setShowConvertModal] = useState(false)

  // Reply form
  const [replySubject, setReplySubject] = useState('')
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)

  // Convert form
  const [convertData, setConvertData] = useState({
    businessType: '',
    priority: 'MEDIUM',
    notes: '',
    teamMemberId: ''
  })
  const [converting, setConverting] = useState(false)

  // Status change
  const [changingStatus, setChangingStatus] = useState(false)

  // ===========================================
  // Fetch Data
  // ===========================================
  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        status: statusFilter,
        subject: subjectFilter,
        spam: spamFilter
      })

      const response = await fetch(`/api/superadmin/contact/submissions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch submissions')

      const data = await response.json()
      setSubmissions(data.submissions)
      setTotalPages(data.pagination.totalPages)
      setAnalytics(data.analytics)
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, subjectFilter, spamFilter])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  // ===========================================
  // Actions
  // ===========================================
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setChangingStatus(true)
      const response = await fetch(`/api/superadmin/contact/submissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update status')

      toast.success(`Status updated to ${statusLabels[newStatus]}`)
      fetchSubmissions()

      // Update selected submission if modal is open
      if (selectedSubmission?.id === id) {
        setSelectedSubmission(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (err) {
      toast.error('Failed to update status')
    } finally {
      setChangingStatus(false)
    }
  }

  const handleSendReply = async () => {
    if (!selectedSubmission || !replySubject || !replyMessage) return

    try {
      setSending(true)
      const response = await fetch(`/api/superadmin/contact/submissions/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_reply',
          replySubject,
          replyMessage
        })
      })

      if (!response.ok) throw new Error('Failed to send reply')

      toast.success('Reply sent successfully')
      setShowReplyModal(false)
      setReplySubject('')
      setReplyMessage('')
      fetchSubmissions()
    } catch (err) {
      toast.error('Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  const handleConvertToLead = async () => {
    if (!selectedSubmission) return

    try {
      setConverting(true)
      const response = await fetch(`/api/superadmin/contact/submissions/${selectedSubmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'convert_to_lead',
          ...convertData
        })
      })

      const data = await response.json()

      if (response.status === 409) {
        toast.error('A lead with this email already exists')
        return
      }

      if (!response.ok) throw new Error('Failed to convert to lead')

      toast.success('Successfully converted to lead')
      setShowConvertModal(false)
      setConvertData({ businessType: '', priority: 'MEDIUM', notes: '', teamMemberId: '' })
      fetchSubmissions()
    } catch (err) {
      toast.error('Failed to convert to lead')
    } finally {
      setConverting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/superadmin/contact/submissions/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete')

      toast.success('Submission deleted')
      setShowDeleteConfirm(null)
      setShowDetailModal(false)
      fetchSubmissions()
    } catch (err) {
      toast.error('Failed to delete submission')
    }
  }

  const openDetailModal = (submission: Submission) => {
    setSelectedSubmission(submission)
    setShowDetailModal(true)
  }

  const openReplyModal = (submission: Submission) => {
    setSelectedSubmission(submission)
    setReplySubject(`Re: ${subjectLabels[submission.subject] || submission.subject} - WaveOrder Support`)
    setReplyMessage('')
    setShowReplyModal(true)
  }

  const openConvertModal = (submission: Submission) => {
    setSelectedSubmission(submission)
    setConvertData({
      businessType: '',
      priority: 'MEDIUM',
      notes: `Converted from contact form.\n\nOriginal message:\n${submission.message}`,
      teamMemberId: ''
    })
    setShowConvertModal(true)
  }

  // ===========================================
  // Render
  // ===========================================

  if (loading && !submissions.length) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading submissions</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
        <button onClick={fetchSubmissions} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Web Submissions</h1>
          <p className="text-gray-600 mt-1">Contact form submissions from waveorder.app/contact</p>
        </div>
        <button
          onClick={fetchSubmissions}
          className="mt-4 lg:mt-0 px-4 py-2 text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-yellow-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{analytics.byStatus.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-blue-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-700">{analytics.byStatus.inProgress}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-green-600">Resolved</p>
            <p className="text-2xl font-bold text-green-700">{analytics.byStatus.resolved}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-red-600">Spam</p>
            <p className="text-2xl font-bold text-red-700">{analytics.byStatus.spam}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, company..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 bg-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="spam">Spam</option>
          </select>
          <select
            value={subjectFilter}
            onChange={(e) => { setSubjectFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Subjects</option>
            <option value="general">General</option>
            <option value="demo">Demo Request</option>
            <option value="setup">Setup Help</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
            <option value="feature">Feature Request</option>
          </select>
          <select
            value={spamFilter}
            onChange={(e) => { setSpamFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All</option>
            <option value="not_spam">Not Spam</option>
            <option value="spam">Spam Only</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {submissions.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                          <p className="text-xs text-gray-500">{sub.email}</p>
                          {sub.company && <p className="text-xs text-gray-400">{sub.company}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">{subjectLabels[sub.subject] || sub.subject}</span>
                        {sub.isSpam && (
                          <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                            <Shield className="w-3 h-3" /> Spam
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {sub.country ? (
                          <div className="flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {sub.city ? `${sub.city}, ` : ''}{sub.country}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Unknown</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={sub.status}
                          onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                          disabled={changingStatus}
                          className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer ${statusColors[sub.status] || 'bg-gray-100 text-gray-800'} text-gray-900 bg-white`}
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                          <option value="SPAM">Spam</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-500" title={formatDate(sub.createdAt)}>
                          {formatRelativeTime(sub.createdAt)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetailModal(sub)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openReplyModal(sub)}
                            className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Send Reply"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openConvertModal(sub)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Convert to Lead"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(sub.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-600">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No submissions found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Analytics Section */}
      {analytics && (analytics.bySubject.length > 0 || analytics.topCountries.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Submissions by Day */}
          {analytics.byDay.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600" />
                Last 7 Days
              </h3>
              <div className="space-y-2">
                {analytics.byDay.map((day) => {
                  const maxCount = Math.max(...analytics.byDay.map(d => d.count), 1)
                  const barWidth = (day.count / maxCount) * 100
                  const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  return (
                    <div key={day.date} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{dayLabel}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden relative">
                        <div className="h-full bg-teal-500 rounded-md" style={{ width: `${barWidth}%` }} />
                        {day.count > 0 && (
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">{day.count}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* By Subject */}
          {analytics.bySubject.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-600" />
                By Subject
              </h3>
              <div className="space-y-3">
                {analytics.bySubject.map((item) => {
                  const maxCount = Math.max(...analytics.bySubject.map(s => s.count), 1)
                  const barWidth = (item.count / maxCount) * 100
                  return (
                    <div key={item.subject} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-28 flex-shrink-0 truncate">{subjectLabels[item.subject] || item.subject}</span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden relative">
                        <div className="h-full bg-blue-500 rounded-md" style={{ width: `${barWidth}%` }} />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">{item.count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top Countries & Cities */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-600" />
              Top Locations
            </h3>
            {analytics.topCountries.length > 0 ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Countries</p>
                  <div className="space-y-1.5">
                    {analytics.topCountries.slice(0, 5).map((item, i) => (
                      <div key={item.country} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{i + 1}. {item.country}</span>
                        <span className="text-sm font-medium text-gray-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {analytics.topCities.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Cities</p>
                    <div className="space-y-1.5">
                      {analytics.topCities.slice(0, 5).map((item, i) => (
                        <div key={item.city} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{i + 1}. {item.city}</span>
                          <span className="text-sm font-medium text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No location data available yet</p>
            )}
          </div>
        </div>
      )}

      {/* =================== MODALS =================== */}

      {/* Detail Modal */}
      {showDetailModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Submission Details</h3>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Name</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedSubmission.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedSubmission.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Company</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedSubmission.company || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Use Case</p>
                    <p className="text-sm text-gray-900 mt-1">{useCaseLabels[selectedSubmission.useCase || ''] || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Subject</p>
                    <p className="text-sm text-gray-900 mt-1">{subjectLabels[selectedSubmission.subject] || selectedSubmission.subject}</p>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Message</p>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
                    {selectedSubmission.message}
                  </div>
                </div>

                {/* Status & Metadata */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                    <span className={`inline-block mt-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusColors[selectedSubmission.status]}`}>
                      {statusLabels[selectedSubmission.status]}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Date</p>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(selectedSubmission.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Location</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedSubmission.country
                        ? `${selectedSubmission.city ? selectedSubmission.city + ', ' : ''}${selectedSubmission.region ? selectedSubmission.region + ', ' : ''}${selectedSubmission.country}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">IP Address</p>
                    <p className="text-sm text-gray-900 mt-1 font-mono">{selectedSubmission.ipAddress || '-'}</p>
                  </div>
                </div>

                {/* Spam Info */}
                {selectedSubmission.isSpam && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-600" />
                      <p className="text-sm font-medium text-red-800">Flagged as Spam</p>
                      {selectedSubmission.spamScore !== null && (
                        <span className="text-xs text-red-600">Score: {(selectedSubmission.spamScore * 100).toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Response Info */}
                {selectedSubmission.respondedAt && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      Responded by <strong>{selectedSubmission.respondedBy}</strong> on {formatDate(selectedSubmission.respondedAt)}
                    </p>
                  </div>
                )}

                {/* Admin Notes */}
                {selectedSubmission.adminNotes && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase">Admin Notes</p>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{selectedSubmission.adminNotes}</p>
                  </div>
                )}

                {/* Referer / User Agent */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-medium text-gray-400 uppercase mb-2">Technical Details</p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500"><strong>Referer:</strong> {selectedSubmission.referer || '-'}</p>
                    <p className="text-xs text-gray-500 break-all"><strong>User Agent:</strong> {selectedSubmission.userAgent || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => { setShowDetailModal(false); openReplyModal(selectedSubmission) }}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm inline-flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Reply
                </button>
                <button
                  onClick={() => { setShowDetailModal(false); openConvertModal(selectedSubmission) }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Convert to Lead
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(selectedSubmission.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm inline-flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reply to {selectedSubmission.name}</h3>
                <button onClick={() => setShowReplyModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">Sending to: {selectedSubmission.email}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={6}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-teal-500"
                    placeholder="Write your reply..."
                  />
                </div>

                {/* Original message preview */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Original Message</p>
                  <p className="text-sm text-gray-600 line-clamp-3">{selectedSubmission.message}</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replySubject || !replyMessage}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to Lead Modal */}
      {showConvertModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Convert to Lead</h3>
                <button onClick={() => setShowConvertModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>{selectedSubmission.name}</strong> ({selectedSubmission.email})
                  {selectedSubmission.company && <span> from {selectedSubmission.company}</span>}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                  <select
                    value={convertData.businessType}
                    onChange={(e) => setConvertData({ ...convertData, businessType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select type</option>
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="CAFE">Cafe</option>
                    <option value="RETAIL">Retail</option>
                    <option value="GROCERY">Grocery</option>
                    <option value="JEWELRY">Jewelry</option>
                    <option value="FLORIST">Florist</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={convertData.priority}
                    onChange={(e) => setConvertData({ ...convertData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    rows={4}
                    value={convertData.notes}
                    onChange={(e) => setConvertData({ ...convertData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowConvertModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConvertToLead}
                  disabled={converting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserPlus className="w-4 h-4" />
                  {converting ? 'Converting...' : 'Convert to Lead'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Submission</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
