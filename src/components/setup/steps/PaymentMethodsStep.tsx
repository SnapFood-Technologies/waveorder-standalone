'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { ArrowLeft, Banknote, CreditCard, Building2, Smartphone, AlertCircle } from 'lucide-react'

interface PaymentMethodsStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
}

export default function PaymentMethodsStep({ data, onComplete, onBack }: PaymentMethodsStepProps) {
  const [selectedMethods, setSelectedMethods] = useState<string[]>(
    data.paymentMethods || ['CASH_ON_DELIVERY']
  )
  const [loading, setLoading] = useState(false)

  // For now, only cash methods are available
  const availablePaymentMethods = [
    {
      id: 'CASH_ON_DELIVERY',
      name: 'Cash on Delivery',
      description: 'Customer pays with cash when order is delivered',
      icon: Banknote,
      available: true,
      color: 'green'
    },
    {
      id: 'CASH_ON_PICKUP',
      name: 'Cash on Pickup',
      description: 'Customer pays with cash when collecting order',
      icon: Banknote,
      available: true,
      color: 'green'
    }
  ]

  // TODO: Future payment methods (currently disabled)
  const futurePaymentMethods = [
    {
      id: 'STRIPE',
      name: 'Credit/Debit Cards',
      description: 'Accept card payments via Stripe',
      icon: CreditCard,
      available: false,
      color: 'blue'
    },
    {
      id: 'PAYPAL',
      name: 'PayPal',
      description: 'Accept payments via PayPal',
      icon: Building2,
      available: false,
      color: 'blue'
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Bank Transfer',
      description: 'Customer transfers money directly to your bank',
      icon: Building2,
      available: false,
      color: 'gray'
    },
    {
      id: 'MOBILE_WALLET',
      name: 'Mobile Wallet',
      description: 'Accept payments via mobile wallets',
      icon: Smartphone,
      available: false,
      color: 'purple'
    }
  ]

  const togglePaymentMethod = (methodId: string, available: boolean) => {
    if (!available) return

    setSelectedMethods(prev => 
      prev.includes(methodId)
        ? prev.filter(id => id !== methodId)
        : [...prev, methodId]
    )
  }

  const handleSubmit = async () => {
    if (selectedMethods.length === 0) return

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    onComplete({ paymentMethods: selectedMethods })
    setLoading(false)
  }

  // Filter available methods based on selected delivery methods
  const deliveryMethods = data.deliveryMethods
  const showCashOnDelivery = deliveryMethods?.delivery
  const showCashOnPickup = deliveryMethods?.pickup || deliveryMethods?.dineIn

  const filteredAvailableMethods = availablePaymentMethods.filter(method => {
    if (method.id === 'CASH_ON_DELIVERY') return showCashOnDelivery
    if (method.id === 'CASH_ON_PICKUP') return showCashOnPickup
    return true
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          How will customers pay?
        </h1>
        <p className="text-lg text-gray-600">
          Choose the payment methods you want to accept
        </p>
      </div>

      {/* Available Payment Methods */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900">Available Now</h3>
        
        {filteredAvailableMethods.map(method => {
          const IconComponent = method.icon
          const isSelected = selectedMethods.includes(method.id)
          
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => togglePaymentMethod(method.id, method.available)}
              className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                isSelected
                  ? `border-${method.color}-500 bg-${method.color}-50 ring-2 ring-${method.color}-200`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isSelected
                    ? `bg-${method.color}-600 text-white`
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900">{method.name}</h3>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? `bg-${method.color}-600 border-${method.color}-600`
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-600 mt-1">{method.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Coming Soon Payment Methods */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          Coming Soon
          <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
            Future Updates
          </span>
        </h3>
        
        {futurePaymentMethods.map(method => {
          const IconComponent = method.icon
          
          return (
            <div
              key={method.id}
              className="w-full p-6 border-2 border-gray-200 bg-gray-50 rounded-xl opacity-60 cursor-not-allowed"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-700">{method.name}</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-gray-500 mt-1">{method.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* TODO Note for developers */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">For Developers</h4>
            <p className="text-blue-700 text-sm">
              <strong>TODO:</strong> Implement Stripe, PayPal, BKT, and other payment gateway integrations. 
              Currently only cash payments are supported for MVP launch.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">Payment Instructions for Customers</h3>
        <textarea
          placeholder="Add any special payment instructions for your customers (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
          rows={3}
        />
        <p className="text-sm text-gray-500 mt-2">
          These instructions will be shown to customers during checkout
        </p>
      </div>

      {/* Selected Methods Preview */}
      {selectedMethods.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-3">Selected Payment Methods:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {selectedMethods.map(methodId => {
              const method = availablePaymentMethods.find(m => m.id === methodId)
              return method ? (
                <div key={methodId}>✓ <strong>{method.name}</strong></div>
              ) : null
            })}
          </div>
        </div>
      )}

      {selectedMethods.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
          <p className="text-yellow-800 text-sm">
            Please select at least one payment method for your customers.
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
          disabled={loading || selectedMethods.length === 0}
          className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Continue...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}