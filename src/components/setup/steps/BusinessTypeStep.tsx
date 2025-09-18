'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { 
  UtensilsCrossed, 
  Coffee, 
  ShoppingBag, 
  Apple, 
  Scissors, 
  Gem, 
  Flower2, 
  MoreHorizontal,
  DollarSign,
  Euro,
  Banknote
} from 'lucide-react'

interface BusinessTypeStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
}

const businessTypes = [
  { value: 'RESTAURANT', label: 'Restaurant', icon: UtensilsCrossed },
  { value: 'CAFE', label: 'Cafe', icon: Coffee },
  { value: 'RETAIL', label: 'Retail & Shopping', icon: ShoppingBag },
  { value: 'GROCERY', label: 'Grocery & Supermarket', icon: Apple },
  { value: 'HEALTH_BEAUTY', label: 'Health & Beauty', icon: Scissors },
  { value: 'JEWELRY', label: 'Jewelry Store', icon: Gem },
  { value: 'FLORIST', label: 'Florist', icon: Flower2 },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal }
]

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', icon: DollarSign },
  { code: 'EUR', name: 'Euro', symbol: '€', icon: Euro },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L', icon: Banknote }
]

export default function BusinessTypeStep({ data, onComplete }: BusinessTypeStepProps) {
  const [selectedType, setSelectedType] = useState(data.businessType || '')
  const [selectedCurrency, setSelectedCurrency] = useState(data.currency || 'USD')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !selectedCurrency) return

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    onComplete({ 
      businessType: selectedType,
      currency: selectedCurrency
    })
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          Getting Started
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          What type of business do you operate?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        {/* Business Type Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Type</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {businessTypes.map((type) => {
    const IconComponent = type.icon
    return (
      <button
        key={type.value}
        type="button"
        onClick={() => setSelectedType(type.value)}
        className={`p-3 border-2 rounded-lg text-left transition-all hover:border-teal-300 hover:bg-teal-50 ${
          selectedType === type.value
            ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
            : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            selectedType === type.value
              ? 'bg-teal-600 text-white'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <span className="font-medium text-gray-900">{type.label}</span>
        </div>
      </button>
    )
  })}
</div>
        </div>

        {/* Currency Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Currency</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {currencies.map((currency) => {
              const IconComponent = currency.icon
              return (
                <button
                  key={currency.code}
                  type="button"
                  onClick={() => setSelectedCurrency(currency.code)}
                  className={`p-4 border-2 rounded-xl text-left transition-all hover:border-teal-300 hover:bg-teal-50 ${
                    selectedCurrency === currency.code
                      ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-200'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedCurrency === currency.code
                        ? 'bg-teal-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">
                        {currency.symbol} {currency.code}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 truncate">
                        {currency.name}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!selectedType || !selectedCurrency || loading}
            className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Continue...' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  )
}