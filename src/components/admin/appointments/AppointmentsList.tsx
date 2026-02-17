// src/components/admin/appointments/AppointmentsList.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Search, Calendar, Clock, User, Phone, ChevronLeft, ChevronRight, Eye, Filter, X, Plus, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useImpersonation } from '@/lib/impersonation'

interface AppointmentsListProps {
  businessId: string
}

interface Appointment {
  id: string
  orderId: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail: string | null
  customerId: string | null
  staffId: string | null
  appointmentDate: string
  startTime: string
  endTime: string
  duration: number
  status: 'REQUESTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes: string | null
  total: number
  serviceName: string
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AppointmentsList({ businessId }: AppointmentsListProps) {
  const { addParams } = useImpersonation(businessId)
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get('search') || '')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterDate, setFilterDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [currency, setCurrency] = useState('USD')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'newest' | 'upcoming'>('newest')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: debouncedSearchQuery,
        sort: sortBy
      })

      if (filterStatus !== 'all') params.append('status', filterStatus)
      if (filterDate) params.append('date', filterDate)

      const response = await fetch(`/api/admin/stores/${businessId}/appointments?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
        setPagination(data.pagination)
        setCurrency(data.currency || 'USD')
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [businessId, currentPage, debouncedSearchQuery, filterStatus, filterDate, sortBy])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    const currentParams = new URLSearchParams(window.location.search)
    if (value.trim()) {
      currentParams.set('search', value)
    } else {
      currentParams.delete('search')
    }
    
    const newUrl = `${window.location.pathname}${currentParams.toString() ? `?${currentParams.toString()}` : ''}`
    window.history.replaceState({}, '', newUrl)
  }

  const clearFilters = () => {
    setFilterStatus('all')
    setFilterDate('')
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setSortBy('newest')
    setCurrentPage(1)
    
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }

  const getStatusColor = (status: string) => {
    const styles = {
      REQUESTED: 'text-yellow-600 bg-yellow-100',
      CONFIRMED: 'text-blue-600 bg-blue-100',
      IN_PROGRESS: 'text-orange-600 bg-orange-100',
      COMPLETED: 'text-green-600 bg-green-100',
      CANCELLED: 'text-red-600 bg-red-100',
      NO_SHOW: 'text-gray-600 bg-gray-100'
    }
    return styles[status as keyof typeof styles] || styles.REQUESTED
  }

  const formatStatusLabel = (status: string): string => {
    return status.replace('_', ' ')
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
    
    const symbol = currencySymbols[currency] || currency
    return `${symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
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

  const activeFiltersCount = [
    filterStatus !== 'all',
    filterDate !== '',
    debouncedSearchQuery.trim()
  ].filter(Boolean).length

  if (loading && appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">
            Manage customer appointments and bookings
          </p>
        </div>
        <Link
          href={addParams(`/admin/stores/${businessId}/appointments/create`)}
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Appointment
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by appointment number, customer name, or phone..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500"
            />
          </div>

          {/* Sort & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as 'newest' | 'upcoming')
                  setCurrentPage(1)
                }}
                className="appearance-none flex items-center pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="upcoming">Upcoming Next</option>
              </select>
              <ArrowUpDown className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 border rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-teal-50 border-teal-200 text-teal-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 bg-teal-100 text-teal-800 text-xs rounded-full px-2 py-1">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="text-sm text-gray-600">
              {pagination.total} appointment{pagination.total !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                />
              </div>

              {activeFiltersCount > 0 && (
                <div className="md:col-span-2">
                  <button
                    onClick={clearFilters}
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {pagination.total === 0 ? 'No appointments yet' : 'No appointments found'}
          </h3>
          <p className="text-gray-600">
            {pagination.total === 0 
              ? 'Appointments will appear here when customers book services.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  href={addParams(`/admin/stores/${businessId}/appointments/${appointment.id}`)}
                  className="block hover:bg-gray-50 transition-colors"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Left: Appointment Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">
                                {appointment.orderNumber}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(appointment.status)}`}>
                                {formatStatusLabel(appointment.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {appointment.serviceName}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{appointment.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{appointment.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(appointment.appointmentDate)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>
                              {appointment.startTime} - {appointment.endTime} ({formatDuration(appointment.duration)})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Total & Actions */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(appointment.total)}
                          </div>
                        </div>
                        <Eye className="w-5 h-5 text-gray-400 sm:hidden" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} appointments
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={pagination.page === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 py-1 text-sm text-gray-900">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.pages))}
                    disabled={pagination.page === pagination.pages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
