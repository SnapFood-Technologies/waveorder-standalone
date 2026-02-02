'use client'

import { useState, useEffect } from 'react'
import { 
  Users, Search, Plus, Filter, Mail, Phone, Building2, Globe,
  RefreshCw, Edit, Trash2, Eye, UserPlus, Target, Award,
  Briefcase, MapPin, Calendar, Link2, XCircle, CheckCircle,
  MoreVertical, ChevronDown, ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

// Types
interface TeamMember {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  title: string | null
  role: string
  department: string | null
  userId: string | null
  user: { id: string; name: string; email: string } | null
  country: string | null
  city: string | null
  timezone: string | null
  territory: string | null
  region: string | null
  countries: string[]
  monthlyLeadQuota: number | null
  monthlyRevenueTarget: number | null
  quarterlyTarget: number | null
  totalLeadsAssigned: number
  totalLeadsConverted: number
  totalRevenue: number
  conversionRate: number
  isActive: boolean
  startDate: string | null
  bio: string | null
  skills: string[]
  notes: string | null
  createdAt: string
  _count: { assignedLeads: number; assignedBusinesses: number }
}

interface AvailableUser {
  id: string
  name: string | null
  email: string
}

// Role display config
const roleConfig: Record<string, { label: string; color: string; bgColor: string; department: string }> = {
  SALES_REPRESENTATIVE: { label: 'Sales Rep', color: 'text-blue-700', bgColor: 'bg-blue-100', department: 'Sales' },
  ACCOUNT_EXECUTIVE: { label: 'Account Executive', color: 'text-indigo-700', bgColor: 'bg-indigo-100', department: 'Sales' },
  ACCOUNT_MANAGER: { label: 'Account Manager', color: 'text-purple-700', bgColor: 'bg-purple-100', department: 'Sales' },
  SALES_MANAGER: { label: 'Sales Manager', color: 'text-violet-700', bgColor: 'bg-violet-100', department: 'Sales' },
  MARKETING_MANAGER: { label: 'Marketing Manager', color: 'text-pink-700', bgColor: 'bg-pink-100', department: 'Marketing' },
  CONTENT_SPECIALIST: { label: 'Content Specialist', color: 'text-rose-700', bgColor: 'bg-rose-100', department: 'Marketing' },
  GROWTH_MANAGER: { label: 'Growth Manager', color: 'text-fuchsia-700', bgColor: 'bg-fuchsia-100', department: 'Marketing' },
  CUSTOMER_SUCCESS_MANAGER: { label: 'CS Manager', color: 'text-teal-700', bgColor: 'bg-teal-100', department: 'Customer Success' },
  SUPPORT_SPECIALIST: { label: 'Support Specialist', color: 'text-cyan-700', bgColor: 'bg-cyan-100', department: 'Customer Success' },
  ONBOARDING_SPECIALIST: { label: 'Onboarding Specialist', color: 'text-sky-700', bgColor: 'bg-sky-100', department: 'Customer Success' },
  DEVELOPER: { label: 'Developer', color: 'text-emerald-700', bgColor: 'bg-emerald-100', department: 'Engineering' },
  TECHNICAL_SUPPORT: { label: 'Technical Support', color: 'text-green-700', bgColor: 'bg-green-100', department: 'Engineering' },
  PRODUCT_MANAGER: { label: 'Product Manager', color: 'text-lime-700', bgColor: 'bg-lime-100', department: 'Product' },
  CEO: { label: 'CEO', color: 'text-amber-700', bgColor: 'bg-amber-100', department: 'Executive' },
  CTO: { label: 'CTO', color: 'text-orange-700', bgColor: 'bg-orange-100', department: 'Executive' },
  COO: { label: 'COO', color: 'text-red-700', bgColor: 'bg-red-100', department: 'Executive' },
  CFO: { label: 'CFO', color: 'text-yellow-700', bgColor: 'bg-yellow-100', department: 'Executive' },
  VP_SALES: { label: 'VP Sales', color: 'text-blue-700', bgColor: 'bg-blue-100', department: 'Executive' },
  VP_MARKETING: { label: 'VP Marketing', color: 'text-pink-700', bgColor: 'bg-pink-100', department: 'Executive' },
  VP_ENGINEERING: { label: 'VP Engineering', color: 'text-emerald-700', bgColor: 'bg-emerald-100', department: 'Executive' },
  VP_CUSTOMER_SUCCESS: { label: 'VP Customer Success', color: 'text-teal-700', bgColor: 'bg-teal-100', department: 'Executive' },
  OPERATIONS_MANAGER: { label: 'Operations Manager', color: 'text-gray-700', bgColor: 'bg-gray-100', department: 'Operations' },
  PROJECT_MANAGER: { label: 'Project Manager', color: 'text-slate-700', bgColor: 'bg-slate-100', department: 'Operations' },
  INTERN: { label: 'Intern', color: 'text-neutral-700', bgColor: 'bg-neutral-100', department: 'Other' },
  CONTRACTOR: { label: 'Contractor', color: 'text-stone-700', bgColor: 'bg-stone-100', department: 'Other' },
  OTHER: { label: 'Other', color: 'text-zinc-700', bgColor: 'bg-zinc-100', department: 'Other' }
}

const departmentOptions = [
  'SALES', 'MARKETING', 'CUSTOMER_SUCCESS', 'ENGINEERING', 'PRODUCT', 
  'OPERATIONS', 'EXECUTIVE', 'FINANCE', 'HR', 'OTHER'
]

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  
  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  // Fetch team members
  const fetchTeamMembers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        role: roleFilter,
        department: departmentFilter,
        status: statusFilter
      })

      const res = await fetch(`/api/superadmin/team?${params}`)
      const data = await res.json()

      if (res.ok) {
        setTeamMembers(data.teamMembers)
        setTotalPages(data.pagination.pages)
        setTotal(data.pagination.total)
        setStats(data.stats)
        setAvailableUsers(data.availableUsers)
      } else {
        toast.error('Failed to fetch team members')
      }
    } catch (error) {
      toast.error('Error loading team')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamMembers()
  }, [page, search, roleFilter, departmentFilter, statusFilter])

  // Get initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500 mt-1">Manage your team members, roles, and assignments</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Team Member
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 text-teal-500" />
              <span className="text-xs text-green-500">{stats.active} active</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total Members</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.byRole?.account_manager || 0}</p>
            <p className="text-sm text-gray-500">Account Managers</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-6 h-6 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(stats.byRole?.sales_representative || 0) + (stats.byRole?.account_executive || 0)}
            </p>
            <p className="text-sm text-gray-500">Sales Team</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Object.values(stats.byRole || {}).filter((_, i) => i < 5).reduce((a: number, b: any) => a + b, 0)}
            </p>
            <p className="text-sm text-gray-500">Leadership</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Roles</option>
            {Object.entries(roleConfig).map(([key, { label }]) => (
              <option key={key} value={key.toLowerCase()}>{label}</option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Departments</option>
            {departmentOptions.map((dept) => (
              <option key={dept} value={dept.toLowerCase()}>{dept.replace('_', ' ')}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            onClick={fetchTeamMembers}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Team Members Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No team members found</h3>
          <p className="text-gray-500 mt-1">Add your first team member to get started.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Team Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelectedMember(member); setShowDetailModal(true); }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <span className="text-teal-700 font-bold">{getInitials(member.name)}</span>
                    </div>
                  )}
                  <div className="ml-3">
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.title || roleConfig[member.role]?.label || member.role}</p>
                  </div>
                </div>
                {!member.isActive && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">Inactive</span>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="truncate">{member.email}</span>
                </div>
                {member.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {member.phone}
                  </div>
                )}
                {(member.city || member.country) && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Globe className="w-4 h-4 mr-2 text-gray-400" />
                    {[member.city, member.country].filter(Boolean).join(', ')}
                  </div>
                )}
                {member.territory && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {member.territory}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleConfig[member.role]?.bgColor || 'bg-gray-100'} ${roleConfig[member.role]?.color || 'text-gray-700'}`}>
                  {roleConfig[member.role]?.label || member.role}
                </span>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span title="Leads">{member._count.assignedLeads} leads</span>
                  <span title="Businesses">{member._count.assignedBusinesses} accts</span>
                </div>
              </div>

              {member.user && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-xs text-green-600">
                  <Link2 className="w-3 h-3 mr-1" />
                  Linked to user account
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} members
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTeamMemberModal
          availableUsers={availableUsers}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { fetchTeamMembers(); setShowCreateModal(false); }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedMember && (
        <TeamMemberDetailModal
          member={selectedMember}
          availableUsers={availableUsers}
          onClose={() => { setShowDetailModal(false); setSelectedMember(null); }}
          onUpdate={fetchTeamMembers}
        />
      )}
    </div>
  )
}

// Create Team Member Modal
function CreateTeamMemberModal({
  availableUsers,
  onClose,
  onSuccess
}: {
  availableUsers: AvailableUser[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    role: 'ACCOUNT_MANAGER',
    department: 'SALES',
    userId: '',
    country: '',
    city: '',
    timezone: '',
    territory: '',
    region: '',
    monthlyLeadQuota: '',
    monthlyRevenueTarget: '',
    bio: '',
    startDate: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/superadmin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          monthlyLeadQuota: formData.monthlyLeadQuota ? parseInt(formData.monthlyLeadQuota) : null,
          monthlyRevenueTarget: formData.monthlyRevenueTarget ? parseFloat(formData.monthlyRevenueTarget) : null,
          userId: formData.userId || null
        })
      })

      if (res.ok) {
        toast.success('Team member added successfully')
        onSuccess()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to add team member')
      }
    } catch (error) {
      toast.error('Error adding team member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Team Member</h2>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Senior Account Manager"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <optgroup label="Sales & Revenue">
                  <option value="SALES_REPRESENTATIVE">Sales Representative</option>
                  <option value="ACCOUNT_EXECUTIVE">Account Executive</option>
                  <option value="ACCOUNT_MANAGER">Account Manager</option>
                  <option value="SALES_MANAGER">Sales Manager</option>
                </optgroup>
                <optgroup label="Marketing">
                  <option value="MARKETING_MANAGER">Marketing Manager</option>
                  <option value="CONTENT_SPECIALIST">Content Specialist</option>
                  <option value="GROWTH_MANAGER">Growth Manager</option>
                </optgroup>
                <optgroup label="Customer Success">
                  <option value="CUSTOMER_SUCCESS_MANAGER">Customer Success Manager</option>
                  <option value="SUPPORT_SPECIALIST">Support Specialist</option>
                  <option value="ONBOARDING_SPECIALIST">Onboarding Specialist</option>
                </optgroup>
                <optgroup label="Technology">
                  <option value="DEVELOPER">Developer</option>
                  <option value="TECHNICAL_SUPPORT">Technical Support</option>
                  <option value="PRODUCT_MANAGER">Product Manager</option>
                </optgroup>
                <optgroup label="Executive">
                  <option value="CEO">CEO</option>
                  <option value="CTO">CTO</option>
                  <option value="COO">COO</option>
                  <option value="CFO">CFO</option>
                  <option value="VP_SALES">VP Sales</option>
                  <option value="VP_MARKETING">VP Marketing</option>
                  <option value="VP_ENGINEERING">VP Engineering</option>
                  <option value="VP_CUSTOMER_SUCCESS">VP Customer Success</option>
                </optgroup>
                <optgroup label="Operations">
                  <option value="OPERATIONS_MANAGER">Operations Manager</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="INTERN">Intern</option>
                  <option value="CONTRACTOR">Contractor</option>
                  <option value="OTHER">Other</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>{dept.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="e.g., United States"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., New York"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select timezone</option>
                <optgroup label="Americas">
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Barbados">Barbados (AST)</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="Europe/London">London (GMT/BST)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Europe/Tirane">Tirana (CET)</option>
                  <option value="Europe/Athens">Athens (EET)</option>
                </optgroup>
                <optgroup label="Middle East">
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Asia/Bahrain">Bahrain (AST)</option>
                  <option value="Asia/Riyadh">Riyadh (AST)</option>
                  <option value="Asia/Kuwait">Kuwait (AST)</option>
                </optgroup>
                <optgroup label="Asia Pacific">
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sales Territory</label>
              <input
                type="text"
                value={formData.territory}
                onChange={(e) => setFormData({ ...formData, territory: e.target.value })}
                placeholder="e.g., North America"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sales Region</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g., Northeast US"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Lead Quota</label>
              <input
                type="number"
                value={formData.monthlyLeadQuota}
                onChange={(e) => setFormData({ ...formData, monthlyLeadQuota: e.target.value })}
                placeholder="Target leads per month"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue Target ($)</label>
              <input
                type="number"
                value={formData.monthlyRevenueTarget}
                onChange={(e) => setFormData({ ...formData, monthlyRevenueTarget: e.target.value })}
                placeholder="Revenue target"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to User Account</label>
              <select
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">No user account</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Optional: Link to existing SuperAdmin user</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={2}
              placeholder="Brief bio or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
              {loading ? 'Adding...' : 'Add Team Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Team Member Detail Modal
function TeamMemberDetailModal({
  member,
  availableUsers,
  onClose,
  onUpdate
}: {
  member: TeamMember
  availableUsers: AvailableUser[]
  onClose: () => void
  onUpdate: () => void
}) {
  const [activeTab, setActiveTab] = useState<'profile' | 'leads' | 'businesses'>('profile')
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [assignedBusinesses, setAssignedBusinesses] = useState<any[]>([])
  const [unassignedBusinesses, setUnassignedBusinesses] = useState<any[]>([])
  const [assignLoading, setAssignLoading] = useState(false)

  // Fetch businesses when tab changes
  useEffect(() => {
    if (activeTab === 'businesses') {
      fetchBusinesses()
    }
  }, [activeTab])

  const fetchBusinesses = async () => {
    try {
      const res = await fetch(`/api/superadmin/team/${member.id}/businesses`)
      if (res.ok) {
        const data = await res.json()
        setAssignedBusinesses(data.assignedBusinesses)
        setUnassignedBusinesses(data.unassignedBusinesses)
      }
    } catch (error) {
      console.error('Error fetching businesses:', error)
    }
  }

  const handleAssignBusiness = async (businessId: string) => {
    setAssignLoading(true)
    try {
      const res = await fetch(`/api/superadmin/team/${member.id}/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessIds: [businessId] })
      })

      if (res.ok) {
        toast.success('Business assigned')
        fetchBusinesses()
        onUpdate()
      } else {
        toast.error('Failed to assign business')
      }
    } catch (error) {
      toast.error('Error assigning business')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleUnassignBusiness = async (businessId: string) => {
    try {
      const res = await fetch(`/api/superadmin/team/${member.id}/businesses?businessId=${businessId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Business unassigned')
        fetchBusinesses()
        onUpdate()
      } else {
        toast.error('Failed to unassign business')
      }
    } catch (error) {
      toast.error('Error unassigning business')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this team member? This cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/team/${member.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Team member deleted')
        onUpdate()
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to delete team member')
      }
    } catch (error) {
      toast.error('Error deleting team member')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-teal-700 font-bold text-lg">{getInitials(member.name)}</span>
                </div>
              )}
              <div className="ml-4">
                <h2 className="text-xl font-semibold text-gray-900">{member.name}</h2>
                <p className="text-gray-500">{member.title || roleConfig[member.role]?.label}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex gap-6">
            {['profile', 'leads', 'businesses'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-3 border-b-2 text-sm font-medium capitalize ${
                  activeTab === tab 
                    ? 'border-teal-500 text-teal-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab} {tab === 'leads' && `(${member._count.assignedLeads})`}
                {tab === 'businesses' && `(${member._count.assignedBusinesses})`}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex gap-3">
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Contact</h4>
                    <div className="space-y-2">
                      <p className="flex items-center text-gray-700">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {member.email}
                      </p>
                      {member.phone && (
                        <p className="flex items-center text-gray-700">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {member.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {(member.country || member.city) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Location</h4>
                      <p className="flex items-center text-gray-700">
                        <Globe className="w-4 h-4 mr-2 text-gray-400" />
                        {[member.city, member.country].filter(Boolean).join(', ')}
                      </p>
                      {member.timezone && (
                        <p className="text-sm text-gray-500 ml-6">{member.timezone}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Role & Department</h4>
                    <p className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${roleConfig[member.role]?.bgColor} ${roleConfig[member.role]?.color}`}>
                      {roleConfig[member.role]?.label || member.role}
                    </p>
                    {member.department && (
                      <p className="text-gray-600 mt-1">{member.department}</p>
                    )}
                  </div>

                  {(member.territory || member.region) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Territory</h4>
                      <p className="flex items-center text-gray-700">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {member.territory} {member.region && `- ${member.region}`}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Performance</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{member._count.assignedLeads}</p>
                        <p className="text-xs text-gray-500">Leads</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{member._count.assignedBusinesses}</p>
                        <p className="text-xs text-gray-500">Accounts</p>
                      </div>
                    </div>
                  </div>

                  {(member.monthlyLeadQuota || member.monthlyRevenueTarget) && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Targets</h4>
                      <div className="space-y-1 text-sm">
                        {member.monthlyLeadQuota && (
                          <p className="text-gray-600">Lead Quota: {member.monthlyLeadQuota}/month</p>
                        )}
                        {member.monthlyRevenueTarget && (
                          <p className="text-gray-600">Revenue Target: ${member.monthlyRevenueTarget.toLocaleString()}/month</p>
                        )}
                      </div>
                    </div>
                  )}

                  {member.user && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Linked Account</h4>
                      <div className="flex items-center p-2 bg-green-50 rounded-lg">
                        <Link2 className="w-4 h-4 mr-2 text-green-600" />
                        <span className="text-sm text-green-700">{member.user.email}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {member.bio && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Bio</h4>
                  <p className="text-gray-700">{member.bio}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600">{member._count.assignedLeads} leads assigned</p>
                <Link
                  href={`/superadmin/leads?assignedTo=${member.id}`}
                  className="text-teal-600 hover:text-teal-700 text-sm flex items-center"
                >
                  View all leads <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </div>
              <p className="text-center text-gray-500 py-8">
                View and manage leads from the <Link href="/superadmin/leads" className="text-teal-600 hover:underline">Leads page</Link>
              </p>
            </div>
          )}

          {activeTab === 'businesses' && (
            <BusinessAssignmentTab 
              memberId={member.id}
              assignedBusinesses={assignedBusinesses}
              unassignedBusinesses={unassignedBusinesses}
              assignLoading={assignLoading}
              onAssign={handleAssignBusiness}
              onUnassign={handleUnassignBusiness}
              onRefresh={fetchBusinesses}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={handleDelete}
            disabled={loading || member._count.assignedLeads > 0 || member._count.assignedBusinesses > 0}
            className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            Delete Member
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Business Assignment Tab Component with searchable dropdown
function BusinessAssignmentTab({
  memberId,
  assignedBusinesses,
  unassignedBusinesses,
  assignLoading,
  onAssign,
  onUnassign,
  onRefresh
}: {
  memberId: string
  assignedBusinesses: any[]
  unassignedBusinesses: any[]
  assignLoading: boolean
  onAssign: (id: string) => Promise<void>
  onUnassign: (id: string) => Promise<void>
  onRefresh: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  // Filter businesses based on search
  const filteredBusinesses = unassignedBusinesses.filter(biz => 
    biz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    biz.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectBusiness = async (businessId: string) => {
    await onAssign(businessId)
    setSearchQuery('')
    setShowDropdown(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-600">{assignedBusinesses.length} businesses assigned</p>
      </div>

      {/* Searchable Business Assignment */}
      {unassignedBusinesses.length > 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Assign Business</h4>
          <div className="relative">
            <input
              type="text"
              placeholder="Search businesses by name or slug..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            {showDropdown && searchQuery.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto scrollbar-hide">
                {filteredBusinesses.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">No businesses found</p>
                ) : (
                  filteredBusinesses.slice(0, 10).map(biz => (
                    <button
                      key={biz.id}
                      onClick={() => handleSelectBusiness(biz.id)}
                      disabled={assignLoading}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                    >
                      {biz.logo ? (
                        <img src={biz.logo} alt={biz.name} className="w-8 h-8 rounded object-contain" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{biz.name}</p>
                        <p className="text-xs text-gray-500">/{biz.slug} • {biz.subscriptionPlan}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {unassignedBusinesses.length} businesses available for assignment
          </p>
        </div>
      )}

      {/* Assigned Businesses List */}
      {assignedBusinesses.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No businesses assigned yet</p>
      ) : (
        <div className="space-y-2">
          {assignedBusinesses.map((biz) => (
            <div key={biz.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-center">
                {biz.logo ? (
                  <img src={biz.logo} alt={biz.name} className="w-10 h-10 rounded object-contain mr-3" />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mr-3">
                    <Building2 className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{biz.name}</p>
                  <p className="text-sm text-gray-500">
                    {biz.subscriptionPlan} • {biz._count.products} products • {biz._count.orders} orders
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/superadmin/businesses/${biz.id}`}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => onUnassign(biz.id)}
                  className="p-2 text-red-400 hover:text-red-600"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
