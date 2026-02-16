import React, { useState, useEffect } from 'react'
import { User, Phone, Mail, Calendar, Clock, Scissors, Plus, X, Search, Save, ArrowLeft, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { format } from 'date-fns'

interface AdminAppointmentFormProps {
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
  totalOrders: number
}

interface Service {
  id: string
  name: string
  price: number
  originalPrice?: number | null
  images: string[]
  serviceDuration?: number | null
  staffIds: string[]
}

interface TeamMember {
  id: string
  userId: string
  name: string
  email: string
  role: string
}

interface CartItem {
  serviceId: string
  quantity: number
  price: number
  originalPrice?: number | null
  name: string
  duration: number
}

interface AppointmentFormData {
  customerId?: string
  customerType: 'existing' | 'new'
  newCustomer?: {
    name: string
    phone: string
    email: string
    tier: 'REGULAR' | 'VIP' | 'WHOLESALE'
  }
  services: CartItem[]
  appointmentDate: string
  appointmentTime: string
  staffId?: string
  notes: string
  paymentMethod: string
  status: 'REQUESTED' | 'CONFIRMED'
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
                  {customer.tier} • {customer.totalOrders} appointments
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

// Service Search Component
function ServiceSearch({ 
  businessId, 
  onAddToCart,
  formatCurrency 
}: {
  businessId: string
  onAddToCart: (item: CartItem) => void
  formatCurrency: (amount: number) => string
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const fetchServices = async () => {
      if (searchTerm.length < 2) {
        setServices([])
        return
      }
      
      setIsLoading(true)
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/services?search=${searchTerm}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setServices(data.services || [])
        }
      } catch (error) {
        console.error('Error fetching services:', error)
      } finally {
        setIsLoading(false)
      }
    }

    const debounceTimer = setTimeout(fetchServices, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm, businessId])

  const handleAddToCart = () => {
    if (!selectedService) return

    const cartItem: CartItem = {
      serviceId: selectedService.id,
      quantity,
      price: selectedService.price * quantity,
      originalPrice: selectedService.originalPrice ? selectedService.originalPrice * quantity : null,
      name: selectedService.name,
      duration: (selectedService.serviceDuration || 0) * quantity
    }

    onAddToCart(cartItem)
    
    // Reset form
    setSelectedService(null)
    setQuantity(1)
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
          placeholder="Search services..."
        />
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-teal-500 mx-auto"></div>
        </div>
      )}

      {services.length > 0 && !selectedService && (
        <div className="grid gap-2 max-h-60 overflow-y-auto">
          {services.map((service) => (
            <button
              key={service.id}
              onClick={() => setSelectedService(service)}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              {service.images[0] && (
                <img 
                  src={service.images[0]} 
                  alt={service.name}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <div className="font-medium">{service.name}</div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(service.price)}
                  {service.originalPrice && service.originalPrice > service.price && (
                    <>
                      <span className="text-xs text-gray-500 line-through ml-2">
                        {formatCurrency(service.originalPrice)}
                      </span>
                    </>
                  )}
                </div>
                {service.serviceDuration && (
                  <div className="text-xs text-gray-500">
                    Duration: {service.serviceDuration} min
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedService && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            {selectedService.images[0] && (
              <img 
                src={selectedService.images[0]} 
                alt={selectedService.name}
                className="w-16 h-16 object-cover rounded"
              />
            )}
            <div>
              <h3 className="font-medium">{selectedService.name}</h3>
              <p className="text-sm text-gray-600">
                {formatCurrency(selectedService.price)}
              </p>
              {selectedService.serviceDuration && (
                <p className="text-xs text-gray-500">
                  Duration: {selectedService.serviceDuration} minutes
                </p>
              )}
            </div>
          </div>

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
              Add Service
            </button>
            <button
              onClick={() => {
                setSelectedService(null)
                setQuantity(1)
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

export default function AdminAppointmentForm({ 
  businessId, 
  preselectedCustomerId,
  onSuccess, 
  onCancel 
}: AdminAppointmentFormProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({
    customerType: 'existing',
    newCustomer: {
      name: '',
      phone: '',
      email: '',
      tier: 'REGULAR'
    },
    services: [],
    appointmentDate: '',
    appointmentTime: '',
    notes: '',
    paymentMethod: 'CASH',
    status: 'REQUESTED'
  })

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [business, setBusiness] = useState<{ currency: string }>({ currency: 'USD' })
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [userPlan, setUserPlan] = useState<'STARTER' | 'PRO' | 'BUSINESS'>('STARTER')
  const [errors, setErrors] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Format currency function
  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      ALL: 'L',
      BHD: 'BD',
      BBD: 'Bds$',
    }
    
    const symbol = currencySymbols[business.currency] || business.currency
    return `${symbol}${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
  }

  // Fetch business data
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}`)
        if (response.ok) {
          const data = await response.json()
          setBusiness({ currency: data.business.currency || 'USD' })
          
          // Get user plan
          const businessOwner = await fetch(`/api/admin/stores/${businessId}/team/members`)
          if (businessOwner.ok) {
            const membersData = await businessOwner.json()
            // Get plan from business owner
            const ownerResponse = await fetch(`/api/admin/stores/${businessId}`)
            if (ownerResponse.ok) {
              const ownerData = await ownerResponse.json()
              // Plan is typically stored on the user, we'll fetch it differently if needed
            }
          }
        }
      } catch (error) {
        console.error('Error fetching business data:', error)
      }
    }
    
    fetchBusinessData()
  }, [businessId])

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch(`/api/admin/stores/${businessId}/team/members`)
        if (response.ok) {
          const data = await response.json()
          setTeamMembers(data.members || [])
        }
      } catch (error) {
        console.error('Error fetching team members:', error)
      }
    }
    
    fetchTeamMembers()
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
          
          setSelectedCustomer({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            tier: customer.tier,
            totalOrders: customer._count?.orders || 0
          })
          
          setFormData(prev => ({
            ...prev,
            customerType: 'existing',
            customerId: customer.id
          }))
        }
      } catch (error) {
        console.error('Error fetching preselected customer:', error)
      }
    }
    
    fetchPreselectedCustomer()
  }, [preselectedCustomerId, businessId])

  const calculateTotal = () => {
    return formData.services.reduce((sum, item) => sum + item.price, 0)
  }

  const calculateTotalDuration = () => {
    return formData.services.reduce((sum, item) => sum + item.duration, 0)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const validateForm = () => {
    const newErrors: any = {}

    if (formData.customerType === 'existing' && !selectedCustomer) {
      newErrors.customer = 'Please select a customer'
    }

    if (formData.customerType === 'new') {
      if (!formData.newCustomer?.name) {
        newErrors.newCustomerName = 'Customer name is required'
      }
      if (!formData.newCustomer?.phone) {
        newErrors.newCustomerPhone = 'Customer phone is required'
      }
    }

    if (formData.services.length === 0) {
      newErrors.services = 'Please add at least one service'
    }

    if (!formData.appointmentDate) {
      newErrors.appointmentDate = 'Appointment date is required'
    }

    if (!formData.appointmentTime) {
      newErrors.appointmentTime = 'Appointment time is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Calculate end time based on total duration
      const [hours, minutes] = formData.appointmentTime.split(':').map(Number)
      const startDateTime = new Date(formData.appointmentDate)
      startDateTime.setHours(hours, minutes, 0, 0)
      
      const totalDuration = calculateTotalDuration()
      const endDateTime = new Date(startDateTime.getTime() + totalDuration * 60000)
      
      const endTime = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`

      const appointmentData = {
        customerId: formData.customerType === 'existing' ? selectedCustomer?.id : undefined,
        newCustomer: formData.customerType === 'new' ? formData.newCustomer : undefined,
        services: formData.services,
        appointmentDate: formData.appointmentDate,
        startTime: formData.appointmentTime,
        endTime: endTime,
        duration: totalDuration,
        staffId: formData.staffId || null,
        notes: formData.notes || null,
        paymentMethod: formData.paymentMethod,
        status: formData.status
      }

      const response = await fetch(`/api/admin/stores/${businessId}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      })

      if (response.ok) {
        const data = await response.json()
        setSuccessMessage(`Appointment created successfully!`)
        
        setTimeout(() => {
          setSuccessMessage(null)
          onSuccess?.()
        }, 3000)
      } else {
        const data = await response.json()
        setErrors({ submit: data.message || 'Failed to create appointment' })
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totals = calculateTotal()
  const totalDuration = calculateTotalDuration()

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
                  <h1 className="text-xl font-semibold text-gray-900">Create New Appointment</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Create a new appointment for a customer
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
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          customerType: e.target.value as any,
                          newCustomer: prev.newCustomer || {
                            name: '',
                            phone: '',
                            email: '',
                            tier: 'REGULAR'
                          }
                        }))}
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
                        onCustomerSelect={(customer) => {
                          setSelectedCustomer(customer)
                          setFormData(prev => ({ ...prev, customerId: customer?.id }))
                        }}
                        selectedCustomer={selectedCustomer}
                      />
                      {errors.customer && (
                        <p className="text-red-600 text-sm mt-1">{errors.customer}</p>
                      )}
                      
                      {selectedCustomer && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-green-600" />
                            <div>
                              <h3 className="font-medium">{selectedCustomer.name}</h3>
                              <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                              <p className="text-xs text-gray-500">
                                {selectedCustomer.tier} Customer • {selectedCustomer.totalOrders} Previous Appointments
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
                            newCustomer: { 
                              ...(prev.newCustomer || { name: '', phone: '', email: '', tier: 'REGULAR' }), 
                              name: e.target.value 
                            }
                          }))}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500 ${
                            errors.newCustomerName ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter customer name"
                        />
                        {errors.newCustomerName && (
                          <p className="text-red-600 text-sm mt-1">{errors.newCustomerName}</p>
                        )}
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
                            newCustomer: { 
                              ...(prev.newCustomer || { name: '', phone: '', email: '', tier: 'REGULAR' }), 
                              phone: e.target.value 
                            }
                          }))}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500 ${
                            errors.newCustomerPhone ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Enter phone number"
                        />
                        {errors.newCustomerPhone && (
                          <p className="text-red-600 text-sm mt-1">{errors.newCustomerPhone}</p>
                        )}
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
                            newCustomer: { 
                              ...(prev.newCustomer || { name: '', phone: '', email: '', tier: 'REGULAR' }), 
                              email: e.target.value 
                            }
                          }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500"
                          placeholder="customer@example.com"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Services Selection */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Scissors className="w-5 h-5 mr-2 text-teal-600" />
                  Services
                </h2>

          <ServiceSearch
            businessId={businessId}
            onAddToCart={(item) => {
              setFormData(prev => ({
                ...prev,
                services: [...prev.services, item]
              }))
            }}
            formatCurrency={formatCurrency}
          />

          {errors.services && (
            <p className="text-red-600 text-sm mt-2">{errors.services}</p>
          )}

          {formData.services.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Services</h3>
              <div className="space-y-2">
                {formData.services.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(item.price)} • {item.duration} min
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          services: prev.services.filter((_, i) => i !== index)
                        }))
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Duration:</span>
                  <span className="font-medium">{formatDuration(totalDuration)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

              {/* Appointment Details */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-teal-600" />
                  Appointment Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={formData.appointmentDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 ${
                        errors.appointmentDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.appointmentDate && (
                      <p className="text-red-600 text-sm mt-1">{errors.appointmentDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time *
                    </label>
                    <input
                      type="time"
                      value={formData.appointmentTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, appointmentTime: e.target.value }))}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 ${
                        errors.appointmentTime ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.appointmentTime && (
                      <p className="text-red-600 text-sm mt-1">{errors.appointmentTime}</p>
                    )}
                  </div>
                </div>

                {teamMembers.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Staff (Optional)
                    </label>
                    <select
                      value={formData.staffId || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, staffId: e.target.value || undefined }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                    >
                      <option value="">No assignment</option>
                      {teamMembers.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.name} ({member.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'REQUESTED' | 'CONFIRMED' }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                  >
                    <option value="REQUESTED">Requested</option>
                    <option value="CONFIRMED">Confirmed</option>
                  </select>
                </div>
              </div>

              {/* Payment & Notes */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-teal-600" />
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                    >
                      <option value="CASH">Cash</option>
                      <option value="CARD">Card</option>
                      <option value="ONLINE">Online</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount
                    </label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-lg font-semibold text-gray-900">
                      {formatCurrency(totals)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder:text-gray-500"
                    placeholder="Any special notes or instructions..."
                  />
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
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Creating...' : 'Create Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
            {/* Appointment Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Summary</h3>
              
              {formData.services.length > 0 ? (
                <div>
                  <div className="space-y-2 mb-4">
                    {formData.services.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium truncate">{item.name}</p>
                          <p className="text-gray-500 text-xs">{item.duration} min</p>
                        </div>
                        <span className="text-gray-900 ml-2">{formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Duration:</span>
                      <span className="text-gray-900">{formatDuration(totalDuration)}</span>
                    </div>
                    
                    <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-teal-600">{formatCurrency(totals)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No services added yet</p>
                  <p className="text-gray-400 text-xs">Search and add services above</p>
                </div>
              )}

              {/* Appointment Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Appointment Details</h4>
                
                <div className="space-y-2 text-xs text-gray-600">
                  {formData.appointmentDate && (
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-medium">
                        {new Date(formData.appointmentDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  
                  {formData.appointmentTime && (
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-medium">{formData.appointmentTime}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">{formData.status}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <span className="font-medium">{formData.paymentMethod}</span>
                  </div>
                  
                  {formData.staffId && teamMembers.find(m => m.userId === formData.staffId) && (
                    <div className="flex justify-between">
                      <span>Staff:</span>
                      <span className="font-medium">
                        {teamMembers.find(m => m.userId === formData.staffId)?.name}
                      </span>
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
                  <li>• Appointments are set to {formData.status} status</li>
                  <li>• Total duration is calculated automatically</li>
                  <li>• Staff assignment is optional</li>
                  <li>• Customer will receive confirmation notification</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
