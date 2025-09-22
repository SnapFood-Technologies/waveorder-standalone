// src/components/admin/settings/DeliverySettings.tsx
'use client'

import { useState } from 'react'
import { BusinessConfiguration } from './BusinessConfiguration'
import { DeliveryZonesManagement } from '../delivery/DeliveryZonesManagement'

interface DeliverySettingsProps {
  businessId: string
}

export function DeliverySettings({ businessId }: DeliverySettingsProps) {
  const [activeSection, setActiveSection] = useState('methods')

  const sections = [
    { id: 'methods', name: 'Delivery Methods' },
    { id: 'zones', name: 'Delivery Zones' }
  ]

  return (
    <div className="p-6 space-y-6">
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

      {activeSection === 'zones' && (
        <DeliveryZonesManagement businessId={businessId} />
      )}
    </div>
  )
}
