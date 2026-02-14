'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { ArrowLeft, Banknote, CreditCard, Building2, Smartphone, AlertCircle, Coins } from 'lucide-react'

interface PaymentMethodsStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
}

// Business type specific payment configurations
const businessTypeConfig = {
  RESTAURANT: {
    title: 'How will customers pay?',
    subtitle: 'Choose payment methods for your restaurant',
    cashOnDeliveryLabel: 'Cash',
    instructionsPlaceholder: 'e.g., "Please have exact change ready for delivery orders"'
  },
  CAFE: {
    title: 'How will customers pay?',
    subtitle: 'Choose payment methods for your cafe',
    cashOnDeliveryLabel: 'Cash',
    instructionsPlaceholder: 'e.g., "Mobile orders must be paid in advance"'
  },
  RETAIL: {
    title: 'How will customers pay?',
    subtitle: 'Choose payment methods for your store',
    cashOnDeliveryLabel: 'Cash',
    instructionsPlaceholder: 'e.g., "Returns accepted within 30 days with receipt"'
  },
  GROCERY: {
    title: 'How will customers pay?',
    subtitle: 'Choose payment methods for your grocery business',
    cashOnDeliveryLabel: 'Cash',
    instructionsPlaceholder: 'e.g., "Please check expiry dates upon delivery"'
  },
  HEALTH_BEAUTY: {
    title: 'How will customers pay?',
    subtitle: 'Choose payment methods for your services',
    cashOnDeliveryLabel: 'Cash',
    instructionsPlaceholder: 'e.g., "Payment due at time of service"'
  },
  OTHER: {
    title: 'How will customers pay?',
    subtitle: 'Choose payment methods for your business',
    cashOnDeliveryLabel: 'Cash',
    instructionsPlaceholder: 'e.g., "Add any special payment instructions"'
  }
}

// Currency-specific cash payment methods
const getCurrencyPaymentMethods = (currency: string, businessType: string) => {
  const config = businessTypeConfig[businessType as keyof typeof businessTypeConfig] || businessTypeConfig.OTHER
  
  const currencyNames = {
    USD: 'US Dollars',
    EUR: 'Euros',
    ALL: 'Albanian Lek'
  }

  return [
    {
      id: 'CASH',
      name: config.cashOnDeliveryLabel,
      description: `Customer pays with cash in ${currencyNames[currency as keyof typeof currencyNames] || 'local currency'} when order is delivered`,
      icon: Banknote,
      available: true,
      color: 'green'
    },
  ]
}

export default function PaymentMethodsStep({ data, onComplete, onBack }: PaymentMethodsStepProps) {
  const [selectedMethods, setSelectedMethods] = useState<string[]>(
    data.paymentMethods || ['CASH']
  )
  const [paymentInstructions, setPaymentInstructions] = useState(
    data.paymentInstructions || ''
  )
  const [loading, setLoading] = useState(false)

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development'

  const config = businessTypeConfig[data.businessType as keyof typeof businessTypeConfig] || businessTypeConfig.OTHER
  const currency = data.currency || 'USD'
  
  // Get currency-specific payment methods
  const availablePaymentMethods = getCurrencyPaymentMethods(currency, data.businessType || 'OTHER')

  // Future payment methods with currency awareness
  const futurePaymentMethods = [
    {
      id: 'STRIPE',
      name: 'Credit/Debit Cards',
      description: `Accept card payments in ${currency} via Stripe`,
      icon: CreditCard,
      available: false,
      color: 'blue'
    },
    {
      id: 'PAYPAL',
      name: 'PayPal',
      description: `Accept PayPal payments in ${currency}`,
      icon: Building2,
      available: false,
      color: 'blue'
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Bank Transfer',
      description: `Direct bank transfers in ${currency}`,
      icon: Building2,
      available: false,
      color: 'gray'
    }
  ]

  // Add Albania-specific payment methods
  if (currency === 'ALL') {
    futurePaymentMethods.push({
      id: 'BKT',
      name: 'BKT Payment',
      description: 'Accept payments via BKT Payment Provider',
      icon: Building2,
      available: false,
      color: 'purple'
    })
  }

  // Add mobile wallet based on currency/region
  if (currency === 'USD') {
    futurePaymentMethods.push({
      id: 'MOBILE_WALLET',
      name: 'Mobile Wallets',
      description: 'Apple Pay, Google Pay, and other mobile wallets',
      icon: Smartphone,
      available: false,
      color: 'purple'
    })
  } else if (currency === 'EUR') {
    futurePaymentMethods.push({
      id: 'MOBILE_WALLET',
      name: 'Mobile Wallets',
      description: 'Apple Pay, Google Pay, and European mobile wallets',
      icon: Smartphone,
      available: false,
      color: 'purple'
    })
  } else if (currency === 'ALL') {
    futurePaymentMethods.push({
      id: 'MOBILE_WALLET',
      name: 'Mobile Wallets',
      description: 'Local Albanian mobile payment solutions',
      icon: Smartphone,
      available: false,
      color: 'purple'
    })
  }

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
    onComplete({ 
      paymentMethods: selectedMethods,
      paymentInstructions: paymentInstructions.trim() || undefined
    })
    setLoading(false)
  }

  // Filter available methods based on selected delivery methods
  // const deliveryMethods = data.deliveryMethods
  const filteredAvailableMethods = availablePaymentMethods.filter(method => {
    return true
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          {config.title}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-2">
          {config.subtitle}
        </p>
        
        {/* Currency Indicator */}
        <div className="mt-4 inline-flex items-center px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
          <Coins className="w-4 h-4 mr-2" />
          Currency: {currency}
        </div>
      </div>

      {/* Available Payment Methods */}
      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        <h3 className="text-lg font-semibold text-gray-900">Available Now</h3>
        
        {filteredAvailableMethods.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-yellow-800 text-sm">
              No cash payment methods available based on your delivery options. Please go back and select at least one delivery method.
            </p>
          </div>
        )}
        
        {filteredAvailableMethods.map(method => {
          const IconComponent = method.icon
          const isSelected = selectedMethods.includes(method.id)
          
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => togglePaymentMethod(method.id, method.available)}
              className={`w-full p-4 sm:p-6 border-2 rounded-xl text-left transition-all ${
                isSelected
                  ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isSelected
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">{method.name}</h3>
                    <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-green-600 border-green-600'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">{method.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Coming Soon Payment Methods */}
      <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        <h3 className="text-lg font-semibold text-gray-900 flex flex-col sm:flex-row sm:items-center gap-2">
          <span>Coming Soon</span>
          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full self-start">
            Future Updates
          </span>
        </h3>
        
        {futurePaymentMethods.map(method => {
          const IconComponent = method.icon
          
          return (
            <div
              key={method.id}
              className="w-full p-4 sm:p-6 border-2 border-gray-200 bg-gray-50 rounded-xl opacity-60 cursor-not-allowed"
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-300 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-700 leading-tight">{method.name}</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full flex-shrink-0 mt-0.5">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-500 mt-1">{method.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* TODO Note for developers - only shown in development */}
      {isDevelopment && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 sm:mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="font-medium text-blue-900 mb-1">For Developers</h4>
              <p className="text-blue-700 text-sm">
                <strong>TODO:</strong> Implement Stripe, PayPal, BKT, and other payment gateway integrations. 
                Currently only cash payments are supported for MVP launch.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Instructions */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">Payment Instructions for Customers</h3>
        <textarea
          value={paymentInstructions}
          onChange={(e) => setPaymentInstructions(e.target.value)}
          placeholder={config.instructionsPlaceholder}
          className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none text-base text-gray-900 placeholder:text-gray-500"
          rows={3}
        />
        <p className="text-xs sm:text-sm text-gray-500 mt-2">
          These instructions will be shown to customers during checkout
        </p>
      </div>

      {/* Selected Methods Preview */}
      {selectedMethods.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
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

      {selectedMethods.length === 0 && filteredAvailableMethods.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 sm:mb-8">
          <p className="text-yellow-800 text-sm">
            Please select at least one payment method for your customers.
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
          disabled={loading || selectedMethods.length === 0}
          className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
        >
          {loading ? 'Continue...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}