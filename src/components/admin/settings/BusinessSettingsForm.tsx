// src/components/admin/settings/BusinessSettingsForm.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
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
  Info,
  Search,
  Link as LinkIcon,
  Code,
  CheckCircle
} from 'lucide-react'

interface BusinessSettingsProps {
  businessId: string
}

interface SuccessMessage {
  title: string
  description?: string
}

interface BusinessSettings {
  name: string
  slug: string
  description?: string
  descriptionAl?: string
  businessType: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  coverImage?: string
  favicon?: string
  ogImage?: string
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
  
  // Structured data
  schemaType?: string
  schemaData?: any
  canonicalUrl?: string

  // Add these coordinate fields
  storeLatitude?: number
  storeLongitude?: number
  
  // Store status
  isTemporarilyClosed: boolean
  closureReason?: string
  closureMessage?: string
  closureStartDate?: string
  closureEndDate?: string
  
  // Other settings
  isIndexable: boolean
  noIndex: boolean
  noFollow: boolean
}

// Country detection utility
// Updated Country detection utility
function detectBusinessCountry(business: any): 'AL' | 'US' | 'GR' | 'IT' | 'DEFAULT' {
  // TESTING OVERRIDE: Check user's location first for Greece testing ONLY
  if (typeof window !== 'undefined') {
    const browserLanguage = navigator.language.toLowerCase()
    if (browserLanguage.startsWith('el') || browserLanguage.includes('gr')) {
      return 'GR'
    }
    
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (timezone === 'Europe/Athens') {
        return 'GR'
      }
    } catch (error) {
      // Timezone detection failed
    }
  }
  
  // PRIMARY: Check business latitude/longitude coordinates
  if (business.storeLatitude && business.storeLongitude) {
    const lat = business.storeLatitude
    const lng = business.storeLongitude
    
    // Albania boundaries: approximately 39.6-42.7°N, 19.3-21.1°E
    if (lat >= 39.6 && lat <= 42.7 && lng >= 19.3 && lng <= 21.1) {
      return 'AL'
    }
    
    // Greece boundaries: approximately 34.8-41.8°N, 19.3-28.2°E
    if (lat >= 34.8 && lat <= 41.8 && lng >= 19.3 && lng <= 28.2) {
      return 'GR'
    }
    
    // Italy boundaries: approximately 35.5-47.1°N, 6.6-18.5°E
    if (lat >= 35.5 && lat <= 47.1 && lng >= 6.6 && lng <= 18.5) {
      return 'IT'
    }
    
    // United States boundaries: approximately 24-71°N, -180 to -66°W
    if (lat >= 24 && lat <= 71 && lng >= -180 && lng <= -66) {
      return 'US'
    }
  }
  
  // SECONDARY: Check whatsapp number prefix
  if (business.whatsappNumber?.startsWith('+355') || business.phone?.startsWith('+355')) return 'AL'
  if (business.whatsappNumber?.startsWith('+30') || business.phone?.startsWith('+30')) return 'GR'
  if (business.whatsappNumber?.startsWith('+39') || business.phone?.startsWith('+39')) return 'IT'
  if (business.whatsappNumber?.startsWith('+1') || business.phone?.startsWith('+1')) return 'US'
  
  // TERTIARY: Check other user location indicators (for non-Greece countries only)
  if (typeof window !== 'undefined') {
    const browserLanguage = navigator.language.toLowerCase()
    if (browserLanguage.startsWith('sq') || browserLanguage.includes('al')) {
      return 'AL'
    }
    if (browserLanguage.startsWith('it')) {
      return 'IT'
    }
    
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (timezone === 'Europe/Tirane') return 'AL'
      if (timezone === 'Europe/Rome') return 'IT'
    } catch (error) {
      // Timezone detection failed
    }
  }
  
  // FALLBACK: Check business language and currency
  if (business.currency === 'ALL' || business.language === 'sq') return 'AL'
  if (business.currency === 'EUR' && business.language === 'el') return 'GR'
  if (business.currency === 'EUR' && business.language === 'it') return 'IT'
  
  return 'US'
}

// Updated AddressAutocomplete Component
function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  required, 
  businessData,
  onCoordinatesChange // ADD THIS PROP
}: {
  value: string
  onChange: (address: string) => void
  placeholder: string
  required: boolean
  businessData?: any
  onCoordinatesChange?: (lat: number, lng: number) => void // ADD THIS TYPE
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Load Google Places API - Fixed version
  useEffect(() => {
    // Check if Google Maps is already loaded
    // @ts-ignore
    if (window.google?.maps?.places) {
      setIsLoaded(true)
      return
    }
    
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      // Script exists, wait for Google to be available
      const checkGoogle = () => {
        // @ts-ignore
        if (window.google?.maps?.places) {
          setIsLoaded(true)
        } else {
          // Keep checking every 100ms until Google is available
          setTimeout(checkGoogle, 100)
        }
      }
      checkGoogle()
      return
    }
    
    // Only create script if none exists
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    script.onerror = () => console.error('Failed to load Google Maps API')
    document.head.appendChild(script)
    
    // Don't remove the script in cleanup - let it stay for other components
  }, [])
  
  useEffect(() => {
    if (isLoaded && inputRef.current) {
      const detectedCountry = detectBusinessCountry(businessData)
      
      const getAllowedCountries = () => {
        switch (detectedCountry) {
          case 'AL':
            return ['al']
          case 'GR':
            return ['gr', 'al', 'it', 'us'] // Extended for Greece
          case 'IT':
            return ['it']
          case 'US':
            return ['us']
          default:
            return ['us']
        }
      }
      
      const allowedCountries = getAllowedCountries()
      
      // @ts-ignore
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { 
          country: allowedCountries
        }
      })
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.formatted_address) {
          onChange(place.formatted_address)
          
          // CAPTURE AND SAVE COORDINATES
          if (place.geometry?.location && onCoordinatesChange) {
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            onCoordinatesChange(lat, lng)
          }
        }
      })

      // Cleanup function to remove listeners
      return () => {
        // @ts-ignore
        if (window.google?.maps?.event) {
          // @ts-ignore
          window.google.maps.event.clearInstanceListeners(autocomplete)
        }
      }
    }
  }, [isLoaded, onChange, businessData, onCoordinatesChange])

  return (
    <input
      ref={inputRef}
      type="text"
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
      placeholder={placeholder}
    />
  )
}

export function BusinessSettingsForm({ businessId }: BusinessSettingsProps) {
  const [settings, setSettings] = useState<BusinessSettings>({
    name: '',
    slug: '',
    businessType: 'RESTAURANT',
    currency: 'USD',
    timezone: 'UTC',
    language: 'en',
    schemaType: 'LocalBusiness',
    isTemporarilyClosed: false,
    isIndexable: true,
    noIndex: false,
    noFollow: false
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
  const [faviconUploading, setFaviconUploading] = useState(false)
  const [ogImageUploading, setOgImageUploading] = useState(false)
  const [detectedCountry, setDetectedCountry] = useState<string>('US')
  // const [showAlbanianFields, setShowAlbanianFields] = useState(false)
  const [successMessage, setSuccessMessage] = useState<SuccessMessage | null>(null)

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
        
        // Detect country and show appropriate fields
        const country = detectBusinessCountry(data.business)
        setDetectedCountry(country)
        
        // Show Albanian fields for AL and GR (Greece gets all languages)
        // setShowAlbanianFields(country === 'AL' || country === 'GR')
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

  // Check slug availability
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
      const response = await fetch('/api/setup/check-slug', {
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
      const cleanSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
      
      setSettings(prev => ({ ...prev, [name]: cleanSlug }))
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      
      // Handle noIndex/isIndexable inverse relationship
      if (name === 'noIndex') {
        setSettings(prev => ({ 
          ...prev, 
          noIndex: checked,
          isIndexable: !checked
        }))
      } else if (name === 'isIndexable') {
        setSettings(prev => ({ 
          ...prev, 
          isIndexable: checked,
          noIndex: !checked
        }))
      } else {
        setSettings(prev => ({ ...prev, [name]: checked }))
      }
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

  const uploadImageToSupabase = async (file: File, folder: string): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    formData.append('businessId', businessId)

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const { publicUrl } = await response.json()
    return publicUrl
  }

  const handleImageUpload = async (file: File, type: 'logo' | 'cover' | 'favicon' | 'ogImage') => {
    const setUploading = {
      logo: setLogoUploading,
      cover: setCoverUploading,
      favicon: setFaviconUploading,
      ogImage: setOgImageUploading
    }[type]
    
    setUploading(true)
    
    try {
      const url = await uploadImageToSupabase(file, type)
      
      const fieldMap = {
        logo: 'logo',
        cover: 'coverImage',
        favicon: 'favicon',
        ogImage: 'ogImage'
      }
      
      setSettings(prev => ({ 
        ...prev, 
        [fieldMap[type]]: url 
      }))
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload image')
    } finally {
      setUploading(false)
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
        setSuccessMessage({
          title: 'Business Settings Updated',
          description: 'Your business information has been saved successfully'
        })
  
        // Hide success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000)
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
    { value: 'OTHER', label: 'Other' }
  ]

  const currencies = [
    { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'ALL', label: 'Albanian Lek (L)', symbol: 'L' },
    { value: 'GBP', label: 'British Pound (£)', symbol: '£' }
  ]

  const schemaTypes = [
    { value: 'LocalBusiness', label: 'Local Business' },
    { value: 'Restaurant', label: 'Restaurant' },
    { value: 'Store', label: 'Store' },
    { value: 'Organization', label: 'Organization' }
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
          {[...Array(8)].map((_, i) => (
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
      {/* Success Message */}
{successMessage && (
  <div className="fixed top-4 right-4 z-50 max-w-md">
    <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-green-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{successMessage.title}</h4>
          {successMessage.description && (
            <p className="text-sm text-gray-600 mt-1">{successMessage.description}</p>
          )}
        </div>
        <button
          onClick={() => setSuccessMessage(null)}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
)}

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

              {/* Albanian Description - Show for AL, GR, IT */}
              {settings.language === 'sq' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Albanian)
                  </label>
                  <textarea
                    name="descriptionAl"
                    value={settings.descriptionAl || ''}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    placeholder="Përshkrini biznesin tuaj në shqip..."
                  />
                </div>
              )}

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

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Language
  </label>
  <select
    name="language"
    value={settings.language}
    onChange={handleInputChange}
    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
  >
    <option value="en">English</option>
    {(detectedCountry === 'AL' || detectedCountry === 'GR') && (
      <option value="sq">Albanian (Shqip)</option>
    )}
    {detectedCountry === 'GR' && <option value="el">Greek (Ελληνικά)</option>}
    {(detectedCountry === 'IT' || detectedCountry === 'GR') && (
      <option value="it">Italian (Italiano)</option>
    )}
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
  <AddressAutocomplete
    value={settings.address || ''}
    onChange={(address) => setSettings(prev => ({ ...prev, address }))}
    onCoordinatesChange={(lat, lng) => {
      setSettings(prev => ({ 
        ...prev, 
        storeLatitude: lat,
        storeLongitude: lng 
      }))
    }}
    placeholder="Enter your full business address"
    required={true}
    businessData={settings}
  />
  <p className="text-xs text-gray-500 mt-1">
    Required for delivery zones and customer directions
  </p>
  {/* Optional: Show coordinates for debugging */}
  {settings.storeLatitude && settings.storeLongitude && (
    <p className="text-xs text-gray-400 mt-1">
      Coordinates: {settings.storeLatitude.toFixed(6)}, {settings.storeLongitude.toFixed(6)}
    </p>
  )}
</div>

              <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={settings.phone || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="Enter your business phone number"
              />
              <p className="text-xs text-gray-500 mt-1">
                This phone number is for general business communication and customer inquiries. It doesn't need to be a WhatsApp number - you can use the same number as your WhatsApp if you prefer, or use a different regular phone number.
              </p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Calendar className="w-5 h-5 text-teal-600 mr-2" />
              Store Status & Closure
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Use these settings to temporarily close your store during holidays, maintenance, or other situations. Your store will display a closure message to customers and prevent new orders.
            </p>

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
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to use "{settings.name} - Order Online" ({settings.seoTitle?.length || 0}/60 characters)
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
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {settings.seoDescription?.length || 0}/160 characters
                </p>
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

              {/* Albanian SEO Fields */}
              {settings.language === 'sq' && (
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
                      maxLength={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {settings.seoTitleAl?.length || 0}/60 characters
                    </p>
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
                      maxLength={160}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {settings.seoDescriptionAl?.length || 0}/160 characters
                    </p>
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

              {/* Search Engine Visibility */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900">Search Engine Visibility</h3>
                
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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="noIndex"
                    checked={settings.noIndex}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Hide from search engines (noindex)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="noFollow"
                    checked={settings.noFollow}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Don't follow links (nofollow)
                  </label>
                </div>
              </div>

              {showSeoAdvanced && (
                <div className="space-y-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center">
                    <Code className="w-4 h-4 mr-2" />
                    Advanced SEO Settings
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Canonical URL
                    </label>
                    <input
                      type="url"
                      name="canonicalUrl"
                      value={settings.canonicalUrl || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="https://waveorder.app/your-store"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty to use default URL
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schema.org Type
                    </label>
                    <select
                      name="schemaType"
                      value={settings.schemaType || 'LocalBusiness'}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    >
                      {schemaTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Schema Data (JSON)
                    </label>
                    <textarea
                      name="schemaData"
                      value={settings.schemaData ? JSON.stringify(settings.schemaData, null, 2) : ''}
                      onChange={(e) => {
                        try {
                          const data = e.target.value ? JSON.parse(e.target.value) : null
                          setSettings(prev => ({ ...prev, schemaData: data }))
                        } catch {
                          // Invalid JSON, keep the text value for user to fix
                        }
                      }}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-mono"
                      placeholder='{"additionalType": "Restaurant", "cuisine": "Italian"}'
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Valid JSON format for additional structured data
                    </p>
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

          {/* Favicon Upload */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <LinkIcon className="w-5 h-5 text-teal-600 mr-2" />
              Favicon
            </h3>
            <p className="text-sm text-gray-600 mb-4">
  A favicon is the small icon that appears in browser tabs, bookmarks, and search results. It helps customers recognize your store across different platforms.
</p>


           
            
            {settings.favicon ? (
              <div className="relative">
                <div className="flex items-center space-x-3">
                  <img
                    src={settings.favicon}
                    alt="Favicon"
                    className="w-8 h-8 object-contain bg-gray-50 rounded border border-gray-200"
                  />
                  <span className="text-sm text-gray-600">favicon.ico</span>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, favicon: undefined }))}
                    className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 ml-auto"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <LinkIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-2">Upload favicon (16x16 or 32x32)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'favicon')
                  }}
                  className="hidden"
                  id="favicon-upload"
                />
                <label
                  htmlFor="favicon-upload"
                  className="inline-flex items-center px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 cursor-pointer"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  {faviconUploading ? 'Uploading...' : 'Choose'}
                </label>
              </div>
            )}
          </div>

          {/* OG Image Upload */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Share Image (OG)</h3>
            
            {settings.ogImage ? (
              <div className="relative">
                <img
                  src={settings.ogImage}
                  alt="Open Graph image"
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  onClick={() => setSettings(prev => ({ ...prev, ogImage: undefined }))}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600 mb-2">1200x630 recommended</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file, 'ogImage')
                  }}
                  className="hidden"
                  id="og-upload"
                />
                <label
                  htmlFor="og-upload"
                  className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 cursor-pointer"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  {ogImageUploading ? 'Uploading...' : 'Choose'}
                </label>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Used when your store is shared on social media
            </p>
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
              {settings.canonicalUrl && (
                <div className="text-xs text-blue-600">
                  Canonical: {settings.canonicalUrl}
                </div>
              )}
            </div>
          </div>

          {/* Help & Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">SEO Tips:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Use descriptive titles (50-60 characters)</li>
                  <li>• Write compelling meta descriptions</li>
                  <li>• Include location-based keywords</li>
                  <li>• Upload high-quality images</li>
                  <li>• Keep your address accurate and complete</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}