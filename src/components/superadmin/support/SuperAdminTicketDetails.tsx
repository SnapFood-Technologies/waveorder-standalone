// src/components/superadmin/support/SuperAdminTicketDetails.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, MessageSquare, User, Calendar, AlertCircle, CheckCircle, XCircle, Building2, UserCheck } from 'lucide-react'
import { getTicketStatusColor, getTicketPriorityColor, getTicketTypeDisplayName } from '@/lib/support-helpers'
import { AssignTicketModal } from './AssignTicketModal'

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
}

interface SuperAdminTicketDetailsProps {
  ticketId: string
}

export function SuperAdminTicketDetails({ ticketId }: SuperAdminTicketDetailsProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchTicket()
  }, [ticketId])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/superadmin/support/tickets/${ticketId}`)
      if (response.ok) {
        const data = await response.json()
        setTicket(data.ticket)
      } else {
        setError('Failed to load ticket')
      }
    } catch (error) {
      setError('Failed to load ticket')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/superadmin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      })

      if (response.ok) {
        await fetchTicket() // Refresh ticket data
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleAssign = async (userId: string) => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/superadmin/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignedToId: userId
        }),
      })

      if (response.ok) {
        await fetchTicket() // Refresh ticket data
        setShowAssignModal(false)
      }
    } catch (error) {
      console.error('Failed to assign ticket:', error)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="w-5 h-5 text-blue-500" />
      case 'IN_PROGRESS':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'WAITING_RESPONSE':
        return <Clock className="w-5 h-5 text-orange-500" />
      case 'RESOLVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'CLOSED':
        return <XCircle className="w-5 h-5 text-gray-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
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
    return new Date(dateString).toLocaleString([], {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket not found</h3>
        <p className="text-gray-600 mb-6">
          {error || 'The ticket you\'re looking for doesn\'t exist.'}
        </p>
        <Link
          href="/superadmin/support/tickets"
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tickets
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/superadmin/support/tickets"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          <p className="text-gray-600">Ticket #{ticket.ticketNumber}</p>
        </div>
      </div>

      {/* Ticket Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTicketStatusColor(ticket.status)}`}>
                {getStatusIcon(ticket.status)}
                <span className="ml-2">{getStatusText(ticket.status)}</span>
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTicketPriorityColor(ticket.priority)}`}>
                {getPriorityText(ticket.priority)}
              </span>
              <span className="text-sm text-gray-600">
                {getTicketTypeDisplayName(ticket.type)}
              </span>
            </div>
            
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
              <div className="text-gray-700 whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Ticket Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Created by:</span>
                  <span className="font-medium">{ticket.createdBy.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">{formatDate(ticket.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Updated:</span>
                  <span className="font-medium">{formatDate(ticket.updatedAt)}</span>
                </div>
                {ticket.assignedTo && (
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Assigned to:</span>
                    <span className="font-medium">{ticket.assignedTo.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Business</h3>
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{ticket.business.name}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updating}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_RESPONSE">Waiting Response</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <button
                onClick={() => setShowAssignModal(true)}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                {ticket.assignedTo ? 'Reassign Ticket' : 'Assign Ticket'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
        <p className="text-gray-600">Comments functionality will be implemented here.</p>
      </div>

      {/* Assign Ticket Modal */}
      {showAssignModal && (
        <AssignTicketModal
          ticketId={ticketId}
          currentAssignee={ticket.assignedTo}
          onClose={() => setShowAssignModal(false)}
          onAssign={handleAssign}
        />
      )}
    </div>
  )
}
