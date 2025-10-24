// src/components/superadmin/support/AssignTicketModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, User, Check } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AssignTicketModalProps {
  ticketId: string
  currentAssignee?: {
    id: string
    name: string
    email: string
  }
  onClose: () => void
  onAssign: (userId: string) => void
}

export function AssignTicketModal({ ticketId, currentAssignee, onClose, onAssign }: AssignTicketModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/superadmin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedUserId) return

    setAssigning(true)
    try {
      await onAssign(selectedUserId)
    } finally {
      setAssigning(false)
    }
  }

  const handleUnassign = async () => {
    setAssigning(true)
    try {
      await onAssign('') // Empty string to unassign
    } finally {
      setAssigning(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Assign Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {currentAssignee && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Currently assigned to: <strong>{currentAssignee.name}</strong>
              </p>
            </div>
          )}

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select User
            </label>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users.map((user) => (
                <label
                  key={user.id}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedUserId === user.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="user"
                    value={user.id}
                    checked={selectedUserId === user.id}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
                    </div>
                    {selectedUserId === user.id && (
                      <Check className="w-5 h-5 text-teal-600" />
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex space-x-3">
              {currentAssignee && (
                <button
                  onClick={handleUnassign}
                  disabled={assigning}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Unassign
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || !selectedUserId}
                className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Assign Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
