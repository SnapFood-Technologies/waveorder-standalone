// src/components/admin/settings/DeliverySettings.tsx
'use client'

import { useState, useEffect } from 'react'
import { BusinessConfiguration } from './BusinessConfiguration'
import { DeliveryZonesManagement } from '../delivery/DeliveryZonesManagement'
import { PostalsManagement } from '../postals/PostalsManagement'
import { PostalPricingManagement } from '../postals/PostalPricingManagement'

interface DeliverySettingsProps {
  businessId: string
}

export function DeliverySettings({ businessId }: DeliverySettingsProps) {
  const [activeSection, setActiveSection] = useState('methods')
  const [businessType, setBusinessType] = useState<string>('RESTAURANT')

  useEffect(() => {
    // Fetch business type to determine if delivery zones should be shown
    fetch(`/api/admin/stores/${businessId}`)
      .then(res => res.json())
      .then(data => {
        if (data.business?.businessType) {
          setBusinessType(data.business.businessType)
        }
      })
      .catch(err => console.error('Error fetching business type:', err))
  }, [businessId])

  // For RETAIL businesses, show postal services instead of delivery zones
  const sections = businessType === 'RETAIL'
    ? [
        { id: 'methods', name: 'Delivery Methods' },
        { id: 'postals', name: 'Postal Services' },
        { id: 'pricing', name: 'Postal Pricing' }
      ]
    : [
        { id: 'methods', name: 'Delivery Methods' },
        { id: 'zones', name: 'Delivery Zones' }
      ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure delivery methods, zones, and pricing
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {section.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSection === 'methods' && (
        // @ts-ignore
        <BusinessConfiguration businessId={businessId} initialTab="delivery" />
      )}

      {activeSection === 'zones' && businessType !== 'RETAIL' && (
        <DeliveryZonesManagement businessId={businessId} />
      )}
      {activeSection === 'postals' && businessType === 'RETAIL' && (
        <PostalsManagement businessId={businessId} />
      )}
      {activeSection === 'pricing' && businessType === 'RETAIL' && (
        <PostalPricingManagement businessId={businessId} />
      )}
    </div>
  )
}
