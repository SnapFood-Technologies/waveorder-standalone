'use client'

import { useState, useEffect } from 'react'
import { 
  Save, X, Loader2, Calendar, MapPin, Video, Globe,
  Users, TrendingUp, Image as ImageIcon, Link as LinkIcon
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface EventFormData {
  title: string
  description: string
  eventType: string
  status: string
  priority: string
  startDate: string
  endDate: string
  timezone: string
  locationType: string
  venueName: string
  address: string
  city: string
  country: string
  coordinates: string
  onlineUrl: string
  registrationUrl: string
  bannerImage: string
  icon: string
  organizer: string
  attendees: string[]
  expectedAttendance: string
  actualAttendance: string
  notes: string
  leadsGenerated: string
  followUpRequired: boolean
  followUpNotes: string
  targetPlans: string[]
  targetCountries: string[]
  showOnDashboard: boolean
  showToBusinesses: boolean
}

interface EventFormProps {
  eventId?: string
  initialData?: Partial<EventFormData>
  onSuccess: () => void
  onCancel: () => void
}

const eventTypes = [
  { value: 'PROMOTION', label: 'Promotion' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'FEATURE_UPDATE', label: 'Feature Update' },
  { value: 'SYSTEM_ALERT', label: 'System Alert' },
  { value: 'MARKETING_CAMPAIGN', label: 'Marketing Campaign' },
  { value: 'TRADE_SHOW', label: 'Trade Show' },
  { value: 'CONFERENCE', label: 'Conference' },
  { value: 'EMBASSY_EVENT', label: 'Embassy Event' },
  { value: 'NETWORKING', label: 'Networking' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'OTHER', label: 'Other' }
]

const statuses = [
  { value: 'PLANNING', label: 'Planning' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'ARCHIVED', label: 'Archived' }
]

const priorities = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' }
]

const locationTypes = [
  { value: 'PHYSICAL', label: 'Physical', icon: MapPin },
  { value: 'ONLINE', label: 'Online', icon: Video },
  { value: 'HYBRID', label: 'Hybrid', icon: Globe }
]

const subscriptionPlans = [
  { value: 'STARTER', label: 'Starter' },
  { value: 'PRO', label: 'Pro' },
  { value: 'BUSINESS', label: 'Business' }
]

export function EventForm({ eventId, initialData, onSuccess, onCancel }: EventFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    eventType: initialData?.eventType || 'PROMOTION',
    status: initialData?.status || 'PLANNING',
    priority: initialData?.priority || 'MEDIUM',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    timezone: initialData?.timezone || 'UTC',
    locationType: initialData?.locationType || 'PHYSICAL',
    venueName: initialData?.venueName || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    country: initialData?.country || '',
    coordinates: initialData?.coordinates || '',
    onlineUrl: initialData?.onlineUrl || '',
    registrationUrl: initialData?.registrationUrl || '',
    bannerImage: initialData?.bannerImage || '',
    icon: initialData?.icon || '',
    organizer: initialData?.organizer || '',
    attendees: initialData?.attendees || [],
    expectedAttendance: initialData?.expectedAttendance || '',
    actualAttendance: initialData?.actualAttendance || '',
    notes: initialData?.notes || '',
    leadsGenerated: initialData?.leadsGenerated || '',
    followUpRequired: initialData?.followUpRequired || false,
    followUpNotes: initialData?.followUpNotes || '',
    targetPlans: initialData?.targetPlans || [],
    targetCountries: initialData?.targetCountries || [],
    showOnDashboard: initialData?.showOnDashboard !== undefined ? initialData.showOnDashboard : true,
    showToBusinesses: initialData?.showToBusinesses !== undefined ? initialData.showToBusinesses : false
  })

  useEffect(() => {
    if (eventId && !initialData) {
      fetchEvent()
    }
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/superadmin/events/${eventId}`)
      const data = await res.json()
      
      if (res.ok && data.event) {
        const event = data.event
        setFormData({
          title: event.title || '',
          description: event.description || '',
          eventType: event.eventType || 'PROMOTION',
          status: event.status || 'PLANNING',
          priority: event.priority || 'MEDIUM',
          startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : '',
          endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : '',
          timezone: event.timezone || 'UTC',
          locationType: event.locationType || 'PHYSICAL',
          venueName: event.venueName || '',
          address: event.address || '',
          city: event.city || '',
          country: event.country || '',
          coordinates: event.coordinates || '',
          onlineUrl: event.onlineUrl || '',
          registrationUrl: event.registrationUrl || '',
          bannerImage: event.bannerImage || '',
          icon: event.icon || '',
          organizer: event.organizer || '',
          attendees: event.attendees || [],
          expectedAttendance: event.expectedAttendance?.toString() || '',
          actualAttendance: event.actualAttendance?.toString() || '',
          notes: event.notes || '',
          leadsGenerated: event.leadsGenerated?.toString() || '',
          followUpRequired: event.followUpRequired || false,
          followUpNotes: event.followUpNotes || '',
          targetPlans: event.targetPlans || [],
          targetCountries: event.targetCountries || [],
          showOnDashboard: event.showOnDashboard !== undefined ? event.showOnDashboard : true,
          showToBusinesses: event.showToBusinesses !== undefined ? event.showToBusinesses : false
        })
      }
    } catch (error) {
      toast.error('Failed to load event')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.eventType) {
      toast.error('Title and event type are required')
      return
    }

    setLoading(true)
    try {
      const payload: any = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        expectedAttendance: formData.expectedAttendance ? parseInt(formData.expectedAttendance) : null,
        actualAttendance: formData.actualAttendance ? parseInt(formData.actualAttendance) : null,
        leadsGenerated: formData.leadsGenerated ? parseInt(formData.leadsGenerated) : null,
        attendees: formData.attendees.filter(Boolean)
      }

      const url = eventId ? `/api/superadmin/events/${eventId}` : '/api/superadmin/events'
      const method = eventId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(eventId ? 'Event updated successfully' : 'Event created successfully')
        onSuccess()
      } else {
        toast.error(data.error || 'Failed to save event')
      }
    } catch (error) {
      toast.error('Error saving event')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAttendee = () => {
    setFormData({
      ...formData,
      attendees: [...formData.attendees, '']
    })
  }

  const handleAttendeeChange = (index: number, value: string) => {
    const newAttendees = [...formData.attendees]
    newAttendees[index] = value
    setFormData({ ...formData, attendees: newAttendees })
  }

  const handleRemoveAttendee = (index: number) => {
    const newAttendees = formData.attendees.filter((_, i) => i !== index)
    setFormData({ ...formData, attendees: newAttendees })
  }

  const handleTogglePlan = (plan: string) => {
    const newPlans = formData.targetPlans.includes(plan)
      ? formData.targetPlans.filter(p => p !== plan)
      : [...formData.targetPlans, plan]
    setFormData({ ...formData, targetPlans: newPlans })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Greek Embassy Trade Event in London"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Event description (supports HTML)"
            />
            <p className="text-xs text-gray-500 mt-1">You can use HTML tags for formatting</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type *
              </label>
              <select
                required
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Date & Time</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <input
              type="text"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              placeholder="e.g., Europe/Athens, UTC"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Type
            </label>
            <div className="flex gap-4">
              {locationTypes.map(({ value, label, icon: Icon }) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.locationType === value
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="locationType"
                    value={value}
                    checked={formData.locationType === value}
                    onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                    className="sr-only"
                  />
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {formData.locationType !== 'ONLINE' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                  placeholder="e.g., Greek Embassy in London"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Country name or code"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </>
          )}

          {(formData.locationType === 'ONLINE' || formData.locationType === 'HYBRID') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Online Event URL
              </label>
              <input
                type="url"
                value={formData.onlineUrl}
                onChange={(e) => setFormData({ ...formData, onlineUrl: e.target.value })}
                placeholder="https://zoom.us/j/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Registration URL
            </label>
            <input
              type="url"
              value={formData.registrationUrl}
              onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
              placeholder="https://eventbrite.com/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Visual & Media */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Visual & Media</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banner Image URL
            </label>
            <input
              type="url"
              value={formData.bannerImage}
              onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon (Emoji or Text)
            </label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="📅 or event icon"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Team & Attendance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Team & Attendance</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organizer
            </label>
            <input
              type="text"
              value={formData.organizer}
              onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
              placeholder="Team member name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attendees
            </label>
            <div className="space-y-2">
              {formData.attendees.map((attendee, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={attendee}
                    onChange={(e) => handleAttendeeChange(index, e.target.value)}
                    placeholder="Team member name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttendee(index)}
                    className="px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddAttendee}
                className="text-sm text-teal-600 hover:text-teal-700 flex items-center"
              >
                <Users className="w-4 h-4 mr-1" />
                Add Attendee
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Attendance
              </label>
              <input
                type="number"
                value={formData.expectedAttendance}
                onChange={(e) => setFormData({ ...formData, expectedAttendance: e.target.value })}
                placeholder="Number of expected attendees"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            {formData.status === 'COMPLETED' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Attendance
                </label>
                <input
                  type="number"
                  value={formData.actualAttendance}
                  onChange={(e) => setFormData({ ...formData, actualAttendance: e.target.value })}
                  placeholder="Actual number of attendees"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post-Event Information (shown for completed events) */}
      {(formData.status === 'COMPLETED' || formData.status === 'ARCHIVED') && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Post-Event Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leads Generated
              </label>
              <input
                type="number"
                value={formData.leadsGenerated}
                onChange={(e) => setFormData({ ...formData, leadsGenerated: e.target.value })}
                placeholder="Number of leads generated"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Post-Event Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Event summary, learnings, feedback..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="followUpRequired"
                checked={formData.followUpRequired}
                onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <label htmlFor="followUpRequired" className="text-sm font-medium text-gray-700">
                Follow-up Required
              </label>
            </div>

            {formData.followUpRequired && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Follow-up Notes
                </label>
                <textarea
                  value={formData.followUpNotes}
                  onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                  rows={3}
                  placeholder="What follow-up actions are needed?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Display Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Display Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showOnDashboard"
              checked={formData.showOnDashboard}
              onChange={(e) => setFormData({ ...formData, showOnDashboard: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
            <label htmlFor="showOnDashboard" className="text-sm font-medium text-gray-700">
              Show on SuperAdmin Dashboard
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="showToBusinesses"
              checked={formData.showToBusinesses}
              onChange={(e) => setFormData({ ...formData, showToBusinesses: e.target.checked })}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
            <label htmlFor="showToBusinesses" className="text-sm font-medium text-gray-700">
              Show to Business Admins (Future Feature)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Subscription Plans (leave empty for all)
            </label>
            <div className="flex gap-3">
              {subscriptionPlans.map(plan => (
                <button
                  key={plan.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleTogglePlan(plan.value)
                  }}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                    formData.targetPlans.includes(plan.value)
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.targetPlans.includes(plan.value)}
                    onChange={() => {}}
                    readOnly
                    className="sr-only"
                  />
                  <span>{plan.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Countries (comma-separated, leave empty for all)
            </label>
            <input
              type="text"
              value={formData.targetCountries.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                targetCountries: e.target.value.split(',').map(c => c.trim()).filter(Boolean) 
              })}
              placeholder="GR, AL, US (or leave empty for all)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {eventId ? 'Update Event' : 'Create Event'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
