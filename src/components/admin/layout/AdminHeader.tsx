// src/components/admin/layout/AdminHeader.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, User, Settings, LogOut, ChevronDown, Bell, Store, ExternalLink, Cog, CreditCard, Plus, Crown } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useBusiness } from '@/contexts/BusinessContext'

interface AdminHeaderProps {
  onMenuClick: () => void
  businessId: string
}

interface StoreLimits {
  canCreate: boolean
  currentCount: number
  limit: number
  limitReached: boolean
  suggestedUpgrade?: 'PRO' | 'BUSINESS'
  planName: string
  isUnlimited: boolean
}

// Helper to strip HTML tags for notification preview
function stripHtmlTags(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

// Helper to check trial status
function getTrialInfo(trialEndsAt: string | null): { isOnTrial: boolean; daysLeft: number } {
  if (!trialEndsAt) return { isOnTrial: false, daysLeft: 0 }
  const now = new Date()
  const trialEnd = new Date(trialEndsAt)
  if (trialEnd <= now) return { isOnTrial: false, daysLeft: 0 }
  const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return { isOnTrial: true, daysLeft }
}

export function AdminHeader({ onMenuClick, businessId }: AdminHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isBusinessDropdownOpen, setIsBusinessDropdownOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [storeLimits, setStoreLimits] = useState<StoreLimits | null>(null)
  
  const { businesses, currentBusiness, userRole } = useBusiness() // ADD userRole
  const { data: session } = useSession()
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const businessDropdownRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  // Check if SuperAdmin is impersonating
  const isImpersonating = 
    session?.user?.role === 'SUPER_ADMIN' && 
    pathname.startsWith('/admin')

  // Helper function to add impersonation params to URLs
  const addImpersonationParams = (href: string) => {
    if (!isImpersonating) return href
    
    const url = new URL(href, window.location.origin)
    url.searchParams.set('impersonate', 'true')
    url.searchParams.set('businessId', businessId)
    return url.pathname + url.search
  }

  // Fetch store limits when business dropdown is opened
  useEffect(() => {
    const fetchStoreLimits = async () => {
      try {
        const response = await fetch('/api/user/store-limits')
        if (response.ok) {
          const data = await response.json()
          setStoreLimits(data)
        }
      } catch (error) {
        console.error('Failed to fetch store limits:', error)
      }
    }

    if (isBusinessDropdownOpen && !storeLimits) {
      fetchStoreLimits()
    }
  }, [isBusinessDropdownOpen, storeLimits])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (businessDropdownRef.current && !businessDropdownRef.current.contains(event.target as Node)) {
        setIsBusinessDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/notifications?t=${Date.now()}`, {
          cache: 'no-store'
        })
        if (response.ok) {
          const data = await response.json()
          // Filter to only show unread notifications in header
          const unreadNotifications = (data.notifications || []).filter((notif: any) => !notif.isRead)
          setNotifications(unreadNotifications)
          setUnreadCount(unreadNotifications.length)
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }

    fetchNotifications()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    
    // Refresh notifications when user returns to the page
    const handleFocus = () => {
      fetchNotifications()
    }
    
    const handlePageShow = (event: PageTransitionEvent) => {
      // Refresh when user navigates back (including from notifications page)
      if (event.persisted || document.visibilityState === 'visible') {
        fetchNotifications()
      }
    }
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pageshow', handlePageShow)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pageshow', handlePageShow)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [businessId])

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/admin/stores/${businessId}/notifications/${notificationId}/read`, {
        method: 'PUT',
      })
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  // Display role text - UPDATED LOGIC
  const getRoleDisplayText = () => {
    if (isImpersonating) {
      return 'SuperAdmin (Impersonating)'
    }
    
    // Show actual business role
    switch (userRole) {
      case 'OWNER':
        return 'Owner'
      case 'MANAGER':
        return 'Manager'
      case 'STAFF':
        return 'Staff'
      default:
        return 'Team Member'
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="p-2 text-gray-400 hover:text-gray-600 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Business Selector */}
        {currentBusiness && (
          <div className="relative" ref={businessDropdownRef}>
            {businesses.length > 1 && !isImpersonating ? (
              <button
                onClick={() => setIsBusinessDropdownOpen(!isBusinessDropdownOpen)}
                className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 max-w-xs"
              >
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                  <Store className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentBusiness.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(() => {
                      const trial = getTrialInfo(currentBusiness.trialEndsAt)
                      if (trial.isOnTrial) {
                        return <span className="text-amber-600">Trial ({trial.daysLeft}d left)</span>
                      }
                      return `${currentBusiness.subscriptionPlan} Plan`
                    })()}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            ) : (
              <Link
                href={`/${currentBusiness.slug}`}
                target="_blank"
                className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 max-w-xs"
              >
                <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center">
                  <Store className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {currentBusiness.name}
                    </p>
                    <ExternalLink className="w-3 h-3 text-gray-400 hover:text-teal-600 transition-colors" />
                  </div>
                  <p className="text-xs text-gray-500">
                    {(() => {
                      const trial = getTrialInfo(currentBusiness.trialEndsAt)
                      if (trial.isOnTrial) {
                        return <span className="text-amber-600">Trial ({trial.daysLeft}d left)</span>
                      }
                      return `${currentBusiness.subscriptionPlan} Plan`
                    })()}
                  </p>
                </div>
              </Link>
            )}

            {/* Business Dropdown */}
            {isBusinessDropdownOpen && businesses.length > 1 && !isImpersonating && (
              <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-1 max-h-60 overflow-y-auto">
                  {businesses.map((business) => (
                    <Link
                      key={business.id}
                      href={`/admin/stores/${business.id}/dashboard`}
                      className={`flex items-center px-4 py-3 text-sm hover:bg-gray-50 ${
                        business.id === businessId ? 'bg-teal-50 text-teal-700' : 'text-gray-700'
                      }`}
                      onClick={() => setIsBusinessDropdownOpen(false)}
                    >
                      <Store className="w-4 h-4 mr-3 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{business.name}</p>
                        <p className="text-xs text-gray-500">
                          {(() => {
                            const trial = getTrialInfo(business.trialEndsAt)
                            if (trial.isOnTrial) {
                              return <span className="text-amber-600">Trial ({trial.daysLeft}d)</span>
                            }
                            return `${business.subscriptionPlan} Plan`
                          })()}
                        </p>
                      </div>
                      {business.id === businessId && (
                        <div className="w-2 h-2 bg-teal-500 rounded-full ml-2" />
                      )}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-gray-100 py-1">
                  {/* Store count and limit */}
                  {storeLimits && (
                    <div className="px-4 py-2 text-xs text-gray-500">
                      {storeLimits.isUnlimited 
                        ? `${storeLimits.currentCount} stores`
                        : `${storeLimits.currentCount} / ${storeLimits.limit} stores`
                      }
                    </div>
                  )}
                  
                  {/* Create New Business - Check limits */}
                  {storeLimits?.canCreate ? (
                    <Link
                      href="/setup"
                      className="flex items-center px-4 py-2 text-sm text-teal-600 hover:bg-teal-50"
                      onClick={() => setIsBusinessDropdownOpen(false)}
                    >
                      <Plus className="w-4 h-4 mr-3" />
                      Create New Store
                    </Link>
                  ) : storeLimits?.limitReached && storeLimits?.suggestedUpgrade ? (
                    <Link
                      href={`/admin/stores/${businessId}/settings/billing`}
                      className="flex items-center px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
                      onClick={() => setIsBusinessDropdownOpen(false)}
                    >
                      <Crown className="w-4 h-4 mr-3" />
                      Upgrade for more stores
                    </Link>
                  ) : (
                    <Link
                      href="/setup"
                      className="flex items-center px-4 py-2 text-sm text-teal-600 hover:bg-teal-50"
                      onClick={() => setIsBusinessDropdownOpen(false)}
                    >
                      <Plus className="w-4 h-4 mr-3" />
                      Create New Store
                    </Link>
                  )}

                  {/* Manage All Stores */}
                  <Link
                    href={addImpersonationParams(`/admin/stores/${businessId}/all-stores`)}
                    className="flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    onClick={() => setIsBusinessDropdownOpen(false)}
                  >
                    <Store className="w-4 h-4 mr-3" />
                    Manage All Stores
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-2 lg:space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <Link 
                    href={addImpersonationParams(`/admin/stores/${businessId}/notifications`)}
                    className="text-sm text-teal-600 hover:text-teal-700"
                    onClick={() => setIsNotificationOpen(false)}
                  >
                    View all
                  </Link>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.isRead ? 'bg-teal-50' : ''
                        }`}
                        onClick={() => {
                          if (!notification.isRead) {
                            markNotificationAsRead(notification.id)
                          }
                          if (notification.link) {
                            window.location.href = notification.link
                          }
                          setIsNotificationOpen(false)
                        }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            !notification.isRead ? 'bg-teal-500' : 'bg-gray-300'
                          }`} />
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {stripHtmlTags(notification.title)}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {stripHtmlTags(notification.message)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100">
                  <Link
                    href={addImpersonationParams(`/admin/stores/${businessId}/notifications`)}
                    className="block w-full text-center text-sm text-teal-600 hover:text-teal-700 py-2"
                    onClick={() => setIsNotificationOpen(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 p-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50"
          >
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center overflow-hidden">
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
                </span>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 truncate max-w-24">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">{getRoleDisplayText()}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {session?.user?.email}
                </p>
              </div>
              
              <div className="py-1">
                <Link
                  href={addImpersonationParams(`/admin/stores/${businessId}/settings/profile`)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <User className="w-4 h-4 mr-3" />
                  Profile
                </Link>
                <Link
                  href={addImpersonationParams(`/admin/stores/${businessId}/settings/business`)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Business Settings
                </Link>
                <Link
                  href={addImpersonationParams(`/admin/stores/${businessId}/settings/billing`)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <CreditCard className="w-4 h-4 mr-3" />
                  Billing & Plans
                </Link>
                <Link
                  href={addImpersonationParams(`/admin/stores/${businessId}/settings/configurations`)}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Cog className="w-4 h-4 mr-3" />
                  Configurations
                </Link>
              </div>
              
              <div className="border-t border-gray-100">
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}