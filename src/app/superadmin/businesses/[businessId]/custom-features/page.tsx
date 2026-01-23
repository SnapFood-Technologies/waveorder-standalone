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

        // Fetch business details
        const businessRes = await fetch(`/api/superadmin/businesses/${businessId}`)
        if (!businessRes.ok) throw new Error('Failed to fetch business')
        const businessData = await businessRes.json()
        setBusiness(businessData)

        // Fetch custom features
        const featuresRes = await fetch(`/api/superadmin/businesses/${businessId}/custom-features`)
        if (!featuresRes.ok) throw new Error('Failed to fetch custom features')
        const featuresData = await featuresRes.json()
        
        if (featuresData.success) {
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/superadmin/businesses/${businessId}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Business Details
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-teal-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Custom Features</h1>
              {business && (
                <p className="text-gray-600 mt-1">{business.name}</p>
              )}
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            Enable or disable advanced features for this business. These features allow the business owner to customize their storefront experience.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Features Cards */}
        <div className="space-y-4 mb-6">
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

        {/* Save Button */}
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-6">
          <div>
            <p className="text-sm text-gray-600">
              Changes will be saved immediately and the business owner will see the enabled features in their admin panel.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    </div>
  )
}
