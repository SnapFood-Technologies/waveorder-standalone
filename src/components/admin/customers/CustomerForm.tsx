import React, { useState, useEffect, useRef } from 'react'
import { User, Phone, Mail, MapPin, Tag, FileText, Save, ArrowLeft, Info } from 'lucide-react'

interface CustomerFormProps {
  businessId: string
  onSuccess?: () => void
  onCancel?: () => void
}

interface CustomerFormData {
  name: string
  phone: string
  email: string
  tier: 'REGULAR' | 'VIP' | 'WHOLESALE'
  addressJson: {
    street: string
    additional: string
    zipCode: string
    city: string
    country: string
    latitude?: number
    longitude?: number
  }
  tags: string[]
  notes: string
  addedByAdmin: boolean
}

interface ValidationErrors {
  name?: string
  phone?: string
  email?: string
  street?: string
  city?: string
  zipCode?: string
}

export default function CustomerForm({ businessId, onSuccess, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    tier: 'REGULAR',
    addressJson: {
      street: '',
      additional: '',
      zipCode: '',
      city: '',
      country: 'USA'
    },
    tags: [],
    notes: '',
    addedByAdmin: true
  })

  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTag, setCurrentTag] = useState('')
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const addressInputRef = useRef<HTMLInputElement>(null)

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long'
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    // Email validation (optional but if provided, must be valid)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Address validation (optional but if provided, must be complete)
    if (formData.addressJson.street.trim()) {
      if (!formData.addressJson.city.trim()) {
        newErrors.city = 'City is required when address is provided'
      }
      if (!formData.addressJson.zipCode.trim()) {
        newErrors.zipCode = 'ZIP code is required when address is provided'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone.trim(),
          email: formData.email.trim() || null,
          addressJson: formData.addressJson.street.trim() ? formData.addressJson : null
        }),
      })

      if (response.ok) {
        onSuccess?.()
      } else {
        const data = await response.json()
        if (data.message?.includes('phone')) {
          setErrors({ phone: 'A customer with this phone number already exists' })
        } else {
          setErrors({ name: data.message || 'Failed to create customer' })
        }
      }
    } catch (error) {
      setErrors({ name: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddressSearch = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Mock address suggestions - In real app, use Google Places API
    const mockSuggestions = [
      {
        description: `${query} Street, New York, NY 10001`,
        structured_formatting: {
          main_text: `${query} Street`,
          secondary_text: 'New York, NY 10001'
        },
        geometry: { location: { lat: 40.7128, lng: -74.0060 } }
      },
      {
        description: `${query} Avenue, Brooklyn, NY 11201`,
        structured_formatting: {
          main_text: `${query} Avenue`,
          secondary_text: 'Brooklyn, NY 11201'
        },
        geometry: { location: { lat: 40.6892, lng: -73.9442 } }
      }
    ]

    setAddressSuggestions(mockSuggestions)
    setShowSuggestions(true)
  }

  const handleAddressSelect = (suggestion: any) => {
    const parts = suggestion.description.split(', ')
    setFormData(prev => ({
      ...prev,
      addressJson: {
        ...prev.addressJson,
        street: suggestion.structured_formatting.main_text,
        city: parts[parts.length - 2]?.split(' ')[0] || '',
        zipCode: parts[parts.length - 1]?.match(/\d{5}/)?.[0] || '',
        latitude: suggestion.geometry?.location?.lat,
        longitude: suggestion.geometry?.location?.lng
      }
    }))
    setShowSuggestions(false)
  }

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim().toLowerCase()]
      }))
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
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
                <h1 className="text-xl font-semibold text-gray-900">Add New Customer</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Create a new customer profile for your store
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-teal-600" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter customer's full name"
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Phone number must be unique per store
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="customer@example.com"
                  />
                </div>
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Optional - for order confirmations and marketing
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Tier
                </label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="REGULAR">Regular Customer</option>
                  <option value="VIP">VIP Customer</option>
                  <option value="WHOLESALE">Wholesale Customer</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Tier affects pricing and special offers
                </p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-teal-600" />
              Address Information
              <div className="ml-2 group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Address is optional but helps with delivery orders
                </div>
              </div>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <div className="relative">
                  <input
                    ref={addressInputRef}
                    type="text"
                    value={formData.addressJson.street}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        addressJson: { ...prev.addressJson, street: e.target.value }
                      }))
                      handleAddressSearch(e.target.value)
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                      errors.street ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Start typing street address..."
                  />
                  
                  {/* Address Suggestions */}
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleAddressSelect(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {suggestion.structured_formatting.main_text}
                          </div>
                          <div className="text-sm text-gray-600">
                            {suggestion.structured_formatting.secondary_text}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Details
                </label>
                <input
                  type="text"
                  value={formData.addressJson.additional}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    addressJson: { ...prev.addressJson, additional: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.addressJson.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    addressJson: { ...prev.addressJson, city: e.target.value }
                  }))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                    errors.city ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter city"
                />
                {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.addressJson.zipCode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    addressJson: { ...prev.addressJson, zipCode: e.target.value }
                  }))}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 ${
                    errors.zipCode ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="12345"
                />
                {errors.zipCode && <p className="text-red-600 text-sm mt-1">{errors.zipCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  value={formData.addressJson.country}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    addressJson: { ...prev.addressJson, country: e.target.value }
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="USA">United States</option>
                  <option value="CAN">Canada</option>
                  <option value="ALB">Albania</option>
                  <option value="GBR">United Kingdom</option>
                  <option value="DEU">Germany</option>
                  <option value="FRA">France</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tags and Notes */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2 text-teal-600" />
              Additional Information
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-teal-600 hover:text-teal-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Add tags like 'vip', 'frequent', 'wholesale'..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tags help organize and filter customers
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Add any special notes about this customer..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Internal notes - not visible to customer
                </p>
              </div>
            </div>
          </div>

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
              type="button"
              onClick={(e) => {
                e.preventDefault()
                handleSubmit(e as any)
              }}
              disabled={isSubmitting}
              className="flex items-center px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSubmitting ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}