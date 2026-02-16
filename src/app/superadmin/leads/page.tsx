'use client'

import { useState, useEffect } from 'react'
import { 
  Users, Search, Plus, Filter, ChevronDown, ChevronRight,
  Phone, Mail, Building2, Globe, Calendar, Clock, AlertCircle,
  TrendingUp, Target, UserPlus, CheckCircle, XCircle, MessageSquare,
  MoreVertical, Edit, Trash2, Eye, RefreshCw, ArrowUpRight
} from 'lucide-react'
import toast from 'react-hot-toast'

// Types
interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  country: string | null
  source: string
  sourceDetail: string | null
  status: string
  priority: string
  score: number
  assignedTo: { id: string; name: string; email: string } | null
  teamMember: { id: string; name: string; email: string; role: string; avatar: string | null } | null
  businessType: string | null
  estimatedValue: number | null
  expectedPlan: string | null
  lastContactedAt: string | null
  nextFollowUpAt: string | null
  contactCount: number
  convertedAt: string | null
  convertedToId: string | null
  convertedTo?: { id: string; name: string; slug: string; subscriptionPlan: string; createdAt: string } | null
  notes: string | null
  tags: string[]
  createdAt: string
  activities: Activity[]
  _count: { activities: number }
}

interface Activity {
  id: string
  type: string
  title: string
  description: string | null
  performedBy: string | null
  createdAt: string
}

interface TeamMember {
  id: string
  name: string | null
  email: string
  _count: { assignedLeads: number }
}

interface SalesTeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  _count: { assignedLeads: number }
}

interface Stats {
  overview: {
    totalLeads: number
    leadsToday: number
    leadsThisWeek: number
    leadsThisMonth: number
    conversionRate: string
    followUpsToday: number
    overdueFollowUps: number
    unassignedLeads: number
    pipelineValue: number
    avgScore: number
  }
  byStatus: Record<string, number>
  bySource: Record<string, number>
  byPriority: Record<string, number>
  byTeamMember: { id: string; name: string; count: number }[]
}

// Status colors and labels
const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  NEW: { color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'New' },
  CONTACTED: { color: 'text-indigo-700', bgColor: 'bg-indigo-100', label: 'Contacted' },
  QUALIFIED: { color: 'text-purple-700', bgColor: 'bg-purple-100', label: 'Qualified' },
  DEMO_SCHEDULED: { color: 'text-cyan-700', bgColor: 'bg-cyan-100', label: 'Demo Scheduled' },
  NEGOTIATING: { color: 'text-amber-700', bgColor: 'bg-amber-100', label: 'Negotiating' },
  WON: { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Won' },
  LOST: { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Lost' },
  NURTURING: { color: 'text-gray-700', bgColor: 'bg-gray-100', label: 'Nurturing' }
}

const priorityConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  LOW: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Low' },
  MEDIUM: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Medium' },
  HIGH: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'High' },
  URGENT: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Urgent' }
}

const sourceConfig: Record<string, { label: string; icon: string }> = {
  WEBSITE: { label: 'Website', icon: '🌐' },
  DEMO_REQUEST: { label: 'Demo Request', icon: '🎯' },
  REFERRAL: { label: 'Referral', icon: '🤝' },
  SOCIAL: { label: 'Social Media', icon: '📱' },
  EMAIL: { label: 'Email', icon: '📧' },
  PHONE: { label: 'Phone', icon: '📞' },
  PARTNER: { label: 'Partner', icon: '🏢' },
  EVENT: { label: 'Event', icon: '🎪' },
  ADVERTISING: { label: 'Advertising', icon: '📢' },
  ORGANIC: { label: 'Organic Search', icon: '🔍' },
  OTHER: { label: 'Other', icon: '📋' }
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [salesTeam, setSalesTeam] = useState<SalesTeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assignedFilter, setAssignedFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc') // Default: latest first
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showStatsPanel, setShowStatsPanel] = useState(true)

  // Fetch leads
  const fetchLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        status: statusFilter,
        source: sourceFilter,
        priority: priorityFilter,
        assignedTo: assignedFilter,
        sortBy
      })

      const res = await fetch(`/api/superadmin/leads?${params}`)
      const data = await res.json()

      if (res.ok) {
        setLeads(data.leads)
        setTotalPages(data.pagination.pages)
        setTotal(data.pagination.total)
        setTeamMembers(data.teamMembers)
        setSalesTeam(data.salesTeam || [])
      } else {
        toast.error('Failed to fetch leads')
      }
    } catch (error) {
      toast.error('Error loading leads')
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/superadmin/leads/stats')
      const data = await res.json()

      if (res.ok) {
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
  }, [page, search, statusFilter, sourceFilter, priorityFilter, assignedFilter, sortBy])

  useEffect(() => {
    fetchStats()
  }, [])

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Format relative time
  const formatRelativeTime = (date: string | null) => {
    if (!date) return '-'
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return formatDate(date)
  }

  // Check if follow-up is overdue (only for active leads, not WON/LOST)
  const isOverdue = (date: string | null, status?: string) => {
    if (!date) return false
    // Don't show as overdue if lead is already closed (WON or LOST)
    if (status === 'WON' || status === 'LOST') return false
    return new Date(date) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads & Prospects</h1>
          <p className="text-gray-500 mt-1">Manage your sales pipeline and track prospects</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowStatsPanel(!showStatsPanel)}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            {showStatsPanel ? 'Hide' : 'Show'} Stats
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {showStatsPanel && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 text-teal-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.overview.totalLeads}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Total Leads</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <UserPlus className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.overview.leadsThisWeek}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">This Week</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <Target className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.overview.conversionRate}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Conversion Rate</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <Clock className="w-8 h-8 text-amber-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.overview.followUpsToday}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Follow-ups Today</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.overview.overdueFollowUps}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Overdue</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <Users className="w-8 h-8 text-gray-500" />
              <span className="text-2xl font-bold text-gray-900">{stats.overview.unassignedLeads}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Unassigned</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key.toLowerCase()}>{label}</option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Sources</option>
            {Object.entries(sourceConfig).map(([key, { label }]) => (
              <option key={key} value={key.toLowerCase()}>{label}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Priorities</option>
            {Object.entries(priorityConfig).map(([key, { label }]) => (
              <option key={key} value={key.toLowerCase()}>{label}</option>
            ))}
          </select>

          {/* Assigned Filter */}
          <select
            value={assignedFilter}
            onChange={(e) => { setAssignedFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name || member.email} ({member._count.assignedLeads})
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="priority_desc">Priority (High to Low)</option>
            <option value="priority_asc">Priority (Low to High)</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="value_desc">Value (High to Low)</option>
            <option value="value_asc">Value (Low to High)</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => { fetchLeads(); fetchStats(); }}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No leads found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters or add a new lead.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Follow-up</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedLead(lead); setShowDetailModal(true); }}>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <span className="text-teal-700 font-medium">
                            {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{lead.name}</p>
                          {lead.company && (
                            <p className="text-sm text-gray-500 flex items-center">
                              <Building2 className="w-3 h-3 mr-1" />
                              {lead.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        {lead.email && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <Mail className="w-3 h-3 mr-1 text-gray-400" />
                            {lead.email}
                          </p>
                        )}
                        {lead.phone && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            {lead.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm">
                        {sourceConfig[lead.source]?.icon || '📋'} {sourceConfig[lead.source]?.label || lead.source}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[lead.status]?.bgColor || 'bg-gray-100'} ${statusConfig[lead.status]?.color || 'text-gray-700'}`}>
                        {statusConfig[lead.status]?.label || lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig[lead.priority]?.bgColor || 'bg-gray-100'} ${priorityConfig[lead.priority]?.color || 'text-gray-600'}`}>
                        {priorityConfig[lead.priority]?.label || lead.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {lead.teamMember ? (
                        <span className="text-sm text-gray-600">{lead.teamMember.name}</span>
                      ) : lead.assignedTo ? (
                        <span className="text-sm text-gray-600">{lead.assignedTo.name || lead.assignedTo.email}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {lead.nextFollowUpAt ? (
                        <span className={`text-sm flex items-center ${
                          lead.status === 'WON' ? 'text-green-600' :
                          lead.status === 'LOST' ? 'text-gray-400' :
                          isOverdue(lead.nextFollowUpAt, lead.status) ? 'text-red-600 font-medium' : 'text-gray-600'
                        }`}>
                          {lead.status === 'WON' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {lead.status === 'LOST' && <XCircle className="w-3 h-3 mr-1" />}
                          {isOverdue(lead.nextFollowUpAt, lead.status) && <AlertCircle className="w-3 h-3 mr-1" />}
                          {formatDate(lead.nextFollowUpAt)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{formatRelativeTime(lead.createdAt)}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedLead(lead); setShowDetailModal(true); }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} leads
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <CreateLeadModal
          teamMembers={teamMembers}
          salesTeam={salesTeam}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { fetchLeads(); fetchStats(); setShowCreateModal(false); }}
        />
      )}

      {/* Lead Detail Modal */}
      {showDetailModal && selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          teamMembers={teamMembers}
          salesTeam={salesTeam}
          onClose={() => { setShowDetailModal(false); setSelectedLead(null); }}
          onUpdate={() => { fetchLeads(); fetchStats(); }}
        />
      )}
    </div>
  )
}

// Create Lead Modal Component
function CreateLeadModal({ 
  teamMembers,
  salesTeam,
  onClose, 
  onSuccess 
}: { 
  teamMembers: TeamMember[]
  salesTeam: SalesTeamMember[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    country: '',
    source: 'WEBSITE',
    sourceDetail: '',
    status: 'NEW',
    priority: 'MEDIUM',
    businessType: '',
    expectedPlan: '',
    estimatedValue: '',
    teamMemberId: '',
    notes: '',
    nextFollowUpAt: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/superadmin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
          teamMemberId: formData.teamMemberId || null
        })
      })

      if (res.ok) {
        toast.success('Lead created successfully')
        onSuccess()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to create lead')
      }
    } catch (error) {
      toast.error('Error creating lead')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Lead</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., Bahrain, USA"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              >
                <option value="">Select type</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="CAFE">Cafe</option>
                <option value="RETAIL">Retail</option>
                <option value="GROCERY">Grocery</option>
                <option value="SALON">Salon & Beauty</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              >
                {Object.entries(sourceConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              >
                {Object.entries(statusConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              >
                {Object.entries(priorityConfig).map(([key, { label }]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Plan</label>
              <select
                value={formData.expectedPlan}
                onChange={(e) => setFormData({ ...formData, expectedPlan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              >
                <option value="">Select plan</option>
                <option value="STARTER">Starter ($19/mo)</option>
                <option value="PRO">Pro ($39/mo)</option>
                <option value="BUSINESS">Business ($79/mo)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value ($)</label>
              <input
                type="number"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                placeholder="Annual value"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
              <select
                value={formData.teamMemberId}
                onChange={(e) => setFormData({ ...formData, teamMemberId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              >
                <option value="">Unassigned</option>
                {salesTeam.length > 0 ? (
                  salesTeam.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member._count.assignedLeads} leads)
                    </option>
                  ))
                ) : (
                  teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up</label>
              <input
                type="date"
                value={formData.nextFollowUpAt}
                onChange={(e) => setFormData({ ...formData, nextFollowUpAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
              placeholder="Add any notes about this lead..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Lead Detail Modal Component
function LeadDetailModal({ 
  lead, 
  teamMembers,
  salesTeam,
  onClose, 
  onUpdate 
}: { 
  lead: Lead
  teamMembers: TeamMember[]
  salesTeam: SalesTeamMember[]
  onClose: () => void
  onUpdate: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'activities'>('details')
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: lead.name,
    email: lead.email || '',
    phone: lead.phone || '',
    company: lead.company || '',
    country: lead.country || '',
    source: lead.source,
    status: lead.status,
    priority: lead.priority,
    businessType: lead.businessType || '',
    expectedPlan: lead.expectedPlan || '',
    estimatedValue: lead.estimatedValue?.toString() || '',
    teamMemberId: lead.teamMember?.id || '',
    notes: lead.notes || '',
    nextFollowUpAt: lead.nextFollowUpAt ? lead.nextFollowUpAt.split('T')[0] : '',
    convertedToId: lead.convertedToId || ''
  })
  
  // Business search state
  const [businessSearch, setBusinessSearch] = useState('')
  const [businessResults, setBusinessResults] = useState<Array<{ id: string; name: string; slug: string; email: string | null; subscriptionPlan: string }>>([])
  const [searchingBusiness, setSearchingBusiness] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<{ id: string; name: string; slug: string } | null>(
    lead.convertedTo || null
  )
  
  // Search for businesses
  const searchBusinesses = async (query: string) => {
    if (query.length < 2) {
      setBusinessResults([])
      return
    }
    setSearchingBusiness(true)
    try {
      const res = await fetch(`/api/superadmin/leads/search-business?q=${encodeURIComponent(query)}`)
      if (res.ok) {
        const data = await res.json()
        setBusinessResults(data.businesses || [])
      }
    } catch (error) {
      console.error('Error searching businesses:', error)
    } finally {
      setSearchingBusiness(false)
    }
  }
  
  // Auto-search by email when status changes to WON
  const checkEmailMatch = async () => {
    if (lead.email && !selectedBusiness) {
      try {
        const res = await fetch(`/api/superadmin/leads/search-business?email=${encodeURIComponent(lead.email)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.exactMatch && data.businesses.length > 0) {
            setSelectedBusiness(data.businesses[0])
            setFormData(prev => ({ ...prev, convertedToId: data.businesses[0].id }))
            toast.success(`Auto-matched with business: ${data.businesses[0].name}`)
          }
        }
      } catch (error) {
        console.error('Error checking email match:', error)
      }
    }
  }

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Activity form
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [activityData, setActivityData] = useState({
    type: 'NOTE',
    title: '',
    description: ''
  })

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : null,
          teamMemberId: formData.teamMemberId || null,
          convertedToId: formData.status === 'WON' ? (formData.convertedToId || null) : null
        })
      })

      if (res.ok) {
        toast.success('Lead updated successfully')
        onUpdate()
        setEditMode(false)
      } else {
        toast.error('Failed to update lead')
      }
    } catch (error) {
      toast.error('Error updating lead')
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = async () => {
    if (!activityData.title) {
      toast.error('Title is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData)
      })

      if (res.ok) {
        toast.success('Activity added')
        onUpdate()
        setShowActivityForm(false)
        setActivityData({ type: 'NOTE', title: '', description: '' })
      } else {
        toast.error('Failed to add activity')
      }
    } catch (error) {
      toast.error('Error adding activity')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/leads/${lead.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Lead deleted')
        onUpdate()
        onClose()
      } else {
        toast.error('Failed to delete lead')
      }
    } catch (error) {
      toast.error('Error deleting lead')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const activityTypeConfig: Record<string, { label: string; icon: string }> = {
    NOTE: { label: 'Note', icon: '📝' },
    EMAIL_SENT: { label: 'Email Sent', icon: '📤' },
    EMAIL_RECEIVED: { label: 'Email Received', icon: '📥' },
    CALL: { label: 'Phone Call', icon: '📞' },
    MEETING: { label: 'Meeting', icon: '🤝' },
    DEMO: { label: 'Demo', icon: '🎯' },
    FOLLOW_UP: { label: 'Follow-up', icon: '⏰' },
    STATUS_CHANGE: { label: 'Status Change', icon: '🔄' },
    ASSIGNED: { label: 'Assigned', icon: '👤' },
    CREATED: { label: 'Created', icon: '✨' }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-teal-700 font-bold text-lg">
                {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{lead.name}</h2>
              {lead.company && <p className="text-gray-500">{lead.company}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[lead.status]?.bgColor} ${statusConfig[lead.status]?.color}`}>
              {statusConfig[lead.status]?.label}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 border-b-2 text-sm font-medium ${activeTab === 'details' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`py-3 border-b-2 text-sm font-medium ${activeTab === 'activities' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Activities ({lead._count.activities})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {editMode ? 'Cancel Edit' : 'Edit'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>

              {editMode ? (
                /* Edit Form */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => {
                          const newStatus = e.target.value
                          setFormData({ ...formData, status: newStatus })
                          // Auto-check for matching business when marking as WON
                          if (newStatus === 'WON' && !selectedBusiness) {
                            checkEmailMatch()
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                      >
                        {Object.entries(statusConfig).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                      >
                        {Object.entries(priorityConfig).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                      <select
                        value={formData.teamMemberId}
                        onChange={(e) => setFormData({ ...formData, teamMemberId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                      >
                        <option value="">Unassigned</option>
                        {salesTeam.length > 0 ? (
                          salesTeam.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))
                        ) : (
                          teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name || member.email}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Business Link (shown when status is WON) */}
                  {formData.status === 'WON' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <label className="block text-sm font-medium text-green-800 mb-2">
                        🎉 Link to Converted Business
                      </label>
                      {selectedBusiness ? (
                        <div className="flex items-center justify-between bg-white border border-green-300 rounded-lg p-3">
                          <div>
                            <p className="font-medium text-gray-900">{selectedBusiness.name}</p>
                            <p className="text-sm text-gray-500">/{selectedBusiness.slug}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBusiness(null)
                              setFormData(prev => ({ ...prev, convertedToId: '' }))
                            }}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search business by name, slug, or email..."
                            value={businessSearch}
                            onChange={(e) => {
                              setBusinessSearch(e.target.value)
                              searchBusinesses(e.target.value)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                          />
                          {searchingBusiness && (
                            <p className="text-sm text-gray-500 mt-1">Searching...</p>
                          )}
                          {businessResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {businessResults.map(business => (
                                <button
                                  key={business.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedBusiness(business)
                                    setFormData(prev => ({ ...prev, convertedToId: business.id }))
                                    setBusinessSearch('')
                                    setBusinessResults([])
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                                >
                                  <p className="font-medium text-gray-900">{business.name}</p>
                                  <p className="text-xs text-gray-500">
                                    /{business.slug} • {business.subscriptionPlan}
                                    {business.email && ` • ${business.email}`}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                    />
                  </div>

                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                /* View Details */
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Contact Information</h4>
                      <div className="space-y-2">
                        {lead.email && (
                          <p className="flex items-center text-gray-700">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {lead.email}
                          </p>
                        )}
                        {lead.phone && (
                          <p className="flex items-center text-gray-700">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {lead.phone}
                          </p>
                        )}
                        {lead.country && (
                          <p className="flex items-center text-gray-700">
                            <Globe className="w-4 h-4 mr-2 text-gray-400" />
                            {lead.country}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Lead Source</h4>
                      <p className="text-gray-700">
                        {sourceConfig[lead.source]?.icon} {sourceConfig[lead.source]?.label}
                        {lead.sourceDetail && ` - ${lead.sourceDetail}`}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h4>
                      <p className="text-gray-700">
                        {lead.teamMember?.name || lead.assignedTo?.name || lead.assignedTo?.email || 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Business Interest</h4>
                      <div className="space-y-1">
                        {lead.businessType && (
                          <p className="text-gray-700">Type: {lead.businessType}</p>
                        )}
                        {lead.expectedPlan && (
                          <p className="text-gray-700">Expected Plan: {lead.expectedPlan}</p>
                        )}
                        {lead.estimatedValue && (
                          <p className="text-gray-700">Est. Value: ${lead.estimatedValue.toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Timeline</h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">Created: {new Date(lead.createdAt).toLocaleDateString()}</p>
                        {lead.lastContactedAt && (
                          <p className="text-gray-600">Last Contact: {new Date(lead.lastContactedAt).toLocaleDateString()}</p>
                        )}
                        {lead.nextFollowUpAt && (
                          <p className="text-gray-600">Next Follow-up: {new Date(lead.nextFollowUpAt).toLocaleDateString()}</p>
                        )}
                        <p className="text-gray-600">Contact Count: {lead.contactCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Converted Business */}
                  {(lead.convertedTo || lead.status === 'WON') && (
                    <div className="col-span-2 bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-green-800 mb-2">🎉 Converted Customer</h4>
                      {lead.convertedTo ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{lead.convertedTo.name}</p>
                            <p className="text-sm text-gray-500">
                              /{lead.convertedTo.slug} • {lead.convertedTo.subscriptionPlan}
                            </p>
                            {lead.convertedAt && (
                              <p className="text-xs text-green-600 mt-1">
                                Converted on {new Date(lead.convertedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <a
                            href={`/superadmin/businesses/${lead.convertedTo.id}`}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            View Business
                          </a>
                        </div>
                      ) : (
                        <p className="text-sm text-green-700">
                          Status is WON but no business linked yet. Click Edit to link a business.
                        </p>
                      )}
                    </div>
                  )}

                  {lead.notes && (
                    <div className="col-span-2">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-4">
              {/* Add Activity Button */}
              {!showActivityForm && (
                <button
                  onClick={() => setShowActivityForm(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-teal-500 hover:text-teal-600 flex items-center justify-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Activity
                </button>
              )}

              {/* Activity Form */}
              {showActivityForm && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={activityData.type}
                        onChange={(e) => setActivityData({ ...activityData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                      >
                        {Object.entries(activityTypeConfig).filter(([key]) => !['STATUS_CHANGE', 'ASSIGNED', 'CREATED'].includes(key)).map(([key, { label }]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={activityData.title}
                        onChange={(e) => setActivityData({ ...activityData, title: e.target.value })}
                        placeholder="Brief summary..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={activityData.description}
                      onChange={(e) => setActivityData({ ...activityData, description: e.target.value })}
                      rows={2}
                      placeholder="Add details..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddActivity}
                      disabled={loading}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Activity'}
                    </button>
                    <button
                      onClick={() => setShowActivityForm(false)}
                      className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Activities List */}
              <div className="space-y-3">
                {lead.activities.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No activities yet</p>
                ) : (
                  lead.activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-xl">{activityTypeConfig[activity.type]?.icon || '📋'}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {activity.performedBy} • {new Date(activity.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Lead</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>"{lead.name}"</strong>? All data including activities and notes will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Lead
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
