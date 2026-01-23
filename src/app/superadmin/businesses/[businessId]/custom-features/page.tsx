'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChevronLeft, 
  Loader2, 
  Save, 
  Sparkles,
  Tag,
  Menu,
  Filter,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface CustomFeatures {
  brandsFeatureEnabled: boolean
  collectionsFeatureEnabled: boolean
  groupsFeatureEnabled: boolean
  customMenuEnabled: boolean
  customFilteringEnabled: boolean
}

interface Business {
  id: string
  name: string
}

export default function ManageCustomFeaturesPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [features, setFeatures] = useState<CustomFeatures>({
    brandsFeatureEnabled: false,
    collectionsFeatureEnabled: false,
    groupsFeatureEnabled: false,
    customMenuEnabled: false,
    customFilteringEnabled: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch business and features
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch custom features (includes business info)
        const featuresRes = await fetch(`/api/superadmin/businesses/${businessId}/custom-features`)
        if (!featuresRes.ok) throw new Error('Failed to fetch custom features')
        const featuresData = await featuresRes.json()
        
        if (featuresData.success) {
          setBusiness(featuresData.business)
          setFeatures(featuresData.features)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load custom features')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [businessId])

  const handleToggle = (feature: keyof CustomFeatures) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccessMessage(null)

      const response = await fetch(`/api/superadmin/businesses/${businessId}/custom-features`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update features')
      }

      setSuccessMessage('Custom features updated successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      console.error('Error saving features:', err)
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/superadmin/businesses/${businessId}`}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                Custom Features {business && <span className="text-gray-500">- {business.name}</span>}
              </h1>
              <p className="text-sm text-gray-600 mt-1">Manage advanced storefront features</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Main Content: 3/4 + 1/4 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Features Form (3/4) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Brands Feature */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Tag className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Brands</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Allow business to organize products by brands. Customers can filter products by brand on the storefront.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">Brand Management</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">Brand Filtering</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('brandsFeatureEnabled')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                  features.brandsFeatureEnabled ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.brandsFeatureEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Collections Feature */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Collections</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Enable custom product collections (e.g., "Summer Collection", "New Arrivals"). Business can group products into collections for better organization.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">Collection Management</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">Collection Filtering</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('collectionsFeatureEnabled')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                  features.collectionsFeatureEnabled ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.collectionsFeatureEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Groups Feature */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Tag className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Groups</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Enable custom product groups for flexible organization. Business can assign products to multiple groups for better categorization beyond collections.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">Group Management</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">Multiple Groups per Product</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('groupsFeatureEnabled')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                  features.groupsFeatureEnabled ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.groupsFeatureEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Custom Menu Feature */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Menu className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Custom Menu</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Allow business to create custom hierarchical navigation menus with parent/child items. Replace default category menu with custom structure.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">Menu Builder</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">Hierarchical Navigation</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('customMenuEnabled')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                  features.customMenuEnabled ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.customMenuEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Custom Filtering Feature */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Filter className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Custom Filtering</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Enable advanced product filtering with collections, attributes, and brands. Customers can filter by multiple criteria simultaneously.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">Multi-Filter</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">Attribute Filters</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">Brand Filters</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleToggle('customFilteringEnabled')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${
                  features.customFilteringEnabled ? 'bg-teal-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    features.customFilteringEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Info Sidebar (1/4) */}
        <div className="lg:col-span-1 space-y-4">
          {/* Info Card */}
          <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg border border-teal-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-gray-900">About Custom Features</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enable advanced features to give businesses more control over their storefront appearance and functionality.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">Features are enabled per business</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">Business owners configure their own settings</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-600">Changes take effect immediately</p>
              </div>
            </div>
          </div>

          {/* Feature Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Enabled Features</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Brands</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  features.brandsFeatureEnabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {features.brandsFeatureEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Collections</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  features.collectionsFeatureEnabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {features.collectionsFeatureEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Groups</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  features.groupsFeatureEnabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {features.groupsFeatureEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Custom Menu</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  features.customMenuEnabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {features.customMenuEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Custom Filtering</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  features.customFilteringEnabled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {features.customFilteringEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/superadmin/businesses/${businessId}`}
                className="flex items-center justify-between text-sm text-gray-600 hover:text-teal-600 py-2"
              >
                <span>Business Details</span>
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </Link>
              <Link
                href={`/superadmin/businesses/${businessId}/anomalies`}
                className="flex items-center justify-between text-sm text-gray-600 hover:text-teal-600 py-2"
              >
                <span>View Anomalies</span>
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
