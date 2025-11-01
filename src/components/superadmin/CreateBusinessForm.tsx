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
  Users,
  X,
  Eye,
  EyeOff,
  Key,
  Link as LinkIcon
} from 'lucide-react'

interface FormData {
  businessName: string
  slug: string
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
  password?: string
  sendEmail: boolean
  createdByAdmin: boolean
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
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain', pattern: /^[6-9]\d{8}$/, placeholder: '612 345 678' },
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
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' }
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
      }
    })
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

interface SuccessMessage {
  businessName: string
}

export function CreateBusinessForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState<SuccessMessage | null>(null)
  
  // Slug management
  const [manualSlug, setManualSlug] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    slug: '',
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
    businessGoals: [],
    password: '',
    sendEmail: true,
    createdByAdmin: true
  })

  const totalSteps = 6

  // Check slug availability
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
      console.error('Slug check error:', error)
      setSlugAvailable(null)
    } finally {
      setCheckingSlug(false)
    }
  }

  // Debounced slug checking for manual mode
  useEffect(() => {
    if (manualSlug && formData.slug && formData.slug.length >= 3) {
      const timeoutId = setTimeout(() => checkSlugAvailability(formData.slug), 500)
      return () => clearTimeout(timeoutId)
    } else {
      setSlugAvailable(null)
    }
  }, [formData.slug, manualSlug])

  // Auto-generate slug when not in manual mode AND check its availability
  useEffect(() => {
    if (!manualSlug && formData.businessName) {
      const autoSlug = formData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      setFormData(prev => ({ ...prev, slug: autoSlug }))
      
      // Check if auto-generated slug is available
      if (autoSlug.length >= 3) {
        checkSlugAvailability(autoSlug)
      }
    }
  }, [formData.businessName, manualSlug])

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

    // Validate slug if manual
    if (manualSlug && slugAvailable !== true) {
      setError('Please choose an available store URL')
      setLoading(false)
      return
    }

    // Validate password if not sending email
    if (!formData.sendEmail && (!formData.password || formData.password.length < 8)) {
      setError('Password must be at least 8 characters when not sending email')
      setLoading(false)
      return
    }

    try {
      const completeWhatsappNumber = `${formData.phonePrefix}${formData.whatsappNumber.replace(/[^\d]/g, '')}`

      const response = await fetch('/api/superadmin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          slug: formData.slug,
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
          sendEmail: formData.sendEmail,
          password: formData.sendEmail ? undefined : formData.password,
          createdByAdmin: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create business')
      }

      // Show success message
      setSuccessMessage({
        businessName: formData.businessName
      })

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/superadmin/businesses?success=created')
      }, 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business')
    } finally {
      setLoading(false)
    }
  }

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        const hasBasicInfo = !!(formData.businessName && formData.businessType && formData.ownerName && formData.ownerEmail)
        const hasValidSlug = !!(formData.slug && (!manualSlug || slugAvailable === true))
        return hasBasicInfo && hasValidSlug
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
            'Customize the store URL or auto-generate it'
          ]
        }
      case 2:
        return {
          title: 'Contact & Location',
          description: 'How customers will reach the business',
          tips: [
            'WhatsApp number is used for orders',
            'Address helps with delivery zones',
            'Location enables accurate delivery fees',
            'Use the primary business contact'
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
          description: 'What is the purpose of this business?',
          tips: [
            'Select all goals that apply',
            'Helps customize the dashboard experience',
            'Goals can be updated anytime',
            'Optional but recommended'
          ]
        }
    }
  }

  const stepInfo = getStepInfo()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Business Created Successfully</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {successMessage.businessName} has been added to the platform. Redirecting...
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

      <div className="max-w-8xl mx-auto">
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
              {/* Header - Moved inside form */}
              <div className="mb-4 border-b border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <button
                    onClick={() => router.push('/superadmin/businesses')}
                    className="hover:bg-gray-100 rounded-lg transition-colors"
                    type="button"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Create New Business</h1>
                    <p className="text-sm text-gray-600 mt-0">Set up a new business account on WaveOrder</p>
                  </div>
                </div>
              </div>

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

                      {/* Slug Configuration */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Store URL *
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setManualSlug(!manualSlug)
                              setSlugAvailable(null)
                            }}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                          >
                            {manualSlug ? 'Auto-generate' : 'Enter manually'}
                          </button>
                        </div>

                        <div className="flex">
                          <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-lg">
                            waveorder.app/
                          </span>
                          <input
                            type="text"
                            value={manualSlug ? formData.slug : (
                              formData.businessName
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, '-')
                                .replace(/-+/g, '-')
                                .replace(/^-|-$/g, '')
                            )}
                            onChange={(e) => {
                              if (manualSlug) {
                                const cleanSlug = e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9-]/g, '')
                                  .replace(/-+/g, '-')
                                setFormData({ ...formData, slug: cleanSlug })
                              }
                            }}
                            disabled={!manualSlug}
                            className={`flex-1 border border-gray-300 rounded-r-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                              !manualSlug ? 'bg-gray-50 text-gray-500' : ''
                            }`}
                            placeholder="your-business-slug"
                            required
                          />
                        </div>

                        {/* Show validation for BOTH manual and auto modes */}
                        {formData.slug && formData.slug.length >= 3 && (
                          <div className="mt-2">
                            {checkingSlug ? (
                              <p className="text-sm text-gray-600 flex items-center">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Checking availability...
                              </p>
                            ) : slugAvailable === true ? (
                              <p className="text-sm text-green-600 flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                URL is available
                              </p>
                            ) : slugAvailable === false ? (
                              <p className="text-sm text-red-600 flex items-center">
                                <X className="w-3 h-3 mr-1" />
                                URL is already taken - {manualSlug ? 'try another' : 'switch to manual mode to customize'}
                              </p>
                            ) : null}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-1">
                          {manualSlug 
                            ? 'Enter a custom URL for this business (lowercase letters, numbers, and hyphens only)'
                            : 'URL is automatically generated from business name'
                          }
                        </p>
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

                      {/* Account Setup Section */}
                      <div className="border-t border-gray-200 pt-6 mt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Setup</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="sendEmail"
                              checked={formData.sendEmail}
                              onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                            <label htmlFor="sendEmail" className="text-sm font-medium text-gray-700">
                              Send setup email to owner
                            </label>
                          </div>

                          {!formData.sendEmail && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Set Password *
                              </label>
                              <div className="relative">
                                <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  required={!formData.sendEmail}
                                  value={formData.password}
                                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  placeholder="Minimum 8 characters"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Owner can sign in immediately with this password
                              </p>
                            </div>
                          )}

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              {formData.sendEmail 
                                ? '📧 Owner will receive an email with a setup link to create their password'
                                : '🔑 Owner can sign in immediately using the password you set'
                              }
                            </p>
                          </div>
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
                            onChange={(e) => {
                              setFormData(prev => ({ 
                                ...prev, 
                                phonePrefix: e.target.value,
                                whatsappNumber: ''
                              }))
                              setPhoneError(null)
                            }}
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
                            onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
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
                          onChange={(address) => setFormData(prev => ({ ...prev, address }))}
                          onCoordinatesChange={(lat, lng) => setFormData(prev => ({ 
                            ...prev, 
                            storeLatitude: lat, 
                            storeLongitude: lng 
                          }))}
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                                  <IconComponent className={`w-6 h-6 flex-shrink-0 ${
                                    formData.currency === currency.code ? 'text-teal-600' : 'text-gray-600'
                                  }`} />
                                  <div className="text-left flex-1">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            <option value="Europe/Madrid">Madrid</option>
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
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500"
                              />
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
                      Setup Best Practices
                    </h4>
                    <p className="text-xs text-teal-700">
                      Complete business profiles help owners onboard faster and start accepting orders immediately. Ensure all contact details are accurate for seamless communication.
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
                    Accurate location enables automatic delivery zone creation and real-time distance calculations for delivery fees. WhatsApp number is the primary channel for order notifications.
                  </p>
                </div>
              )}

              {currentStep === 3 && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-800 mb-2 flex items-center">
                    <Globe className="w-4 h-4 mr-2" />
                    Regional Configuration
                  </h4>
                  <p className="text-xs text-purple-700">
                    Currency and language settings affect the customer-facing catalog. Timezone is used for business hours and order scheduling. All settings can be modified later by the business owner.
                  </p>
                </div>
              )}

              {currentStep === 4 && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-orange-800 mb-2 flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    Delivery Configuration
                  </h4>
                  <p className="text-xs text-orange-700">
                    Delivery and pickup options can both be enabled. Delivery radius and fees are editable by the business owner. Estimated times help set customer expectations for order fulfillment.
                  </p>
                </div>
              )}

              {currentStep === 5 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payment Methods
                  </h4>
                  <p className="text-xs text-green-700">
                    Currently only FREE plan with cash payment is available. Online payment integrations (Stripe, PayPal) will be available with paid subscription plans in future releases.
                  </p>
                </div>
              )}

              {currentStep === 6 && (
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <h4 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Business Goals
                  </h4>
                  <p className="text-xs text-indigo-700">
                    Selected goals help customize the dashboard experience and feature recommendations for the business owner. Goals can be updated anytime from the business settings.
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

              {/* Admin Resources */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Admin Resources
                </h4>
                <p className="text-xs text-gray-600 mb-2">
                  Quick links for managing businesses on the platform.
                </p>
                <div className="space-y-1">
                  <a 
                    href="/superadmin/businesses" 
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium block"
                  >
                    View All Businesses →
                  </a>
                  <a 
                    href="/superadmin/dashboard" 
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium block"
                  >
                    SuperAdmin Dashboard →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)
}