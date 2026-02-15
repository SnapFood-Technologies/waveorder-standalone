'use client'

import { useRouter } from 'next/navigation'
import { EventForm } from '@/components/superadmin/events/EventForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function CreateEventPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/superadmin/events')
  }

  const handleCancel = () => {
    router.push('/superadmin/events')
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
          <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-gray-500 mt-1">Add a new event for WaveOrder promotions, trade shows, or other activities</p>
        </div>
      </div>

      <EventForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  )
}
