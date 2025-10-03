// src/components/superadmin/CreateBusinessForm.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  DollarSign,
  Euro,
  Banknote,
  ChevronRight,
  ChevronLeft,
  Check,
  Truck,
  CreditCard,
  Target,
  Loader2,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Apple,
  Scissors,
  Gem,
  Flower2,
  MoreHorizontal,
  CheckCircle,
  Info,
  Zap,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react'

interface FormData {
  businessName: string
  businessType: string
  ownerName: string
  ownerEmail: string
  whatsappNumber: string
  phonePrefix: string
  address: string
  storeLatitude?: number
  storeLongitude?: number
  currency: string
  language: string
  timezone: string
  deliveryEnabled: boolean
  pickupEnabled: boolean
  deliveryFee: string
  deliveryRadius: string
  estimatedDeliveryTime: string
  estimatedPickupTime: string
  paymentMethods: string[]
  businessGoals: string[]
}

const businessTypes = [
  { value: 'RESTAURANT', label: 'Restaurant', icon: UtensilsCrossed },
  { value: 'CAFE', label: 'Cafe', icon: Coffee },
  { value: 'RETAIL', label: 'Retail & Shopping', icon: ShoppingBag },
  { value: 'GROCERY', label: 'Grocery & Supermarket', icon: Apple },
  { value: 'HEALTH_BEAUTY', label: 'Health & Beauty', icon: Scissors },
  { value: 'JEWELRY', label: 'Jewelry Store', icon: Gem },
  { value: 'FLORIST', label: 'Florist', icon: Flower2 },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal }
]

const phonePrefixes = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States', pattern: /^[2-9]\d{9}$/, placeholder: '(555) 123-4567' },
  { code: '+30', country: 'GR', flag: '🇬🇷', name: 'Greece', pattern: /^[2-9]\d{9}$/, placeholder: '694 123 4567' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy', pattern: /^[0-9]{9,10}$/, placeholder: '345 123 4567' },
  { code: '+355', country: 'AL', flag: '🇦🇱', name: 'Albania', pattern: /^[6-9]\d{8}$/, placeholder: '68 123 4567' }
]

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', icon: DollarSign },
  { code: 'EUR', name: 'Euro', symbol: '€', icon: Euro },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', icon: Banknote }
]

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'sq', name: 'Albanian', flag: '🇦🇱' },
  { code: 'el', name: 'Greek', flag: '🇬🇷' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' }
]

const paymentMethodOptions = [
  { id: 'CASH', name: 'Cash', description: 'Cash on delivery/pickup' }
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
  onCoordinatesChange
}: {
  value: string
  onChange: (address: string) => void
  onCoordinatesChange: (lat: number, lng: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // @ts-ignore
    if (window.google?.maps?.places) {
      setIsLoaded(true)
      return
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      const checkGoogle = () => {
        // @ts-ignore
        if (window.google?.maps?.places) {
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
    if (isLoaded && inputRef.current) {
      // @ts-ignore
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address']
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.formatted_address) {
          onChange(place.formatted_address)
          
          if (place.geometry?.location) {
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            onCoordinatesChange(lat, lng)
          }
        }
      })

      return () => {
        // @ts-ignore
        if (window.google?.maps?.event) {
          // @ts-ignore
          window.google.maps.event.clearInstanceListeners(autocomplete)
        }
      }
    }
  }, [isLoaded, onChange, onCoordinatesChange])

  return (
    <input
      ref={inputRef}
      type="text"
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      placeholder="Enter business address"
    />
  )
}

export function CreateBusinessForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    businessType: 'RESTAURANT',
    ownerName: '',
    ownerEmail: '',
    whatsappNumber: '',
    phonePrefix: '+1',
    address: '',
    currency: 'USD',
    language: 'en',
    timezone: 'America/New_York',
    deliveryEnabled: true,
    pickupEnabled: false,
    deliveryFee: '0',
    deliveryRadius: '10',
    estimatedDeliveryTime: '30-45 minutes',
    estimatedPickupTime: '15-20 minutes',
    paymentMethods: ['CASH'],
    businessGoals: []
  })

  const totalSteps = 6

  const validatePhoneNumber = (number: string, prefix: string): boolean => {
    const prefixData = phonePrefixes.find(p => p.code === prefix)
    if (!prefixData) return false
    
    const cleanNumber = number.replace(/[^\d]/g, '')
    return prefixData.pattern.test(cleanNumber)
  }

  useEffect(() => {
    if (formData.whatsappNumber && formData.phonePrefix) {
      const isValid = validatePhoneNumber(formData.whatsappNumber, formData.phonePrefix)
      const prefixData = phonePrefixes.find(p => p.code === formData.phonePrefix)
      
      if (!isValid && formData.whatsappNumber.length > 0) {
        setPhoneError(`Invalid ${prefixData?.name} phone number. Format: ${prefixData?.placeholder}`)
      } else {
        setPhoneError(null)
      }
    }
  }, [formData.whatsappNumber, formData.phonePrefix])

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

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const completeWhatsappNumber = `${formData.phonePrefix}${formData.whatsappNumber.replace(/[^\d]/g, '')}`

      const response = await fetch('/api/superadmin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessType: formData.businessType,
          ownerName: formData.ownerName,
          ownerEmail: formData.ownerEmail,
          whatsappNumber: completeWhatsappNumber,
          address: formData.address,
          storeLatitude: formData.storeLatitude,
          storeLongitude: formData.storeLongitude,
          currency: formData.currency,
          language: formData.language,
          timezone: formData.timezone,
          subscriptionPlan: 'FREE',
          deliveryEnabled: formData.deliveryEnabled,
          pickupEnabled: formData.pickupEnabled,
          deliveryFee: parseFloat(formData.deliveryFee),
          deliveryRadius: parseFloat(formData.deliveryRadius),
          estimatedDeliveryTime: formData.estimatedDeliveryTime,
          estimatedPickupTime: formData.estimatedPickupTime,
          paymentMethods: formData.paymentMethods,
          businessGoals: formData.businessGoals,
          sendEmail: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create business')
      }

      router.push('/superadmin/businesses?success=created')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business')
    } finally {
      setLoading(false)
    }
  }

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.businessName && formData.businessType && formData.ownerName && formData.ownerEmail)
      case 2:
        return !!(formData.whatsappNumber && formData.address && !phoneError)
      case 3:
        return !!(formData.currency && formData.language && formData.timezone)
      case 4:
      case 5:
      case 6:
        return true
      default:
        return false
    }
  }

  const getStepInfo = () => {
    switch (currentStep) {
      case 1:
        return {
          title: 'Business Foundation',
          description: 'Essential business details and owner information',
          tips: [
            'Choose a memorable business name',
            'Select the business type that best matches',
            'Owner email will receive setup instructions',
            'All fields with * are required'
          ]
        }
      case 2:
        return {
          title: 'Contact & Location',
          description: 'How customers will reach you',
          tips: [
            'WhatsApp number is used for orders',
            'Address helps with delivery zones',
            'Location enables accurate delivery fees',
            'Use your primary business contact'
          ]
        }
      case 3:
        return {
          title: 'Regional Setup',
          description: 'Currency, language, and timezone',
          tips: [
            'Currency affects pricing display',
            'Language sets interface defaults',
            'Timezone for business hours',
            'These can be changed later'
          ]
        }
      case 4:
        return {
          title: 'Delivery Options',
          description: 'Configure how orders reach customers',
          tips: [
            'Enable delivery, pickup, or both',
            'Set reasonable delivery radius',
            'Delivery fees can vary by zone',
            'Times help manage expectations'
          ]
        }
      case 5:
        return {
          title: 'Payment Setup',
          description: 'Choose payment methods',
          tips: [
            'Cash is enabled by default',
            'Online payments coming soon',
            'Stripe integration in development',
            'Multiple methods can be enabled'
          ]
        }
      case 6:
        return {
          title: 'Business Goals',
          description: 'What do you want to achieve?',
          tips: [
            'Select all that apply',
            'Helps customize experience',
            'Goals can be updated anytime',
            'Optional but recommended'
          ]
        }
    }
  }

  const stepInfo = getStepInfo()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-8xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Business</h1>
          <p className="text-gray-600">Set up a new business account on WaveOrder</p>
        </div>


        {/* Error Display */}
        {error && (
          <div className="mb-6 max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Main Content - 3/4 Form + 1/4 Info */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form Section - 3/4 width */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {/* Step Content */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Pizza Palace"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Type *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {businessTypes.map((type) => {
                            const IconComponent = type.icon
                            return (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, businessType: type.value })}
                                className={`p-3 border-2 rounded-lg text-left transition-all ${
                                  formData.businessType === type.value
                                    ? 'border-teal-500 bg-teal-50'
                                    : 'border-gray-200 hover:border-teal-300'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <IconComponent className={`w-5 h-5 ${
                                    formData.businessType === type.value ? 'text-teal-600' : 'text-gray-600'
                                  }`} />
                                  <span className="text-sm font-medium">{type.label}</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Owner Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.ownerName}
                            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="John Doe"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Owner Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.ownerEmail}
                            onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact & Location</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          WhatsApp Number *
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={formData.phonePrefix}
                            onChange={(e) => setFormData({ ...formData, phonePrefix: e.target.value })}
                            className="w-40 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          >
                            {phonePrefixes.map((prefix) => (
                              <option key={prefix.code} value={prefix.code}>
                                {prefix.flag} {prefix.code}
                              </option>
                            ))}
                          </select>
                          <input
                            type="tel"
                            required
                            value={formData.whatsappNumber}
                            onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                            className={`flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                              phoneError ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder={phonePrefixes.find(p => p.code === formData.phonePrefix)?.placeholder}
                          />
                        </div>
                        {phoneError && (
                          <p className="text-red-600 text-sm mt-1">{phoneError}</p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          Format: {phonePrefixes.find(p => p.code === formData.phonePrefix)?.placeholder}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Address *
                        </label>
                        <AddressAutocomplete
                          value={formData.address}
                          onChange={(address) => setFormData({ ...formData, address })}
                          onCoordinatesChange={(lat, lng) => setFormData({ 
                            ...formData, 
                            storeLatitude: lat, 
                            storeLongitude: lng 
                          })}
                        />
                        {formData.storeLatitude && formData.storeLongitude && (
                          <p className="text-xs text-gray-400 mt-1">
                            Coordinates: {formData.storeLatitude.toFixed(6)}, {formData.storeLongitude.toFixed(6)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Regional Settings</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency *
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {currencies.map((currency) => {
                            const IconComponent = currency.icon
                            return (
                              <button
                                key={currency.code}
                                type="button"
                                onClick={() => setFormData({ ...formData, currency: currency.code })}
                                className={`p-4 border-2 rounded-lg transition-all ${
                                  formData.currency === currency.code
                                    ? 'border-teal-500 bg-teal-50'
                                    : 'border-gray-200 hover:border-teal-300'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  <IconComponent className={`w-6 h-6 ${
                                    formData.currency === currency.code ? 'text-teal-600' : 'text-gray-600'
                                  }`} />
                                  <div className="text-left">
                                    <div className="font-semibold text-sm">{currency.code}</div>
                                    <div className="text-xs text-gray-600">{currency.name}</div>
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Language *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {languages.map((language) => (
                            <button
                              key={language.code}
                              type="button"
                              onClick={() => setFormData({ ...formData, language: language.code })}
                              className={`p-3 border-2 rounded-lg transition-all ${
                                formData.language === language.code
                                  ? 'border-teal-500 bg-teal-50'
                                  : 'border-gray-200 hover:border-teal-300'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{language.flag}</span>
                                <span className="font-medium">{language.name}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone *
                        </label>
                        <select
                          value={formData.timezone}
                          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <optgroup label="North America">
                            <option value="America/New_York">Eastern Time (New York)</option>
                            <option value="America/Chicago">Central Time (Chicago)</option>
                            <option value="America/Denver">Mountain Time (Denver)</option>
                            <option value="America/Los_Angeles">Pacific Time (Los Angeles)</option>
                          </optgroup>
                          <optgroup label="Europe">
                            <option value="Europe/London">London</option>
                            <option value="Europe/Paris">Paris</option>
                            <option value="Europe/Rome">Rome</option>
                            <option value="Europe/Athens">Athens</option>
                            <option value="Europe/Tirane">Tirana</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Delivery Settings</h2>
                    <p className="text-gray-600 text-sm mb-4">Optional - Configure delivery options</p>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Delivery</span>
                            <input
                              type="checkbox"
                              checked={formData.deliveryEnabled}
                              onChange={(e) => setFormData({ ...formData, deliveryEnabled: e.target.checked })}
                              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                          </div>
                          <p className="text-sm text-gray-600">Orders delivered to customer</p>
                        </div>

                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Pickup</span>
                            <input
                              type="checkbox"
                              checked={formData.pickupEnabled}
                              onChange={(e) => setFormData({ ...formData, pickupEnabled: e.target.checked })}
                              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                          </div>
                          <p className="text-sm text-gray-600">Customers collect from store</p>
                        </div>
                      </div>

                      {formData.deliveryEnabled && (
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delivery Fee ({formData.currency})
                              </label>
                              <input
                                type="number"
                                value={formData.deliveryFee}
                                onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                                min="0"
                                step="0.01"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"/>
                                </div>
    
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Delivery Radius (km)
                                  </label>
                                  <input
                                    type="number"
                                    value={formData.deliveryRadius}
                                    onChange={(e) => setFormData({ ...formData, deliveryRadius: e.target.value })}
                                    min="1"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
                                  />
                                </div>
                              </div>
    
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Estimated Delivery Time
                                </label>
                                <input
                                  type="text"
                                  value={formData.estimatedDeliveryTime}
                                  onChange={(e) => setFormData({ ...formData, estimatedDeliveryTime: e.target.value })}
                                  placeholder="30-45 minutes"
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
                                />
                              </div>
                            </div>
                          )}
    
                          {formData.pickupEnabled && (
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estimated Pickup Time
                              </label>
                              <input
                                type="text"
                                value={formData.estimatedPickupTime}
                                onChange={(e) => setFormData({ ...formData, estimatedPickupTime: e.target.value })}
                                placeholder="15-20 minutes"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
    
                  {currentStep === 5 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Methods</h2>
                        <p className="text-gray-600 text-sm mb-4">Optional - Select available payment methods</p>
                        
                        <div className="space-y-4">
                          {paymentMethodOptions.map((method) => (
                            <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">{method.name}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={formData.paymentMethods.includes(method.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        paymentMethods: [...formData.paymentMethods, method.id]
                                      })
                                    } else {
                                      setFormData({
                                        ...formData,
                                        paymentMethods: formData.paymentMethods.filter(m => m !== method.id)
                                      })
                                    }
                                  }}
                                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                />
                              </div>
                            </div>
                          ))}
    
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                              <strong>Note:</strong> Currently only FREE plan is available. Stripe integration for paid plans is coming soon.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
    
                  {currentStep === 6 && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Business Goals</h2>
                        <p className="text-gray-600 text-sm mb-4">Optional - What do you want to achieve?</p>
                        
                        <div className="space-y-3">
                          {businessGoalOptions.map((goal) => {
                            const IconComponent = goal.icon
                            return (
                              <button
                                key={goal.id}
                                type="button"
                                onClick={() => {
                                  if (formData.businessGoals.includes(goal.id)) {
                                    setFormData({
                                      ...formData,
                                      businessGoals: formData.businessGoals.filter(g => g !== goal.id)
                                    })
                                  } else {
                                    setFormData({
                                      ...formData,
                                      businessGoals: [...formData.businessGoals, goal.id]
                                    })
                                  }
                                }}
                                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                                  formData.businessGoals.includes(goal.id)
                                    ? 'border-teal-500 bg-teal-50'
                                    : 'border-gray-200 hover:border-teal-300'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <IconComponent className={`w-5 h-5 ${
                                      formData.businessGoals.includes(goal.id) ? 'text-teal-600' : 'text-gray-600'
                                    }`} />
                                    <span className="font-medium">{goal.name}</span>
                                  </div>
                                  {formData.businessGoals.includes(goal.id) && (
                                    <CheckCircle className="w-5 h-5 text-teal-600" />
                                  )}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )}
    
                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={currentStep === 1}
                      className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </button>
    
                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canProceedFromStep(currentStep)}
                        className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !canProceedFromStep(1) || !canProceedFromStep(2) || !canProceedFromStep(3)}
                        className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Create Business
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
    
              {/* Info Section - 1/4 width */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-teal-600" />
                    {stepInfo?.title}
                  </h3>
    
                  <p className="text-sm text-gray-600 mb-4">
                    {stepInfo?.description}
                  </p>
    
                  <div className="space-y-6">
                    {/* Tips Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                        <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                        Quick Tips
                      </h4>
                      <ul className="space-y-2">
                        {stepInfo?.tips.map((tip, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 mr-2 text-teal-500 flex-shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
    
                    {/* Step-specific additional info */}
                    {currentStep === 1 && (
                      <div className="bg-teal-50 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-teal-800 mb-2 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Why This Matters
                        </h4>
                        <p className="text-xs text-teal-700">
                          A complete business profile increases customer trust by 73% and leads to 2.5x more orders in the first month.
                        </p>
                      </div>
                    )}
    
                    {currentStep === 2 && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          Location Benefits
                        </h4>
                        <p className="text-xs text-blue-700">
                          Accurate location enables automatic delivery zone creation and real-time distance calculations for fees.
                        </p>
                      </div>
                    )}
    
                    {currentStep === 3 && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Multi-Language
                        </h4>
                        <p className="text-xs text-purple-700">
                          Select your primary language. You can add translations later to reach more customers.
                        </p>
                      </div>
                    )}
    
                    {currentStep === 4 && (
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center">
                          <Truck className="w-4 h-4 mr-2" />
                          Delivery Stats
                        </h4>
                        <div className="space-y-1 text-xs text-orange-700">
                          <div className="flex justify-between">
                            <span>Delivery orders:</span>
                            <span className="font-medium">68% of revenue</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pickup orders:</span>
                            <span className="font-medium">32% of revenue</span>
                          </div>
                        </div>
                      </div>
                    )}
    
                    {currentStep === 5 && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payment Roadmap
                        </h4>
                        <ul className="space-y-1 text-xs text-green-700">
                          <li>✓ Cash payments (available now)</li>
                          <li>⏳ Stripe integration (Q2 2025)</li>
                          <li>⏳ PayPal (Q3 2025)</li>
                          <li>⏳ Local payment methods</li>
                        </ul>
                      </div>
                    )}
    
                    {currentStep === 6 && (
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center">
                          <Target className="w-4 h-4 mr-2" />
                          Goal-Based Features
                        </h4>
                        <p className="text-xs text-indigo-700">
                          Your selected goals help us customize your dashboard and suggest relevant features to achieve them faster.
                        </p>
                      </div>
                    )}
    
                    {/* Progress indicator */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Setup Progress
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Steps Completed</span>
                          <span className="font-medium">{currentStep - 1} of {totalSteps}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentStep - 1) / totalSteps) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Est. time remaining: {Math.max(1, totalSteps - currentStep)} min
                        </p>
                      </div>
                    </div>
    
                    {/* Support info */}
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Need Help?
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">
                        Our team is here to assist with setup and onboarding.
                      </p>
                      <a 
                        href="mailto:hello@waveorder.app" 
                        className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                      >
                        Contact Support →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }