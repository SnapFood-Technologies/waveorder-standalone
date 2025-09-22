import React, { useState, useEffect, useRef } from 'react'
import { User, Phone, Mail, MapPin, Tag, FileText, Save, ArrowLeft, Info, AlertCircle, CheckCircle, Globe, Wallet, X } from 'lucide-react'

interface CustomerFormProps {
  businessId: string
  customerId?: string // For edit mode
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
  country?: string
}

interface SuccessMessage {
  type: 'create' | 'update'
  customerName: string
}

// Fixed Country configurations with correct patterns
const COUNTRY_CONFIGS = {
  AL: {
    prefix: '+355',
    placeholder: '68 123 4567',
    pattern: /^(\+355|355)0?[6-9]\d{8}$/,
    flag: '🇦🇱',
    name: 'Albania',
    allowedAddressCountries: ['al'],
    format: (num: string) => {
      const clean = num.replace(/\D/g, '')
      if (clean.length >= 8) {
        return clean.replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3')
      }
      return clean
    }
  },
  US: {
    prefix: '+1',
    placeholder: '(555) 123-4567',
    pattern: /^(\+1|1)[2-9]\d{9}$/,
    flag: '🇺🇸',
    name: 'United States',
    allowedAddressCountries: ['us'],
    format: (num: string) => {
      const clean = num.replace(/\D/g, '')
      if (clean.length >= 10) {
        return clean.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
      }
      return clean
    }
  },
  GR: {
    prefix: '+30',
    placeholder: '694 123 4567',
    pattern: /^(\+30|30)0?[2-9]\d{9}$/,
    flag: '🇬🇷',
    name: 'Greece',
    allowedAddressCountries: ['gr', 'al', 'it', 'us'],
    format: (num: string) => {
      const clean = num.replace(/\D/g, '')
      if (clean.length >= 10) {
        return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
      }
      return clean
    }
  },
  IT: {
    prefix: '+39',
    placeholder: '345 123 4567',
    pattern: /^(\+39|39)0?[3]\d{8,9}$/,
    flag: '🇮🇹',
    name: 'Italy',
    allowedAddressCountries: ['it'],
    format: (num: string) => {
      const clean = num.replace(/\D/g, '')
      if (clean.length >= 10) {
        return clean.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
      }
      return clean
    }
  }
}

const OTHER_COUNTRIES = [
  { code: 'FR', prefix: '+33', flag: '🇫🇷', name: 'France', placeholder: '6 12 34 56 78' },
  { code: 'DE', prefix: '+49', flag: '🇩🇪', name: 'Germany', placeholder: '151 12345678' },
  { code: 'ES', prefix: '+34', flag: '🇪🇸', name: 'Spain', placeholder: '612 345 678' },
  { code: 'UK', prefix: '+44', flag: '🇬🇧', name: 'United Kingdom', placeholder: '7700 900123' },
  { code: 'CA', prefix: '+1', flag: '🇨🇦', name: 'Canada', placeholder: '(555) 123-4567' },
]

// Country options for address
const ADDRESS_COUNTRIES = [
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' }
]

// Fixed country detection
function detectCountryFromBusiness(storeData: any): keyof typeof COUNTRY_CONFIGS | 'OTHER' {
  // PRIMARY: Check business coordinates
  if (storeData?.storeLatitude && storeData?.storeLongitude) {
    const lat = storeData.storeLatitude
    const lng = storeData.storeLongitude
    
    // Albania boundaries
    if (lat >= 39.6 && lat <= 42.7 && lng >= 19.3 && lng <= 21.1) return 'AL'
    // Greece boundaries 
    if (lat >= 34.8 && lat <= 41.8 && lng >= 19.3 && lng <= 28.2) return 'GR'
    // Italy boundaries
    if (lat >= 35.5 && lat <= 47.1 && lng >= 6.6 && lng <= 18.5) return 'IT'
    // US boundaries
    if (lat >= 24 && lat <= 71 && lng >= -180 && lng <= -66) return 'US'
  }
  
  // SECONDARY: Check WhatsApp number
  if (storeData?.whatsappNumber) {
    if (storeData.whatsappNumber.startsWith('+355')) return 'AL'
    if (storeData.whatsappNumber.startsWith('+30')) return 'GR'
    if (storeData.whatsappNumber.startsWith('+39')) return 'IT'
    if (storeData.whatsappNumber.startsWith('+1')) return 'US'
  }
  
  // TERTIARY: Browser/timezone detection
  if (typeof window !== 'undefined') {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (timezone === 'Europe/Tirane') return 'AL'
      if (timezone === 'Europe/Athens') return 'GR'
      if (timezone === 'Europe/Rome') return 'IT'
      if (timezone.includes('America/')) return 'US'
    } catch (error) {
      // Continue with other detection methods
    }
  }
  
  return 'US'
}

// Detect country from phone number prefix
function detectCountryFromPrefix(phoneValue: string): keyof typeof COUNTRY_CONFIGS | 'OTHER' {
  if (phoneValue.startsWith('+355')) return 'AL'
  if (phoneValue.startsWith('+30')) return 'GR'
  if (phoneValue.startsWith('+39')) return 'IT'
  if (phoneValue.startsWith('+1')) return 'US'
  
  // Without + prefix
  if (phoneValue.startsWith('355')) return 'AL'
  if (phoneValue.startsWith('30')) return 'GR'
  if (phoneValue.startsWith('39')) return 'IT'
  if (phoneValue.startsWith('1')) return 'US'
  
  return 'OTHER'
}

// Enhanced address parsing for Albanian and Greek formats
function parseAddressComponents(place: any): any {
  const addressComponents = place.address_components || []
  const parsedAddress = {
    street: '',
    city: '',
    zipCode: '',
    country: '',
    cleanStreet: '' // Clean street without city/country/zip
  }

  // Extract components
  addressComponents.forEach((component: any) => {
    const types = component.types
    
    if (types.includes('street_number') || types.includes('route')) {
      if (types.includes('street_number')) {
        parsedAddress.street = component.long_name + ' ' + parsedAddress.street
      } else if (types.includes('route')) {
        parsedAddress.street = parsedAddress.street + component.long_name
      }
    }
    
    if (types.includes('locality') || types.includes('administrative_area_level_2')) {
      parsedAddress.city = component.long_name
    }
    
    if (types.includes('postal_code')) {
      parsedAddress.zipCode = component.long_name
    }
    
    if (types.includes('country')) {
      parsedAddress.country = component.short_name?.toLowerCase() || component.long_name
    }
  })

  // Enhanced parsing for Albanian/Greek addresses
  const formattedAddress = place.formatted_address
  
  // If no street found in components, extract from formatted address
  if (!parsedAddress.street.trim() && formattedAddress) {
    const addressParts = formattedAddress.split(',').map((part: string) => part.trim())
    if (addressParts.length > 0) {
      parsedAddress.street = addressParts[0]
    }
  }

  // Enhanced ZIP code extraction for Albanian/Greek formats
  if (!parsedAddress.zipCode && formattedAddress) {
    // Albanian format: "Rruga Sami Frashëri 1001, Tiranë, Albania"
    // Greek format: "Aggeletopoulou, Dafni 172 34, Greece"
    
    const zipMatches = formattedAddress.match(/\b\d{3,5}\s?\d{0,2}\b/g)
    if (zipMatches) {
      // Get the last numeric sequence (most likely to be postal code)
      const lastMatch = zipMatches[zipMatches.length - 1]
      parsedAddress.zipCode = lastMatch.replace(/\s+/g, ' ').trim()
    }
  }

  // Enhanced city extraction
  if (!parsedAddress.city && formattedAddress) {
    const addressParts = formattedAddress.split(',').map((part: string) => part.trim())
    
    // For Albanian: Usually second part contains city
    // For Greek: City is often before the postal code
    if (addressParts.length >= 2) {
      let cityPart = addressParts[1]
      
      // Remove postal code from city part if present
      cityPart = cityPart.replace(/\b\d{3,5}\s?\d{0,2}\b/g, '').trim()
      
      if (cityPart) {
        parsedAddress.city = cityPart
      }
    }
  }

  // Create clean street address (just the street part, no city/zip/country)
  if (formattedAddress) {
    const addressParts = formattedAddress.split(',').map((part: string) => part.trim())
    // First part is usually just the street
    parsedAddress.cleanStreet = addressParts[0] || parsedAddress.street
    
    // Remove any postal codes that might be in the street part
    parsedAddress.cleanStreet = parsedAddress.cleanStreet.replace(/\b\d{3,5}\s?\d{0,2}\b/g, '').trim()
  } else {
    parsedAddress.cleanStreet = parsedAddress.street
  }

  return parsedAddress
}

// Fixed Phone Input Component
function PhoneInput({ value, onChange, storeData, error, onErrorChange }: {
  value: string
  onChange: (phone: string) => void
  storeData: any
  error?: string
  onErrorChange?: (field: string, error: string | undefined) => void
}) {
  const [selectedCountry, setSelectedCountry] = useState<keyof typeof COUNTRY_CONFIGS | 'OTHER'>('US')
  const [showDropdown, setShowDropdown] = useState(false)
  const [isValid, setIsValid] = useState(true)
  const [hasUserInput, setHasUserInput] = useState(false)

  // Initial setup
  useEffect(() => {
    if (!value || value.trim() === '') {
      const detected = detectCountryFromBusiness(storeData)
      setSelectedCountry(detected)
      if (detected !== 'OTHER' && detected in COUNTRY_CONFIGS) {
        onChange(COUNTRY_CONFIGS[detected].prefix + ' ')
      }
    } else {
      // If value exists (edit mode), detect country from the phone number
      const detectedFromPhone = detectCountryFromPrefix(value)
      if (detectedFromPhone !== 'OTHER') {
        setSelectedCountry(detectedFromPhone)
      } else {
        // Fallback to business detection if phone detection fails
        const detectedFromBusiness = detectCountryFromBusiness(storeData)
        setSelectedCountry(detectedFromBusiness)
      }
    }
  }, [storeData, onChange, value])

  // Dynamic country detection based on user input
  useEffect(() => {
    if (value && hasUserInput) {
      const detectedCountry = detectCountryFromPrefix(value)
      if (detectedCountry !== 'OTHER') {
        setSelectedCountry(detectedCountry)
      }
    }
  }, [value, hasUserInput])

  // Fixed validation
  useEffect(() => {
    if (value && selectedCountry !== 'OTHER' && selectedCountry in COUNTRY_CONFIGS) {
      const config = COUNTRY_CONFIGS[selectedCountry]
      
      // Check if user has actual input beyond prefix
      const hasActualInput = value.length > config.prefix.length + 1
      
      if (hasActualInput) {
        const cleanPhone = value.replace(/[^\d+]/g, '')
        const isValidPhone = config.pattern.test(cleanPhone)
        setIsValid(isValidPhone)
      } else {
        setIsValid(true)
      }
    } else {
      setIsValid(true)
    }
  }, [value, selectedCountry])

  const handleCountrySelect = (countryCode: string, prefix: string) => {
    setSelectedCountry(countryCode as any)
    setHasUserInput(true)
    onChange(prefix + ' ')
    setShowDropdown(false)
    // Clear error when user starts interacting
    if (onErrorChange) onErrorChange('phone', undefined)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasUserInput(true)
    onChange(e.target.value)
    // Clear error when user starts typing
    if (onErrorChange) onErrorChange('phone', undefined)
  }

  const getPlaceholder = () => {
    if (selectedCountry !== 'OTHER' && selectedCountry in COUNTRY_CONFIGS) {
      return COUNTRY_CONFIGS[selectedCountry].placeholder
    }
    const otherCountry = OTHER_COUNTRIES.find(c => c.code === selectedCountry)
    return otherCountry?.placeholder || 'Enter phone number'
  }

  const getFlag = () => {
    if (selectedCountry !== 'OTHER' && selectedCountry in COUNTRY_CONFIGS) {
      return COUNTRY_CONFIGS[selectedCountry].flag
    }
    const otherCountry = OTHER_COUNTRIES.find(c => c.code === selectedCountry)
    return otherCountry?.flag || '🌍'
  }

  const getValidationMessage = () => {
    if (selectedCountry !== 'OTHER' && selectedCountry in COUNTRY_CONFIGS) {
      return `Please enter a valid ${COUNTRY_CONFIGS[selectedCountry].name} phone number`
    }
    return 'Please enter a valid phone number'
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
          onChange={handleInputChange}
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
      {!error && !isValid && value.length > 5 && (
        <p className="text-red-600 text-sm mt-1">
          {getValidationMessage()}
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
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      setIsLoaded(true)
      return
    }

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

// Enhanced Address Input with auto-parsing
function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  required, 
  onLocationChange,
  onAddressParsed,
  storeData,
  error,
  onErrorChange
}: {
  value: string
  onChange: (address: string) => void
  placeholder: string
  required: boolean
  onLocationChange?: (lat: number, lng: number, address: string) => void
  onAddressParsed?: (parsedAddress: any) => void
  storeData?: any
  error?: string
  onErrorChange?: (field: string, error: string | undefined) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { isLoaded } = useGooglePlaces()
  const [isCalculatingFee, setIsCalculatingFee] = useState(false)
  
  const getAllowedCountries = () => {
    const detectedCountry = detectCountryFromBusiness(storeData)
    
    switch (detectedCountry) {
      case 'AL':
        return ['al']
      case 'US':
        return ['us']
      case 'GR':
        return ['gr', 'al', 'it', 'us']
      case 'IT':
        return ['it']
      default:
        return ['us']
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
          
          // Enhanced address parsing
          const parsedAddress = parseAddressComponents(place)

          // Update the input value
          onChange(place.formatted_address)
          
          // Call parsing callback
          if (onAddressParsed) {
            onAddressParsed(parsedAddress)
          }
          
          // Call location change callback
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
  }, [isLoaded, onChange, onLocationChange, onAddressParsed, storeData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    // Clear error when user starts typing
    if (onErrorChange) onErrorChange('street', undefined)
  }

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
          onChange={handleInputChange}
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

export default function CustomerForm({ businessId, customerId, onSuccess, onCancel }: CustomerFormProps) {
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
      country: 'US'
    },
    tags: [],
    notes: '',
    addedByAdmin: true
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!!customerId)
  const [currentTag, setCurrentTag] = useState('')
  const [storeData, setStoreData] = useState<any>({})
  const [successMessage, setSuccessMessage] = useState<SuccessMessage | null>(null)

  const isEditMode = !!customerId

  // Function to clear specific field errors
  const clearFieldError = (field: string, error: string | undefined) => {
    if (!error) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as keyof ValidationErrors]
        return newErrors
      })
    }
  }

  // Load existing customer data for edit mode
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!customerId) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/admin/stores/${businessId}/customers/${customerId}`)
        if (response.ok) {
          const data = await response.json()
          const customer = data.customer
          
          setFormData({
            name: customer.name || '',
            phone: customer.phone || '',
            email: customer.email || '',
            tier: customer.tier || 'REGULAR',
            addressJson: customer.addressJson || {
              street: '',
              additional: '',
              zipCode: '',
              city: '',
              country: 'US'
            },
            tags: customer.tags || [],
            notes: customer.notes || '',
            addedByAdmin: customer.addedByAdmin || true
          })
        } else {
          setErrors({ name: 'Failed to load customer data' })
        }
      } catch (error) {
        setErrors({ name: 'Network error loading customer data' })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchCustomerData()
  }, [businessId, customerId])

  useEffect(() => {
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
    } else {
      // Validate phone based on detected country
      const detectedCountry = detectCountryFromPrefix(formData.phone)
      if (detectedCountry !== 'OTHER' && detectedCountry in COUNTRY_CONFIGS) {
        const config = COUNTRY_CONFIGS[detectedCountry]
        const cleanPhone = formData.phone.replace(/[^\d+]/g, '')
        if (!config.pattern.test(cleanPhone)) {
          newErrors.phone = `Please enter a valid ${config.name} phone number`
        }
      }
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
      if (!formData.addressJson.country.trim()) {
        newErrors.country = 'Country is required when address is provided'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setErrors({})
    
    try {
      const url = isEditMode 
        ? `/api/admin/stores/${businessId}/customers/${customerId}`
        : `/api/admin/stores/${businessId}/customers`
      
      const method = isEditMode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
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
        // Show success message
        setSuccessMessage({
          type: isEditMode ? 'update' : 'create',
          customerName: formData.name.trim()
        })

        // Hide success message after 5 seconds and call onSuccess
        setTimeout(() => {
          setSuccessMessage(null)
          onSuccess?.()
        }, 3000)
      } else {
        const data = await response.json()
        if (data.message?.includes('phone')) {
          setErrors({ phone: 'A customer with this phone number already exists' })
        } else {
          setErrors({ name: data.message || `Failed to ${isEditMode ? 'update' : 'create'} customer` })
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

  const handleAddressParsed = (parsedAddress: any) => {
    setFormData(prev => ({
      ...prev,
      addressJson: {
        ...prev.addressJson,
        city: parsedAddress.city || prev.addressJson.city,
        zipCode: parsedAddress.zipCode || prev.addressJson.zipCode,
        country: parsedAddress.country ? parsedAddress.country.toUpperCase() : prev.addressJson.country
      }
    }))
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  Customer {successMessage.type === 'create' ? 'Created' : 'Updated'} Successfully
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {successMessage.customerName} has been {successMessage.type === 'create' ? 'added to' : 'updated in'} your customer database
                </p>
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
                  <h1 className="text-xl font-semibold text-gray-900">
                    {isEditMode ? 'Edit Customer' : 'Add New Customer'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {isEditMode 
                      ? 'Update customer profile information'
                      : 'Create a new customer profile for your store'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
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
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, name: e.target.value }))
                        clearFieldError('name', undefined)
                      }}
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
                      onErrorChange={clearFieldError}
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
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, email: e.target.value }))
                          clearFieldError('email', undefined)
                        }}
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
                      onErrorChange={clearFieldError}
                      onLocationChange={(lat, lng, address) => {
                        setFormData(prev => ({
                          ...prev,
                          addressJson: {
                            ...prev.addressJson,
                            latitude: lat,
                            longitude: lng
                          }
                        }))
                      }}
                      onAddressParsed={handleAddressParsed}
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
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          addressJson: { ...prev.addressJson, city: e.target.value }
                        }))
                        clearFieldError('city', undefined)
                      }}
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
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          addressJson: { ...prev.addressJson, zipCode: e.target.value }
                        }))
                        clearFieldError('zipCode', undefined)
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.zipCode ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="12345"
                    />
                    {errors.zipCode && <p className="text-red-600 text-sm mt-1">{errors.zipCode}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <select
                      value={formData.addressJson.country}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          addressJson: { ...prev.addressJson, country: e.target.value }
                        }))
                        clearFieldError('country', undefined)
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                        errors.country ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      {ADDRESS_COUNTRIES.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.name}
                        </option>
                      ))}
                    </select>
                    {errors.country && <p className="text-red-600 text-sm mt-1">{errors.country}</p>}
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
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting 
                    ? (isEditMode ? 'Updating...' : 'Creating...') 
                    : (isEditMode ? 'Update Customer' : 'Create Customer')
                  }
                </button>
              </div>
            </form>
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
                  <Wallet className="w-4 h-4 mr-2 text-emerald-600" />
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
                  {isEditMode ? 'After Updating Customer:' : 'After Creating Customer:'}
                </h4>
                <ul className="space-y-1 text-xs text-teal-700">
                  <li>• {isEditMode ? 'Notify team of changes' : 'Send welcome message via WhatsApp'}</li>
                  <li>• {isEditMode ? 'Update any pending orders' : 'Create their first order if needed'}</li>
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