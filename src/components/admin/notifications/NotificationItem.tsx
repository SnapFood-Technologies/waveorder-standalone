// src/components/admin/notifications/NotificationItem.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Ticket, MessageSquare, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { getNotificationTypeDisplayName } from '@/lib/support-helpers'

interface Notification {
  id: string
  type: 'TICKET_CREATED' | 'TICKET_UPDATED' | 'TICKET_RESOLVED' | 'MESSAGE_RECEIVED' | 'SYSTEM_UPDATE'
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (notificationId: string) => void
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TICKET_CREATED':
      case 'TICKET_UPDATED':
      case 'TICKET_RESOLVED':
        return <Ticket className="w-5 h-5 text-blue-500" />
      case 'MESSAGE_RECEIVED':
        return <MessageSquare className="w-5 h-5 text-green-500" />
      case 'SYSTEM_UPDATE':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      default:
        return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'TICKET_CREATED':
        return 'bg-blue-50 border-blue-200'
      case 'TICKET_UPDATED':
        return 'bg-purple-50 border-purple-200'
      case 'TICKET_RESOLVED':
        return 'bg-green-50 border-green-200'
      case 'MESSAGE_RECEIVED':
        return 'bg-teal-50 border-teal-200'
      case 'SYSTEM_UPDATE':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    const diffInHours = diffInMinutes / 60
    const diffInDays = diffInHours / 24
    
    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
  }

  const content = (
    <div
      className={`bg-white border rounded-lg p-4 mb-4 transition-all duration-200 ${
        isHovered ? 'shadow-md' : 'hover:shadow-sm'
      } ${getNotificationColor(notification.type)} ${
        !notification.isRead ? 'border-l-4 border-l-teal-500' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-sm font-medium ${
              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
            }`}>
              {notification.title}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDate(notification.createdAt)}
              </span>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {getNotificationTypeDisplayName(notification.type)}
            </span>
            {!notification.isRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead(notification.id)
                }}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={handleClick}>
        {content}
      </Link>
    )
  }

  return (
    <div onClick={handleClick} className="cursor-pointer">
      {content}
    </div>
  )
}
