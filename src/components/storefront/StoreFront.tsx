'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  MapPin, 
  Clock, 
  Share2,
  Store,
  UtensilsCrossed,
  Info,
  Package,
  AlertCircle,
  CalendarClock,
  AlertTriangle,
  ChevronDown,
  Phone,
  Mail,
  Globe,
  Copy,
  Check,
  Navigation,
  ExternalLink
} from 'lucide-react'
import { getStorefrontTranslations } from '@/utils/storefront-translations'
import { FaFacebook, FaLinkedin, FaTelegram, FaWhatsapp } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { PhoneInput } from '../site/PhoneInput'

// Google Places API hook
const useGooglePlaces = () => {
    const [isLoaded, setIsLoaded] = useState(false)
    
    useEffect(() => {
      // Check if Google Maps is already loaded
      // @ts-ignore
      if (typeof window !== 'undefined' && window.google?.maps?.places) {
        setIsLoaded(true)
        return
      }
      
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        existingScript.addEventListener('load', () => setIsLoaded(true))
        return
      }
      
      // Load the script
      if (typeof window !== 'undefined') {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
        script.async = true
        script.defer = true
        script.onload = () => setIsLoaded(true)
        script.onerror = () => console.error('Failed to load Google Maps API')
        document.head.appendChild(script)
      }
    }, [])
  
    return { isLoaded }
  }

// Time slot generator for scheduling
// @ts-ignore
const generateTimeSlots = (businessHours, currentDate, orderType) => {
  // @ts-ignore
  const slots = []
  const now = new Date()
  const today = new Date().toDateString()
  const selectedDate = currentDate.toDateString()
  
  // @ts-ignore
  if (!businessHours) return slots
  
  // Get business hours for the selected day
  const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const dayHours = businessHours[dayOfWeek]
  
  // @ts-ignore
  if (!dayHours || dayHours.closed) return slots
  
  const [openHour, openMinute] = dayHours.open.split(':').map(Number)
  const [closeHour, closeMinute] = dayHours.close.split(':').map(Number)
  
  let currentTime = new Date(currentDate)
  currentTime.setHours(openHour, openMinute, 0, 0)
  
  const closeTime = new Date(currentDate)
  closeTime.setHours(closeHour, closeMinute, 0, 0)
  
  // If it's today, start from current time + buffer
  if (selectedDate === today) {
    const buffer = orderType === 'delivery' ? 45 : 20 // minutes
    const minTime = new Date(now.getTime() + buffer * 60000)
    if (currentTime < minTime) {
      currentTime = minTime
      // Round up to next 30-minute slot
      const minutes = currentTime.getMinutes()
      const roundedMinutes = Math.ceil(minutes / 30) * 30
      currentTime.setMinutes(roundedMinutes, 0, 0)
    }
  }
  
  while (currentTime < closeTime) {
    slots.push({
      value: currentTime.toTimeString().slice(0, 5),
      label: currentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    })
    currentTime.setMinutes(currentTime.getMinutes() + 30)
  }
  
  return slots
}

// @ts-ignore
function StoreClosure({ storeData, primaryColor, translations }) {
  if (!storeData.isTemporarilyClosed) return null
  
  // @ts-ignore
  const formatReopeningDate = (date) => {
    if (!date) return null
    const reopening = new Date(date)
    const now = new Date()
    const diffTime = reopening.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return `Today at ${reopening.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`
    } else if (diffDays === 1) {
      return `Tomorrow at ${reopening.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`
    } else if (diffDays <= 7) {
      return reopening.toLocaleDateString('en-US', { 
        weekday: 'long',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } else {
      return reopening.toLocaleDateString('en-US', { 
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  const reopeningText = formatReopeningDate(storeData.closureEndDate)
  
  // Determine what message to show
  const getDisplayMessage = () => {
    if (storeData.closureMessage) {
      return storeData.closureMessage
    }
    
    // Fallback based on closure reason if no customer message
    if (storeData.closureReason) {
      switch (storeData.closureReason.toLowerCase()) {
        case 'maintenance':
          return translations.maintenanceMessage || 'We are currently performing maintenance and will be back soon.'
        case 'holiday':
          return translations.holidayMessage || 'We are closed for the holiday.'
        case 'emergency':
          return translations.emergencyMessage || 'We are temporarily closed due to unforeseen circumstances.'
        case 'staff_shortage':
          return translations.staffShortageMessage || 'We are temporarily closed due to staffing issues.'
        case 'supply_issues':
          return translations.supplyIssuesMessage || 'We are temporarily closed due to supply issues.'
        default:
          return translations.temporaryClosureMessage || 'We are temporarily closed and will reopen soon.'
      }
    }
    
    // Ultimate fallback
    return translations.temporaryClosureMessage || 'We are temporarily closed and will reopen soon.'
  }

  const displayMessage = getDisplayMessage()

  return (
    <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-100 mb-4 md:mb-6">
      {/* Main closure info */}
      <div className="flex items-start">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {translations.temporarilyClosed || 'Temporarily Closed'}
          </h3>
          <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
            {displayMessage}
          </p>
        </div>
      </div>
      
      {/* Reopening time - separate row */}
      {reopeningText && (
        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center mr-2 flex-shrink-0"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <Clock className="w-3 h-3" style={{ color: primaryColor }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">
                {translations.expectedReopen || 'Expected to reopen'}
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {reopeningText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Enhanced Address Input with Autocomplete and Fee Calculation
function AddressAutocomplete({ 
    value, 
    onChange, 
    placeholder, 
    required, 
    primaryColor,
    onLocationChange,
    storeData
  }: {
    value: string
    onChange: (address: string) => void
    placeholder: string
    required: boolean
    primaryColor: string
    onLocationChange?: (lat: number, lng: number, address: string) => void
    storeData?: any
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
          return ['gr', 'al', 'it', 'us'] // Greece business - 4 country addresses -- test purpose
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
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors"
          style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
          onFocus={(e) => e.target.style.borderColor = primaryColor}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          placeholder={placeholder}
        />
        {isCalculatingFee && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-blue-500"></div>
          </div>
        )}
      </div>
    )
  }
  

// Detect country from user's location and business data
function detectCountryFromBusiness(storeData: any): 'AL' | 'US' | 'GR' | 'IT' | 'DEFAULT' {
    // TESTING OVERRIDE: Check user's location first for Greece testing
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
    if (storeData.storeLatitude && storeData.storeLongitude) {
      const lat = storeData.storeLatitude
      const lng = storeData.storeLongitude
      
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
    if (storeData.whatsappNumber?.startsWith('+355')) return 'AL'
    if (storeData.whatsappNumber?.startsWith('+30')) return 'GR'
    if (storeData.whatsappNumber?.startsWith('+39')) return 'IT'
    if (storeData.whatsappNumber?.startsWith('+1')) return 'US'
    
    // TERTIARY: Check other user location indicators
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
    
    // FALLBACK: Check business indicators
    if (storeData.currency === 'ALL' || storeData.language === 'sq') return 'AL'
    if (storeData.currency === 'EUR' && storeData.language === 'el') return 'GR'
    if (storeData.currency === 'EUR' && storeData.language === 'it') return 'IT'
    
    return 'US'
  }

  function StoreLocationMap({ 
    storeData, 
    primaryColor, 
    translations 
  }: { 
    storeData: any, 
    primaryColor: string, 
    translations: any 
  }) {


    const openDirections = () => {
      // Use coordinates if available for more accurate directions
      if (storeData.storeLatitude && storeData.storeLongitude) {
        const lat = storeData.storeLatitude
        const lng = storeData.storeLongitude
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
      } else if (storeData.address) {
        // Fallback to address if coordinates not available
        const encodedAddress = encodeURIComponent(storeData.address)
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
      }
    }
  
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-6 rounded-2xl border border-blue-100">
        {/* Header with Icon and Title */}
        <div className="flex items-center mb-4">
          <div 
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mr-3 flex-shrink-0"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: primaryColor }} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-lg">
              {translations.pickupLocation || 'Pickup Location'}
            </h4>
          </div>
        </div>
  
        {/* Address */}
        <p className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base">
          {storeData.address}
        </p>
        
        {/* Full Width Map Area */}
        <div 
          className="relative w-full h-32 sm:h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden mb-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={openDirections}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg"
                style={{ backgroundColor: primaryColor }}
              >
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-700">{storeData.name}</p>
              <p className="text-xs text-gray-500">{translations.tapForDirections || 'Tap for directions'}</p>
            </div>
          </div>
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                openDirections()
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
            >
              <Navigation className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Bottom Section - Stacked */}
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-gray-600">
            {translations.pickupInstructions || 'Please come to this location to collect your order.'}
          </p>
          <button
            onClick={openDirections}
            className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity flex items-center justify-center"
            style={{ backgroundColor: primaryColor }}
          >
            <Navigation className="w-4 h-4 mr-1" />
            {translations.directions || 'Directions'}
          </button>
        </div>
      </div>
    )
  }

  function BusinessInfoModal({
    isOpen,
    onClose,
    storeData,
    primaryColor,
    translations
  }: {
    isOpen: boolean
    onClose: () => void
    storeData: any
    primaryColor: string
    translations: any
  }) {
    if (!isOpen) return null
  
    const formatBusinessHours = (businessHours: any) => {
      if (!businessHours) return null
      
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      const today = new Date().getDay()
      const todayIndex = today === 0 ? 6 : today - 1 // Convert Sunday=0 to our array index
      
      return days.map((day, index) => {
        const hours = businessHours[day]
        const isToday = index === todayIndex
        return (
          <div key={day} className={`flex justify-between items-center py-2 px-3 rounded-lg ${
            isToday ? 'bg-blue-50' : ''
          }`}>
            <span className={`text-sm font-medium ${
              isToday ? 'text-blue-900' : 'text-gray-700'
            }`}>
              {dayLabels[index]} {isToday && '(Today)'}
            </span>
            <span className={`text-sm ${
              isToday ? 'text-blue-700 font-medium' : 'text-gray-600'
            }`}>
              {hours?.closed ? 'Closed' : `${hours?.open} - ${hours?.close}`}
            </span>
          </div>
        )
      })
    }
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-xl">
          {/* Header without dark border */}
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{translations.businessInfo || 'Business Info'}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(85vh-100px)] p-6 space-y-6">
            {/* Business Description */}
            {storeData.description && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
                  {translations.about || 'About'}
                </h3>
                <p className="text-gray-700 leading-relaxed">{storeData.description}</p>
              </div>
            )}
  
            {/* Contact Information */}
            <div>
             {/* Website */}
{storeData.website && (
  <div>
    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
      Website
    </h3>
    <a href={storeData.website} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group">
      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
        <Globe className="w-5 h-5 text-purple-600" />
      </div>
      <div className="flex items-center">
        <span className="text-gray-700 font-medium">{storeData.website.replace(/^https?:\/\//, '')}</span>
        <ExternalLink className="w-4 h-4 ml-2 text-purple-600" />
      </div>
    </a>
  </div>
)}
            </div>
  
            {/* Address */}
            {storeData.address && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
                  {translations.address || 'Address'}
                </h3>
                <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700 leading-relaxed">{storeData.address}</p>
                </div>
              </div>
            )}
  
            {/* Business Hours */}
            {storeData.businessHours && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
                  {translations.hours || 'Hours'}
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-1">
                  {formatBusinessHours(storeData.businessHours)}
                </div>
              </div>
            )}
  
            {/* Service Options */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
                {translations.serviceOptions || 'Service Options'}
              </h3>
              <div className="space-y-3">
                {storeData.deliveryEnabled && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <Package className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium text-gray-800">{translations.delivery || 'Delivery'}</span>
                    </div>
                    <span className="text-sm text-green-700 font-medium">
                      {storeData.estimatedDeliveryTime || '30-45 min'}
                    </span>
                  </div>
                )}
                {storeData.pickupEnabled && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <Store className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-800">{translations.pickup || 'Pickup'}</span>
                    </div>
                    <span className="text-sm text-blue-700 font-medium">
                      {storeData.estimatedPickupTime || '15-20 min'}
                    </span>
                  </div>
                )}
                {storeData.dineInEnabled && (
                  <div className="flex items-center p-3 bg-purple-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <UtensilsCrossed className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-gray-800">{translations.dineIn || 'Dine In'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  
  function ShareModal({
    isOpen,
    onClose,
    storeData,
    primaryColor,
    translations
  }: {
    isOpen: boolean
    onClose: () => void
    storeData: any
    primaryColor: string
    translations: any
  }) {
    const [copied, setCopied] = useState(false)
  
    if (!isOpen) return null
  
    const storeUrl = typeof window !== 'undefined' ? window.location.href : ''
    const shareText = `Check out ${storeData.name}! Amazing food and great service.`
    
    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(storeUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy: ', err)
      }
    }
  
    const shareOptions = [
      {
        name: 'WhatsApp',
        icon: FaWhatsapp,
        color: 'bg-green-500 hover:bg-green-600',
        action: () => {
          const text = `${shareText} ${storeUrl}`
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
        }
      },
      {
        name: 'Facebook',
        icon: FaFacebook,
        color: 'bg-blue-600 hover:bg-blue-700',
        action: () => {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`, '_blank')
        }
      },
      {
        name: 'X',
        icon: FaXTwitter,
        color: 'bg-black hover:bg-gray-800',
        action: () => {
          const text = `${shareText} ${storeUrl}`
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
        }
      },
      {
        name: 'LinkedIn',
        icon: FaLinkedin,
        color: 'bg-blue-700 hover:bg-blue-800',
        action: () => {
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(storeUrl)}`, '_blank')
        }
      },
      {
        name: 'Telegram',
        icon: FaTelegram,
        color: 'bg-sky-400 hover:bg-sky-500',
        action: () => {
          const text = `${shareText} ${storeUrl}`
          window.open(`https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(shareText)}`, '_blank')
        }
      },
      {
        name: 'Email',
        icon: Mail,
        color: 'bg-gray-600 hover:bg-gray-700',
        action: () => {
          const subject = `Check out ${storeData.name}`
          const body = `${shareText}\n\n${storeUrl}`
          window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank')
        }
      }
    ]
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {translations.share || 'Share'} {storeData.name}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                {translations.copyLink || 'Copy Link'}
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={storeUrl}
                  readOnly
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-3 rounded-xl text-white font-medium transition-all flex items-center ${
                    copied ? 'bg-green-500' : ''
                  }`}
                  style={{ backgroundColor: copied ? undefined : primaryColor }}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && (
                <p className="text-green-600 text-sm mt-2 font-medium">Link copied to clipboard!</p>
              )}
            </div>
  
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-4">
                {translations.shareVia || 'Share via'}
              </label>
              <div className="grid grid-cols-6 gap-3">
                {shareOptions.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <button
                      key={option.name}
                      onClick={option.action}
                      title={option.name}
                      className={`w-12 h-12 rounded-full text-white transition-colors flex items-center justify-center ${option.color}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </button>
                  )
                })}
              </div>
            </div>
  
            {typeof navigator !== 'undefined' && navigator.share && (
              <div>
                <button
                  onClick={() => {
                    navigator.share({
                      title: storeData.name,
                      text: shareText,
                      url: storeUrl,
                    })
                  }}
                  className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  More sharing options
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

// Enhanced Time Selection Component with Dynamic Labels
function TimeSelection({ 
  deliveryType, 
  selectedTime, 
  onTimeChange, 
  storeData, 
  primaryColor, 
  translations 
}: {
  deliveryType: 'delivery' | 'pickup' | 'dineIn'
  selectedTime: string
  onTimeChange: (time: string) => void
  storeData: any
  primaryColor: string
  translations: any
}) {
  const [timeMode, setTimeMode] = useState('now')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  
  // Generate time slots (same as before)
  const timeSlots = generateTimeSlots(storeData.businessHours, selectedDate, deliveryType)
  
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date
  })

  const handleTimeSelection = (mode: string, date: Date | null = null, time: string | null = null) => {
    setTimeMode(mode)
    if (mode === 'now') {
      onTimeChange('asap')
    } else if (date && time) {
      const dateTime = new Date(date)
      const [hours, minutes] = time.split(':')
      dateTime.setHours(parseInt(hours), parseInt(minutes))
      onTimeChange(dateTime.toISOString())
    }
  }

  // Dynamic labels and estimated times based on delivery type
  const getTimeLabels = () => {
    switch (deliveryType) {
      case 'delivery':
        return {
          timeLabel: translations.deliveryTime || 'Delivery Time',
          nowLabel: translations.now || 'Now',
          estimatedTime: storeData.estimatedDeliveryTime || '30-45 min'
        }
      case 'pickup':
        return {
          timeLabel: translations.pickupTime || 'Pickup Time',
          nowLabel: translations.now || 'Now',
          estimatedTime: storeData.estimatedPickupTime || '15-20 min'
        }
      case 'dineIn':
        return {
          timeLabel: translations.arrivalTime || 'Arrival Time',
          nowLabel: translations.now || 'Now',
          estimatedTime: '15-20 min'
        }
      default:
        return {
          timeLabel: translations.time || 'Time',
          nowLabel: translations.now || 'Now',
          estimatedTime: '15-20 min'
        }
    }
  }

  const { timeLabel, nowLabel, estimatedTime } = getTimeLabels()

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {timeLabel}
      </label>
      
      {/* Compact Time Mode Selection */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => handleTimeSelection('now')}
          className={`p-3 border-2 rounded-xl text-center transition-all ${
            timeMode === 'now'
              ? 'text-white border-transparent'
              : 'text-gray-700 border-gray-200 hover:border-gray-200'
          }`}
          style={{ 
            backgroundColor: timeMode === 'now' ? primaryColor : 'white'
          }}
        >
          <div className="flex items-center justify-center mb-1">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">{nowLabel}</span>
          </div>
          <div className="text-xs opacity-80">{estimatedTime}</div>
        </button>
        
        <button
          onClick={() => handleTimeSelection('schedule')}
          className={`p-3 border-2 rounded-xl text-center transition-all ${
            timeMode === 'schedule'
              ? 'text-white border-transparent'
              : 'text-gray-700 border-gray-200 hover:border-gray-200'
          }`}
          style={{ 
            backgroundColor: timeMode === 'schedule' ? primaryColor : 'white'
          }}
        >
          <div className="flex items-center justify-center mb-1">
            <CalendarClock className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">{translations.schedule || 'Schedule'}</span>
          </div>
          <div className="text-xs opacity-80">{translations.pickTime || 'Pick time'}</div>
        </button>
      </div>

      {/* Scheduled Time Selection */}
      {timeMode === 'schedule' && (
        <div className="space-y-4">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translations.selectDate || 'Select Date'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableDates.slice(0, 4).map((date, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`p-3 border-2 rounded-xl text-center transition-all ${
                    selectedDate.toDateString() === date.toDateString()
                      ? 'border-transparent text-white'
                      : 'border-gray-200 hover:border-gray-200 text-gray-700'
                  }`}
                  style={{ 
                    backgroundColor: selectedDate.toDateString() === date.toDateString() 
                      ? primaryColor : 'white'
                  }}
                >
                  <div className="text-sm font-medium">
                    {index === 0 ? translations.today || 'Today' : 
                     index === 1 ? translations.tomorrow || 'Tomorrow' :
                     date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs opacity-80">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {translations.selectTime || 'Select Time'}
            </label>
            <div className="relative">
              <button
                onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors text-left flex items-center justify-between"
                style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
              >
               <span>{selectedTime && timeMode === 'schedule' && selectedTime !== 'asap' ? 
  new Date(selectedTime).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  }) : 
  translations.selectTime || 'Select Time'
}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showTimeDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {timeSlots.length > 0 ? timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleTimeSelection('schedule', selectedDate, slot.value)
                        setShowTimeDropdown(false)
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      {slot.label}
                    </button>
                  )) : (
                    <div className="px-4 py-3 text-gray-500 text-center">
                      {translations.noTimeSlots || 'No available time slots for this date'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple Delivery Switcher Component
// Fixed Delivery Switcher Component with proper TypeScript types
function DeliveryTypeSwitcher({
  // @ts-ignore
  deliveryType,
  // @ts-ignore
  setDeliveryType,
  // @ts-ignore
  deliveryOptions,
  // @ts-ignore
  primaryColor,
  disabled = false
}: {
  deliveryType: 'delivery' | 'pickup' | 'dineIn'
  setDeliveryType: (type: 'delivery' | 'pickup' | 'dineIn') => void
  deliveryOptions: Array<{ key: string; label: string; icon: any }>
  primaryColor: string
  disabled?: boolean
}) {
  if (deliveryOptions.length <= 1) return null

  return (
    <div className="inline-flex bg-gray-100 p-1 rounded-full">
      {deliveryOptions.map(option => {
        const IconComponent = option.icon
        return (
          <button
            key={option.key}
            onClick={() => !disabled && setDeliveryType(option.key as 'delivery' | 'pickup' | 'dineIn')}
            disabled={disabled}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 min-w-[80px] flex items-center justify-center ${
              deliveryType === option.key
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ 
              backgroundColor: deliveryType === option.key ? primaryColor : 'transparent'
            }}
          >
            <IconComponent className="w-4 h-4 mr-1" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

interface StoreData {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  coverImage?: string
  phone?: string
  email?: string
  address?: string
  website?: string
  whatsappNumber: string
  businessType: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  currency: string
  language: string
  deliveryFee: number
  minimumOrder: number
  deliveryRadius: number
  deliveryEnabled: boolean
  pickupEnabled: boolean
  dineInEnabled: boolean
  estimatedDeliveryTime?: string
  estimatedPickupTime?: string
  paymentMethods: string[]
  paymentInstructions?: string
  greetingMessage?: string
  orderNumberFormat: string
  businessHours?: any
  isTemporarilyClosed: boolean
  closureReason?: string
  closureMessage?: string
  closureStartDate?: string
  closureEndDate?: string
  categories: Category[]
  isOpen: boolean
  nextOpenTime?: string
  whatsappButtonColor? :string
  mobileCartStyle?: 'bar' | 'badge'
}

interface Category {
  id: string
  name: string
  description?: string
  image?: string
  sortOrder: number
  products: Product[]
}

interface Product {
  id: string
  name: string
  description?: string
  images: string[]
  price: number
  originalPrice?: number
  sku?: string
  stock: number
  featured: boolean
  variants: ProductVariant[]
  modifiers: ProductModifier[]
}

interface ProductVariant {
  id: string
  name: string
  price: number
  stock: number
  sku?: string
}

interface ProductModifier {
  id: string
  name: string
  price: number
  required: boolean
}

interface CartItem {
  id: string
  productId: string
  variantId?: string
  name: string
  price: number
  quantity: number
  modifiers: ProductModifier[]
  totalPrice: number
}

interface CustomerInfo {
  name: string
  phone: string
  email: string
  address: string
  address2: string
  deliveryTime: string
  specialInstructions: string
  latitude?: number
  longitude?: number
}

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'USD': return '$'
    case 'EUR': return '€'
    case 'ALL': return 'L'
    default: return '$'
  }
}

// Fixed cover image style function
const getCoverImageStyle = (storeData: any, primaryColor: string) => {
  if (storeData.coverImage) {
    return {
      backgroundImage: `url(${storeData.coverImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }
  } else {
    return {
      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)`
    }
  }
}

export default function StoreFront({ storeData }: { storeData: StoreData }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart')
      return savedCart ? JSON.parse(savedCart) : []
    }
    return []
  })
  const [showCartModal, setShowCartModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showBusinessInfoModal, setShowBusinessInfoModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<ProductModifier[]>([])
  const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState(storeData.deliveryFee)
  
  // Fixed delivery type initialization
  const getDefaultDeliveryType = () => {
    if (storeData.deliveryEnabled && storeData.pickupEnabled) {
      return 'delivery' // Default to delivery if both are enabled
    } else if (storeData.deliveryEnabled) {
      return 'delivery'
    } else if (storeData.pickupEnabled) {
      return 'pickup'
    } else if (storeData.dineInEnabled) {
      return 'dineIn'
    }
    return 'pickup' // Fallback
  }

  const [deliveryError, setDeliveryError] = useState<{
    type: 'OUTSIDE_DELIVERY_AREA' | 'DELIVERY_NOT_AVAILABLE' | 'CALCULATION_FAILED' | null
    message: string
    maxDistance?: number
  } | null>(null)

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup' | 'dineIn'>(getDefaultDeliveryType())
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: '',
    address2: '',
    deliveryTime: 'asap',
    specialInstructions: ''
  })
  const [isOrderLoading, setIsOrderLoading] = useState(false)

  // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
        localStorage.setItem('cart', JSON.stringify(cart))
        }
    }, [cart])

  const currencySymbol = getCurrencySymbol(storeData.currency)
  const translations = getStorefrontTranslations(storeData.language)
  const primaryColor = storeData.primaryColor || '#0D9488'

  // Calculate cart totals with dynamic delivery fee
  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const cartDeliveryFee = deliveryType === 'delivery' ? calculatedDeliveryFee : 0
  const cartTotal = cartSubtotal + cartDeliveryFee
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Check minimum order requirement
  const meetsMinimumOrder = cartSubtotal >= storeData.minimumOrder || deliveryType !== 'delivery'

  // Filter products
  const filteredProducts = storeData.categories.flatMap(category => 
    category.products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || category.id === selectedCategory
      return matchesSearch && matchesCategory
    }).map(product => ({ ...product, categoryName: category.name }))
  )

  // Create a helper function to check if the order can be submitted:
  const canSubmitOrder = () => {
    if (storeData.isTemporarilyClosed) return false
    if (customerInfo.deliveryTime === 'asap' && !storeData.isOpen) return false
    
    // Basic requirements
    if (cart.length === 0) return false
    if (!customerInfo.name || !customerInfo.phone) return false
    if (isOrderLoading) return false
    
    // Delivery specific checks
    if (deliveryType === 'delivery') {
      if (!customerInfo.address) return false
      if (deliveryError?.type === 'OUTSIDE_DELIVERY_AREA') return false
      if (!meetsMinimumOrder && !deliveryError) return false
    }
    
    return true
  }

 // ADD FUNCTION TO CLEAR DELIVERY ERROR:
 const handleClearDeliveryError = () => {
  setDeliveryError(null)
  setCalculatedDeliveryFee(storeData.deliveryFee)
}


// Update your delivery type change handler to clear errors:
const handleDeliveryTypeChange = (newType: 'delivery' | 'pickup' | 'dineIn') => {
  setDeliveryType(newType)
  setDeliveryError(null) // Clear delivery errors when switching types
  
  // Reset delivery fee when switching away from delivery
  if (newType !== 'delivery') {
    setCalculatedDeliveryFee(storeData.deliveryFee)
  }
}

  // Update the handleLocationChange function:
  const handleLocationChange = async (lat: number, lng: number, address: string) => {
    setCustomerInfo(prev => ({ 
      ...prev, 
      latitude: lat, 
      longitude: lng,
      address 
    }))

    // Clear any previous delivery errors
    setDeliveryError(null)

    if (deliveryType === 'delivery') {
      try {
        // Calculate delivery fee based on distance
        const response = await fetch('/api/calculate-delivery-fee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: storeData.id,
            customerLat: lat,
            customerLng: lng
          })
        })
        
        const result = await response.json()
        
        if (response.ok && result.success) {
          setCalculatedDeliveryFee(result.deliveryFee)
        } else {
          // Handle different types of delivery errors
          if (result.code === 'OUTSIDE_DELIVERY_AREA') {
            // Extract max distance from error message if available
            const maxDistanceMatch = result.error.match(/(\d+(?:\.\d+)?)km/)
            const maxDistance = maxDistanceMatch ? parseFloat(maxDistanceMatch[1]) : null
            
            setDeliveryError({
              type: 'OUTSIDE_DELIVERY_AREA',
              message: result.error,
              maxDistance: maxDistance || undefined
            })
          } else if (result.code === 'DELIVERY_NOT_AVAILABLE') {
            setDeliveryError({
              type: 'DELIVERY_NOT_AVAILABLE',
              message: result.error
            })
          } else {
            setDeliveryError({
              type: 'CALCULATION_FAILED',
              message: result.error || 'Unable to calculate delivery fee'
            })
          }
          
          // Set delivery fee to 0 when there's an error to prevent confusion
          setCalculatedDeliveryFee(0)
        }
      } catch (error) {
        console.error('Error calculating delivery fee:', error)
        setDeliveryError({
          type: 'CALCULATION_FAILED',
          message: 'Network error while calculating delivery fee'
        })
        setCalculatedDeliveryFee(storeData.deliveryFee)
      }
    }
  }

  const shouldDisableForTiming = customerInfo.deliveryTime === 'asap' && !storeData.isOpen

  const openProductModal = (product: Product) => {
    if (storeData.isTemporarilyClosed || shouldDisableForTiming) return
    
    setSelectedProduct(product)
    setSelectedVariant(product.variants.length > 0 ? product.variants[0] : null)
    setSelectedModifiers([])
    setShowProductModal(true)
  }


  const getFilteredProducts = () => {
    // @ts-ignore
    let products = []
  
    if (selectedCategory === 'all') {
      // Get all products from all categories
      products = storeData.categories.flatMap(category => 
        category.products.map(product => ({ 
          ...product, 
          categoryName: category.name,
          categoryId: category.id 
        }))
      )
    } else {
      // Get products from selected category only
      const category = storeData.categories.find(cat => cat.id === selectedCategory)
      if (category) {
        products = category.products.map(product => ({ 
          ...product, 
          categoryName: category.name,
          categoryId: category.id 
        }))
      }
    }
  
    // Apply search filter
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase().trim()
       // @ts-ignore
      products = products.filter(product => {
        // Search in product name, description, and category name
        const nameMatch = product.name.toLowerCase().includes(searchTermLower)
        const descriptionMatch = product.description?.toLowerCase().includes(searchTermLower) || false
        const categoryMatch = product.categoryName.toLowerCase().includes(searchTermLower)
        
        // Also search in modifiers and variants
         // @ts-ignore
        const modifierMatch = product.modifiers?.some(modifier => 
          modifier.name.toLowerCase().includes(searchTermLower)
        ) || false
        
         // @ts-ignore
        const variantMatch = product.variants?.some(variant => 
          variant.name.toLowerCase().includes(searchTermLower)
        ) || false
  
        return nameMatch || descriptionMatch || categoryMatch || modifierMatch || variantMatch
      })
    }
  
    return products
  }

  const addToCart = (product: Product, variant?: ProductVariant, modifiers: ProductModifier[] = []) => {
    const basePrice = variant?.price || product.price
    const modifierPrice = modifiers.reduce((sum, mod) => sum + mod.price, 0)
    const totalPrice = basePrice + modifierPrice

    const cartItem: CartItem = {
      id: `${product.id}-${variant?.id || 'default'}-${modifiers.map(m => m.id).join(',')}`,
      productId: product.id,
      variantId: variant?.id,
      name: `${product.name}${variant ? ` (${variant.name})` : ''}`,
      price: basePrice,
      quantity: 1,
      modifiers,
      totalPrice
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === cartItem.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
          totalPrice: (updated[existingIndex].quantity + 1) * (basePrice + modifierPrice)
        }
        return updated
      }
      return [...prev, cartItem]
    })

    setShowProductModal(false)
  }

  const updateCartItemQuantity = (itemId: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change)
          if (newQuantity === 0) return null  // This removes the item
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * (item.price + item.modifiers.reduce((sum, mod) => sum + mod.price, 0))
          }
        }
        return item
      }).filter(Boolean) as CartItem[]  // This filters out null values
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  const submitOrder = async () => {
    if (storeData.isTemporarilyClosed) {
      alert(translations.storeTemporarilyClosed || 'Store is temporarily closed')
      return
    }
  
    // Add this check for "now" orders when store is closed
    if (customerInfo.deliveryTime === 'asap' && !storeData.isOpen) {
      alert(translations.closed || 'Store is closed')
      return
    }
  
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Please fill in required customer information')
      return
    }

    if (!customerInfo.name || !customerInfo.phone) {
      alert('Please fill in required customer information')
      return
    }

    if (deliveryType === 'delivery' && !customerInfo.address) {
      alert('Please provide delivery address')
      return
    }

    if (!meetsMinimumOrder) {
      alert(`${translations.minimumOrder} ${currencySymbol}${storeData.minimumOrder.toFixed(2)} ${translations.forDelivery}`)
      return
    }

    setIsOrderLoading(true)

    try {
      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        deliveryAddress: `${customerInfo.address} ${customerInfo.address2}`.trim(),
        deliveryType,
        deliveryTime: customerInfo.deliveryTime === 'asap' ? null : customerInfo.deliveryTime,
        paymentMethod: storeData.paymentMethods[0] || 'CASH',
        specialInstructions: customerInfo.specialInstructions,
        latitude: customerInfo.latitude,
        longitude: customerInfo.longitude,
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          modifiers: item.modifiers
        })),
        subtotal: cartSubtotal,
        deliveryFee: cartDeliveryFee,
        tax: 0,
        discount: 0,
        total: cartTotal
      }

      const response = await fetch(`/api/storefront/${storeData.slug}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.success) {
        window.open(result.whatsappUrl, '_blank')
        setCart([])
        setShowCartModal(false)
        alert('Order sent to WhatsApp!')
      } else {
        alert('Failed to create order. Please try again.')
      }
    } catch (error) {
      console.error('Order submission error:', error)
      alert('Failed to submit order. Please try again.')
    } finally {
      setIsOrderLoading(false)
    }
  }

  // Fixed getDeliveryOptions function
  const getDeliveryOptions = () => {
    const options = []
    if (storeData.deliveryEnabled) {
      options.push({ key: 'delivery', label: translations.delivery || 'Delivery', icon: Package })
    }
    if (storeData.pickupEnabled) {
      options.push({ key: 'pickup', label: translations.pickup || 'Pickup', icon: Store })
    }
    if (storeData.dineInEnabled) {
      options.push({ key: 'dineIn', label: translations.dineIn || 'Dine In', icon: UtensilsCrossed })
    }
    return options
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: storeData.fontFamily }}>

      {/* Header Section - FIXED COVER IMAGE */}
      <div className="bg-white">
        <div className="max-w-[75rem] mx-auto">
          {/* Cover Image Section - FIXED: No gradient overlay when cover image exists */}
          <div 
            className="relative h-[200px] sm:h-[250px] md:h-[280px] md:rounded-xl overflow-hidden"
            style={getCoverImageStyle(storeData, primaryColor)}
          >
         {/* Icons in top right */}
<div className="absolute top-4 sm:top-5 right-4 sm:right-5 flex gap-2 sm:gap-3">
  <button 
    onClick={() => setShowShareModal(true)}
    className="w-8 h-8 sm:w-10 sm:h-10 bg-black bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
  >
    <Share2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
  </button>
  <button 
    className="w-8 h-8 sm:w-10 sm:h-10 bg-black bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
    // @ts-ignore
    onClick={() => document.querySelector('.search-input')?.focus()}
  >
    <Search className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
  </button>
  <button 
    onClick={() => setShowBusinessInfoModal(true)}
    className="w-8 h-8 sm:w-10 sm:h-10 bg-black bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
  >
    <Info className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
  </button>
</div>
          </div>

          <div className="bg-white rounded-b-xl px-4 md:px-0 pb-0 pt-4 relative">
            {/* Logo */}
            <div 
              className="absolute -top-8 sm:-top-10 left-6 sm:left-6 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold shadow-xl"
              style={{ 
                backgroundColor: 'white',
                color: primaryColor
              }}
            >
              {storeData.logo ? (
                <img src={storeData.logo} alt={storeData.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                storeData.name.charAt(0)
              )}
            </div>

            <div className="pt-6 sm:pt-8">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{storeData.name}</h1>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                  storeData.isOpen && !storeData.isTemporarilyClosed
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {storeData.isTemporarilyClosed 
                    ? translations.temporarilyClosed 
                    : storeData.isOpen ? translations.open : translations.closed}
                </span>
              </div>
              
              {/* Desktop Delivery Switcher - Right side */}
              <div className="hidden lg:block flex-shrink-0">
                <DeliveryTypeSwitcher
                  deliveryType={deliveryType}
                  setDeliveryType={handleDeliveryTypeChange} // Use the function, not setDeliveryType
                  deliveryOptions={getDeliveryOptions()}
                  primaryColor={primaryColor}
                  disabled={false}
                />
              </div>
          </div>
                        
              {storeData.description && (
                <p className="text-gray-500 text-md sm:text-md mb-3">{storeData.description}</p>
              )}
              
              <div className="space-y-2 sm:space-y-0">
              {/* Address */}
              {storeData.address && (
                <div className="flex items-center gap-1 mb-2 text-gray-500">
                  <MapPin className="w-4 h-4" style={{ color: storeData.primaryColor }} />
                  <span className="text-md">{storeData.address}</span>
                </div>
              )}
              
              {/* Time and Fee - Dynamic based on delivery type */}
              <div className="flex items-center gap-4 sm:gap-5 text-gray-500">
                {(deliveryType === 'delivery' ? storeData.estimatedDeliveryTime : storeData.estimatedPickupTime) && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 flex-shrink-0" style={{ color: storeData.primaryColor }} />
                    <span className="text-md">
                      {deliveryType === 'delivery' 
                        ? storeData.estimatedDeliveryTime 
                        : storeData.estimatedPickupTime || '15-20 min'}
                    </span>
                  </div>
                )}
                {deliveryType === 'delivery' ? (
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4 flex-shrink-0" style={{ color: storeData.primaryColor }} />
                <span className="text-md">
                  {calculatedDeliveryFee > 0 
                    ? `${currencySymbol}${calculatedDeliveryFee.toFixed(2)}`
                    : translations.freeDelivery || 'Free Delivery'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Store className="w-4 h-4 flex-shrink-0" style={{ color: storeData.primaryColor }} />
                <span className="text-md">{translations.pickupAvailable || 'Pickup available'}</span>
              </div>
            )}
          </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[75rem] mx-auto px-4 md:px-0 py-6 grid lg:grid-cols-3 gap-8">
        {/* Left Side - Menu */}
        <div className="lg:col-span-2">
          {/* Mobile Delivery Type Switcher */}
          <div className="lg:hidden mb-6">
          <DeliveryTypeSwitcher
            deliveryType={deliveryType}
            setDeliveryType={handleDeliveryTypeChange} // Use the function, not setDeliveryType
            deliveryOptions={getDeliveryOptions()}
            primaryColor={primaryColor}
            disabled={false} // Disable when store closed
          />
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-2xl p-0 mb-4 md:mb-6">
  <div className="relative">
    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
    <input
      type="text"
      placeholder={searchTerm ? `Searching for "${searchTerm}"...` : (translations.search || "Search for dishes, ingredients...")}
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value)
        // Auto-switch to "All" category when searching to show all results
        if (e.target.value.trim() && selectedCategory !== 'all') {
          setSelectedCategory('all')
        }
      }}
      className="search-input w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl text-base outline-none focus:border-2 transition-colors"
      style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
      onFocus={(e) => e.target.style.borderColor = primaryColor}
      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
      disabled={false}
    />
    {/* Clear search button */}
    {searchTerm && (
      <button
        onClick={() => setSearchTerm('')}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
      >
        <X className="w-3 h-3 text-gray-600" />
      </button>
    )}
  </div>
  
  {/* Search suggestions/results count */}
  {searchTerm && (
    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
      <p className="text-sm text-gray-600">
        {getFilteredProducts().length === 0 
          ? `No results for "${searchTerm}"`
          : `${getFilteredProducts().length} result${getFilteredProducts().length !== 1 ? 's' : ''} for "${searchTerm}"`
        }
      </p>
    </div>
  )}
</div>

          {/* Category Tabs */}
          <div className="flex gap-1 mb-6 overflow-x-auto">
            <button
                onClick={() => {
                setSelectedCategory('all')
                // Keep search term when switching to "All"
                }}
                disabled={false}
                className={`px-5 py-3 font-medium transition-all whitespace-nowrap border-b-2 relative ${
                selectedCategory === 'all'
                    ? 'border-b-2'
                    : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                }`}
                style={{ 
                color: selectedCategory === 'all' ? primaryColor : undefined,
                borderBottomColor: selectedCategory === 'all' ? primaryColor : 'transparent'
                }}
            >
                {translations.all || 'All'}
                {searchTerm && selectedCategory === 'all' && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {getFilteredProducts().length}
                </span>
                )}
            </button>
            {storeData.categories.map(category => {
                // Count products in this category that match search
                const categoryProductCount = searchTerm 
                ? category.products.filter(product => {
                    const searchTermLower = searchTerm.toLowerCase().trim()
                    return product.name.toLowerCase().includes(searchTermLower) ||
                            product.description?.toLowerCase().includes(searchTermLower) ||
                            category.name.toLowerCase().includes(searchTermLower)
                    }).length
                : category.products.length
                
                return (
                <button
                    key={category.id}
                    onClick={() => {
                    setSelectedCategory(category.id)
                    // Clear search when switching to specific category
                    if (searchTerm) {
                        setSearchTerm('')
                    }
                    }}
                    disabled={false}
                    className={`px-5 py-3 font-medium transition-all whitespace-nowrap border-b-2 relative ${
                    selectedCategory === category.id
                        ? 'border-b-2'
                        : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                    }`}
                    style={{ 
                    color: selectedCategory === category.id ? primaryColor : undefined,
                    borderBottomColor: selectedCategory === category.id ? primaryColor : 'transparent'
                    }}
                >
                    {category.name}
                    {searchTerm && selectedCategory !== 'all' && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {categoryProductCount}
                    </span>
                    )}
                </button>
                )
            })}
          </div>

          <StoreClosure 
  storeData={storeData} 
  primaryColor={primaryColor} 
  translations={translations} 
/>
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {(() => {
                const filteredProducts = getFilteredProducts()
                
                if (storeData.categories.length === 0) {
                return (
                    <div className="col-span-full">
                    <EmptyState 
                        type="no-categories"
                        primaryColor={primaryColor}
                        translations={translations}
                    />
                    </div>
                )
                }
                
                if (filteredProducts.length === 0) {
                if (searchTerm) {
                    return (
                    <div className="col-span-full">
                        <EmptyState 
                        type="search-empty"
                        primaryColor={primaryColor}
                        translations={translations}
                        searchTerm={searchTerm}
                        onClearSearch={() => setSearchTerm('')}
                        onShowAll={() => {
                            setSearchTerm('')
                            setSelectedCategory('all')
                        }}
                        />
                    </div>
                    )
                } else if (selectedCategory !== 'all') {
                    return (
                    <div className="col-span-full">
                        <EmptyState 
                        type="category-empty"
                        primaryColor={primaryColor}
                        translations={translations}
                        onShowAll={() => setSelectedCategory('all')}
                        />
                    </div>
                    )
                } else {
                    return (
                    <div className="col-span-full">
                        <EmptyState 
                        type="no-products"
                        primaryColor={primaryColor}
                        translations={translations}
                        />
                    </div>
                    )
                }
                }
                
                return filteredProducts.map(product => (
                <ProductCard 
                    key={product.id} 
                    product={product} 
                    onOpenModal={openProductModal}
                    primaryColor={primaryColor}
                    currencySymbol={currencySymbol}
                    translations={translations}
                    disabled={storeData.isTemporarilyClosed || shouldDisableForTiming}
                    // searchTerm={searchTerm} // Pass search term for highlighting
                />
                ))
            })()}
            </div>
        </div>

        {/* Right Side - Order Panel (Desktop) */}
        <div className="hidden lg:block">
          
        <OrderPanel 
          storeData={storeData}
          cart={cart}
          deliveryType={deliveryType}
          setDeliveryType={handleDeliveryTypeChange} // Fixed function call
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          cartSubtotal={cartSubtotal}
          cartDeliveryFee={cartDeliveryFee}
          cartTotal={cartTotal}
          meetsMinimumOrder={meetsMinimumOrder}
          currencySymbol={currencySymbol}
          updateCartItemQuantity={updateCartItemQuantity}
          removeFromCart={removeFromCart}
          submitOrder={submitOrder}
          isOrderLoading={isOrderLoading}
          deliveryOptions={getDeliveryOptions()}
          primaryColor={primaryColor}
          translations={translations}
          onLocationChange={handleLocationChange}
          // @ts-ignore
          deliveryError={deliveryError}
          onClearDeliveryError={handleClearDeliveryError}
          canSubmitOrder={canSubmitOrder}
        />
        </div>
      </div>

      {/* Mobile Cart Bar */}
      {cartItemCount > 0 && !storeData.isTemporarilyClosed && !shouldDisableForTiming && storeData.mobileCartStyle !== 'badge' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0  px-3  bg-white shadow-xl p-4 z-50">
            <button
            onClick={() => setShowCartModal(true)}
            className="w-full py-4 rounded-xl px-6 font-semibold text-white flex items-center justify-between shadow-lg"
            style={{ backgroundColor: storeData.whatsappButtonColor || primaryColor }}
            >
            <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
                </svg>
                <span>{cartItemCount} item{cartItemCount !== 1 ? 's' : ''}</span>
            </div>
            <span>{currencySymbol}{cartTotal.toFixed(2)}</span>
            </button>
        </div>
        )}

      {/* Mobile Cart Modal */}
      {showCartModal && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-hidden">
            <div className="p-4  flex items-center justify-between">
              <h2 className="text-lg font-semibold">{translations.yourOrder}</h2>
              <button
                onClick={() => setShowCartModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(85vh-180px)]">
            <OrderPanel 
              storeData={storeData}
              cart={cart}
              deliveryType={deliveryType}
              setDeliveryType={handleDeliveryTypeChange} // Fixed function call
              customerInfo={customerInfo}
              setCustomerInfo={setCustomerInfo}
              cartSubtotal={cartSubtotal}
              cartDeliveryFee={cartDeliveryFee}
              cartTotal={cartTotal}
              meetsMinimumOrder={meetsMinimumOrder}
              currencySymbol={currencySymbol}
              updateCartItemQuantity={updateCartItemQuantity}
              removeFromCart={removeFromCart}
              submitOrder={submitOrder}
              isOrderLoading={isOrderLoading}
              deliveryOptions={getDeliveryOptions()}
              primaryColor={primaryColor}
              translations={translations}
              onLocationChange={handleLocationChange}
              isMobile={true}
              // @ts-ignore
              deliveryError={deliveryError}
              onClearDeliveryError={handleClearDeliveryError}
              canSubmitOrder={canSubmitOrder}
            />
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && selectedProduct && !storeData.isTemporarilyClosed && !shouldDisableForTiming && (
        <ProductModal
          product={selectedProduct}
          selectedVariant={selectedVariant}
          setSelectedVariant={setSelectedVariant}
          selectedModifiers={selectedModifiers}
          setSelectedModifiers={setSelectedModifiers}
          onAddToCart={addToCart}
          onClose={() => setShowProductModal(false)}
          currencySymbol={currencySymbol}
          primaryColor={primaryColor}
          translations={translations}
        />
      )}

      {/* Business Info Modal */}
      <BusinessInfoModal
        isOpen={showBusinessInfoModal}
        onClose={() => setShowBusinessInfoModal(false)}
        storeData={storeData}
        primaryColor={primaryColor}
        translations={translations}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        storeData={storeData}
        primaryColor={primaryColor}
        translations={translations}
      />

      {/* Powered by WaveOrder Footer */}
      <footer className="bg-white mt-8">
        <div className="max-w-[75rem] mx-auto px-5 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              {translations.poweredBy || 'Powered by'}{' '}
              <a 
                href="https://waveorder.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium hover:underline"
                style={{ color: primaryColor }}
              >
                WaveOrder
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Cart Badge (Mobile) */}
      {cartItemCount > 0 && !storeData.isTemporarilyClosed && !shouldDisableForTiming && storeData.mobileCartStyle === 'badge' && (
        <div 
            className="lg:hidden fixed bottom-10 right-5 w-15 h-15 rounded-full flex items-center justify-center shadow-xl cursor-pointer z-40"
            style={{ backgroundColor: storeData.whatsappButtonColor || primaryColor }}
            onClick={() => setShowCartModal(true)}
        >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
            </svg>
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
            {cartItemCount}
            </span>
        </div>
        )}
    </div>
  )
}

// Add this component before your main StoreFront component

function DeliveryErrorMessage({ 
  error, 
  primaryColor, 
  translations,
  onClearAddress,
  currencySymbol 
}: {
  error: {
    type: 'OUTSIDE_DELIVERY_AREA' | 'DELIVERY_NOT_AVAILABLE' | 'CALCULATION_FAILED'
    message: string
    maxDistance?: number
  }
  primaryColor: string
  translations: any
  onClearAddress: () => void
  currencySymbol: string
}) {
  const getErrorContent = () => {
    switch (error.type) {
      case 'OUTSIDE_DELIVERY_AREA':
        return {
          icon: MapPin,
          title: translations.outsideDeliveryArea,
          description: error.maxDistance 
            ? `${translations.outsideDeliveryAreaDesc} ${error.maxDistance}km`
            : translations.selectDifferentArea,
          actionText: translations.tryDifferentAddress,
          showAction: true,
          color: 'red'
        }
      case 'DELIVERY_NOT_AVAILABLE':
        return {
          icon: AlertCircle,
          title: translations.deliveryNotAvailable,
          description: error.message,
          actionText: null,
          showAction: false,
          color: 'orange'
        }
      case 'CALCULATION_FAILED':
        return {
          icon: AlertTriangle,
          title: translations.deliveryCalculationFailed,
          description: error.message,
          actionText: translations.tryDifferentAddress,
          showAction: true,
          color: 'yellow'
        }
      default:
        return {
          icon: AlertCircle,
          title: translations.deliveryNotAvailable,
          description: error.message,
          actionText: null,
          showAction: false,
          color: 'red'
        }
    }
  }

  const content = getErrorContent()
  const IconComponent = content.icon

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          title: 'text-red-900',
          description: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700'
        }
      case 'orange':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          title: 'text-orange-900',
          description: 'text-orange-700',
          button: 'bg-orange-600 hover:bg-orange-700'
        }
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          title: 'text-yellow-900',
          description: 'text-yellow-700',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        }
      default:
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          title: 'text-red-900',
          description: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700'
        }
    }
  }

  const colorClasses = getColorClasses(content.color)

  return (
    <div className={`${colorClasses.bg} ${colorClasses.border} border rounded-xl p-4 mb-4`}>
      <div className="flex items-start">
        <div className={`w-10 h-10 ${colorClasses.iconBg} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
          <IconComponent className={`w-5 h-5 ${colorClasses.iconColor}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${colorClasses.title} mb-1`}>
            {content.title}
          </h3>
          <p className={`${colorClasses.description} text-sm leading-relaxed mb-3`}>
            {content.description}
          </p>
          
          {content.showAction && content.actionText && (
            <button
              onClick={onClearAddress}
              className={`inline-flex items-center px-4 py-2 ${colorClasses.button} text-white rounded-lg text-sm font-medium transition-colors`}
            >
              <Search className="w-4 h-4 mr-2" />
              {content.actionText}
            </button>
          )}
          
          {/* Additional info for outside delivery area */}
          {error.type === 'OUTSIDE_DELIVERY_AREA' && error.maxDistance && (
            <div className="mt-3 p-3 bg-white bg-opacity-60 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">{translations.maxDeliveryDistance}:</span> {error.maxDistance}km
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Empty State Component
function EmptyState({ 
  type, 
  primaryColor, 
  translations,
  onClearSearch,
  onShowAll,
  searchTerm
}: { 
  type: 'no-categories' | 'no-products' | 'category-empty' | 'search-empty'
  primaryColor: string
  translations: any
  onClearSearch?: () => void
  onShowAll?: () => void
  searchTerm?: string
}) {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-categories':
        return {
          icon: Package,
          title: translations.comingSoon || 'Coming Soon',
          description: translations.checkBackLater || 'Check back later for amazing products!',
          showActions: false
        }
      case 'no-products':
        return {
          icon: Package,
          title: translations.comingSoon || 'Coming Soon',
          description: translations.checkBackLater || 'Check back later for amazing products!',
          showActions: false
        }
      case 'category-empty':
        return {
          icon: Package,
          title: translations.noProductsInCategory || 'No products in this category',
          description: translations.noProductsInCategoryDescription || 'This category is currently empty. Browse other categories or check back later.',
          showActions: true,
          actionText: translations.browseAllProducts || 'Browse All Products',
          actionCallback: onShowAll
        }
        case 'search-empty':
        return {
            icon: Search,
            title: `${translations.noProductsFound || 'No results found'} "${searchTerm}"`,
            description: translations.noProductsFoundDescription || 'Try a different search term or browse all products',
            showActions: true,
            actionText: translations.tryDifferentSearch || 'Clear Search',
            actionCallback: onClearSearch,
            secondaryActionText: translations.browseAllProducts || 'Browse All Products',
            secondaryActionCallback: onShowAll
        }
      default:
        return {
          icon: Package,
          title: translations.comingSoon || 'Coming Soon',
          description: translations.checkBackLater || 'Check back later for amazing products!',
          showActions: false
        }
    }
  }

  const content = getEmptyStateContent()
  const IconComponent = content.icon

  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-md mx-auto">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <IconComponent 
            className="w-10 h-10"
            style={{ color: primaryColor }}
          />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {content.title}
        </h3>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          {content.description}
        </p>
        
        {content.showActions && (
          <div className="space-y-3">
            {content.actionCallback && (
              <button
                onClick={content.actionCallback}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                {content.actionText}
              </button>
            )}
            
            {content.secondaryActionCallback && (
              <button
                onClick={content.secondaryActionCallback}
                className="block w-full sm:w-auto px-6 py-3 border-2 rounded-xl font-medium hover:bg-gray-50 transition-colors mx-auto"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                {content.secondaryActionText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Fixed Product Card Component - Properly disabled when store is closed
function ProductCard({ 
  product, 
  onOpenModal, 
  primaryColor, 
  currencySymbol,
  translations,
  disabled = false
}: { 
  product: Product & { categoryName?: string }
  onOpenModal: (product: Product) => void
  primaryColor: string
  currencySymbol: string
  translations: any
  disabled?: boolean
}) {
  const hasImage = product.images.length > 0

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-shadow ${
      disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'
    }`}>
      <div 
        className="flex items-start p-5"
        onClick={() => !disabled && onOpenModal(product)}
      >
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-base text-gray-900 leading-tight">
                  {product.name}
                </h3>
                {product.featured && (
                  <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-medium whitespace-nowrap">
                    {translations.popular || 'Popular'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Reserve space for description with proper line clamping */}
            <div className="mb-1">
              {product.description && (
                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                  {product.description}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <span className="font-bold text-lg" style={{ color: primaryColor }}>
                  {currencySymbol}{product.price.toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-gray-500 line-through text-sm">
                    {currencySymbol}{product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!disabled && product.stock > 0) {
                    onOpenModal(product)
                  }
                }}
                disabled={disabled || product.stock === 0}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform flex-shrink-0"
                style={{ backgroundColor: disabled ? '#9ca3af' : primaryColor }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {/* Stock info */}
            {product.stock === 0 && (
              <p className="text-red-600 text-sm mt-2">{translations.outOfStock || 'Out of stock'}</p>
            )}
          </div>
        </div>
        
        {hasImage && (
          <div className="w-20 h-20 ml-4 flex-shrink-0">
            <img 
              src={product.images[0]} 
              alt={product.name}
              className={`w-full h-full object-cover rounded-lg ${disabled ? 'filter grayscale' : ''}`}
            />
          </div>
        )}
        
        {!hasImage && (
          <div className={`w-20 h-20 ml-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0 ${
            disabled ? 'filter grayscale' : ''
          }`}>
            <Package className="w-7 h-7" />
          </div>
        )}
      </div>
    </div>
  )
}
  

// Improved Product Modal Component - Fixed footer visibility and scrolling
function ProductModal({
  product,
  selectedVariant,
  setSelectedVariant,
  selectedModifiers,
  setSelectedModifiers,
  onAddToCart,
  onClose,
  currencySymbol,
  primaryColor,
  translations
}: {
  product: Product
  selectedVariant: ProductVariant | null
  setSelectedVariant: (variant: ProductVariant | null) => void
  selectedModifiers: ProductModifier[]
  setSelectedModifiers: (modifiers: ProductModifier[]) => void
  onAddToCart: (product: Product, variant?: ProductVariant, modifiers?: ProductModifier[]) => void
  onClose: () => void
  currencySymbol: string
  primaryColor: string
  translations: any
}) {
  const [quantity, setQuantity] = useState(1)

  const basePrice = selectedVariant?.price || product.price
  const modifierPrice = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0)
  const totalPrice = (basePrice + modifierPrice) * quantity

  const toggleModifier = (modifier: ProductModifier) => {
      // @ts-ignore
    setSelectedModifiers(prev => {
       // @ts-ignore
      const exists = prev.find(m => m.id === modifier.id)
      if (exists) {
           // @ts-ignore
        return prev.filter(m => m.id !== modifier.id)
      } else {
        return [...prev, modifier]
      }
    })
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, selectedVariant || undefined, selectedModifiers)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header - Fixed */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Conditional Image Section */}
            {product.images.length > 0 && (
              <div className="relative">
                <div className="w-full max-w-sm mx-auto aspect-square">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-contain rounded-2xl"
                  />
                </div>
                {product.featured && (
                  <span className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                    {translations.popular || 'Popular'}
                  </span>
                )}
              </div>
            )}
            
            {product.description && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Variants */}
            {product.variants.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
                  {translations.chooseSize || 'Choose Size'}
                </h3>
                <div className="space-y-3">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'bg-blue-50'
                          : 'border-gray-200 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                      style={{
                        borderColor: selectedVariant?.id === variant.id ? primaryColor : undefined
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800">{variant.name}</span>
                        <span className="font-bold" style={{ color: primaryColor }}>
                          {currencySymbol}{variant.price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Modifiers */}
            {product.modifiers.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
                  {translations.addExtras || 'Add Extras'}
                </h3>
                <div className="space-y-3">
                  {product.modifiers.map(modifier => (
                    <button
                      key={modifier.id}
                      onClick={() => toggleModifier(modifier)}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                        selectedModifiers.find(m => m.id === modifier.id)
                          ? 'bg-green-50 border-green-400'
                          : 'border-gray-200 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-gray-800">{modifier.name}</span>
                          {modifier.required && (
                            <span className="text-red-500 text-sm ml-2">({translations.required || 'Required'})</span>
                          )}
                        </div>
                        <span className="font-bold text-green-600">
                          +{currencySymbol}{modifier.price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
                {translations.quantity || 'Quantity'}
              </h3>
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Minus className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-2xl font-bold w-16 text-center" style={{ color: primaryColor }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-6 bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-700">{translations.total || 'Total'}</span>
            <span className="text-2xl font-bold" style={{ color: primaryColor }}>
              {currencySymbol}{totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full py-4 rounded-xl text-white font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            {translations.addToCart || 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Update the OrderPanel component props to include delivery error handling:
function OrderPanel({
  storeData,
  cart,
  deliveryType,
  setDeliveryType,
  customerInfo,
  setCustomerInfo,
  cartSubtotal,
  cartDeliveryFee,
  cartTotal,
  meetsMinimumOrder,
  currencySymbol,
  updateCartItemQuantity,
  removeFromCart,
  submitOrder,
  isOrderLoading,
  deliveryOptions,
  primaryColor,
  translations,
  onLocationChange,
  isMobile = false,
  deliveryError = null,
  onClearDeliveryError,
  canSubmitOrder
}: {
  storeData: any
  cart: CartItem[]
  deliveryType: 'delivery' | 'pickup' | 'dineIn'
  setDeliveryType: (type: 'delivery' | 'pickup' | 'dineIn') => void
  customerInfo: CustomerInfo
  setCustomerInfo: (info: CustomerInfo) => void
  cartSubtotal: number
  cartDeliveryFee: number
  cartTotal: number
  meetsMinimumOrder: boolean
  currencySymbol: string
  updateCartItemQuantity: (itemId: string, change: number) => void
  removeFromCart: (itemId: string) => void
  submitOrder: () => void
  isOrderLoading: boolean
  deliveryOptions: Array<{ key: string; label: string; icon: any }>
  primaryColor: string
  translations: any
  onLocationChange?: (lat: number, lng: number, address: string) => void
  isMobile?: boolean
  deliveryError?: {
    type: 'OUTSIDE_DELIVERY_AREA' | 'DELIVERY_NOT_AVAILABLE' | 'CALCULATION_FAILED'
    message: string
    maxDistance?: number
  } | null
  onClearDeliveryError?: () => void
  canSubmitOrder: () => boolean
}) {
  
  // Helper function to clear address and delivery error
  const handleClearAddress = () => {
     // @ts-ignore
    setCustomerInfo(prev => ({ 
      ...prev, 
      // @ts-ignore
      address: '', 
       // @ts-ignore
      latitude: undefined, 
       // @ts-ignore
      longitude: undefined 
    }))
    if (onClearDeliveryError) {
      onClearDeliveryError()
    }
  }

  return (
    <div className={`${isMobile ? 'p-4' : 'sticky top-8'}`}>
      <div>
        <h2 className="text-xl font-bold mb-6">{translations.orderDetails || 'Your Order'}</h2>
        
        {/* Desktop Delivery Type Toggle */}
        {deliveryOptions.length > 1 && (
          <div className="mb-6">
            <div className={`grid gap-2 ${deliveryOptions.length === 2 ? 'grid-cols-2' : deliveryOptions.length === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
              {deliveryOptions.map(option => {
                const IconComponent = option.icon
                return (
                  <button
                    key={option.key}
                    onClick={() => setDeliveryType(option.key as any)}
                    disabled={false}
                    className={`px-4 py-3 border-2 rounded-xl text-center transition-all flex items-center justify-center ${
                      deliveryType === option.key
                        ? 'text-white'
                        : 'text-gray-700 border-gray-200 hover:border-gray-200'
                    }`}
                    style={{ 
                      backgroundColor: deliveryType === option.key ? primaryColor : 'white',
                      borderColor: deliveryType === option.key ? primaryColor : undefined
                    }}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Customer Information */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.name || 'Name'} *</label>
            <input
              type="text"
              required
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
              onFocus={(e) =>  e.target.style.borderColor = primaryColor}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              placeholder="Your full name"
            />
          </div>
          
          <PhoneInput
            value={customerInfo.phone}
            onChange={(phone) => setCustomerInfo({ ...customerInfo, phone })}
            storeData={storeData}
            primaryColor={primaryColor}
            disabled={false}
            required={true}
            translations={translations}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{translations.email || 'Email'}</label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              disabled={false}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
              onFocus={(e) => e.target.style.borderColor = primaryColor}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              placeholder="your.email@example.com"
            />
          </div>

          {/* Conditional Fields based on delivery type */}
          {deliveryType === 'delivery' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{translations.addressLine1 || 'Address'} *</label>
                <AddressAutocomplete
                  value={customerInfo.address}
                  onChange={(address) => setCustomerInfo({ ...customerInfo, address })}
                  placeholder={translations.streetAddress || 'Street address'}
                  required
                  primaryColor={primaryColor}
                  onLocationChange={onLocationChange}
                  storeData={storeData}
                />
              </div>

              {/* SHOW DELIVERY ERROR MESSAGE HERE */}
              {deliveryError && (
                <DeliveryErrorMessage
                  error={deliveryError}
                  primaryColor={primaryColor}
                  translations={translations}
                  onClearAddress={handleClearAddress}
                  currencySymbol={currencySymbol}
                />
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{translations.addressLine2 || 'Address Line 2'}</label>
                <input
                  type="text"
                  value={customerInfo.address2}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address2: e.target.value })}
                  disabled={false}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                  onFocus={(e) => e.target.style.borderColor = primaryColor}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                  placeholder={translations.apartment || 'Apartment, suite, etc.'}
                />
              </div>
            </>
          ) : (
            /* Show store location for pickup */
            <StoreLocationMap 
              storeData={storeData}
              primaryColor={primaryColor}
              translations={translations}
            />
          )}

          {/* Enhanced Time Selection */}
          <TimeSelection
            deliveryType={deliveryType}
            selectedTime={customerInfo.deliveryTime}
            onTimeChange={(time) => setCustomerInfo({ ...customerInfo, deliveryTime: time })}
            storeData={storeData}
            primaryColor={primaryColor}
            translations={translations}
          />
        </div>

        {/* Cart Items */}
        {cart.length > 0 && (
          <div className="border-t-2 border-gray-200 pt-6 mb-6">
            <h3 className="font-semibold mb-4">{translations.cartItems || 'Cart Items'}</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {cart.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    {item.modifiers.length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        + {item.modifiers.map((m: any) => m.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm font-semibold mt-1">{currencySymbol}{item.totalPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <button
                      onClick={() => updateCartItemQuantity(item.id, -1)}
                      disabled={storeData.isTemporarilyClosed || (customerInfo.deliveryTime === 'asap' && !storeData.isOpen)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartItemQuantity(item.id, 1)}
                      disabled={storeData.isTemporarilyClosed || (customerInfo.deliveryTime === 'asap' && !storeData.isOpen)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Summary */}
        {cart.length > 0 && (
          <div className="border-t-2 border-gray-200 pt-6 mb-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{translations.subtotal || 'Subtotal'}</span>
                <span>{currencySymbol}{cartSubtotal.toFixed(2)}</span>
              </div>
              {cartDeliveryFee > 0 && !deliveryError && (
                <div className="flex justify-between text-sm">
                  <span>{deliveryType === 'delivery' ? (translations.deliveryFee || 'Delivery Fee') : (translations.serviceFee || 'Service Fee')}</span>
                  <span>{currencySymbol}{cartDeliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg border-t-2 border-gray-200 pt-3">
                <span>{translations.total || 'Total'}</span>
                <span style={{ color: primaryColor }}>{currencySymbol}{cartTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Minimum Order Warning - Only for delivery and when no delivery error */}
        {!meetsMinimumOrder && deliveryType === 'delivery' && !deliveryError && !storeData.isTemporarilyClosed && !(customerInfo.deliveryTime === 'asap' && !storeData.isOpen) && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6">
            <p className="text-yellow-800 text-sm">
              {translations.minimumOrder || 'Minimum order'} {currencySymbol}{storeData.minimumOrder.toFixed(2)} {translations.forDelivery || 'for delivery'}. 
              Add {currencySymbol}{(storeData.minimumOrder - cartSubtotal).toFixed(2)} more to proceed.
            </p>
          </div>
        )}

        {/* Special Instructions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{translations.specialInstructions || 'Special Instructions'}</label>
          <textarea
            value={customerInfo.specialInstructions}
            onChange={(e) => setCustomerInfo({ ...customerInfo, specialInstructions: e.target.value })}
            disabled={false}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
            onFocus={(e) => e.target.style.borderColor = primaryColor}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            rows={3}
            placeholder={translations.anySpecialRequests || 'Any special requests...'}
          />
        </div>

        {/* Payment Info */}
        {storeData.paymentInstructions && (
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-gray-600">{storeData.paymentInstructions}</p>
            </div>
          </div>
        )}

        {/* Order Button */}
        <button
          onClick={submitOrder}
          disabled={!canSubmitOrder()}
          className={`w-full py-4 rounded-xl text-white font-semibold transition-all hover:opacity-90 flex items-center justify-center ${
            !canSubmitOrder() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          style={{ backgroundColor: storeData.whatsappButtonColor || primaryColor }}
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
          </svg>
          {(() => {
            if (storeData.isTemporarilyClosed) {
              return translations.storeTemporarilyClosed || 'Store Temporarily Closed'
            } else if (customerInfo.deliveryTime === 'asap' && !storeData.isOpen) {
              return translations.closed || 'Store Closed'
            } else if (deliveryError?.type === 'OUTSIDE_DELIVERY_AREA') {
              return translations.outsideDeliveryArea || 'Address Outside Delivery Area'
            } else if (deliveryError) {
              return translations.deliveryNotAvailable || 'Delivery Not Available'
            } else if (isOrderLoading) {
              return translations.placingOrder || 'Placing Order...'
            } else {
              return `${translations.orderViaWhatsapp || 'Order via WhatsApp'} - ${currencySymbol}${cartTotal.toFixed(2)}`
            }
          })()}
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
        {storeData.isTemporarilyClosed
  ? (translations.storeClosedMessage || 'We apologize for any inconvenience.')
  : (customerInfo.deliveryTime === 'asap' && !storeData.isOpen)
  ? (translations.storeClosedMessage || 'We apologize for any inconvenience.')
  : deliveryError?.type === 'OUTSIDE_DELIVERY_AREA'
  ? (translations.selectDifferentArea || 'Please select an address within our delivery area')
  : (translations.clickingButton || 'By clicking this button, you agree to place your order via WhatsApp.')
}
        </p>
      </div>
    </div>
  )
}