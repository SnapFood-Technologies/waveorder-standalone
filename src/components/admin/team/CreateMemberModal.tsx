// src/components/admin/team/CreateMemberModal.tsx
'use client'

import { useState } from 'react'
import { X, UserPlus, Mail, AlertCircle, CheckCircle, Copy, User, Phone } from 'lucide-react'
import { getRoleDisplayName, getRoleBadgeColor } from '@/lib/permissions'

interface CreateMemberModalProps {
  businessId: string
  onSuccess: () => void
  onClose: () => void
  enableDeliveryManagement?: boolean
}

interface TeamMember {
  name: string
  email: string
  phone?: string
  role: 'MANAGER' | 'STAFF' | 'DELIVERY'
}

interface CreatedCredentials {
  email: string
  password: string
}

export function CreateMemberModal({ businessId, onSuccess, onClose, enableDeliveryManagement = false }: CreateMemberModalProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: '', email: '', phone: '', role: 'STAFF' }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials[]>([])

  const addMember = () => {
    setTeamMembers(prev => [...prev, { name: '', email: '', phone: '', role: 'STAFF' }])
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleSubmit = async () => {
    setError(null)
    
    // Validate all members
    const validMembers = teamMembers.filter(member => {
      if (!member.name.trim()) return false
      if (!member.email.trim()) return false
      if (!validateEmail(member.email.trim())) return false
      return true
    })

    if (validMembers.length === 0) {
      setError('Please add at least one valid member with name and email')
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
    const credentials: CreatedCredentials[] = []

    try {
      // Create members one by one
      for (const member of validMembers) {
        const response = await fetch(`/api/admin/stores/${businessId}/team/members/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: member.name.trim(),
            email: member.email.trim(),
            phone: member.phone?.trim() || null,
            role: member.role
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || `Failed to create member: ${member.email}`)
        }

        // Store credentials if provided
        if (data.credentials) {
          credentials.push(data.credentials)
        }
      }

      setCreatedCredentials(credentials)
      setSuccess(true)

      setTimeout(() => {
        onSuccess()
      }, credentials.length > 0 ? 10000 : 2000) // Give more time if credentials shown

    } catch (error) {
      console.error('Error creating members:', error)
      setError(error instanceof Error ? error.message : 'Failed to create members')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Team Members Created!
            </h3>
            <p className="text-gray-600">
              {createdCredentials.length > 0 
                ? 'Please copy and share the login credentials with each team member.'
                : 'Team members have been added successfully.'}
            </p>
          </div>

          {createdCredentials.length > 0 && (
            <div className="space-y-4 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      Important: Save these credentials
                    </p>
                    <p className="text-xs text-yellow-700">
                      These passwords cannot be retrieved later. Make sure to copy and securely share them with each team member.
                    </p>
                  </div>
                </div>
              </div>

              {createdCredentials.map((cred, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{cred.email}</span>
                    <button
                      onClick={() => copyToClipboard(`Email: ${cred.email}\nPassword: ${cred.password}`)}
                      className="flex items-center text-xs text-teal-600 hover:text-teal-700"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy All
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                      <span className="text-xs text-gray-600">Email:</span>
                      <div className="flex items-center">
                        <span className="text-sm font-mono text-gray-900 mr-2">{cred.email}</span>
                        <button
                          onClick={() => copyToClipboard(cred.email)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Copy email"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded px-3 py-2">
                      <span className="text-xs text-gray-600">Password:</span>
                      <div className="flex items-center">
                        <span className="text-sm font-mono text-gray-900 mr-2">{cred.password}</span>
                        <button
                          onClick={() => copyToClipboard(cred.password)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Copy password"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onSuccess}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
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
            <h2 className="text-xl font-semibold text-gray-900">Create Team Member</h2>
            <p className="text-gray-600 mt-1">Manually create team members with login credentials</p>
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 mb-1">
                  Manual Creation
                </p>
                <p className="text-xs text-blue-700">
                  A user account will be created immediately with a generated password. You'll receive the credentials to share with the team member.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {teamMembers.map((member, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-3">
                  {/* Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => updateMember(index, 'name', e.target.value)}
                        placeholder="John Doe"
                        className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Email Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
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

                    {/* Phone Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={member.phone || ''}
                          onChange={(e) => updateMember(index, 'phone', e.target.value)}
                          placeholder="+1234567890"
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      value={member.role}
                      onChange={(e) => updateMember(index, 'role', e.target.value as 'MANAGER' | 'STAFF' | 'DELIVERY')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                      {enableDeliveryManagement && <option value="DELIVERY">Delivery</option>}
                    </select>
                  </div>

                  {/* Role Description */}
                  <div className="flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                      {getRoleDisplayName(member.role)}
                    </span>
                    <span className="text-xs text-gray-600 ml-2">
                      {member.role === 'MANAGER' 
                        ? 'Can manage products, orders, and invite staff'
                        : member.role === 'DELIVERY'
                        ? 'Can view assigned delivery orders and update delivery status'
                        : 'Can view and manage orders and products'
                      }
                    </span>
                  </div>

                  {/* Remove Button */}
                  {teamMembers.length > 1 && (
                    <div className="flex justify-end">
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
            disabled={loading || teamMembers.every(m => !m.name.trim() || !m.email.trim())}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Members...' : 'Create Members'}
          </button>
        </div>
      </div>
    </div>
  )
}
