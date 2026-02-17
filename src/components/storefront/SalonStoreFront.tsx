'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  ChevronLeft,
  ChevronRight,
  Scissors,
  User,
  CheckCircle,
  Share2,
  Check
} from 'lucide-react'
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

export default function SalonStoreFront({ storeData }: { storeData: StoreData }) {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const shareHandledRef = useRef(false)
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
  const [isSubmitting, setIsSubmitting] = useState(false)

  const lang = storeData.storefrontLanguage || storeData.language || 'en'
  const translations = getStorefrontTranslations(lang)
  const currencySymbol = storeData.currency === 'USD' ? '$' : 
                         storeData.currency === 'EUR' ? '€' : 
                         storeData.currency === 'GBP' ? '£' : 
                         storeData.currency === 'ALL' ? 'L' : storeData.currency

  // Fetch services
  useEffect(() => {
    fetchServices()
  }, [selectedCategory, searchTerm])

  const fetchServices = async () => {
    setServicesLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.set('categoryId', selectedCategory)
      }
      if (searchTerm) {
        params.set('search', searchTerm)
      }
      
      const response = await fetch(`/api/storefront/${storeData.slug}/products?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch services')
      
      const data = await response.json()
      // Filter for services only (isService: true)
      const servicesData = (data.products || []).filter((p: any) => p.isService === true)
      setServices(servicesData)
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setServicesLoading(false)
    }
  }

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

  const calculateTotal = () => {
    return bookingItems.reduce((sum, item) => sum + (item.service.price * item.quantity), 0)
  }

  const calculateTotalDuration = () => {
    return bookingItems.reduce((sum, item) => 
      sum + ((item.service.serviceDuration || 0) * item.quantity), 0)
  }

  const formatDuration = (minutes: number) => {
    if (!minutes) return ''
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`.trim()
    }
    return `${mins}min`
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
  const generateTimeSlots = (date: Date) => {
    if (!storeData.businessHours) return []
    
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    const dayHours = storeData.businessHours[dayOfWeek]
    
    if (!dayHours || dayHours.closed) return []
    
    const [openHour, openMinute] = dayHours.open.split(':').map(Number)
    const [closeHour, closeMinute] = dayHours.close.split(':').map(Number)
    
    const slots: string[] = []
    let currentTime = new Date(date)
    currentTime.setHours(openHour, openMinute, 0, 0)
    
    const closeTime = new Date(date)
    closeTime.setHours(closeHour, closeMinute, 0, 0)
    
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
          name: item.service.name
        })),
        customer: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email || undefined
        },
        deliveryType: 'dineIn', // Salon appointments are in-salon
        deliveryTime: appointmentDateTime.toISOString(),
        specialInstructions: customerInfo.notes,
        invoiceType: customerInfo.invoiceType || null, // Invoice/Receipt selection (for Greek storefronts)
        invoiceAfm: customerInfo.invoiceType === 'INVOICE' ? (customerInfo.invoiceAfm || null) : null,
        invoiceCompanyName: customerInfo.invoiceType === 'INVOICE' ? (customerInfo.invoiceCompanyName || null) : null,
        invoiceTaxOffice: customerInfo.invoiceType === 'INVOICE' ? (customerInfo.invoiceTaxOffice || null) : null,
        paymentMethod: 'Cash', // Default, can be updated
        total: calculateTotal(),
        subtotal: calculateTotal(),
        deliveryFee: 0
      }

      const response = await fetch(`/api/storefront/${storeData.slug}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        throw new Error('Failed to submit booking')
      }

      const result = await response.json()
      
      // Open WhatsApp with booking message
      if (result.whatsappLink) {
        window.open(result.whatsappLink, '_blank')
      }

      // Reset form
      setBookingItems([])
      setShowBookingModal(false)
      setAppointmentDate(null)
      setAppointmentTime('')
      setCustomerInfo({ name: '', phone: '', email: '', notes: '', invoiceType: '' as '', invoiceAfm: '', invoiceCompanyName: '', invoiceTaxOffice: '' })
    } catch (error) {
      console.error('Error submitting booking:', error)
      alert('Failed to submit booking. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const useAlbanian = lang === 'sq' || lang === 'al'
  const useGreek = lang === 'el'

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: storeData.fontFamily || 'system-ui' }}>
      {/* Header */}
      <div className="relative bg-white shadow-sm">
        {storeData.coverImage && (
          <div 
            className="w-full bg-cover bg-center"
            style={{ 
              height: '200px',
              backgroundImage: `url(${storeData.coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        )}
        <div className="px-4 py-6">
          {storeData.logo && (
            <img 
              src={storeData.logo} 
              alt={storeData.name}
              className="h-16 w-16 rounded-full object-cover mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold text-center text-gray-900">{storeData.name}</h1>
          {storeData.description && (
            <p className="text-center text-gray-600 mt-2">
              {useAlbanian && storeData.descriptionAl ? storeData.descriptionAl :
               useGreek && storeData.descriptionEl ? storeData.descriptionEl :
               storeData.description}
            </p>
          )}
        </div>
      </div>

      {/* Search and Categories */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={translations.search || 'Search services...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={selectedCategory === 'all' ? { backgroundColor: storeData.primaryColor } : {}}
          >
            {translations.all || 'All'}
          </button>
          {storeData.categories?.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedCategory === cat.id ? { backgroundColor: storeData.primaryColor } : {}}
            >
              {useAlbanian && cat.nameAl ? cat.nameAl :
               useGreek && cat.nameEl ? cat.nameEl :
               cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid */}
      <div className="px-4 py-6">
        {servicesLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <p className="mt-4 text-gray-600">{translations.loading || 'Loading...'}</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{translations.noProductsFound || 'No services found'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {services.map((service) => {
              const displayName = useAlbanian && service.nameAl ? service.nameAl :
                                 useGreek && service.nameEl ? service.nameEl :
                                 service.name
              const displayDesc = useAlbanian && service.descriptionAl ? service.descriptionAl :
                                 useGreek && service.descriptionEl ? service.descriptionEl :
                                 service.description
              
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative"
                  onClick={() => {
                    setSelectedService(service)
                    setShowServiceModal(true)
                  }}
                >
                  {service.images?.[0] && (
                    <div className="aspect-square bg-gray-100">
                      <img 
                        src={service.images[0]} 
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{displayName}</h3>
                    {service.serviceDuration && (
                      <div className="flex items-center text-xs text-gray-600 mb-2">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDuration(service.serviceDuration)}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {currencySymbol}{service.price.toFixed(2)}
                        </span>
                        {service.originalPrice && service.originalPrice > service.price && (
                          <>
                            <span className="text-sm text-gray-500 line-through">
                              {currencySymbol}{service.originalPrice.toFixed(2)}
                            </span>
                            <span className="bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
                              -{Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)}%
                            </span>
                          </>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          addToBooking(service)
                        }}
                        className="px-3 py-1 rounded-lg text-white text-sm font-medium"
                        style={{ backgroundColor: storeData.primaryColor }}
                      >
                        {translations.add || 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
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
                {/* Service Images */}
                {selectedService.images && selectedService.images.length > 0 && (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={selectedService.images[0]} 
                      alt={useAlbanian && selectedService.nameAl ? selectedService.nameAl :
                           useGreek && selectedService.nameEl ? selectedService.nameEl :
                           selectedService.name}
                      className="w-full h-full object-cover"
                    />
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
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
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
                {bookingItems.length} {bookingItems.length > 1 ? 'services' : 'service'}
              </p>
              <p className="text-xs text-gray-600">
                {formatDuration(calculateTotalDuration())} • {currencySymbol}{calculateTotal().toFixed(2)}
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

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
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

            <div className="p-6 space-y-6">
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
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.service.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                          >
                            +
                          </button>
                          <span className="ml-2 font-semibold text-gray-900 min-w-[60px] text-right">
                            {currencySymbol}{(item.service.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-bold text-lg">
                  <span>{translations.total || 'Total'}</span>
                  <span style={{ color: storeData.primaryColor }}>
                    {currencySymbol}{calculateTotal().toFixed(2)}
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
                      {customerInfo.invoiceType === 'INVOICE' && storeData.invoiceMinimumOrderValue && calculateTotal() < storeData.invoiceMinimumOrderValue && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">
                            {translations.invoiceMinimumOrderErrorWithCurrent
                              ?.replace('{amount}', `${currencySymbol}${storeData.invoiceMinimumOrderValue.toFixed(2)}`)
                              ?.replace('{current}', `${currencySymbol}${calculateTotal().toFixed(2)}`)
                              || `To select Invoice, your order must be at least ${currencySymbol}${storeData.invoiceMinimumOrderValue.toFixed(2)}. Current order: ${currencySymbol}${calculateTotal().toFixed(2)}`}
                          </p>
                        </div>
                      )}

                      {/* Message when invoice is selected */}
                      {customerInfo.invoiceType === 'INVOICE' && (!storeData.invoiceMinimumOrderValue || calculateTotal() >= storeData.invoiceMinimumOrderValue) && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <strong>{translations.invoiceNote?.split(':')[0] || 'Note'}:</strong> {translations.invoiceNote?.split(':')[1]?.trim() || 'We will contact you to ask for any details if you need to include in your Invoice.'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Invoice-specific fields - Only show when INVOICE is selected and minimum order met */}
                    {customerInfo.invoiceType === 'INVOICE' && (!storeData.invoiceMinimumOrderValue || calculateTotal() >= storeData.invoiceMinimumOrderValue) && (
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
                  : `${translations.bookViaWhatsapp || 'Book via WhatsApp'} - ${currencySymbol}${calculateTotal().toFixed(2)}`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
