'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { EventForm } from '@/components/superadmin/events/EventForm'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<any>(null)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/superadmin/events/${eventId}`)
      const data = await res.json()

      if (res.ok) {
        setEvent(data.event)
      } else {
        toast.error('Failed to load event')
        router.push('/superadmin/events')
      }
    } catch (error) {
      toast.error('Error loading event')
      router.push('/superadmin/events')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    router.push('/superadmin/events')
  }

  const handleCancel = () => {
    router.push('/superadmin/events')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!event) {
    return null
  }

  // Convert event data to form format
  const initialData = {
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
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/superadmin/events"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-500 mt-1">{event.title}</p>
        </div>
      </div>

      <EventForm 
        eventId={eventId} 
        initialData={initialData}
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </div>
  )
}
