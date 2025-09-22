// src/components/admin/layout/AdminHeader.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Menu, User, Settings, LogOut, ChevronDown, Bell, Store, ExternalLink, Cog, CreditCard } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

interface AdminHeaderProps {
  onMenuClick: () => void
  businessId: string
}

interface Business {
  id: string
  name: string
  slug: string
  subscriptionPlan: 'FREE' | 'PRO'
}

export function AdminHeader({ onMenuClick, businessId }: AdminHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isBusinessDropdownOpen, setIsBusinessDropdownOpen] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null)
  
  const { data: session } = useSession()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const businessDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const response = await fetch('/api/user/businesses')
        if (response.ok) {
          const data = await response.json()
          setBusinesses(data.businesses || [])
          
          // Find current business
          const current = data.businesses?.find((b: Business) => b.id === businessId)
          setCurrentBusiness(current || null)
        }
      } catch (error) {
        console.error('Error fetching businesses:', error)
      }
    }

    if (session?.user) {
      fetchBusinesses()
    }
  }, [session, businessId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (businessDropdownRef.current && !businessDropdownRef.current.contains(event.target as Node)) {
        setIsBusinessDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="p-2 text-gray-400 hover:text-gray-600 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Business Selector */}
        {currentBusiness && (
          <div className="relative" ref={businessDropdownRef}>
            {businesses.length > 1 ? (
              // Multiple businesses - show dropdown
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
                    {currentBusiness.subscriptionPlan} Plan
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            ) : (
              // Single business - direct link to store
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
                    {currentBusiness.subscriptionPlan} Plan
                  </p>
                </div>
              </Link>
            )}

            {/* Business Dropdown */}
            {isBusinessDropdownOpen && businesses.length > 1 && (
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
                        <p className="text-xs text-gray-500">{business.subscriptionPlan} Plan</p>
                      </div>
                      {business.id === businessId && (
                        <div className="w-2 h-2 bg-teal-500 rounded-full ml-2" />
                      )}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-gray-100 py-1">
                  <Link
                    href="/setup"
                    className="flex items-center px-4 py-2 text-sm text-teal-600 hover:bg-teal-50"
                    onClick={() => setIsBusinessDropdownOpen(false)}
                  >
                    <Store className="w-4 h-4 mr-3" />
                    Create New Business
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
        <button className="p-2 text-gray-400 hover:text-gray-600 relative">
          <Bell className="w-5 h-5" />
        </button>

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
              <p className="text-xs text-gray-500">Admin</p>
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
                  href={`/admin/stores/${businessId}/settings`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Link>
                <Link
                  href={`/admin/stores/${businessId}/settings/configurations`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Cog className="w-4 h-4 mr-3" />
                  Configurations
                </Link>
                {/* <Link
                  href={`/admin/stores/${businessId}/settings/billing`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <CreditCard className="w-4 h-4 mr-3" />
                  Billing
                </Link> */}
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