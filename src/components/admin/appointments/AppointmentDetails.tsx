// src/components/admin/appointments/AppointmentDetails.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Clock, 
  CreditCard, 
  FileText, 
  Edit, 
  Save, 
  X, 
  CheckCircle, 
  AlertCircle,
  MessageCircle,
  Scissors,
  DollarSign,
  Trash2,
  Users,
  CalendarClock
} from 'lucide-react'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'
import { useSubscription } from '@/hooks/useSubscription'

interface AppointmentDetailsProps {
  businessId: string
  appointmentId: string
}

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
}

interface Service {
  id: string
  name: string
  description: string | null
  images: string[]
  price: number
  serviceDuration: number | null
}

interface Appointment {
  id: string
  orderId: string
  order: {
    id: string
    orderNumber: string
    total: number
    customer: Customer
    items: Array<{
      id: string
      price: number
      originalPrice: number | null
      product: Service
      modifiers: Array<{
        id: string
        name: string
        price: number
      }>
    }>
  }
  customerId: string | null
  staffId: string | null
  appointmentDate: string
  startTime: string
  endTime: string
  duration: number
  status: 'REQUESTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface Business {
  name: string
  currency: string
  phone: string
}

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  role: string
}

export default function AppointmentDetails({ businessId, appointmentId }: AppointmentDetailsProps) {
  const { addParams } = useImpersonation(businessId)
  const { effectivePlan } = useSubscription()
  
  // Staff assignment is only available for PRO+ plans
  const canAssignStaff = effectivePlan === 'PRO' || effectivePlan === 'BUSINESS'
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Form states
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [appointmentNotes, setAppointmentNotes] = useState<string>('')
  const [selectedStaffId, setSelectedStaffId] = useState<string>('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchAppointment()
    fetchTeamMembers()
  }, [businessId, appointmentId])

  const fetchAppointment = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/stores/${businessId}/appointments/${appointmentId}`)
      if (response.ok) {
        const data = await response.json()
        setAppointment(data.appointment)
        setBusiness(data.appointment.business)
        setSelectedStatus(data.appointment.status)
        setAppointmentNotes(data.appointment.notes || '')
        setSelectedStaffId(data.appointment.staffId || '')
      } else if (response.status === 404) {
        setError('Appointment not found')
      } else {
        setError('Failed to load appointment data')
      }
    } catch (error) {
      console.error('Error fetching appointment:', error)
      setError('Network error loading appointment data')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/team/members`)
      if (response.ok) {
        const data = await response.json()
        setTeamMembers(data.members || [])
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const handleDeleteAppointment = async () => {
    if (!appointment) return
  
    try {
      setIsDeleting(true)
      
      const response = await fetch(`/api/admin/stores/${businessId}/appointments/${appointmentId}`, {
        method: 'DELETE'
      })
  
      if (response.ok) {
        setTimeout(() => {
          window.location.href = addParams(`/admin/stores/${businessId}/appointments`)
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to delete appointment')
        setIsDeleting(false)
      }
    } catch (error) {
      setError('Network error deleting appointment')
      setIsDeleting(false)
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const getValidStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'REQUESTED':
        return ['REQUESTED', 'CONFIRMED', 'CANCELLED']
      case 'CONFIRMED':
        return ['CONFIRMED', 'IN_PROGRESS', 'CANCELLED']
      case 'IN_PROGRESS':
        return ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
      case 'COMPLETED':
        return ['COMPLETED'] // Final status
      case 'CANCELLED':
        return ['CANCELLED'] // Final status
      case 'NO_SHOW':
        return ['NO_SHOW'] // Final status
      default:
        return ['REQUESTED']
    }
  }

  const updateAppointmentStatus = async (newStatus: string) => {
    if (!appointment) return

    try {
      setUpdating(true)
      
      const updateData: any = { 
        status: newStatus 
      }

      const response = await fetch(`/api/admin/stores/${businessId}/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        await fetchAppointment()
        showSuccess(`Appointment status updated to ${newStatus.toLowerCase().replace(/_/g, ' ')}`)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update appointment status')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      setError('Network error updating appointment')
    } finally {
      setUpdating(false)
    }
  }

  const updateStaffAssignment = async () => {
    if (!appointment) return

    try {
      setUpdating(true)
      
      const response = await fetch(`/api/admin/stores/${businessId}/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId: selectedStaffId || null })
      })

      if (response.ok) {
        await fetchAppointment()
        showSuccess('Staff assignment updated successfully')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update staff assignment')
      }
    } catch (error) {
      console.error('Error updating staff assignment:', error)
      setError('Network error updating staff assignment')
    } finally {
      setUpdating(false)
    }
  }

  const updateAppointmentNotes = async () => {
    if (!appointment) return

    try {
      setUpdating(true)
      
      const response = await fetch(`/api/admin/stores/${businessId}/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: appointmentNotes })
      })

      if (response.ok) {
        await fetchAppointment()
        showSuccess('Appointment notes updated successfully')
        setEditingNotes(false)
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Failed to update notes')
      }
    } catch (error) {
      console.error('Error updating notes:', error)
      setError('Network error updating notes')
    } finally {
      setUpdating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L',
      BHD: 'BD',
      BBD: 'Bds$',
    }
    
    const symbol = currencySymbols[business?.currency || 'USD'] || (business?.currency || 'USD')
    return `${symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  const getStatusColor = (status: string) => {
    const styles = {
      REQUESTED: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      CONFIRMED: 'text-blue-600 bg-blue-100 border-blue-200',
      IN_PROGRESS: 'text-orange-600 bg-orange-100 border-orange-200',
      COMPLETED: 'text-green-600 bg-green-100 border-green-200',
      CANCELLED: 'text-red-600 bg-red-100 border-red-200',
      NO_SHOW: 'text-gray-600 bg-gray-100 border-gray-200'
    }
    return styles[status as keyof typeof styles] || styles.REQUESTED
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString)
    const [hours, minutes] = timeString.split(':')
    date.setHours(parseInt(hours), parseInt(minutes))
    
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const formatStatusLabel = (status: string): string => {
    return status.replace('_', ' ')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (error && !appointment) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link
          href={addParams(`/admin/stores/${businessId}/appointments`)}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Back to Appointments
        </Link>
      </div>
    )
  }

  if (!appointment) {
    return null
  }

  const orderItem = appointment.order.items[0]
  const service = orderItem?.product
  const hasDiscount = orderItem?.originalPrice != null && orderItem.originalPrice > orderItem.price
  const validStatuses = getValidStatusOptions(appointment.status)

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
        <div className="flex items-center gap-4">
          <Link
            href={addParams(`/admin/stores/${businessId}/appointments`)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Appointment #{appointment.order.orderNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              {formatDate(appointment.appointmentDate)} at {appointment.startTime}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 inline mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${getStatusColor(appointment.status).split(' ')[1]}`}>
              <Calendar className={`w-5 h-5 ${getStatusColor(appointment.status).split(' ')[0]}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className={`text-lg font-bold ${getStatusColor(appointment.status).split(' ')[0]}`}>
                {formatStatusLabel(appointment.status)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(appointment.order.total)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Clock className="w-5 h-5 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Duration</p>
              <p className="text-lg font-bold text-gray-900">{formatDuration(appointment.duration)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Appointment Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-teal-600" />
              Customer Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Name</span>
                <span className="text-sm text-gray-900 font-medium">{appointment.order.customer.name}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Phone</span>
                <div className="flex items-center text-sm text-gray-900">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <a href={`https://wa.me/${appointment.order.customer.phone.replace(/\D/g, '')}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="hover:text-teal-600 transition-colors">
                    {appointment.order.customer.phone}
                  </a>
                </div>
              </div>
              
              {appointment.order.customer.email && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <div className="flex items-center text-sm text-gray-900">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`mailto:${appointment.order.customer.email}`}
                       className="hover:text-teal-600 transition-colors">
                      {appointment.order.customer.email}
                    </a>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-gray-500">Appointment Date</span>
                <span className="text-sm text-gray-900">{formatDate(appointment.appointmentDate)}</span>
              </div>
            </div>
          </div>

          {/* Appointment Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <CalendarClock className="w-5 h-5 mr-2 text-teal-600" />
              Appointment Details
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Date</span>
                <span className="text-sm text-gray-900">{formatDate(appointment.appointmentDate)}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Time</span>
                <span className="text-sm text-gray-900">
                  {appointment.startTime} - {appointment.endTime}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Duration</span>
                <span className="text-sm text-gray-900">{formatDuration(appointment.duration)}</span>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-gray-500">Created</span>
                <span className="text-sm text-gray-900">{formatDate(appointment.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Service Information */}
          {service && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Scissors className="w-5 h-5 mr-2 text-teal-600" />
                Service
              </h3>
              
              <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {service.images && service.images.length > 0 ? (
                    <img 
                      src={service.images[0]} 
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Scissors className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                  
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  )}
                  
                  {service.serviceDuration && (
                    <p className="text-xs text-gray-500 mt-1">
                      Duration: {formatDuration(service.serviceDuration)}
                    </p>
                  )}
                  
                  {appointment.order.items[0]?.modifiers && appointment.order.items[0].modifiers.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Add-ons:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {appointment.order.items[0].modifiers.map((modifier) => (
                          <span key={modifier.id} className="inline-block bg-gray-100 text-xs px-2 py-1 rounded">
                            {modifier.name} (+{formatCurrency(modifier.price)})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-right flex-shrink-0">
                  {hasDiscount ? (
                    <div>
                      <div className="text-sm text-gray-400 line-through">
                        {formatCurrency(orderItem.originalPrice!)}
                      </div>
                      <div className="text-lg font-bold text-emerald-600">
                        {formatCurrency(orderItem.price)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(orderItem?.price || service.price)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-teal-600" />
                Notes
              </h3>
              {!editingNotes && (
                <button
                  onClick={() => setEditingNotes(true)}
                  className="text-sm text-teal-600 hover:text-teal-700 flex items-center"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </button>
              )}
            </div>
            
            {editingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={appointmentNotes}
                  onChange={(e) => setAppointmentNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  placeholder="Add notes about this appointment..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={updateAppointmentNotes}
                    disabled={updating}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4 inline mr-2" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setAppointmentNotes(appointment.notes || '')
                      setEditingNotes(false)
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">
                {appointment.notes || 'No notes added'}
              </p>
            )}
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status Update */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Status</h3>
            
            <div className="space-y-3">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value)
                  updateAppointmentStatus(e.target.value)
                }}
                disabled={updating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 disabled:opacity-50"
              >
                {validStatuses.map(status => (
                  <option key={status} value={status}>
                    {formatStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff Assignment */}
          {teamMembers.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-teal-600" />
                Assign Staff
              </h3>
              
              <div className="space-y-3">
                <select
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value)
                    updateStaffAssignment()
                  }}
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 disabled:opacity-50"
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.userId}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
                {selectedStaffId && (
                  <p className="text-xs text-gray-500">
                    Staff member will be notified of this assignment
                  </p>
                )}
              </div>
            </div>
          )}
          {teamMembers.length > 0 && !canAssignStaff && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      Staff Assignment Available on Pro Plan
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Upgrade to Pro or Business plan to assign team members to appointments.
                    </p>
                    <Link
                      href={`/admin/stores/${businessId}/settings/billing`}
                      className="text-xs text-amber-800 underline hover:no-underline mt-2 inline-block"
                    >
                      View Plans →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appointment Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Service</span>
                <span className="text-gray-900 font-medium">
                  {hasDiscount ? (
                    <>
                      <span className="text-gray-400 line-through mr-2">{formatCurrency(orderItem.originalPrice!)}</span>
                      <span className="text-emerald-600">{formatCurrency(orderItem.price)}</span>
                    </>
                  ) : (
                    formatCurrency(orderItem?.price || service?.price || 0)
                  )}
                </span>
              </div>
              
              {appointment.order.items[0]?.modifiers && appointment.order.items[0].modifiers.length > 0 && (
                <>
                  {appointment.order.items[0].modifiers.map((modifier) => (
                    <div key={modifier.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{modifier.name}</span>
                      <span className="text-gray-900">+{formatCurrency(modifier.price)}</span>
                    </div>
                  ))}
                </>
              )}
              
              <div className="border-t border-gray-200 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(appointment.order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Appointment</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this appointment? This will permanently remove the appointment record.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAppointment}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
