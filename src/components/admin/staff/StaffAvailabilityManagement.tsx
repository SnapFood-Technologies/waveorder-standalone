// src/components/admin/staff/StaffAvailabilityManagement.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  Save, 
  CheckCircle, 
  X, 
  Users,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react'

interface DayHours {
  open: string
  close: string
  closed: boolean
}

interface StaffAvailability {
  [staffId: string]: {
    workingHours: {
      monday: DayHours
      tuesday: DayHours
      wednesday: DayHours
      thursday: DayHours
      friday: DayHours
      saturday: DayHours
      sunday: DayHours
    }
    timeOff: Array<{
      id: string
      startDate: string
      endDate: string
      reason?: string
    }>
  }
}

interface StaffAvailabilityManagementProps {
  businessId: string
}

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  role: string
}

const DEFAULT_HOURS: DayHours = { open: '09:00', close: '17:00', closed: false }

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
]

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? '00' : '30'
  const time = `${hour.toString().padStart(2, '0')}:${minute}`
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  const ampm = hour < 12 ? 'AM' : 'PM'
  
  return {
    value: time,
    label: `${displayHour}:${minute} ${ampm}`
  }
})

export default function StaffAvailabilityManagement({ businessId }: StaffAvailabilityManagementProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [availability, setAvailability] = useState<StaffAvailability>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Time off form state
  const [showTimeOffModal, setShowTimeOffModal] = useState(false)
  const [timeOffStartDate, setTimeOffStartDate] = useState('')
  const [timeOffEndDate, setTimeOffEndDate] = useState('')
  const [timeOffReason, setTimeOffReason] = useState('')

  useEffect(() => {
    fetchTeamMembers()
    fetchAvailability()
  }, [businessId])

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/team/members`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.members || [])
        if (data.members && data.members.length > 0 && !selectedStaffId) {
          setSelectedStaffId(data.members[0].userId)
        }
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stores/${businessId}/staff/availability`)
      if (response.ok) {
        const data = await response.json()
        if (data.availability) {
          setAvailability(data.availability)
        }
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const initializeStaffAvailability = (staffId: string) => {
    if (!availability[staffId]) {
      setAvailability(prev => ({
        ...prev,
        [staffId]: {
          workingHours: {
            monday: DEFAULT_HOURS,
            tuesday: DEFAULT_HOURS,
            wednesday: DEFAULT_HOURS,
            thursday: DEFAULT_HOURS,
            friday: DEFAULT_HOURS,
            saturday: DEFAULT_HOURS,
            sunday: DEFAULT_HOURS
          },
          timeOff: []
        }
      }))
    }
  }

  const updateWorkingHours = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    if (!selectedStaffId) return
    
    initializeStaffAvailability(selectedStaffId)
    
    setAvailability(prev => {
      const currentStaff = prev[selectedStaffId]
      const currentDayHours = currentStaff?.workingHours?.[day as keyof typeof currentStaff.workingHours] || { open: '09:00', close: '17:00', closed: false }
      
      return {
        ...prev,
        [selectedStaffId]: {
          ...currentStaff,
          workingHours: {
            ...currentStaff?.workingHours,
            [day]: {
              ...currentDayHours,
              [field]: value
            }
          }
        }
      }
    })
  }

  const copyHoursToAllDays = () => {
    if (!selectedStaffId) return
    
    const currentDay = DAYS.find(d => d.key === 'monday')
    if (!currentDay) return
    
    const hours = availability[selectedStaffId]?.workingHours.monday || DEFAULT_HOURS
    
    initializeStaffAvailability(selectedStaffId)
    
    setAvailability(prev => ({
      ...prev,
      [selectedStaffId]: {
        ...prev[selectedStaffId],
        workingHours: {
          monday: hours,
          tuesday: hours,
          wednesday: hours,
          thursday: hours,
          friday: hours,
          saturday: hours,
          sunday: hours
        }
      }
    }))
  }

  const addTimeOff = () => {
    if (!selectedStaffId || !timeOffStartDate) return
    
    initializeStaffAvailability(selectedStaffId)
    
    const newTimeOff = {
      id: Date.now().toString(),
      startDate: timeOffStartDate,
      endDate: timeOffEndDate || timeOffStartDate,
      reason: timeOffReason
    }
    
    setAvailability(prev => ({
      ...prev,
      [selectedStaffId]: {
        ...prev[selectedStaffId],
        timeOff: [...(prev[selectedStaffId].timeOff || []), newTimeOff]
      }
    }))
    
    setShowTimeOffModal(false)
    setTimeOffStartDate('')
    setTimeOffEndDate('')
    setTimeOffReason('')
  }

  const removeTimeOff = (timeOffId: string) => {
    if (!selectedStaffId) return
    
    setAvailability(prev => ({
      ...prev,
      [selectedStaffId]: {
        ...prev[selectedStaffId],
        timeOff: prev[selectedStaffId].timeOff.filter(to => to.id !== timeOffId)
      }
    }))
  }

  const saveAvailability = async () => {
    if (!selectedStaffId) return
    
    try {
      setSaving(true)
      setError(null)
      
      const response = await fetch(`/api/admin/stores/${businessId}/staff/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: selectedStaffId,
          availability: availability[selectedStaffId]
        })
      })
      
      if (response.ok) {
        setSuccessMessage('Staff availability saved successfully')
        setTimeout(() => setSuccessMessage(null), 5000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to save availability')
      }
    } catch (error) {
      console.error('Error saving availability:', error)
      setError('Network error saving availability')
    } finally {
      setSaving(false)
    }
  }

  const selectedStaff = teamMembers.find(m => m.userId === selectedStaffId)
  const selectedAvailability = selectedStaffId ? availability[selectedStaffId] : null

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (teamMembers.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg border border-gray-200 text-center">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Members</h3>
        <p className="text-gray-600 mb-4">
          You need to add team members before you can manage their availability.
        </p>
        <a
          href={`/admin/stores/${businessId}/team`}
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Go to Team Management
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Availability</h1>
          <p className="text-gray-600 mt-1">
            Set working hours and manage time off for your team members
          </p>
        </div>
      </div>

      {/* Staff Selection */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Staff Member
        </label>
        <select
          value={selectedStaffId}
          onChange={(e) => {
            setSelectedStaffId(e.target.value)
            initializeStaffAvailability(e.target.value)
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
        >
          <option value="">Select a staff member...</option>
          {teamMembers.map(member => (
            <option key={member.userId} value={member.userId}>
              {member.name} ({member.role})
            </option>
          ))}
        </select>
      </div>

      {selectedStaffId && selectedStaff && (
        <>
          {/* Working Hours */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Working Hours - {selectedStaff.name}
              </h2>
              <button
                onClick={copyHoursToAllDays}
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                Copy Monday to All Days
              </button>
            </div>

            <div className="space-y-4">
              {DAYS.map(day => {
                const dayHours = selectedAvailability?.workingHours?.[day.key as keyof typeof selectedAvailability.workingHours] || DEFAULT_HOURS
                
                return (
                  <div key={day.key} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-24 flex-shrink-0">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!dayHours.closed}
                          onChange={(e) => updateWorkingHours(day.key, 'closed', !e.target.checked)}
                          className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                        <span className="text-sm font-medium text-gray-900">{day.label}</span>
                      </label>
                    </div>

                    {!dayHours.closed && (
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Open
                          </label>
                          <select
                            value={dayHours.open}
                            onChange={(e) => updateWorkingHours(day.key, 'open', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                          >
                            {TIME_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Close
                          </label>
                          <select
                            value={dayHours.close}
                            onChange={(e) => updateWorkingHours(day.key, 'close', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                          >
                            {TIME_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {dayHours.closed && (
                      <div className="flex-1 text-sm text-gray-500 italic">
                        Closed
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Time Off */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Time Off</h2>
              <button
                onClick={() => setShowTimeOffModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Time Off
              </button>
            </div>

            {selectedAvailability?.timeOff && selectedAvailability.timeOff.length > 0 ? (
              <div className="space-y-2">
                {selectedAvailability.timeOff.map(timeOff => (
                  <div
                    key={timeOff.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {new Date(timeOff.startDate).toLocaleDateString()}
                        {timeOff.endDate !== timeOff.startDate && 
                          ` - ${new Date(timeOff.endDate).toLocaleDateString()}`
                        }
                      </div>
                      {timeOff.reason && (
                        <div className="text-sm text-gray-600 mt-1">{timeOff.reason}</div>
                      )}
                    </div>
                    <button
                      onClick={() => removeTimeOff(timeOff.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>No time off scheduled</p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveAvailability}
              disabled={saving}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Availability'}
            </button>
          </div>
        </>
      )}

      {/* Time Off Modal */}
      {showTimeOffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Time Off</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={timeOffStartDate}
                  onChange={(e) => setTimeOffStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (optional)
                </label>
                <input
                  type="date"
                  value={timeOffEndDate}
                  onChange={(e) => setTimeOffEndDate(e.target.value)}
                  min={timeOffStartDate}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={timeOffReason}
                  onChange={(e) => setTimeOffReason(e.target.value)}
                  placeholder="e.g., Vacation, Sick leave"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowTimeOffModal(false)
                    setTimeOffStartDate('')
                    setTimeOffEndDate('')
                    setTimeOffReason('')
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTimeOff}
                  disabled={!timeOffStartDate}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
