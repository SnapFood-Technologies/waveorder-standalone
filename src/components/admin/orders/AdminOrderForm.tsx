import React, { useState, useEffect, useRef } from 'react'
import { User, Phone, Mail, MapPin, Tag, FileText, Save, ArrowLeft, Info, AlertCircle, CheckCircle, Globe, Wallet, X, Plus, Search, Calendar, Clock, Package, Truck, ShoppingCart, Calculator, UserCheck } from 'lucide-react'

interface AdminOrderFormProps {
  businessId: string
  preselectedCustomerId?: string | null
  onSuccess?: () => void
  onCancel?: () => void
}

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  tier: 'REGULAR' | 'VIP' | 'WHOLESALE'
  addressJson?: {
    street: string
    additional: string
    zipCode: string
    city: string
    country: string
    latitude?: number
    longitude?: number
  }
  totalOrders: number
}

interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number | null
  stock: number
  images: string[]
  variants?: ProductVariant[]
  modifiers?: ProductModifier[]
}

interface ProductVariant {
  id: string
  name: string
  price: number
  originalPrice?: number | null
  stock: number
}

interface ProductModifier {
  id: string
  name: string
  price: number
  required: boolean
}

interface CartItem {
  productId: string
  variantId?: string
  quantity: number
  price: number
  originalPrice?: number | null
  name: string
  modifiers: string[]
}

interface OrderFormData {
  customerId?: string
  customerType: 'existing' | 'new'
  newCustomer?: {
    name: string
    phone: string
    email: string
    tier: 'REGULAR' | 'VIP' | 'WHOLESALE'
  }
  orderType: 'DELIVERY' | 'PICKUP' | 'DINE_IN'
  deliveryAddress: string
  scheduledTime?: string
  notes: string
  paymentMethod: string
  items: CartItem[]
  addressJson?: {
    street: string
    additional: string
    zipCode: string
    city: string
    country: string
    latitude?: number
    longitude?: number
  }
}

// Country configurations (reusing from CustomerForm)
const COUNTRY_CONFIGS = {
  AL: { prefix: '+355', placeholder: '68 123 4567', pattern: /^(\+355|355)0?[6-9]\d{8}$/, flag: '🇦🇱', name: 'Albania' },
  US: { prefix: '+1', placeholder: '(555) 123-4567', pattern: /^(\+1|1)[2-9]\d{9}$/, flag: '🇺🇸', name: 'United States' },
  GR: { prefix: '+30', placeholder: '694 123 4567', pattern: /^(\+30|30)0?[2-9]\d{9}$/, flag: '🇬🇷', name: 'Greece' },
  IT: { prefix: '+39', placeholder: '345 123 4567', pattern: /^(\+39|39)0?[3]\d{8,9}$/, flag: '🇮🇹', name: 'Italy' },
  ES: { prefix: '+34', placeholder: '612 345 678', pattern: /^(\+34|34)[6-9]\d{8}$/, flag: '🇪🇸', name: 'Spain' }
}

// Google Places Hook (reusing from CustomerForm)
function useGooglePlaces() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  return { isLoaded }
}

// Address Autocomplete Component (simplified version)
function AddressAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  onLocationChange,
  onAddressParsed,
  error
}: {
  value: string
  onChange: (address: string) => void
  placeholder: string
  onLocationChange?: (lat: number, lng: number, address: string) => void
  onAddressParsed?: (parsedAddress: any) => void
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { isLoaded } = useGooglePlaces()
  
  useEffect(() => {
    if (isLoaded && inputRef.current) {
      // @ts-ignore
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address']
      })
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        
        if (place.formatted_address && place.geometry?.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          
          onChange(place.formatted_address)
          
          if (onLocationChange) {
            onLocationChange(lat, lng, place.formatted_address)
          }
          
          if (onAddressParsed) {
            const addressComponents = place.address_components || []
            const parsedAddress = {
              street: place.formatted_address.split(',')[0] || '',
              city: addressComponents.find((c: any) => c.types.includes('locality'))?.long_name || '',
              zipCode: addressComponents.find((c: any) => c.types.includes('postal_code'))?.long_name || '',
              country: addressComponents.find((c: any) => c.types.includes('country'))?.short_name || 'US'
            }
            onAddressParsed(parsedAddress)
          }
        }
      })
    }
  }, [isLoaded, onChange, onLocationChange, onAddressParsed])

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        placeholder={placeholder}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  )
}

// Customer Search Component
function CustomerSearch({ 
  businessId, 
  onCustomerSelect, 
  selectedCustomer 
}: {
  businessId: string
  onCustomerSelect: (customer: Customer | null) => void
  selectedCustomer?: Customer | null
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const fetchCustomers = async () => {
      if (searchTerm.length < 2) {
        setCustomers([])
        return
      }
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/customers?search=${searchTerm}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setCustomers(data.customers)
        }
      } catch (error) {
        console.error('Error fetching customers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchCustomers, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, businessId])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={selectedCustomer ? selectedCustomer.name : searchTerm}
          onChange={(e) => {
            if (selectedCustomer) {
              onCustomerSelect(null)
            }
            setSearchTerm(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500"
          placeholder="Search by name, phone, or email..."
        />
        {selectedCustomer && (
          <button
            onClick={() => {
              onCustomerSelect(null)
              setSearchTerm('')
            }}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showDropdown && !selectedCustomer && (searchTerm.length >= 2) && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 mt-1 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-teal-500 mx-auto"></div>
            </div>
          ) : customers.length > 0 ? (
            customers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => {
                  onCustomerSelect(customer)
                  setShowDropdown(false)
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{customer.name}</div>
                <div className="text-sm text-gray-600">{customer.phone}</div>
                <div className="text-xs text-gray-500">
                  {customer.tier} • {customer.totalOrders} orders
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No customers found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Product Search Component
function ProductSearch({ 
  businessId, 
  onAddToCart,
  formatCurrency 
}: {
  businessId: string
  onAddToCart: (item: CartItem) => void
  formatCurrency: (amount: number) => string  // Add this
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      if (searchTerm.length < 2) {
        setProducts([])
        return
      }
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/products?search=${searchTerm}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products)
        }
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchProducts, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, businessId])

  const handleAddToCart = () => {
    if (!selectedProduct) return

    const basePrice = selectedVariant ? selectedVariant.price : selectedProduct.price
    const baseOriginalPrice = selectedVariant ? selectedVariant.originalPrice : selectedProduct.originalPrice
    const modifierPrices = selectedModifiers.reduce((sum, modifierId) => {
      const modifier = selectedProduct.modifiers?.find(m => m.id === modifierId)
      return sum + (modifier?.price || 0)
    }, 0)

    const cartItem: CartItem = {
      productId: selectedProduct.id,
      variantId: selectedVariant?.id,
      quantity,
      price: (basePrice + modifierPrices) * quantity,
      originalPrice: baseOriginalPrice ? (baseOriginalPrice + modifierPrices) * quantity : null,
      name: selectedVariant ? `${selectedProduct.name} - ${selectedVariant.name}` : selectedProduct.name,
      modifiers: selectedModifiers
    }

    onAddToCart(cartItem)
    
    // Reset form
    setSelectedProduct(null)
    setSelectedVariant(null)
    setQuantity(1)
    setSelectedModifiers([])
    setSearchTerm('')
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500"
          placeholder="Search products..."
        />
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-teal-500 mx-auto"></div>
        </div>
      )}

      {products.length > 0 && !selectedProduct && (
        <div className="grid gap-2 max-h-60 overflow-y-auto">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              {product.images[0] && (
                <img 
                  src={product.images[0]} 
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(product.price)}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <>
                      <span className="text-xs text-gray-500 line-through ml-2">
                        {formatCurrency(product.originalPrice)}
                      </span>
                      <span className="text-xs text-green-600 font-medium ml-2">
                        -{formatCurrency(product.originalPrice - product.price)}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500">Stock: {product.stock}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedProduct && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            {selectedProduct.images[0] && (
              <img 
                src={selectedProduct.images[0]} 
                alt={selectedProduct.name}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div>
              <h3 className="font-medium">{selectedProduct.name}</h3>
              <p className="text-sm text-gray-600">
                {formatCurrency(selectedProduct.price)}
                {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                  <>
                    <span className="text-xs text-gray-500 line-through ml-2">
                      {formatCurrency(selectedProduct.originalPrice)}
                    </span>
                    <span className="text-xs text-green-600 font-medium ml-2">
                      -{formatCurrency(selectedProduct.originalPrice - selectedProduct.price)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {selectedProduct.variants && selectedProduct.variants.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variant
              </label>
              <select
                value={selectedVariant?.id || ''}
                onChange={(e) => {
                  const variant = selectedProduct.variants?.find(v => v.id === e.target.value)
                  setSelectedVariant(variant || null)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select variant</option>
                {selectedProduct.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} - {formatCurrency(variant.price)}
                    {variant.originalPrice && variant.originalPrice > variant.price ? ` (was ${formatCurrency(variant.originalPrice)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedProduct.modifiers && selectedProduct.modifiers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modifiers
              </label>
              <div className="space-y-2">
                {selectedProduct.modifiers.map((modifier) => (
                  <label key={modifier.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedModifiers.includes(modifier.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedModifiers([...selectedModifiers, modifier.id])
                        } else {
                          setSelectedModifiers(selectedModifiers.filter(id => id !== modifier.id))
                        }
                      }}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm">
                    {modifier.name} (+{formatCurrency(modifier.price)})
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Order
            </button>
            <button
              onClick={() => {
                setSelectedProduct(null)
                setSelectedVariant(null)
                setQuantity(1)
                setSelectedModifiers([])
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminOrderForm({ 
    businessId, 
    preselectedCustomerId,
    onSuccess, 
    onCancel 
  }: AdminOrderFormProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    customerType: 'existing',
    orderType: 'DELIVERY',
    deliveryAddress: '',
    notes: '',
    paymentMethod: 'CASH',
    items: []
  })

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [storeData, setStoreData] = useState<any>({})
  const [business, setBusiness] = useState<{ currency: string }>({ currency: 'USD' })
  const [errors, setErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [isCalculatingFee, setIsCalculatingFee] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Format currency function
  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L',
    }
    
    const symbol = currencySymbols[business.currency] || business.currency
    return `${symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  // Fetch store data
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setStoreData(data.business)
          setBusiness({ currency: data.business.currency || 'USD' })
        }
      } catch (error) {
        console.error('Error fetching store data:', error)
      }
    }
    
    fetchStoreData()
  }, [businessId])

  // Fetch preselected customer
  useEffect(() => {
    const fetchPreselectedCustomer = async () => {
      if (!preselectedCustomerId) return
      
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/customers/${preselectedCustomerId}`)
        if (response.ok) {
          const data = await response.json()
          const customer = data.customer
          
          // Set the customer as selected
          setSelectedCustomer({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            tier: customer.tier,
            addressJson: customer.addressJson,
            totalOrders: customer._count?.orders || 0
          })
          
          // Set form to existing customer mode
          setFormData(prev => ({
            ...prev,
            customerType: 'existing',
            customerId: customer.id
          }))
          
          // If customer has an address, prefill delivery address
          if (customer.addressJson?.street) {
            const addressParts = [
              customer.addressJson.street,
              customer.addressJson.additional,
              customer.addressJson.city,
              customer.addressJson.zipCode,
              customer.addressJson.country
            ].filter(Boolean)
            
            setFormData(prev => ({
              ...prev,
              deliveryAddress: addressParts.join(', '),
              addressJson: customer.addressJson
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching preselected customer:', error)
      }
    }
    
    fetchPreselectedCustomer()
  }, [preselectedCustomerId, businessId])

  const calculateDeliveryFee = async (lat: number, lng: number) => {
    if (!storeData.storeLatitude || !storeData.storeLongitude) return

    setIsCalculatingFee(true)
    try {
      const response = await fetch('/api/calculate-delivery-fee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId,
          customerLat: lat,
          customerLng: lng,
          storeLatitude: storeData.storeLatitude,
          storeLongitude: storeData.storeLongitude
        })
      })

      if (response.ok) {
        const data = await response.json()
        setDeliveryFee(data.deliveryFee)
      }
    } catch (error) {
      console.error('Error calculating delivery fee:', error)
    } finally {
      setIsCalculatingFee(false)
    }
  }

  const handleLocationChange = (lat: number, lng: number, address: string) => {
    if (formData.orderType === 'DELIVERY') {
      calculateDeliveryFee(lat, lng)
    }
  }

  const handleAddToCart = (item: CartItem) => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, item]
    }))
  }

  const removeFromCart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.price, 0)
    const deliveryFeeAmount = formData.orderType === 'DELIVERY' ? deliveryFee : 0
    return {
      subtotal,
      deliveryFee: deliveryFeeAmount,
      total: subtotal + deliveryFeeAmount
    }
  }

  const validateForm = () => {
    const newErrors: any = {}

    if (formData.customerType === 'existing' && !selectedCustomer) {
      newErrors.customer = 'Please select a customer'
    }

    if (formData.customerType === 'new') {
      if (!formData.newCustomer?.name) newErrors.newCustomerName = 'Name is required'
      if (!formData.newCustomer?.phone) newErrors.newCustomerPhone = 'Phone is required'
    }

    if (formData.orderType === 'DELIVERY' && !formData.deliveryAddress) {
      newErrors.deliveryAddress = 'Delivery address is required'
    }

    if (formData.items.length === 0) {
      newErrors.items = 'Please add at least one item to the order'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const orderData = {
        customerId: formData.customerType === 'existing' ? selectedCustomer?.id : undefined,
        newCustomer: formData.customerType === 'new' ? formData.newCustomer : undefined,
        orderType: formData.orderType,
        deliveryAddress: formData.orderType === 'DELIVERY' ? formData.deliveryAddress : null,
        scheduledTime: formData.scheduledTime || null,
        notes: formData.notes || null,
        paymentMethod: formData.paymentMethod,
        items: formData.items,
        addressJson: formData.addressJson || null,
        deliveryFee: formData.orderType === 'DELIVERY' ? deliveryFee : 0
      }

      const response = await fetch(`/api/admin/stores/${businessId}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const data = await response.json()
        setSuccessMessage(`Order #${data.order.orderNumber} created successfully!`)
        
        // Clear success message after 3 seconds and redirect
        setTimeout(() => {
          setSuccessMessage(null)
          onSuccess?.()
        }, 3000)
      } else {
        const data = await response.json()
        setErrors({ submit: data.message || 'Failed to create order' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = calculateTotal()

  return (
    <div className="max-w-8xl mx-auto">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <div className="text-sm text-green-700">{successMessage}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - 2/3 width */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Create New Order</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Create an order for existing or new customer
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Customer Selection */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-teal-600" />
                  Customer Information
                </h2>

                <div className="space-y-4">
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="customerType"
                        value="existing"
                        checked={formData.customerType === 'existing'}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerType: e.target.value as any }))}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="ml-2">Existing Customer</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="customerType"
                        value="new"
                        checked={formData.customerType === 'new'}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerType: e.target.value as any }))}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="ml-2">New Customer</span>
                    </label>
                  </div>

                  {formData.customerType === 'existing' ? (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Search Customer
    </label>
    <CustomerSearch
      businessId={businessId}
      onCustomerSelect={setSelectedCustomer}
      selectedCustomer={selectedCustomer}
    />
    {errors.customer && <p className="text-red-600 text-sm mt-1">{errors.customer}</p>}
    
    {selectedCustomer && (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="font-medium">{selectedCustomer.name}</h3>
            <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
            <p className="text-xs text-gray-500">
              {selectedCustomer.tier} Customer • {selectedCustomer.totalOrders} Previous Orders
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Customer Name *
      </label>
      <input
        type="text"
        value={formData.newCustomer?.name || ''}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          newCustomer: { ...prev.newCustomer, name: e.target.value, phone: prev.newCustomer?.phone || '', email: prev.newCustomer?.email || '', tier: prev.newCustomer?.tier || 'REGULAR' }
        }))}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500 ${
          errors.newCustomerName ? 'border-red-300' : 'border-gray-300'
        }`}
        placeholder="Enter customer name"
      />
      {errors.newCustomerName && <p className="text-red-600 text-sm mt-1">{errors.newCustomerName}</p>}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Phone Number *
      </label>
      <input
        type="tel"
        value={formData.newCustomer?.phone || ''}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          newCustomer: { ...prev.newCustomer, phone: e.target.value, name: prev.newCustomer?.name || '', email: prev.newCustomer?.email || '', tier: prev.newCustomer?.tier || 'REGULAR' }
        }))}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500 ${
          errors.newCustomerPhone ? 'border-red-300' : 'border-gray-300'
        }`}
        placeholder="Enter phone number"
      />
      {errors.newCustomerPhone && <p className="text-red-600 text-sm mt-1">{errors.newCustomerPhone}</p>}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email (Optional)
      </label>
      <input
        type="email"
        value={formData.newCustomer?.email || ''}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          newCustomer: { ...prev.newCustomer, email: e.target.value, name: prev.newCustomer?.name || '', phone: prev.newCustomer?.phone || '', tier: prev.newCustomer?.tier || 'REGULAR' }
        }))}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500"
        placeholder="customer@example.com"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Customer Tier
      </label>
      <select
        value={formData.newCustomer?.tier || 'REGULAR'}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          newCustomer: { ...prev.newCustomer, tier: e.target.value as any, name: prev.newCustomer?.name || '', phone: prev.newCustomer?.phone || '', email: prev.newCustomer?.email || '' }
        }))}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
      >
        <option value="REGULAR">Regular Customer</option>
        <option value="VIP">VIP Customer</option>
        <option value="WHOLESALE">Wholesale Customer</option>
      </select>
    </div>
  </div>
)}
              </div>
            </div>

            {/* Order Type */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-teal-600" />
                Order Type & Delivery
              </h2>

              <div className="space-y-4">
                <div className="flex gap-4">
                  {storeData.deliveryEnabled && (
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="orderType"
                        value="DELIVERY"
                        checked={formData.orderType === 'DELIVERY'}
                        onChange={(e) => setFormData(prev => ({ ...prev, orderType: e.target.value as any }))}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="ml-2">Delivery</span>
                    </label>
                  )}
                  {storeData.pickupEnabled && (
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="orderType"
                        value="PICKUP"
                        checked={formData.orderType === 'PICKUP'}
                        onChange={(e) => setFormData(prev => ({ ...prev, orderType: e.target.value as any }))}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="ml-2">Pickup</span>
                    </label>
                  )}
                  {storeData.dineInEnabled && (
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="orderType"
                        value="DINE_IN"
                        checked={formData.orderType === 'DINE_IN'}
                        onChange={(e) => setFormData(prev => ({ ...prev, orderType: e.target.value as any }))}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="ml-2">Dine In</span>
                    </label>
                  )}
                </div>

                {formData.orderType === 'DELIVERY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address *
                    </label>
                    <AddressAutocomplete
                      value={formData.deliveryAddress}
                      onChange={(address) => setFormData(prev => ({ ...prev, deliveryAddress: address }))}
                      placeholder="Enter delivery address..."
                      onLocationChange={handleLocationChange}
                      onAddressParsed={(parsed) => setFormData(prev => ({ 
                        ...prev, 
                        addressJson: {
                          street: parsed.street,
                          additional: '',
                          city: parsed.city,
                          zipCode: parsed.zipCode,
                          country: parsed.country
                        }
                      }))}
                      error={errors.deliveryAddress}
                    />
                    {isCalculatingFee && (
                      <div className="mt-2 text-sm text-gray-600 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-teal-500 mr-2"></div>
                        Calculating delivery fee...
                      </div>
                    )}
                    {deliveryFee > 0 && (
                      <div className="mt-2 text-sm text-green-600">
                        Delivery fee: {formatCurrency(deliveryFee)}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledTime || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ShoppingCart className="w-5 h-5 mr-2 text-teal-600" />
                Order Items
              </h2>

              <ProductSearch
                businessId={businessId}
                onAddToCart={handleAddToCart}
                formatCurrency={formatCurrency}  // Add this
              />

              {errors.items && <p className="text-red-600 text-sm mt-2">{errors.items}</p>}
            </div>

            {/* Payment & Notes */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Wallet className="w-5 h-5 mr-2 text-teal-600" />
                Payment & Notes
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="CASH">Cash</option>
                    {/* <option value="BANK_TRANSFER">Bank Transfer</option> */}
                    {/* <option value="STRIPE">Credit Card</option> */}
                    {/* <option value="PAYPAL">PayPal</option> */}
                    {/* <option value="BKT">BKT</option> */}
                    {/* <option value="MOBILE_WALLET">Mobile Wallet</option> */}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500"
                    placeholder="Special instructions, allergies, preferences..."
                  />
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || formData.items.length === 0}
                className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'Creating Order...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Order Summary - 1/3 width */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2 text-blue-600" />
            Order Summary
          </h3>

          {formData.items.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      {item.modifiers.length > 0 && (
                        <p className="text-xs text-gray-500">+ {item.modifiers.length} modifiers</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.price)}
                        {item.originalPrice && item.originalPrice > item.price && (
                          <>
                            <span className="text-xs text-gray-500 line-through ml-2">
                              {formatCurrency(item.originalPrice)}
                            </span>
                            <span className="text-xs text-green-600 font-medium ml-2">
                              -{formatCurrency(item.originalPrice - item.price)}
                            </span>
                          </>
                        )}
                      </p>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">{formatCurrency(totals.subtotal)}</span>
                </div>
                
                {formData.orderType === 'DELIVERY' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="text-gray-900">{formatCurrency(totals.deliveryFee)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-teal-600">{formatCurrency(totals.total)}</span>
                </div>
              </div>

              {(() => {
  if (storeData.minimumOrder && storeData.minimumOrder > 0 && totals.subtotal < storeData.minimumOrder) {
    return (
      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          Minimum order: {formatCurrency(storeData.minimumOrder)}
          <br />
          Add {formatCurrency(storeData.minimumOrder - totals.subtotal)} more
        </p>
      </div>
    );
  } else {
    return null;
  }
})()}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No items added yet</p>
              <p className="text-gray-400 text-xs">Search and add products above</p>
            </div>
          )}

          {/* Order Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Order Details</h4>
            
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium">{formData.orderType}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="font-medium">{formData.paymentMethod}</span>
              </div>
              
              {formData.scheduledTime && (
                <div className="flex justify-between">
                  <span>Scheduled:</span>
                  <span className="font-medium">
                    {(() => {
                      const date = new Date(formData.scheduledTime)
                      const timeFormat = storeData.timeFormat || '24'
                      const use24Hour = timeFormat === '24'
                      
                      if (use24Hour) {
                        return date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) + ' at ' + date.toTimeString().slice(0, 5)
                      } else {
                        return date.toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })
                      }
                    })()}
                  </span>
                </div>
              )}
              
              {formData.orderType === 'DELIVERY' && storeData.estimatedDeliveryTime && (
                <div className="flex justify-between">
                  <span>Est. Delivery:</span>
                  <span className="font-medium">{storeData.estimatedDeliveryTime}</span>
                </div>
              )}
              
              {formData.orderType === 'PICKUP' && storeData.estimatedPickupTime && (
                <div className="flex justify-between">
                  <span>Est. Pickup:</span>
                  <span className="font-medium">{storeData.estimatedPickupTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-800 mb-2 flex items-center">
              <Info className="w-3 h-3 mr-1" />
              Quick Tips
            </h4>
            <ul className="space-y-1 text-xs text-gray-600">
              <li>• Orders are automatically set to PENDING status</li>
              {/* <li>• WhatsApp notifications will be sent to customer</li> */}
              <li>• Stock levels will be updated automatically</li>
              <li>• Admin orders bypass minimum order requirements</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}