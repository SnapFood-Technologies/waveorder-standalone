// src/components/admin/dashboard/RecentAppointmentsWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus } from 'lucide-react'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'

interface RecentAppointmentsWidgetProps {
  businessId: string
}

interface Appointment {
  id: string
  orderNumber: string
  customerName: string
  total: number
  status: string
  appointmentDate: string
  startTime: string
  createdAt: string
}

interface Business {
  currency: string
}

export function RecentAppointmentsWidget({ businessId }: RecentAppointmentsWidgetProps) {
  const { addParams } = useImpersonation(businessId)
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [business, setBusiness] = useState<Business>({ currency: 'USD' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setBusiness({ currency: data.business.currency })
        }
      } catch (error) {
        console.error('Error fetching business data:', error)
      }
    }

    fetchBusinessData()
  }, [businessId])

  useEffect(() => {
    const fetchRecentAppointments = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/appointments?limit=5&page=1`)
        if (response.ok) {
          const data = await response.json()
          setAppointments(data.appointments || [])
        }
      } catch (error) {
        console.error('Error fetching recent appointments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentAppointments()
  }, [businessId])

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L',
      BHD: 'BD',
      BBD: 'Bds$',
    }
    
    const symbol = currencySymbols[business.currency] || business.currency
    return `${symbol}${amount.toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'text-yellow-600 bg-yellow-100'
      case 'CONFIRMED': return 'text-blue-600 bg-blue-100'
      case 'IN_PROGRESS': return 'text-orange-600 bg-orange-100'
      case 'COMPLETED': return 'text-green-600 bg-green-100'
      case 'CANCELLED': return 'text-red-600 bg-red-100'
      case 'NO_SHOW': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ')
  }

  const formatAppointmentDateTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString)
    const [hours, minutes] = timeString.split(':')
    date.setHours(parseInt(hours), parseInt(minutes))
    
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${timeString}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${timeString}`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${timeString}`
    }
  }

  const handleAppointmentClick = (appointmentId: string) => {
    window.location.href = addParams(`/admin/stores/${businessId}/appointments/${appointmentId}`)
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <h3 className="text-lg font-semibold text-gray-900">Recent Appointments</h3>
        <div className="flex space-y-2 sm:space-y-0 sm:space-x-2">
          {appointments.length > 0 && (
            <div className="flex items-center space-x-2">
              <Link
                href={addParams(`/admin/stores/${businessId}/appointments`)}
                className="inline-flex cursor-pointer items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                View All
              </Link>
            </div>
          )}
        </div>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h4>
          <p className="text-gray-600 mb-6">
            When customers book appointments, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Appointment</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Customer</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-500">Date & Time</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right py-2 px-3 text-sm font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {appointments.map((appointment) => (
                <tr 
                  key={appointment.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAppointmentClick(appointment.id)}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{appointment.orderNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-sm text-gray-900 truncate">{appointment.customerName}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-sm text-gray-900">
                      {formatAppointmentDateTime(appointment.appointmentDate, appointment.startTime)}
                    </p>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {formatStatus(appointment.status)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(appointment.total)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
