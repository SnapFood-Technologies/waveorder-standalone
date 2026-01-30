// src/components/admin/support/TicketCard.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, MessageSquare, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { getTicketStatusColor, getTicketPriorityColor, getTicketTypeDisplayName } from '@/lib/support-utils'

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
        className={`bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-teal-200 transition-all duration-200 cursor-pointer group mb-4`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
            
            {/* Footer with comments count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <span>{ticket.commentsCount} comments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
