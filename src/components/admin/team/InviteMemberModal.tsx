// src/components/admin/team/InviteMemberModal.tsx
'use client'

import { useState } from 'react'
import { X, UserPlus, Mail, AlertCircle, CheckCircle } from 'lucide-react'
import { getRoleDisplayName, getRoleBadgeColor } from '@/lib/permissions'

interface InviteMemberModalProps {
  businessId: string
  onSuccess: () => void
  onClose: () => void
}

interface TeamMember {
  email: string
  role: 'MANAGER' | 'STAFF'
}

export function InviteMemberModal({ businessId, onSuccess, onClose }: InviteMemberModalProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { email: '', role: 'STAFF' }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const addMember = () => {
    setTeamMembers(prev => [...prev, { email: '', role: 'STAFF' }])
  }

  const updateMember = (index: number, field: keyof TeamMember, value: string) => {
    setTeamMembers(prev => prev.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    ))
  }

  const removeMember = (index: number) => {
    setTeamMembers(prev => prev.filter((_, i) => i !== index))
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async () => {
    setError(null)
    
    // Validate all members
    const validMembers = teamMembers.filter(member => {
      if (!member.email.trim()) return false
      if (!validateEmail(member.email.trim())) return false
      return true
    })

    if (validMembers.length === 0) {
      setError('Please add at least one valid email address')
      return
    }

    // Check for duplicates
    const emails = validMembers.map(m => m.email.trim().toLowerCase())
    const uniqueEmails = [...new Set(emails)]
    if (emails.length !== uniqueEmails.length) {
      setError('Please remove duplicate email addresses')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/admin/stores/${businessId}/team/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: validMembers[0].email.trim(),
          role: validMembers[0].role
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send invitation')
      }

      setSuccess(true)
      
      // If multiple members, send them one by one
      if (validMembers.length > 1) {
        for (let i = 1; i < validMembers.length; i++) {
          try {
            await fetch(`/api/admin/stores/${businessId}/team/members`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: validMembers[i].email.trim(),
                role: validMembers[i].role
              })
            })
          } catch (error) {
            console.error(`Failed to invite ${validMembers[i].email}:`, error)
          }
        }
      }

      setTimeout(() => {
        onSuccess()
      }, 2000)

    } catch (error) {
      console.error('Error sending invitations:', error)
      setError(error instanceof Error ? error.message : 'Failed to send invitations')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Invitations Sent!
            </h3>
            <p className="text-gray-600 mb-6">
              Team members will receive email invitations to join your business.
            </p>
            <button
              onClick={onSuccess}
              className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Invite Team Members</h2>
            <p className="text-gray-600 mt-1">Send invitations to join your business</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {teamMembers.map((member, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  {/* Email Input */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) => updateMember(index, 'email', e.target.value)}
                        placeholder="colleague@example.com"
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>
                  
                  {/* Role Selection */}
                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={member.role}
                      onChange={(e) => updateMember(index, 'role', e.target.value as 'MANAGER' | 'STAFF')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>

                  {/* Remove Button */}
                  {teamMembers.length > 1 && (
                    <div className="flex items-end">
                      <button
                        onClick={() => removeMember(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Role Description */}
                <div className="mt-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                    {getRoleDisplayName(member.role)}
                  </span>
                  <span className="text-xs text-gray-600 ml-2">
                    {member.role === 'MANAGER' 
                      ? 'Can manage products, orders, and invite staff'
                      : 'Can view and manage orders and products'
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Add Member Button */}
          <button
            onClick={addMember}
            className="mt-4 flex items-center text-teal-600 hover:text-teal-700 transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Another Member
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || teamMembers.every(m => !m.email.trim())}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending Invitations...' : 'Send Invitations'}
          </button>
        </div>
      </div>
    </div>
  )
}




