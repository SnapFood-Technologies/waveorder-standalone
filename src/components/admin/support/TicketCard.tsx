// src/components/admin/support/TicketCard.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, MessageSquare, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
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
  commentsCount: number
}

interface TicketCardProps {
  ticket: Ticket
  businessId: string
  onUpdate: () => void
}

export function TicketCard({ ticket, businessId, onUpdate }: TicketCardProps) {
  const [isHovered, setIsHovered] = useState(false)

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

  return (
    <Link href={`/admin/stores/${businessId}/support/tickets/${ticket.id}`}>
      <div
        className={`bg-white border border-gray-200 rounded-lg p-6 transition-all duration-200 ${
          isHovered ? 'shadow-md border-teal-200' : 'hover:shadow-sm'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {ticket.subject}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTicketStatusColor(ticket.status)}`}>
                {getStatusIcon(ticket.status)}
                <span className="ml-1">{getStatusText(ticket.status)}</span>
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {ticket.description}
            </p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                {ticket.ticketNumber}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getTicketPriorityColor(ticket.priority)}`}>
                {getPriorityText(ticket.priority)}
              </span>
              <span className="text-xs">
                {getTicketTypeDisplayName(ticket.type)}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2 ml-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <MessageSquare className="w-4 h-4" />
              <span>{ticket.commentsCount}</span>
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(ticket.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
