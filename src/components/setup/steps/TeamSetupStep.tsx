'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { ArrowLeft, UserPlus, Mail, Trash2, Users } from 'lucide-react'

interface TeamSetupStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
}

interface TeamMember {
  email: string
  role: 'MANAGER' | 'STAFF'
}

const roles = [
  { value: 'MANAGER', label: 'Manager', description: 'Can manage orders, menu, and settings' },
  { value: 'STAFF', label: 'Staff', description: 'Can view and manage orders' }
]

export default function TeamSetupStep({ data, onComplete, onBack }: TeamSetupStepProps) {
  const [teamChoice, setTeamChoice] = useState<'add' | 'skip' | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    data.teamMembers || []
  )
  const [loading, setLoading] = useState(false)

  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, { email: '', role: 'STAFF' }])
  }

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setTeamMembers(prev => prev.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    ))
  }

  const removeTeamMember = (index: number) => {
    setTeamMembers(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (skip = false) => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const finalTeamMembers = skip ? [] : teamMembers.filter(member => member.email.trim())
    onComplete({ teamMembers: finalTeamMembers })
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Invite your team
        </h1>
        <p className="text-lg text-gray-600">
          Will other team members help manage orders?
        </p>
      </div>

      {!teamChoice ? (
        /* Initial Choice */
        <div className="max-w-2xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <button
              onClick={() => setTeamChoice('add')}
              className="p-8 border-2 border-gray-200 rounded-xl text-center hover:border-teal-300 hover:bg-teal-50 transition-all"
            >
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Add team members now
              </h3>
              <p className="text-gray-600">
                Invite colleagues to help manage your store
              </p>
            </button>

            <button
              onClick={() => setTeamChoice('skip')}
              className="p-8 border-2 border-gray-200 rounded-xl text-center hover:border-teal-300 hover:bg-teal-50 transition-all"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Skip - I'll manage alone for now
              </h3>
              <p className="text-gray-600">
                You can always invite team members later
              </p>
            </button>
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
        </div>
      ) : teamChoice === 'add' ? (
        /* Add Team Members Form */
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
              <button
                onClick={addTeamMember}
                className="flex items-center px-4 py-2 text-teal-600 border border-teal-300 rounded-lg hover:bg-teal-50 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Member
              </button>
            </div>

            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No team members added yet</p>
                <button
                  onClick={addTeamMember}
                  className="mt-2 text-teal-600 hover:text-teal-700 font-medium"
                >
                  Add your first team member
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                          placeholder="colleague@example.com"
                          className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                    </div>
                    
                    <select
                      value={member.role}
                      onChange={(e) => updateTeamMember(index, 'role', e.target.value as 'MANAGER' | 'STAFF')}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => removeTeamMember(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Descriptions */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Role Descriptions:</h4>
            <div className="space-y-2 text-sm">
              {roles.map(role => (
                <div key={role.value}>
                  <span className="font-medium text-gray-700">{role.label}:</span>{' '}
                  <span className="text-gray-600">{role.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setTeamChoice(null)}
              className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            
            <div className="space-x-4">
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip for Now
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Sending Invites...' : 'Send Invites'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Skip Confirmation */
        <div className="max-w-xl mx-auto text-center">
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              You'll manage solo for now
            </h3>
            <p className="text-gray-600 mb-6">
              That's perfectly fine! You can always invite team members later from your dashboard settings.
            </p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setTeamChoice(null)}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Continue...' : 'Continue'}
              </button>
            </div>
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  )
}