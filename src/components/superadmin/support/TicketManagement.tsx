// src/components/superadmin/support/TicketManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, Ticket, Clock, CheckCircle, AlertCircle, XCircle, User, Building2, UserCheck } from 'lucide-react'
import { getTicketStatusColor, getTicketPriorityColor, getTicketTypeDisplayName } from '@/lib/support-helpers'

interface Ticket {
  id: string
  ticketNumber: string
  subject: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_RESPONSE' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  type: 'GENERAL' | 'TECHNICAL' | 'BILLING' | 'FEATURE_REQUEST' | 'BUG_REPORT'
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
    email: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  business: {
    id: string
    name: string
  }
  commentsCount: number
}

export function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [businessFilter, setBusinessFilter] = useState<string>('all')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/superadmin/support/tickets')
      if (response.ok) {
        const data = await response.json()
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'WAITING_RESPONSE':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'RESOLVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'CLOSED':
        return <XCircle className="w-4 h-4 text-gray-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'Open'
      case 'IN_PROGRESS':
        return 'In Progress'
      case 'WAITING_RESPONSE':
        return 'Waiting Response'
      case 'RESOLVED':
        return 'Resolved'
      case 'CLOSED':
        return 'Closed'
      default:
        return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'Low'
      case 'MEDIUM':
        return 'Medium'
      case 'HIGH':
        return 'High'
      case 'URGENT':
        return 'Urgent'
      default:
        return priority
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.business.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesType = typeFilter === 'all' || ticket.type === typeFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    const matchesBusiness = businessFilter === 'all' || ticket.business.id === businessFilter

    return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesBusiness
  })

  const uniqueBusinesses = Array.from(new Set(tickets.map(t => t.business.id)))
    .map(id => tickets.find(t => t.business.id === id)?.business)
    .filter(Boolean)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">
            Manage support tickets from all businesses.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <Ticket className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-2xl font-bold text-gray-900">
                {tickets.filter(t => t.status === 'OPEN').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {tickets.filter(t => t.status === 'IN_PROGRESS').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {tickets.filter(t => t.status === 'RESOLVED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_RESPONSE">Waiting Response</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Types</option>
              <option value="GENERAL">General</option>
              <option value="TECHNICAL">Technical</option>
              <option value="BILLING">Billing</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="BUG_REPORT">Bug Report</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <select
              value={businessFilter}
              onChange={(e) => setBusinessFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">All Businesses</option>
              {uniqueBusinesses.map((business) => (
                <option key={business!.id} value={business!.id}>
                  {business!.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No tickets found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || businessFilter !== 'all'
              ? 'No tickets match your current filters. Try adjusting your search criteria.'
              : 'No support tickets have been created yet. When businesses create support tickets, they will appear here.'}
          </p>
          {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all' || businessFilter !== 'all' ? (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setTypeFilter('all')
                setPriorityFilter('all')
                setBusinessFilter('all')
              }}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <div className="text-sm text-gray-500">
              <p>Support tickets will appear here when businesses need assistance.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-teal-200 transition-all duration-200 cursor-pointer group"
              onClick={() => window.location.href = `/superadmin/support/tickets/${ticket.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Header with subject and status */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal-700 transition-colors mb-2">
                        {ticket.subject}
                      </h3>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTicketStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1.5">{getStatusText(ticket.status)}</span>
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTicketPriorityColor(ticket.priority)}`}>
                          {getPriorityText(ticket.priority)}
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {getTicketTypeDisplayName(ticket.type)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-500 mb-1">
                        {formatDate(ticket.updatedAt)}
                      </div>
                      <div className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {ticket.ticketNumber}
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {ticket.description}
                  </p>
                  
                  {/* Footer with business and user info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{ticket.business.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Reported by</span>
                        <span className="font-medium text-gray-900">{ticket.createdBy.name}</span>
                      </div>
                    </div>
                    
                    {ticket.assignedTo && (
                      <div className="flex items-center space-x-1 text-sm text-teal-600">
                        <UserCheck className="w-4 h-4" />
                        <span className="font-medium">Assigned to {ticket.assignedTo.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
