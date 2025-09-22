// src/components/admin/delivery/DeliveryZonesManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Edit2, Trash2, Save, X, Info } from 'lucide-react'

interface DeliveryZone {
  id?: string
  name: string
  maxDistance: number
  fee: number
  description: string
  isActive: boolean
}

interface Business {
  deliveryFee: number
  deliveryRadius: number
  storeLatitude?: number
  storeLongitude?: number
  address?: string
  currency: string
}

interface DeliveryZonesManagementProps {
  businessId: string
}

export function DeliveryZonesManagement({ businessId }: DeliveryZonesManagementProps) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchData()
  }, [businessId])

  const fetchData = async () => {
    try {
      const [businessRes, zonesRes] = await Promise.all([
        fetch(`/api/admin/stores/${businessId}`),
        fetch(`/api/admin/stores/${businessId}/delivery/zones`)
      ])

      if (businessRes.ok) {
        const businessData = await businessRes.json()
        setBusiness(businessData.business)
      }

      if (zonesRes.ok) {
        const zonesData = await zonesRes.json()
        setZones(zonesData.zones || [])
      } else {
        // Initialize with default zones if none exist
        initializeDefaultZones()
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      initializeDefaultZones()
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaultZones = () => {
    if (!business) return

    const defaultZones: DeliveryZone[] = [
      {
        name: 'Zone 1 (Close)',
        maxDistance: 2,
        fee: business.deliveryFee,
        description: 'Close delivery area',
        isActive: true
      },
      {
        name: 'Zone 2 (Medium)',
        maxDistance: 5,
        fee: Math.round(business.deliveryFee * 1.5 * 100) / 100,
        description: 'Medium distance delivery',
        isActive: true
      },
      {
        name: 'Zone 3 (Far)',
        maxDistance: Math.min(business.deliveryRadius, 10),
        fee: Math.round(business.deliveryFee * 2 * 100) / 100,
        description: 'Far delivery area',
        isActive: true
      }
    ]

    setZones(defaultZones.filter(zone => zone.maxDistance <= business.deliveryRadius))
  }

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L', // Albanian Lek
    }
    
    const symbol = currencySymbols[business?.currency || 'USD'] || business?.currency || 'USD'
    return `${symbol}${amount.toLocaleString()}`
  }

  const saveZones = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/delivery/zones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones })
      })

      if (response.ok) {
        // Show success message
        console.log('Zones saved successfully')
      }
    } catch (error) {
      console.error('Error saving zones:', error)
    } finally {
      setSaving(false)
    }
  }

  const addZone = () => {
    const newZone: DeliveryZone = {
      name: `Zone ${zones.length + 1}`,
      maxDistance: 1,
      fee: business?.deliveryFee || 0,
      description: 'New delivery zone',
      isActive: true
    }
    setEditingZone(newZone)
    setShowAddForm(true)
  }

  const editZone = (zone: DeliveryZone) => {
    setEditingZone({ ...zone })
    setShowAddForm(true)
  }

  const deleteZone = (index: number) => {
    setZones(zones.filter((_, i) => i !== index))
  }

  const saveEditingZone = () => {
    if (!editingZone) return

    if (editingZone.id) {
      // Update existing zone
      setZones(zones.map(zone => 
        zone.id === editingZone.id ? editingZone : zone
      ))
    } else {
      // Add new zone
      setZones([...zones, { ...editingZone, id: Date.now().toString() }])
    }

    setEditingZone(null)
    setShowAddForm(false)
  }

  const cancelEditing = () => {
    setEditingZone(null)
    setShowAddForm(false)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MapPin className="w-5 h-5 text-teal-600 mr-2" />
            Delivery Zones
          </h3>
          <p className="text-sm text-gray-600">
            Configure delivery fees based on distance from your store
          </p>
        </div>
        <button
          onClick={addZone}
          className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Zone
        </button>
      </div>

      {/* Store Info - Mobile Responsive */}
      {business && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-blue-900">Store Location</h4>
              <p className="text-sm text-blue-700 break-words">
                {business.address || 'Store address not set'}
              </p>
              <div className="text-xs text-blue-600 mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span>Maximum delivery radius: {business.deliveryRadius}km</span>
                <span className="hidden sm:inline">|</span>
                <span>Base delivery fee: {formatCurrency(business.deliveryFee)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zones List - Mobile Responsive */}
      <div className="space-y-3">
        {zones.map((zone, index) => (
          <div
            key={zone.id || index}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900">{zone.name}</h4>
                    <p className="text-sm text-gray-600">{zone.description}</p>
                  </div>
                  <div className="text-sm text-gray-500 whitespace-nowrap">
                    <span className="font-medium">0-{zone.maxDistance}km</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900 whitespace-nowrap">
                    {formatCurrency(zone.fee)}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                    zone.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {zone.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => editZone(zone)}
                  className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteZone(index)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-gray-900">{zone.name}</h4>
                  <p className="text-sm text-gray-600">{zone.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => editZone(zone)}
                    className="p-2 text-gray-400 hover:text-teal-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteZone(index)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">0-{zone.maxDistance}km</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatCurrency(zone.fee)}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${
                  zone.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {zone.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>
        ))}

        {zones.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery zones configured</h3>
            <p className="text-gray-600 mb-4 px-4">
              Create delivery zones to set different fees based on distance
            </p>
            <button
              onClick={addZone}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Zone
            </button>
          </div>
        )}
      </div>

      {/* Edit Zone Modal - Mobile Responsive */}
      {showAddForm && editingZone && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingZone.id ? 'Edit Zone' : 'Add New Zone'}
                </h3>
                <button
                  onClick={cancelEditing}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone Name
                </label>
                <input
                  type="text"
                  value={editingZone.name}
                  onChange={(e) => setEditingZone({
                    ...editingZone,
                    name: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="e.g., Zone 1 (Close)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Distance (km)
                </label>
                <input
                  type="number"
                  value={editingZone.maxDistance}
                  onChange={(e) => setEditingZone({
                    ...editingZone,
                    maxDistance: parseFloat(e.target.value) || 0
                  })}
                  min="0.1"
                  max={business?.deliveryRadius || 10}
                  step="0.1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {business?.deliveryRadius || 10}km (your delivery radius)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Fee ({business?.currency || 'USD'})
                </label>
                <input
                  type="number"
                  value={editingZone.fee}
                  onChange={(e) => setEditingZone({
                    ...editingZone,
                    fee: parseFloat(e.target.value) || 0
                  })}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editingZone.description}
                  onChange={(e) => setEditingZone({
                    ...editingZone,
                    description: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="e.g., Close delivery area"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingZone.isActive}
                  onChange={(e) => setEditingZone({
                    ...editingZone,
                    isActive: e.target.checked
                  })}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Active zone
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white p-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={cancelEditing}
                  className="w-full sm:w-auto px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditingZone}
                  className="w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                >
                  {editingZone.id ? 'Update Zone' : 'Add Zone'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button - Mobile Responsive */}
      {zones.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={saveZones}
            disabled={saving}
            className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Zones'}
          </button>
        </div>
      )}
    </div>
  )
}