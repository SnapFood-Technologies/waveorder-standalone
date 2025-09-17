'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { ArrowLeft, Truck, Store, UtensilsCrossed, DollarSign, Clock, MapPin } from 'lucide-react'

interface DeliveryMethodsStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
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

  const deliveryOptions = [
    {
      key: 'delivery' as const,
      icon: Truck,
      title: 'Delivery',
      description: 'Customers can get orders delivered to their location',
      color: 'teal'
    },
    {
      key: 'pickup' as const,
      icon: Store,
      title: 'Pickup',
      description: 'Customers can collect orders from your location',
      color: 'emerald'
    },
    {
      key: 'dineIn' as const,
      icon: UtensilsCrossed,
      title: 'Dine-in',
      description: 'Customers can order for table service',
      color: 'blue'
    }
  ]

  const hasSelection = methods.delivery || methods.pickup || methods.dineIn

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          How do customers receive orders?
        </h1>
        <p className="text-lg text-gray-600">
          Choose the fulfillment methods that work for your business
        </p>
      </div>

      {/* Delivery Method Options */}
      <div className="space-y-6 mb-8">
        {deliveryOptions.map(option => {
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
                className="w-full p-6 text-left"
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isSelected
                      ? `bg-${option.color}-600 text-white`
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">{option.title}</h3>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? `bg-${option.color}-600 border-${option.color}-600`
                          : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 mt-1">{option.description}</p>
                  </div>
                </div>
              </button>

              {/* Delivery-specific settings */}
              {option.key === 'delivery' && isSelected && (
                <div className="px-6 pb-6 space-y-4 border-t border-teal-200 pt-4 mt-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Fee
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          value={methods.deliveryFee || 0}
                          onChange={(e) => updateValue('deliveryFee', parseFloat(e.target.value) || 0)}
                          className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Radius (km)
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          value={methods.deliveryRadius || 10}
                          onChange={(e) => updateValue('deliveryRadius', parseInt(e.target.value) || 10)}
                          className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Time
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={methods.estimatedDeliveryTime || '30-45 minutes'}
                          onChange={(e) => updateValue('estimatedDeliveryTime', e.target.value)}
                          className="pl-9 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                          placeholder="30-45 minutes"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Preview of selected methods */}
      {hasSelection && (
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Order Options Preview:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {methods.delivery && (
              <div>✓ <strong>Delivery:</strong> ${methods.deliveryFee?.toFixed(2) || '0.00'} fee • {methods.estimatedDeliveryTime} • {methods.deliveryRadius}km radius</div>
            )}
            {methods.pickup && (
              <div>✓ <strong>Pickup:</strong> Available at your location</div>
            )}
            {methods.dineIn && (
              <div>✓ <strong>Dine-in:</strong> Table service available</div>
            )}
          </div>
        </div>
      )}

      {!hasSelection && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <p className="text-yellow-800 text-sm">
            Please select at least one fulfillment method for your customers.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        
        <button
          onClick={handleSubmit}
          disabled={loading || !hasSelection}
          className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Continue...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}