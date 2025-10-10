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
  ChevronDown,
  Shield,
  Settings,
  Eye
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('ALL')
  const [showRolePermissions, setShowRolePermissions] = useState(false)
  
  // Confirmation modals
  const [cancelInviteModal, setCancelInviteModal] = useState<string | null>(null)

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

  // Auto-hide success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timeout = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [successMessage])

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

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setError(null)
  }

  const showError = (message: string) => {
    setError(message)
    setSuccessMessage(null)
  }

  const handleInviteSuccess = () => {
    setShowInviteModal(false)
    fetchInvitations()
    showSuccess('Team member invited successfully!')
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

      const data = await response.json()
      await fetchInvitations()
      showSuccess(data.message || 'Invitation resent successfully!')
    } catch (error) {
      console.error('Error resending invitation:', error)
      showError(error instanceof Error ? error.message : 'Failed to resend invitation')
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(
        `/api/admin/stores/${businessId}/team/invitations/${invitationId}`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to cancel invitation')
      }

      const data = await response.json()
      await fetchInvitations()
      showSuccess(data.message || 'Invitation cancelled successfully!')
      setCancelInviteModal(null)
    } catch (error) {
      console.error('Error canceling invitation:', error)
      showError(error instanceof Error ? error.message : 'Failed to cancel invitation')
      setCancelInviteModal(null)
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

      const data = await response.json()
      await fetchMembers()
      showSuccess(data.message || 'Role updated successfully!')
    } catch (error) {
      console.error('Error updating role:', error)
      showError(error instanceof Error ? error.message : 'Failed to update role')
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/admin/stores/${businessId}/team/members/${userId}`,
        { method: 'DELETE' }
      )
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to remove member')
      }

      const data = await response.json()
      await fetchMembers()
      showSuccess(data.message || 'Team member removed successfully!')
    } catch (error) {
      console.error('Error removing member:', error)
      showError(error instanceof Error ? error.message : 'Failed to remove member')
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

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <p className="text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

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

      {/* Role Permissions Info - FIXED DESIGN */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowRolePermissions(!showRolePermissions)}
          className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Role Permissions</h3>
              <p className="text-sm text-gray-600">View what each role can do</p>
            </div>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              showRolePermissions ? 'rotate-180' : ''
            }`} 
          />
        </button>
        
        {showRolePermissions && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['OWNER', 'MANAGER', 'STAFF'] as const).map(role => (
                <div key={role} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(role)}`}>
                      {getRoleDisplayName(role)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {getRoleDescription(role)}
                  </p>
                </div>
              ))}
            </div>
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
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 appearance-none bg-white"
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
                          onClick={() => setCancelInviteModal(invitation.id)}
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

      {/* Cancel Invitation Confirmation Modal */}
      {cancelInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Invitation
            </h3>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel this invitation? The recipient will not be able to accept it.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCancelInviteModal(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Keep Invitation
              </button>
              <button
                onClick={() => handleCancelInvitation(cancelInviteModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Cancel Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
