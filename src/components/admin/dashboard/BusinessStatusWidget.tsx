// src/components/admin/dashboard/BusinessStatusWidget.tsx
'use client'

import { useState, useEffect } from 'react'
import { Clock, MapPin, Phone, Globe, AlertCircle, CheckCircle, AlertTriangle, Settings, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface BusinessStatusWidgetProps {
  businessId: string
}

interface BusinessStatus {
  isOpen: boolean
  nextChange: string
  isTemporarilyClosed: boolean
  closureReason?: string
  closureMessage?: string
}

interface Business {
  name: string
  slug: string
  phone?: string
  address?: string
  email?: string
  website?: string
  businessHours?: any
  whatsappNumber?: string
}

interface SetupItem {
  key: string
  label: string
  completed: boolean
  required: boolean
  href: string
}

export function BusinessStatusWidget({ businessId }: BusinessStatusWidgetProps) {
  const [status, setStatus] = useState<BusinessStatus>({
    isOpen: false,
    nextChange: '',
    isTemporarilyClosed: false
  })
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusResponse, businessResponse] = await Promise.all([
          fetch(`/api/admin/stores/${businessId}/status`),
          fetch(`/api/admin/stores/${businessId}/business`)
        ])
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          setStatus(statusData.status)
        }
        
        if (businessResponse.ok) {
          const businessData = await businessResponse.json()
          setBusiness(businessData.business)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [businessId])

  const getSetupItems = (): SetupItem[] => {
    if (!business) return []

    return [
      {
        key: 'whatsapp',
        label: 'WhatsApp Number',
        completed: !!business.whatsappNumber,
        required: true,
        href: `/admin/stores/${businessId}/settings/configurations`
      },
      {
        key: 'hours',
        label: 'Business Hours',
        completed: !!business.businessHours,
        required: true,
        href: `/admin/stores/${businessId}/settings/configurations`
      },
      {
        key: 'contact',
        label: 'Contact Info',
        completed: !!(business.phone || business.email),
        required: false,
        href: `/admin/stores/${businessId}/settings/business`
      },
      {
        key: 'address',
        label: 'Business Address',
        completed: !!business.address,
        required: false,
        href: `/admin/stores/${businessId}/settings/business`
      },
      {
        key: 'appearance',
        label: 'Store Appearance',
        completed: false, // You can add logic here based on logo/branding setup
        required: false,
        href: `/admin/stores/${businessId}/appearance`
      }
    ]
  }

  const setupItems = getSetupItems()
  const incompleteRequired = setupItems.filter(item => item.required && !item.completed)
  const incompleteOptional = setupItems.filter(item => !item.required && !item.completed)
  const completedItems = setupItems.filter(item => item.completed)

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Store Overview</h3>
          <p className="text-sm text-gray-500">Manage your store status and essential settings</p>
        </div>
        <Link
          href={`/${business?.slug}`}
          target="_blank"
          className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
          title="View Store"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Store Status */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Current Status</h4>
            
            {status.isTemporarilyClosed ? (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Temporarily Closed
                    </span>
                    <span className="text-sm text-gray-600">
                      {business?.name} is temporarily closed
                    </span>
                  </div>
                </div>
                {status.closureMessage && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-600">{status.closureMessage}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    status.isOpen 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-1 ${status.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {status.isOpen ? 'Open' : 'Closed'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {business?.name} is currently {status.isOpen ? 'open' : 'closed'}
                  </span>
                </div>
                {status.nextChange && (
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{status.nextChange}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Business Info */}
          {business && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Store Information</h4>
              <div className="space-y-2">
                {business.phone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{business.phone}</span>
                  </div>
                )}
                
                {business.address && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{business.address}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Globe className="w-4 h-4" />
                  <span className="text-teal-600">waveorder.app/{business.slug}</span>
                </div>

                {/* Completion Status */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">
                      {completedItems.length} of {setupItems.length} items completed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Link
                href={`/admin/stores/${businessId}/settings/configurations`}
                className="block text-center px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium border border-teal-200"
              >
                Manage Hours
              </Link>
              
              {!status.isTemporarilyClosed ? (
                <Link
                  href={`/admin/stores/${businessId}/settings/business`}
                  className="block text-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Close Temporarily
                </Link>
              ) : (
                <button className="w-full px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium border border-green-200">
                  Reopen Store
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Setup Progress */}
        <div className="space-y-6">
          {(incompleteRequired.length > 0 || incompleteOptional.length > 0 || completedItems.length > 0) && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Setup Progress</h4>
              
              {/* Completed Items */}
              {completedItems.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 font-medium text-sm">Completed Setup</span>
                  </div>
                  <div className="space-y-1">
                    {completedItems.map((item) => (
                      <span key={item.key} className="block text-sm text-green-700">
                        • {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Required Items */}
              {incompleteRequired.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-800 font-medium text-sm">Required Setup</span>
                  </div>
                  <div className="space-y-2">
                    {incompleteRequired.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className="flex items-center justify-between text-sm text-amber-700 hover:text-amber-800 transition-colors"
                      >
                        <span>• {item.label}</span>
                        <span className="text-xs">Complete →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Items */}
              {incompleteOptional.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <span className="text-blue-800 font-medium text-sm">Recommended Setup</span>
                  </div>
                  <div className="space-y-2">
                    {incompleteOptional.map((item) => (
                      <Link
                        key={item.key}
                        href={item.href}
                        className="flex items-center justify-between text-sm text-blue-700 hover:text-blue-800 transition-colors"
                      >
                        <span>• {item.label}</span>
                        <span className="text-xs">Add →</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}