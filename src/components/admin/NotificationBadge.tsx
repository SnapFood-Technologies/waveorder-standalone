// src/components/admin/NotificationBadge.tsx
'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useUnreadCount } from '@/hooks/useUnreadCount'

interface NotificationBadgeProps {
  businessId: string
  className?: string
}

export function NotificationBadge({ businessId, className = '' }: NotificationBadgeProps) {
  const { unreadCount, loading } = useUnreadCount({
    apiEndpoint: `/api/admin/stores/${businessId}/notifications/unread-count`,
    pollInterval: 30000, // Poll every 30 seconds
    enabled: true
  })

  if (loading && unreadCount === 0) {
    return (
      <div className={`relative ${className}`}>
        <Bell className="w-5 h-5 text-gray-600" />
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <Bell className="w-5 h-5 text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  )
}
