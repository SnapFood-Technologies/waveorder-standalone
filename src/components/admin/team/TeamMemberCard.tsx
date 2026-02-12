// src/components/admin/team/TeamMemberCard.tsx
'use client'

import { useState } from 'react'
import { 
  MoreVertical, 
  Edit3, 
  Trash2, 
  User,
  Calendar,
  Clock
} from 'lucide-react'
import { getRoleDisplayName, getRoleBadgeColor } from '@/lib/permissions'

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  role: 'OWNER' | 'MANAGER' | 'STAFF' | 'DELIVERY'
  joinedAt: string
  lastActive: string
}

interface TeamMemberCardProps {
  member: TeamMember
  canUpdateRoles: boolean
  canRemove: boolean
  currentUserId: string
  onUpdateRole: (userId: string, newRole: string) => void
  onRemove: (userId: string) => void
}

export function TeamMemberCard({ 
  member, 
  canUpdateRoles, 
  canRemove, 
  currentUserId,
  onUpdateRole,
  onRemove 
}: TeamMemberCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)

  const isCurrentUser = member.userId === currentUserId
  const canEditThisUser = !isCurrentUser && member.role !== 'OWNER'
  const canRemoveThisUser = !isCurrentUser && member.role !== 'OWNER'


  const handleRoleChange = (newRole: string) => {
    onUpdateRole(member.userId, newRole)
    setShowRoleModal(false)
    setShowActions(false)
  }

  const handleRemove = () => {
    onRemove(member.userId)
    setShowRemoveModal(false)
    setShowActions(false)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getLastActiveText = (lastActive: string) => {
    const now = new Date()
    const active = new Date(lastActive)
    const diffInDays = Math.floor((now.getTime() - active.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return 'Today'
    } else if (diffInDays === 1) {
      return 'Yesterday'
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`
    } else {
      return formatDate(lastActive)
    }
  }

  return (
    <>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 font-semibold text-sm">
                {getInitials(member.name)}
              </span>
            </div>
            
            {/* Member Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">{member.name}</h3>
                {isCurrentUser && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    You
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{member.email}</p>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                  {getRoleDisplayName(member.role)}
                </span>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  Joined {formatDate(member.joinedAt)}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {getLastActiveText(member.lastActive)}
                </div>
              </div>
            </div>
          </div>
          
          {(canUpdateRoles || canRemove) && (canEditThisUser || canRemoveThisUser) && (
  <div className="relative">
    <button
      onClick={() => setShowActions(!showActions)}
      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <MoreVertical className="w-4 h-4" />
    </button>
    
    {showActions && (
      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
        <div className="py-1">
          {canUpdateRoles && canEditThisUser && (
            <button
              onClick={() => setShowRoleModal(true)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Change Role
            </button>
          )}
          
          {canRemove && canRemoveThisUser && (
            <button
              onClick={() => setShowRemoveModal(true)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Member
            </button>
          )}
        </div>
      </div>
    )}
  </div>
)}
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Change Role for {member.name}
            </h3>
            
            <div className="space-y-3">
              {(['MANAGER', 'STAFF'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    member.role === role
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {getRoleDisplayName(role)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {role === 'MANAGER' 
                          ? 'Can manage products, orders, and invite staff'
                          : 'Can view and manage orders and products'
                        }
                      </div>
                    </div>
                    {member.role === role && (
                      <span className="text-teal-600 text-sm font-medium">Current</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Remove Team Member
            </h3>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove <strong>{member.name}</strong> from the team?
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">
                <strong>This action cannot be undone.</strong> They will lose access to:
              </p>
              <ul className="text-sm text-red-700 mt-2 list-disc list-inside">
                <li>Business dashboard</li>
                <li>Orders and products</li>
                <li>All business data</li>
              </ul>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
