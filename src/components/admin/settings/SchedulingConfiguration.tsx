// src/components/admin/settings/SchedulingConfiguration.tsx
'use client'

import { useState, useEffect } from 'react'
import { Clock, Save, CheckCircle, Calendar, Plus, Trash2, AlertCircle } from 'lucide-react'

interface SchedulingConfig {
  schedulingEnabled: boolean
  slotDuration: number
  slotCapacity: number | null
  deliveryBufferMinutes: number
  pickupBufferMinutes: number
  holidayHours: Record<string, { open?: string; close?: string; closed?: boolean }>
  maxAdvanceBookingDays: number
}

interface SchedulingConfigurationProps {
  businessId: string
  businessType?: string
}

interface SuccessMessage {
  title: string
  description?: string
}

const SLOT_DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '60 minutes (1 hour)' }
]

const BUFFER_OPTIONS = [
  { value: 0, label: 'No buffer' },
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
  { value: 120, label: '2 hours' }
]

const ADVANCE_BOOKING_OPTIONS = [
  { value: 4, label: '4 days' },
  { value: 7, label: '7 days (1 week)' },
  { value: 14, label: '14 days (2 weeks)' },
  { value: 30, label: '30 days (1 month)' },
  { value: 60, label: '60 days (2 months)' }
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

export function SchedulingConfiguration({ businessId, businessType }: SchedulingConfigurationProps) {
  const isSalon = businessType === 'SALON' || businessType === 'SERVICES'
  const [config, setConfig] = useState<SchedulingConfig>({
    schedulingEnabled: true,
    slotDuration: 30,
    slotCapacity: null,
    deliveryBufferMinutes: 45,
    pickupBufferMinutes: 20,
    holidayHours: {},
    maxAdvanceBookingDays: 7
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<SuccessMessage | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Holiday hours management
  const [newHolidayDate, setNewHolidayDate] = useState('')
  const [newHolidayClosed, setNewHolidayClosed] = useState(true)
  const [newHolidayOpen, setNewHolidayOpen] = useState('09:00')
  const [newHolidayClose, setNewHolidayClose] = useState('17:00')

  useEffect(() => {
    fetchConfig()
  }, [businessId])

  const fetchConfig = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/scheduling`)
      if (response.ok) {
        const data = await response.json()
        if (data.scheduling) {
          setConfig({
            schedulingEnabled: data.scheduling.schedulingEnabled ?? true,
            slotDuration: data.scheduling.slotDuration || 30,
            slotCapacity: data.scheduling.slotCapacity,
            deliveryBufferMinutes: data.scheduling.deliveryBufferMinutes || 45,
            pickupBufferMinutes: data.scheduling.pickupBufferMinutes || 20,
            holidayHours: data.scheduling.holidayHours || {},
            maxAdvanceBookingDays: data.scheduling.maxAdvanceBookingDays || 7
          })
        }
      }
    } catch (error) {
      console.error('Error fetching scheduling config:', error)
      setError('Failed to load scheduling configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/stores/${businessId}/scheduling`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        setSuccessMessage({
          title: 'Scheduling settings saved',
          description: 'Your scheduling configuration has been updated.'
        })
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving scheduling config:', error)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const addHolidayHours = () => {
    if (!newHolidayDate) {
      setError('Please select a date')
      return
    }

    const newHolidays = { ...config.holidayHours }
    
    if (newHolidayClosed) {
      newHolidays[newHolidayDate] = { closed: true }
    } else {
      newHolidays[newHolidayDate] = { 
        open: newHolidayOpen, 
        close: newHolidayClose,
        closed: false 
      }
    }

    setConfig({ ...config, holidayHours: newHolidays })
    setNewHolidayDate('')
    setNewHolidayClosed(true)
    setNewHolidayOpen('09:00')
    setNewHolidayClose('17:00')
  }

  const removeHolidayHours = (date: string) => {
    const newHolidays = { ...config.holidayHours }
    delete newHolidays[date]
    setConfig({ ...config, holidayHours: newHolidays })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-teal-600" />
            Scheduling Configuration
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isSalon 
              ? 'Configure appointment time slots, capacity limits, and special hours'
              : 'Configure time slots, capacity limits, and special hours'}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-green-900">{successMessage.title}</h4>
            {successMessage.description && (
              <p className="text-sm text-green-700 mt-1">{successMessage.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900">Error</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Enable Scheduling Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-900">
              {isSalon ? 'Enable Appointment Scheduling' : 'Enable Order Scheduling'}
            </label>
            <p className="text-xs text-gray-500 mt-1">
              {isSalon 
                ? 'Allow customers to book appointments for specific time slots based on your business hours.'
                : 'Allow customers to schedule orders for specific times. When disabled, only instant orders are accepted.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfig({ ...config, schedulingEnabled: !config.schedulingEnabled })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
              config.schedulingEnabled ? 'bg-teal-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                config.schedulingEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Slot Duration */}
        <div className={config.schedulingEnabled ? '' : 'opacity-50 pointer-events-none'}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Slot Duration
          </label>
          <select
            value={config.slotDuration}
            onChange={(e) => setConfig({ ...config, slotDuration: Number(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            disabled={!config.schedulingEnabled}
          >
            {SLOT_DURATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {isSalon ? 'How long each appointment time slot should be' : 'How long each booking time slot should be'}
          </p>
        </div>

        {/* Slot Capacity */}
        <div className={config.schedulingEnabled ? '' : 'opacity-50 pointer-events-none'}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isSalon ? 'Appointments per Time Slot' : 'Orders per Time Slot'}
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              min="1"
              max="100"
              value={config.slotCapacity || ''}
              onChange={(e) => setConfig({ 
                ...config, 
                slotCapacity: e.target.value ? Number(e.target.value) : null 
              })}
              placeholder="Unlimited"
              className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              disabled={!config.schedulingEnabled}
            />
            <span className="text-sm text-gray-500">
              {config.slotCapacity 
                ? `Max ${config.slotCapacity} ${isSalon ? 'appointments' : 'orders'} per slot` 
                : 'No limit'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isSalon ? 'Leave empty for unlimited appointments per slot' : 'Leave empty for unlimited orders per slot'}
          </p>
        </div>

        {/* Buffer Times */}
        {isSalon ? (
          <div className={config.schedulingEnabled ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Buffer Time
            </label>
            <select
              value={config.pickupBufferMinutes}
              onChange={(e) => {
                const value = Number(e.target.value)
                setConfig({ ...config, pickupBufferMinutes: value, deliveryBufferMinutes: value })
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              disabled={!config.schedulingEnabled}
            >
              {BUFFER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Minimum time before an appointment slot can be booked. This prevents last-minute bookings.
            </p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${config.schedulingEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Preparation Time
              </label>
              <select
                value={config.deliveryBufferMinutes}
                onChange={(e) => setConfig({ ...config, deliveryBufferMinutes: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                disabled={!config.schedulingEnabled}
              >
                {BUFFER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Minimum time before delivery slot can be booked
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pickup Preparation Time
              </label>
              <select
                value={config.pickupBufferMinutes}
                onChange={(e) => setConfig({ ...config, pickupBufferMinutes: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                disabled={!config.schedulingEnabled}
              >
                {BUFFER_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Minimum time before pickup slot can be booked
              </p>
            </div>
          </div>
        )}

        {/* Max Advance Booking Days */}
        <div className={config.schedulingEnabled ? '' : 'opacity-50 pointer-events-none'}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Advance Booking Window
          </label>
          <select
            value={config.maxAdvanceBookingDays}
            onChange={(e) => setConfig({ ...config, maxAdvanceBookingDays: Number(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            disabled={!config.schedulingEnabled}
          >
            {ADVANCE_BOOKING_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {isSalon ? 'How far in advance customers can book appointments' : 'How far in advance customers can schedule their orders'}
          </p>
        </div>

        {/* Holiday Hours */}
        <div className={`border-t border-gray-200 pt-6 ${config.schedulingEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-teal-600" />
                Holiday Hours
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Set special hours or closures for specific dates
              </p>
            </div>
          </div>

          {/* Existing holiday hours */}
          {Object.keys(config.holidayHours).length > 0 && (
            <div className="space-y-2 mb-4">
              {Object.entries(config.holidayHours)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, hours]) => (
                  <div 
                    key={date} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{formatDate(date)}</span>
                      <span className="ml-3 text-sm text-gray-500">
                        {hours.closed 
                          ? 'Closed' 
                          : `${hours.open} - ${hours.close}`
                        }
                      </span>
                    </div>
                    <button
                      onClick={() => removeHolidayHours(date)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* Add new holiday */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={newHolidayClosed ? 'closed' : 'custom'}
                  onChange={(e) => setNewHolidayClosed(e.target.value === 'closed')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                >
                  <option value="closed">Closed</option>
                  <option value="custom">Custom Hours</option>
                </select>
              </div>
            </div>

            {!newHolidayClosed && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Open</label>
                  <select
                    value={newHolidayOpen}
                    onChange={(e) => setNewHolidayOpen(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                  >
                    {TIME_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Close</label>
                  <select
                    value={newHolidayClose}
                    onChange={(e) => setNewHolidayClose(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                  >
                    {TIME_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={addHolidayHours}
              disabled={!newHolidayDate}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Holiday Hours
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
