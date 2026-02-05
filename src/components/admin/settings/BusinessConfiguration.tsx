// src/components/admin/settings/BusinessConfiguration.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Truck, 
  Clock, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  Save,
  CheckCircle,
  MapPin,
  Phone,
  Calendar,
  X
} from 'lucide-react'
import { DeliveryZonesManagement } from '../delivery/DeliveryZonesManagement'
import { BusinessHoursManagement } from './BusinessHoursManagement'
import { SchedulingConfiguration } from './SchedulingConfiguration'
import { PostalsManagement } from '../postals/PostalsManagement'
import { PostalPricingManagement } from '../postals/PostalPricingManagement'

interface BusinessConfigurationProps {
  businessId: string
}

interface DeliveryMethod {
  delivery: boolean
  pickup: boolean
  dineIn: boolean
  deliveryFee: number | string
  minimumOrder: number | string
  freeDeliveryThreshold: number | string | null
  deliveryRadius: number | string
  estimatedDeliveryTime: string
  estimatedPickupTime: string
  deliveryTimeText?: string  // Custom delivery time text for RETAIL
  freeDeliveryText?: string  // Custom free delivery text for RETAIL
}

interface PaymentMethod {
  id: string
  name: string
  description: string
  available: boolean
  comingSoon?: boolean
}

interface WhatsAppSettings {
  orderNumberFormat: string
  greetingMessage: string
  messageTemplate: string
  autoReply: boolean
  autoReplyMessage: string
}

interface BusinessConfig {
  deliveryMethods: DeliveryMethod
  paymentMethods: string[]
  paymentInstructions: string
  whatsappSettings: WhatsAppSettings
  whatsappNumber: string
}

interface Business {
  currency: string
  businessType?: string
}

interface SuccessMessage {
  title: string
  description?: string
}

export function BusinessConfiguration({ businessId }: BusinessConfigurationProps) {
  const [config, setConfig] = useState<BusinessConfig>({
    deliveryMethods: {
      delivery: true,
      pickup: false,
      dineIn: false,
      deliveryFee: 0,
      minimumOrder: 0,
      freeDeliveryThreshold: null,
      deliveryRadius: 10,
      estimatedDeliveryTime: '30-45 minutes',
      estimatedPickupTime: '15-20 minutes',
      deliveryTimeText: '',
      freeDeliveryText: ''
    },
    paymentMethods: ['CASH'],
    paymentInstructions: '',
    whatsappSettings: {
      orderNumberFormat: 'WO-{number}',
      greetingMessage: '',
      messageTemplate: '',
      autoReply: false,
      autoReplyMessage: ''
    },
    whatsappNumber: ''
  })
  
  const [business, setBusiness] = useState<Business>({ currency: 'USD', businessType: 'RESTAURANT' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('delivery')
  const [successMessage, setSuccessMessage] = useState<SuccessMessage | null>(null)

  useEffect(() => {
    fetchConfiguration()
  }, [businessId])

  const fetchConfiguration = async () => {
    try {
      const [configResponse, businessResponse] = await Promise.all([
        fetch(`/api/admin/stores/${businessId}/configuration`),
        fetch(`/api/admin/stores/${businessId}`)
      ])

      if (configResponse.ok) {
        const data = await configResponse.json()
        setConfig(data.configuration)
      }

      if (businessResponse.ok) {
        const data = await businessResponse.json()
        setBusiness({ 
          currency: data.business.currency,
          businessType: data.business.businessType || 'RESTAURANT'
        })
      }
    } catch (error) {
      console.error('Error fetching configuration:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle number inputs properly to allow deletion
  const handleDeliveryFeeChange = (value: string) => {
    if (value === '') {
      // Allow empty string temporarily
      updateDeliveryMethods({ deliveryFee: '' })
    } else {
      const numericValue = parseFloat(value)
      if (!isNaN(numericValue)) {
        updateDeliveryMethods({ deliveryFee: numericValue })
      }
    }
  }

  const handleMinimumOrderChange = (value: string) => {
    if (value === '') {
      // Allow empty string temporarily
      updateDeliveryMethods({ minimumOrder: '' })
    } else {
      const numericValue = parseFloat(value)
      if (!isNaN(numericValue)) {
        updateDeliveryMethods({ minimumOrder: numericValue })
      }
    }
  }

  const handleFreeDeliveryThresholdChange = (value: string) => {
    if (value === '') {
      // Empty means disabled (null)
      updateDeliveryMethods({ freeDeliveryThreshold: null })
    } else {
      const numericValue = parseFloat(value)
      if (!isNaN(numericValue)) {
        updateDeliveryMethods({ freeDeliveryThreshold: numericValue })
      }
    }
  }

  const handleDeliveryRadiusChange = (value: string) => {
    if (value === '') {
      // Allow empty string temporarily
      updateDeliveryMethods({ deliveryRadius: '' })
    } else {
      const numericValue = parseFloat(value)
      if (!isNaN(numericValue)) {
        updateDeliveryMethods({ deliveryRadius: numericValue })
      }
    }
  }

  const saveConfiguration = async () => {
    setSaving(true)
    try {
      // Convert empty strings back to numbers before saving
      const processedConfig = {
        ...config,
        deliveryMethods: {
          ...config.deliveryMethods,
          deliveryFee: config.deliveryMethods.deliveryFee === '' ? 0 : config.deliveryMethods.deliveryFee,
          minimumOrder: config.deliveryMethods.minimumOrder === '' ? 0 : config.deliveryMethods.minimumOrder,
          freeDeliveryThreshold: config.deliveryMethods.freeDeliveryThreshold === '' ? null : config.deliveryMethods.freeDeliveryThreshold,
          deliveryRadius: config.deliveryMethods.deliveryRadius === '' ? 10 : config.deliveryMethods.deliveryRadius
        }
      }

      const response = await fetch(`/api/admin/stores/${businessId}/configuration`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(processedConfig)
      })

      if (response.ok) {
        // Update state with processed values
        setConfig(processedConfig)
        
        // Show success message
        setSuccessMessage({
          title: 'Configuration Updated',
          description: 'Your business configuration has been saved successfully'
        })
        
        // Hide success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000)
      }
    } catch (error) {
      console.error('Error saving configuration:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateDeliveryMethods = (updates: Partial<DeliveryMethod>) => {
    setConfig(prev => ({
      ...prev,
      deliveryMethods: { ...prev.deliveryMethods, ...updates }
    }))
  }

  const updatePaymentMethods = (methodId: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      paymentMethods: enabled 
        ? [...prev.paymentMethods, methodId]
        : prev.paymentMethods.filter(id => id !== methodId)
    }))
  }

  const updateWhatsAppSettings = (updates: Partial<WhatsAppSettings>) => {
    setConfig(prev => ({
      ...prev,
      whatsappSettings: { ...prev.whatsappSettings, ...updates }
    }))
  }

  // Get currency-specific payment methods
  const getCurrencyPaymentMethods = () => {
    const currencyNames = {
      USD: 'US Dollars',
      EUR: 'Euros', 
      ALL: 'Albanian Lek'
    }

    const availablePaymentMethods: PaymentMethod[] = [
      {
        id: 'CASH',
        name: 'Cash',
        description: `Customer pays with cash in ${currencyNames[business.currency as keyof typeof currencyNames] || 'local currency'} when order is delivered/picked up`,
        available: true
      }
    ]

    const comingSoonPaymentMethods: PaymentMethod[] = [
      {
        id: 'STRIPE',
        name: 'Credit/Debit Cards',
        description: `Accept card payments in ${business.currency} via Stripe`,
        available: false,
        comingSoon: true
      },
      {
        id: 'PAYPAL',
        name: 'PayPal',
        description: `Accept PayPal payments in ${business.currency}`,
        available: false,
        comingSoon: true
      },
      {
        id: 'BANK_TRANSFER',
        name: 'Bank Transfer',
        description: `Direct bank transfers in ${business.currency}`,
        available: false,
        comingSoon: true
      }
    ]

    // Add Albania-specific payment methods only for ALL currency
    if (business.currency === 'ALL') {
      comingSoonPaymentMethods.push({
        id: 'BKT',
        name: 'BKT Payment',
        description: 'Accept payments via Bank of Tirana',
        available: false,
        comingSoon: true
      })
    }

    // Add mobile wallet based on currency
    if (business.currency === 'USD') {
      comingSoonPaymentMethods.push({
        id: 'MOBILE_WALLET',
        name: 'Mobile Wallets',
        description: 'Apple Pay, Google Pay, and other mobile wallets',
        available: false,
        comingSoon: true
      })
    } else if (business.currency === 'EUR') {
      comingSoonPaymentMethods.push({
        id: 'MOBILE_WALLET',
        name: 'Mobile Wallets', 
        description: 'Apple Pay, Google Pay, and European mobile wallets',
        available: false,
        comingSoon: true
      })
    } else if (business.currency === 'ALL') {
      comingSoonPaymentMethods.push({
        id: 'MOBILE_WALLET',
        name: 'Mobile Wallets',
        description: 'Local Albanian mobile payment solutions',
        available: false,
        comingSoon: true
      })
    }

    return { availablePaymentMethods, comingSoonPaymentMethods }
  }

  const { availablePaymentMethods, comingSoonPaymentMethods } = getCurrencyPaymentMethods()

  // For RETAIL businesses, hide delivery zones (they use postal services instead)
  const sections = business.businessType === 'RETAIL'
    ? [
        { id: 'delivery', name: 'Delivery Methods', icon: Truck },
        { id: 'payment', name: 'Payment Methods', icon: CreditCard },
        { id: 'whatsapp', name: 'WhatsApp Settings', icon: MessageSquare },
        { id: 'postals', name: 'Postal Services', icon: MapPin },
        { id: 'pricing', name: 'Postal Pricing', icon: Settings },
        { id: 'hours', name: 'Business Hours', icon: Calendar }
      ]
    : [
        { id: 'delivery', name: 'Delivery Methods', icon: Truck },
        { id: 'payment', name: 'Payment Methods', icon: CreditCard },
        { id: 'whatsapp', name: 'WhatsApp Settings', icon: MessageSquare },
        { id: 'zones', name: 'Delivery Zones', icon: MapPin },
        { id: 'hours', name: 'Business Hours', icon: Calendar }
      ]

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{successMessage.title}</h4>
                {successMessage.description && (
                  <p className="text-sm text-gray-600 mt-1">{successMessage.description}</p>
                )}
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            Business Configuration
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage your delivery methods, payment options, and communication settings
          </p>
        </div>
        <button
          onClick={saveConfiguration}
          disabled={saving}
          className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 text-sm font-medium whitespace-nowrap"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Navigation Tabs - Mobile Responsive with Horizontal Scroll */}
      <div className="bg-gray-100 p-1 rounded-lg">
        <div className="flex space-x-1 overflow-x-auto pb-1 scrollbar-hide">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeSection === section.id
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <section.icon className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{section.name}</span>
              <span className="sm:hidden">
                {section.name.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        {activeSection === 'delivery' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Truck className="w-5 h-5 text-teal-600 mr-2" />
              Delivery Methods
            </h3>

            {/* Service Types - Mobile Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Delivery</h4>
                  <input
                    type="checkbox"
                    checked={config.deliveryMethods.delivery}
                    onChange={(e) => updateDeliveryMethods({ delivery: e.target.checked })}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </div>
                <p className="text-sm text-gray-600">Orders delivered to customer location</p>
              </div>

              {/* Hide Pickup for RETAIL businesses */}
              {business.businessType !== 'RETAIL' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Pickup</h4>
                    <input
                      type="checkbox"
                      checked={config.deliveryMethods.pickup}
                      onChange={(e) => updateDeliveryMethods({ pickup: e.target.checked })}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </div>
                  <p className="text-sm text-gray-600">Customers collect orders from store</p>
                </div>
              )}
            </div>

            {/* Delivery Settings - Hide for RETAIL businesses */}
            {config.deliveryMethods.delivery && business.businessType !== 'RETAIL' && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Delivery Settings</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Fee ({business.currency})
                    </label>
                    <input
                      type="number"
                      value={config.deliveryMethods.deliveryFee}
                      onChange={(e) => handleDeliveryFeeChange(e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Order ({business.currency})
                    </label>
                    <input
                      type="number"
                      value={config.deliveryMethods.minimumOrder}
                      onChange={(e) => handleMinimumOrderChange(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="0 for no minimum"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum order value for delivery</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Free Delivery Above ({business.currency})
                    </label>
                    <input
                      type="number"
                      value={config.deliveryMethods.freeDeliveryThreshold || ''}
                      onChange={(e) => handleFreeDeliveryThresholdChange(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="Leave empty to disable"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Orders above this amount get free delivery</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Radius (km)
                    </label>
                    <input
                      type="number"
                      value={config.deliveryMethods.deliveryRadius}
                      onChange={(e) => handleDeliveryRadiusChange(e.target.value)}
                      min="1"
                      max="50"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Delivery Time
                    </label>
                    <input
                      type="text"
                      value={config.deliveryMethods.estimatedDeliveryTime}
                      onChange={(e) => updateDeliveryMethods({ 
                        estimatedDeliveryTime: e.target.value 
                      })}
                      placeholder="e.g., 30-45 minutes"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Retail-specific custom texts - Always show for RETAIL when delivery is enabled */}
            {config.deliveryMethods.delivery && business.businessType === 'RETAIL' && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Custom Display Texts (Retail Only)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Delivery Time Text
                      <span className="text-xs text-gray-500 ml-1">(overrides "Estimated Delivery Time" in storefront)</span>
                    </label>
                    <input
                      type="text"
                      value={config.deliveryMethods.deliveryTimeText || ''}
                      onChange={(e) => updateDeliveryMethods({ 
                        deliveryTimeText: e.target.value 
                      })}
                      placeholder="e.g., 3-4 Hours"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Free Delivery Text
                      <span className="text-xs text-gray-500 ml-1">(overrides "Free Delivery" in storefront)</span>
                    </label>
                    <input
                      type="text"
                      value={config.deliveryMethods.freeDeliveryText || ''}
                      onChange={(e) => updateDeliveryMethods({ 
                        freeDeliveryText: e.target.value 
                      })}
                      placeholder="e.g., Transport Falas"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pickup Settings - Hide for RETAIL businesses */}
            {config.deliveryMethods.pickup && business.businessType !== 'RETAIL' && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Pickup Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Pickup Time
                    </label>
                    <input
                      type="text"
                      value={config.deliveryMethods.estimatedPickupTime}
                      onChange={(e) => updateDeliveryMethods({ 
                        estimatedPickupTime: e.target.value 
                      })}
                      placeholder="e.g., 15-20 minutes"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'payment' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CreditCard className="w-5 h-5 text-teal-600 mr-2" />
              Payment Methods
            </h3>

            {/* Available Now */}
            <div className="space-y-4">
              <h4 className="text-base font-semibold text-gray-900">Available Now</h4>
              {availablePaymentMethods.map((method) => (
                <div key={method.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.paymentMethods.includes(method.id)}
                      onChange={(e) => updatePaymentMethods(method.id, e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 flex-shrink-0"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Coming Soon */}
            <div className="space-y-4">
              <h4 className="text-base font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                <span>Coming Soon</span>
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full whitespace-nowrap">
                  Future Updates
                </span>
              </h4>
              {comingSoonPaymentMethods.map((method) => (
                <div key={method.id} className="border border-gray-200 rounded-lg p-4 opacity-60">
                  <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-gray-700">{method.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{method.description}</p>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                      Coming Soon
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Instructions
              </label>
              <textarea
                value={config.paymentInstructions}
                onChange={(e) => setConfig(prev => ({ 
                  ...prev, 
                  paymentInstructions: e.target.value 
                }))}
                rows={4}
                placeholder="Enter special payment instructions for customers..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}

        {activeSection === 'whatsapp' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageSquare className="w-5 h-5 text-teal-600 mr-2" />
              WhatsApp Settings
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    value={config.whatsappNumber}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      whatsappNumber: e.target.value 
                    }))}
                    placeholder="+1234567890"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1.5">
                  Enter your WhatsApp number with country code prefix (e.g., +55 11 987654321 for Brazil, +1 5551234567 for US)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Number Format
                </label>
                <select
                  value={config.whatsappSettings.orderNumberFormat}
                  onChange={(e) => updateWhatsAppSettings({ 
                    orderNumberFormat: e.target.value 
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                >
                  <option value="WO-{number}">WO-001, WO-002, ...</option>
                  <option value="ORD-{number}">ORD-001, ORD-002, ...</option>
                  <option value="#{number}">001, 002, ...</option>
                  <option value="ORDER-{number}">ORDER-001, ORDER-002, ...</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Greeting Message
              </label>
              <textarea
                value={config.whatsappSettings.greetingMessage}
                onChange={(e) => updateWhatsAppSettings({ 
                  greetingMessage: e.target.value 
                })}
                rows={3}
                placeholder="Welcome! How can I help you today?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="flex items-start sm:items-center gap-3">
              <input
                type="checkbox"
                checked={config.whatsappSettings.autoReply}
                onChange={(e) => updateWhatsAppSettings({ 
                  autoReply: e.target.checked 
                })}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 mt-0.5 sm:mt-0 flex-shrink-0"
              />
              <label className="text-sm font-medium text-gray-700">
                Enable auto-reply messages
              </label>
            </div>

            {config.whatsappSettings.autoReply && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto-Reply Message
                </label>
                <textarea
                  value={config.whatsappSettings.autoReplyMessage}
                  onChange={(e) => updateWhatsAppSettings({ 
                    autoReplyMessage: e.target.value 
                  })}
                  rows={3}
                  placeholder="Thanks for your message! We'll get back to you soon."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>
            )}
          </div>
        )}

        {activeSection === 'zones' && business.businessType !== 'RETAIL' && (
          <DeliveryZonesManagement businessId={businessId} />
        )}

        {activeSection === 'postals' && business.businessType === 'RETAIL' && (
          <PostalsManagement businessId={businessId} />
        )}

        {activeSection === 'pricing' && business.businessType === 'RETAIL' && (
          <PostalPricingManagement businessId={businessId} />
        )}

        {activeSection === 'hours' && (
          <div className="space-y-6">
            <BusinessHoursManagement businessId={businessId} />
            {/* Hide scheduling configuration for RETAIL businesses (they don't use time slots) */}
            {business.businessType !== 'RETAIL' && (
              <SchedulingConfiguration businessId={businessId} />
            )}
          </div>
        )}
      </div>

      {/* Custom CSS for hiding scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}