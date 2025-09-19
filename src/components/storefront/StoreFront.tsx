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
  Truck,
  Store,
  UtensilsCrossed,
  Info,
  Package,
  AlertCircle,
  DollarSign,
  CalendarClock,
  AlertTriangle,
  ChevronDown
} from 'lucide-react'
import { getStorefrontTranslations } from '@/utils/storefront-translations'

// Google Places API hook for address autocomplete
const useGooglePlaces = () => {
  const [isLoaded, setIsLoaded] = useState(false)
  const autocompleteRef = useRef(null)
  
  useEffect(() => {
     // @ts-ignore
    if (typeof window !== 'undefined' && window.google) {
      setIsLoaded(true)
      return
    }
    
    if (typeof window !== 'undefined') {
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
      script.onload = () => setIsLoaded(true)
      document.head.appendChild(script)
    }
  }, [])

  // @ts-ignore
  const initAutocomplete = (inputRef, onSelect) => {
     // @ts-ignore
    if (isLoaded && typeof window !== 'undefined' && window.google && inputRef.current) {
         // @ts-ignore
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'al' } // Adjust based on your service area
      })
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place.formatted_address) {
          onSelect(place.formatted_address)
        }
      })
      
      autocompleteRef.current = autocomplete
    }
  }

  return { isLoaded, initAutocomplete }
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
  const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'lowercase' })
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

// Store Closure Banner Component
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

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0" />
          <div className="text-center">
            <h3 className="font-semibold text-lg">
              {translations.temporarilyClosed || 'Temporarily Closed'}
            </h3>
            {storeData.closureMessage && (
              <p className="mt-1 opacity-90">{storeData.closureMessage}</p>
            )}
            {reopeningText && (
              <p className="mt-1 text-sm opacity-80">
                {translations.expectedReopen || 'Expected to reopen:'} {reopeningText}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced Address Input with Autocomplete
 // @ts-ignore
 function AddressAutocomplete({ 
    value, 
    onChange, 
    placeholder, 
    required, 
    primaryColor,
    onLocationChange 
  }: {
    value: string
    onChange: (address: string) => void
    placeholder: string
    required: boolean
    primaryColor: string
    onLocationChange?: (lat: number, lng: number) => void
  }) {
    const inputRef = useRef<HTMLInputElement>(null)
    const { isLoaded, initAutocomplete } = useGooglePlaces()
    
    useEffect(() => {
      if (isLoaded) {
        initAutocomplete(inputRef, (address: string, placeData: any) => {
          onChange(address)
          // Extract coordinates if available
          if (placeData?.geometry?.location && onLocationChange) {
            const lat = placeData.geometry.location.lat()
            const lng = placeData.geometry.location.lng()
            onLocationChange(lat, lng)
          }
        })
      }
    }, [isLoaded, onChange, onLocationChange])
  
    return (
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
    )
  }

function StoreLocationMap({ storeData, primaryColor, translations }: { 
    storeData: any, 
    primaryColor: string, 
    translations: any 
  }) {
    return (
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div className="flex items-start">
          <MapPin className="w-5 h-5 mt-1 mr-3 flex-shrink-0" style={{ color: primaryColor }} />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 mb-2">
              {translations.pickupLocation || 'Pickup Location'}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {storeData.address}
            </p>
            
            {/* Mini map placeholder */}
            <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
              <div className="text-center">
                <MapPin className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                <p className="text-xs text-gray-500">{translations.mapView || 'Map View'}</p>
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              {translations.pickupInstructions || 'Please come to this location to collect your order.'}
            </p>
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
                : 'text-gray-700 border-gray-200 hover:border-gray-300'
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
                : 'text-gray-700 border-gray-200 hover:border-gray-300'
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
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
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
                  <span>{selectedTime && timeMode === 'schedule' ? 
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
function DeliveryTypeSwitcher({
    // @ts-ignore
  deliveryType,
    // @ts-ignore
  setDeliveryType,
    // @ts-ignore
  deliveryOptions,
    // @ts-ignore
  primaryColor,
    // @ts-ignore
  disabled = false
}) {
  if (deliveryOptions.length <= 1) return null

  return (
    <div className="inline-flex bg-gray-100 p-1 rounded-full">
        {/* @ts-ignore */}
      {deliveryOptions.slice(0, 2).map(option => {
        const IconComponent = option.icon
        return (
          <button
            key={option.key}
            onClick={() => !disabled && setDeliveryType(option.key)}
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
}

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'USD': return '$'
    case 'EUR': return '€'
    case 'ALL': return 'L'
    default: return '$'
  }
}

export default function StoreFront({ storeData }: { storeData: StoreData }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCartModal, setShowCartModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedModifiers, setSelectedModifiers] = useState<ProductModifier[]>([])
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup' | 'dineIn'>('delivery')
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

  const currencySymbol = getCurrencySymbol(storeData.currency)
  const translations = getStorefrontTranslations(storeData.language)
  const primaryColor = storeData.primaryColor || '#0D9488'

  // Calculate cart totals
  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const cartDeliveryFee = deliveryType === 'delivery' ? storeData.deliveryFee : 0
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

  const openProductModal = (product: Product) => {
    if (storeData.isTemporarilyClosed) return
    setSelectedProduct(product)
    setSelectedVariant(product.variants.length > 0 ? product.variants[0] : null)
    setSelectedModifiers([])
    setShowProductModal(true)
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
          if (newQuantity === 0) return null
          return {
            ...item,
            quantity: newQuantity,
            totalPrice: newQuantity * (item.price + item.modifiers.reduce((sum, mod) => sum + mod.price, 0))
          }
        }
        return item
      }).filter(Boolean) as CartItem[]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  const submitOrder = async () => {
    if (storeData.isTemporarilyClosed) {
         // @ts-ignore
      alert(translations.storeTemporarilyClosed || 'Store is temporarily closed')
      return
    }

    if (!customerInfo.name || !customerInfo.phone) {
      alert('Please fill in required customer information')
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

  const getDeliveryOptions = () => {
    const options = []
    if (storeData.deliveryEnabled) options.push({ key: 'delivery', label: translations.delivery, icon: Package })
    if (storeData.pickupEnabled) options.push({ key: 'pickup', label: translations.pickup, icon: Store })
    if (storeData.dineInEnabled) options.push({ key: 'dineIn', label: translations.dineIn, icon: UtensilsCrossed })
    console.log('getDeliveryOptions', options);
        return options
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: storeData.fontFamily }}>
      {/* Store Closure Banner */}
      <StoreClosure 
        storeData={storeData} 
        primaryColor={primaryColor} 
        translations={translations} 
      />


{/* Header Section */}
<div className="bg-white">
  <div className="max-w-6xl mx-auto">
    {/* Cover Image Section */}
    <div 
      className="relative h-[250px] md:rounded-xl overflow-hidden"
      style={{ 
        background: storeData.coverImage 
          ? `linear-gradient(135deg, ${primaryColor}CC, ${primaryColor}99), url(${storeData.coverImage})` 
          : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}CC)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
     {/* Icons in top right */}
     
{/* Icons in top right */}
<div className="absolute top-5 right-5 flex gap-3">
  <button 
    className="w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all md:bg-white md:bg-opacity-20"
    style={{ backgroundColor: window.innerWidth < 768 ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.25)' }}
  >
    <Share2 className="w-4 h-4 text-white md:text-[var(--primary-color)]" style={{'--primary-color': 'white'} as React.CSSProperties} />
  </button>
  <button 
    className="w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all md:bg-white md:bg-opacity-20"
    style={{ backgroundColor: window.innerWidth < 768 ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.25)' }}
      // @ts-ignore
    onClick={() => document.querySelector('.search-input')?.focus()}
  >
    <Search className="w-4 h-4 text-white md:text-[var(--primary-color)]" style={{'--primary-color': 'white'} as React.CSSProperties} />
  </button>
  <button 
    className="w-10 h-10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all md:bg-white md:bg-opacity-20"
    style={{ backgroundColor: window.innerWidth < 768 ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.25)' }}
  >
    <Info className="w-4 h-4 text-white md:text-[var(--primary-color)]" style={{'--primary-color': 'white'} as React.CSSProperties} />
  </button>
</div>
    </div>

    <div className="bg-white rounded-b-xl p-6 relative">
      {/* Logo */}
      <div 
        className="absolute -top-10 left-8 w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl"
        style={{ 
          backgroundColor: 'white',
          color: primaryColor
        }}
      >
        {storeData.logo ? (
          <img src={storeData.logo} alt={storeData.name} className="w-full h-full rounded-2xl object-cover" />
        ) : (
          storeData.name.charAt(0)
        )}
      </div>

      <div className="pt-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">{storeData.name}</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            storeData.isOpen && !storeData.isTemporarilyClosed
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {storeData.isTemporarilyClosed 
              // @ts-ignore
              ? translations.temporarilyClosed 
              : storeData.isOpen ? translations.open : translations.closed}
          </span>
          
          {/* ADD THE COMPACT SWITCHER HERE - Right side of title */}
           <div className="ml-auto hidden lg:block">
    <DeliveryTypeSwitcher
      deliveryType={deliveryType}
      setDeliveryType={setDeliveryType}
      deliveryOptions={getDeliveryOptions()}
      primaryColor={primaryColor}
      disabled={storeData.isTemporarilyClosed}
    />
  </div>
        </div>
        
        {storeData.description && (
          <p className="text-gray-600 text-lg mb-3">{storeData.description}</p>
        )}
        
        <div className="space-y-2 sm:space-y-0">
          {/* Address - Full width on mobile */}
          {storeData.address && (
            <div className="flex items-center gap-1 text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{storeData.address}</span>
            </div>
          )}
          
          {/* Time and Fee - Dynamic based on delivery type */}
          <div className="flex items-center gap-5 text-gray-600">
            {(deliveryType === 'delivery' ? storeData.estimatedDeliveryTime : storeData.estimatedPickupTime) && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  {deliveryType === 'delivery' 
                    ? storeData.estimatedDeliveryTime 
                    : storeData.estimatedPickupTime || '15-20 min'}
                </span>
              </div>
            )}
            {deliveryType === 'delivery' && storeData.deliveryFee > 0 && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{currencySymbol}{storeData.deliveryFee.toFixed(2)} delivery</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-5 py-6 grid lg:grid-cols-3 gap-8">
        {/* Left Side - Menu */}
        <div className="lg:col-span-2">
          {/* Mobile Delivery Type Switcher (Above Categories) */}
          <div className="lg:hidden mb-6">
            <DeliveryTypeSwitcher
              deliveryType={deliveryType}
              setDeliveryType={setDeliveryType}
              deliveryOptions={getDeliveryOptions()}
              primaryColor={primaryColor}
              disabled={storeData.isTemporarilyClosed}
            />
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-2xl p-0 mb-4 md:mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={translations.search || "Search for dishes, ingredients..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base outline-none focus:border-2 transition-colors"
                style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                disabled={storeData.isTemporarilyClosed}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 mb-6 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              disabled={storeData.isTemporarilyClosed}
              className={`px-5 py-3 font-medium transition-all whitespace-nowrap border-b-2 ${
                selectedCategory === 'all'
                  ? 'border-b-2'
                  : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
              } ${storeData.isTemporarilyClosed ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ 
                color: selectedCategory === 'all' ? primaryColor : undefined,
                borderBottomColor: selectedCategory === 'all' ? primaryColor : 'transparent'
              }}
            >
              {translations.all || 'All'}
            </button>
            {storeData.categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                disabled={storeData.isTemporarilyClosed}
                className={`px-5 py-3 font-medium transition-all whitespace-nowrap border-b-2 ${
                  selectedCategory === category.id
                    ? 'border-b-2'
                    : 'text-gray-600 border-b-2 border-transparent hover:text-gray-900'
                } ${storeData.isTemporarilyClosed ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{ 
                  color: selectedCategory === category.id ? primaryColor : undefined,
                  borderBottomColor: selectedCategory === category.id ? primaryColor : 'transparent'
                }}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {selectedCategory === 'all' ? (
              storeData.categories.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState 
                    type="no-categories"
                    primaryColor={primaryColor}
                    translations={translations}
                  />
                </div>
              ) : storeData.categories.every(category => category.products.length === 0) ? (
                <div className="col-span-full">
                  <EmptyState 
                    type="no-products"
                    primaryColor={primaryColor}
                    translations={translations}
                  />
                </div>
              ) : (
                storeData.categories.flatMap(category => 
                  category.products.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onOpenModal={openProductModal}
                      primaryColor={primaryColor}
                      currencySymbol={currencySymbol}
                      translations={translations}
                      disabled={storeData.isTemporarilyClosed}
                    />
                  ))
                )
              )
            ) : (
              filteredProducts.length === 0 ? (
                <div className="col-span-full">
                  {searchTerm ? (
                    <EmptyState 
                      type="search-empty"
                      primaryColor={primaryColor}
                      translations={translations}
                      onClearSearch={() => setSearchTerm('')}
                      onShowAll={() => setSelectedCategory('all')}
                    />
                  ) : (
                    <EmptyState 
                      type="category-empty"
                      primaryColor={primaryColor}
                      translations={translations}
                      onShowAll={() => setSelectedCategory('all')}
                    />
                  )}
                </div>
              ) : (
                filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onOpenModal={openProductModal}
                    primaryColor={primaryColor}
                    currencySymbol={currencySymbol}
                    translations={translations}
                    disabled={storeData.isTemporarilyClosed}
                  />
                ))
              )
            )}
          </div>
        </div>

        {/* Right Side - Order Panel (Desktop) */}
        <div className="hidden lg:block">
          <OrderPanel 
            storeData={storeData}
            cart={cart}
            deliveryType={deliveryType}
            setDeliveryType={setDeliveryType}
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
          />
        </div>
      </div>

      {/* Mobile Cart Bar */}
      {cartItemCount > 0 && !storeData.isTemporarilyClosed && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl p-4 z-50">
          <button
            onClick={() => setShowCartModal(true)}
            className="w-full py-4 rounded-xl font-semibold text-white flex items-center justify-between shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
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
            <div className="p-4 border-b flex items-center justify-between">
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
                setDeliveryType={setDeliveryType}
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
                isMobile={true}
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
        />
      )}

      {/* Powered by WaveOrder Footer */}
      <footer className="bg-white mt-8">
        <div className="max-w-6xl mx-auto px-5 py-6">
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
      {cartItemCount > 0 && !storeData.isTemporarilyClosed && (
        <div 
          className="lg:hidden fixed bottom-20 right-5 w-15 h-15 rounded-full flex items-center justify-center shadow-xl cursor-pointer z-40"
          style={{ backgroundColor: primaryColor }}
          onClick={() => setShowCartModal(true)}
        >
          <ShoppingCart className="w-6 h-6 text-white" />
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
            {cartItemCount}
          </span>
        </div>
      )}
    </div>
  )
}

// Empty State Component
function EmptyState({ 
  type, 
  primaryColor, 
  translations,
  onClearSearch,
  onShowAll
}: { 
  type: 'no-categories' | 'no-products' | 'category-empty' | 'search-empty'
  primaryColor: string
  translations: any
  onClearSearch?: () => void
  onShowAll?: () => void
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
          icon: AlertCircle,
          title: translations.noProductsFound || 'No products found',
          description: translations.noProductsFoundDescription || 'Try adjusting your search or browse our full menu.',
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

// Product Card Component
function ProductCard({ 
  product, 
  onOpenModal, 
  primaryColor, 
  currencySymbol,
  translations,
  disabled = false
}: { 
  product: Product
  onOpenModal: (product: Product) => void
  primaryColor: string
  currencySymbol: string
  translations: any
  disabled?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden ${
      disabled ? 'opacity-60' : ''
    }`}>
      <div className="flex items-center min-h-[120px]">
        <div className="flex-1 p-5">
          <h3 className="font-semibold text-gray-900 text-lg mb-2">{product.name}</h3>
          {product.description && (
            <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">{product.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl" style={{ color: primaryColor }}>
                {currencySymbol}{product.price.toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-gray-500 line-through text-sm">
                  {currencySymbol}{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            
            <button
              onClick={() => !disabled && onOpenModal(product)}
              disabled={disabled || product.stock === 0}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-transform"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {product.stock <= 5 && product.stock > 0 && (
            <p className="text-orange-600 text-xs mt-2">
              {translations.onlyLeft || 'Only'} {product.stock} {translations.left || 'left'}
            </p>
          )}
          {product.stock === 0 && (
            <p className="text-red-600 text-xs mt-2">{translations.outOfStock || 'Out of stock'}</p>
          )}
        </div>
        
        <div className="w-30 h-30">
          {product.images.length > 0 && (
            <div className="relative w-30 h-30">
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.featured && (
                <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                  {translations.popular || 'Popular'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Product Modal Component
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
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">{product.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {product.images.length > 0 && (
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full h-48 object-cover rounded-2xl mb-4"
              />
            )}
            
            {product.description && (
              <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
            )}

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">{translations.chooseSize || 'Choose Size'}</h3>
                <div className="space-y-3">
                  {product.variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-2 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        borderColor: selectedVariant?.id === variant.id ? primaryColor : undefined
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{variant.name}</span>
                        <span className="font-semibold" style={{ color: primaryColor }}>
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
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">{translations.addExtras || 'Add Extras'}</h3>
                <div className="space-y-3">
                  {product.modifiers.map(modifier => (
                    <button
                      key={modifier.id}
                      onClick={() => toggleModifier(modifier)}
                      className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                        selectedModifiers.find(m => m.id === modifier.id)
                          ? 'border-2 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        borderColor: selectedModifiers.find(m => m.id === modifier.id) ? '#10b981' : undefined
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{modifier.name}</span>
                          {modifier.required && (
                            <span className="text-red-500 text-sm ml-1">({translations.required || 'Required'})</span>
                          )}
                        </div>
                        <span className="font-semibold text-green-600">
                          +{currencySymbol}{modifier.price.toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3">{translations.quantity || 'Quantity'}</h3>
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-2xl font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-full border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold">{translations.total || 'Total'}</span>
            <span className="text-2xl font-bold" style={{ color: primaryColor }}>
              {currencySymbol}{totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleAddToCart}
            className="w-full py-4 rounded-xl text-white font-semibold text-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {translations.addToCart || 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

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
    isMobile = false
  }: {
    storeData: any
    cart: any[]
    deliveryType: 'delivery' | 'pickup' | 'dineIn'
    setDeliveryType: (type: 'delivery' | 'pickup' | 'dineIn') => void
    customerInfo: any
    setCustomerInfo: (info: any) => void
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
    isMobile?: boolean
  }) {
    const [customerLocation, setCustomerLocation] = useState<{lat: number, lng: number} | null>(null)
  
    const handleLocationChange = (lat: number, lng: number) => {
      setCustomerLocation({ lat, lng })
      // Here you could also calculate delivery fee based on distance/zones
    }
  
    return (
      <div className={`${isMobile ? 'p-4' : 'sticky top-8'}`}>
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">{translations.orderDetails || 'Your Order'}</h2>
          
          {/* Desktop Delivery Type Toggle */}
          {!isMobile && deliveryOptions.length > 1 && (
            <div className="mb-6">
              <div className={`grid gap-3 ${deliveryOptions.length === 2 ? 'grid-cols-2' : deliveryOptions.length === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
                {deliveryOptions.map(option => {
                  const IconComponent = option.icon
                  return (
                    <button
                      key={option.key}
                      onClick={() => !storeData.isTemporarilyClosed && setDeliveryType(option.key as any)}
                      disabled={storeData.isTemporarilyClosed}
                      className={`p-4 border-2 rounded-xl text-center transition-all ${
                        deliveryType === option.key
                          ? 'text-white'
                          : 'text-gray-700 border-gray-200 hover:border-gray-300'
                      } ${storeData.isTemporarilyClosed ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{ 
                        backgroundColor: deliveryType === option.key ? primaryColor : 'white',
                        borderColor: deliveryType === option.key ? primaryColor : undefined
                      }}
                    >
                      <IconComponent className="w-5 h-5 mx-auto mb-2" />
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
                disabled={storeData.isTemporarilyClosed}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                onFocus={(e) => !storeData.isTemporarilyClosed && (e.target.style.borderColor = primaryColor)}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                placeholder="Your full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{translations.whatsappNumber || 'WhatsApp Number'} *</label>
              <input
                type="tel"
                required
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                disabled={storeData.isTemporarilyClosed}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                onFocus={(e) => !storeData.isTemporarilyClosed && (e.target.style.borderColor = primaryColor)}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                placeholder="+1234567890"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{translations.email || 'Email'}</label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                disabled={storeData.isTemporarilyClosed}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                onFocus={(e) => !storeData.isTemporarilyClosed && (e.target.style.borderColor = primaryColor)}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                placeholder="your.email@example.com"
              />
            </div>
  
            {/* Conditional Address Fields - Only show for delivery */}
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
                    onLocationChange={handleLocationChange}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{translations.addressLine2 || 'Address Line 2'}</label>
                  <input
                    type="text"
                    value={customerInfo.address2}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address2: e.target.value })}
                    disabled={storeData.isTemporarilyClosed}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
                    onFocus={(e) => !storeData.isTemporarilyClosed && (e.target.style.borderColor = primaryColor)}
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
  
            {/* Enhanced Time Selection with Dynamic Labels */}
            <TimeSelection
              deliveryType={deliveryType}
              selectedTime={customerInfo.deliveryTime}
              onTimeChange={(time) => setCustomerInfo({ ...customerInfo, deliveryTime: time })}
              storeData={storeData}
              primaryColor={primaryColor}
              translations={translations}
            />
          </div>
  
          {/* Rest of the component remains the same - cart items, order summary, etc. */}
          {cart.length > 0 && (
            <div className="border-t pt-6 mb-6">
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
                      <button
                        onClick={() => removeFromCart(item.id)}
                        disabled={storeData.isTemporarilyClosed}
                        className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 text-red-600 ml-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
  
          {/* Order Summary */}
          {cart.length > 0 && (
            <div className="border-t pt-6 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{translations.subtotal || 'Subtotal'}</span>
                  <span>{currencySymbol}{cartSubtotal.toFixed(2)}</span>
                </div>
                {cartDeliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>{deliveryType === 'delivery' ? (translations.deliveryFee || 'Delivery Fee') : (translations.serviceFee || 'Service Fee')}</span>
                    <span>{currencySymbol}{cartDeliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-3">
                  <span>{translations.total || 'Total'}</span>
                  <span style={{ color: primaryColor }}>{currencySymbol}{cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
  
          {/* Minimum Order Warning - Only for delivery */}
          {!meetsMinimumOrder && deliveryType === 'delivery' && !storeData.isTemporarilyClosed && (
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
              disabled={storeData.isTemporarilyClosed}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-2 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ '--focus-border-color': primaryColor } as React.CSSProperties}
              onFocus={(e) => !storeData.isTemporarilyClosed && (e.target.style.borderColor = primaryColor)}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              rows={3}
              placeholder={translations.anySpecialRequests || 'Any special requests...'}
            />
          </div>
  
          {/* Payment Info */}
          {storeData.paymentInstructions && !storeData.isTemporarilyClosed && (
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <div className="flex items-start">
                <Info className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-600">{storeData.paymentInstructions}</p>
              </div>
            </div>
          )}
  
          {/* Order Button */}
          <button
          // @ts-ignore
            onClick={() => submitOrder(customerLocation)}
            disabled={
              isOrderLoading || 
              cart.length === 0 || 
              (deliveryType === 'delivery' && !meetsMinimumOrder) || 
              !customerInfo.name || 
              !customerInfo.phone ||
              storeData.isTemporarilyClosed
            }
            className="w-full py-4 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            {storeData.isTemporarilyClosed
              ? (translations.storeTemporarilyClosed || 'Store Temporarily Closed')
              : isOrderLoading 
                ? (translations.placingOrder || 'Placing Order...') 
                : `${translations.orderViaWhatsapp || 'Order via WhatsApp'} - ${currencySymbol}${cartTotal.toFixed(2)}`
            }
          </button>
  
          <p className="text-xs text-gray-500 text-center mt-3">
            {storeData.isTemporarilyClosed
              ? (translations.storeClosedMessage || 'We apologize for any inconvenience.')
              : (translations.clickingButton || 'By clicking this button, you agree to place your order via WhatsApp.')
            }
          </p>
        </div>
      </div>
    )
}