'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { SlidersHorizontal, Check, X, Loader2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface FilterSettings {
  categoriesEnabled: boolean
  collectionsEnabled: boolean
  groupsEnabled: boolean
  brandsEnabled: boolean
  priceRangeEnabled: boolean
}

export default function CustomFilteringPage() {
  const params = useParams()
  const businessId = params.businessId as string

  const [settings, setSettings] = useState<FilterSettings>({
    categoriesEnabled: true,
    collectionsEnabled: false,
    groupsEnabled: false,
    brandsEnabled: false,
    priceRangeEnabled: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [featureEnabled, setFeatureEnabled] = useState(true)

  useEffect(() => {
    fetchSettings()
    fetchBusiness()
  }, [businessId])

  const fetchBusiness = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}`)
      if (response.ok) {
        const data = await response.json()
        setFeatureEnabled(data.business?.customFilteringEnabled || false)
      }
    } catch (error) {
      console.error('Error fetching business:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/custom-filtering`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching filter settings:', error)
      toast.error('Failed to load filter settings')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof FilterSettings) => {
    if (key === 'categoriesEnabled' || key === 'priceRangeEnabled') {
      return
    }
    setSettings({ ...settings, [key]: !settings[key] })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/custom-filtering`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionsEnabled: settings.collectionsEnabled,
          groupsEnabled: settings.groupsEnabled,
          brandsEnabled: settings.brandsEnabled
        })
      })
      
      if (!response.ok) throw new Error('Failed to save settings')
      
      toast.success('Filter settings saved successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!featureEnabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center max-w-2xl mx-auto mt-8">
        <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Custom Filtering Feature Not Enabled</h3>
        <p className="text-gray-600">
          This feature is not enabled for your business. Contact your administrator to enable it.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Custom Filtering</h1>
        <p className="text-sm text-gray-600 mt-1">
          Choose which filters to display on your storefront
        </p>
      </div>

      {/* Filter Options */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6 space-y-3">
          {/* Categories - Always Enabled */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <SlidersHorizontal className="h-5 w-5 text-teal-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900">Categories</div>
                <div className="text-sm text-gray-600">Always enabled (required)</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600 font-medium">Enabled</span>
            </div>
          </div>

          {/* Collections */}
          <button
            type="button"
            onClick={() => handleToggle('collectionsEnabled')}
            className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all ${
              settings.collectionsEnabled
                ? 'bg-teal-50 border-teal-300 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                settings.collectionsEnabled ? 'bg-teal-100' : 'bg-gray-100'
              }`}>
                <SlidersHorizontal className={`h-5 w-5 transition-colors ${
                  settings.collectionsEnabled ? 'text-teal-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-left min-w-0">
                <div className="font-medium text-gray-900">Collections</div>
                <div className="text-sm text-gray-600">Filter products by collection</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {settings.collectionsEnabled ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Enabled</span>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500">Disabled</span>
                </>
              )}
            </div>
          </button>

          {/* Groups */}
          <button
            type="button"
            onClick={() => handleToggle('groupsEnabled')}
            className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all ${
              settings.groupsEnabled
                ? 'bg-teal-50 border-teal-300 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                settings.groupsEnabled ? 'bg-teal-100' : 'bg-gray-100'
              }`}>
                <SlidersHorizontal className={`h-5 w-5 transition-colors ${
                  settings.groupsEnabled ? 'text-teal-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-left min-w-0">
                <div className="font-medium text-gray-900">Groups</div>
                <div className="text-sm text-gray-600">Filter products by group</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {settings.groupsEnabled ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Enabled</span>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500">Disabled</span>
                </>
              )}
            </div>
          </button>

          {/* Brands */}
          <button
            type="button"
            onClick={() => handleToggle('brandsEnabled')}
            className={`w-full flex items-center justify-between p-4 border rounded-lg transition-all ${
              settings.brandsEnabled
                ? 'bg-teal-50 border-teal-300 shadow-sm'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                settings.brandsEnabled ? 'bg-teal-100' : 'bg-gray-100'
              }`}>
                <SlidersHorizontal className={`h-5 w-5 transition-colors ${
                  settings.brandsEnabled ? 'text-teal-600' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-left min-w-0">
                <div className="font-medium text-gray-900">Brands</div>
                <div className="text-sm text-gray-600">Filter products by brand</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {settings.brandsEnabled ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Enabled</span>
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500">Disabled</span>
                </>
              )}
            </div>
          </button>

          {/* Price Range - Always Enabled */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                <SlidersHorizontal className="h-5 w-5 text-teal-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900">Price Range</div>
                <div className="text-sm text-gray-600">Always enabled (required)</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600 font-medium">Enabled</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          How Custom Filtering Works
        </h3>
        <ul className="text-sm text-blue-700 space-y-1.5 list-disc list-inside">
          <li>Categories and Price Range are always enabled and cannot be disabled</li>
          <li>Enable Collections, Groups, or Brands to show those filters on your storefront</li>
          <li>Customers will be able to filter products using the enabled filter types</li>
          <li>Multiple filters can be applied simultaneously for better product discovery</li>
        </ul>
      </div>
    </>
  )
}
