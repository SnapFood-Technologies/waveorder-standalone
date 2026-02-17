// src/components/admin/appointments/AppointmentsCalendar.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  Filter,
  X,
  Eye
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek, isToday } from 'date-fns'
import Link from 'next/link'
import { useImpersonation } from '@/lib/impersonation'

interface AppointmentsCalendarProps {
  businessId: string
}

interface Appointment {
  id: string
  orderNumber: string
  customerName: string
  appointmentDate: string
  startTime: string
  endTime: string
  status: 'REQUESTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  staffId: string | null
  total: number
}

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  role: string
}

export default function AppointmentsCalendar({ businessId }: AppointmentsCalendarProps) {
  const { addParams } = useImpersonation(businessId)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchTeamMembers()
  }, [businessId])

  useEffect(() => {
    fetchAppointments()
  }, [businessId, currentDate, selectedStaffId, selectedStatus])

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

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      
      // Calculate date range based on view mode
      let startDate: Date
      let endDate: Date
      
      if (viewMode === 'month') {
        startDate = startOfMonth(currentDate)
        endDate = endOfMonth(currentDate)
      } else if (viewMode === 'week') {
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 })
      } else {
        startDate = new Date(currentDate)
        endDate = new Date(currentDate)
      }
      
      endDate.setHours(23, 59, 59, 999)

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: '1000' // Get all appointments in range
      })

      if (selectedStaffId !== 'all') {
        params.append('staffId', selectedStaffId)
      }

      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      const response = await fetch(`/api/admin/stores/${businessId}/appointments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
      case 'NO_SHOW': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatStatus = (status: string) => {
    return status.replace('_', ' ')
  }

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate)
      return isSameDay(aptDate, date)
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1))
    } else if (viewMode === 'day') {
      setCurrentDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Generate calendar days for month view
  const calendarDays = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }

  const activeFiltersCount = (selectedStaffId !== 'all' ? 1 : 0) + (selectedStatus !== 'all' ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments Calendar</h1>
          <p className="text-gray-600 mt-1">
            View and manage your appointments in calendar format
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 ${
              showFilters || activeFiltersCount > 0
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="bg-teal-600 text-white text-xs rounded-full px-2 py-0.5">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          <Link
            href={addParams(`/admin/stores/${businessId}/appointments`)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            List View
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              >
                <option value="all">All Staff</option>
                {teamMembers.map(member => (
                  <option key={member.userId} value={member.userId}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="REQUESTED">Requested</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>

            <div className="flex items-end">
              {(selectedStaffId !== 'all' || selectedStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedStaffId('all')
                    setSelectedStatus('all')
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'month'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'week'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'day'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Day
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
              {viewMode === 'week' && `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')}`}
              {viewMode === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h2>
          </div>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading appointments...</p>
        </div>
      ) : viewMode === 'month' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Calendar Header - Days of week */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 bg-gray-50">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays().map((day, index) => {
              const dayAppointments = getAppointmentsForDate(day)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isCurrentDay = isToday(day)

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                    !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                  } ${isCurrentDay ? 'bg-teal-50' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isCurrentDay ? 'text-teal-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map(apt => (
                      <Link
                        key={apt.id}
                        href={addParams(`/admin/stores/${businessId}/appointments/${apt.id}`)}
                        className={`block text-xs p-1.5 rounded border truncate hover:opacity-80 transition-opacity ${getStatusColor(apt.status)}`}
                        title={`${apt.customerName} - ${apt.startTime}`}
                      >
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">{apt.startTime}</span>
                        </div>
                        <div className="truncate">{apt.customerName}</div>
                      </Link>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : viewMode === 'week' ? (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="grid grid-cols-7 gap-4 p-4">
            {eachDayOfInterval({
              start: startOfWeek(currentDate, { weekStartsOn: 1 }),
              end: endOfWeek(currentDate, { weekStartsOn: 1 })
            }).map((day, index) => {
              const dayAppointments = getAppointmentsForDate(day)
              const isCurrentDay = isToday(day)

              return (
                <div key={index} className={`border rounded-lg p-3 ${isCurrentDay ? 'bg-teal-50 border-teal-200' : 'border-gray-200'}`}>
                  <div className={`text-sm font-medium mb-2 ${isCurrentDay ? 'text-teal-600' : 'text-gray-900'}`}>
                    {format(day, 'EEE d')}
                  </div>
                  <div className="space-y-2">
                    {dayAppointments.map(apt => (
                      <Link
                        key={apt.id}
                        href={addParams(`/admin/stores/${businessId}/appointments/${apt.id}`)}
                        className={`block text-xs p-2 rounded border ${getStatusColor(apt.status)} hover:opacity-80 transition-opacity`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">{apt.startTime}</span>
                        </div>
                        <div className="font-medium truncate">{apt.customerName}</div>
                        <div className="text-xs opacity-75">{formatStatus(apt.status)}</div>
                      </Link>
                    ))}
                    {dayAppointments.length === 0 && (
                      <div className="text-xs text-gray-400 text-center py-4">No appointments</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h3>
          </div>
          
          <div className="space-y-3">
            {getAppointmentsForDate(currentDate).length > 0 ? (
              getAppointmentsForDate(currentDate)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map(apt => (
                  <Link
                    key={apt.id}
                    href={addParams(`/admin/stores/${businessId}/appointments/${apt.id}`)}
                    className={`block p-4 rounded-lg border ${getStatusColor(apt.status)} hover:opacity-80 transition-opacity`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{apt.startTime} - {apt.endTime}</span>
                        </div>
                        <div className="font-semibold text-base mb-1">{apt.customerName}</div>
                        <div className="text-sm opacity-75">Appt #{apt.orderNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium mb-1">{formatStatus(apt.status)}</div>
                        {teamMembers.find(m => m.userId === apt.staffId) && (
                          <div className="text-xs opacity-75 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {teamMembers.find(m => m.userId === apt.staffId)?.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No appointments scheduled for this day</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
