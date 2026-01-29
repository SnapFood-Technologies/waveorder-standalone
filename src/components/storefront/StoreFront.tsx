'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { encodeBase62, decodeBase62, isValidBase62 } from '@/utils/base62'
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
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Phone,
  Mail,
  Globe,
  Copy,
  Check,
  Navigation,
  ExternalLink,
  CheckCircle,
  Filter,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Zap
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
const generateTimeSlots = (businessHours, currentDate, orderType, timeFormat = '24') => {
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
  
  const use24Hour = timeFormat === '24'
  
  while (currentTime < closeTime) {
    const timeValue = currentTime.toTimeString().slice(0, 5) // HH:MM format
    let timeLabel: string
    
    if (use24Hour) {
      // 24-hour format: "14:30"
      timeLabel = timeValue
    } else {
      // 12-hour format: "2:30 PM"
      timeLabel = currentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    }
    
    slots.push({
      value: timeValue,
      label: timeLabel
    })
    currentTime.setMinutes(currentTime.getMinutes() + 30)
  }
  
  return slots
}

// Scrollable Section Component with Arrow Indicators
function ScrollableSection({ 
  children, 
  maxHeight = '200px',
  className = ''
}: { 
  children: React.ReactNode
  maxHeight?: string
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showUpArrow, setShowUpArrow] = useState(false)
  const [showDownArrow, setShowDownArrow] = useState(false)

  const checkScrollPosition = () => {
    if (!scrollRef.current) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
    setShowUpArrow(scrollTop > 10)
    setShowDownArrow(scrollTop < scrollHeight - clientHeight - 10)
  }

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    // Initial check
    setTimeout(checkScrollPosition, 100)
    
    scrollElement.addEventListener('scroll', checkScrollPosition)
    
    // Check on resize
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkScrollPosition, 100)
    })
    resizeObserver.observe(scrollElement)

    return () => {
      scrollElement.removeEventListener('scroll', checkScrollPosition)
      resizeObserver.disconnect()
    }
  }, [children])

  const scrollUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: -150, behavior: 'smooth' })
    }
  }

  const scrollDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: 150, behavior: 'smooth' })
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Up Arrow - Positioned on the right */}
      {showUpArrow && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            scrollUp(e)
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          onMouseUp={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          className="absolute top-1 right-4 z-30 w-7 h-7 bg-white border-2 border-gray-300 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95 pointer-events-auto"
          aria-label="Scroll up"
          type="button"
        >
          <ArrowUp className="w-4 h-4 text-gray-700 pointer-events-none" />
        </button>
      )}
      
      {/* Scrollable Content with padding to prevent arrow overlap */}
      <div
        ref={scrollRef}
        className="space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-1"
        style={{ 
          maxHeight,
          paddingTop: showUpArrow ? '12px' : '0',
          paddingBottom: showDownArrow ? '12px' : '0'
        }}
        onScroll={checkScrollPosition}
        onWheel={(e) => e.stopPropagation()}
      >
        {children}
      </div>

      {/* Down Arrow - Positioned on the right */}
      {showDownArrow && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            scrollDown(e)
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          onMouseUp={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}
          className="absolute bottom-1 right-4 z-30 w-7 h-7 bg-white border-2 border-gray-300 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95 pointer-events-auto"
          aria-label="Scroll down"
          type="button"
        >
          <ArrowDown className="w-4 h-4 text-gray-700 pointer-events-none" />
        </button>
      )}
    </div>
  )
}

// Add this component before your main StoreFront component
function SchedulingModal({
  isOpen,
  onClose,
  onSchedule,
  primaryColor,
  translations
}: {
  isOpen: boolean
  onClose: () => void
  onSchedule: () => void
  primaryColor: string
  translations: any
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {translations.storeCurrentlyClosed || 'Store Currently Closed'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            {translations.cannotPlaceNowOrder || 'We\'re currently closed and cannot accept orders for immediate delivery/pickup. However, you can schedule your order for when we\'re open!'}
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              {translations.schedulingBenefits || 'Why schedule your order?'}
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {translations.guaranteedPreparation || 'Guaranteed preparation when we\'re open'}</li>
              <li>• {translations.noWaitingTime || 'No waiting - ready when you arrive'}</li>
              <li>• {translations.secureYourOrder || 'Secure your preferred time slot'}</li>
            </ul>
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {translations.close || 'Close'}
          </button>
          <button
            onClick={onSchedule}
            className="flex-1 px-4 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {translations.scheduleOrder || 'Schedule Order'}
          </button>
        </div>
      </div>
    </div>
  )
}


function ErrorMessage({ 
  isVisible, 
  onClose, 
  message, 
  type = 'error', // 'error', 'warning', 'info'
  primaryColor, 
  translations 
}: {
  isVisible: boolean
  onClose: () => void
  message: string
  type?: 'error' | 'warning' | 'info'
  primaryColor: string
  translations: any
}) {
  if (!isVisible) return null

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          textColor: 'text-red-800',
          icon: AlertCircle
        }
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          textColor: 'text-orange-800',
          icon: AlertTriangle
        }
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          textColor: 'text-blue-800',
          icon: Info
        }
    }
  }

  const styles = getTypeStyles()
  const IconComponent = styles.icon

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50">
      <div className={`${styles.bg} ${styles.border} border rounded-xl shadow-xl p-4 sm:p-6`}>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 ${styles.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 ${styles.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm sm:text-base ${styles.textColor} leading-relaxed`}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Add this component before your main StoreFront component
function OrderSuccessMessage({ 
  isVisible, 
  onClose, 
  orderNumber, 
  primaryColor, 
  translations,
  storeData 
}: {
  isVisible: boolean
  onClose: () => void
  orderNumber: string
  primaryColor: string
  translations: any
  storeData: any
}) {
  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50">
      <div className="bg-white border border-green-200 rounded-xl shadow-xl p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 text-base sm:text-lg mb-2">
              {translations.orderPrepared || 'Order Prepared!'}
            </h4>
            <div className="space-y-2 sm:space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-medium">{translations.orderNumber || 'Order Number'}:</span> {orderNumber}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {translations.orderOpenedWhatsApp || 'Your order details have been prepared and WhatsApp should now be open. Please send the message to complete your order (if you haven\'t already sent it).'}
              </p>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  {translations.nextSteps || 'Next Steps'}:
                </p>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>1. {translations.sendWhatsAppMessage || 'Send the WhatsApp message (if not sent yet)'}</div>
                  <div>2. {translations.awaitConfirmation || 'Wait for our confirmation'}</div>
                  <div>3. {translations.weWillPrepareOrder || 'We\'ll prepare your order once confirmed'}</div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  )
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
        case 'ES':
          return ['es'] // Spain business - only Spain addresses
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
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors text-gray-900 placeholder:text-gray-500"
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
function detectCountryFromBusiness(storeData: any): 'AL' | 'US' | 'GR' | 'IT' | 'ES' | 'XK' | 'MK' | 'DEFAULT' {
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
      
      // Spain boundaries: approximately 36.0-43.8°N, -9.3 to 4.3°E
      if (lat >= 36.0 && lat <= 43.8 && lng >= -9.3 && lng <= 4.3) {
        return 'ES'
      }
      
      // Kosovo boundaries: approximately 42.2-43.3°N, 20.0-21.8°E
      if (lat >= 42.2 && lat <= 43.3 && lng >= 20.0 && lng <= 21.8) {
        return 'XK'
      }
      
      // North Macedonia boundaries: approximately 40.8-42.4°N, 20.4-23.0°E
      if (lat >= 40.8 && lat <= 42.4 && lng >= 20.4 && lng <= 23.0) {
        return 'MK'
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
    if (storeData.whatsappNumber?.startsWith('+34')) return 'ES'
    if (storeData.whatsappNumber?.startsWith('+383')) return 'XK'
    if (storeData.whatsappNumber?.startsWith('+389')) return 'MK'
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
      if (browserLanguage.startsWith('es')) {
        return 'ES'
      }
      
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (timezone === 'Europe/Tirane') return 'AL'
        if (timezone === 'Europe/Rome') return 'IT'
        if (timezone === 'Europe/Madrid') return 'ES'
        if (timezone === 'Europe/Belgrade' || timezone === 'Europe/Pristina') return 'XK'
        if (timezone === 'Europe/Skopje') return 'MK'
      } catch (error) {
        // Timezone detection failed
      }
    }
    
    // FALLBACK: Check business indicators
    if (storeData.currency === 'ALL' || storeData.language === 'sq') return 'AL'
    if (storeData.currency === 'EUR' && storeData.language === 'el') return 'GR'
    if (storeData.currency === 'EUR' && storeData.language === 'it') return 'IT'
    if (storeData.currency === 'EUR' && storeData.language === 'es') return 'ES'
    
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
{(() => {
  const lang = storeData.storefrontLanguage || storeData.language || 'en'
  const displayDescription = (lang === 'sq' || lang === 'al') && storeData.descriptionAl 
    ? storeData.descriptionAl 
    : lang === 'el' && storeData.descriptionEl
      ? storeData.descriptionEl
      : storeData.description
  
  return displayDescription && (
    <div className="bg-gray-50 p-4 rounded-xl">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
        <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
        {translations.about || 'About'}
      </h3>
      <p className="text-gray-700 leading-relaxed">{displayDescription}</p>
    </div>
  )
})()}
            
            {/* Contact Information */}
            <div>
             {/* Website */}
{storeData.website && (
  <div>
    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
      <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
      {translations.website}
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
                      {storeData.deliveryTimeText || storeData.estimatedDeliveryTime || '30-45 min'}
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
                <p className="text-green-600 text-sm mt-2 font-medium">{translations.linkCopied}</p>
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
                  {translations.moreSharingOptions}
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
  translations,
  forceScheduleMode = false // Add this prop
}: {
  deliveryType: 'delivery' | 'pickup' | 'dineIn'
  selectedTime: string
  onTimeChange: (time: string) => void
  storeData: any
  primaryColor: string
  translations: any
  forceScheduleMode?: boolean
}) {
  const [timeMode, setTimeMode] = useState(forceScheduleMode ? 'schedule' : 'now')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  
  // Get time format from store data (default to 24-hour)
  const timeFormat = storeData.timeFormat || '24'
  
  // Get locale from store language for date formatting
  const getLocaleFromLanguage = (language: string): string => {
    switch (language) {
      case 'es': return 'es-ES'
      case 'sq': return 'sq-AL'
      case 'en': return 'en-US'
      default: return 'en-US'
    }
  }
  const locale = getLocaleFromLanguage(storeData.storefrontLanguage || storeData.language || 'en')
  
  // Generate time slots with time format
  const timeSlots = generateTimeSlots(storeData.businessHours, selectedDate, deliveryType, timeFormat)
  
  useEffect(() => {
    if (forceScheduleMode) {
      setTimeMode('schedule')
    }
  }, [forceScheduleMode])

  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return date
  })

  const handleTimeSelection = (mode: string, date: Date | null = null, time: string | null = null) => {
    setTimeMode(mode)
    
    if (mode === 'now') {
      onTimeChange('asap')
    } else if (mode === 'schedule') {
      // If just switching to schedule mode without time, clear it
      if (!date || !time) {
        onTimeChange('')
      } else {
        // If date and time provided, set the scheduled time
        const dateTime = new Date(date)
        const [hours, minutes] = time.split(':')
        dateTime.setHours(parseInt(hours), parseInt(minutes))
        onTimeChange(dateTime.toISOString())
      }
    }
  }

  // Dynamic labels and estimated times based on delivery type
  const getTimeLabels = () => {
    switch (deliveryType) {
      case 'delivery':
        return {
          timeLabel: translations.deliveryTime || 'Delivery Time',
          nowLabel: translations.now || 'Now',
          estimatedTime: storeData.deliveryTimeText || storeData.estimatedDeliveryTime || '30-45 min'
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
    <div data-time-selection>
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
  <div className="text-xs opacity-80">{translations.selectTime || 'Pick time'}</div>
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
                     date.toLocaleDateString(locale, { weekday: 'short' })}
                  </div>
                  <div className="text-xs opacity-80">
                    {date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
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
  (() => {
    const date = new Date(selectedTime)
    if (timeFormat === '24') {
      // 24-hour format: "14:30"
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } else {
      // 12-hour format: "2:30 PM"
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })
    }
  })() : 
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
  descriptionAl?: string
  descriptionEl?: string
  logo?: string
  coverImage?: string
  coverBackgroundSize?: string
  coverBackgroundPosition?: string
  coverHeight?: string              // legacy / default
  coverHeightMobile?: string
  coverHeightDesktop?: string
  logoPadding?: string
  logoObjectFit?: string
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
  storefrontLanguage?: string
  timeFormat?: string
  deliveryFee: number
  minimumOrder: number
  deliveryRadius: number
  deliveryEnabled: boolean
  pickupEnabled: boolean
  dineInEnabled: boolean
  estimatedDeliveryTime?: string
  estimatedPickupTime?: string
  deliveryTimeText?: string  // Custom delivery time text for RETAIL (overrides estimatedDeliveryTime)
  freeDeliveryText?: string  // Custom free delivery text for RETAIL (overrides "Free Delivery")
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
  cartBadgeColor?: string      // NEW
  featuredBadgeColor?: string  // NEW
  customMenuEnabled?: boolean
  customMenuItems?: any[]
  customFilteringEnabled?: boolean
  customFilterSettings?: any
  collections?: any[]
  groups?: any[]
  brands?: any[]
  initialProducts?: any[]  // Initial products from server-side render
}

interface Category {
  id: string
  ids?: string[] // Merged IDs for marketplace deduplication (optional)
  name: string
  nameAl?: string
  nameEl?: string
  description?: string
  descriptionAl?: string
  descriptionEl?: string
  parentId?: string
  parent?: {
    id: string
    name: string
    hideParentInStorefront?: boolean
  }
  children?: Array<{
    id: string
    name: string
    nameAl?: string
    nameEl?: string
    description?: string
    descriptionAl?: string
    descriptionEl?: string
    image?: string
    sortOrder: number
  }>
  hideParentInStorefront?: boolean
  image?: string
  sortOrder: number
  products: Product[] // Legacy - may be empty array for performance
  productCount?: number // Product count from API (from _count)
}

interface Product {
  id: string
  name: string
  description?: string
  descriptionAl?: string
  descriptionEl?: string
  images: string[]
  price: number
  originalPrice?: number
  sku?: string
  stock: number
  trackInventory?: boolean
  featured: boolean
  variants: ProductVariant[]
  modifiers: ProductModifier[]
}

interface ProductVariant {
  id: string
  name: string
  price: number
  originalPrice?: number
  stock: number
  sku?: string
  metadata?: any // For variant-specific data like images
  saleStartDate?: Date | string | null
  saleEndDate?: Date | string | null
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
  originalPrice?: number // Store original price for discount display
  quantity: number
  modifiers: ProductModifier[]
  totalPrice: number
  businessId: string // Store which business this cart item belongs to
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
  postalPricingId?: string  // Selected postal pricing ID (for RETAIL)
  cityName?: string         // City name for postal pricing lookup
  // RETAIL postal address fields
  countryCode?: string      // Country code (e.g., 'AL', 'XK', 'MK')
  city?: string             // City name (for RETAIL)
  postalCode?: string       // Postal code (for RETAIL)
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
      backgroundSize: storeData.coverBackgroundSize || 'cover',
      backgroundPosition: storeData.coverBackgroundPosition || 'center',
      backgroundRepeat: 'no-repeat'
    }
  } else {
    return {
      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)`
    }
  }
}

export default function StoreFront({ storeData }: { storeData: StoreData }) {
  // URL params for product sharing
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [priceMin, setPriceMin] = useState<number | ''>('')
  const [priceMax, setPriceMax] = useState<number | ''>('')
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'>('name-asc')
  
  // Custom filtering states
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set())
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set())
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set())
  
  // Custom menu states
  const [selectedMenuItem, setSelectedMenuItem] = useState<string | null>(null)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  
  // PERFORMANCE OPTIMIZATION: Products loaded from API endpoint
  const PRODUCTS_PER_PAGE = 24
  // Use initial products from server-side render if available
  const [products, setProducts] = useState<any[]>(storeData.initialProducts || [])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [isFiltering, setIsFiltering] = useState(false) // Track when filtering is happening (only set on user clicks)
  // If we have initial products, we're on page 1, otherwise start at 0
  const [currentPage, setCurrentPage] = useState(storeData.initialProducts && storeData.initialProducts.length > 0 ? 1 : 0)
  const [hasMoreProducts, setHasMoreProducts] = useState(true)
  const [totalProducts, setTotalProducts] = useState(storeData.initialProducts?.length || 0)
  
  // Infinite scroll for products (now using API pagination)
  // Initialize with actual initial products count (or PRODUCTS_PER_PAGE if no initial products)
  const [displayedProductsCount, setDisplayedProductsCount] = useState(
    storeData.initialProducts && storeData.initialProducts.length > 0 
      ? storeData.initialProducts.length 
      : PRODUCTS_PER_PAGE
  )
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined' && storeData?.id) {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          const allCartItems: CartItem[] = JSON.parse(savedCart)
          // Filter to only show items from current business on initial load
          // Exclude items without businessId or with different businessId
          return allCartItems.filter(item => 
            item.businessId && item.businessId === storeData.id
          )
        } catch (error) {
          console.error('Error parsing cart from localStorage:', error)
          return []
        }
      }
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
  const [forceScheduleMode, setForceScheduleMode] = useState(false)

  const [orderSuccessMessage, setOrderSuccessMessage] = useState<{
    visible: boolean
    orderNumber: string
  } | null>(null)

  const [errorMessage, setErrorMessage] = useState<{
    visible: boolean
    message: string
    type?: 'error' | 'warning' | 'info'
  } | null>(null)

  const [showSchedulingModal, setShowSchedulingModal] = useState(false)

  
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


  // Helper function to show errors
const showError = (message: string, type: 'error' | 'warning' | 'info' = 'error') => {
  setErrorMessage({
    visible: true,
    message,
    type
  })
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    setErrorMessage(null)
  }, 5000)
}

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup' | 'dineIn'>(getDefaultDeliveryType())
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    address: '',
    address2: '',
    deliveryTime: 'asap',
    specialInstructions: '',
    postalPricingId: undefined,
    cityName: undefined,
    countryCode: undefined,
    city: undefined,
    postalCode: undefined
  })
  
  // Postal pricing state (for RETAIL businesses)
  const [postalPricingOptions, setPostalPricingOptions] = useState<any[]>([])
  const [loadingPostalPricing, setLoadingPostalPricing] = useState(false)
  const [selectedPostalPricing, setSelectedPostalPricing] = useState<any | null>(null)
  const [isOrderLoading, setIsOrderLoading] = useState(false)
  
  // Countries and cities state (for RETAIL businesses)
  const [countries, setCountries] = useState<Array<{ id: string; name: string; code: string }>>([])
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  // Filter cart when storeData changes (user navigates to different store)
  // This ensures cart is filtered even if storeData.id changes after initial mount
  useEffect(() => {
    if (typeof window !== 'undefined' && storeData?.id) {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          const allCartItems: CartItem[] = JSON.parse(savedCart)
          // Filter to only show items from current business
          // Exclude items without businessId or with different businessId
          const currentBusinessCart = allCartItems.filter(item => 
            item.businessId && item.businessId === storeData.id
          )
          
          // Clean up old items without businessId from localStorage
          const itemsWithBusinessId = allCartItems.filter(item => item.businessId)
          if (itemsWithBusinessId.length !== allCartItems.length) {
            localStorage.setItem('cart', JSON.stringify(itemsWithBusinessId))
          }
          
          setCart(currentBusinessCart)
        } catch (error) {
          console.error('Error parsing cart from localStorage:', error)
          setCart([])
        }
      } else {
        setCart([])
      }
    } else if (typeof window !== 'undefined' && !storeData?.id) {
      // If storeData.id is not available, clear cart to be safe
      setCart([])
    }
  }, [storeData?.id])

  // Save cart to localStorage whenever it changes
  // Save all cart items (from all businesses) to preserve carts when switching stores
  useEffect(() => {
    if (typeof window !== 'undefined' && cart.length >= 0) {
      const savedCart = localStorage.getItem('cart')
      let allCartItems: CartItem[] = savedCart ? JSON.parse(savedCart) : []
      
      // Remove items from current business and add updated ones
      allCartItems = allCartItems.filter(item => item.businessId !== storeData.id)
      
      // Only add cart items that belong to current business (safety check)
      const currentBusinessCartItems = cart.filter(item => item.businessId === storeData.id)
      allCartItems = [...allCartItems, ...currentBusinessCartItems]
      
      localStorage.setItem('cart', JSON.stringify(allCartItems))
    }
  }, [cart, storeData.id])

  // Handle product sharing URL parameter - open product modal if ?p= param exists
  useEffect(() => {
    const productParam = searchParams.get('p')
    if (productParam && isValidBase62(productParam)) {
      const productId = decodeBase62(productParam)
      if (productId) {
        // Find the product in our loaded products or fetch it
        const product = products.find(p => p.id === productId)
        if (product) {
          // Open the product modal
          setSelectedProduct(product)
          const availableVariant = product.variants?.find((v: any) => v.stock > 0)
          setSelectedVariant(availableVariant || (product.variants?.length > 0 ? product.variants[0] : null))
          setSelectedModifiers([])
          setShowProductModal(true)
        }
      }
    }
  }, [searchParams, products])

  // Share product handler - creates URL with encoded product ID and tracking params
  const handleShareProduct = useCallback((productId: string) => {
    const encoded = encodeBase62(productId)
    const shareUrl = `${window.location.origin}/${storeData.slug}?p=${encoded}&utm_source=product_share&ps=${productId}`
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      // Success - copied feedback handled in modal
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    })
  }, [storeData.slug])

  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
      setShowScrollToTop(scrollY > 800) // Show after scrolling 800px
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('scroll', handleScroll)
    }
  }, [])
  
  // PERFORMANCE OPTIMIZATION: Fetch products from API endpoint
  const fetchProducts = useCallback(async (page: number = 1, reset: boolean = false) => {
    // Allow fetching products even if categories are empty (products might exist but categories filtered out)
    // Only skip if we're on initial load and have no initial products AND no categories
    if ((!storeData.categories || storeData.categories.length === 0) && 
        (!storeData.initialProducts || storeData.initialProducts.length === 0) && 
        page === 1) {
      setProducts([])
      setProductsLoading(false)
      setIsFiltering(false)
      return
    }
    
    try {
      // Set ref immediately to prevent duplicate scroll-triggered calls
      isFetchingRef.current = true
      
      // Only show loading for pagination (page > 1), not initial load
      if (page > 1 || products.length > 0) {
        setProductsLoading(true)
      }
      // Note: isFiltering is only set in onClick handlers for menu items, not here
      // When filtering, we keep old products visible (grayed out) until new ones load
      setProductsError(null)
      
      const params = new URLSearchParams()
      // Priority logic:
      // - If main menu was just clicked (mainMenuClickedRef), use selectedCategory (main menu takes priority)
      // - Otherwise: selectedFilterCategory (modal) > selectedSubCategory > selectedCategory (main menu)
      // This ensures main menu clicks work immediately even if React batches state updates
      let categoryToFilter: string | null = null
      if (mainMenuClickedRef.current && selectedCategory !== 'all') {
        categoryToFilter = selectedCategory
        mainMenuClickedRef.current = false // Reset flag after using it
      } else {
        categoryToFilter = selectedFilterCategory || selectedSubCategory || (selectedCategory !== 'all' ? selectedCategory : null)
      }
      if (categoryToFilter) {
        // Check if category has merged IDs (marketplace deduplication)
        // Search by primary ID OR check if targetId is in the ids array (for menu items from admin)
        const category = storeData.categories?.find((c: any) => 
          c.id === categoryToFilter || (c.ids && c.ids.includes(categoryToFilter))
        )
        if (category && category.ids) {
          // Merged category - send all IDs (API will handle them)
          params.set('categoryId', category.ids.join(','))
        } else {
          params.set('categoryId', categoryToFilter)
        }
      }
      // Only search if debounced search term has at least 3 characters
      if (debouncedSearchTerm.trim().length >= 3) {
        params.set('search', debouncedSearchTerm.trim())
      }
      if (priceMin !== '') {
        params.set('priceMin', priceMin.toString())
      }
      if (priceMax !== '') {
        params.set('priceMax', priceMax.toString())
      }
      // Expand merged IDs for collections/groups/brands (marketplace deduplication)
      if (selectedCollections.size > 0) {
        const expandedCollectionIds: string[] = []
        Array.from(selectedCollections).forEach(id => {
          // Search by primary ID OR check if id is in the ids array (for menu items from admin)
          const collection = storeData.collections?.find((c: any) => 
            c.id === id || (c.ids && c.ids.includes(id))
          )
          if (collection && collection.ids) {
            // Merged collection - add all IDs
            expandedCollectionIds.push(...collection.ids)
          } else {
            // Single collection - add its ID
            expandedCollectionIds.push(id)
          }
        })
        params.set('collections', expandedCollectionIds.join(','))
      }
      if (selectedGroups.size > 0) {
        const expandedGroupIds: string[] = []
        Array.from(selectedGroups).forEach(id => {
          // Search by primary ID OR check if id is in the ids array (for menu items from admin)
          const group = storeData.groups?.find((g: any) => 
            g.id === id || (g.ids && g.ids.includes(id))
          )
          if (group && group.ids) {
            // Merged group - add all IDs
            expandedGroupIds.push(...group.ids)
          } else {
            // Single group - add its ID
            expandedGroupIds.push(id)
          }
        })
        params.set('groups', expandedGroupIds.join(','))
      }
      if (selectedBrands.size > 0) {
        const expandedBrandIds: string[] = []
        Array.from(selectedBrands).forEach(id => {
          // Search by primary ID OR check if id is in the ids array (for menu items from admin)
          const brand = storeData.brands?.find((b: any) => 
            b.id === id || (b.ids && b.ids.includes(id))
          )
          if (brand && brand.ids) {
            // Merged brand - add all IDs
            expandedBrandIds.push(...brand.ids)
          } else {
            // Single brand - add its ID
            expandedBrandIds.push(id)
          }
        })
        params.set('brands', expandedBrandIds.join(','))
      }
      params.set('sortBy', sortBy)
      params.set('page', page.toString())
      params.set('limit', '50') // Load 50 products per page for better performance
      
      const response = await fetch(`/api/storefront/${storeData.slug}/products?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()
      
      if (reset) {
        // Replace products with new filtered results
        const newProducts = data.products || []
        setProducts(newProducts)
        setCurrentPage(1)
        // Clear filtering state AFTER products are set (use setTimeout to ensure React has updated)
        // This prevents gray-out flash on products that remain in the new results
        setTimeout(() => setIsFiltering(false), 0)
      } else {
        setProducts(prev => [...prev, ...(data.products || [])])
      }
      
      setTotalProducts(data.pagination?.total || 0)
      setHasMoreProducts(data.pagination?.hasMore || false)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching products:', error)
      setProductsError('Failed to load products')
      setIsFiltering(false) // Clear filtering state on error too
    } finally {
      setProductsLoading(false)
      // Clear ref when fetch completes (allows next scroll-triggered fetch)
      isFetchingRef.current = false
    }
  }, [storeData.slug, selectedCategory, selectedSubCategory, selectedFilterCategory, debouncedSearchTerm, priceMin, priceMax, sortBy, selectedCollections, selectedGroups, selectedBrands])

  // Initial products load - skip if we already have initialProducts from server
  useEffect(() => {
    // Only fetch if we don't have initial products from server-side render
    if (!storeData.initialProducts || storeData.initialProducts.length === 0) {
      fetchProducts(1, true)
    }
    setDisplayedProductsCount(PRODUCTS_PER_PAGE)
  }, [storeData.slug]) // Only run when slug changes

  // Debounce search term - wait 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 400)
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Track if this is the initial mount to avoid refetching when we have initialProducts
  const [isInitialMount, setIsInitialMount] = useState(true)
  
  // Track previous debounced search term to detect when search is cleared
  const prevDebouncedSearchTermRef = useRef('')
  
  // Refetch products when filters change (using debounced search term)
  useEffect(() => {
    // Skip on initial mount if we have initial products from server
    if (isInitialMount && storeData.initialProducts && storeData.initialProducts.length > 0) {
      setIsInitialMount(false)
      return
    }
    setIsInitialMount(false)
    
    // Only trigger API call if:
    // 1. Search term is >= 3 characters (actual search)
    // 2. Search term is cleared (empty) AND we previously had a search >= 3 chars (clearing search)
    // 3. Other filters changed (category, price, etc.)
    const searchTermLength = debouncedSearchTerm.trim().length
    const prevSearchTermLength = prevDebouncedSearchTermRef.current.trim().length
    const isSearchCleared = searchTermLength === 0 && prevSearchTermLength >= 3
    
    // Skip API call if search term is 1-2 characters (wait for 3+)
    if (searchTermLength > 0 && searchTermLength < 3 && !isSearchCleared) {
      prevDebouncedSearchTermRef.current = debouncedSearchTerm
      return
    }
    
    prevDebouncedSearchTermRef.current = debouncedSearchTerm
    
    // Gray out products when search/filter changes (if products exist)
    if (products.length > 0) {
      setIsFiltering(true)
    }
    
    // Fetch products (will only include search param if >= 3 chars)
    fetchProducts(1, true)
    setDisplayedProductsCount(PRODUCTS_PER_PAGE)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [debouncedSearchTerm, selectedCategory, selectedSubCategory, selectedFilterCategory, priceMin, priceMax, sortBy, selectedCollections, selectedGroups, selectedBrands])

  // Update displayed count when products are loaded
  useEffect(() => {
    // If we have initial products, show them all immediately
    if (storeData.initialProducts && storeData.initialProducts.length > 0 && products.length === storeData.initialProducts.length) {
      setDisplayedProductsCount(products.length)
    } else if (products.length > 0 && displayedProductsCount < products.length) {
      // Show all loaded products (for pagination)
      setDisplayedProductsCount(Math.min(products.length, displayedProductsCount + PRODUCTS_PER_PAGE))
    }
  }, [products.length, storeData.initialProducts])

  // Track if fetch is in progress using ref (immediate, bypasses async state)
  const isFetchingRef = useRef(false)
  // Track when main menu category is clicked to ensure it takes priority over modal filter
  const mainMenuClickedRef = useRef(false)
  
  // Load more products on scroll (infinite scroll)
  useEffect(() => {
    const handleScroll = () => {
      // Use ref for immediate check (prevents race condition)
      if (isFetchingRef.current || productsLoading || !hasMoreProducts) return
      
      const scrollY = window.scrollY || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Load more when within 800px of bottom
      if (scrollY + windowHeight >= documentHeight - 800) {
        // If we've shown all loaded products, load next page
        if (displayedProductsCount >= products.length && hasMoreProducts) {
          const nextPage = currentPage + 1
          // Set ref immediately to prevent duplicate calls
          isFetchingRef.current = true
          fetchProducts(nextPage, false)
        } else if (displayedProductsCount < products.length) {
          // Show more of the already-loaded products
          setDisplayedProductsCount(prev => Math.min(prev + PRODUCTS_PER_PAGE, products.length))
        }
      }
    }

    // Only use window listener (removed duplicate document listener)
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [displayedProductsCount, products.length, hasMoreProducts, productsLoading, currentPage, fetchProducts])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Fetch countries on mount (for RETAIL businesses)
  useEffect(() => {
    if (storeData.businessType === 'RETAIL' && deliveryType === 'delivery') {
      fetchCountries()
    }
  }, [storeData.businessType, deliveryType])

  const fetchCountries = async () => {
    setLoadingCountries(true)
    try {
      const response = await fetch('/api/storefront/locations/countries')
      if (response.ok) {
        const data = await response.json()
        setCountries(data.data || [])
      } else {
        console.error('Failed to fetch countries:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
    } finally {
      setLoadingCountries(false)
    }
  }

  // Fetch cities when country changes (for RETAIL businesses)
  useEffect(() => {
    if (storeData.businessType === 'RETAIL' && deliveryType === 'delivery' && customerInfo.countryCode) {
      fetchCities(customerInfo.countryCode)
    } else {
      setCities([])
    }
  }, [customerInfo.countryCode, storeData.businessType, deliveryType])

  const fetchCities = async (countryCode: string) => {
    setLoadingCities(true)
    try {
      const response = await fetch(`/api/storefront/locations/cities?countryCode=${encodeURIComponent(countryCode)}`)
      if (response.ok) {
        const data = await response.json()
        setCities(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
    } finally {
      setLoadingCities(false)
    }
  }

  // Fetch postal pricing when city changes (for RETAIL businesses)
  useEffect(() => {
    if (storeData.businessType === 'RETAIL' && deliveryType === 'delivery' && customerInfo.city) {
      setCustomerInfo(prev => ({ ...prev, cityName: prev.city }))
      fetchPostalPricing(customerInfo.city)
      // Clear selected postal pricing when city changes
      setSelectedPostalPricing(null)
      setCalculatedDeliveryFee(storeData.deliveryFee)
    }
  }, [customerInfo.city, storeData.businessType, deliveryType])

  const currencySymbol = getCurrencySymbol(storeData.currency)
  const translations = getStorefrontTranslations(storeData.storefrontLanguage || storeData.language || 'en')
  const primaryColor = storeData.primaryColor || '#0D9488'

  // Calculate cart totals with dynamic delivery fee
  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  
  const cartDeliveryFee = deliveryType === 'delivery' ? calculatedDeliveryFee : 0
  const cartTotal = cartSubtotal + cartDeliveryFee
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Check minimum order requirement
  const meetsMinimumOrder = cartSubtotal >= storeData.minimumOrder || deliveryType !== 'delivery'

  // PERFORMANCE OPTIMIZATION: Use products from API (already filtered server-side)
  // Map products to include category name for display - MUST be reactive to products changes
  // IMPORTANT: When searching, only show products from API (products state), not initialProducts
  const filteredProducts = useMemo(() => {
    // If there's a search term, only use products from API (already filtered server-side)
    // This ensures we don't show initialProducts or cached products that don't match the search
    return products.map(product => {
      // Find category name from storeData.categories
      const category = storeData.categories.find((cat: any) => cat.id === product.categoryId)
      return {
        ...product,
        categoryName: category?.name || 'Uncategorized'
      }
    })
  }, [products, storeData.categories])

  // Helper function to validate phone number is complete
  const isPhoneValid = (phone: string) => {
    if (!phone) return false
    
    // Remove all non-numeric characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    
    // Check minimum length based on country code
    if (cleanPhone.startsWith('+355')) {
      // Albania: +355 + 9 digits = 13 characters
      return cleanPhone.length >= 13
    } else if (cleanPhone.startsWith('+30')) {
      // Greece: +30 + 10 digits = 13 characters
      return cleanPhone.length >= 13
    } else if (cleanPhone.startsWith('+39')) {
      // Italy: +39 + 9-10 digits = 12-13 characters
      return cleanPhone.length >= 12
    } else if (cleanPhone.startsWith('+34')) {
      // Spain: +34 + 9 digits = 12 characters
      return cleanPhone.length >= 12
    } else if (cleanPhone.startsWith('+383')) {
      // Kosovo: +383 + 8 digits = 12 characters
      return cleanPhone.length >= 12
    } else if (cleanPhone.startsWith('+389')) {
      // North Macedonia: +389 + 8 digits = 12 characters
      return cleanPhone.length >= 12
    } else if (cleanPhone.startsWith('+1')) {
      // US: +1 + 10 digits = 12 characters
      return cleanPhone.length >= 12
    } else {
      // Generic: at least 11 digits total (minimum international format)
      return cleanPhone.length >= 11
    }
  }

  // Create a helper function to check if the order can be submitted:
  const canSubmitOrder = () => {
    if (storeData.isTemporarilyClosed) return false
    
    // Basic requirements
    if (cart.length === 0) return false
    if (!customerInfo.name || !customerInfo.phone) return false
    
    // Phone validation - must be complete and valid
    if (!isPhoneValid(customerInfo.phone)) return false
    
    if (isOrderLoading) return false
    
    // Delivery specific checks
    if (deliveryType === 'delivery') {
      if (!customerInfo.address) return false
      if (deliveryError?.type === 'OUTSIDE_DELIVERY_AREA') return false
      if (!meetsMinimumOrder && !deliveryError) return false
    }
    
    // Time selection validation for scheduled orders
    // Check if scheduling mode is active (not 'asap') but no specific time selected
    if (forceScheduleMode || (customerInfo.deliveryTime !== 'asap' && !storeData.isOpen)) {
      if (!customerInfo.deliveryTime || customerInfo.deliveryTime === 'asap' || customerInfo.deliveryTime === '') {
        return false
      }
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

  // Fetch postal pricing for RETAIL businesses when city is available
  const fetchPostalPricing = async (cityName: string) => {
    if (storeData.businessType !== 'RETAIL' || !cityName) return
    
    setLoadingPostalPricing(true)
    setPostalPricingOptions([]) // Clear previous options
    try {
      const url = `/api/storefront/${storeData.slug}/postal-pricing?cityName=${encodeURIComponent(cityName)}`
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        setPostalPricingOptions(data.data || [])
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        console.error('❌ Failed to fetch postal pricing:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching postal pricing:', error)
    } finally {
      setLoadingPostalPricing(false)
    }
  }

  // Extract city from address for RETAIL businesses
  const extractCityFromAddress = (address: string): string | null => {
    if (!address) return null
    // Try to extract city from address
    const parts = address.split(',').map(p => p.trim())
    // City is usually in the second or third part (after street address)
    if (parts.length >= 2) {
      // Return the second part (most common: "Street, City")
      return parts[1] || null
    } else if (parts.length === 1) {
      // If only one part, check if it contains common city indicators
      const addressLower = parts[0].toLowerCase()
      // If it looks like just a city name (no street numbers), return it
      if (!/\d/.test(parts[0])) {
        return parts[0]
      }
    }
    return null
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

    // For RETAIL businesses, fetch postal pricing when address is set
    if (storeData.businessType === 'RETAIL' && deliveryType === 'delivery') {
      const cityName = extractCityFromAddress(address)
      if (cityName) {
        setCustomerInfo(prev => ({ ...prev, cityName }))
        await fetchPostalPricing(cityName)
      }
    }

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

  // const shouldDisableForTiming = customerInfo.deliveryTime === 'asap' && !storeData.isOpen

  const openProductModal = (product: Product) => {
    if (storeData.isTemporarilyClosed) return
    
    // Check if product has any stock available
    // If inventory tracking is disabled, product is always available
    // If it has variants, check if any variant has stock
    // Otherwise, check product stock
    const hasStock = !product.trackInventory 
      ? true 
      : product.variants.length > 0 
        ? product.variants.some(v => v.stock > 0)
        : product.stock > 0
      
    if (!hasStock) return
    
    setSelectedProduct(product)
    // Set default variant to first available variant with stock
    const availableVariant = product.variants.find(v => v.stock > 0)
    setSelectedVariant(availableVariant || (product.variants.length > 0 ? product.variants[0] : null))
    setSelectedModifiers([])
    setShowProductModal(true)
  }


  // PERFORMANCE OPTIMIZATION: Products are already filtered by API
  // All filtering (category, search, price, collections, groups, brands, sorting) happens server-side
  const getFilteredProducts = () => {
    return filteredProducts
  }

  // Legacy function - kept for reference but not used
  const getFilteredProductsLegacy = () => {
    // @ts-ignore
    let products = []
  
    if (selectedCategory === 'all') {
      // Get all products from all categories (including subcategories)
      // Since API now returns both parents and children in flat array, we need to avoid duplicates
      // Only process parent categories (those without parentId), and get their children's products
      const parentCategories = storeData.categories.filter((cat: any) => !cat.parentId)
      const childCategoryIds = new Set(storeData.categories.filter((cat: any) => cat.parentId).map((cat: any) => cat.id))
      
      products = parentCategories.flatMap(category => {
        // If category has subcategories, get products from them too
        if (category.children && category.children.length > 0) {
          const subcategoryIds = category.children.map((child: any) => child.id)
          const subcategoryProducts = storeData.categories
            .filter((cat: any) => subcategoryIds.includes(cat.id) && childCategoryIds.has(cat.id))
            .flatMap((subcat: any) => 
              (subcat.products || []).map((product: any) => ({ 
                ...product, 
                categoryName: `${category.name} > ${subcat.name}`,
                categoryId: subcat.id 
              }))
            )
          const parentProducts = (category.products || []).map((product: any) => ({ 
            ...product, 
            categoryName: category.name,
            categoryId: category.id 
          }))
          return [...parentProducts, ...subcategoryProducts]
        }
        return (category.products || []).map((product: any) => ({ 
          ...product, 
          categoryName: category.name,
          categoryId: category.id 
        }))
      })
      
      // Also include products from standalone child categories (if hideParentInStorefront case)
      if (shouldShowOnlySubcategories) {
        const standaloneChildProducts = childCategories
          .filter((cat: any) => !parentCategories.some((parent: any) => 
            parent.children?.some((child: any) => child.id === cat.id)
          ))
          .flatMap((category: any) => 
            (category.products || []).map((product: any) => ({ 
              ...product, 
              categoryName: category.name,
              categoryId: category.id 
            }))
          )
        products = [...products, ...standaloneChildProducts]
      }
    } else if (selectedSubCategory) {
      // Get products from selected subcategory (when parent is selected but subcategory is chosen)
      const subcategory = storeData.categories.find((cat: any) => cat.id === selectedSubCategory)
      
      if (subcategory && subcategory.products) {
        products = subcategory.products.map((product: any) => ({ 
          ...product, 
          categoryName: subcategory.name,
          categoryId: subcategory.id 
        }))
      }
    } else if (shouldShowOnlySubcategories && selectedCategory !== 'all') {
      // When hideParentInStorefront is true and a specific subcategory is selected
      const category = storeData.categories.find((cat: any) => cat.id === selectedCategory)
      if (category && category.products) {
        products = category.products.map((product: any) => ({ 
          ...product, 
          categoryName: category.name,
          categoryId: category.id 
        }))
      }
    } else if (selectedCategory !== 'all') {
      // Get products from selected category (parent or flat category)
      const category = storeData.categories.find((cat: any) => cat.id === selectedCategory)
      if (category) {
        // If category has subcategories, show all products from parent and children
        if (category.children && category.children.length > 0) {
          const subcategoryIds = category.children.map((child: any) => child.id)
          
          // Get products from subcategories - they're now in the flat array
          const subcategoryProducts = storeData.categories
            .filter((cat: any) => subcategoryIds.includes(cat.id))
            .flatMap((subcat: any) => 
              (subcat.products || []).map((product: any) => ({ 
                ...product, 
                categoryName: `${category.name} > ${subcat.name}`,
                categoryId: subcat.id 
              }))
            )
          
          const parentProducts = (category.products || []).map((product: any) => ({ 
            ...product, 
            categoryName: category.name,
            categoryId: category.id 
          }))
          products = [...parentProducts, ...subcategoryProducts]
        } else {
          products = (category.products || []).map((product: any) => ({ 
            ...product, 
            categoryName: category.name,
            categoryId: category.id 
          }))
        }
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

    // Apply price filter
    if (priceMin !== '' || priceMax !== '') {
      // @ts-ignore
      products = products.filter(product => {
        const productPrice = product.price || 0
        const minPrice = priceMin !== '' ? Number(priceMin) : 0
        const maxPrice = priceMax !== '' ? Number(priceMax) : Infinity
        return productPrice >= minPrice && productPrice <= maxPrice
      })
    }

    // Apply category filter (from filter modal)
    if (selectedFilterCategory) {
      // @ts-ignore
      products = products.filter(product => {
        // @ts-ignore
        return product.categoryId === selectedFilterCategory
      })
    }

    // Apply custom filtering (collections, groups, brands)
    if (selectedCollections.size > 0) {
      // @ts-ignore
      products = products.filter(product => {
        // @ts-ignore
        const productCollections = product.collectionIds || []
        return productCollections.some((colId: string) => selectedCollections.has(colId))
      })
    }

    if (selectedGroups.size > 0) {
      // @ts-ignore
      products = products.filter(product => {
        // @ts-ignore
        const productGroups = product.groupIds || []
        return productGroups.some((groupId: string) => selectedGroups.has(groupId))
      })
    }

    if (selectedBrands.size > 0) {
      // @ts-ignore
      products = products.filter(product => {
        // @ts-ignore
        return product.brandId && selectedBrands.has(product.brandId)
      })
    }

    // Exclude products with price 0
    // @ts-ignore
    products = products.filter(product => (product.price || 0) > 0)

    // Apply sorting
    // @ts-ignore
    products = [...products].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'price-asc':
          return (a.price || 0) - (b.price || 0)
        case 'price-desc':
          return (b.price || 0) - (a.price || 0)
        default:
          return 0
      }
    })
  
    return products
  }

  // Separate parent and child categories
  const parentCategories = storeData.categories.filter(cat => !cat.parentId)
  const childCategories = storeData.categories.filter(cat => cat.parentId)
  
  // Check if we should show only subcategories (hideParentInStorefront case)
  // When API returns only children (parent is hidden), all categories have parentId
  // So we check if ALL categories are children (meaning parent was hidden)
  const allCategoriesAreChildren = parentCategories.length === 0 && childCategories.length > 0
  const shouldShowOnlySubcategories = allCategoriesAreChildren || 
    (parentCategories.length === 1 && parentCategories[0].hideParentInStorefront)
  
  // Get subcategories for currently selected parent
  const selectedParentCategory = selectedCategory !== 'all' && !shouldShowOnlySubcategories
    ? storeData.categories.find(cat => cat.id === selectedCategory && !cat.parentId)
    : null
  const currentSubCategories = selectedParentCategory?.children || []

  const addToCart = (product: Product, variant?: ProductVariant, modifiers: ProductModifier[] = [], variantDisplayName?: string) => {
    // Check stock availability
    const availableStock = variant?.stock || product.stock
    const cartItemId = `${product.id}-${variant?.id || 'default'}-${modifiers.map(m => m.id).join(',')}`
    const existingCartItem = cart.find(item => item.id === cartItemId)
    const currentQuantityInCart = existingCartItem?.quantity || 0
    
    if (currentQuantityInCart >= availableStock) {
      const itemWord = availableStock === 1 ? translations.item : translations.items
      showError(translations.sorryOnlyStockAvailable
        .replace('{count}', availableStock.toString())
        .replace('{itemWord}', itemWord), 'warning')
      return
    }
  
    const basePrice = variant?.price || product.price
    // Get original price for discount display (variant originalPrice takes precedence)
    const baseOriginalPrice = variant?.originalPrice || product.originalPrice
    const modifierPrice = modifiers.reduce((sum, mod) => sum + mod.price, 0)
    const totalPrice = basePrice + modifierPrice
  
    // Use mapped variant display name if provided, otherwise use variant.name
    const variantName = variant ? (variantDisplayName || variant.name) : ''
  
    const cartItem: CartItem = {
      id: cartItemId,
      productId: product.id,
      variantId: variant?.id,
      name: `${product.name}${variant ? ` (${variantName})` : ''}`,
      price: basePrice,
      originalPrice: baseOriginalPrice && baseOriginalPrice > basePrice ? baseOriginalPrice : undefined,
      quantity: 1,
      modifiers,
      totalPrice,
      businessId: storeData.id // Store which business this item belongs to
    }
  
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === cartItemId)
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
          
          // If removing items, allow it
          if (change < 0) {
            if (newQuantity === 0) return null  // Remove item
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * (item.price + item.modifiers.reduce((sum, mod) => sum + mod.price, 0))
            }
          }
          
          // If adding items, check stock limits
          if (change > 0) {
            // Find the original product and variant to check stock
            // First check in the paginated products array, then fallback to categories
            let originalProduct = products.find((p: any) => p.id === item.productId)
            
            if (!originalProduct) {
              // Fallback to categories (for products loaded initially)
              originalProduct = storeData.categories
                .flatMap((cat: any) => cat.products || [])
                .find((p: any) => p.id === item.productId)
            }
            
            if (!originalProduct) return item // Safety check
            
            let availableStock = originalProduct.stock
            if (item.variantId) {
              const variant = originalProduct.variants?.find((v: any) => v.id === item.variantId)
              availableStock = variant?.stock || 0
            }
            
          // Check if new quantity would exceed stock
          if (newQuantity > availableStock) {
            const itemWord = availableStock === 1 ? translations.item : translations.items
            showError(translations.sorryOnlyStockAvailable
              .replace('{count}', availableStock.toString())
              .replace('{itemWord}', itemWord), 'warning')
            return item // Don't change quantity
          }
              
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * (item.price + item.modifiers.reduce((sum, mod) => sum + mod.price, 0))
            }
          }
          
          return item
        }
        return item
      }).filter(Boolean) as CartItem[]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  const submitOrder = async () => {
    // Validation for temporarily closed store
    if (storeData.isTemporarilyClosed) {
      showError(translations.storeTemporarilyClosed || 'Store is temporarily closed', 'info')
      return
    }
  
    // Check if store is closed and user selected "now" - suggest scheduling
    if (customerInfo.deliveryTime === 'asap' && !storeData.isOpen) {
      setShowSchedulingModal(true)
      return
    }
  
   // Basic validations
    if (!customerInfo.name || !customerInfo.phone) {
      showError(translations.fillRequiredInfo || 'Please fill in required customer information')
      return
    }

    // Validation for delivery address
    if (deliveryType === 'delivery') {
      if (storeData.businessType === 'RETAIL') {
        // RETAIL businesses require address, country, and city
        if (!customerInfo.address) {
          showError(translations.addDeliveryAddress || 'Please provide delivery address')
          return
        }
        if (!customerInfo.countryCode) {
          showError('Please select a country')
          return
        }
        if (!customerInfo.city) {
          showError('Please select a city')
          return
        }
        if (!customerInfo.postalPricingId) {
          showError(translations.pleaseSelectDeliveryMethod || 'Please select a delivery method')
          return
        }
      } else {
        // Non-RETAIL businesses require address
        if (!customerInfo.address) {
          showError(translations.addDeliveryAddress || 'Please provide delivery address')
          return
        }
      }
    }

    if (!meetsMinimumOrder) {
      showError(`${translations.minimumOrder} ${currencySymbol}${storeData.minimumOrder.toFixed(2)} ${translations.forDelivery}`, 'warning')
      return
    }

    // NEW: Check if scheduled time is selected when not ordering "now"
    if (customerInfo.deliveryTime !== 'asap' && (!customerInfo.deliveryTime || customerInfo.deliveryTime === '')) {
      showError(translations.selectTimeForSchedule || 'Please select a time for your scheduled order')
      return
    }
  
    setIsOrderLoading(true)
  
    try {
      // Build delivery address based on business type
      let deliveryAddress = ''
      if (storeData.businessType === 'RETAIL') {
        // For RETAIL: combine address, address2, city, country, postal code
        const parts = [
          customerInfo.address,
          customerInfo.address2,
          customerInfo.city,
          customerInfo.countryCode,
          customerInfo.postalCode
        ].filter(Boolean)
        deliveryAddress = parts.join(', ')
      } else {
        // For non-RETAIL: use existing format
        deliveryAddress = `${customerInfo.address}${customerInfo.address2 ? `, ${customerInfo.address2}` : ''}`.trim()
      }

      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        deliveryAddress,
        deliveryType,
        deliveryTime: customerInfo.deliveryTime === 'asap' ? null : customerInfo.deliveryTime,
        paymentMethod: storeData.paymentMethods[0] || 'CASH',
        specialInstructions: customerInfo.specialInstructions,
        latitude: customerInfo.latitude,
        longitude: customerInfo.longitude,
        postalPricingId: customerInfo.postalPricingId, // For RETAIL businesses
        // RETAIL-specific fields
        countryCode: customerInfo.countryCode,
        city: customerInfo.city,
        postalCode: customerInfo.postalCode,
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice || null,
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
  
      let result
      try {
        result = await response.json()
      } catch (parseError) {
        // If response is not JSON, show a generic error
        showError(translations.failedToSubmitOrder || 'Failed to submit order. Please try again.', 'error')
        return
      }
  
      if (response.ok && result.success) {
        // Clear cart for current business only and close modal
        // Remove items from localStorage for this business
        if (typeof window !== 'undefined') {
          const savedCart = localStorage.getItem('cart')
          if (savedCart) {
            const allCartItems: CartItem[] = JSON.parse(savedCart)
            const otherBusinessItems = allCartItems.filter(item => item.businessId !== storeData.id)
            localStorage.setItem('cart', JSON.stringify(otherBusinessItems))
          }
        }
        setCart([])
        setShowCartModal(false)
        
        // Reset customer info form
        setCustomerInfo({
          name: '',
          phone: '',
          email: '',
          address: '',
          address2: '',
          deliveryTime: 'asap',
          specialInstructions: '',
          latitude: undefined,
          longitude: undefined,
          postalPricingId: undefined,
          cityName: undefined,
          countryCode: undefined,
          city: undefined,
          postalCode: undefined
        })
        // Clear postal pricing state
        setSelectedPostalPricing(null)
        setPostalPricingOptions([])
        
        // Clear any delivery errors
        setDeliveryError(null)
        setCalculatedDeliveryFee(storeData.deliveryFee)
      
        // Show enhanced success message
        setOrderSuccessMessage({
          visible: true,
          orderNumber: result.orderNumber
        })
        
        // Open WhatsApp after 5 second delay to give users time to read the success message
        setTimeout(() => {
          window.location.href = result.whatsappUrl
        }, 5000)
        
        // Hide success message after 10 seconds
        setTimeout(() => {
          setOrderSuccessMessage(null)
        }, 10000)
      } else {
        // Display the error message from the API, or fallback to default message
        // Map API error messages to translations
        let errorMessage = result.error || result.message || (translations.failedToCreateOrder || 'Failed to create order. Please try again.')
        
        // Map common API error messages to translations
        if (errorMessage.includes('Please select a delivery method')) {
          errorMessage = translations.pleaseSelectDeliveryMethod || 'Please select a delivery method'
        } else if (errorMessage.includes('Delivery address is required')) {
          errorMessage = translations.addDeliveryAddress || 'Please provide delivery address'
        } else if (errorMessage.includes('Customer name is required')) {
          errorMessage = translations.fillRequiredInfo || 'Please fill in required customer information'
        } else if (errorMessage.includes('Customer phone is required')) {
          errorMessage = translations.fillRequiredInfo || 'Please fill in required customer information'
        }
        
        showError(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Order submission error:', error)
      showError(translations.failedToSubmitOrder || 'Failed to submit order. Please try again.', 'error')
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

  // Inject CSS for responsive cover height
  useEffect(() => {
    const styleId = 'cover-height-responsive-style'
    if (document.getElementById(styleId)) return
    
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .cover-image-responsive {
        height: var(--cover-height-mobile) !important;
      }
      @media (min-width: 768px) {
        .cover-image-responsive {
          height: var(--cover-height-desktop) !important;
        }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: storeData.fontFamily }}>

      {/* Header Section - FIXED COVER IMAGE */}
      <div className="bg-white">
        <div className="max-w-[75rem] mx-auto">
          {/* Cover Image Section - FIXED: No gradient overlay when cover image exists */}
          <div 
            className="cover-image-responsive relative md:rounded-xl overflow-hidden"
            style={{
              ...getCoverImageStyle(storeData, primaryColor),
              '--cover-height-mobile': storeData.coverHeightMobile || storeData.coverHeight || '160px',
              '--cover-height-desktop': storeData.coverHeightDesktop || storeData.coverHeight || '220px'
            } as React.CSSProperties & { '--cover-height-mobile': string; '--cover-height-desktop': string }}
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
                color: primaryColor,
                padding: storeData.logoPadding || '0px'
              }}
            >
              {storeData.logo ? (
                <img 
                  src={storeData.logo} 
                  alt={storeData.name} 
                  className="w-full h-full rounded-full" 
                  style={{
                    objectFit: (storeData.logoObjectFit || 'cover') as 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
                  }}
                />
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
                        
          {(() => {
  const lang = storeData.storefrontLanguage || storeData.language || 'en'
  const displayDescription = (lang === 'sq' || lang === 'al') && storeData.descriptionAl 
    ? storeData.descriptionAl 
    : lang === 'el' && storeData.descriptionEl
      ? storeData.descriptionEl
      : storeData.description
  
  return displayDescription && (
    <p className="text-gray-500 text-md sm:text-md mb-3">{displayDescription}</p>
  )
})()}
              <div className="space-y-2 sm:space-y-0">
              {/* Address */}
              {storeData.address && (
                <div className="flex items-center gap-1 mb-2 text-gray-500">
                  <MapPin className="w-4 h-4" style={{ color: storeData.primaryColor }} />
                  <span className="text-md">{storeData.address}</span>
                </div>
              )}
              
              {/* For RETAIL: Show postal methods, for others: Show time and fee */}
              {storeData.businessType === 'RETAIL' && deliveryType === 'delivery' ? (
                <div className="space-y-2">
                  {/* Always show clock and package icons with custom text by default, replace with postal values when selected */}
                  <div className="flex items-center gap-4 sm:gap-5 text-gray-500">
                    {/* Clock icon - custom text by default, postal delivery time when selected */}
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 flex-shrink-0" style={{ color: storeData.primaryColor }} />
                      <span className="text-md">
                        {selectedPostalPricing 
                          ? (selectedPostalPricing.delivery_time_al || selectedPostalPricing.delivery_time || storeData.deliveryTimeText || storeData.estimatedDeliveryTime || '30-45 min')
                          : (storeData.deliveryTimeText || storeData.estimatedDeliveryTime || '30-45 min')}
                      </span>
                    </div>
                    {/* Package icon - custom text by default, postal price when selected */}
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4 flex-shrink-0" style={{ color: storeData.primaryColor }} />
                      <span className="text-md">
                        {selectedPostalPricing 
                          ? (calculatedDeliveryFee > 0 
                              ? `${currencySymbol}${calculatedDeliveryFee.toFixed(2)}`
                              : (storeData.freeDeliveryText || translations.freeDelivery || 'Free Delivery'))
                          : (calculatedDeliveryFee > 0 
                              ? `${currencySymbol}${calculatedDeliveryFee.toFixed(2)}`
                              : (storeData.freeDeliveryText || translations.freeDelivery || 'Free Delivery'))}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 sm:gap-5 text-gray-500">
                  {(deliveryType === 'delivery' ? storeData.estimatedDeliveryTime : storeData.estimatedPickupTime) && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 flex-shrink-0" style={{ color: storeData.primaryColor }} />
                      <span className="text-md">
                        {deliveryType === 'delivery' 
                          ? (storeData.deliveryTimeText || storeData.estimatedDeliveryTime)  // Use custom text if available
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
                          : (storeData.freeDeliveryText || translations.freeDelivery || 'Free Delivery')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Store className="w-4 h-4 flex-shrink-0" style={{ color: storeData.primaryColor }} />
                      <span className="text-md">{translations.pickupAvailable || 'Pickup available'}</span>
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[75rem] mx-auto px-4 md:px-0 py-6 grid lg:grid-cols-3 gap-8 relative">
        {/* Left Side - Menu */}
        <div className="lg:col-span-2 overflow-hidden">
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
  <div className="flex gap-2">
    {/* Search Input - takes most space */}
    <div className="relative flex-1">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder={searchTerm ? (searchTerm.length < 3 ? `Type at least 3 characters...` : `Searching for "${searchTerm}"...`) : (storeData.businessType === 'RETAIL' ? (translations.searchProducts || "Search products") : (translations.search || "Search for dishes, ingredients..."))}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          // Auto-switch to "All" category when searching to show all results
          if (e.target.value.trim() && selectedCategory !== 'all') {
            setSelectedCategory('all')
          }
        }}
        className="search-input w-full pl-11 pr-12 py-3 border-2 border-gray-200 rounded-xl text-base outline-none focus:border-2 transition-colors text-gray-900 placeholder:text-gray-500"
        style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
        onFocus={(e) => e.target.style.borderColor = primaryColor}
        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        disabled={false}
      />
      {/* Clear search button */}
      {searchTerm && (
        <button
          onClick={() => {
            setSearchTerm('')
            setDebouncedSearchTerm('')
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3 text-gray-600" />
        </button>
      )}
    </div>
    
    {/* Filter Button - smaller width */}
    <button
      onClick={() => setShowFilterModal(true)}
      className="flex items-center justify-center px-3 py-3 border-2 border-gray-200 rounded-xl text-base transition-colors hover:border-gray-300 flex-shrink-0"
      style={{ 
        borderColor: (
          priceMin !== '' || 
          priceMax !== '' || 
          selectedFilterCategory !== null || 
          selectedCollections.size > 0 ||
          selectedGroups.size > 0 ||
          selectedBrands.size > 0 ||
          sortBy !== 'name-asc'
        ) ? primaryColor : undefined
      }}
    >
      <SlidersHorizontal className="w-5 h-5 text-gray-600" />
    </button>
  </div>
  
  {/* Active Filters Badges */}
  {(
    priceMin !== '' || 
    priceMax !== '' || 
    selectedFilterCategory !== null || 
    selectedCollections.size > 0 ||
    selectedGroups.size > 0 ||
    selectedBrands.size > 0 ||
    sortBy !== 'name-asc'
  ) && (
    <div className="py-3">
      <div className="flex flex-wrap gap-2">
        {/* Price Range Badge */}
        {(priceMin !== '' || priceMax !== '') && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm">
            <span className="text-gray-700">
              {priceMin !== '' && priceMax !== '' 
                ? `${currencySymbol}${priceMin} - ${currencySymbol}${priceMax}`
                : priceMin !== '' 
                ? `Min: ${currencySymbol}${priceMin}`
                : `Max: ${currencySymbol}${priceMax}`
              }
            </span>
            <button
              onClick={() => {
                setPriceMin('')
                setPriceMax('')
              }}
              className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
            >
              <X className="w-2.5 h-2.5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Category Badge - Only show if modal filter is active AND no main menu category is selected */}
        {selectedFilterCategory && selectedCategory === 'all' && (() => {
          const category = storeData.categories.find(cat => cat.id === selectedFilterCategory)
          if (!category) return null
          return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm">
              <span className="text-gray-700">{category.name}</span>
              <button
                onClick={() => {
                  setSelectedFilterCategory(null)
                  setSelectedCategory('all')
                }}
                className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="w-2.5 h-2.5 text-gray-600" />
              </button>
            </div>
          )
        })()}

        {/* Collections Badges */}
        {selectedCollections.size > 0 && (() => {
          const availableCollections = storeData.customFilteringEnabled && storeData.customFilterSettings?.collectionsEnabled 
            && storeData.customFilterSettings.collectionsMode === 'custom'
            ? (storeData.collections || []).filter((c: any) => 
                (storeData.customFilterSettings.selectedCollections || []).includes(c.id)
              )
            : storeData.collections || []
          
          return availableCollections.map((collection: any) => {
            if (!selectedCollections.has(collection.id)) return null
            return (
            <div key={`collection-${collection.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm">
              <span className="text-gray-700">
                {storeData.storefrontLanguage === 'sq' && collection.nameAl ? collection.nameAl : collection.name}
              </span>
              <button
                onClick={() => {
                  const newCollections = new Set(selectedCollections)
                  newCollections.delete(collection.id)
                  setSelectedCollections(newCollections)
                }}
                className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="w-2.5 h-2.5 text-gray-600" />
              </button>
            </div>
            )
          })
        })()}

        {/* Groups Badges */}
        {selectedGroups.size > 0 && (() => {
          const availableGroups = storeData.customFilteringEnabled && storeData.customFilterSettings?.groupsEnabled 
            && storeData.customFilterSettings.groupsMode === 'custom'
            ? (storeData.groups || []).filter((g: any) => 
                (storeData.customFilterSettings.selectedGroups || []).includes(g.id)
              )
            : storeData.groups || []
          
          return availableGroups.map((group: any) => {
            if (!selectedGroups.has(group.id)) return null
            return (
            <div key={`group-${group.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm">
              <span className="text-gray-700">
                {storeData.storefrontLanguage === 'sq' && group.nameAl ? group.nameAl : group.name}
              </span>
              <button
                onClick={() => {
                  const newGroups = new Set(selectedGroups)
                  newGroups.delete(group.id)
                  setSelectedGroups(newGroups)
                }}
                className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="w-2.5 h-2.5 text-gray-600" />
              </button>
            </div>
            )
          })
        })()}

        {/* Brands Badges */}
        {selectedBrands.size > 0 && (() => {
          const availableBrands = storeData.customFilteringEnabled && storeData.customFilterSettings?.brandsEnabled 
            && storeData.customFilterSettings.brandsMode === 'custom'
            ? (storeData.brands || []).filter((b: any) => 
                (storeData.customFilterSettings.selectedBrands || []).includes(b.id)
              )
            : storeData.brands || []
          
          return availableBrands.map((brand: any) => {
            if (!selectedBrands.has(brand.id)) return null
            return (
            <div key={`brand-${brand.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm">
              <span className="text-gray-700">
                {storeData.storefrontLanguage === 'sq' && brand.nameAl ? brand.nameAl : brand.name}
              </span>
              <button
                onClick={() => {
                  const newBrands = new Set(selectedBrands)
                  newBrands.delete(brand.id)
                  setSelectedBrands(newBrands)
                }}
                className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <X className="w-2.5 h-2.5 text-gray-600" />
              </button>
            </div>
            )
          })
        })()}

        {/* Sort By Badge */}
        {sortBy !== 'name-asc' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm">
            <span className="text-gray-700">
              {translations.sort || 'Sort'}: {
                sortBy === 'name-desc' ? (translations.sortByNameDesc || 'Name (Z-A)') :
                sortBy === 'price-asc' ? (translations.sortByPriceAsc || 'Price (Low-High)') :
                (translations.sortByPriceDesc || 'Price (High-Low)')
              }
            </span>
            <button
              onClick={() => setSortBy('name-asc')}
              className="w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
            >
              <X className="w-2.5 h-2.5 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  )}

  {/* Search suggestions/results count - only show when search has 3+ characters AND API call is complete */}
  {debouncedSearchTerm && debouncedSearchTerm.trim().length >= 3 && !productsLoading && (
    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
      <p className="text-sm text-gray-600">
        {totalProducts === 0 
          ? `${translations.noResultsFor || 'No results for'} "${debouncedSearchTerm}"`
          : `${totalProducts} ${totalProducts !== 1 ? (translations.results || 'results') : (translations.result || 'result')} ${translations.for || 'for'} "${debouncedSearchTerm}"`
        }
      </p>
    </div>
  )}
</div>

          {/* Category Tabs / Custom Menu */}
          <div className="space-y-4 mb-6">
            {/* Check if custom menu is enabled and has items */}
            {storeData.customMenuEnabled && storeData.customMenuItems && (storeData.customMenuItems as any[]).length > 0 ? (
              /* CUSTOM MENU */
              <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <button
                  onClick={() => {
                    // Set filtering state immediately for better UX
                    if (products.length > 0) {
                      setIsFiltering(true)
                    }
                    setSelectedMenuItem(null)
                    setSelectedCategory('all')
                    setSelectedSubCategory(null)
                    setSelectedCollections(new Set())
                    setSelectedGroups(new Set())
                    setSelectedBrands(new Set())
                  }}
                  className={`px-5 py-3 font-medium transition-all whitespace-nowrap border-b-2 relative ${
                    !selectedMenuItem
                      ? 'border-b-2'
                      : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                  }`}
                  style={{ 
                    color: !selectedMenuItem ? primaryColor : undefined,
                    borderBottomColor: !selectedMenuItem ? primaryColor : 'transparent'
                  }}
                >
                  {translations.all || 'All'}
                </button>
                
                {(storeData.customMenuItems as any[]).filter(item => item.isActive).map((item: any) => {
                  // Get the display name
                  let displayName = storeData.storefrontLanguage === 'sq' && item.nameAl ? item.nameAl : item.name
                  
                  // Transform to proper case for bybest-shop
                  if (storeData.slug === 'bybest-shop') {
                    const nameToCheck = (item.nameAl || item.name || '').toUpperCase()
                    
                    if (nameToCheck === 'DHURATA') displayName = 'Dhurata'
                    else if (nameToCheck === 'ULJE') displayName = 'Ulje'
                    else if (nameToCheck === 'SHTËPI' || nameToCheck === 'SHTEPI') displayName = 'Shtëpia'
                    else if (nameToCheck === 'FËMIJË' || nameToCheck === 'FEMIJE') displayName = 'Fëmijë'
                    else if (nameToCheck === 'VAJZA & GRA') displayName = 'Vajza & Gra'
                    else if (nameToCheck === 'MESHKUJ') displayName = 'Meshkuj'
                    else if (nameToCheck === 'EKSPOLORONI OFERTAT') displayName = 'Ekspoloroni Ofertat'
                    else if (nameToCheck.includes('EKSPLORON')) displayName = 'Ekspoloroni Ofertat'
                  }
                  
                  // Check if this is a special styled item for bybest-shop
                  const nameAlUpper = (item.nameAl || '').toUpperCase()
                  const nameUpper = (item.name || '').toUpperCase()
                  
                  const isUlje = storeData.slug === 'bybest-shop' && (nameAlUpper.includes('ULJE') || nameUpper.includes('SALE'))
                  const isEkspoloroniOfertat = storeData.slug === 'bybest-shop' && (
                    nameAlUpper.includes('EKSPLORON') || 
                    nameAlUpper.includes('OFERTAT') || 
                    nameUpper.includes('EXPLORE') || 
                    nameUpper.includes('OFFER')
                  )
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.type === 'link' && item.url) {
                          window.open(item.url, '_blank')
                        } else {
                          // Set filtering state immediately for better UX
                          if (products.length > 0) {
                            setIsFiltering(true)
                          }
                          setSelectedMenuItem(item.id)
                          setSearchTerm('')
                          setDebouncedSearchTerm('')
                          
                          // Clear all filters first
                          setSelectedCollections(new Set())
                          setSelectedGroups(new Set())
                          setSelectedBrands(new Set())
                          setSelectedSubCategory(null)
                          setSelectedFilterCategory(null) // Clear modal filter
                          
                          // Apply filter based on type
                          if (item.type === 'category') {
                            setSelectedCategory(item.targetId)
                          } else if (item.type === 'collection') {
                            setSelectedCategory('all')
                            setSelectedCollections(new Set([item.targetId]))
                          } else if (item.type === 'group') {
                            setSelectedCategory('all')
                            setSelectedGroups(new Set([item.targetId]))
                          }
                        }
                      }}
                      className={`px-5 py-3 font-medium transition-all whitespace-nowrap border-b-2 relative inline-flex items-center gap-1 ${
                        selectedMenuItem === item.id
                          ? 'border-b-2'
                          : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                      }`}
                      style={{ 
                        color: selectedMenuItem === item.id 
                          ? primaryColor 
                          : isEkspoloroniOfertat 
                            ? '#B91C1C' // dark red for Ekspoloroni Ofertat
                            : isUlje 
                              ? '#B91C1C' // red for Ulje
                              : undefined,
                        borderBottomColor: selectedMenuItem === item.id ? primaryColor : 'transparent'
                      }}
                    >
                      {displayName}
                      {isEkspoloroniOfertat && (
                        <Zap 
                          className="h-3.5 w-3.5 ml-1" 
                          fill="#B91C1C" 
                          stroke="#B91C1C"
                          strokeWidth={2}
                        />
                      )}
                      {item.type === 'link' && <ExternalLink className="h-3 w-3" />}
                    </button>
                  )
                })}
              </div>
            ) : (
              /* DEFAULT CATEGORY MENU */
              <>
            {/* Parent Category Tabs */}
            {!shouldShowOnlySubcategories && (
              <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <button
                  onClick={() => {
                    // Set filtering state immediately for better UX when switching FROM a category TO "All"
                    // Only gray out if we're currently on a category (not already on "All") and have products
                    if (selectedCategory !== 'all' && products.length > 0) {
                      setIsFiltering(true)
                    }
                    setSelectedCategory('all')
                    setSelectedSubCategory(null)
                    setSelectedFilterCategory(null) // Clear modal filter so main menu takes priority
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
                  {debouncedSearchTerm && debouncedSearchTerm.trim().length >= 3 && selectedCategory === 'all' && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {totalProducts}
                    </span>
                  )}
                </button>
                {parentCategories.map(category => {
                  // Count products in this category (including subcategories)
                  // During search: calculate from loaded products (may not be 100% accurate but shows relative counts)
                  // Without search: use productCount from API (total counts)
                  const categoryProductCount = debouncedSearchTerm && debouncedSearchTerm.trim().length >= 3
                    ? (() => {
                        // Calculate count from currently loaded search results
                        const categoryIds = [category.id]
                        if (category.children) {
                          categoryIds.push(...category.children.map(c => c.id))
                        }
                        return products.filter(p => categoryIds.includes(p.categoryId)).length
                      })()
                    : null // Hide counts when not searching (only show during search)
                  
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        // Set filtering state immediately for better UX
                        if (products.length > 0) {
                          setIsFiltering(true)
                        }
                        mainMenuClickedRef.current = true // Mark that main menu was clicked
                        setSelectedCategory(category.id)
                        setSelectedSubCategory(null)
                        setSelectedFilterCategory(null) // Clear modal filter so main menu takes priority
                        // Keep search term when switching to category (allow filtering by category + search)
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
                      {/* Show category count badges ONLY during search (not on initial load) */}
                      {debouncedSearchTerm && debouncedSearchTerm.trim().length >= 3 && categoryProductCount !== null && categoryProductCount > 0 && selectedCategory !== 'all' && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {categoryProductCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Subcategory Tabs - Show when parent is selected OR when hideParentInStorefront is true */}
            {(shouldShowOnlySubcategories || (selectedParentCategory && currentSubCategories.length > 0)) && (
              <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {/* "All" button - always visible in subcategory row */}
                <button
                  onClick={() => {
                    if (shouldShowOnlySubcategories) {
                      setSelectedCategory('all')
                    } else {
                      setSelectedSubCategory(null)
                    }
                    // Keep search term when switching to "All" (allow filtering by search)
                  }}
                  className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap border-b-2 relative ${
                    (shouldShowOnlySubcategories ? selectedCategory === 'all' : !selectedSubCategory)
                      ? 'border-b-2'
                      : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                  }`}
                  style={{ 
                    color: (shouldShowOnlySubcategories ? selectedCategory === 'all' : !selectedSubCategory) ? primaryColor : undefined,
                    borderBottomColor: (shouldShowOnlySubcategories ? selectedCategory === 'all' : !selectedSubCategory) ? primaryColor : 'transparent'
                  }}
                >
                  {translations.all || 'All'}
                </button>
                {(shouldShowOnlySubcategories 
                  ? childCategories // When parent is hidden, all categories are already children (no need to filter)
                  : currentSubCategories
                ).map(subcategory => {
                  // Find full subcategory data from storeData
                  const fullSubcategory = storeData.categories.find(cat => cat.id === subcategory.id)
                  // During search: calculate from loaded products
                  // Without search: hide counts (only show during search)
                  const subcategoryProductCount = debouncedSearchTerm && debouncedSearchTerm.trim().length >= 3
                    ? products.filter(p => p.categoryId === subcategory.id).length // Count from search results
                    : null // Hide counts when not searching
                  
                  return (
                    <button
                      key={subcategory.id}
                      onClick={() => {
                        // Set filtering state immediately for better UX
                        if (products.length > 0) {
                          setIsFiltering(true)
                        }
                        if (shouldShowOnlySubcategories) {
                          setSelectedCategory(subcategory.id)
                        } else {
                          setSelectedSubCategory(subcategory.id)
                        }
                        // Keep search term when selecting subcategory (allow filtering by category + search)
                      }}
                      className={`px-4 py-2 text-sm font-medium transition-all whitespace-nowrap border-b-2 relative ${
                        (shouldShowOnlySubcategories ? selectedCategory === subcategory.id : selectedSubCategory === subcategory.id)
                          ? 'border-b-2'
                          : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                      }`}
                      style={{ 
                        color: (shouldShowOnlySubcategories ? selectedCategory === subcategory.id : selectedSubCategory === subcategory.id) ? primaryColor : undefined,
                        borderBottomColor: (shouldShowOnlySubcategories ? selectedCategory === subcategory.id : selectedSubCategory === subcategory.id) ? primaryColor : 'transparent'
                      }}
                    >
                      {subcategory.name}
                      {/* Show subcategory count badges ONLY during search (not on initial load) */}
                      {debouncedSearchTerm && debouncedSearchTerm.trim().length >= 3 && subcategoryProductCount !== null && subcategoryProductCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {subcategoryProductCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
            </>
            )}
          </div>

          <StoreClosure 
  storeData={storeData} 
  primaryColor={primaryColor} 
  translations={translations} 
/>
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {(() => {
                // Show error state only
                if (productsError && products.length === 0) {
                  return (
                    <div className="col-span-full text-center py-12">
                      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">{productsError}</p>
                      <button
                        onClick={() => fetchProducts(1, true)}
                        className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {translations.tryAgain || 'Try Again'}
                      </button>
                    </div>
                  )
                }
                
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
                
                // Don't show empty state during initial load - let products appear naturally
                if (filteredProducts.length === 0 && !productsLoading) {
                if (debouncedSearchTerm && debouncedSearchTerm.trim().length >= 3) {
                    return (
                    <div className="col-span-full">
                        <EmptyState 
                        type="search-empty"
                        primaryColor={primaryColor}
                        translations={translations}
                        searchTerm={debouncedSearchTerm}
                        onClearSearch={() => {
                            setSearchTerm('')
                            setDebouncedSearchTerm('')
                        }}
                        onShowAll={() => {
                            setSearchTerm('')
                            setDebouncedSearchTerm('')
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
                } else if (!productsLoading) {
                    // Only show "no products" if we're not loading
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
                // During loading, show nothing (products will appear when ready)
                return null
                }
                
                // Infinite scroll: Only render products up to displayedProductsCount
                const visibleProducts = filteredProducts.slice(0, Math.min(displayedProductsCount, filteredProducts.length))
                
                return (
                  <>
                    {visibleProducts.map(product => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onOpenModal={openProductModal}
                        primaryColor={primaryColor}
                        currencySymbol={currencySymbol}
                        translations={translations}
                        disabled={storeData.isTemporarilyClosed}
                        cart={cart}
                        featuredBadgeColor={storeData.featuredBadgeColor}
                        storefrontLanguage={storeData.storefrontLanguage || storeData.language || 'en'}
                        businessSlug={storeData.slug}
                        isFiltering={isFiltering}
                      />
                    ))}
                    {/* Subtle loading indicator for pagination - 3 bouncing dots */}
                    {productsLoading && products.length > 0 && (
                      <div className="col-span-full text-center py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <div 
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ 
                              backgroundColor: primaryColor,
                              animationDelay: '0ms',
                              animationDuration: '1.4s'
                            }}
                          ></div>
                          <div 
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ 
                              backgroundColor: primaryColor,
                              animationDelay: '160ms',
                              animationDuration: '1.4s'
                            }}
                          ></div>
                          <div 
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ 
                              backgroundColor: primaryColor,
                              animationDelay: '320ms',
                              animationDuration: '1.4s'
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </>
                )
            })()}
            </div>
        </div>

        {/* Right Side - Order Panel (Desktop) - Fixed and Scrollable */}
        <div className="hidden lg:block lg:sticky lg:top-8 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
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
          postalPricingOptions={postalPricingOptions}
          loadingPostalPricing={loadingPostalPricing}
          selectedPostalPricing={selectedPostalPricing}
          setSelectedPostalPricing={setSelectedPostalPricing}
          setCalculatedDeliveryFee={setCalculatedDeliveryFee}
          countries={countries}
          cities={cities}
          loadingCountries={loadingCountries}
          loadingCities={loadingCities}
          deliveryOptions={getDeliveryOptions()}
          primaryColor={primaryColor}
          translations={translations}
          onLocationChange={handleLocationChange}
          // @ts-ignore
          deliveryError={deliveryError}
          onClearDeliveryError={handleClearDeliveryError}
          canSubmitOrder={canSubmitOrder}
          forceScheduleMode={forceScheduleMode}
        />
        </div>
      </div>

      {/* Mobile Cart Bar */}
      {cartItemCount > 0 && !storeData.isTemporarilyClosed && storeData.mobileCartStyle !== 'badge' && (
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
                <span>{cartItemCount} {cartItemCount === 1 ? translations.item : translations.items}</span>
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
              <h2 className="text-lg font-semibold text-gray-900">{translations.yourOrder}</h2>
              <button
                onClick={() => setShowCartModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(85vh-180px)] scrollbar-hide">
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
              postalPricingOptions={postalPricingOptions}
              loadingPostalPricing={loadingPostalPricing}
              selectedPostalPricing={selectedPostalPricing}
              setSelectedPostalPricing={setSelectedPostalPricing}
              setCalculatedDeliveryFee={setCalculatedDeliveryFee}
              countries={countries}
              cities={cities}
              loadingCountries={loadingCountries}
              loadingCities={loadingCities}
              deliveryOptions={getDeliveryOptions()}
              primaryColor={primaryColor}
              translations={translations}
              onLocationChange={handleLocationChange}
              isMobile={true}
              // @ts-ignore
              deliveryError={deliveryError}
              onClearDeliveryError={handleClearDeliveryError}
              canSubmitOrder={canSubmitOrder}
              forceScheduleMode={forceScheduleMode}
            />
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && selectedProduct && !storeData.isTemporarilyClosed && (
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
          cart={cart}
          showError={showError}
          featuredBadgeColor={storeData.featuredBadgeColor}
          storefrontLanguage={storeData.storefrontLanguage || storeData.language || 'en'}
          businessSlug={storeData.slug}
          onShareProduct={handleShareProduct}
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
      {cartItemCount > 0 && !storeData.isTemporarilyClosed && storeData.mobileCartStyle === 'badge' && (
        <div 
          className="lg:hidden fixed bottom-10 right-5 w-15 h-15 rounded-full flex items-center justify-center shadow-xl cursor-pointer z-40"
          style={{ backgroundColor: storeData.whatsappButtonColor || primaryColor }}
          onClick={() => setShowCartModal(true)}
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.382"/>
          </svg>
          <span 
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ backgroundColor: storeData.cartBadgeColor || '#EF4444' }}
          >
            {cartItemCount}
          </span>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollToTop && !showCartModal && !showProductModal && !showBusinessInfoModal && !showShareModal && !showSchedulingModal && !showFilterModal && (
        <button
          onClick={scrollToTop}
          className={`fixed ${cartItemCount > 0 && !storeData.isTemporarilyClosed && storeData.mobileCartStyle !== 'badge' ? 'bottom-24' : 'bottom-10'} right-5 lg:right-[21px] lg:mr-6 w-12 h-12 rounded-full flex items-center justify-center shadow-xl cursor-pointer z-[60] transition-all duration-300 hover:scale-110`}
          style={{ backgroundColor: primaryColor }}
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
      )}

         {/* Add this before the closing div */}
    <OrderSuccessMessage
      isVisible={orderSuccessMessage?.visible || false}
      onClose={() => setOrderSuccessMessage(null)}
      orderNumber={orderSuccessMessage?.orderNumber || ''}
      primaryColor={primaryColor}
      translations={translations}
      storeData={storeData}
    />

<ErrorMessage
  isVisible={errorMessage?.visible || false}
  onClose={() => setErrorMessage(null)}
  message={errorMessage?.message || ''}
  type={errorMessage?.type || 'error'}
  primaryColor={primaryColor}
  translations={translations}
/>

<SchedulingModal
  isOpen={showSchedulingModal}
  onClose={() => setShowSchedulingModal(false)}
  onSchedule={() => {
    setShowSchedulingModal(false)
    setForceScheduleMode(true) // This uses the state you just added above
    setTimeout(() => {
      document.querySelector('[data-time-selection]')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }}
  primaryColor={primaryColor}
  translations={translations}
/>

      {/* Filter Modal - Side Drawer on Mobile */}
      {showFilterModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:z-40"
            onClick={() => setShowFilterModal(false)}
          />
          
          {/* Modal Content - Side drawer on mobile, centered on desktop */}
          <div className="fixed inset-y-0 right-0 lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 w-full max-w-md lg:max-w-lg bg-white z-50 lg:z-50 lg:rounded-2xl shadow-2xl flex flex-col max-h-screen lg:max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{translations.filterProducts || 'Filter Products'}</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{ overscrollBehavior: 'contain' }}>
              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{translations.priceRange || 'Price Range'}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{translations.minPrice || 'Min Price'}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">{currencySymbol}</span>
                      <input
                        type="number"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-lg text-base outline-none focus:border-2 transition-colors text-gray-900 placeholder:text-gray-500"
                        style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                        onFocus={(e) => e.target.style.borderColor = primaryColor}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">{translations.maxPrice || 'Max Price'}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">{currencySymbol}</span>
                      <input
                        type="number"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder={translations.noLimit || 'No limit'}
                        min="0"
                        className="w-full pl-8 pr-3 py-2 border-2 border-gray-200 rounded-lg text-base outline-none focus:border-2 transition-colors text-gray-900 placeholder:text-gray-500"
                        style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                        onFocus={(e) => e.target.style.borderColor = primaryColor}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories - Show default categories if custom filtering is not enabled OR if custom filtering is enabled but categories are disabled */}
              {(!storeData.customFilteringEnabled || !storeData.customFilterSettings?.categoriesEnabled) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{translations.categories || 'Categories'}</h3>
                  <ScrollableSection maxHeight="180px">
                    <label className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="filterCategory"
                        value=""
                        checked={selectedFilterCategory === null}
                        onChange={() => {
                          setSelectedFilterCategory(null)
                          setSelectedCategory('all')
                        }}
                        className="w-4 h-4 border-gray-300 text-gray-600 focus:ring-2 focus:ring-offset-0"
                        style={{ accentColor: primaryColor }}
                      />
                      <span className="ml-3 text-sm text-gray-700">{translations.all || 'All'}</span>
                    </label>
                    {storeData.categories.map(category => (
                      <label key={category.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="radio"
                          name="filterCategory"
                          value={category.id}
                          checked={selectedFilterCategory === category.id}
                          onChange={() => {
                            setSelectedFilterCategory(category.id)
                            setSelectedCategory('all') // Set to 'all' so modal filter takes priority and badge shows
                          }}
                          className="w-4 h-4 border-gray-300 text-gray-600 focus:ring-2 focus:ring-offset-0"
                          style={{ accentColor: primaryColor }}
                        />
                        <span className="ml-3 text-sm text-gray-700">{category.name}</span>
                      </label>
                    ))}
                  </ScrollableSection>
                </div>
              )}

              {/* Collections Filter - Only show if enabled */}
              {storeData.customFilteringEnabled && (storeData.customFilterSettings?.collectionsEnabled === true) && storeData.collections && storeData.collections.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{translations.collections || 'Collections'}</h3>
                  <ScrollableSection maxHeight="150px">
                    {(() => {
                      const collectionsMode = storeData.customFilterSettings?.collectionsMode || 'all'
                      const availableCollections = collectionsMode === 'all' 
                        ? storeData.collections || []
                        : (storeData.collections || []).filter((c: any) => {
                            const selectedIds = storeData.customFilterSettings.selectedCollections || []
                            // Check if primary ID matches OR if any merged ID matches (for deduplicated entities)
                            return selectedIds.includes(c.id) || 
                                   (c.ids && c.ids.some((id: string) => selectedIds.includes(id)))
                          })
                      return availableCollections.map((collection: any) => (
                      <label key={collection.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCollections.has(collection.id)}
                          onChange={(e) => {
                            const newCollections = new Set(selectedCollections)
                            if (e.target.checked) {
                              newCollections.add(collection.id)
                            } else {
                              newCollections.delete(collection.id)
                            }
                            setSelectedCollections(newCollections)
                          }}
                          className="w-4 h-4 border-gray-300 rounded text-gray-600 focus:ring-2 focus:ring-offset-0"
                          style={{ accentColor: primaryColor }}
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {storeData.storefrontLanguage === 'sq' && collection.nameAl ? collection.nameAl : collection.name}
                        </span>
                      </label>
                      ))
                    })()}
                  </ScrollableSection>
                </div>
              )}

              {/* Groups Filter - Only show if enabled */}
              {storeData.customFilteringEnabled && (storeData.customFilterSettings?.groupsEnabled === true) && storeData.groups && storeData.groups.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{translations.groups || 'Groups'}</h3>
                  <ScrollableSection maxHeight="150px">
                    {(() => {
                      const groupsMode = storeData.customFilterSettings?.groupsMode || 'all'
                      const availableGroups = groupsMode === 'all' 
                        ? storeData.groups || []
                        : (storeData.groups || []).filter((g: any) => {
                            const selectedIds = storeData.customFilterSettings.selectedGroups || []
                            // Check if primary ID matches OR if any merged ID matches (for deduplicated entities)
                            return selectedIds.includes(g.id) || 
                                   (g.ids && g.ids.some((id: string) => selectedIds.includes(id)))
                          })
                      return availableGroups.map((group: any) => (
                      <label key={group.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGroups.has(group.id)}
                          onChange={(e) => {
                            const newGroups = new Set(selectedGroups)
                            if (e.target.checked) {
                              newGroups.add(group.id)
                            } else {
                              newGroups.delete(group.id)
                            }
                            setSelectedGroups(newGroups)
                          }}
                          className="w-4 h-4 border-gray-300 rounded text-gray-600 focus:ring-2 focus:ring-offset-0"
                          style={{ accentColor: primaryColor }}
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {(() => {
                            let displayName = storeData.storefrontLanguage === 'sq' && group.nameAl ? group.nameAl : group.name
                            
                            // Transform to proper case for bybest-shop
                            if (storeData.slug === 'bybest-shop') {
                              const nameToCheck = (group.nameAl || group.name || '').toUpperCase()
                              
                              if (nameToCheck === 'DHURATA') displayName = 'Dhurata'
                              else if (nameToCheck === 'ULJE') displayName = 'Ulje'
                              else if (nameToCheck === 'SHTËPI' || nameToCheck === 'SHTEPI') displayName = 'Shtëpia'
                              else if (nameToCheck === 'FËMIJË' || nameToCheck === 'FEMIJE') displayName = 'Fëmijë'
                              else if (nameToCheck === 'VAJZA & GRA') displayName = 'Vajza & Gra'
                              else if (nameToCheck === 'MESHKUJ') displayName = 'Meshkuj'
                              else if (nameToCheck === 'EKSPOLORONI OFERTAT' || nameToCheck.includes('EKSPLORON')) displayName = 'Ekspoloroni Ofertat'
                            }
                            
                            return displayName
                          })()}
                        </span>
                      </label>
                      ))
                    })()}
                  </ScrollableSection>
                </div>
              )}

              {/* Brands Filter - Only show if enabled */}
              {storeData.customFilteringEnabled && (storeData.customFilterSettings?.brandsEnabled === true) && storeData.brands && storeData.brands.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{translations.brands || 'Brands'}</h3>
                  <ScrollableSection maxHeight="150px">
                    {(() => {
                      const brandsMode = storeData.customFilterSettings?.brandsMode || 'all'
                      const availableBrands = brandsMode === 'all' 
                        ? storeData.brands || []
                        : (storeData.brands || []).filter((b: any) => {
                            const selectedIds = storeData.customFilterSettings.selectedBrands || []
                            // Check if primary ID matches OR if any merged ID matches (for deduplicated entities)
                            return selectedIds.includes(b.id) || 
                                   (b.ids && b.ids.some((id: string) => selectedIds.includes(id)))
                          })
                      return availableBrands.map((brand: any) => (
                      <label key={brand.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBrands.has(brand.id)}
                          onChange={(e) => {
                            const newBrands = new Set(selectedBrands)
                            if (e.target.checked) {
                              newBrands.add(brand.id)
                            } else {
                              newBrands.delete(brand.id)
                            }
                            setSelectedBrands(newBrands)
                          }}
                          className="w-4 h-4 border-gray-300 rounded text-gray-600 focus:ring-2 focus:ring-offset-0"
                          style={{ accentColor: primaryColor }}
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {storeData.storefrontLanguage === 'sq' && brand.nameAl ? brand.nameAl : brand.name}
                        </span>
                      </label>
                      ))
                    })()}
                  </ScrollableSection>
                </div>
              )}

              {/* Custom Categories Filter - Only show if enabled */}
              {storeData.customFilteringEnabled && storeData.customFilterSettings?.categoriesEnabled && (() => {
                const availableCategories = storeData.customFilterSettings.categoriesMode === 'all' 
                  ? storeData.categories || []
                  : (storeData.categories || []).filter((c: any) => {
                      const selectedIds = storeData.customFilterSettings.selectedCategories || []
                      // Check if primary ID matches OR if any merged ID matches (for deduplicated entities)
                      return selectedIds.includes(c.id) || 
                             (c.ids && c.ids.some((id: string) => selectedIds.includes(id)))
                    })
                return availableCategories.length > 0
              })() && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">{translations.categories || 'Categories'}</h3>
                  <ScrollableSection maxHeight="180px">
                    <label className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="customFilterCategory"
                        value=""
                        checked={selectedFilterCategory === null}
                        onChange={() => {
                          setSelectedFilterCategory(null)
                          setSelectedCategory('all')
                        }}
                        className="w-4 h-4 border-gray-300 text-gray-600 focus:ring-2 focus:ring-offset-0"
                        style={{ accentColor: primaryColor }}
                      />
                      <span className="ml-3 text-sm text-gray-700">{translations.all || 'All'}</span>
                    </label>
                    {(() => {
                      const availableCategories = storeData.customFilterSettings.categoriesMode === 'all' 
                        ? storeData.categories || []
                        : (storeData.categories || []).filter((c: any) => {
                            const selectedIds = storeData.customFilterSettings.selectedCategories || []
                            // Check if primary ID matches OR if any merged ID matches (for deduplicated entities)
                            return selectedIds.includes(c.id) || 
                                   (c.ids && c.ids.some((id: string) => selectedIds.includes(id)))
                          })
                      return availableCategories.map((category: any) => (
                        <label key={category.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                          <input
                            type="radio"
                            name="customFilterCategory"
                            value={category.id}
                            checked={selectedFilterCategory === category.id}
                            onChange={() => {
                              setSelectedFilterCategory(category.id)
                              setSelectedCategory('all') // Set to 'all' so modal filter takes priority and badge shows
                            }}
                            className="w-4 h-4 border-gray-300 text-gray-600 focus:ring-2 focus:ring-offset-0"
                            style={{ accentColor: primaryColor }}
                          />
                          <span className="ml-3 text-sm text-gray-700">{category.name}</span>
                        </label>
                      ))
                    })()}
                  </ScrollableSection>
                </div>
              )}

              {/* Sort By */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{translations.sortBy || 'Sort By'}</h3>
                <div className="space-y-2">
                  {[
                    { value: 'name-asc', label: translations.sortByNameAsc || 'Name (A-Z)' },
                    { value: 'name-desc', label: translations.sortByNameDesc || 'Name (Z-A)' },
                    { value: 'price-asc', label: translations.sortByPriceAsc || 'Price (Low to High)' },
                    { value: 'price-desc', label: translations.sortByPriceDesc || 'Price (High to Low)' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="sortBy"
                        value={option.value}
                        checked={sortBy === option.value}
                        onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                        className="w-4 h-4 border-gray-300 text-gray-600 focus:ring-2 focus:ring-offset-0"
                        style={{ accentColor: primaryColor }}
                      />
                      <span className="ml-3 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer - Action Buttons */}
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setPriceMin('')
                  setPriceMax('')
                  setSelectedFilterCategory(null)
                  setSelectedCategory('all')
                  setSelectedCollections(new Set())
                  setSelectedGroups(new Set())
                  setSelectedBrands(new Set())
                  setSortBy('name-asc')
                }}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                {translations.clearAll || 'Clear All'}
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 px-4 py-3 rounded-xl text-white font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: primaryColor }}
              >
                {translations.applyFilters || 'Apply Filters'}
              </button>
            </div>
          </div>
        </>
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

function ProductCard({ 
  product, 
  onOpenModal, 
  primaryColor, 
  currencySymbol,
  translations,
  disabled = false,
  cart = [], // Add cart prop to check current quantities
  featuredBadgeColor = '#EF4444', // Only add this new prop
  storefrontLanguage = 'en', // Add language prop
  businessSlug = '', // Add business slug prop
  isFiltering = false // Gray out card while filtering
}: { 
  product: Product & { categoryName?: string }
  onOpenModal: (product: Product) => void
  primaryColor: string
  currencySymbol: string
  translations: any
  disabled?: boolean
  cart?: CartItem[]
  featuredBadgeColor?: string // Only add this
  storefrontLanguage?: string // Add language prop
  businessSlug?: string // Add business slug prop
  isFiltering?: boolean // Gray out card while filtering
}) {
  const hasImage = product.images.length > 0
  
  // Exception slugs: Always use English description, fallback to Albanian only if English is empty
  const exceptionSlugs = ['swarovski', 'swatch', 'villeroy-boch']
  const isExceptionSlug = exceptionSlugs.includes(businessSlug)
  
  // No fallback slugs: Don't fallback to English if Albanian is missing
  const noFallbackSlugs = ['neps-shop']
  const isNoFallbackSlug = noFallbackSlugs.includes(businessSlug)
  
  // Use Albanian/Greek description if language matches (unless exception slug)
  const useAlbanian = !isExceptionSlug && (storefrontLanguage === 'sq' || storefrontLanguage === 'al')
  const useGreek = !isExceptionSlug && storefrontLanguage === 'el'
  
  // For exception slugs: prioritize English, use Albanian/Greek only if English is empty/missing
  // For no fallback slugs: use Albanian/Greek only if available, don't fallback to English
  // For others: use Albanian/Greek if language matches, otherwise English
  const displayDescription = isExceptionSlug
    ? (product.description || product.descriptionAl || product.descriptionEl || '')
    : isNoFallbackSlug && useAlbanian
    ? (product.descriptionAl || '')
    : isNoFallbackSlug && useGreek
    ? (product.descriptionEl || '')
    : (useAlbanian && product.descriptionAl 
      ? product.descriptionAl 
      : useGreek && product.descriptionEl
        ? product.descriptionEl
        : product.description)
  
  // Calculate total quantity in cart for this product (all variants)
  const totalInCart = cart
    .filter(item => item.productId === product.id)
    .reduce((sum, item) => sum + item.quantity, 0)
  
  // Check if product has any stock available
  // If inventory tracking is disabled, product is always available
  // If it has variants, check if any variant has stock
  // Otherwise, check product stock
  const hasStock = !product.trackInventory 
    ? true 
    : product.variants.length > 0 
      ? product.variants.some(v => v.stock > 0)
      : product.stock > 0
  
  const isOutOfStock = !hasStock

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 ${
      disabled || isOutOfStock ? 'opacity-60 cursor-not-allowed' : 
      isFiltering ? 'opacity-50 grayscale cursor-wait' : 
      'hover:shadow-md cursor-pointer'
    }`}>
      <div 
        className="flex items-start p-5"
        onClick={() => !disabled && !isOutOfStock && onOpenModal(product)}
      >
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-base text-gray-900 leading-tight">
                  {product.name}
                </h3>
                {product.featured && (
                  <span 
                    className="px-2 py-1 text-white rounded text-xs font-medium whitespace-nowrap"
                    style={{ backgroundColor: featuredBadgeColor }}
                  >
                    {translations.popular || 'Popular'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="mb-1">
              {displayDescription && (
                <div 
                  className="text-sm text-gray-600 leading-relaxed line-clamp-3"
                  dangerouslySetInnerHTML={{ 
                    __html: displayDescription
                      .replace(/&amp;/g, '&')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                      .replace(/&quot;/g, '"')
                      .replace(/&#39;/g, "'")
                      .replace(/&nbsp;/g, ' ')
                  }} 
                />
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
                  if (!disabled && !isOutOfStock) {
                    onOpenModal(product)
                  }
                }}
                disabled={disabled || isOutOfStock}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform flex-shrink-0"
                style={{ backgroundColor: disabled || isOutOfStock ? '#9ca3af' : primaryColor }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Enhanced stock info */}
            {isOutOfStock && (
              <p className="text-red-600 text-sm mt-2">{translations.outOfStock || 'Out of stock'}</p>
            )}
           {!isOutOfStock && totalInCart > 0 && (
  <p className="text-sm mt-2" style={{color: primaryColor}}>
    {totalInCart} {translations.inCart}
  </p>
)}
          </div>
        </div>
        
        {hasImage && (
          <div className="w-20 h-20 ml-4 flex-shrink-0">
            <img 
              src={product.images[0]} 
              alt={product.name}
              loading="lazy"
              decoding="async"
              className={`w-full h-full object-cover rounded-lg ${disabled || isOutOfStock || isFiltering ? 'filter grayscale' : ''}`}
            />
          </div>
        )}
        
        {!hasImage && (
          <div className={`w-20 h-20 ml-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0 ${
            disabled || isOutOfStock || isFiltering ? 'filter grayscale' : ''
          }`}>
            <Package className="w-7 h-7" />
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to format product description
// Replaces HTML entities and converts list-like patterns to ordered lists
function formatProductDescription(description: string | undefined): string {
  if (!description) return ''
  
  // Replace HTML entities
  let formatted = description
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  
  // Split by newlines first
  const lines = formatted
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  // Check if it looks like a list (multiple lines with colons indicating key-value pairs)
  // Example: "Gjatësia e gjerdanit: 38 cm" pattern
  const hasListPattern = lines.length > 1 && lines.some(line => line.includes(':'))
  
  if (hasListPattern) {
    // Convert to ordered list format
    const listItems = lines.map((line: string, index: number) => {
      // Remove bullet points if present
      let cleaned = line.replace(/^[•\-\*]\s/, '').replace(/^\d+[\.\)]\s/, '').trim()
      return `${index + 1}. ${cleaned}`
    })
    return listItems.join('\n')
  }
  
  return formatted
}

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
  translations,
  cart = [],
  showError,
  featuredBadgeColor = '#EF4444', // Only add this new prop
  storefrontLanguage = 'en', // Add language prop
  businessSlug = '', // Add business slug prop
  onShareProduct // Add share callback
}: {
  product: Product
  selectedVariant: ProductVariant | null
  setSelectedVariant: (variant: ProductVariant | null) => void
  selectedModifiers: ProductModifier[]
  setSelectedModifiers: (modifiers: ProductModifier[]) => void
  onAddToCart: (product: Product, variant?: ProductVariant, modifiers?: ProductModifier[], variantDisplayName?: string) => void
  onClose: () => void
  currencySymbol: string
  primaryColor: string
  translations: any
  cart?: CartItem[]
  showError?: (message: string, type?: 'error' | 'warning' | 'info') => void
  featuredBadgeColor?: string // Only add this
  storefrontLanguage?: string // Add language prop
  businessSlug?: string // Add business slug prop
  onShareProduct?: (productId: string) => void // Add share callback
}) {
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const [showCopied, setShowCopied] = useState(false)

  // Exception slugs: Always use English description, fallback to Albanian only if English is empty
  const exceptionSlugs = ['swarovski', 'swatch', 'villeroy-boch']
  const isExceptionSlug = exceptionSlugs.includes(businessSlug)
  
  // No fallback slugs: Don't fallback to English if Albanian is missing
  const noFallbackSlugs = ['neps-shop']
  const isNoFallbackSlug = noFallbackSlugs.includes(businessSlug)
  
  // Use Albanian/Greek description if language matches (unless exception slug)
  const useAlbanian = !isExceptionSlug && (storefrontLanguage === 'sq' || storefrontLanguage === 'al')
  const useGreek = !isExceptionSlug && storefrontLanguage === 'el'
  
  // For exception slugs: prioritize English, use Albanian/Greek only if English is empty/missing
  // For no fallback slugs: use Albanian/Greek only if available, don't fallback to English
  // For others: use Albanian/Greek if language matches, otherwise English
  const displayDescription = isExceptionSlug
    ? (product.description || product.descriptionAl || product.descriptionEl || '')
    : isNoFallbackSlug && useAlbanian
    ? (product.descriptionAl || '')
    : isNoFallbackSlug && useGreek
    ? (product.descriptionEl || '')
    : (useAlbanian && product.descriptionAl 
      ? product.descriptionAl 
      : useGreek && product.descriptionEl
        ? product.descriptionEl
        : product.description)

  // Map variant names to Albanian
  const getVariantDisplayName = (variantName: string): string => {
    if (!useAlbanian) return variantName
    
    const variantNameLower = variantName.toLowerCase().trim()
    const variantMap: Record<string, string> = {
      'green': 'E gjelbër',
      'white': 'E bardhë',
      'orange': 'Portokalli',
      'red': 'E kuqe',
      'blue': 'E kaltër',
      'black': 'E zezë',
      'yellow': 'E verdhë',
      'purple': 'Vjollcë',
      'pink': 'Rozë',
      'gray': 'Gri',
      'grey': 'Gri',
      'brown': 'Kafe',
      'beige': 'Bezh',
      'navy': 'Blu e errët',
      'maroon': 'Kafe e errët',
      'teal': 'Blu jeshil',
      'cyan': 'Cyan',
      'lime': 'Gjelbër e çelët',
      'magenta': 'Magenta',
      'silver': 'Argjend',
      'gold': 'Ar'
    }
    
    return variantMap[variantNameLower] || variantName
  }

  // Calculate available stock and current cart quantity
  const availableStock = selectedVariant?.stock || product.stock
  const cartItemId = `${product.id}-${selectedVariant?.id || 'default'}-${selectedModifiers.map(m => m.id).join(',')}`
  const existingCartItem = cart.find(item => item.id === cartItemId)
  const currentQuantityInCart = existingCartItem?.quantity || 0
  const maxQuantityCanAdd = Math.max(0, availableStock - currentQuantityInCart)

  const basePrice = selectedVariant?.price || product.price
  const baseOriginalPrice = selectedVariant?.originalPrice || product.originalPrice || null
  const modifierPrice = selectedModifiers.reduce((sum, mod) => sum + mod.price, 0)
  const totalPrice = (basePrice + modifierPrice) * quantity
  const totalOriginalPrice = baseOriginalPrice ? (baseOriginalPrice + modifierPrice) * quantity : null
  const hasDiscount = baseOriginalPrice !== null && baseOriginalPrice > basePrice
  const discountAmount = hasDiscount && totalOriginalPrice ? totalOriginalPrice - totalPrice : 0
  const discountPercentage = hasDiscount && baseOriginalPrice ? Math.round(((baseOriginalPrice - basePrice) / baseOriginalPrice) * 100) : 0

  // Update image URL when variant or image index changes
  useEffect(() => {
    const variant = selectedVariant as any
    
    if (variant?.metadata && typeof variant.metadata === 'object' && 'image' in variant.metadata) {
      const variantImage = variant.metadata.image
      if (variantImage && typeof variantImage === 'string') {
        setCurrentImageUrl(variantImage)
        return
      }
    }
    // Fallback to product images
    const fallbackImage = product.images[currentImageIndex] || product.images[0] || ''
    setCurrentImageUrl(fallbackImage)
  }, [selectedVariant?.id, currentImageIndex, product.images, product.id])

  // Reset quantity when variant changes or modal opens
  useEffect(() => {
    setQuantity(1)
    setCurrentImageIndex(0) // Reset image index when product or variant changes
  }, [selectedVariant?.id, product.id])

  // Adjust quantity if it exceeds available stock
  useEffect(() => {
    if (quantity > maxQuantityCanAdd && maxQuantityCanAdd > 0) {
      setQuantity(maxQuantityCanAdd)
    }
  }, [maxQuantityCanAdd, quantity])

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
    if (maxQuantityCanAdd === 0) {
      showError?.(translations.itemOutOfStockOrMaxQuantity, 'warning')
      return
    }
    
    // Get mapped variant display name if variant exists
    const variantDisplayName = selectedVariant ? getVariantDisplayName(selectedVariant.name) : undefined
    
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, selectedVariant || undefined, selectedModifiers, variantDisplayName)
    }
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
            <div className="flex items-center gap-2">
              {/* Share Button */}
              <button 
                onClick={() => {
                  if (onShareProduct) {
                    onShareProduct(product.id)
                    setShowCopied(true)
                    setTimeout(() => setShowCopied(false), 2000)
                  }
                }}
                className="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-colors relative"
                title={translations.share || 'Share'}
              >
                {showCopied ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : (
                  <Share2 className="w-5 h-5 text-gray-600" />
                )}
              </button>
              {/* Close Button */}
              <button onClick={onClose} className="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Stock Warning */}
            {maxQuantityCanAdd === 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                <p className="text-red-800 text-sm font-medium">
                {availableStock === 0 
                    ? (translations.outOfStock || 'This item is out of stock')
                    : translations.maximumQuantityInCart.replace('{count}', availableStock.toString())
                  }
                </p>
              </div>
            )}
            
            {/* Only show low stock warning when:
                1. Stock is very low (<= 2 items remaining), AND
                2. Customer already has items in cart (don't expose stock unnecessarily) */}
            {maxQuantityCanAdd > 0 && maxQuantityCanAdd <= 2 && currentQuantityInCart > 0 && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                <p className="text-orange-800 text-sm font-medium">
                  {translations.onlyMoreCanBeAdded.replace('{count}', maxQuantityCanAdd.toString())}
                </p>
              </div>
            )}

            {/* Image Section */}
            {(product.images.length > 0 || ((selectedVariant as any)?.metadata && typeof (selectedVariant as any).metadata === 'object' && 'image' in (selectedVariant as any).metadata)) && (
              <div className="relative">
                <div className="w-full max-w-sm mx-auto relative">
                  {/* Main Image */}
                  <div className="relative overflow-hidden rounded-2xl bg-gray-50">
                    <img 
                      src={currentImageUrl} 
                      alt={`${product.name}${selectedVariant ? ` - ${getVariantDisplayName(selectedVariant.name)}` : ''}`}
                      className="w-full h-full object-contain transition-opacity duration-300"
                      style={{ minHeight: '300px' }}
                      key={`${product.id}-${selectedVariant?.id || 'default'}-${currentImageIndex}`} // Force re-render when variant or image changes
                      onError={(e) => {
                        // Fallback to product image if variant image fails to load
                        const target = e.target as HTMLImageElement
                        if (selectedVariant) {
                          const fallback = product.images[0] || ''
                          target.src = fallback
                          setCurrentImageUrl(fallback)
                        }
                      }}
                    />
                    
                    {/* Navigation Arrows - Only show if multiple images and no variant image */}
                    {(() => {
                      const variant = selectedVariant as any
                      const hasVariantImage = variant?.metadata && typeof variant.metadata === 'object' && 'image' in variant.metadata && variant.metadata.image
                      const showNavigation = product.images.length > 1 && !hasVariantImage
                      
                      return showNavigation ? (
                        <>
                          {/* Left Arrow */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentImageIndex((prev) => 
                                prev === 0 ? product.images.length - 1 : prev - 1
                              )
                            }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-700" />
                          </button>
                          
                          {/* Right Arrow */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setCurrentImageIndex((prev) => 
                                prev === product.images.length - 1 ? 0 : prev + 1
                              )
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                            aria-label="Next image"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-700" />
                          </button>
                        </>
                      ) : null
                    })()}
                  </div>
                  
                  {/* Image Dots Indicator - Only show if multiple images and no variant image */}
                  {(() => {
                    const variant = selectedVariant as any
                    const hasVariantImage = variant?.metadata && typeof variant.metadata === 'object' && 'image' in variant.metadata && variant.metadata.image
                    const showDots = product.images.length > 1 && !hasVariantImage
                    
                    return showDots ? (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        {product.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`transition-all rounded-full ${
                              currentImageIndex === index
                                ? 'w-2.5 h-2.5'
                                : 'w-2 h-2'
                            }`}
                            style={{
                              backgroundColor: currentImageIndex === index 
                                ? primaryColor 
                                : '#d1d5db',
                              opacity: currentImageIndex === index ? 1 : 0.5
                            }}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    ) : null
                  })()}
                  
                  {/* Image Counter - Only show if multiple images and no variant image */}
                  {(() => {
                    const variant = selectedVariant as any
                    const hasVariantImage = variant?.metadata && typeof variant.metadata === 'object' && 'image' in variant.metadata && variant.metadata.image
                    const showCounter = product.images.length > 1 && !hasVariantImage
                    
                    return showCounter ? (
                      <div className="absolute top-3 left-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                        {currentImageIndex + 1} / {product.images.length}
                      </div>
                    ) : null
                  })()}
                </div>
                
                {/* Featured Badge */}
                {product.featured && (
                  <span 
                    className="absolute top-3 right-3 px-3 py-1 rounded-lg text-sm font-semibold text-white z-10"
                    style={{ backgroundColor: featuredBadgeColor }}
                  >
                    {translations.popular || 'Popular'}
                  </span>
                )}
              </div>
            )}
            
            {displayDescription && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: displayDescription
                      .replace(/&amp;/g, '&')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                      .replace(/&quot;/g, '"')
                      .replace(/&#39;/g, "'")
                      .replace(/&nbsp;/g, ' ')
                  }} 
                />
              </div>
            )}

            {/* Price Display - Show when no variant is selected or when variant is selected */}
            {product.variants.filter((v: ProductVariant) => v.stock > 0).length === 0 && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                        {currencySymbol}{basePrice.toFixed(2)}
                      </span>
                      {hasDiscount && baseOriginalPrice && (
                        <span className="text-lg text-gray-500 line-through">
                          {currencySymbol}{baseOriginalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Variants with Stock Info */}
            {product.variants.filter((v: ProductVariant) => v.stock > 0).length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
                  {translations.chooseSize || 'Choose Size'}
                </h3>
                <div className="space-y-3">
                  {product.variants
                    .filter((variant: ProductVariant) => variant.stock > 0) // Filter out variants with 0 stock
                    .map((variant: ProductVariant) => {
                      const variantCartItemId = `${product.id}-${variant.id}-${selectedModifiers.map(m => m.id).join(',')}`
                      const variantInCart = cart.find(item => item.id === variantCartItemId)?.quantity || 0
                      const variantAvailable = variant.stock - variantInCart
                      
                      return (
                        <button
                          key={variant.id}
                          onClick={() => {
                            setSelectedVariant(variant as ProductVariant)
                            setCurrentImageIndex(0)
                          }}
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
                            <div>
                              <span className="font-medium text-gray-800">{getVariantDisplayName(variant.name)}</span>
                              {/* Show stock warning ONLY when:
                                  1. Customer has this variant in cart (variantInCart > 0), AND
                                  2. Remaining stock is very low (<= 2)
                                  This matches the product-level warning logic */}
                              {variantInCart > 0 && variantAvailable <= 2 && (
                                <span className="block text-xs text-orange-600 mt-1">
                                  {translations.onlyMoreCanBeAdded
                                    ? translations.onlyMoreCanBeAdded.replace('{count}', variantAvailable.toString())
                                    : `Only ${variantAvailable} more can be added`}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold" style={{ color: primaryColor }}>
                                {currencySymbol}{variant.price.toFixed(2)}
                              </span>
                              {variant.originalPrice && variant.originalPrice > variant.price && (
                                <span className="text-gray-500 line-through text-sm">
                                  {currencySymbol}{variant.originalPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
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

            {/* Quantity Selection */}
            {maxQuantityCanAdd > 0 && (
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
                    onClick={() => setQuantity(Math.min(maxQuantityCanAdd, quantity + 1))}
                    disabled={quantity >= maxQuantityCanAdd}
                    className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex-shrink-0">
          <div className="flex flex-col gap-2 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-700">{translations.total || 'Total'}</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {currencySymbol}{totalPrice.toFixed(2)}
                </span>
                {hasDiscount && totalOriginalPrice && (
                  <span className="text-lg text-gray-500 line-through">
                    {currencySymbol}{totalOriginalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={maxQuantityCanAdd === 0}
            className="w-full py-4 rounded-xl text-white font-semibold text-lg hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: maxQuantityCanAdd === 0 ? '#9ca3af' : primaryColor }}
          >
            {maxQuantityCanAdd === 0 
              ? (translations.outOfStock || 'Out of Stock')
              : (translations.addToCart || 'Add to Cart')
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// Searchable City Select Component
function SearchableCitySelect({
  cities,
  value,
  onChange,
  disabled,
  placeholder,
  primaryColor,
  translations
}: {
  cities: Array<{ id: string; name: string }>
  value: string
  onChange: (cityName: string) => void
  disabled: boolean
  placeholder: string
  primaryColor: string
  translations: any
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const selectRef = useRef<HTMLDivElement>(null)

  // Filter cities based on search term
  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedCity = cities.find(c => c.name === value)

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left flex items-center justify-between"
        style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
        onFocus={(e) => e.target.style.borderColor = primaryColor}
        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
      >
        <span className={selectedCity ? 'text-gray-900' : 'text-gray-500'}>
          {selectedCity ? selectedCity.name : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder={translations.search || 'Search...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-500 bg-white"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    onChange(city.name)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    value === city.name ? 'bg-teal-50 text-teal-900' : 'text-gray-900'
                  }`}
                >
                  {city.name}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm">
                {translations.noResultsFor || 'No results found'}
              </div>
            )}
          </div>
        </div>
      )}
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
  canSubmitOrder,
  forceScheduleMode = false,
  postalPricingOptions = [],
  loadingPostalPricing = false,
  selectedPostalPricing = null,
  setSelectedPostalPricing = () => {},
  setCalculatedDeliveryFee = () => {},
  countries = [],
  cities = [],
  loadingCountries = false,
  loadingCities = false
}: {
  storeData: any
  cart: CartItem[]
  deliveryType: 'delivery' | 'pickup' | 'dineIn'
  setDeliveryType: (type: 'delivery' | 'pickup' | 'dineIn') => void
  customerInfo: CustomerInfo
  setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>
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
  forceScheduleMode?: boolean
  postalPricingOptions?: any[]
  loadingPostalPricing?: boolean
  selectedPostalPricing?: any | null
  setSelectedPostalPricing: (pricing: any | null) => void
  setCalculatedDeliveryFee: (fee: number) => void
  countries?: Array<{ id: string; name: string; code: string }>
  cities?: Array<{ id: string; name: string }>
  loadingCountries?: boolean
  loadingCities?: boolean
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
    <div className={`${isMobile ? 'p-4' : ''}`}>
      <div>
        <h2 className="text-xl font-bold mb-6 text-gray-900">{translations.orderDetails || 'Your Order'}</h2>
        
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-500"
              style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
              onFocus={(e) =>  e.target.style.borderColor = primaryColor}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              placeholder={translations.yourFullName}
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
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-500"
              style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
              onFocus={(e) => e.target.style.borderColor = primaryColor}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              placeholder={translations.emailPlaceholder}
            />
          </div>

          {/* Conditional Fields based on delivery type */}
          {deliveryType === 'delivery' ? (
            <>
              {/* RETAIL businesses - Postal address form */}
              {storeData.businessType === 'RETAIL' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{translations.selectCountry || 'Country'} *</label>
                    {loadingCountries ? (
                      <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-500">
                        {translations.loadingCountries || 'Loading countries...'}
                      </div>
                    ) : (
                      <select
                        required
                        value={customerInfo.countryCode || ''}
                        onChange={(e) => {
                          setCustomerInfo({ 
                            ...customerInfo, 
                            countryCode: e.target.value,
                            city: undefined, // Reset city when country changes
                            postalPricingId: undefined // Reset postal pricing
                          })
                          setSelectedPostalPricing(null)
                          setCalculatedDeliveryFee(storeData.deliveryFee)
                        }}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors text-gray-900 bg-white"
                        style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                        onFocus={(e) => e.target.style.borderColor = primaryColor}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      >
                        <option value="">{translations.selectCountry || 'Select Country'}</option>
                        {countries.map((country) => {
                          // Localize country name based on storefront language
                          const getLocalizedCountryName = (code: string, language: string) => {
                            const countryNames: Record<string, Record<string, string>> = {
                              'AL': {
                                'sq': 'Shqipëri',
                                'en': 'Albania',
                                'es': 'Albania'
                              },
                              'XK': {
                                'sq': 'Kosovë',
                                'en': 'Kosovo',
                                'es': 'Kosovo'
                              },
                              'MK': {
                                'sq': 'Maqedonia e Veriut',
                                'en': 'North Macedonia',
                                'es': 'Macedonia del Norte'
                              }
                            }
                            return countryNames[code]?.[language] || country.name
                          }
                          const language = storeData.storefrontLanguage || storeData.language || 'en'
                          const localizedName = getLocalizedCountryName(country.code, language)
                          return (
                            <option key={country.id} value={country.code}>
                              {localizedName}
                            </option>
                          )
                        })}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{translations.selectCity || 'City'} *</label>
                    {loadingCities ? (
                      <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-500">
                        {translations.loadingCities || 'Loading cities...'}
                      </div>
                    ) : (
                      <SearchableCitySelect
                        cities={cities}
                        value={customerInfo.city || ''}
                        onChange={(cityName: string) => {
                          setCustomerInfo({ 
                            ...customerInfo, 
                            city: cityName,
                            cityName: cityName,
                            postalPricingId: undefined // Reset postal pricing when city changes
                          })
                          setSelectedPostalPricing(null)
                          setCalculatedDeliveryFee(storeData.deliveryFee)
                        }}
                        disabled={!customerInfo.countryCode}
                        placeholder={translations.selectCity || 'Select City'}
                        primaryColor={primaryColor}
                        translations={translations}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{translations.streetAddress || 'Street'} *</label>
                    <input
                      type="text"
                      required
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors text-gray-900 placeholder:text-gray-500"
                      style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                      onFocus={(e) => e.target.style.borderColor = primaryColor}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      placeholder={translations.streetAddress || 'Street address'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{translations.postalCode || 'Postal Code'}</label>
                    <input
                      type="text"
                      value={customerInfo.postalCode || ''}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, postalCode: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors text-gray-900 placeholder:text-gray-500"
                      style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                      onFocus={(e) => e.target.style.borderColor = primaryColor}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      placeholder={translations.postalCodePlaceholder || 'Postal code'}
                    />
                  </div>

                  {/* Postal Method Selection for RETAIL businesses */}
                  {customerInfo.city && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {translations.deliveryMethod || 'Delivery Method'} *
                      </label>
                      {loadingPostalPricing ? (
                        <div className="text-sm text-gray-500 py-3 flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                          Loading delivery options...
                        </div>
                      ) : postalPricingOptions.length > 0 ? (
                        <div className="space-y-2">
                          {postalPricingOptions.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                setSelectedPostalPricing(option)
                                setCalculatedDeliveryFee(option.price)
                                setCustomerInfo((prev: CustomerInfo) => ({ ...prev, postalPricingId: option.id }))
                              }}
                              className={`w-full p-3 border-2 rounded-xl text-left transition-colors ${
                                selectedPostalPricing?.id === option.id
                                  ? 'border-teal-500 bg-teal-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {option.logo && (
                                    <img src={option.logo} alt={option.postal_name} className="w-10 h-10 object-contain" />
                                  )}
                                  <div>
                                    <div className="font-medium text-gray-900">{option.postal_name}</div>
                                    {(option.delivery_time_al || option.delivery_time) && (
                                      <div className="text-sm text-gray-600">
                                        {option.delivery_time_al || option.delivery_time}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-gray-900">
                                    {currencySymbol}{option.price.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 py-3">
                          {translations.noDeliveryOptions || 'No delivery options available for this city'}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Non-RETAIL businesses - Google autocomplete address form */
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-500"
                      style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                      onFocus={(e) => e.target.style.borderColor = primaryColor}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      placeholder={translations.apartment || 'Apartment, suite, etc.'}
                    />
                  </div>
                </>
              )}
            </>
          ) : (
            /* Show store location for pickup */
            <StoreLocationMap 
              storeData={storeData}
              primaryColor={primaryColor}
              translations={translations}
            />
          )}

          {/* Enhanced Time Selection - Hide for RETAIL businesses */}
          {storeData.businessType !== 'RETAIL' && (
            <TimeSelection
              deliveryType={deliveryType}
              selectedTime={customerInfo.deliveryTime}
              onTimeChange={(time) => setCustomerInfo({ ...customerInfo, deliveryTime: time })}
              storeData={storeData}
              primaryColor={primaryColor}
              translations={translations}
              forceScheduleMode={forceScheduleMode}
            />
          )}
        </div>

        {/* Cart Items */}
        {cart.length > 0 && (
          <div className="border-t-2 border-gray-200 pt-6 mb-6">
            <h3 className="font-semibold mb-4">
              {storeData.businessType === 'RETAIL' 
                ? (translations.productsInCart || 'Products in Cart')
                : (translations.cartItems || 'Cart Items')
              }
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
              {cart.map(item => {
                // Calculate discount information
                // Use stored originalPrice from cart item, or try to find from product data
                const modifierPrice = item.modifiers.reduce((sum: number, mod: any) => sum + mod.price, 0)
                const pricePerItem = item.price + modifierPrice
                const currentTotalPrice = item.totalPrice
                
                // Get original price (from cart item if stored, otherwise try to find from product)
                let originalPricePerItem: number | null = null
                if (item.originalPrice) {
                  originalPricePerItem = item.originalPrice + modifierPrice
                } else {
                  // Fallback: try to find from product data
                  const originalProduct = storeData.categories
                    .flatMap((cat: any) => cat.products)
                    .find((p: any) => p.id === item.productId)
                  
                  if (item.variantId && originalProduct) {
                    const variant = originalProduct.variants?.find((v: any) => v.id === item.variantId)
                    if (variant?.originalPrice && variant.originalPrice > variant.price) {
                      originalPricePerItem = variant.originalPrice + modifierPrice
                    }
                  } else if (originalProduct?.originalPrice && originalProduct.originalPrice > originalProduct.price) {
                    originalPricePerItem = originalProduct.originalPrice + modifierPrice
                  }
                }
                
                const originalTotalPrice = originalPricePerItem ? originalPricePerItem * item.quantity : null
                const hasDiscount = originalTotalPrice && originalTotalPrice > currentTotalPrice
                const discountAmount = hasDiscount ? originalTotalPrice - currentTotalPrice : 0

                return (
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      {item.modifiers.length > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          + {item.modifiers.map((m: any) => m.name).join(', ')}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm font-semibold">{currencySymbol}{currentTotalPrice.toFixed(2)}</p>
                        {hasDiscount && originalTotalPrice && (
                          <p className="text-xs text-gray-500 line-through">
                            {currencySymbol}{originalTotalPrice.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      <button
                        onClick={() => updateCartItemQuantity(item.id, -1)}
                        disabled={storeData.isTemporarilyClosed}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartItemQuantity(item.id, 1)}
                        disabled={storeData.isTemporarilyClosed}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
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
              {deliveryType === 'delivery' && !deliveryError && (
                <div className="flex justify-between text-sm">
                  <span>{translations.deliveryFee || 'Delivery Fee'}</span>
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
        {!meetsMinimumOrder && deliveryType === 'delivery' && !deliveryError && !storeData.isTemporarilyClosed && (
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-500"
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
    // Check blocking conditions first
    if (storeData.isTemporarilyClosed) {
      return translations.storeTemporarilyClosed || 'Store Temporarily Closed'
    } else if (deliveryError?.type === 'OUTSIDE_DELIVERY_AREA') {
      return translations.outsideDeliveryArea || 'Address Outside Delivery Area'
    } else if (deliveryError) {
      return translations.deliveryNotAvailable || 'Delivery Not Available'
    } else if (isOrderLoading) {
      return translations.placingOrder || 'Placing Order...'
    }
    
    // Check step-by-step requirements
    if (cart.length === 0) {
      return translations.addItemsToCart || 'Add items to cart'
    }
    
    if (!customerInfo.name || !customerInfo.phone) {
      return translations.fillRequiredInfo || 'Fill required information'
    }
    
    if (deliveryType === 'delivery' && !customerInfo.address) {
      return translations.addDeliveryAddress || 'Add delivery address'
    }
    
    if (!meetsMinimumOrder && deliveryType === 'delivery') {
      return `${translations.minimumOrder} ${currencySymbol}${storeData.minimumOrder.toFixed(2)}`
    }
    
    // CHECK TIME SELECTION BEFORE SHOWING FINAL ORDER BUTTON
    if (customerInfo.deliveryTime !== 'asap' && (!customerInfo.deliveryTime || customerInfo.deliveryTime === '')) {
      return translations.selectTimeForSchedule || 'Select time for schedule'
    }
    
    // All requirements met - show final order button
    return `${translations.orderViaWhatsapp || 'Order via WhatsApp'} - ${currencySymbol}${cartTotal.toFixed(2)}`
  })()}
</button>

<p className="text-xs text-gray-500 text-center mt-3">
  {storeData.isTemporarilyClosed
    ? (translations.storeClosedMessage || 'We apologize for any inconvenience.')
    : deliveryError?.type === 'OUTSIDE_DELIVERY_AREA'
    ? (translations.selectDifferentArea || 'Please select an address within our delivery area')
    : customerInfo.deliveryTime !== 'asap' && (!customerInfo.deliveryTime || customerInfo.deliveryTime === '')
    ? (translations.selectTimeForSchedule || 'Please select a time for your scheduled order')
    : (translations.clickingButton || 'By clicking this button, you agree to place your order via WhatsApp.')
  }
</p>
      </div>
    </div>
  )
}