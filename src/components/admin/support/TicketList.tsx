// src/components/admin/support/TicketList.tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Filter, Search, Ticket, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { CreateTicketModal } from './CreateTicketModal'
import { TicketCard } from './TicketCard'

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
  commentsCount: number
}

interface TicketListProps {
  businessId: string
}

export function TicketList({ businessId }: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  useEffect(() => {
    fetchTickets()
  }, [businessId])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stores/${businessId}/support/tickets`)
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

  const handleTicketCreated = (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev])
    setShowCreateModal(false)
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesType = typeFilter === 'all' || ticket.type === typeFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesType && matchesPriority
  })

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'WAITING_RESPONSE':
        return 'bg-orange-100 text-orange-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800'
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
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
            Manage your support requests and track their status.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 lg:mt-0 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Ticket
        </button>
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
          </div>
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No tickets found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all'
              ? 'No tickets match your current filters. Try adjusting your search terms or filters.'
              : 'You haven\'t created any support tickets yet. Get help with your WaveOrder store by creating a ticket.'}
          </p>
          {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && priorityFilter === 'all' ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Ticket
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
                setTypeFilter('all')
                setPriorityFilter('all')
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              businessId={businessId}
              onUpdate={fetchTickets}
            />
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <CreateTicketModal
          businessId={businessId}
          onClose={() => setShowCreateModal(false)}
          onTicketCreated={handleTicketCreated}
        />
      )}
    </div>
  )
}
