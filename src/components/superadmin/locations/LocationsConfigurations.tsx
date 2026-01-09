'use client'

import React, { useState } from 'react'
import { Globe, MapPin, Building2 } from 'lucide-react'
import { CountriesTab } from './CountriesTab'
import { StatesTab } from './StatesTab'
import { CitiesTab } from './CitiesTab'

type TabType = 'countries' | 'states' | 'cities'

export function LocationsConfigurations() {
  const [activeTab, setActiveTab] = useState<TabType>('countries')

  const tabs = [
    { id: 'countries' as TabType, name: 'Countries', icon: Globe },
    { id: 'states' as TabType, name: 'States', icon: MapPin },
    { id: 'cities' as TabType, name: 'Cities', icon: Building2 }
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Locations Configurations</h1>
        <p className="text-gray-600 mt-1">Manage countries, states, and cities</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'countries' && <CountriesTab />}
        {activeTab === 'states' && <StatesTab />}
        {activeTab === 'cities' && <CitiesTab />}
      </div>
    </div>
  )
}
