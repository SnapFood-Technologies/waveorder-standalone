'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, Search, Plus, Filter, X, Edit, Trash2, Eye,
  MapPin, Globe, Video, Clock, Users, TrendingUp, CheckCircle,
  AlertCircle, Loader2, ExternalLink
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  description: string
  eventType: string
  status: string
  priority: string
  startDate: string | null
  endDate: string | null
  timezone: string | null
  locationType: string
  venueName: string | null
  address: string | null
  city: string | null
  country: string | null
  onlineUrl: string | null
  registrationUrl: string | null
  bannerImage: string | null
  icon: string | null
  organizer: string | null
  attendees: string[]
  expectedAttendance: number | null
  actualAttendance: number | null
  notes: string | null
  leadsGenerated: number | null
  followUpRequired: boolean
  followUpNotes: string | null
  photos: string[]
  createdByUser: {
    id: string
    name: string | null
    email: string
  }
  createdAt: string
  updatedAt: string
}

const eventTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  PROMOTION: { label: 'Promotion', icon: '🎯', color: 'bg-purple-100 text-purple-700' },
  ANNOUNCEMENT: { label: 'Announcement', icon: '📢', color: 'bg-blue-100 text-blue-700' },
  MAINTENANCE: { label: 'Maintenance', icon: '🔧', color: 'bg-yellow-100 text-yellow-700' },
  FEATURE_UPDATE: { label: 'Feature Update', icon: '✨', color: 'bg-green-100 text-green-700' },
  SYSTEM_ALERT: { label: 'System Alert', icon: '⚠️', color: 'bg-red-100 text-red-700' },
  MARKETING_CAMPAIGN: { label: 'Marketing Campaign', icon: '📈', color: 'bg-indigo-100 text-indigo-700' },
  TRADE_SHOW: { label: 'Trade Show', icon: '🏢', color: 'bg-teal-100 text-teal-700' },
  CONFERENCE: { label: 'Conference', icon: '🎓', color: 'bg-cyan-100 text-cyan-700' },
  EMBASSY_EVENT: { label: 'Embassy Event', icon: '🏛️', color: 'bg-amber-100 text-amber-700' },
  NETWORKING: { label: 'Networking', icon: '🤝', color: 'bg-pink-100 text-pink-700' },
  WORKSHOP: { label: 'Workshop', icon: '📚', color: 'bg-emerald-100 text-emerald-700' },
  WEBINAR: { label: 'Webinar', icon: '💻', color: 'bg-violet-100 text-violet-700' },
  OTHER: { label: 'Other', icon: '📋', color: 'bg-gray-100 text-gray-700' }
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PLANNING: { label: 'Planning', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  CONFIRMED: { label: 'Confirmed', color: 'text-green-700', bgColor: 'bg-green-100' },
  ACTIVE: { label: 'Active', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  COMPLETED: { label: 'Completed', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
  ARCHIVED: { label: 'Archived', color: 'text-gray-500', bgColor: 'bg-gray-50' }
}

const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  LOW: { label: 'Low', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  HIGH: { label: 'High', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  URGENT: { label: 'Urgent', color: 'text-red-600', bgColor: 'bg-red-100' }
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [statusFilter, typeFilter, countryFilter, search])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('eventType', typeFilter)
      if (countryFilter !== 'all') params.append('country', countryFilter)
      if (search) params.append('search', search)

      const res = await fetch(`/api/superadmin/events?${params}`)
      const data = await res.json()

      if (res.ok) {
        setEvents(data.events || [])
      } else {
        toast.error('Failed to fetch events')
      }
    } catch (error) {
      toast.error('Error loading events')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!eventToDelete) return

    try {
      const res = await fetch(`/api/superadmin/events/${eventToDelete.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Event deleted successfully')
        setEventToDelete(null)
        fetchEvents()
      } else {
        toast.error('Failed to delete event')
      }
    } catch (error) {
      toast.error('Error deleting event')
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getLocationDisplay = (event: Event) => {
    if (event.locationType === 'ONLINE') {
      return { icon: Video, text: 'Online Event', url: event.onlineUrl }
    }
    if (event.locationType === 'HYBRID') {
      return { icon: Globe, text: 'Hybrid Event', url: event.onlineUrl }
    }
    if (event.venueName || event.city) {
      return { 
        icon: MapPin, 
        text: `${event.venueName || ''}${event.venueName && event.city ? ', ' : ''}${event.city || ''}${event.country ? `, ${event.country}` : ''}`.trim() || 'Physical Location',
        url: null
      }
    }
    return { icon: MapPin, text: 'Physical Location', url: null }
  }

  const countries = Array.from(new Set(events.map(e => e.country).filter(Boolean))) as string[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Manage WaveOrder events, promotions, and marketing activities</p>
        </div>
        <Link
          href="/superadmin/events/create"
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 bg-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Status</option>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
          >
            <option value="all">All Types</option>
            {Object.entries(eventTypeConfig).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* Country Filter */}
          {countries.length > 0 && (
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 bg-white"
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500 mb-4">Create your first event to get started.</p>
            <Link
              href="/superadmin/events/create"
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {events.map((event) => {
              const location = getLocationDisplay(event)
              const LocationIcon = location.icon
              
              return (
                <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {/* Icon/Banner */}
                        {event.bannerImage ? (
                          <img 
                            src={event.bannerImage} 
                            alt={event.title}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-3xl">{event.icon || eventTypeConfig[event.eventType]?.icon || '📅'}</span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${eventTypeConfig[event.eventType]?.color || 'bg-gray-100 text-gray-700'}`}>
                              {eventTypeConfig[event.eventType]?.icon} {eventTypeConfig[event.eventType]?.label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[event.status]?.bgColor} ${statusConfig[event.status]?.color}`}>
                              {statusConfig[event.status]?.label}
                            </span>
                            {event.priority !== 'MEDIUM' && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[event.priority]?.bgColor} ${priorityConfig[event.priority]?.color}`}>
                                {priorityConfig[event.priority]?.label}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {event.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2" dangerouslySetInnerHTML={{ __html: event.description.substring(0, 150) + '...' }} />
                          )}

                          {/* Details */}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            {event.startDate && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(event.startDate)}</span>
                                {event.endDate && event.endDate !== event.startDate && (
                                  <span> - {formatDate(event.endDate)}</span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <LocationIcon className="w-4 h-4" />
                              <span>{location.text}</span>
                              {location.url && (
                                <a href={location.url} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700">
                                  <ExternalLink className="w-3 h-3 inline ml-1" />
                                </a>
                              )}
                            </div>
                            {event.organizer && (
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>Organized by {event.organizer}</span>
                              </div>
                            )}
                            {event.expectedAttendance && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>Expected: {event.expectedAttendance} attendees</span>
                              </div>
                            )}
                            {event.status === 'COMPLETED' && event.actualAttendance !== null && (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Actual: {event.actualAttendance} attendees</span>
                                {event.leadsGenerated !== null && event.leadsGenerated > 0 && (
                                  <span className="ml-2">• {event.leadsGenerated} leads</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/superadmin/events/${event.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View/Edit"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => setEventToDelete(event)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Event</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>"{eventToDelete.title}"</strong>? All event data will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
