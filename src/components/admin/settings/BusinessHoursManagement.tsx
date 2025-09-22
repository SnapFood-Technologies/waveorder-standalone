// src/components/admin/settings/BusinessHoursManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Save, CheckCircle, X } from 'lucide-react'

interface DayHours {
  open: string
  close: string
  closed: boolean
}

interface BusinessHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

interface BusinessHoursManagementProps {
  businessId: string
}

interface SuccessMessage {
  title: string
  description?: string
}

const DEFAULT_HOURS: BusinessHours = {
  monday: { open: '09:00', close: '21:00', closed: false },
  tuesday: { open: '09:00', close: '21:00', closed: false },
  wednesday: { open: '09:00', close: '21:00', closed: false },
  thursday: { open: '09:00', close: '21:00', closed: false },
  friday: { open: '09:00', close: '21:00', closed: false },
  saturday: { open: '09:00', close: '21:00', closed: false },
  sunday: { open: '10:00', close: '20:00', closed: false }
}

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
  const displayMinute = minute
  
  return {
    value: time,
    label: `${displayHour}:${displayMinute} ${ampm}`
  }
})

export function BusinessHoursManagement({ businessId }: BusinessHoursManagementProps) {
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_HOURS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<SuccessMessage | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBusinessHours()
  }, [businessId])

  const fetchBusinessHours = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/business-hours`)
      if (response.ok) {
        const data = await response.json()
        if (data.businessHours) {
          setBusinessHours(data.businessHours)
        }
      }
    } catch (error) {
      console.error('Error fetching business hours:', error)
      setError('Failed to load business hours')
    } finally {
      setLoading(false)
    }
  }

  const showSuccessMessage = (title: string, description?: string) => {
    setSuccessMessage({ title, description })
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const updateDayHours = (day: string, updates: Partial<DayHours>) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: { ...prev[day as keyof BusinessHours], ...updates }
    }))
  }

  const copyHoursToAll = (sourceDay: string) => {
    const sourceHours = businessHours[sourceDay as keyof BusinessHours]
    const updatedHours = { ...businessHours }
    
    DAYS.forEach(day => {
      if (day.key !== sourceDay) {
        updatedHours[day.key as keyof BusinessHours] = { ...sourceHours }
      }
    })
    
    setBusinessHours(updatedHours)
    showSuccessMessage(
      'Hours Copied',
      `${DAYS.find(d => d.key === sourceDay)?.label} hours applied to all days`
    )
  }

  const setAllDaysClosed = () => {
    const updatedHours = { ...businessHours }
    DAYS.forEach(day => {
      updatedHours[day.key as keyof BusinessHours].closed = true
    })
    setBusinessHours(updatedHours)
  }

  const setAllDaysOpen = () => {
    const updatedHours = { ...businessHours }
    DAYS.forEach(day => {
      updatedHours[day.key as keyof BusinessHours].closed = false
    })
    setBusinessHours(updatedHours)
  }

  const validateHours = () => {
    for (const day of DAYS) {
      const hours = businessHours[day.key as keyof BusinessHours]
      if (!hours.closed) {
        if (!hours.open || !hours.close) {
          setError(`${day.label}: Please set both opening and closing times`)
          return false
        }
        if (hours.open >= hours.close) {
          setError(`${day.label}: Closing time must be after opening time`)
          return false
        }
      }
    }
    setError(null)
    return true
  }

  const saveBusinessHours = async () => {
    if (!validateHours()) return

    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/business-hours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessHours })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save business hours')
      }

      showSuccessMessage(
        'Business Hours Updated',
        'Your operating hours have been saved successfully'
      )
    } catch (error) {
      console.error('Error saving business hours:', error)
      setError(error instanceof Error ? error.message : 'Failed to save business hours')
    } finally {
      setSaving(false)
    }
  }

  const getCurrentDayStatus = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const todayHours = businessHours[today as keyof BusinessHours]
    
    if (!todayHours) {
      return { status: 'unknown', message: 'Hours not configured' }
    }
    
    if (todayHours.closed) {
      return { status: 'closed', message: 'Closed today' }
    }
    
    if (!todayHours.open || !todayHours.close) {
      return { status: 'unknown', message: 'Hours not set' }
    }

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    if (currentTime >= todayHours.open && currentTime < todayHours.close) {
      return { status: 'open', message: `Open until ${TIME_OPTIONS.find(t => t.value === todayHours.close)?.label}` }
    } else if (currentTime < todayHours.open) {
      return { status: 'closed', message: `Opens at ${TIME_OPTIONS.find(t => t.value === todayHours.open)?.label}` }
    } else {
      return { status: 'closed', message: 'Closed for today' }
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const currentStatus = getCurrentDayStatus()

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{successMessage.title}</h4>
                {successMessage.description && (
                  <p className="text-sm text-gray-600 mt-1">{successMessage.description}</p>
                )}
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Calendar className="w-5 h-5 text-teal-600 mr-2" />
            Business Hours
          </h3>
          <p className="text-sm text-gray-600">
            Set your operating hours for each day of the week
          </p>
        </div>
        <button
          onClick={saveBusinessHours}
          disabled={saving}
          className="flex items-center justify-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm font-medium whitespace-nowrap"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Hours'}
        </button>
      </div>

      {/* Current Status */}
      <div className={`p-4 rounded-lg border-2 ${
        currentStatus.status === 'open' 
          ? 'bg-green-50 border-green-200' 
          : currentStatus.status === 'closed'
          ? 'bg-red-50 border-red-200'
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center">
          <Clock className={`w-5 h-5 mr-2 ${
            currentStatus.status === 'open' ? 'text-green-600' : 
            currentStatus.status === 'closed' ? 'text-red-600' : 'text-gray-600'
          }`} />
          <div>
            <p className={`font-medium ${
              currentStatus.status === 'open' ? 'text-green-900' : 
              currentStatus.status === 'closed' ? 'text-red-900' : 'text-gray-900'
            }`}>
              Current Status: {currentStatus.status === 'open' ? 'Open' : 'Closed'}
            </p>
            <p className={`text-sm ${
              currentStatus.status === 'open' ? 'text-green-700' : 
              currentStatus.status === 'closed' ? 'text-red-700' : 'text-gray-700'
            }`}>
              {currentStatus.message}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={setAllDaysOpen}
            className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
          >
            <Clock className="w-4 h-4 mr-2" />
            Set All Days Open
          </button>
          <button
            onClick={setAllDaysClosed}
            className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4 mr-2" />
            Set All Days Closed
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Use these shortcuts to quickly mark all days as open or closed, then adjust individual days as needed.
        </p>
      </div>

      {/* Hours Configuration */}
      <div className="space-y-4">
        {DAYS.map(day => {
          const dayHours = businessHours[day.key as keyof BusinessHours]
          const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day.key
          
          return (
            <div key={day.key} className={`border rounded-lg p-4 ${isToday ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-24">
                    <h4 className={`font-medium ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                      {day.label}
                      {isToday && <span className="text-blue-600 text-xs ml-2">(Today)</span>}
                    </h4>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!dayHours.closed}
                      onChange={(e) => updateDayHours(day.key, { closed: !e.target.checked })}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700 w-12">
                      {dayHours.closed ? 'Closed' : 'Open'}
                    </span>
                  </div>
                </div>

                {!dayHours.closed && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">From</label>
                      <select
                        value={dayHours.open}
                        onChange={(e) => updateDayHours(day.key, { open: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        {TIME_OPTIONS.map(time => (
                          <option key={time.value} value={time.value}>
                            {time.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">To</label>
                      <select
                        value={dayHours.close}
                        onChange={(e) => updateDayHours(day.key, { close: e.target.value })}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      >
                        {TIME_OPTIONS.map(time => (
                          <option key={time.value} value={time.value}>
                            {time.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={() => copyHoursToAll(day.key)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Copy to All
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${isToday ? 'text-blue-900' : 'text-gray-900'}`}>
                    {day.label}
                    {isToday && <span className="text-blue-600 text-xs ml-2">(Today)</span>}
                  </h4>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!dayHours.closed}
                      onChange={(e) => updateDayHours(day.key, { closed: !e.target.checked })}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {dayHours.closed ? 'Closed' : 'Open'}
                    </span>
                  </div>
                </div>

                {!dayHours.closed && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">From</label>
                        <select
                          value={dayHours.open}
                          onChange={(e) => updateDayHours(day.key, { open: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={time.value} value={time.value}>
                              {time.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-600 mb-1">To</label>
                        <select
                          value={dayHours.close}
                          onChange={(e) => updateDayHours(day.key, { close: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        >
                          {TIME_OPTIONS.map(time => (
                            <option key={time.value} value={time.value}>
                              {time.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={() => copyHoursToAll(day.key)}
                      className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Copy to All Days
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for Setting Business Hours</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Hours are displayed in your local timezone</li>
          <li>• Use "Copy to All" to quickly apply the same hours to every day</li>
          <li>• Customers will see if you're currently open or closed on your storefront</li>
          <li>• Consider your actual operating capacity when setting hours</li>
        </ul>
      </div>
    </div>
  )
}