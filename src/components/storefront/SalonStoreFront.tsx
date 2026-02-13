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
  CheckCircle
} from 'lucide-react'
import { getStorefrontTranslations } from '@/utils/storefront-translations'
import { PhoneInput } from '../site/PhoneInput'

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
  const [bookingItems, setBookingItems] = useState<BookingItem[]>([])
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null)
  const [appointmentTime, setAppointmentTime] = useState<string>('')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
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
      setCustomerInfo({ name: '', phone: '', email: '', notes: '' })
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
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => addToBooking(service)}
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
                      <span className="font-bold text-gray-900">
                        {currencySymbol}{service.price.toFixed(2)}
                      </span>
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
