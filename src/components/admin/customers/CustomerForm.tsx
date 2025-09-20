import React, { useState, useEffect, useRef } from 'react'
import { User, Phone, Mail, MapPin, Tag, FileText, Save, ArrowLeft, Info, AlertCircle, CheckCircle, Globe, DollarSign } from 'lucide-react'

interface CustomerFormProps {
  businessId: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface CustomerFormData {
  name: string
  phone: string
  email: string
  tier: 'REGULAR' | 'VIP' | 'WHOLESALE'
  addressJson: {
    street: string
    additional: string
    zipCode: string
    city: string
    country: string
    latitude?: number
    longitude?: number
  }
  tags: string[]
  notes: string
  addedByAdmin: boolean
}

interface ValidationErrors {
  name?: string
  phone?: string
  email?: string
  street?: string
  city?: string
  zipCode?: string
}

// Country configurations
const COUNTRY_CONFIGS = {
  AL: {
    prefix: '+355',
    placeholder: '68 123 4567',
    pattern: /^(\+355|355)0?[6-9]\d{7}$/,
    flag: '🇦🇱',
    name: 'Albania',
    allowedAddressCountries: ['al']
  },
  US: {
    prefix: '+1',
    placeholder: '(555) 123-4567',
    pattern: /^(\+1|1)[2-9]\d{9}$/,
    flag: '🇺🇸',
    name: 'United States',
    allowedAddressCountries: ['us']
  },
  GR: {
    prefix: '+30',
    placeholder: '69 0865 4153',
    pattern: /^(\+30|30)0?[6-9]\d{8}$/,
    flag: '🇬🇷',
    name: 'Greece',
    allowedAddressCountries: ['gr', 'al', 'it', 'us']
  },
  IT: {
    prefix: '+39',
    placeholder: '345 123 4567',
    pattern: /^(\+39|39)0?[3]\d{8,9}$/,
    flag: '🇮🇹',
    name: 'Italy',
    allowedAddressCountries: ['it']
  }
}

const OTHER_COUNTRIES = [
  { code: 'FR', prefix: '+33', flag: '🇫🇷', name: 'France', placeholder: '6 12 34 56 78' },
  { code: 'DE', prefix: '+49', flag: '🇩🇪', name: 'Germany', placeholder: '151 12345678' },
  { code: 'ES', prefix: '+34', flag: '🇪🇸', name: 'Spain', placeholder: '612 345 678' },
  { code: 'UK', prefix: '+44', flag: '🇬🇧', name: 'United Kingdom', placeholder: '7700 900123' },
  { code: 'CA', prefix: '+1', flag: '🇨🇦', name: 'Canada', placeholder: '(555) 123-4567' },
]

// Detect country from business data
function detectCountryFromBusiness(storeData: any): keyof typeof COUNTRY_CONFIGS | 'OTHER' {
  if (typeof window !== 'undefined') {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone === 'Europe/Athens') return 'GR'
    if (timezone === 'Europe/Tirane') return 'AL'
    if (timezone === 'Europe/Rome') return 'IT'
    if (timezone.includes('America/')) return 'US'
  }
  
  if (storeData?.whatsappNumber) {
    if (storeData.whatsappNumber.startsWith('+355')) return 'AL'
    if (storeData.whatsappNumber.startsWith('+30')) return 'GR'
    if (storeData.whatsappNumber.startsWith('+39')) return 'IT'
    if (storeData.whatsappNumber.startsWith('+1')) return 'US'
  }
  
  return 'US'
}

// Phone Input Component
function PhoneInput({ value, onChange, storeData, error }: {
  value: string
  onChange: (phone: string) => void
  storeData: any
  error?: string
}) {
  const [selectedCountry, setSelectedCountry] = useState<string>('US')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    const detected = detectCountryFromBusiness(storeData)
    if (detected !== 'OTHER') {
      setSelectedCountry(detected)
      if (!value) {
        onChange(COUNTRY_CONFIGS[detected].prefix + ' ')
      }
    }
  }, [storeData])

  useEffect(() => {
    if (value && selectedCountry in COUNTRY_CONFIGS) {
      const config = COUNTRY_CONFIGS[selectedCountry as keyof typeof COUNTRY_CONFIGS]
      
      // Only validate if user has input beyond the prefix
      const hasActualInput = value.length > config.prefix.length + 1
      
      if (hasActualInput) {
        const cleanPhone = value.replace(/[^\d+]/g, '')
        const isValidPhone = config.pattern.test(cleanPhone)
        setIsValid(isValidPhone)
      } else {
        setIsValid(true)
      }
    }
  }, [value, selectedCountry])

  const handleCountrySelect = (countryCode: string, prefix: string) => {
    setSelectedCountry(countryCode)
    onChange(prefix + ' ')
    setShowDropdown(false)
  }

  const getPlaceholder = () => {
    if (selectedCountry in COUNTRY_CONFIGS) {
      return COUNTRY_CONFIGS[selectedCountry as keyof typeof COUNTRY_CONFIGS].placeholder
    }
    const otherCountry = OTHER_COUNTRIES.find(c => c.code === selectedCountry)
    return otherCountry?.placeholder || 'Enter phone number'
  }

  const getFlag = () => {
    if (selectedCountry in COUNTRY_CONFIGS) {
      return COUNTRY_CONFIGS[selectedCountry as keyof typeof COUNTRY_CONFIGS].flag
    }
    const otherCountry = OTHER_COUNTRIES.find(c => c.code === selectedCountry)
    return otherCountry?.flag || '🌍'
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Phone Number *
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 z-10"
        >
          <span className="text-lg">{getFlag()}</span>
          <Phone className="w-4 h-4 text-gray-400" />
        </button>
        
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full pl-16 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
            error || (!isValid && value.length > 5) ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={getPlaceholder()}
        />

        {showDropdown && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 mt-1 max-h-60 overflow-y-auto">
            <div className="p-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase">Primary Countries</p>
            </div>
            {Object.entries(COUNTRY_CONFIGS).map(([code, config]) => (
              <button
                key={code}
                type="button"
                onClick={() => handleCountrySelect(code, config.prefix)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3"
              >
                <span className="text-lg">{config.flag}</span>
                <span className="text-sm text-gray-600">{config.prefix}</span>
                <span className="text-sm text-gray-900">{config.name}</span>
              </button>
            ))}
            
            <div className="p-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase">Other Countries</p>
            </div>
            {OTHER_COUNTRIES.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => handleCountrySelect(country.code, country.prefix)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3"
              >
                <span className="text-lg">{country.flag}</span>
                <span className="text-sm text-gray-600">{country.prefix}</span>
                <span className="text-sm text-gray-900">{country.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      {!isValid && value.length > 5 && !error && (
        <p className="text-red-600 text-sm mt-1">
          Please enter a valid phone number for {COUNTRY_CONFIGS[selectedCountry as keyof typeof COUNTRY_CONFIGS]?.name || 'this country'}
        </p>
      )}
      
      <p className="text-gray-500 text-xs mt-1">
        Include country code. Used for order notifications via WhatsApp.
      </p>
    </div>
  )
}

// Google Places Hook
function useGooglePlaces() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      setIsLoaded(true)
      return
    }

    // Load Google Maps API if not already loaded
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  return { isLoaded }
}

// Enhanced Address Input with Google Places Autocomplete
function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  required, 
  onLocationChange,
  storeData,
  error
}: {
  value: string
  onChange: (address: string) => void
  placeholder: string
  required: boolean
  onLocationChange?: (lat: number, lng: number, address: string) => void
  storeData?: any
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { isLoaded } = useGooglePlaces()
  const [isCalculatingFee, setIsCalculatingFee] = useState(false)
  
  // Get allowed countries based on business detection
  const getAllowedCountries = () => {
    const detectedCountry = detectCountryFromBusiness(storeData)
    
    switch (detectedCountry) {
      case 'AL':
        return ['al'] // Albania business - only Albania addresses
      case 'US':
        return ['us'] // US business - only US addresses
      case 'GR':
        return ['gr', 'al', 'it', 'us'] // Greece business - 4 countries
      case 'IT':
        return ['it'] // Italy business - only Italy addresses
      default:
        return ['us'] // Default fallback
    }
  }
  
  useEffect(() => {
    if (isLoaded && inputRef.current) {
      const allowedCountries = getAllowedCountries()
      
      // @ts-ignore
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { 
          country: allowedCountries
        }
      })
      
      autocomplete.addListener('place_changed', async () => {
        const place = autocomplete.getPlace()
        
        if (place.formatted_address && place.geometry?.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          
          // Update the input value first
          onChange(place.formatted_address)
          
          // Then trigger location change if callback provided
          if (onLocationChange) {
            setIsCalculatingFee(true)
            try {
              await new Promise(resolve => setTimeout(resolve, 500))
              onLocationChange(lat, lng, place.formatted_address)
            } finally {
              setIsCalculatingFee(false)
            }
          }
        }
      })
    }
  }, [isLoaded, onChange, onLocationChange, storeData])

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Street Address
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={placeholder}
        />
        {isCalculatingFee && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"></div>
          </div>
        )}
      </div>
      
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      
      <p className="text-gray-500 text-xs mt-1">
        {isLoaded 
          ? 'Start typing for address suggestions'
          : 'Loading address autocomplete...'
        }
      </p>
    </div>
  )
}

export default function CustomerForm({ businessId, onSuccess, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    tier: 'REGULAR',
    addressJson: {
      street: '',
      additional: '',
      zipCode: '',
      city: '',
      country: 'USA'
    },
    tags: [],
    notes: '',
    addedByAdmin: true
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTag, setCurrentTag] = useState('')
  const [storeData, setStoreData] = useState<any>({})

  useEffect(() => {
    // Fetch store data for country detection
    const fetchStoreData = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setStoreData(data.business)
        }
      } catch (error) {
        console.error('Error fetching store data:', error)
      }
    }
    
    fetchStoreData()
  }, [businessId])

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.addressJson.street.trim()) {
      if (!formData.addressJson.city.trim()) {
        newErrors.city = 'City is required when address is provided'
      }
      if (!formData.addressJson.zipCode.trim()) {
        newErrors.zipCode = 'ZIP code is required when address is provided'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          addressJson: formData.addressJson.street.trim() ? formData.addressJson : null
        }),
      })

      if (response.ok) {
        onSuccess?.()
      } else {
        const data = await response.json()
        if (data.message?.includes('phone')) {
          setErrors({ phone: 'A customer with this phone number already exists' })
        } else {
          setErrors({ name: data.message || 'Failed to create customer' })
        }
      }
    } catch (error) {
      setErrors({ name: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim().toLowerCase()]
      }))
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const detectedCountry = detectCountryFromBusiness(storeData)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form - 3/4 width */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Add New Customer</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Create a new customer profile for your store
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 space-y-8">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-teal-600" />
                  Basic Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter customer's full name"
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                      storeData={storeData}
                      error={errors.phone}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="customer@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      Optional - for order confirmations and marketing
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Tier
                    </label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value as any }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="REGULAR">Regular Customer</option>
                      <option value="VIP">VIP Customer</option>
                      <option value="WHOLESALE">Wholesale Customer</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Tier affects pricing and special offers
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-teal-600" />
                  Address Information
                  <div className="ml-2 group relative">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Address is optional but helps with delivery orders
                    </div>
                  </div>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <AddressAutocomplete
                      value={formData.addressJson.street}
                      onChange={(street) => setFormData(prev => ({
                        ...prev,
                        addressJson: { ...prev.addressJson, street }
                      }))}
                      placeholder="Start typing street address..."
                      required={false}
                      storeData={storeData}
                      error={errors.street}
                      onLocationChange={(lat, lng, address) => {
                        // Update coordinates when address is selected
                        setFormData(prev => ({
                          ...prev,
                          addressJson: {
                            ...prev.addressJson,
                            latitude: lat,
                            longitude: lng
                          }
                        }))
                      }}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Details
                    </label>
                    <input
                      type="text"
                      value={formData.addressJson.additional}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        addressJson: { ...prev.addressJson, additional: e.target.value }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.addressJson.city}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        addressJson: { ...prev.addressJson, city: e.target.value }
                      }))}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter city"
                    />
                    {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.addressJson.zipCode}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        addressJson: { ...prev.addressJson, zipCode: e.target.value }
                      }))}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.zipCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="12345"
                    />
                    {errors.zipCode && <p className="text-red-600 text-sm mt-1">{errors.zipCode}</p>}
                  </div>
                </div>
              </div>

              {/* Tags and Notes */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-teal-600" />
                  Additional Information
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-teal-600 hover:text-teal-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        placeholder="Add tags like 'vip', 'frequent', 'wholesale'..."
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Add any special notes about this customer..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Internal notes - not visible to customer
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    handleSubmit(e as any)
                  }}
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? 'Creating...' : 'Create Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Informative Notes - 1/4 width */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-0">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-600" />
              Customer Tips
            </h3>

            <div className="space-y-6">
              {/* Customer Management Tips */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2 text-green-600" />
                  Smart Organization
                </h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Use tags to categorize customers:</p>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                      <span className="text-xs">frequent, loyalty, corporate</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-3 h-3 mr-2 text-blue-500" />
                      <span className="text-xs">allergies, dietary-restrictions</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-3 h-3 mr-2 text-purple-500" />
                      <span className="text-xs">event-planner, bulk-orders</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Impact */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-emerald-600" />
                  Revenue Impact
                </h4>
                <div className="bg-emerald-50 p-3 rounded text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Regular customers:</span>
                      <span className="font-medium">2-3x orders/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">VIP customers:</span>
                      <span className="font-medium">5-8x orders/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Repeat rate:</span>
                      <span className="font-medium text-emerald-600">+40% revenue</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Communication Best Practices */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-blue-600" />
                  Communication
                </h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li>• WhatsApp preferred for order updates</li>
                  <li>• Email for receipts and promotions</li>
                  <li>• Address enables delivery fee calculation</li>
                  <li>• Notes help staff provide better service</li>
                </ul>
              </div>

              {/* Customer Lifecycle */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-orange-600" />
                  Customer Journey
                </h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="border-l-2 border-gray-200 pl-3">
                    <div className="font-medium text-gray-700">New Customer</div>
                    <div>First order - focus on experience</div>
                  </div>
                  <div className="border-l-2 border-blue-200 pl-3">
                    <div className="font-medium text-blue-700">Regular Customer</div>
                    <div>2-5 orders - build relationship</div>
                  </div>
                  <div className="border-l-2 border-purple-200 pl-3">
                    <div className="font-medium text-purple-700">VIP Customer</div>
                    <div>5+ orders - special treatment</div>
                  </div>
                </div>
              </div>

              {/* Data Security */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-800 mb-1 flex items-center">
                  <Globe className="w-3 h-3 mr-1" />
                  Data & Privacy
                </h4>
                <p className="text-xs text-gray-600">
                  All customer information is encrypted and stored securely. 
                  Phone numbers are used only for order communication via WhatsApp.
                </p>
              </div>

              {/* Action Items */}
              <div className="bg-teal-50 p-3 rounded-lg">
                <h4 className="text-xs font-semibold text-teal-800 mb-2">
                  After Creating Customer:
                </h4>
                <ul className="space-y-1 text-xs text-teal-700">
                  <li>• Send welcome message via WhatsApp</li>
                  <li>• Create their first order if needed</li>
                  <li>• Add relevant tags based on preferences</li>
                  <li>• Set up any special pricing if VIP</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}