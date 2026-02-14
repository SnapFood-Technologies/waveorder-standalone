// src/components/admin/stores/QuickCreateStoreModal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Store,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  MapPin,
  Phone,
  Globe,
  Truck,
  Target,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Apple,
  Scissors,
  Gem,
  Flower2,
  MoreHorizontal,
  DollarSign,
  Euro,
  Banknote,
  Building2,
  User,
  CheckCircle
} from 'lucide-react'

interface QuickCreateStoreModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  // Step 1: Basic Info
  storeName: string
  slug: string
  businessType: string
  // Step 2: Contact & Location
  whatsappNumber: string
  phonePrefix: string
  address: string
  country: string
  storeLatitude?: number
  storeLongitude?: number
  // Step 3: Regional Settings
  currency: string
  language: string
  timezone: string
  // Step 4: Delivery Settings
  deliveryEnabled: boolean
  pickupEnabled: boolean
  deliveryFee: string
  deliveryRadius: string
  estimatedDeliveryTime: string
  estimatedPickupTime: string
  // Step 5: Business Goals
  businessGoals: string[]
}

const businessTypes = [
  { value: 'RESTAURANT', label: 'Restaurant', icon: UtensilsCrossed },
  { value: 'CAFE', label: 'Cafe', icon: Coffee },
  { value: 'RETAIL', label: 'Retail & Shopping', icon: ShoppingBag },
  { value: 'GROCERY', label: 'Grocery & Supermarket', icon: Apple },
  { value: 'SALON', label: 'Salon & Beauty', icon: Scissors },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal }
]

const phonePrefixes = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States', placeholder: '(555) 123-4567' },
  { code: '+30', country: 'GR', flag: '🇬🇷', name: 'Greece', placeholder: '694 123 4567' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy', placeholder: '345 123 4567' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain', placeholder: '612 345 678' },
  { code: '+355', country: 'AL', flag: '🇦🇱', name: 'Albania', placeholder: '68 123 4567' }
]

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', icon: DollarSign },
  { code: 'EUR', name: 'Euro', symbol: '€', icon: Euro },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', icon: Banknote },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', icon: Banknote },
  { code: 'GBP', name: 'British Pound', symbol: '£', icon: Banknote },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$', icon: Banknote }
]

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' }
]

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (LA)' },
  { value: 'America/Barbados', label: 'Barbados' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Rome', label: 'Rome' },
  { value: 'Europe/Athens', label: 'Athens' },
  { value: 'Europe/Madrid', label: 'Madrid' },
  { value: 'Europe/Tirane', label: 'Tirana' },
  { value: 'Asia/Bahrain', label: 'Bahrain (GMT+3)' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)' }
]

const businessGoalOptions = [
  { id: 'ACCEPT_WHATSAPP_ORDERS', name: 'Accept WhatsApp Orders', icon: Phone },
  { id: 'MANAGE_PRODUCTS_INVENTORY', name: 'Manage Products & Inventory', icon: ShoppingBag },
  { id: 'TRACK_DELIVERY_PICKUP', name: 'Track Delivery & Pickup', icon: Truck },
  { id: 'BUILD_CUSTOMER_RELATIONSHIPS', name: 'Build Customer Relationships', icon: User },
  { id: 'TEAM_COLLABORATION', name: 'Team Collaboration', icon: Building2 }
]

function AddressAutocomplete({
  value,
  onChange,
  onCoordinatesChange,
  onCountryChange
}: {
  value: string
  onChange: (address: string) => void
  onCoordinatesChange: (lat: number, lng: number) => void
  onCountryChange?: (countryCode: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      setIsLoaded(true)
      return
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      const checkGoogle = () => {
        if ((window as any).google?.maps?.places) {
          setIsLoaded(true)
        } else {
          setTimeout(checkGoogle, 100)
        }
      }
      checkGoogle()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return

    const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
      types: ['address']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      
      if (place.formatted_address && place.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        
        onChange(place.formatted_address)
        onCoordinatesChange(lat, lng)
        
        if (onCountryChange && place.address_components) {
          const countryComponent = place.address_components.find(
            (comp: any) => comp.types.includes('country')
          )
          if (countryComponent?.short_name) {
            onCountryChange(countryComponent.short_name)
          }
        }
      }
    })
  }, [isLoaded, onChange, onCoordinatesChange, onCountryChange])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      placeholder="Enter business address"
    />
  )
}

export function QuickCreateStoreModal({ isOpen, onClose }: QuickCreateStoreModalProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [isOtherCountry, setIsOtherCountry] = useState(false)
  const [existingStoreDefaults, setExistingStoreDefaults] = useState<any>(null)

  const totalSteps = 5

  const [formData, setFormData] = useState<FormData>({
    storeName: '',
    slug: '',
    businessType: 'RETAIL',
    whatsappNumber: '',
    phonePrefix: '+1',
    address: '',
    country: '',
    currency: 'USD',
    language: 'en',
    timezone: 'America/New_York',
    deliveryEnabled: true,
    pickupEnabled: true,
    deliveryFee: '0',
    deliveryRadius: '10',
    estimatedDeliveryTime: '30-45 minutes',
    estimatedPickupTime: '15-20 minutes',
    businessGoals: ['ACCEPT_WHATSAPP_ORDERS']
  })

  // Fetch existing store defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchExistingStoreDefaults()
    }
  }, [isOpen])

  const fetchExistingStoreDefaults = async () => {
    try {
      const response = await fetch('/api/user/businesses')
      if (response.ok) {
        const data = await response.json()
        if (data.businesses?.[0]) {
          const firstBusiness = data.businesses[0]
          setExistingStoreDefaults(firstBusiness)
          
          // Pre-fill with defaults from existing store
          setFormData(prev => ({
            ...prev,
            currency: firstBusiness.currency || 'USD',
            language: firstBusiness.language || 'en',
            timezone: firstBusiness.timezone || 'America/New_York',
            phonePrefix: getPhonePrefixFromNumber(firstBusiness.whatsappNumber) || '+1'
          }))
        }
      }
    } catch (err) {
      console.error('Error fetching store defaults:', err)
    }
  }

  const getPhonePrefixFromNumber = (number: string): string => {
    if (!number) return '+1'
    for (const prefix of phonePrefixes) {
      if (number.startsWith(prefix.code)) {
        return prefix.code
      }
    }
    return '+1'
  }

  // Auto-generate slug from store name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({ ...prev, storeName: name }))
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50)
    setFormData(prev => ({ ...prev, slug: generatedSlug }))
    
    if (generatedSlug.length >= 3) {
      checkSlugAvailability(generatedSlug)
    }
  }

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null)
      return
    }
    
    setCheckingSlug(true)
    try {
      const response = await fetch('/api/setup/check-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      })
      const { available } = await response.json()
      setSlugAvailable(available)
    } catch (error) {
      setSlugAvailable(null)
    } finally {
      setCheckingSlug(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.storeName.trim() || !formData.slug.trim()) {
      setError('Please enter a store name')
      return
    }

    if (slugAvailable === false) {
      setError('This URL is already taken')
      return
    }

    try {
      setCreating(true)
      setError(null)

      // Build complete WhatsApp number
      const completeWhatsappNumber = isOtherCountry
        ? formData.whatsappNumber.trim()
        : formData.whatsappNumber.trim() 
          ? `${formData.phonePrefix}${formData.whatsappNumber.replace(/[^\d]/g, '')}`
          : ''

      // Use dedicated create-store API (matches SuperAdmin quality)
      const response = await fetch('/api/user/create-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: formData.storeName.trim(),
          slug: formData.slug.trim(),
          businessType: formData.businessType,
          whatsappNumber: completeWhatsappNumber,
          address: formData.address,
          country: formData.country,
          storeLatitude: formData.storeLatitude,
          storeLongitude: formData.storeLongitude,
          currency: formData.currency,
          language: formData.language,
          timezone: formData.timezone,
          deliveryEnabled: formData.deliveryEnabled,
          pickupEnabled: formData.pickupEnabled,
          deliveryFee: parseFloat(formData.deliveryFee) || 0,
          deliveryRadius: parseFloat(formData.deliveryRadius) || 10,
          estimatedDeliveryTime: formData.estimatedDeliveryTime,
          estimatedPickupTime: formData.estimatedPickupTime,
          paymentMethods: ['CASH'],
          businessGoals: formData.businessGoals
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create store')
      }

      const createData = await response.json()
      
      // Redirect to the new store's dashboard
      router.push(`/admin/stores/${createData.businessId}/dashboard`)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create store')
    } finally {
      setCreating(false)
    }
  }

  const canProceed = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.storeName.trim() && formData.slug.trim() && slugAvailable !== false)
      case 2:
        return !!(formData.whatsappNumber.trim() && formData.address.trim())
      case 3:
      case 4:
      case 5:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setFormData({
      storeName: '',
      slug: '',
      businessType: 'RETAIL',
      whatsappNumber: '',
      phonePrefix: existingStoreDefaults?.phonePrefix || '+1',
      address: '',
      country: '',
      currency: existingStoreDefaults?.currency || 'USD',
      language: existingStoreDefaults?.language || 'en',
      timezone: existingStoreDefaults?.timezone || 'America/New_York',
      deliveryEnabled: true,
      pickupEnabled: true,
      deliveryFee: '0',
      deliveryRadius: '10',
      estimatedDeliveryTime: '30-45 minutes',
      estimatedPickupTime: '15-20 minutes',
      businessGoals: ['ACCEPT_WHATSAPP_ORDERS']
    })
    setError(null)
    setSlugAvailable(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  const stepTitles = [
    'Basic Info',
    'Contact & Location',
    'Regional Settings',
    'Delivery Options',
    'Business Goals'
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Create New Store</h2>
                <p className="text-sm text-gray-500">Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex-1 h-1.5 rounded-full transition-colors ${
                  step < currentStep ? 'bg-teal-600' :
                  step === currentStep ? 'bg-teal-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="My Awesome Store"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store URL
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-gray-100 text-gray-500 text-sm rounded-l-lg border border-r-0 border-gray-200">
                    waveorder.app/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => {
                      const cleanSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                      setFormData(prev => ({ ...prev, slug: cleanSlug }))
                      if (cleanSlug.length >= 3) {
                        checkSlugAvailability(cleanSlug)
                      }
                    }}
                    placeholder="my-store"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                {formData.slug.length >= 3 && (
                  <div className="mt-1">
                    {checkingSlug ? (
                      <p className="text-sm text-gray-500 flex items-center">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Checking...
                      </p>
                    ) : slugAvailable === true ? (
                      <p className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Available
                      </p>
                    ) : slugAvailable === false ? (
                      <p className="text-sm text-red-600 flex items-center">
                        <X className="w-3 h-3 mr-1" />
                        Already taken
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {businessTypes.map((type) => {
                    const IconComponent = type.icon
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, businessType: type.value }))}
                        className={`p-3 border-2 rounded-lg text-center transition-all ${
                          formData.businessType === type.value
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-teal-300'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 mx-auto mb-1 ${
                          formData.businessType === type.value ? 'text-teal-600' : 'text-gray-500'
                        }`} />
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact & Location */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.phonePrefix}
                    onChange={(e) => {
                      const newPrefix = e.target.value
                      if (newPrefix === 'OTHER') {
                        setIsOtherCountry(true)
                        setFormData(prev => ({ ...prev, phonePrefix: 'OTHER', whatsappNumber: '' }))
                      } else {
                        setIsOtherCountry(false)
                        setFormData(prev => ({ ...prev, phonePrefix: newPrefix, whatsappNumber: '' }))
                      }
                    }}
                    className="w-28 border border-gray-300 rounded-lg px-2 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                  >
                    {phonePrefixes.map((prefix) => (
                      <option key={prefix.code} value={prefix.code}>
                        {prefix.flag} {prefix.code}
                      </option>
                    ))}
                    <option value="OTHER">🌍 Other</option>
                  </select>
                  <input
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => {
                      if (isOtherCountry) {
                        const cleanNumber = e.target.value.replace(/[^+\d\s-]/g, '')
                        setFormData(prev => ({ ...prev, whatsappNumber: cleanNumber }))
                      } else {
                        setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))
                      }
                    }}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                    placeholder={isOtherCountry ? "+55 11 987654321" : phonePrefixes.find(p => p.code === formData.phonePrefix)?.placeholder}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Customers will send orders to this number
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address *
                </label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(address) => setFormData(prev => ({ ...prev, address }))}
                  onCoordinatesChange={(lat, lng) => setFormData(prev => ({ 
                    ...prev, 
                    storeLatitude: lat, 
                    storeLongitude: lng 
                  }))}
                  onCountryChange={(countryCode) => setFormData(prev => ({ ...prev, country: countryCode }))}
                />
                {formData.storeLatitude && formData.storeLongitude && (
                  <p className="text-xs text-gray-400 mt-1">
                    📍 Location detected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select country</option>
                  <option value="AL">Albania</option>
                  <option value="BB">Barbados</option>
                  <option value="BH">Bahrain</option>
                  <option value="GR">Greece</option>
                  <option value="IT">Italy</option>
                  <option value="ES">Spain</option>
                  <option value="GB">United Kingdom</option>
                  <option value="US">USA</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Auto-detected from address</p>
              </div>
            </div>
          )}

          {/* Step 3: Regional Settings */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {currencies.map((currency) => {
                    const IconComponent = currency.icon
                    return (
                      <button
                        key={currency.code}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, currency: currency.code }))}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          formData.currency === currency.code
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-teal-300'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 mx-auto mb-1 ${
                          formData.currency === currency.code ? 'text-teal-600' : 'text-gray-500'
                        }`} />
                        <div className="text-sm font-medium">{currency.code}</div>
                        <div className="text-xs text-gray-500">{currency.symbol}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, language: language.code }))}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        formData.language === language.code
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-teal-300'
                      }`}
                    >
                      <span className="text-xl">{language.flag}</span>
                      <div className="text-xs font-medium mt-1">{language.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Delivery Options */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.deliveryEnabled ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, deliveryEnabled: !prev.deliveryEnabled }))}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Truck className={`w-5 h-5 ${formData.deliveryEnabled ? 'text-teal-600' : 'text-gray-400'}`} />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.deliveryEnabled ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                    }`}>
                      {formData.deliveryEnabled && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900">Delivery</h4>
                  <p className="text-xs text-gray-500">Orders delivered to customers</p>
                </div>

                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.pickupEnabled ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, pickupEnabled: !prev.pickupEnabled }))}
                >
                  <div className="flex items-center justify-between mb-2">
                    <MapPin className={`w-5 h-5 ${formData.pickupEnabled ? 'text-teal-600' : 'text-gray-400'}`} />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.pickupEnabled ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                    }`}>
                      {formData.pickupEnabled && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900">Pickup</h4>
                  <p className="text-xs text-gray-500">Customers collect from store</p>
                </div>
              </div>

              {formData.deliveryEnabled && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Delivery Settings</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Fee ({formData.currency})</label>
                      <input
                        type="number"
                        value={formData.deliveryFee}
                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryFee: e.target.value }))}
                        min="0"
                        step="0.01"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Radius (km)</label>
                      <input
                        type="number"
                        value={formData.deliveryRadius}
                        onChange={(e) => setFormData(prev => ({ ...prev, deliveryRadius: e.target.value }))}
                        min="1"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Estimated Time</label>
                    <input
                      type="text"
                      value={formData.estimatedDeliveryTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedDeliveryTime: e.target.value }))}
                      placeholder="30-45 minutes"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              {formData.pickupEnabled && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-xs text-gray-600 mb-1">Estimated Pickup Time</label>
                  <input
                    type="text"
                    value={formData.estimatedPickupTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedPickupTime: e.target.value }))}
                    placeholder="15-20 minutes"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}

              <p className="text-xs text-gray-500 text-center">
                You can change these settings later in store configuration
              </p>
            </div>
          )}

          {/* Step 5: Business Goals */}
          {currentStep === 5 && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                What do you want to achieve with this store? (Optional)
              </p>
              {businessGoalOptions.map((goal) => {
                const IconComponent = goal.icon
                const isSelected = formData.businessGoals.includes(goal.id)
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setFormData(prev => ({
                          ...prev,
                          businessGoals: prev.businessGoals.filter(g => g !== goal.id)
                        }))
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          businessGoals: [...prev.businessGoals, goal.id]
                        }))
                      }
                    }}
                    className={`w-full p-3 border-2 rounded-lg text-left transition-all flex items-center justify-between ${
                      isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-5 h-5 ${isSelected ? 'text-teal-600' : 'text-gray-500'}`} />
                      <span className="text-sm font-medium">{goal.name}</span>
                    </div>
                    {isSelected && <CheckCircle className="w-5 h-5 text-teal-600" />}
                  </button>
                )
              })}

              <div className="mt-6 bg-teal-50 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900">Ready to create!</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Click "Create Store" to set up <strong>{formData.storeName || 'your new store'}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex gap-3">
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!canProceed(currentStep)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === 1 && !canProceed(1) ? 'Enter store name' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Store
                  </>
                )}
              </button>
            )}
          </div>

          {/* Skip option for optional steps */}
          {(currentStep === 4 || currentStep === 5) && currentStep < totalSteps && (
            <button
              onClick={handleNext}
              className="w-full mt-2 text-center text-sm text-gray-500 hover:text-teal-600 transition-colors"
            >
              Skip this step →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
