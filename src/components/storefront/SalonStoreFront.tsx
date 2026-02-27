'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  Search, 
  Clock, 
  Calendar,
  CalendarClock,
  X, 
  MapPin, 
  Phone,
  Mail,
  Globe,
  Info,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Scissors,
  User,
  CheckCircle,
  Share2,
  Check,
  SlidersHorizontal,
  Shield,
  Navigation,
  Plus,
  Copy,
  ExternalLink,
  Package,
  Store,
  UtensilsCrossed,
  Sparkles,
  Star,
  Gift,
  Zap,
  Heart,
  Bell,
  Tag,
  Percent,
  Megaphone
} from 'lucide-react'
import { FaFacebook, FaLinkedin, FaTelegram, FaWhatsapp } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import LegalPagesModal from './LegalPagesModal'
import { AiChatBubble } from './AiChatBubble'
import { getStorefrontTranslations } from '@/utils/storefront-translations'
import { PhoneInput } from '../site/PhoneInput'
import { encodeBase62, decodeBase62, isValidBase62 } from '@/utils/base62'

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
  coverHeight?: string
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
  timezone?: string
  timeFormat?: string
  deliveryFee: number
  minimumOrder: number
  deliveryEnabled: boolean
  pickupEnabled: boolean
  dineInEnabled: boolean
  paymentMethods: string[]
  paymentInstructions?: string
  greetingMessage?: string
  orderNumberFormat: string
  businessHours?: any
  isTemporarilyClosed: boolean
  categories: any[]
  isOpen: boolean
  nextOpenTime?: string
  whatsappButtonColor?: string
  invoiceReceiptSelectionEnabled?: boolean
  invoiceMinimumOrderValue?: number | null
  legalPagesEnabled?: boolean
  featuredBadgeColor?: string
  initialProducts?: any[]
  bannerEnabled?: boolean
  bannerTitle?: string | null
  bannerSubtitle?: string | null
  bannerIcon?: string | null
  bannerFontSize?: string
  rememberCustomerEnabled?: boolean
  aiAssistantEnabled?: boolean
}

interface Service {
  id: string
  name: string
  nameAl?: string
  nameEl?: string
  description?: string
  descriptionAl?: string
  descriptionEl?: string
  images: string[]
  price: number
  originalPrice?: number
  serviceDuration?: number // Duration in minutes
  categoryId?: string
  categoryName?: string
  modifiers?: any[]
}

interface BookingItem {
  service: Service
  quantity: number
}

// Helper function to get cover image style (matching StoreFront)
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

// Track recently viewed services to debounce (don't track same service twice within 30 seconds)
const recentlyViewedServices = new Map<string, number>()
const VIEW_DEBOUNCE_MS = 30000 // 30 seconds

// Get or create anonymous session ID for analytics tracking
const getSessionId = () => {
  if (typeof window === 'undefined') return null
  
  const SESSION_KEY = 'waveorder_session_id'
  let sessionId = localStorage.getItem(SESSION_KEY)
  
  if (!sessionId) {
    // Generate a UUID-like session ID
    sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  
  return sessionId
}

// Error Message Component
function ErrorMessage({ 
  isVisible, 
  onClose, 
  message, 
  type = 'error',
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

// Booking Success Message Component - shown after successful appointment booking
function BookingSuccessMessage({ 
  isVisible, 
  onClose, 
  orderNumber, 
  directNotification = false,
  storeName,
  translations
}: {
  isVisible: boolean
  onClose: () => void
  orderNumber: string
  directNotification?: boolean
  storeName: string
  translations: any
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
              {translations.appointmentBooked || 'Appointment Booked!'}
            </h4>
            <div className="space-y-2 sm:space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                <span className="font-medium">{translations.appointmentNumber || 'Appointment Number'}:</span> {orderNumber}
              </p>
              {directNotification ? (
                <>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {translations.appointmentSentDirectMessage || `Your appointment has been sent directly to ${storeName}. They have received all your booking details.`}
                  </p>
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-medium mb-1">
                      {translations.directNextSteps || 'What Happens Now?'}
                    </p>
                    <div className="text-sm text-green-700 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>{translations.appointmentStep1 || 'The salon has received your appointment'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>{translations.appointmentStep2 || 'They will confirm your booking'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span>{translations.appointmentStep3 || "You'll be contacted for any updates"}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {translations.appointmentPreparedMessage || 'Your appointment details have been prepared and WhatsApp should now be open. Please send the message to complete your booking (if you haven\'t already sent it).'}
                  </p>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 font-medium mb-1">
                      {translations.nextSteps || 'Next Steps'}:
                    </p>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>1. {translations.sendWhatsAppMessage || 'Send the WhatsApp message (if not sent yet)'}</div>
                      <div>2. {translations.awaitBookingConfirmation || 'Wait for booking confirmation'}</div>
                      <div>3. {translations.salonWillConfirm || 'The salon will confirm your appointment'}</div>
                    </div>
                  </div>
                </>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {translations.youCanCloseThisPage || 'You can safely close this page'}
              </p>
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

export default function SalonStoreFront({ storeData }: { storeData: StoreData }) {
  const searchParams = useSearchParams()
  
  // Track service event (view or add_to_booking) - defined inside component to access storeData
  const trackServiceEvent = (
    serviceId: string, 
    eventType: 'view' | 'add_to_booking' | 'booking_submitted',
    source?: string,
    bookingData?: any
  ) => {
    // Don't track if no business slug
    if (!storeData?.slug) return
  
  // For view events, check debounce
  if (eventType === 'view') {
    const lastViewTime = recentlyViewedServices.get(serviceId)
    const now = Date.now()
    
    if (lastViewTime && (now - lastViewTime) < VIEW_DEBOUNCE_MS) {
      return // Skip - already viewed recently
    }
    
    // Update last view time
    recentlyViewedServices.set(serviceId, now)
    
    // Clean up old entries (keep map from growing indefinitely)
    if (recentlyViewedServices.size > 100) {
      const cutoff = now - VIEW_DEBOUNCE_MS
      for (const [id, time] of recentlyViewedServices.entries()) {
        if (time < cutoff) {
          recentlyViewedServices.delete(id)
        }
      }
    }
  }
  
  const sessionId = getSessionId()
  
  // Get UTM params from localStorage (captured on page load)
  const storedUtm = typeof window !== 'undefined' 
    ? localStorage.getItem(`utm_params_${storeData.slug}`)
    : null
  let utmData: any = {}
  if (storedUtm) {
    try {
      utmData = JSON.parse(storedUtm)
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Use sendBeacon for reliable delivery (doesn't block page navigation)
  const data = JSON.stringify({
    productId: serviceId, // API uses productId for both products and services
    eventType: eventType === 'add_to_booking' ? 'add_to_cart' : eventType === 'booking_submitted' ? 'order_placed' : 'view',
    sessionId,
    source,
    utmSource: utmData.utm_source || null,
    utmMedium: utmData.utm_medium || null,
    utmCampaign: utmData.utm_campaign || null,
    utmTerm: utmData.utm_term || null,
    utmContent: utmData.utm_content || null,
    ...(bookingData && { bookingData })
  })
  
  const url = `/api/storefront/${storeData.slug}/track`
  
  // Try sendBeacon first (best for analytics - doesn't block)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const blob = new Blob([data], { type: 'application/json' })
    navigator.sendBeacon(url, blob)
  } else {
    // Fallback to fetch with keepalive
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data,
      keepalive: true
    }).catch(() => {
      // Silent fail - don't affect user experience
    })
  }
  }

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  // Use initial products from server-side render if available (filtered for services only)
  const initialServices = useMemo(() => {
    if (!storeData.initialProducts || storeData.initialProducts.length === 0) return []
    return storeData.initialProducts.filter((p: any) => p.isService === true)
  }, [storeData.initialProducts])
  
  const [services, setServices] = useState<Service[]>(initialServices)
  const [servicesLoading, setServicesLoading] = useState(initialServices.length === 0)
  const [servicesError, setServicesError] = useState<string | null>(null)
  
  // Performance: Infinite scroll pagination
  const SERVICES_PER_PAGE = 20
  const [currentPage, setCurrentPage] = useState(initialServices.length > 0 ? 1 : 0)
  const [hasMoreServices, setHasMoreServices] = useState(true)
  const [displayedServicesCount, setDisplayedServicesCount] = useState(
    initialServices.length > 0 ? initialServices.length : SERVICES_PER_PAGE
  )
  const isFetchingRef = useRef(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const shareHandledRef = useRef(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([])
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null)
  const [appointmentTime, setAppointmentTime] = useState<string>('')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
    invoiceType: '' as 'INVOICE' | 'RECEIPT' | '',
    invoiceAfm: '',
    invoiceCompanyName: '',
    invoiceTaxOffice: ''
  })

  // Load saved customer info from localStorage if feature is enabled for this business
  useEffect(() => {
    if (!storeData.rememberCustomerEnabled) return
    try {
      const saved = localStorage.getItem(`customer_info_${storeData.slug}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setCustomerInfo(prev => ({
          ...prev,
          name: parsed.name || '',
          phone: parsed.phone || '',
          email: parsed.email || ''
        }))
      }
    } catch (e) {
      // Silently ignore parse errors
    }
  }, [storeData.slug, storeData.rememberCustomerEnabled])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [priceMin, setPriceMin] = useState<number | ''>('')
  const [priceMax, setPriceMax] = useState<number | ''>('')
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'>('name-asc')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showBusinessInfoModal, setShowBusinessInfoModal] = useState(false)
  const [showLegalPagesModal, setShowLegalPagesModal] = useState(false)
  const [legalPagesData, setLegalPagesData] = useState<{
    pages: Array<{ slug: string; title: string; showInFooter: boolean; sortOrder: number }>
    ctaEnabled: boolean
    ctaText: string
  } | null>(null)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  
  // Error message state
  const [errorMessage, setErrorMessage] = useState<{
    visible: boolean
    message: string
    type?: 'error' | 'warning' | 'info'
  } | null>(null)

  // Booking success message state
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState<{
    visible: boolean
    orderNumber: string
    directNotification?: boolean
  } | null>(null)

  // Show error helper function - memoized to avoid dependency issues
  const showError = useCallback((message: string, type: 'error' | 'warning' | 'info' = 'error') => {
    setErrorMessage({ visible: true, message, type })
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setErrorMessage(null)
    }, 5000)
  }, [])
  
  // Scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
      setShowScrollToTop(scrollY > 800) // Show after scrolling 800px
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Fetch legal pages data on mount
  useEffect(() => {
    if (storeData.legalPagesEnabled) {
      fetch(`/api/storefront/${storeData.slug}/pages`)
        .then(res => res.json())
        .then(data => {
          const storefrontLang = storeData.storefrontLanguage || storeData.language || 'en'
          const t = getStorefrontTranslations(storefrontLang)
          setLegalPagesData({
            pages: data.pages || [],
            ctaEnabled: data.ctaEnabled || false,
            ctaText: data.ctaText || t.legalPoliciesCta,
          })
        })
        .catch(err => {
          console.error('Error fetching legal pages:', err)
        })
    }
  }, [storeData.slug, storeData.legalPagesEnabled])
  
  // Capture UTM parameters from URL for affiliate tracking
  const [utmParams, setUtmParams] = useState<{
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
  }>({})
  
  // Capture UTM params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const utm: typeof utmParams = {}
      if (params.get('utm_source')) utm.utm_source = params.get('utm_source')!
      if (params.get('utm_medium')) utm.utm_medium = params.get('utm_medium')!
      if (params.get('utm_campaign')) utm.utm_campaign = params.get('utm_campaign')!
      if (params.get('utm_term')) utm.utm_term = params.get('utm_term')!
      if (params.get('utm_content')) utm.utm_content = params.get('utm_content')!
      
      // Store in localStorage for persistence across page navigation
      if (Object.keys(utm).length > 0) {
        localStorage.setItem(`utm_params_${storeData.slug}`, JSON.stringify(utm))
        setUtmParams(utm)
      } else {
        // Try to load from localStorage if no URL params
        const stored = localStorage.getItem(`utm_params_${storeData.slug}`)
        if (stored) {
          try {
            setUtmParams(JSON.parse(stored))
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }, [storeData.slug])

  const lang = storeData.storefrontLanguage || storeData.language || 'en'
  
  // Memoize translations to avoid recalculation
  const translations = useMemo(() => getStorefrontTranslations(lang), [lang])
  
  // Memoize currency symbol
  const currencySymbol = useMemo(() => {
    return storeData.currency === 'USD' ? '$' : 
           storeData.currency === 'EUR' ? '€' : 
           storeData.currency === 'GBP' ? '£' : 
           storeData.currency === 'ALL' ? 'L' : storeData.currency
  }, [storeData.currency])
  
  const primaryColor = storeData.primaryColor || '#14b8a6'
  
  // Memoize categories list
  const categoriesList = useMemo(() => {
    if (!storeData.categories || storeData.categories.length === 0) return []
    return storeData.categories.filter((cat: any) => {
      // Only show categories that have services
      return services.some((s: Service) => s.categoryId === cat.id)
    })
  }, [storeData.categories, services])
  
  // Memoize displayed services (for pagination)
  const displayedServices = useMemo(() => {
    return services.slice(0, displayedServicesCount)
  }, [services, displayedServicesCount])

  // Fetch services function - defined before useEffect hooks that use it
  const fetchServices = useCallback(async (page: number = 1, reset: boolean = false) => {
    // Only block duplicate scroll-triggered (pagination) fetches, not search/filter resets
    if (isFetchingRef.current && !reset) return
    
    isFetchingRef.current = true
    setServicesLoading(true)
    setServicesError(null)
    
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', SERVICES_PER_PAGE.toString())
      
      if (selectedCategory !== 'all') {
        params.set('categoryId', selectedCategory)
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
      // Add sort parameter
      if (sortBy !== 'name-asc') {
        params.set('sortBy', sortBy)
      }
      
      const response = await fetch(`/api/storefront/${storeData.slug}/products?${params.toString()}`)
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to fetch services'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If response is not JSON, use default message
        }
        throw new Error(errorMessage)
      }
      
      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error('Invalid response from server')
      }
      // Filter for services only (isService: true)
      let servicesData = (data.products || []).filter((p: any) => p.isService === true)
      
      // Apply client-side sorting if needed (fallback)
      if (sortBy === 'name-asc') {
        servicesData.sort((a: Service, b: Service) => {
          const nameA = (lang === 'sq' || lang === 'al') && a.nameAl ? a.nameAl : (lang === 'el' && a.nameEl ? a.nameEl : a.name)
          const nameB = (lang === 'sq' || lang === 'al') && b.nameAl ? b.nameAl : (lang === 'el' && b.nameEl ? b.nameEl : b.name)
          return nameA.localeCompare(nameB)
        })
      } else if (sortBy === 'name-desc') {
        servicesData.sort((a: Service, b: Service) => {
          const nameA = (lang === 'sq' || lang === 'al') && a.nameAl ? a.nameAl : (lang === 'el' && a.nameEl ? a.nameEl : a.name)
          const nameB = (lang === 'sq' || lang === 'al') && b.nameAl ? b.nameAl : (lang === 'el' && b.nameEl ? b.nameEl : b.name)
          return nameB.localeCompare(nameA)
        })
      } else if (sortBy === 'price-asc') {
        servicesData.sort((a: Service, b: Service) => a.price - b.price)
      } else if (sortBy === 'price-desc') {
        servicesData.sort((a: Service, b: Service) => b.price - a.price)
      }
      
      if (reset) {
        setServices(servicesData)
        setCurrentPage(1)
        setDisplayedServicesCount(Math.min(SERVICES_PER_PAGE, servicesData.length))
      } else {
        setServices(prev => [...prev, ...servicesData])
        setDisplayedServicesCount(prev => prev + servicesData.length)
      }
      
      // Check if there are more services
      setHasMoreServices(servicesData.length === SERVICES_PER_PAGE)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching services:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to load services. Please try again.'
      setServicesError(errorMsg)
      // Don't show error toast for initial load failures, only for user-initiated actions
      if (page > 1 || debouncedSearchTerm.trim().length >= 3) {
        showError(errorMsg, 'error')
      }
    } finally {
      setServicesLoading(false)
      isFetchingRef.current = false
    }
  }, [selectedCategory, debouncedSearchTerm, priceMin, priceMax, sortBy, storeData.slug, lang, showError])

  // Debounce search term - wait 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 400)
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Track previous debounced search term to detect when search is cleared
  const prevDebouncedSearchTermRef = useRef('')

  // Track if this is the initial mount to avoid refetching when we have initialProducts
  const isInitialMountRef = useRef(true)

  // Fetch services on filter changes (reset to page 1)
  useEffect(() => {
    // Skip on initial mount if we have initial services from server
    if (isInitialMountRef.current && initialServices.length > 0) {
      isInitialMountRef.current = false
      return
    }
    isInitialMountRef.current = false

    fetchServices(1, true)
    setDisplayedServicesCount(SERVICES_PER_PAGE)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selectedCategory, debouncedSearchTerm, priceMin, priceMax, sortBy, fetchServices])

  // Infinite scroll: Load more services on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isFetchingRef.current || servicesLoading || !hasMoreServices) return
      
      const scrollY = window.scrollY || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      
      // Load more when within 800px of bottom
      if (scrollY + windowHeight >= documentHeight - 800) {
        if (displayedServicesCount >= services.length && hasMoreServices) {
          const nextPage = currentPage + 1
          isFetchingRef.current = true
          fetchServices(nextPage, false)
        } else if (displayedServicesCount < services.length) {
          // Show more of already-loaded services
          setDisplayedServicesCount(prev => Math.min(prev + SERVICES_PER_PAGE, services.length))
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [displayedServicesCount, services.length, hasMoreServices, servicesLoading, currentPage, fetchServices])

  const addToBooking = (service: Service) => {
    const existing = bookingItems.find(item => item.service.id === service.id)
    if (existing) {
      setBookingItems(bookingItems.map(item => 
        item.service.id === service.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setBookingItems([...bookingItems, { service, quantity: 1 }])
    }
    // Track add to booking event
    trackServiceEvent(service.id, 'add_to_booking', 'service_card')
  }

  const removeFromBooking = (serviceId: string) => {
    setBookingItems(bookingItems.filter(item => item.service.id !== serviceId))
  }

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromBooking(serviceId)
    } else {
      setBookingItems(bookingItems.map(item =>
        item.service.id === serviceId ? { ...item, quantity } : item
      ))
    }
  }

  // Memoize total calculation
  const total = useMemo(() => {
    return bookingItems.reduce((sum, item) => sum + (item.service.price * item.quantity), 0)
  }, [bookingItems])

  // Memoize total duration calculation
  const totalDuration = useMemo(() => {
    return bookingItems.reduce((sum, item) => 
      sum + ((item.service.serviceDuration || 0) * item.quantity), 0)
  }, [bookingItems])

  const formatDuration = (minutes: number) => {
    if (!minutes) return ''
    const hoursVal = Math.floor(minutes / 60)
    const mins = minutes % 60
    const hLabel = translations.durationHours || 'h'
    const mLabel = translations.durationMins || 'min'
    if (hoursVal > 0) {
      return `${hoursVal}${hLabel} ${mins > 0 ? `${mins}${mLabel}` : ''}`.trim()
    }
    return `${mins}${mLabel}`
  }

  // Handle shared service from URL parameters
  useEffect(() => {
    if (shareHandledRef.current) return
    
    // Try ps (raw service ID) first, then fall back to decoding p (Base62 encoded)
    const rawServiceId = searchParams.get('ps')
    const encodedServiceId = searchParams.get('p')
    
    let serviceId: string | null = null
    
    if (rawServiceId && /^[0-9a-fA-F]{24}$/.test(rawServiceId)) {
      // Use raw service ID directly (more reliable)
      serviceId = rawServiceId
    } else if (encodedServiceId && isValidBase62(encodedServiceId)) {
      // Fall back to decoding Base62
      serviceId = decodeBase62(encodedServiceId)
    }
    
    if (serviceId) {
      // Find the service in our loaded services
      const service = services.find(s => s.id === serviceId)
      if (service) {
        // Mark as handled before opening modal
        shareHandledRef.current = true
        // Open the service modal
        setSelectedService(service)
        setShowServiceModal(true)
      } else if (services.length > 0) {
        // Mark as handled before fetching
        shareHandledRef.current = true
        // Service not in loaded services - fetch it directly from API
        const fetchSharedService = async () => {
          try {
            const response = await fetch(`/api/storefront/${storeData.slug}/products?productId=${serviceId}`)
            if (response.ok) {
              const data = await response.json()
              if (data.products && data.products.length > 0) {
                const fetchedService = data.products[0]
                // Ensure it's a service
                if (fetchedService.isService === true) {
                  setSelectedService(fetchedService)
                  setShowServiceModal(true)
                }
              }
            }
          } catch (error) {
            console.error('Failed to fetch shared service:', error)
          }
        }
        fetchSharedService()
      }
    }
  }, [searchParams, services, storeData.slug])

  // Share service handler - creates URL with encoded service ID and tracking params
  const handleShareService = (serviceId: string) => {
    const encoded = encodeBase62(serviceId)
    const shareUrl = `${window.location.origin}/${storeData.slug}?p=${encoded}&utm_source=service_share&ps=${serviceId}`
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    })
  }

  // Generate time slots based on business hours
  // If selected date is today, only show future time slots (with a buffer)
  const generateTimeSlots = (date: Date) => {
    if (!storeData.businessHours) return []
    
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const dayHours = storeData.businessHours[dayOfWeek]
    
    if (!dayHours || dayHours.closed) return []
    
    const [openHour, openMinute] = dayHours.open.split(':').map(Number)
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number)
    
    const slots: string[] = []
    const now = new Date()
    const today = new Date().toDateString()
    const selectedDate = date.toDateString()

    let currentTime = new Date(date)
    currentTime.setHours(openHour, openMinute, 0, 0)
    
    const closeTime = new Date(date)
    closeTime.setHours(closeHour, closeMinute, 0, 0)

    // If booking for today, skip past time slots and add a 20-minute buffer
    if (selectedDate === today) {
      const bufferMinutes = 20
      const minTime = new Date(now.getTime() + bufferMinutes * 60000)
      if (currentTime < minTime) {
        currentTime = minTime
        // Round up to next 30-minute slot
        const minutes = currentTime.getMinutes()
        const roundedMinutes = Math.ceil(minutes / 30) * 30
        currentTime.setMinutes(roundedMinutes, 0, 0)
      }
    }
    
    const use24Hour = storeData.timeFormat === '24'
    
    while (currentTime < closeTime) {
      const timeValue = currentTime.toTimeString().slice(0, 5)
      let timeLabel: string
      
      if (use24Hour) {
        timeLabel = timeValue
      } else {
        timeLabel = currentTime.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      }
      
      slots.push(timeValue)
      currentTime.setMinutes(currentTime.getMinutes() + 30)
    }
    
    return slots
  }

  const submitBooking = async () => {
    if (!appointmentDate || !appointmentTime || !customerInfo.name || !customerInfo.phone) {
      return
    }

    setIsSubmitting(true)
    try {
      const appointmentDateTime = new Date(appointmentDate)
      const [hours, minutes] = appointmentTime.split(':').map(Number)
      appointmentDateTime.setHours(hours, minutes, 0, 0)

      const orderData = {
        items: bookingItems.map(item => ({
          productId: item.service.id,
          quantity: item.quantity,
          price: item.service.price,
          originalPrice: item.service.originalPrice && item.service.originalPrice > item.service.price
            ? item.service.originalPrice
            : null,
          name: item.service.name
        })),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email || undefined,
        deliveryType: 'dineIn', // Salon appointments are in-salon
        deliveryTime: appointmentDateTime.toISOString(),
        specialInstructions: customerInfo.notes,
        invoiceType: customerInfo.invoiceType || null,
        invoiceAfm: customerInfo.invoiceType === 'INVOICE' ? (customerInfo.invoiceAfm || null) : null,
        invoiceCompanyName: customerInfo.invoiceType === 'INVOICE' ? (customerInfo.invoiceCompanyName || null) : null,
        invoiceTaxOffice: customerInfo.invoiceType === 'INVOICE' ? (customerInfo.invoiceTaxOffice || null) : null,
        paymentMethod: 'Cash',
        total: total,
        subtotal: total,
        deliveryFee: 0
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
        showError(translations.failedToSubmitOrder || translations.failedToCreateOrder || 'Failed to submit booking. Please try again.', 'error')
        return
      }

      if (!response.ok) {
        const errorMsg = result.error || result.message || (translations.failedToSubmitOrder || 'Failed to submit booking. Please try again.')
        showError(errorMsg, 'error')
        return
      }
      
      // Track booking submission
      bookingItems.forEach(item => {
        trackServiceEvent(item.service.id, 'booking_submitted', 'booking_modal', {
          orderId: result.orderId,
          total: total,
          itemCount: bookingItems.length
        })
      })

      // Show success message
      setBookingSuccessMessage({
        visible: true,
        orderNumber: result.orderNumber || '',
        directNotification: result.directNotification || false
      })

      // Auto-hide success message after 15 seconds for direct notification, 8 seconds otherwise
      const hideDelay = result.directNotification ? 15000 : 8000
      setTimeout(() => {
        setBookingSuccessMessage(null)
      }, hideDelay)
      
      // Open WhatsApp if not direct notification (traditional wa.me flow)
      if (!result.directNotification && result.whatsappUrl) {
        window.open(result.whatsappUrl, '_blank')
      }

      // Save customer info for returning customers (only if enabled for this business)
      if (storeData.rememberCustomerEnabled && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`customer_info_${storeData.slug}`, JSON.stringify({
            name: customerInfo.name,
            phone: customerInfo.phone,
            email: customerInfo.email
          }))
        } catch (e) {
          // Silently ignore quota or storage errors
        }
      }

      // Reset form
      setBookingItems([])
      setShowBookingModal(false)
      setAppointmentDate(null)
      setAppointmentTime('')
      setCustomerInfo({ name: '', phone: '', email: '', notes: '', invoiceType: '' as '', invoiceAfm: '', invoiceCompanyName: '', invoiceTaxOffice: '' })
    } catch (error) {
      console.error('Error submitting booking:', error)
      const errorMsg = error instanceof Error ? error.message : (translations.failedToSubmitOrder || 'Failed to submit booking. Please try again.')
      showError(errorMsg, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const useAlbanian = lang === 'sq' || lang === 'al'
  const useGreek = lang === 'el'

  // Add CSS for responsive cover image heights
  useEffect(() => {
    const styleId = 'salon-cover-image-style'
    if (document.getElementById(styleId)) return
    
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .cover-image-responsive {
        height: var(--cover-height-mobile, 160px);
      }
      @media (min-width: 768px) {
        .cover-image-responsive {
          height: var(--cover-height-desktop, 220px);
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
    <div className="min-h-screen bg-white" style={{ fontFamily: storeData.fontFamily || 'system-ui' }}>
      {storeData.aiAssistantEnabled && (
        <AiChatBubble
          storeSlug={storeData.slug}
          storeName={storeData.name}
          primaryColor={primaryColor}
          storefrontLanguage={storeData.storefrontLanguage || storeData.language}
          businessType={storeData.businessType}
        />
      )}
      {/* Error Message */}
      {errorMessage && (
        <ErrorMessage
          isVisible={errorMessage.visible}
          onClose={() => setErrorMessage(null)}
          message={errorMessage.message}
          type={errorMessage.type || 'error'}
          primaryColor={primaryColor}
          translations={translations}
        />
      )}

      {/* Booking Success Message */}
      <BookingSuccessMessage
        isVisible={bookingSuccessMessage?.visible || false}
        onClose={() => setBookingSuccessMessage(null)}
        orderNumber={bookingSuccessMessage?.orderNumber || ''}
        directNotification={bookingSuccessMessage?.directNotification || false}
        storeName={storeData.name}
        translations={translations}
      />

      {/* Header Section - Matching StoreFront */}
      <div className="bg-white">
        <div className="max-w-[75rem] mx-auto">
          {/* Cover Image Section */}
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
              {storeData.legalPagesEnabled && legalPagesData && legalPagesData.pages && legalPagesData.pages.length > 0 && (
                <button 
                  onClick={() => setShowLegalPagesModal(true)}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-black bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all"
                >
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </button>
              )}
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
              </div>
                        
              {(() => {
                const displayDescription = useAlbanian && storeData.descriptionAl 
                  ? storeData.descriptionAl 
                  : useGreek && storeData.descriptionEl
                    ? storeData.descriptionEl
                    : storeData.description
                
                return displayDescription && (
                  <p className="text-gray-500 text-md sm:text-md mb-3">{displayDescription}</p>
                )
              })()}
              
              {/* Address + Open/Closed Status + Get Directions */}
              {/* Desktop: single line | Mobile: address above, hours + directions below */}
              <div className="flex flex-col md:flex-row md:items-center md:flex-wrap gap-1 md:gap-3 mb-2">
                {/* Address */}
                {storeData.address && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                    <span className="text-md">{storeData.address}</span>
                  </div>
                )}

                {/* Hours + Directions row (mobile: own line, desktop: continues inline) */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Separator dot - only visible on desktop when address exists */}
                  {storeData.address && (storeData.businessHours || storeData.isTemporarilyClosed) && (
                    <span className="hidden md:inline text-gray-300">•</span>
                  )}

                  {/* Open/Closed status with closing/opening time */}
                  {(() => {
                    if (storeData.isTemporarilyClosed) {
                      return (
                        <span className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          {translations.temporarilyClosed || 'Temporarily Closed'}
                        </span>
                      )
                    }

                    if (!storeData.businessHours) return null

                    const tz = storeData.timezone || 'UTC'
                    const now = new Date()
                    const businessTime = new Date(now.toLocaleString('en-US', { timeZone: tz }))
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                    const currentDay = dayNames[businessTime.getDay()]
                    const todayHours = storeData.businessHours[currentDay]
                    const is24h = storeData.timeFormat === '24'

                    const formatTime = (timeStr: string) => {
                      if (!timeStr) return ''
                      if (is24h) return timeStr
                      const [h, m] = timeStr.split(':').map(Number)
                      const period = h >= 12 ? 'PM' : 'AM'
                      const hour12 = h % 12 || 12
                      return `${hour12}:${m.toString().padStart(2, '0')} ${period}`
                    }

                    if (storeData.isOpen && todayHours && !todayHours.closed) {
                      const closingFormatted = formatTime(todayHours.close)
                      return (
                        <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          {(translations.openUntil || 'Open until {time}').replace('{time}', closingFormatted)}
                        </span>
                      )
                    }

                    // Closed -- find next opening time
                    const nextDay = dayNames[(businessTime.getDay() + 1) % 7]
                    const tomorrowHours = storeData.businessHours[nextDay]
                    const nextOpenFormatted = tomorrowHours && !tomorrowHours.closed
                      ? formatTime(tomorrowHours.open)
                      : null

                    return (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-red-600">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        {nextOpenFormatted
                          ? (translations.opensAt || 'Opens at {time}').replace('{time}', nextOpenFormatted)
                          : (translations.closedNow || 'Closed now')}
                      </span>
                    )
                  })()}

                  {/* Separator dot between hours and directions */}
                  {(storeData.businessHours || storeData.isTemporarilyClosed) && storeData.address && (
                    <span className="text-gray-300">•</span>
                  )}

                  {/* Get Directions link */}
                  {storeData.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeData.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-80"
                      style={{ color: primaryColor }}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      {translations.getDirections || 'Get Directions'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Categories - Matching StoreFront */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-[75rem] mx-auto md:px-0 px-4 py-3">
          {/* Legal Pages CTA (above search) */}
          {storeData.legalPagesEnabled && legalPagesData && legalPagesData.ctaEnabled && legalPagesData.pages.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowLegalPagesModal(true)}
                className="w-full p-3 rounded-xl border-2 transition-colors text-left flex items-center justify-between group"
                style={{
                  borderColor: `${primaryColor}40`,
                  backgroundColor: `${primaryColor}05`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <Shield className="w-4 h-4" style={{ color: primaryColor }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {legalPagesData.ctaText}
                  </span>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {/* Storefront Banner */}
          {storeData.bannerEnabled && (storeData.bannerTitle || storeData.bannerSubtitle) && (() => {
            const bannerIconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
              Sparkles, Star, Gift, Zap, Heart, Info, Bell, Tag, Percent, Clock, MapPin, Phone, Megaphone
            }
            const BannerIcon = storeData.bannerIcon ? bannerIconMap[storeData.bannerIcon] : null
            const fontSize = storeData.bannerFontSize || 'md'
            return (
              <div 
                className="mb-3 rounded-xl flex items-center gap-3"
                style={{ 
                  backgroundColor: `${primaryColor}10`, 
                  borderLeft: `4px solid ${primaryColor}`,
                  padding: fontSize === 'sm' ? '8px 12px' : fontSize === 'lg' ? '14px 16px' : '10px 14px'
                }}
              >
                {BannerIcon && (
                  <BannerIcon 
                    className={`flex-shrink-0 ${fontSize === 'sm' ? 'w-4 h-4' : fontSize === 'lg' ? 'w-6 h-6' : 'w-5 h-5'}`}
                    style={{ color: primaryColor }} 
                  />
                )}
                <div className="min-w-0">
                  {storeData.bannerTitle && (
                    <p 
                      className={`font-semibold text-gray-900 leading-tight ${fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'}`}
                    >
                      {storeData.bannerTitle}
                    </p>
                  )}
                  {storeData.bannerSubtitle && (
                    <p 
                      className={`text-gray-600 leading-tight ${fontSize === 'sm' ? 'text-[10px] mt-0.5' : fontSize === 'lg' ? 'text-sm mt-1' : 'text-xs mt-0.5'}`}
                    >
                      {storeData.bannerSubtitle}
                    </p>
                  )}
                </div>
              </div>
            )
          })()}

          {/* Search Bar and Filter Button */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={translations.searchServices || 'Search services...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none transition-colors"
                style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
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
            
            {/* Filter Button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className="flex items-center justify-center px-3 py-3 border-2 border-gray-200 rounded-xl text-base transition-colors hover:border-gray-300 flex-shrink-0"
              style={{ 
                borderColor: (
                  priceMin !== '' || 
                  priceMax !== '' || 
                  sortBy !== 'name-asc'
                ) ? primaryColor : undefined
              }}
            >
              <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Active Filters Badges */}
          {(priceMin !== '' || priceMax !== '' || sortBy !== 'name-asc') && (
            <div className="py-3 flex flex-wrap gap-2">
              {priceMin !== '' && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2">
                  {translations.minPrice || 'Min'}: {currencySymbol}{priceMin}
                  <button onClick={() => setPriceMin('')} className="hover:text-gray-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {priceMax !== '' && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2">
                  {translations.maxPrice || 'Max'}: {currencySymbol}{priceMax}
                  <button onClick={() => setPriceMax('')} className="hover:text-gray-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {sortBy !== 'name-asc' && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-2">
                  {sortBy === 'name-desc' ? 'Name Z-A' : sortBy === 'price-asc' ? 'Price Low-High' : 'Price High-Low'}
                  <button onClick={() => setSortBy('name-asc')} className="hover:text-gray-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Search Results Info */}
          {debouncedSearchTerm && debouncedSearchTerm.trim().length >= 3 && !servicesLoading && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <p className="text-sm text-gray-600">
                {services.length === 0 
                  ? `${translations.noResultsFor || 'No results for'} "${debouncedSearchTerm}"`
                  : `${services.length} ${services.length !== 1 ? (translations.results || 'results') : (translations.result || 'result')} ${translations.for || 'for'} "${debouncedSearchTerm}"`
                }
              </p>
            </div>
          )}

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 pt-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedCategory === 'all' ? { backgroundColor: primaryColor } : {}}
            >
              {translations.all || 'All'}
            </button>
            {categoriesList.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedCategory === cat.id ? { backgroundColor: primaryColor } : {}}
              >
                {useAlbanian && cat.nameAl ? cat.nameAl :
                 useGreek && cat.nameEl ? cat.nameEl :
                 cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="px-4 py-6">
        {servicesLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <p className="mt-4 text-gray-600">{translations.loading || 'Loading...'}</p>
          </div>
        ) : servicesError ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold mb-2">{'Error loading services'}</p>
            <p className="text-gray-600 mb-4">{servicesError}</p>
            <button
              onClick={() => fetchServices(1, true)}
              className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              {translations.tryAgain || 'Try Again'}
            </button>
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            type={debouncedSearchTerm && debouncedSearchTerm.trim().length >= 3 ? 'search-empty' : selectedCategory !== 'all' ? 'category-empty' : 'no-services'}
            primaryColor={primaryColor}
            translations={translations}
            onClearSearch={() => {
              setSearchTerm('')
              setDebouncedSearchTerm('')
            }}
            onShowAll={() => setSelectedCategory('all')}
            searchTerm={debouncedSearchTerm}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[75rem] mx-auto">
            {displayedServices.map((service) => {
              const displayName = useAlbanian && service.nameAl ? service.nameAl :
                                 useGreek && service.nameEl ? service.nameEl :
                                 service.name
              const displayDesc = useAlbanian && service.descriptionAl ? service.descriptionAl :
                                 useGreek && service.descriptionEl ? service.descriptionEl :
                                 service.description
              
              // Check if service is in booking
              const bookingItem = bookingItems.find(item => item.service.id === service.id)
              const totalInBooking = bookingItem ? bookingItem.quantity : 0
              
              // Check if service is featured (if featured property exists)
              const isFeatured = (service as any).featured === true
              const featuredBadgeColor = storeData.featuredBadgeColor || '#EF4444'
              
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer"
                  onClick={() => {
                    setSelectedService(service)
                    setCurrentImageIndex(0)
                    setShowServiceModal(true)
                    // Track service view event
                    trackServiceEvent(service.id, 'view', 'service_card')
                  }}
                >
                  <div className="flex items-start p-5">
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-base text-gray-900 leading-tight">
                              {displayName}
                            </h3>
                            {isFeatured && (
                              <span 
                                className="px-2 py-1 text-white rounded text-xs font-medium whitespace-nowrap"
                                style={{ backgroundColor: featuredBadgeColor }}
                              >
                                {translations.popular || 'Popular'}
                              </span>
                            )}
                            {service.serviceDuration && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium whitespace-nowrap flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(service.serviceDuration)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="mb-1">
                          {displayDesc && (
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                              {displayDesc}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            {service.originalPrice && service.originalPrice > service.price ? (
                              <>
                                <span className="font-bold text-lg" style={{ color: primaryColor }}>
                                  {currencySymbol}{service.price.toFixed(2)}
                                </span>
                                <span className="text-gray-500 line-through text-sm">
                                  {currencySymbol}{service.originalPrice.toFixed(2)}
                                </span>
                                <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
                                  -{Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)}%
                                </span>
                              </>
                            ) : (
                              <span className="font-bold text-lg" style={{ color: primaryColor }}>
                                {currencySymbol}{service.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              addToBooking(service)
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform flex-shrink-0"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {totalInBooking > 0 && (
                          <p className="text-sm mt-2" style={{ color: primaryColor }}>
                            {totalInBooking} {totalInBooking === 1 ? (translations.inBooking || 'in booking') : (translations.inBookingPlural || 'in booking')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {service.images?.[0] && (
                      <div className="w-20 h-20 ml-4 flex-shrink-0">
                        <img 
                          src={service.images[0]} 
                          alt={displayName}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                    
                    {!service.images?.[0] && (
                      <div className="w-20 h-20 ml-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                        <Scissors className="w-7 h-7" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            {/* Subtle loading indicator for pagination - 3 bouncing dots */}
            {servicesLoading && services.length > 0 && (
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
          </div>
        )}
      </div>

      {/* Service Detail Modal */}
      {showServiceModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {useAlbanian && selectedService.nameAl ? selectedService.nameAl :
                   useGreek && selectedService.nameEl ? selectedService.nameEl :
                   selectedService.name}
                </h2>
                <div className="flex items-center gap-2">
                  {/* Share Button */}
                  <button 
                    onClick={() => handleShareService(selectedService.id)}
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
                  <button 
                    onClick={() => {
                      setShowServiceModal(false)
                      setSelectedService(null)
                      setCurrentImageIndex(0)
                    }} 
                    className="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Service Images - Image Gallery */}
                {selectedService.images && selectedService.images.length > 0 && (
                  <div className="relative">
                    <div className="w-full max-w-sm mx-auto relative">
                      {/* Main Image */}
                      <div className="relative overflow-hidden rounded-2xl bg-gray-50">
                        <img 
                          src={selectedService.images[currentImageIndex]} 
                          alt={useAlbanian && selectedService.nameAl ? selectedService.nameAl :
                               useGreek && selectedService.nameEl ? selectedService.nameEl :
                               selectedService.name}
                          className="w-full h-full object-contain transition-opacity duration-300"
                          style={{ minHeight: '300px' }}
                          key={`${selectedService.id}-${currentImageIndex}`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            const fallback = selectedService.images[0] || ''
                            target.src = fallback
                            setCurrentImageIndex(0)
                          }}
                        />
                        
                        {/* Navigation Arrows - Only show if multiple images */}
                        {selectedService.images.length > 1 && (
                          <>
                            {/* Left Arrow */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setCurrentImageIndex((prev) => 
                                  prev === 0 ? selectedService.images.length - 1 : prev - 1
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
                                  prev === selectedService.images.length - 1 ? 0 : prev + 1
                                )
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all"
                              aria-label="Next image"
                            >
                              <ChevronRight className="w-5 h-5 text-gray-700" />
                            </button>
                          </>
                        )}
                      </div>
                      
                      {/* Image Dots Indicator - Only show if multiple images */}
                      {selectedService.images.length > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                          {selectedService.images.map((_, index) => (
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
                      )}
                      
                      {/* Image Counter - Only show if multiple images */}
                      {selectedService.images.length > 1 && (
                        <div className="absolute top-3 left-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                          {currentImageIndex + 1} / {selectedService.images.length}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Service Details */}
                <div className="space-y-4">
                  {/* Duration */}
                  {selectedService.serviceDuration && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">{formatDuration(selectedService.serviceDuration)}</span>
                    </div>
                  )}
                  
                  {/* Price */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-gray-900">
                      {currencySymbol}{selectedService.price.toFixed(2)}
                    </span>
                    {selectedService.originalPrice && selectedService.originalPrice > selectedService.price && (
                      <>
                        <span className="text-lg text-gray-500 line-through">
                          {currencySymbol}{selectedService.originalPrice.toFixed(2)}
                        </span>
                        <span className="bg-red-100 text-red-700 text-sm px-2 py-1 rounded-full font-medium">
                          -{Math.round(((selectedService.originalPrice - selectedService.price) / selectedService.originalPrice) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Description */}
                  {(selectedService.description || (useAlbanian && selectedService.descriptionAl) || (useGreek && selectedService.descriptionEl)) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">{translations.description || 'Description'}</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {useAlbanian && selectedService.descriptionAl ? selectedService.descriptionAl :
                         useGreek && selectedService.descriptionEl ? selectedService.descriptionEl :
                         selectedService.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer - Add to Booking Button */}
            <div className="p-6 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => {
                  addToBooking(selectedService)
                  setShowServiceModal(false)
                  setSelectedService(null)
                  setCurrentImageIndex(0)
                  // Track add to booking from modal
                  trackServiceEvent(selectedService.id, 'add_to_booking', 'service_modal')
                }}
                className="w-full py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                style={{ backgroundColor: storeData.primaryColor }}
              >
                {translations.addToBooking || 'Add to Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Summary Bar */}
      {bookingItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20 p-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {bookingItems.length} {bookingItems.length > 1 ? (translations.servicePlural || 'services') : (translations.serviceSingular || 'service')}
              </p>
              <p className="text-xs text-gray-600">
                {formatDuration(totalDuration)} • {currencySymbol}{total.toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-6 py-2 rounded-lg text-white font-semibold"
              style={{ backgroundColor: storeData.whatsappButtonColor || storeData.primaryColor }}
            >
              {translations.bookAppointment || 'Book Appointment'}
            </button>
          </div>
        </div>
      )}

      {/* Booking Modal - Mobile Bottom Sheet, Desktop Centered Modal */}
      {showBookingModal && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowBookingModal(false)} />
          
          {/* Mobile: Bottom Sheet */}
          <div className="lg:hidden fixed inset-0 z-50 flex items-end pointer-events-none">
            <div className="bg-white w-full max-w-full max-h-[85vh] rounded-t-3xl overflow-hidden pointer-events-auto">
            <div className="p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{translations.bookAppointment || 'Book Appointment'}</h2>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto overflow-x-hidden max-h-[calc(85vh-180px)] scrollbar-hide">
              <div className="p-6 space-y-6 overflow-hidden">
              {/* Selected Services */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">{translations.selectedServices || 'Selected Services'}</h3>
                <div className="space-y-2">
                  {bookingItems.map((item) => {
                    const displayName = useAlbanian && item.service.nameAl ? item.service.nameAl :
                                     useGreek && item.service.nameEl ? item.service.nameEl :
                                     item.service.name
                    return (
                      <div key={item.service.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{displayName}</p>
                            {item.service.serviceDuration && (
                              <p className="text-xs text-gray-600">{formatDuration(item.service.serviceDuration)}</p>
                            )}
                          </div>
                          <div className="text-right whitespace-nowrap flex-shrink-0">
                            {item.service.originalPrice && item.service.originalPrice > item.service.price ? (
                              <>
                                <span className="text-xs text-gray-400 line-through mr-1.5">
                                  {currencySymbol}{(item.service.originalPrice * item.quantity).toFixed(2)}
                                </span>
                                <span className="font-semibold" style={{ color: primaryColor }}>
                                  {currencySymbol}{(item.service.price * item.quantity).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="font-semibold text-gray-900">
                                {currencySymbol}{(item.service.price * item.quantity).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.service.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-sm"
                          >
                            -
                          </button>
                          <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold text-lg">
                  <span>{translations.total || 'Total'}</span>
                  <span style={{ color: storeData.primaryColor }}>
                    {currencySymbol}{total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Appointment Date */}
              <div className="overflow-hidden">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {translations.appointmentDate || 'Appointment Date'}
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentDate ? appointmentDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    setAppointmentDate(new Date(e.target.value))
                    setAppointmentTime('')
                  }}
                  className="w-full max-w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 box-border"
                />
              </div>

              {/* Appointment Time */}
              {appointmentDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {translations.appointmentTime || 'Appointment Time'}
                  </label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">{translations.selectTime || 'Select time'}</option>
                    {generateTimeSlots(appointmentDate).map((slot) => {
                      const [hours, minutes] = slot.split(':').map(Number)
                      const date = new Date(appointmentDate)
                      date.setHours(hours, minutes, 0, 0)
                      const label = storeData.timeFormat === '24' 
                        ? slot 
                        : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                      return (
                        <option key={slot} value={slot}>{label}</option>
                      )
                    })}
                  </select>
                </div>
              )}

              {/* Customer Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {translations.name || 'Name'} *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {translations.phone || 'Phone'} *
                  </label>
                  <div className="w-full">
                    <PhoneInput
                      value={customerInfo.phone}
                      onChange={(phone) => setCustomerInfo({ ...customerInfo, phone })}
                      storeData={storeData}
                      primaryColor={storeData.primaryColor}
                      translations={translations}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {translations.email || 'Email'}
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {translations.notes || 'Notes'}
                  </label>
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder={translations.specialRequests || 'Any special requests...'}
                  />
                </div>

                {/* Invoice/Receipt Selection - Only for Greek storefronts with feature enabled */}
                {(storeData.storefrontLanguage === 'el' || storeData.language === 'el') && storeData.invoiceReceiptSelectionEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {translations.invoiceOrReceiptQuestion || 'Invoice or Receipt? *'}
                      </label>
                      <select
                        value={customerInfo.invoiceType || ''}
                        onChange={(e) => {
                          const newType = e.target.value as 'INVOICE' | 'RECEIPT' | ''
                          setCustomerInfo({ 
                            ...customerInfo, 
                            invoiceType: newType,
                            ...(newType !== 'INVOICE' && {
                              invoiceAfm: '',
                              invoiceCompanyName: '',
                              invoiceTaxOffice: ''
                            })
                          })
                        }}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="">{translations.selectInvoiceOrReceipt?.split(' ')[0] || 'Select...'}</option>
                        <option value="INVOICE">{translations.invoice || 'Invoice'}</option>
                        <option value="RECEIPT">{translations.receipt || 'Receipt'}</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {translations.selectInvoiceOrReceipt || 'Select if you need an invoice or receipt for your order'}
                      </p>

                      {/* Check minimum order value for invoice */}
                      {customerInfo.invoiceType === 'INVOICE' && storeData.invoiceMinimumOrderValue && total < storeData.invoiceMinimumOrderValue && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">
                            {translations.invoiceMinimumOrderErrorWithCurrent
                              ?.replace('{amount}', `${currencySymbol}${storeData.invoiceMinimumOrderValue.toFixed(2)}`)
                              ?.replace('{current}', `${currencySymbol}${total.toFixed(2)}`)
                              || `To select Invoice, your order must be at least ${currencySymbol}${storeData.invoiceMinimumOrderValue.toFixed(2)}. Current order: ${currencySymbol}${total.toFixed(2)}`}
                          </p>
                        </div>
                      )}

                      {/* Message when invoice is selected */}
                      {customerInfo.invoiceType === 'INVOICE' && (!storeData.invoiceMinimumOrderValue || total >= storeData.invoiceMinimumOrderValue) && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <strong>{translations.invoiceNote?.split(':')[0] || 'Note'}:</strong> {translations.invoiceNote?.split(':')[1]?.trim() || 'We will contact you to ask for any details if you need to include in your Invoice.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Invoice-specific fields - Only show when INVOICE is selected and minimum order met */}
                    {customerInfo.invoiceType === 'INVOICE' && (!storeData.invoiceMinimumOrderValue || total >= storeData.invoiceMinimumOrderValue) && (
                      <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900">{translations.invoiceDetails || 'Invoice Details'}</h4>
                        
                        {/* Tax ID (AFM) - Required */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {translations.taxIdRequired || 'Tax ID (AFM) *'}
                          </label>
                          <input
                            type="text"
                            value={customerInfo.invoiceAfm || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                              setCustomerInfo({ ...customerInfo, invoiceAfm: value })
                            }}
                            required={customerInfo.invoiceType === 'INVOICE'}
                            placeholder="123456789"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                              <p className="text-xs text-gray-500 mt-1">
                                {customerInfo.invoiceAfm?.length === 9 
                                  ? `✓ ${translations.taxIdDigits || '9 digits'}` 
                                  : (translations.taxIdDigitsCount || '9 digits ({count}/9)').replace('{count}', String(customerInfo.invoiceAfm?.length || 0))}
                              </p>
                        </div>

                        {/* Company Name - Optional */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {translations.companyName || 'Company Name'}
                          </label>
                          <input
                            type="text"
                            value={customerInfo.invoiceCompanyName || ''}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, invoiceCompanyName: e.target.value })}
                            placeholder={translations.companyName || 'Company Name'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>

                        {/* Tax Office (ΔΟΥ) - Optional */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {translations.taxOffice || 'Tax Office (ΔΟΥ)'}
                          </label>
                          <input
                            type="text"
                            value={customerInfo.invoiceTaxOffice || ''}
                            onChange={(e) => setCustomerInfo({ ...customerInfo, invoiceTaxOffice: e.target.value })}
                            placeholder={translations.taxOffice || 'Tax Office'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={submitBooking}
                disabled={!appointmentDate || !appointmentTime || !customerInfo.name || !customerInfo.phone || isSubmitting}
                className={`w-full py-3 rounded-lg text-white font-semibold transition-opacity ${
                  (!appointmentDate || !appointmentTime || !customerInfo.name || !customerInfo.phone || isSubmitting)
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:opacity-90'
                }`}
                style={{ backgroundColor: storeData.whatsappButtonColor || storeData.primaryColor }}
              >
                {isSubmitting 
                  ? (translations.submitting || 'Submitting...')
                  : `${translations.bookViaWhatsapp || 'Book via WhatsApp'} - ${currencySymbol}${total.toFixed(2)}`
                }
              </button>
              </div>
            </div>
          </div>
          </div>
          
          {/* Desktop: Centered Modal */}
          <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col pointer-events-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
                <h2 className="text-xl font-bold text-gray-900">
                  {translations.bookAppointment || 'Book Appointment'}
                </h2>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
                {/* Selected Services */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">{translations.selectedServices || 'Selected Services'}</h3>
                  <div className="space-y-2">
                    {bookingItems.map((item) => {
                      const displayName = useAlbanian && item.service.nameAl ? item.service.nameAl :
                                       useGreek && item.service.nameEl ? item.service.nameEl :
                                       item.service.name
                      return (
                        <div key={item.service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{displayName}</p>
                            {item.service.serviceDuration && (
                              <p className="text-xs text-gray-600">{formatDuration(item.service.serviceDuration)}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.service.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              +
                            </button>
                            <div className="ml-2 min-w-[80px] text-right">
                              {item.service.originalPrice && item.service.originalPrice > item.service.price ? (
                                <>
                                  <span className="text-xs text-gray-400 line-through mr-1">
                                    {currencySymbol}{(item.service.originalPrice * item.quantity).toFixed(2)}
                                  </span>
                                  <span className="font-semibold" style={{ color: primaryColor }}>
                                    {currencySymbol}{(item.service.price * item.quantity).toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="font-semibold text-gray-900">
                                  {currencySymbol}{(item.service.price * item.quantity).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold text-lg">
                    <span>{translations.total || 'Total'}</span>
                    <span style={{ color: primaryColor }}>
                      {currencySymbol}{total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Appointment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {translations.appointmentDate || 'Appointment Date'}
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={appointmentDate ? appointmentDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      setAppointmentDate(new Date(e.target.value))
                      setAppointmentTime('')
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Appointment Time */}
                {appointmentDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {translations.appointmentTime || 'Appointment Time'}
                    </label>
                    <select
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">{translations.selectTime || 'Select time'}</option>
                      {generateTimeSlots(appointmentDate).map((slot) => {
                        const [hours, minutes] = slot.split(':').map(Number)
                        const date = new Date(appointmentDate)
                        date.setHours(hours, minutes, 0, 0)
                        const label = storeData.timeFormat === '24' 
                          ? slot 
                          : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                        return (
                          <option key={slot} value={slot}>{label}</option>
                        )
                      })}
                    </select>
                  </div>
                )}

                {/* Customer Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {translations.name || 'Name'} *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {translations.phone || 'Phone'} *
                    </label>
                    <div className="w-full">
                      <PhoneInput
                        value={customerInfo.phone}
                        onChange={(phone) => setCustomerInfo({ ...customerInfo, phone })}
                        storeData={storeData}
                        primaryColor={storeData.primaryColor}
                        translations={translations}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {translations.email || 'Email'}
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {translations.notes || 'Notes'}
                    </label>
                    <textarea
                      value={customerInfo.notes}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder={translations.specialRequests || 'Any special requests...'}
                    />
                  </div>

                  {/* Invoice/Receipt Selection - Only for Greek storefronts with feature enabled */}
                  {(storeData.storefrontLanguage === 'el' || storeData.language === 'el') && storeData.invoiceReceiptSelectionEnabled && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {translations.invoiceOrReceiptQuestion || 'Invoice or Receipt? *'}
                        </label>
                        <select
                          value={customerInfo.invoiceType || ''}
                          onChange={(e) => {
                            const newType = e.target.value as 'INVOICE' | 'RECEIPT' | ''
                            setCustomerInfo({ 
                              ...customerInfo, 
                              invoiceType: newType,
                              ...(newType !== 'INVOICE' && {
                                invoiceAfm: '',
                                invoiceCompanyName: '',
                                invoiceTaxOffice: ''
                              })
                            })
                          }}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">{translations.selectInvoiceOrReceipt?.split(' ')[0] || 'Select...'}</option>
                          <option value="INVOICE">{translations.invoice || 'Invoice'}</option>
                          <option value="RECEIPT">{translations.receipt || 'Receipt'}</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          {translations.selectInvoiceOrReceipt || 'Select if you need an invoice or receipt for your order'}
                        </p>

                        {/* Check minimum order value for invoice */}
                        {customerInfo.invoiceType === 'INVOICE' && storeData.invoiceMinimumOrderValue && total < storeData.invoiceMinimumOrderValue && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                              {translations.invoiceMinimumOrderErrorWithCurrent
                                ?.replace('{amount}', `${currencySymbol}${storeData.invoiceMinimumOrderValue.toFixed(2)}`)
                                ?.replace('{current}', `${currencySymbol}${total.toFixed(2)}`)
                                || `To select Invoice, your order must be at least ${currencySymbol}${storeData.invoiceMinimumOrderValue.toFixed(2)}. Current order: ${currencySymbol}${total.toFixed(2)}`}
                            </p>
                          </div>
                        )}

                        {/* Message when invoice is selected */}
                        {customerInfo.invoiceType === 'INVOICE' && (!storeData.invoiceMinimumOrderValue || total >= storeData.invoiceMinimumOrderValue) && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700">
                              <strong>{translations.invoiceNote?.split(':')[0] || 'Note'}:</strong> {translations.invoiceNote?.split(':')[1]?.trim() || 'We will contact you to ask for any details if you need to include in your Invoice.'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Invoice-specific fields - Only show when INVOICE is selected and minimum order met */}
                      {customerInfo.invoiceType === 'INVOICE' && (!storeData.invoiceMinimumOrderValue || total >= storeData.invoiceMinimumOrderValue) && (
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900">{translations.invoiceDetails || 'Invoice Details'}</h4>
                          
                          {/* Tax ID (AFM) - Required */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {translations.taxIdRequired || 'Tax ID (AFM) *'}
                            </label>
                            <input
                              type="text"
                              value={customerInfo.invoiceAfm || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 9)
                                setCustomerInfo({ ...customerInfo, invoiceAfm: value })
                              }}
                              required={customerInfo.invoiceType === 'INVOICE'}
                              placeholder="123456789"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {customerInfo.invoiceAfm?.length === 9 
                                ? `✓ ${translations.taxIdDigits || '9 digits'}` 
                                : (translations.taxIdDigitsCount || '9 digits ({count}/9)').replace('{count}', String(customerInfo.invoiceAfm?.length || 0))}
                            </p>
                          </div>

                          {/* Company Name - Optional */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {translations.companyName || 'Company Name'}
                            </label>
                            <input
                              type="text"
                              value={customerInfo.invoiceCompanyName || ''}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, invoiceCompanyName: e.target.value })}
                              placeholder={translations.companyName || 'Company Name'}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>

                          {/* Tax Office (ΔΟΥ) - Optional */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              {translations.taxOffice || 'Tax Office (ΔΟΥ)'}
                            </label>
                            <input
                              type="text"
                              value={customerInfo.invoiceTaxOffice || ''}
                              onChange={(e) => setCustomerInfo({ ...customerInfo, invoiceTaxOffice: e.target.value })}
                              placeholder={translations.taxOffice || 'Tax Office'}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={submitBooking}
                  disabled={!appointmentDate || !appointmentTime || !customerInfo.name || !customerInfo.phone || isSubmitting}
                  className={`w-full py-3 rounded-lg text-white font-semibold transition-opacity ${
                    (!appointmentDate || !appointmentTime || !customerInfo.name || !customerInfo.phone || isSubmitting)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: storeData.whatsappButtonColor || storeData.primaryColor }}
                >
                  {isSubmitting 
                    ? (translations.submitting || 'Submitting...')
                    : `${translations.bookViaWhatsapp || 'Book via WhatsApp'} - ${currencySymbol}${total.toFixed(2)}`
                  }
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Filter Modal */}
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
              <h2 className="text-xl font-semibold text-gray-900">{translations.filterServices || 'Filter Services'}</h2>
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

      {/* Scroll to Top Button */}
      {showScrollToTop && !showBookingModal && !showServiceModal && !showBusinessInfoModal && !showShareModal && !showFilterModal && (
        <button
          onClick={scrollToTop}
          className={`fixed ${bookingItems.length > 0 ? 'bottom-24' : 'bottom-10'} right-5 lg:right-[21px] lg:mr-6 w-12 h-12 rounded-full flex items-center justify-center shadow-xl cursor-pointer z-[60] transition-all duration-300 hover:scale-110`}
          style={{ backgroundColor: primaryColor }}
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-6 h-6 text-white" />
        </button>
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

      {/* Footer */}
      <footer className="bg-white mt-8">
        <div className="max-w-[75rem] mx-auto px-5 py-6">
          {/* Legal Pages Links */}
          {storeData.legalPagesEnabled && legalPagesData && legalPagesData.pages.filter(p => p.showInFooter).length > 0 && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                {legalPagesData.pages
                  .filter(p => p.showInFooter)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((page) => (
                    <a
                      key={page.slug}
                      href={`/${storeData.slug}/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                      style={{ color: primaryColor }}
                    >
                      {page.title}
                    </a>
                  ))}
              </div>
            </div>
          )}
          
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

      {/* Legal Pages Modal */}
      {storeData.legalPagesEnabled && (
        <LegalPagesModal
          isOpen={showLegalPagesModal}
          onClose={() => setShowLegalPagesModal(false)}
          businessSlug={storeData.slug}
          primaryColor={primaryColor}
          translations={translations}
        />
      )}

      {/* Error Message */}
      {errorMessage && (
        <ErrorMessage
          isVisible={errorMessage.visible}
          onClose={() => setErrorMessage(null)}
          message={errorMessage.message}
          type={errorMessage.type || 'error'}
          primaryColor={primaryColor}
          translations={translations}
        />
      )}
    </div>
  )
}

// Empty State Component for Services
function EmptyState({ 
  type, 
  primaryColor, 
  translations,
  onClearSearch,
  onShowAll,
  searchTerm
}: { 
  type: 'no-services' | 'category-empty' | 'search-empty'
  primaryColor: string
  translations: any
  onClearSearch?: () => void
  onShowAll?: () => void
  searchTerm?: string
}) {
  const getEmptyStateContent = () => {
    switch (type) {
      case 'no-services':
        return {
          icon: Scissors,
          title: translations.comingSoon || 'Coming Soon',
          description: translations.checkBackLaterServices || 'Check back later for amazing services!',
          showActions: false
        }
      case 'category-empty':
        return {
          icon: Scissors,
          title: translations.noServicesInCategory || 'No services in this category',
          description: translations.noServicesInCategoryDescription || 'This category is currently empty. Browse other categories or check back later.',
          showActions: true,
          actionText: translations.browseAllServices || 'Browse All Services',
          actionCallback: onShowAll
        }
      case 'search-empty':
        return {
          icon: Search,
          title: `${translations.noServicesFound || 'No results found'} "${searchTerm}"`,
          description: translations.noServicesFoundDescription || 'Try a different search term or browse all services',
          showActions: true,
          actionText: translations.tryDifferentSearch || 'Clear Search',
          actionCallback: onClearSearch,
          secondaryActionText: translations.browseAllServices || 'Browse All Services',
          secondaryActionCallback: onShowAll
        }
      default:
        return {
          icon: Scissors,
          title: translations.comingSoon || 'Coming Soon',
          description: translations.checkBackLaterServices || 'Check back later for amazing services!',
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

// Business Info Modal Component
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
    const dayLabels = [
      translations.dayMon || 'Mon',
      translations.dayTue || 'Tue',
      translations.dayWed || 'Wed',
      translations.dayThu || 'Thu',
      translations.dayFri || 'Fri',
      translations.daySat || 'Sat',
      translations.daySun || 'Sun'
    ]
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
            {dayLabels[index]} {isToday && `(${translations.todayLabel || 'Today'})`}
          </span>
          <span className={`text-sm ${
            isToday ? 'text-blue-700 font-medium' : 'text-gray-600'
          }`}>
            {hours?.closed ? (translations.closedLabel || 'Closed') : `${hours?.open} - ${hours?.close}`}
          </span>
        </div>
      )
    })
  }

  const lang = storeData.storefrontLanguage || storeData.language || 'en'
  const displayDescription = (lang === 'sq' || lang === 'al') && storeData.descriptionAl 
    ? storeData.descriptionAl 
    : lang === 'el' && storeData.descriptionEl
      ? storeData.descriptionEl
      : storeData.description

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-xl">
        {/* Header */}
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
          {displayDescription && (
            <div className="bg-gray-50 p-4 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
                {translations.about || 'About'}
              </h3>
              <p className="text-gray-700 leading-relaxed">{displayDescription}</p>
            </div>
          )}
          
          {/* Contact Information */}
          <div>
            {/* Website */}
            {storeData.website && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
                  {translations.website || 'Website'}
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

          {/* Contact Options - only show if there's contact info */}
          {(storeData.phone || storeData.email) && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: primaryColor }}></div>
                {translations.contact || 'Contact'}
              </h3>
              <div className="space-y-3">
                {storeData.phone && (
                  <div className="flex items-center p-3 bg-blue-50 rounded-xl">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Phone className="w-4 h-4 text-blue-600" />
                    </div>
                    <a href={`tel:${storeData.phone}`} className="font-medium text-gray-800">
                      {storeData.phone}
                    </a>
                  </div>
                )}
                {storeData.email && (
                  <div className="flex items-center p-3 bg-purple-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                      <Mail className="w-4 h-4 text-purple-600" />
                    </div>
                    <a href={`mailto:${storeData.email}`} className="font-medium text-gray-800">
                      {storeData.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Share Modal Component
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
  const shareText = (translations.shareStoreText || 'Check out {name}! Book your appointment online.').replace('{name}', storeData.name)
  
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
        const subject = (translations.shareStoreSubject || 'Check out {name}').replace('{name}', storeData.name)
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
              <p className="text-green-600 text-sm mt-2 font-medium">{translations.linkCopied || 'Link copied!'}</p>
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
                {translations.moreSharingOptions || 'More sharing options...'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ScrollableSection helper component
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

    setTimeout(checkScrollPosition, 100)
    
    scrollElement.addEventListener('scroll', checkScrollPosition)
    
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
      {showUpArrow && (
        <button
          onClick={scrollUp}
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center py-2 bg-gradient-to-b from-white to-transparent pointer-events-auto"
        >
          <ChevronUp className="w-5 h-5 text-gray-600" />
        </button>
      )}
      <div
        ref={scrollRef}
        className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        style={{ maxHeight }}
      >
        {children}
      </div>
      {showDownArrow && (
        <button
          onClick={scrollDown}
          className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center py-2 bg-gradient-to-t from-white to-transparent pointer-events-auto"
        >
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  )
}
