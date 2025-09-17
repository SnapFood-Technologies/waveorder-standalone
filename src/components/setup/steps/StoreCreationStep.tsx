'use client'

import { useState, useEffect } from 'react'
import { SetupData } from '../Setup'
import { ArrowLeft, Smartphone, Store, Phone, Globe } from 'lucide-react'

interface StoreCreationStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
}

const COUNTRY_CODES = [
  { code: '+355', country: 'AL', flag: '🇦🇱' },
  { code: '+1', country: 'US', flag: '🇺🇸' }
]

export default function StoreCreationStep({ data, onComplete, onBack }: StoreCreationStepProps) {
  const [formData, setFormData] = useState({
    businessName: data.businessName || '',
    countryCode: '+355',
    whatsappNumber: data.whatsappNumber?.replace(/^\+\d+/, '') || '',
    storeSlug: data.storeSlug || ''
  })
  const [loading, setLoading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

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

  // Check slug availability
  useEffect(() => {
    if (formData.storeSlug && formData.storeSlug.length >= 3) {
      const timeoutId = setTimeout(checkSlugAvailability, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setSlugAvailable(null)
    }
  }, [formData.storeSlug])

  const checkSlugAvailability = async () => {
    if (!formData.storeSlug) return
    
    setCheckingSlug(true)
    try {
      const response = await fetch('/api/setup/check-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: formData.storeSlug })
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
      // Clean slug input
      const cleanSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      setFormData(prev => ({ ...prev, [name]: cleanSlug }))
    } else if (name === 'whatsappNumber') {
      // Only allow numbers
      const cleanNumber = value.replace(/[^0-9]/g, '')
      setFormData(prev => ({ ...prev, [name]: cleanNumber }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.businessName || !formData.whatsappNumber || !formData.storeSlug) {
      return
    }
    
    if (slugAvailable === false) {
      return
    }

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    onComplete({
      businessName: formData.businessName,
      whatsappNumber: `${formData.countryCode}${formData.whatsappNumber}`,
      storeSlug: formData.storeSlug
    })
    setLoading(false)
  }

  const fullWhatsAppNumber = `${formData.countryCode}${formData.whatsappNumber}`
  const storeUrl = `waveorder.com/${formData.storeSlug}`

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Left Side - Form */}
        <div>
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Create your store
            </h1>
            <p className="text-lg text-gray-600">
              Set up your basic store information to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Enter your business name"
                />
              </div>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <select
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleInputChange}
                  className="px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                >
                  {COUNTRY_CODES.map(country => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.code}
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
                    className="pl-10 w-full px-3 py-2 border-l-0 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="123456789"
                  />
                </div>
              </div>
            </div>

            {/* Store URL */}
            <div>
              <label htmlFor="storeSlug" className="block text-sm font-medium text-gray-700 mb-1">
                Store URL <span className="text-red-500">*</span>
              </label>
              <div className="flex">
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-lg border-r-0 flex items-center">
                  <Globe className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-gray-600">waveorder.com/</span>
                </div>
                <input
                  id="storeSlug"
                  name="storeSlug"
                  type="text"
                  required
                  value={formData.storeSlug}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              
              <button
                type="submit"
                disabled={loading || !formData.businessName || !formData.whatsappNumber || !formData.storeSlug || slugAvailable === false}
                className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Store'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Side - Live Preview */}
        <div className="lg:sticky lg:top-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-teal-600" />
              Live Preview
            </h3>
            
            {/* Mobile Preview */}
            <div className="bg-gray-100 rounded-xl p-4 max-w-sm mx-auto">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-6 text-white text-center">
                  <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <Store className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-bold">
                    {formData.businessName || 'Your Business Name'}
                  </h2>
                  <p className="text-teal-100 text-sm mt-1">
                    WhatsApp Ordering
                  </p>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="text-center mb-4">
                    <p className="text-gray-600 text-sm">
                      Browse our menu and order via WhatsApp
                    </p>
                  </div>

                  {/* Sample Categories */}
                  <div className="space-y-2">
                    <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-gray-800 font-medium">Appetizers</span>
                      <span className="text-gray-500 text-sm">5 items</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-gray-800 font-medium">Main Courses</span>
                      <span className="text-gray-500 text-sm">12 items</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-gray-800 font-medium">Desserts</span>
                      <span className="text-gray-500 text-sm">6 items</span>
                    </div>
                  </div>

                  {/* WhatsApp Button */}
                  <div className="mt-4">
                    <div className="bg-green-500 text-white rounded-lg p-3 text-center font-medium">
                      Order via WhatsApp
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Store Info */}
            <div className="mt-6 space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">Store URL:</div>
                <div className="font-mono text-sm text-teal-600">
                  {formData.storeSlug ? storeUrl : 'waveorder.com/your-store'}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">WhatsApp Number:</div>
                <div className="font-mono text-sm text-gray-900">
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