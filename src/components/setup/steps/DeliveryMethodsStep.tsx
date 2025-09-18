'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { 
  ArrowLeft, 
  Truck, 
  Store, 
  UtensilsCrossed, 
  DollarSign, 
  Clock, 
  MapPin,
  Package,
  Calendar,
  Home,
  ShoppingBag,
  Users
} from 'lucide-react'

interface DeliveryMethodsStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
}

// Business type specific delivery configurations
const businessTypeConfig = {
  RESTAURANT: {
    title: 'How do customers receive orders?',
    subtitle: 'Choose the fulfillment methods that work for your restaurant',
    methods: [
      {
        key: 'delivery' as const,
        icon: Truck,
        title: 'Delivery',
        description: 'Deliver food directly to customer locations',
        color: 'teal',
        settings: ['deliveryFee', 'deliveryRadius', 'estimatedDeliveryTime']
      },
      {
        key: 'pickup' as const,
        icon: Store,
        title: 'Pickup',
        description: 'Customers collect orders from your restaurant',
        color: 'emerald',
        settings: []
      },
      {
        key: 'dineIn' as const,
        icon: UtensilsCrossed,
        title: 'Dine-in',
        description: 'Table service for customers eating at your restaurant',
        color: 'blue',
        settings: []
      }
    ]
  },
  CAFE: {
    title: 'How do customers receive orders?',
    subtitle: 'Choose the fulfillment methods for your cafe',
    methods: [
      {
        key: 'delivery' as const,
        icon: Truck,
        title: 'Delivery',
        description: 'Deliver drinks and food to customer locations',
        color: 'teal',
        settings: ['deliveryFee', 'deliveryRadius', 'estimatedDeliveryTime']
      },
      {
        key: 'pickup' as const,
        icon: Store,
        title: 'Pickup',
        description: 'Customers collect orders from your cafe',
        color: 'emerald',
        settings: []
      },
      {
        key: 'dineIn' as const,
        icon: UtensilsCrossed,
        title: 'Takeaway',
        description: 'Quick service for customers on the go',
        color: 'blue',
        settings: []
      }
    ]
  },
  RETAIL: {
    title: 'How do customers receive products?',
    subtitle: 'Choose the fulfillment methods for your retail business',
    methods: [
      {
        key: 'delivery' as const,
        icon: Package,
        title: 'Shipping',
        description: 'Ship products directly to customer addresses',
        color: 'teal',
        settings: ['deliveryFee', 'deliveryRadius', 'estimatedDeliveryTime']
      },
      {
        key: 'pickup' as const,
        icon: Store,
        title: 'Store Pickup',
        description: 'Customers collect purchases from your store',
        color: 'emerald',
        settings: []
      },
      {
        key: 'dineIn' as const,
        icon: ShoppingBag,
        title: 'In-Store Shopping',
        description: 'Browse and purchase products in your store',
        color: 'blue',
        settings: []
      }
    ]
  },
  GROCERY: {
    title: 'How do customers receive groceries?',
    subtitle: 'Choose the fulfillment methods for your grocery business',
    methods: [
      {
        key: 'delivery' as const,
        icon: Truck,
        title: 'Home Delivery',
        description: 'Deliver groceries to customer homes',
        color: 'teal',
        settings: ['deliveryFee', 'deliveryRadius', 'estimatedDeliveryTime']
      },
      {
        key: 'pickup' as const,
        icon: Store,
        title: 'Store Pickup',
        description: 'Customers collect groceries from your store',
        color: 'emerald',
        settings: []
      },
      {
        key: 'dineIn' as const,
        icon: Users,
        title: 'Curbside Service',
        description: 'Bring groceries to customer vehicles',
        color: 'blue',
        settings: []
      }
    ]
  },
  JEWELRY: {
    title: 'How do customers receive jewelry?',
    subtitle: 'Choose the fulfillment methods for your jewelry business',
    methods: [
      {
        key: 'delivery' as const,
        icon: Package,
        title: 'Secure Shipping',
        description: 'Ship jewelry with insurance and tracking',
        color: 'teal',
        settings: ['deliveryFee', 'deliveryRadius', 'estimatedDeliveryTime']
      },
      {
        key: 'pickup' as const,
        icon: Store,
        title: 'Store Pickup',
        description: 'Customers collect jewelry from your store',
        color: 'emerald',
        settings: []
      },
      {
        key: 'dineIn' as const,
        icon: Calendar,
        title: 'Appointment Viewing',
        description: 'Private consultations and fittings',
        color: 'blue',
        settings: []
      }
    ]
  },
  FLORIST: {
    title: 'How do customers receive flowers?',
    subtitle: 'Choose the fulfillment methods for your flower business',
    methods: [
      {
        key: 'delivery' as const,
        icon: Truck,
        title: 'Flower Delivery',
        description: 'Deliver fresh flowers to any location',
        color: 'teal',
        settings: ['deliveryFee', 'deliveryRadius', 'estimatedDeliveryTime']
      },
      {
        key: 'pickup' as const,
        icon: Store,
        title: 'Shop Pickup',
        description: 'Customers collect arrangements from your shop',
        color: 'emerald',
        settings: []
      },
      {
        key: 'dineIn' as const,
        icon: Home,
        title: 'Local Delivery',
        description: 'Same-day delivery in your local area',
        color: 'blue',
        settings: []
      }
    ]
  },
  HEALTH_BEAUTY: {
    title: 'How do customers receive services?',
    subtitle: 'Choose the service methods for your business',
    methods: [
      {
        key: 'delivery' as const,
        icon: Home,
        title: 'Home Service',
        description: 'Provide services at customer locations',
        color: 'teal',
        settings: ['deliveryFee', 'deliveryRadius', 'estimatedDeliveryTime']
      },
      {
        key: 'pickup' as const,
        icon: Store,
        title: 'Product Pickup',
        description: 'Customers collect products from your location',
        color: 'emerald',
        settings: []
      },
      {
        key: 'dineIn' as const,
        icon: Calendar,
        title: 'In-Store Appointment',
        description: 'Services provided at your business location',
        color: 'blue',
        settings: []
      }
    ]
  },
  OTHER: {
    title: 'How do customers receive orders?',
    subtitle: 'Choose the fulfillment methods for your business',
    methods: [
      {
        key: 'delivery' as const,
        icon: Truck,
        title: 'Delivery',
        description: 'Deliver products/services to customer locations',
        color: 'teal',
        settings: ['deliveryFee', 'deliveryRadius', 'estimatedDeliveryTime']
      },
      {
        key: 'pickup' as const,
        icon: Store,
        title: 'Pickup',
        description: 'Customers collect orders from your location',
        color: 'emerald',
        settings: []
      },
      {
        key: 'dineIn' as const,
        icon: Users,
        title: 'On-Site Service',
        description: 'Provide services at your business location',
        color: 'blue',
        settings: []
      }
    ]
  }
}

const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'USD': return '$'
    case 'EUR': return '€'
    case 'ALL': return 'L'
    default: return '$'
  }
}

export default function DeliveryMethodsStep({ data, onComplete, onBack }: DeliveryMethodsStepProps) {
  const [methods, setMethods] = useState(data.deliveryMethods || {
    delivery: false,
    pickup: true,
    dineIn: false,
    deliveryFee: 0,
    deliveryRadius: 10,
    estimatedDeliveryTime: '30-45 minutes'
  })
  const [loading, setLoading] = useState(false)

  const config = businessTypeConfig[data.businessType as keyof typeof businessTypeConfig] || businessTypeConfig.OTHER
  const currencySymbol = getCurrencySymbol(data.currency || 'USD')

  const toggleMethod = (method: keyof typeof methods) => {
    if (typeof methods[method] === 'boolean') {
      setMethods(prev => ({ ...prev, [method]: !prev[method] }))
    }
  }

  const updateValue = (field: string, value: string | number) => {
    setMethods(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    // Ensure at least one method is selected
    if (!methods.delivery && !methods.pickup && !methods.dineIn) {
      return
    }

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    onComplete({ deliveryMethods: methods })
    setLoading(false)
  }

  const hasSelection = methods.delivery || methods.pickup || methods.dineIn

  // Get field labels based on business type
  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'deliveryFee':
        if (data.businessType === 'RETAIL' || data.businessType === 'JEWELRY') return 'Shipping Fee'
        if (data.businessType === 'HEALTH_BEAUTY') return 'Service Fee'
        return 'Delivery Fee'
      case 'deliveryRadius':
        if (data.businessType === 'RETAIL' || data.businessType === 'JEWELRY') return 'Shipping Radius (km)'
        if (data.businessType === 'HEALTH_BEAUTY') return 'Service Area (km)'
        return 'Delivery Radius (km)'
      case 'estimatedDeliveryTime':
        if (data.businessType === 'RETAIL' || data.businessType === 'JEWELRY') return 'Shipping Time'
        if (data.businessType === 'HEALTH_BEAUTY') return 'Service Time'
        return 'Delivery Time'
      default:
        return field
    }
  }

  const getTimePlaceholder = () => {
    switch (data.businessType) {
      case 'RETAIL':
      case 'JEWELRY':
        return '2-5 business days'
      case 'HEALTH_BEAUTY':
        return '1-2 hours'
      case 'FLORIST':
        return '2-4 hours'
      default:
        return '30-45 minutes'
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          {config.title}
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          {config.subtitle}
        </p>
      </div>

      {/* Delivery Method Options */}
      <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
        {config.methods.map(option => {
          const IconComponent = option.icon
          const isSelected = methods[option.key]
          
          return (
            <div
              key={option.key}
              className={`border-2 rounded-xl transition-all ${
                isSelected
                  ? `border-${option.color}-500 bg-${option.color}-50 ring-2 ring-${option.color}-200`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleMethod(option.key)}
                className="w-full p-4 sm:p-6 text-left"
              >
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? `bg-${option.color}-600 text-white`
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">{option.title}</h3>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">{option.description}</p>
                      </div>
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? `bg-${option.color}-600 border-${option.color}-600`
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Delivery-specific settings */}
              {option.key === 'delivery' && isSelected && option.settings.length > 0 && (
                <div className={`px-4 sm:px-6 pb-4 sm:pb-6 space-y-4 border-t border-${option.color}-200 pt-4 mt-4`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {option.settings.includes('deliveryFee') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          {getFieldLabel('deliveryFee')}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={methods.deliveryFee || 0}
                            onChange={(e) => updateValue('deliveryFee', parseFloat(e.target.value) || 0)}
                            className="pl-8 w-full px-3 py-2 sm:py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    )}

                    {option.settings.includes('deliveryRadius') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          {getFieldLabel('deliveryRadius')}
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            value={methods.deliveryRadius || 10}
                            onChange={(e) => updateValue('deliveryRadius', parseInt(e.target.value) || 10)}
                            className="pl-9 w-full px-3 py-2 sm:py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                            placeholder="10"
                          />
                        </div>
                      </div>
                    )}

                    {option.settings.includes('estimatedDeliveryTime') && (
                      <div className="sm:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          {getFieldLabel('estimatedDeliveryTime')}
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={methods.estimatedDeliveryTime || getTimePlaceholder()}
                            onChange={(e) => updateValue('estimatedDeliveryTime', e.target.value)}
                            className="pl-9 w-full px-3 py-2 sm:py-3 lg:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base"
                            placeholder={getTimePlaceholder()}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Preview of selected methods */}
      {hasSelection && (
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Order Options Preview:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {methods.delivery && (
              <div>✓ <strong>{config.methods[0].title}:</strong> {currencySymbol}{methods.deliveryFee?.toFixed(2) || '0.00'} fee • {methods.estimatedDeliveryTime} • {methods.deliveryRadius}km radius</div>
            )}
            {methods.pickup && (
              <div>✓ <strong>{config.methods[1].title}:</strong> Available at your location</div>
            )}
            {methods.dineIn && (
              <div>✓ <strong>{config.methods[2].title}:</strong> {config.methods[2].description}</div>
            )}
          </div>
        </div>
      )}

      {!hasSelection && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 sm:mb-8">
          <p className="text-yellow-800 text-sm">
            Please select at least one fulfillment method for your customers.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={loading || !hasSelection}
          className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
        >
          {loading ? 'Continue...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}