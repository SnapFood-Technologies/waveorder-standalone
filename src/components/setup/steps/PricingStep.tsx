    'use client'

import { useState } from 'react'
import { SetupData } from '../Setup'
import { Check, ArrowLeft } from 'lucide-react'

interface PricingStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
}

const plans = [
  {
    id: 'FREE',
    name: 'Free Plan',
    price: 'Get started with basic features',
    features: [
      'Up to 30 products',
      '10 categories',
      'Basic WhatsApp orders',
      'Mobile catalog',
      'Manual product entry',
      'Basic branding',
      'CSV import',
      'Basic order analytics'
    ],
    buttonText: 'Choose Free Plan',
    popular: false
  },
  {
    id: 'PRO',
    name: 'Pro Plan',
    price: 'Full features for growing businesses',
    features: [
      'Unlimited products',
      'Unlimited categories',
      'Advanced branding (colors, logo)',
      'Advanced order analytics',
      'Inventory management',
      'Custom domains',
      'Wholesale pricing',
      'Priority support'
    ],
    buttonText: 'Get Started',
    popular: true
  }
]

export default function PricingStep({ data, onComplete, onBack }: PricingStepProps) {
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PRO'>(data.subscriptionPlan || 'FREE')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (planId: 'FREE' | 'PRO') => {
    setSelectedPlan(planId)
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    onComplete({ subscriptionPlan: planId })
    setLoading(false)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Choose your WaveOrder plan
        </h1>
        <p className="text-xl text-gray-600">
          Select the plan that best fits your business needs
        </p>
      </div>

      {/* Timeline for Pro Plan */}
      {selectedPlan === 'PRO' && (
        <div className="max-w-2xl mx-auto mb-8 bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-xl border border-teal-200">
          <h3 className="font-semibold text-teal-800 mb-3">Pro Plan Timeline:</h3>
          <div className="space-y-2 text-sm text-teal-700">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
              <span><strong>Today:</strong> Get Instant Access - Start your free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
              <span><strong>7 days:</strong> We'll Remind You - Get reminders before trial ends</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
              <span><strong>After trial:</strong> Billing Begins - Subscription starts automatically. Cancel anytime in settings.</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl border-2 p-8 transition-all hover:shadow-lg ${
              selectedPlan === plan.id
                ? 'border-teal-500 ring-2 ring-teal-200'
                : 'border-gray-200 hover:border-teal-300'
            } ${plan.popular ? 'ring-2 ring-teal-600' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 text-lg">{plan.price}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <button
                onClick={() => handleSubmit(plan.id as 'FREE' | 'PRO')}
                disabled={loading}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.popular
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50'
                }`}
              >
                {loading && selectedPlan === plan.id ? 'Setting up...' : plan.buttonText}
              </button>

              {plan.id === 'PRO' && (
                <p className="text-center text-sm text-gray-500">
                  You can cancel anytime
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Additional Options */}
      <div className="text-center space-y-4">
        <button
          onClick={() => handleSubmit('FREE')}
          disabled={loading}
          className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Skip for now
        </button>
      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
      </div>
    </div>
  )
}