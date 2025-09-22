// src/components/admin/settings/BusinessSettingsForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Building2, 
  MapPin, 
  Globe, 
  Image as ImageIcon, 
  Save,
  AlertCircle,
  Upload,
  X,
  Eye,
  EyeOff,
  Calendar,
  Info
} from 'lucide-react'

interface BusinessSettingsProps {
  businessId: string
}

interface BusinessSettings {
  name: string
  slug: string
  description?: string
  businessType: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  coverImage?: string
  currency: string
  timezone: string
  language: string
  
  // SEO fields
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  seoTitleAl?: string
  seoDescriptionAl?: string
  seoKeywordsAl?: string
  
  // Store status
  isTemporarilyClosed: boolean
  closureReason?: string
  closureMessage?: string
  closureStartDate?: string
  closureEndDate?: string
  
  // Other settings
  isIndexable: boolean
}

export function BusinessSettingsForm({ businessId }: BusinessSettingsProps) {
  const [settings, setSettings] = useState<BusinessSettings>({
    name: '',
    slug: '',
    businessType: 'RESTAURANT',
    currency: 'USD',
    timezone: 'UTC',
    language: 'en',
    isTemporarilyClosed: false,
    isIndexable: true
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [originalSlug, setOriginalSlug] = useState('')
  const [showSeoAdvanced, setShowSeoAdvanced] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)

  useEffect(() => {
    if (businessId) {
      fetchSettings()
    }
  }, [businessId])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/settings/business`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data.business)
        setOriginalSlug(data.business.slug)
      } else {
        setError('Failed to load business settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      setError('Failed to load business settings')
    } finally {
      setLoading(false)
    }
  }

  // Check slug availability when changed
  useEffect(() => {
    if (settings.slug && settings.slug !== originalSlug && settings.slug.length >= 3) {
      const timeoutId = setTimeout(checkSlugAvailability, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setSlugAvailable(null)
    }
  }, [settings.slug, originalSlug])

  const checkSlugAvailability = async () => {
    if (!settings.slug) return
    
    setCheckingSlug(true)
    try {
      const response = await fetch('/api/admin/check-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slug: settings.slug,
          businessId 
        })
      })
      const { available } = await response.json()
      setSlugAvailable(available)
    } catch (error) {
      setSlugAvailable(null)
    } finally {
      setCheckingSlug(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (name === 'slug') {
      // Clean slug input
      const cleanSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
      
      setSettings(prev => ({ ...prev, [name]: cleanSlug }))
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setSettings(prev => ({ ...prev, [name]: checked }))
    } else {
      setSettings(prev => ({ ...prev, [name]: value }))
    }
  }

  // Generate slug from business name
  useEffect(() => {
    if (settings.name && settings.slug === originalSlug) {
      const newSlug = settings.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      if (newSlug !== settings.slug) {
        setSettings(prev => ({ ...prev, slug: newSlug }))
      }
    }
  }, [settings.name, originalSlug, settings.slug])

  const handleImageUpload = async (file: File, type: 'logo' | 'cover') => {
    if (type === 'logo') setLogoUploading(true)
    if (type === 'cover') setCoverUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch(`/api/admin/stores/${businessId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const { url } = await response.json()
        setSettings(prev => ({ 
          ...prev, 
          [type === 'logo' ? 'logo' : 'coverImage']: url 
        }))
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload image')
    } finally {
      if (type === 'logo') setLogoUploading(false)
      if (type === 'cover') setCoverUploading(false)
    }
  }

  const saveSettings = async () => {
    if (settings.slug !== originalSlug && slugAvailable === false) {
      setError('Please choose a different store URL - this one is already taken')
      return
    }

    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/settings/business`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.business)
        setOriginalSlug(data.business.slug)
        setSlugAvailable(null)
        // Show success message
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const businessTypes = [
    { value: 'RESTAURANT', label: 'Restaurant' },
    { value: 'CAFE', label: 'Cafe' },
    { value: 'RETAIL', label: 'Retail Store' },
    { value: 'GROCERY', label: 'Grocery Store' },
    { value: 'JEWELRY', label: 'Jewelry Store' },
    { value: 'FLORIST', label: 'Florist' },
    { value: 'HEALTH_BEAUTY', label: 'Health & Beauty' },
    { value: 'OTHER', label: 'Other' }
  ]

  const currencies = [
    { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'ALL', label: 'Albanian Lek (L)', symbol: 'L' },
    { value: 'GBP', label: 'British Pound (£)', symbol: '£' }
  ]

  const closureReasons = [
    'Holiday break',
    'Staff shortage',
    'Equipment maintenance',
    'Inventory shortage',
    'Family emergency',
    'Seasonal closure',
    'Renovation',
    'Health and safety',
    'Custom reason'
  ]

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Business Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your business information, SEO settings, and store visibility
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={saving || (settings.slug !== originalSlug && slugAvailable === false)}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Building2 className="w-5 h-5 text-teal-600 mr-2" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={settings.name}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="Your Business Name"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store URL <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                    waveorder.app/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={settings.slug}
                    onChange={handleInputChange}
                    className="flex-1 border border-gray-300 rounded-r-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    placeholder="your-business-name"
                    required
                  />
                </div>
                {settings.slug && settings.slug !== originalSlug && (
                  <div className="mt-2">
                    {checkingSlug ? (
                      <p className="text-sm text-gray-600">Checking availability...</p>
                    ) : slugAvailable === true ? (
                      <p className="text-sm text-green-600">✓ URL is available</p>
                    ) : slugAvailable === false ? (
                      <p className="text-sm text-red-600">✗ URL is already taken</p>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={settings.description || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="Tell customers about your business..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type
                </label>
                <select
                  name="businessType"
                  value={settings.businessType}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="currency"
                  value={settings.currency}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                >
                  {currencies.map(currency => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-5 h-5 text-teal-600 mr-2" />
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={settings.address || ''}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="Full business address including city, state/province, and postal code"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for delivery zones and customer directions
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={settings.phone || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="+1234567890"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={settings.email || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="business@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={settings.website || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="https://www.yourbusiness.com"
                />
              </div>
            </div>
          </div>

          {/* Store Closure Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Calendar className="w-5 h-5 text-teal-600 mr-2" />
              Store Status & Closure
            </h2>

            <div className="space-y-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isTemporarilyClosed"
                  checked={settings.isTemporarilyClosed}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">
                  Temporarily close store
                </label>
              </div>

              {settings.isTemporarilyClosed && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Closure Reason
                    </label>
                    <select
                      name="closureReason"
                      value={settings.closureReason || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    >
                      <option value="">Select a reason</option>
                      {closureReasons.map(reason => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message for Customers
                    </label>
                    <textarea
                      name="closureMessage"
                      value={settings.closureMessage || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="e.g., We're temporarily closed for maintenance. We'll be back soon!"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Closure Start Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      name="closureStartDate"
                      value={settings.closureStartDate || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Reopening Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      name="closureEndDate"
                      value={settings.closureEndDate || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SEO Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Globe className="w-5 h-5 text-teal-600 mr-2" />
                SEO Settings
              </h2>
              <button
                type="button"
                onClick={() => setShowSeoAdvanced(!showSeoAdvanced)}
                className="flex items-center text-sm text-teal-600 hover:text-teal-700"
              >
                {showSeoAdvanced ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showSeoAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Title
                </label>
                <input
                  type="text"
                  name="seoTitle"
                  value={settings.seoTitle || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="Custom page title for search engines"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use "{settings.name} - Order Online"
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Description
                </label>
                <textarea
                  name="seoDescription"
                  value={settings.seoDescription || ''}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="Brief description for search engines (150-160 characters)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  name="seoKeywords"
                  value={settings.seoKeywords || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  placeholder="restaurant, delivery, local business (comma-separated)"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isIndexable"
                  checked={settings.isIndexable}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Allow search engines to index this store
                </label>
              </div>

              {showSeoAdvanced && (
                <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900">Albanian SEO (Optional)</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Albanian SEO Title
                    </label>
                    <input
                      type="text"
                      name="seoTitleAl"
                      value={settings.seoTitleAl || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="Titulli për motorët e kërkimit në shqip"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Albanian SEO Description
                    </label>
                    <textarea
                      name="seoDescriptionAl"
                      value={settings.seoDescriptionAl || ''}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="Përshkrimi i shkurtër për motorët e kërkimit"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Albanian Keywords
                    </label>
                    <input
                      type="text"
                      name="seoKeywordsAl"
                      value={settings.seoKeywordsAl || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="restorant, dërgesë, biznes lokal (të ndara me presje)"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

       {/* Sidebar - Images */}
       <div className="space-y-6">
          {/* Logo Upload */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <ImageIcon className="w-5 h-5 text-teal-600 mr-2" />
              Logo
            </h3>
            
            {settings.logo ? (
              <div className="relative">
                <img
                  src={settings.logo}
                  alt="Business logo"
                  className="w-full h-32 object-contain bg-gray-50 rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => setSettings(prev => ({ ...prev, logo: undefined }))}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload your business logo</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'logo')
                  }}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer text-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {logoUploading ? 'Uploading...' : 'Choose Logo'}
                </label>
              </div>
            )}
          </div>

          {/* Cover Image Upload */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cover Image</h3>
            
            {settings.coverImage ? (
              <div className="relative">
                <img
                  src={settings.coverImage}
                  alt="Cover image"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => setSettings(prev => ({ ...prev, coverImage: undefined }))}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload a cover image</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'cover')
                  }}
                  className="hidden"
                  id="cover-upload"
                />
                <label
                  htmlFor="cover-upload"
                  className="inline-flex items-center px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 cursor-pointer text-sm"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {coverUploading ? 'Uploading...' : 'Choose Image'}
                </label>
              </div>
            )}
          </div>

          {/* Store Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Preview</h3>
            <div className="space-y-3">
              <a
                href={`/${settings.slug || 'your-store'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                View Store
              </a>
              <div className="text-xs text-gray-500">
                Store URL: waveorder.app/{settings.slug || 'your-store'}
              </div>
            </div>
          </div>

          {/* Help & Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Important Notes:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Address is required for delivery zones</li>
                  <li>• URL changes affect existing links</li>
                  <li>• SEO changes may take time to reflect</li>
                  <li>• Store closure affects all customer access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}