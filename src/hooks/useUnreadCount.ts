// src/hooks/useUnreadCount.ts
import { useState, useEffect, useRef } from 'react'

interface UseUnreadCountOptions {
  apiEndpoint: string
  pollInterval?: number // in milliseconds
  enabled?: boolean
}

export function useUnreadCount({ 
  apiEndpoint, 
  pollInterval = 30000, // 30 seconds default
  enabled = true 
}: UseUnreadCountOptions) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isActiveRef = useRef(true)

  const fetchUnreadCount = async () => {
    if (!enabled || !isActiveRef.current) return

    try {
      setLoading(true)
      const response = await fetch(`${apiEndpoint}?t=${Date.now()}`, {
        cache: 'no-store'
      })
      
      if (response.ok && isActiveRef.current) {
        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    } finally {
      if (isActiveRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchUnreadCount()

    // Set up polling
    if (pollInterval > 0) {
      intervalRef.current = setInterval(fetchUnreadCount, pollInterval)
    }

    // Cleanup on unmount
    return () => {
      isActiveRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [apiEndpoint, pollInterval, enabled])

  // Pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        fetchUnreadCount()
        if (pollInterval > 0) {
          intervalRef.current = setInterval(fetchUnreadCount, pollInterval)
        }
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [pollInterval, enabled])

  return {
    unreadCount,
    loading,
    refetch: fetchUnreadCount
  }
}
