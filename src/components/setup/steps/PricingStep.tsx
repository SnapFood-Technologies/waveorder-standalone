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
    price: '$0',
    billing: 'Forever free',
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
    price: '$12',
    billing: 'per month',
    annualPrice: '$10/mo',
    annualBilling: 'billed annually',
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
    buttonText: 'Start with Pro',
    popular: true
  }
]

export default function PricingStep({ data, onComplete, onBack }: PricingStepProps) {
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PRO'>(data.subscriptionPlan || 'FREE')
  const [loading, setLoading] = useState(false)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')

  const handleSubmit = async (planId: 'FREE' | 'PRO') => {
    setSelectedPlan(planId)
    setLoading(true)

    try {
      if (planId === 'FREE') {
        // FREE plan - no Stripe checkout needed
        // The Stripe customer and FREE subscription will be created in save-progress API
        await new Promise(resolve => setTimeout(resolve, 500))
        onComplete({ subscriptionPlan: 'FREE' })
      } else {
        // PRO plan - redirect to Stripe checkout
        const response = await fetch('/api/setup/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: 'PRO',
            isAnnual: billingInterval === 'annual'
          })
        })

        if (response.ok) {
          const { checkoutUrl } = await response.json()
          // Redirect to Stripe checkout
          window.location.href = checkoutUrl
        } else {
          throw new Error('Failed to create checkout session')
        }
      }
    } catch (error) {
      console.error('Error selecting plan:', error)
      alert('Error processing request. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Choose your WaveOrder plan
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Select the plan that best fits your business needs
        </p>

        {/* Billing Toggle for PRO plan */}
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              billingInterval === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Annual
            <span className="ml-1 text-xs text-green-600">(Save 17%)</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
        {plans.map((plan) => {
          const displayPrice = plan.id === 'PRO' && billingInterval === 'annual' 
            ? plan.annualPrice 
            : plan.price
          const displayBilling = plan.id === 'PRO' && billingInterval === 'annual'
            ? plan.annualBilling
            : plan.billing

          return (
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
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">{displayPrice}</span>
                  <span className="text-gray-600 ml-2">{displayBilling}</span>
                </div>
                {plan.id === 'PRO' && billingInterval === 'annual' && (
                  <p className="text-sm text-emerald-600 font-medium">
                    Save $24 per year
                  </p>
                )}
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
                  {loading && selectedPlan === plan.id ? 'Processing...' : plan.buttonText}
                </button>

                {plan.id === 'PRO' && (
                  <p className="text-center text-sm text-gray-500">
                    Cancel anytime, no questions asked
                  </p>
                )}

                {plan.id === 'FREE' && (
                  <p className="text-center text-sm text-gray-500">
                    No credit card required
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Skip Option */}
      <div className="text-center space-y-4">
        <button
          onClick={() => handleSubmit('FREE')}
          disabled={loading}
          className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
        >
          Skip and continue with Free plan
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