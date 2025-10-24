// src/components/admin/support/TicketDetails.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, MessageSquare, User, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { TicketComments } from './TicketComments'
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
}

interface TicketDetailsProps {
  businessId: string
  ticketId: string
}

export function TicketDetails({ businessId, ticketId }: TicketDetailsProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { data: session } = useSession()

  useEffect(() => {
    fetchTicket()
  }, [businessId, ticketId])

  const fetchTicket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/stores/${businessId}/support/tickets/${ticketId}`)
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
          {error || 'The ticket you\'re looking for doesn\'t exist or you don\'t have permission to view it.'}
        </p>
        <Link
          href={`/admin/stores/${businessId}/support/tickets`}
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
          href={`/admin/stores/${businessId}/support/tickets`}
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
                  <span className="font-medium">
                    {ticket.createdBy.name}
                    {ticket.createdBy.id === session?.user?.id && ' (You)'}
                  </span>
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
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Assigned to:</span>
                    <span className="font-medium">{ticket.assignedTo.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Business</h3>
              <p className="text-sm text-gray-600">{ticket.business.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comments */}
      <TicketComments
        ticketId={ticketId}
        businessId={businessId}
        onUpdate={fetchTicket}
      />
    </div>
  )
}
