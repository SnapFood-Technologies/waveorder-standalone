'use client'

import { useState, useEffect } from 'react'
import { SetupData } from '../Setup'
import { ArrowLeft, Smartphone, Store, Phone, Globe, Plus, Share2, Search, Info } from 'lucide-react'

interface StoreCreationStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
  setupToken?: string | null
}

// Function to detect if user is from Albania
function detectAlbanianUser(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check browser language
  const browserLanguage = navigator.language.toLowerCase()
  if (browserLanguage.startsWith('sq') || browserLanguage.includes('al')) {
    return true
  }
  
  // Check timezone (Albania uses Europe/Tirane)
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone === 'Europe/Tirane') {
      return true
    }
  } catch (error) {
    // Timezone detection failed, ignore
  }
  
  return false
}

// Function to detect if user is from Greece
function detectGreekUser(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check browser language
  const browserLanguage = navigator.language.toLowerCase()
  if (browserLanguage.startsWith('el') || browserLanguage.includes('gr')) {
    return true
  }
  
  // Check timezone (Greece uses Europe/Athens)
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone === 'Europe/Athens') {
      return true
    }
  } catch (error) {
    // Timezone detection failed, ignore
  }
  
  return false
}

// Currency symbol helper (same as Store Ready Step)
const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'USD': return '$'
    case 'EUR': return '€'
    case 'ALL': return 'L'
    case 'GBP': return '£'
    case 'BBD': return 'Bds$'
    default: return '$'
  }
}

export default function StoreCreationStep({ data, onComplete, onBack, setupToken }: StoreCreationStepProps) {
  const [formData, setFormData] = useState({
    businessName: data.businessName || '',
    countryCode: '+1', // Default to US
    whatsappNumber: data.whatsappNumber?.replace(/^\+\d+/, '') || '',
    storeSlug: data.storeSlug || ''
  })
  const [showAlbanianCode, setShowAlbanianCode] = useState(false)
  const [showGreekCode, setShowGreekCode] = useState(false)
  const [isOtherCountry, setIsOtherCountry] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [hasUserChangedSlug, setHasUserChangedSlug] = useState(false)

  // Get currency symbol from data
  const currencySymbol = getCurrencySymbol(data.currency || 'USD')

  // Detect Albanian/Greek user and set defaults
  useEffect(() => {
    const isAlbanianUser = detectAlbanianUser()
    const isGreekUser = detectGreekUser()
    setShowAlbanianCode(isAlbanianUser)
    setShowGreekCode(isGreekUser)
    
    // Auto-select country code if detected and not already set
    if (!data.whatsappNumber) {
      if (isGreekUser) {
        setFormData(prev => ({ ...prev, countryCode: '+30' }))
      } else if (isAlbanianUser) {
        setFormData(prev => ({ ...prev, countryCode: '+355' }))
      }
    }
  }, [data.whatsappNumber])

  // Get visible country codes based on detection
  const getVisibleCountryCodes = () => {
    const codes: Array<{ code: string; country: string; flag: string }> = []
    
    // Show Greece first if Greek user detected
    if (showGreekCode) {
      codes.push({ code: '+30', country: 'GR', flag: '🇬🇷' })
    }
    
    // Show Albania if Albanian user detected
    if (showAlbanianCode) {
      codes.push({ code: '+355', country: 'AL', flag: '🇦🇱' })
    }
    
    // Always show common codes
    codes.push({ code: '+1', country: 'US', flag: '🇺🇸' })
    codes.push({ code: '+1246', country: 'BB', flag: '🇧🇧' })
    codes.push({ code: '+34', country: 'ES', flag: '🇪🇸' })
    
    // Add "Other" option
    codes.push({ code: 'OTHER', country: 'OTHER', flag: '🌍' })
    return codes
  }

  // Generate slug from business name
  useEffect(() => {
    if (formData.businessName && !formData.storeSlug) {
      const slug = formData.businessName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      setFormData(prev => ({ ...prev, storeSlug: slug }))
    }
  }, [formData.businessName])

  useEffect(() => {
    if (data.whatsappNumber) {
      if (data.whatsappNumber.startsWith('+30')) {
        setFormData(prev => ({
          ...prev,
          countryCode: '+30',
          whatsappNumber: data.whatsappNumber.replace('+30', '')
        }))
        setIsOtherCountry(false)
      } else if (data.whatsappNumber.startsWith('+355')) {
        setFormData(prev => ({
          ...prev,
          countryCode: '+355',
          whatsappNumber: data.whatsappNumber.replace('+355', '')
        }))
        setIsOtherCountry(false)
      } else if (data.whatsappNumber.startsWith('+34')) {
        setFormData(prev => ({
          ...prev,
          countryCode: '+34',
          whatsappNumber: data.whatsappNumber.replace('+34', '')
        }))
        setIsOtherCountry(false)
      } else if (data.whatsappNumber.startsWith('+1246')) {
        // Barbados - must be checked before generic +1
        setFormData(prev => ({
          ...prev,
          countryCode: '+1246',
          whatsappNumber: data.whatsappNumber.replace('+1246', '')
        }))
        setIsOtherCountry(false)
      } else if (data.whatsappNumber.startsWith('+1')) {
        setFormData(prev => ({
          ...prev,
          countryCode: '+1',
          whatsappNumber: data.whatsappNumber.replace('+1', '')
        }))
        setIsOtherCountry(false)
      } else {
        // Number doesn't match known country codes, use "Other"
        setFormData(prev => ({
          ...prev,
          countryCode: 'OTHER',
          whatsappNumber: data.whatsappNumber
        }))
        setIsOtherCountry(true)
      }
    }
  }, [data.whatsappNumber])

  // Check slug availability
  useEffect(() => {
    if (formData.storeSlug && formData.storeSlug.length >= 3 && hasUserChangedSlug) {
      const timeoutId = setTimeout(checkSlugAvailability, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setSlugAvailable(null)
    }
  }, [formData.storeSlug, hasUserChangedSlug])

  const checkSlugAvailability = async () => {
    if (!formData.storeSlug) return
    
    setCheckingSlug(true)
    try {
      const response = await fetch('/api/setup/check-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slug: formData.storeSlug,
          setupToken: setupToken
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === 'storeSlug') {
      setHasUserChangedSlug(true)
      // Clean slug input - allow dashes while typing
      const cleanSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
      
      setFormData(prev => ({ ...prev, [name]: cleanSlug }))
      
    } else if (name === 'countryCode') {
      // Handle country code selection
      if (value === 'OTHER') {
        setIsOtherCountry(true)
        setFormData(prev => ({ ...prev, countryCode: 'OTHER', whatsappNumber: '' }))
      } else {
        setIsOtherCountry(false)
        setFormData(prev => ({ ...prev, countryCode: value, whatsappNumber: '' }))
      }
    } else if (name === 'whatsappNumber') {
      if (isOtherCountry) {
        // Allow + and numbers for "Other" option (full phone number with country code)
        const cleanNumber = value.replace(/[^+\d\s-]/g, '')
        setFormData(prev => ({ ...prev, [name]: cleanNumber }))
      } else {
        // Only allow numbers for specific country codes
        const cleanNumber = value.replace(/[^0-9]/g, '')
        setFormData(prev => ({ ...prev, [name]: cleanNumber }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async () => {
    if (!formData.businessName || !formData.whatsappNumber || !formData.storeSlug) {
      return
    }
    
    if (slugAvailable === false) {
      return
    }

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const finalSlug = formData.storeSlug.replace(/^-|-$/g, '') // Clean edges only on submit

    // For "Other" option, whatsappNumber already includes the country code
    // For specific country codes, we need to prepend the country code
    const finalWhatsAppNumber = isOtherCountry
      ? formData.whatsappNumber.trim()
      : `${formData.countryCode}${formData.whatsappNumber}`

    onComplete({
      businessName: formData.businessName,
      whatsappNumber: finalWhatsAppNumber,
      storeSlug: finalSlug
    })
    setLoading(false)
  }

  const fullWhatsAppNumber = isOtherCountry
    ? formData.whatsappNumber
    : `${formData.countryCode}${formData.whatsappNumber}`
  const storeUrl = `waveorder.app/${formData.storeSlug}`

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Side - Form */}
        <div className="order-2 lg:order-1">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              {data.businessName ? 'Update your store' : 'Create your store'}
            </h1>
            <p className="text-base sm:text-lg text-gray-600">
              Set up your basic store information to get started
            </p>
          </div>

          <div className="space-y-5 sm:space-y-6">
            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="pl-10 w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base text-gray-900 placeholder:text-gray-500"
                  placeholder="Enter your business name"
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  className="px-3 py-3 sm:py-2 border border-gray-300 rounded-lg sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white text-base text-gray-900 sm:min-w-[120px]"
                >
                  {getVisibleCountryCodes().map(country => (
                    <option key={country.code} value={country.code}>
                      {country.code === 'OTHER' ? '🌍 Other' : `${country.flag} ${country.code}`}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="whatsappNumber"
                    name="whatsappNumber"
                    type="tel"
                    required
                    value={formData.whatsappNumber}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg sm:rounded-l-none sm:border-l-0 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base text-gray-900 placeholder:text-gray-500"
                    placeholder={isOtherCountry ? "+55 11 987654321" : "123456789"}
                  />
                </div>
              </div>
              {isOtherCountry && (
                <p className="mt-2 text-sm text-gray-600">
                  Can't find your country code? Enter your full WhatsApp number including the country code (e.g., +55 11 987654321)
                </p>
              )}
            </div>

            {/* Store URL */}
            <div>
              <label htmlFor="storeSlug" className="block text-sm font-medium text-gray-700 mb-2">
                Store URL <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row">
                <div className="px-3 py-3 sm:py-2 bg-gray-50 border border-gray-300 rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none border-b-0 sm:border-b sm:border-r-0 flex items-center justify-center sm:justify-start">
                  <Globe className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-600 text-sm sm:text-base">waveorder.app/</span>
                </div>
                <input
                  id="storeSlug"
                  name="storeSlug"
                  type="text"
                  required
                  value={formData.storeSlug}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-3 sm:py-2 border border-gray-300 rounded-b-lg sm:rounded-r-lg sm:rounded-bl-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base text-gray-900 placeholder:text-gray-500"
                  placeholder="your-business-name"
                />
              </div>
              
              {formData.storeSlug && (
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

            <div className="flex flex-col sm:flex-row gap-4 sm:justify-between pt-4 sm:pt-6">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              
              <button
                type="button"
                disabled={loading || !formData.businessName || !formData.whatsappNumber || !formData.storeSlug || slugAvailable === false}
                onClick={handleSubmit}
                className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
              >
                {loading 
                  ? (data.businessName ? 'Updating...' : 'Creating...') 
                  : (data.businessName ? 'Update Store' : 'Create Store')
                }
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Live Preview */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-teal-600" />
              Live Preview
            </h3>
            
           {/* Mobile Phone Frame */}
<div className="bg-black rounded-3xl p-2 mx-auto" style={{ width: '300px' }}>
  <div className="bg-white rounded-2xl overflow-hidden h-[500px] relative">
    
    {/* Cover Header */}
    <div 
      className="relative h-24"
      style={{ 
        background: `linear-gradient(135deg, ${data.primaryColor || '#0D9488'}CC, ${data.primaryColor || '#0D9488'}99)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Header Icons */}
      <div className="absolute top-2 right-2 flex gap-2">
        <div className="w-6 h-6 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
          <Share2 className="w-3 h-3 text-white" />
        </div>
        <div className="w-6 h-6 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
          <Search className="w-3 h-3 text-white" />
        </div>
        <div className="w-6 h-6 bg-black bg-opacity-20 rounded-full flex items-center justify-center">
          <Info className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>

    {/* Store Info */}
    <div className="bg-white p-3 relative">
      {/* Logo */}
      <div 
        className="absolute -top-5 left-3 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg bg-white"
        style={{ color: data.primaryColor || '#0D9488' }}
      >
        {formData.businessName?.charAt(0) || 'S'}
      </div>

      <div className="pt-3">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-sm font-bold text-gray-900 truncate">
            {formData.businessName || 'Your Business Name'}
          </h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            Open
          </span>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
          <Store className="w-3 h-3" />
          <span className="truncate">123 Sample Street</span>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>20-30 min</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            <span>Free delivery</span>
          </div>
        </div>
      </div>
    </div>

    {/* Search Bar */}
    <div className="px-3 py-2">
      <div className="relative">
        <Globe className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search dishes..."
          className="w-full pl-7 pr-2 py-2 border border-gray-200 rounded-lg text-xs outline-none"
        />
      </div>
    </div>

    {/* Category Tabs */}
    <div className="px-3 py-2">
      <div className="flex gap-1 overflow-x-auto">
        <button className="px-3 py-1 text-xs font-medium border-b-2 whitespace-nowrap" style={{ color: data.primaryColor || '#0D9488', borderBottomColor: data.primaryColor || '#0D9488' }}>
          All
        </button>
        <button className="px-3 py-1 text-xs font-medium text-gray-600 border-b-2 border-transparent whitespace-nowrap">
          Appetizers
        </button>
        <button className="px-3 py-1 text-xs font-medium text-gray-600 border-b-2 border-transparent whitespace-nowrap">
          Mains
        </button>
      </div>
    </div>

    {/* Products Area */}
    <div className="flex-1 overflow-y-auto px-3 pb-4">
      <div className="space-y-2">
        {/* Sample Product Cards */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center p-3">
            <div className="flex-1">
              <h3 className="font-semibold text-xs text-gray-900 mb-1">
                Sample Dish
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                Delicious sample description
              </p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs" style={{ color: data.primaryColor || '#0D9488' }}>
                  {currencySymbol}12.99
                </span>
                <button
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: data.primaryColor || '#0D9488' }}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="w-12 h-12 ml-2 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              <Store className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center p-3">
            <div className="flex-1">
              <h3 className="font-semibold text-xs text-gray-900 mb-1">
                Another Item
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                Another sample description
              </p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs" style={{ color: data.primaryColor || '#0D9488' }}>
                  {currencySymbol}8.50
                </span>
                <button
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: data.primaryColor || '#0D9488' }}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="w-12 h-12 ml-2 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              <Store className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

            {/* Store Info */}
            <div className="mt-4 sm:mt-6 space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Store URL:</div>
                <div className="font-mono text-xs sm:text-sm text-teal-600 break-all">
                  {formData.storeSlug ? storeUrl : 'waveorder.app/your-store'}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">WhatsApp Number:</div>
                <div className="font-mono text-xs sm:text-sm text-gray-900">
                  {formData.whatsappNumber ? fullWhatsAppNumber : 'Not set'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}