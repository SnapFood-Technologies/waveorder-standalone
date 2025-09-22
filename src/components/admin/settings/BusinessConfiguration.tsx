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
  Phone
} from 'lucide-react'
import { DeliveryZonesManagement } from '../delivery/DeliveryZonesManagement'

interface BusinessConfigurationProps {
  businessId: string
}

interface DeliveryMethod {
  delivery: boolean
  pickup: boolean
  dineIn: boolean
  deliveryFee: number
  deliveryRadius: number
  estimatedDeliveryTime: string
  estimatedPickupTime: string
}

interface PaymentMethod {
  cash: boolean
  bankTransfer: boolean
  stripe: boolean
  paypal: boolean
  bkt: boolean
  mobileWallet: boolean
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
  paymentMethods: PaymentMethod
  paymentInstructions: string
  whatsappSettings: WhatsAppSettings
  whatsappNumber: string
}

export function BusinessConfiguration({ businessId }: BusinessConfigurationProps) {
  const [config, setConfig] = useState<BusinessConfig>({
    deliveryMethods: {
      delivery: true,
      pickup: false,
      dineIn: false,
      deliveryFee: 0,
      deliveryRadius: 10,
      estimatedDeliveryTime: '30-45 minutes',
      estimatedPickupTime: '15-20 minutes'
    },
    paymentMethods: ['CASH'], // Array like onboarding
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

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('delivery')

  useEffect(() => {
    fetchConfiguration()
  }, [businessId])

  const fetchConfiguration = async () => {
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/configuration`)
      if (response.ok) {
        const data = await response.json()
        setConfig(data.configuration)
      }
    } catch (error) {
      console.error('Error fetching configuration:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfiguration = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/stores/${businessId}/configuration`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        // Show success notification
        console.log('Configuration saved successfully')
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

  // Available payment methods (like onboarding)
  const availablePaymentMethods: PaymentMethod[] = [
    {
      id: 'CASH',
      name: 'Cash',
      description: 'Customer pays with cash when order is delivered/picked up',
      available: true
    }
  ]

  // Coming soon payment methods (like onboarding)
  const comingSoonPaymentMethods: PaymentMethod[] = [
    {
      id: 'STRIPE',
      name: 'Credit/Debit Cards',
      description: 'Accept card payments via Stripe',
      available: false,
      comingSoon: true
    },
    {
      id: 'PAYPAL',
      name: 'PayPal',
      description: 'Accept PayPal payments',
      available: false,
      comingSoon: true
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Bank Transfer',
      description: 'Direct bank transfers',
      available: false,
      comingSoon: true
    },
    {
      id: 'BKT',
      name: 'BKT Payment',
      description: 'Accept payments via Bank of Tirana',
      available: false,
      comingSoon: true
    },
    {
      id: 'MOBILE_WALLET',
      name: 'Mobile Wallets',
      description: 'Apple Pay, Google Pay, and other mobile wallets',
      available: false,
      comingSoon: true
    }
  ]


  const sections = [
    { id: 'delivery', name: 'Delivery Methods', icon: Truck },
    { id: 'payment', name: 'Payment Methods', icon: CreditCard },
    { id: 'whatsapp', name: 'WhatsApp Settings', icon: MessageSquare },
    { id: 'zones', name: 'Delivery Zones', icon: MapPin }
  ]

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Business Configuration</h2>
          <p className="text-gray-600 mt-1">
            Manage your delivery methods, payment options, and communication settings
          </p>
        </div>
        <button
          onClick={saveConfiguration}
          disabled={saving}
          className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <section.icon className="w-4 h-4 mr-2" />
            {section.name}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeSection === 'delivery' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Truck className="w-5 h-5 text-teal-600 mr-2" />
              Delivery Methods
            </h3>

            {/* Service Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="border border-gray-200 rounded-lg p-4 opacity-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Dine-In</h4>
                  <input
                    type="checkbox"
                    checked={false}
                    disabled
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  />
                </div>
                <p className="text-sm text-gray-600">Coming in v2.0</p>
              </div>
            </div>

            {/* Delivery Settings */}
            {config.deliveryMethods.delivery && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Delivery Settings</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Fee ($)
                    </label>
                    <input
                      type="number"
                      value={config.deliveryMethods.deliveryFee}
                      onChange={(e) => updateDeliveryMethods({ 
                        deliveryFee: parseFloat(e.target.value) || 0 
                      })}
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Delivery Radius (km)
                    </label>
                    <input
                      type="number"
                      value={config.deliveryMethods.deliveryRadius}
                      onChange={(e) => updateDeliveryMethods({ 
                        deliveryRadius: parseFloat(e.target.value) || 0 
                      })}
                      min="1"
                      max="50"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>

                  <div>
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pickup Settings */}
            {config.deliveryMethods.pickup && (
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
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.paymentMethods.includes(method.id)}
                      onChange={(e) => updatePaymentMethods(method.id, e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Coming Soon */}
            <div className="space-y-4">
              <h4 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <span>Coming Soon</span>
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Future Updates
                </span>
              </h4>
              {comingSoonPaymentMethods.map((method) => (
                <div key={method.id} className="border border-gray-200 rounded-lg p-4 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-700">{method.name}</h4>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <input
                    type="text"
                    value={config.whatsappNumber}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      whatsappNumber: e.target.value 
                    }))}
                    placeholder="+1234567890"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={config.whatsappSettings.autoReply}
                onChange={(e) => updateWhatsAppSettings({ 
                  autoReply: e.target.checked 
                })}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            )}
          </div>
        )}

        {activeSection === 'zones' && (
          <DeliveryZonesManagement businessId={businessId} />
        )}
      </div>
    </div>
  )
}