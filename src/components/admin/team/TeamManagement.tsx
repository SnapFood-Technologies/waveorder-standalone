// src/components/admin/team/TeamManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { useBusiness } from '@/contexts/BusinessContext'
import { useSession } from 'next-auth/react'
import { 
  Users, 
  UserPlus, 
  Mail, 
  Calendar, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronDown
} from 'lucide-react'
import { 
  canInviteMembers, 
  canRemoveMembers, 
  canUpdateMemberRoles, 
  getRoleDisplayName, 
  getRoleBadgeColor,
  getRoleDescription 
} from '@/lib/permissions'
import { InviteMemberModal } from './InviteMemberModal'
import { TeamMemberCard } from './TeamMemberCard'

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  role: 'OWNER' | 'MANAGER' | 'STAFF'
  joinedAt: string
  lastActive: string
}

interface TeamInvitation {
  id: string
  email: string
  role: 'MANAGER' | 'STAFF'
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
  expiresAt: string
  sentAt: string
}

interface TeamManagementProps {
  businessId: string
}

export function TeamManagement({ businessId }: TeamManagementProps) {
  const { userRole, subscription } = useBusiness()
  const { data: session } = useSession()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('ALL')
  const [showRolePermissions, setShowRolePermissions] = useState(false)

  const canInvite = canInviteMembers(userRole)
  const canRemove = canRemoveMembers(userRole)
  const canUpdateRoles = canUpdateMemberRoles(userRole)

  useEffect(() => {
    fetchTeamData()
    
    // Poll for invitation updates every 30 seconds
    const interval = setInterval(() => {
      fetchInvitations()
    }, 30000)

    return () => clearInterval(interval)
  }, [businessId])

  const fetchTeamData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchMembers(),
        fetchInvitations()
      ])
    } catch (error) {
      console.error('Error fetching team data:', error)
      setError('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/team/members`)
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
      const data = await response.json()
      setMembers(data.members || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      throw error
    }
  }

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/team/invitations`)
      if (!response.ok) {
        throw new Error('Failed to fetch invitations')
      }
      const data = await response.json()
      setInvitations(data.invitations || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
      throw error
    }
  }

  const handleInviteSuccess = () => {
    setShowInviteModal(false)
    fetchInvitations()
  }

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(
        `/api/admin/stores/${businessId}/team/invitations/${invitationId}`,
        { method: 'POST' }
      )
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to resend invitation')
      }

      await fetchInvitations()
      // Show success toast
    } catch (error) {
      console.error('Error resending invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to resend invitation')
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/admin/stores/${businessId}/team/invitations/${invitationId}`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to cancel invitation')
      }

      await fetchInvitations()
      // Show success toast
    } catch (error) {
      console.error('Error canceling invitation:', error)
      setError(error instanceof Error ? error.message : 'Failed to cancel invitation')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(
        `/api/admin/stores/${businessId}/team/members/${userId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole })
        }
      )
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update role')
      }

      await fetchMembers()
      // Show success toast
    } catch (error) {
      console.error('Error updating role:', error)
      setError(error instanceof Error ? error.message : 'Failed to update role')
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this team member? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(
        `/api/admin/stores/${businessId}/team/members/${userId}`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to remove member')
      }

      await fetchMembers()
      // Show success toast
    } catch (error) {
      console.error('Error removing member:', error)
      setError(error instanceof Error ? error.message : 'Failed to remove member')
    }
  }

  // Filter members based on search and role filter
  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = filterRole === 'ALL' || member.role === filterRole
    
    return matchesSearch && matchesRole
  })

  // Filter invitations (only show pending and expired)
  const filteredInvitations = invitations.filter(invitation => 
    invitation.status === 'PENDING' || invitation.status === 'EXPIRED'
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'EXPIRED':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'ACCEPTED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-1">Manage team members and invitations</p>
        </div>
        
        {canInvite && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </button>
        )}
      </div>

      {/* Role Permissions Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <button
          onClick={() => setShowRolePermissions(!showRolePermissions)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="font-medium text-gray-900">Role Permissions</h3>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showRolePermissions ? 'rotate-180' : ''}`} />
        </button>
        
        {showRolePermissions && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['OWNER', 'MANAGER', 'STAFF'] as const).map(role => (
              <div key={role} className="bg-white rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}>
                    {getRoleDisplayName(role)}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{getRoleDescription(role)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="MANAGER">Manager</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>
      </div>

      {/* Active Members */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Members</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredMembers.length} of {members.length} members
          </p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredMembers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No team members found</p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.id}
                member={member}
                canUpdateRoles={canUpdateRoles}
                canRemove={canRemove}
                currentUserId={session?.user?.id}
                onUpdateRole={handleUpdateRole}
                onRemove={handleRemoveMember}
              />
            ))
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {filteredInvitations.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Invitations</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredInvitations.length} pending invitation{filteredInvitations.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredInvitations.map((invitation) => (
              <div key={invitation.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-900">{invitation.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(invitation.role)}`}>
                          {getRoleDisplayName(invitation.role)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(invitation.status)}`}>
                          {invitation.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Sent {new Date(invitation.sentAt).toLocaleDateString()} • 
                        Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {invitation.status === 'PENDING' && canInvite && (
                      <>
                        <button
                          onClick={() => handleResendInvitation(invitation.id)}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Resend invitation"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelInvitation(invitation.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel invitation"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteMemberModal
          businessId={businessId}
          onSuccess={handleInviteSuccess}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  )
}
