'use client'

import { useState, useEffect } from 'react'
import { SetupData } from '../Setup'
import { Check, ArrowLeft, Sparkles, Zap, Building2, CheckCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

// Helper to log client-side errors
const logClientError = async (logType: string, errorMessage: string, metadata?: Record<string, any>) => {
  try {
    await fetch('/api/log/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logType,
        severity: 'error',
        errorMessage,
        metadata,
        url: window.location.href
      })
    })
  } catch (e) {
    console.error('Failed to log error:', e)
  }
}

interface PricingStepProps {
  data: SetupData
  onComplete: (data: Partial<SetupData>) => void
  onBack: () => void
}

type PlanId = 'STARTER' | 'PRO' | 'BUSINESS'

const plans = [
  {
    id: 'STARTER' as PlanId,
    name: 'Starter',
    monthlyPrice: 19,
    yearlyPrice: 16,
    description: 'Perfect for getting started',
    features: [
      'Up to 50 products',
      '1 store/catalog',
      'Basic analytics',
      'WhatsApp ordering',
      'CSV import',
      'Email support',
    ],
    buttonText: 'Subscribe to Starter',
    popular: false,
    icon: Sparkles
  },
  {
    id: 'PRO' as PlanId,
    name: 'Pro',
    monthlyPrice: 39,
    yearlyPrice: 32,
    description: 'For growing businesses',
    features: [
      'Unlimited products',
      'Up to 5 stores/catalogs',
      'Full analytics & insights',
      'Delivery scheduling',
      'Customer insights',
      'Priority support',
    ],
    buttonText: 'Subscribe to Pro',
    popular: true,
    icon: Zap
  },
  {
    id: 'BUSINESS' as PlanId,
    name: 'Business',
    monthlyPrice: 79,
    yearlyPrice: 66,
    description: 'For teams & enterprises',
    features: [
      'Everything in Pro',
      'Unlimited stores/catalogs',
      'Team access (5 users)',
      'Custom domain',
      'API access',
      'Dedicated support',
    ],
    buttonText: 'Subscribe to Business',
    popular: false,
    icon: Building2
  }
]

export default function PricingStep({ data, onComplete, onBack }: PricingStepProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'subscribe' | 'trial' | null>(null)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [trialAlreadyUsed, setTrialAlreadyUsed] = useState(false)
  const [checkingTrialStatus, setCheckingTrialStatus] = useState(true)

  // Check if user already has an active trial on mount
  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        const response = await fetch('/api/setup/check-trial-status')
        if (response.ok) {
          const data = await response.json()
          setTrialAlreadyUsed(data.trialUsed || data.hasActiveTrial)
        }
      } catch (error) {
        console.error('Error checking trial status:', error)
      } finally {
        setCheckingTrialStatus(false)
      }
    }
    checkTrialStatus()
  }, [])

  // Handle subscribing to a paid plan (redirects to Stripe checkout)
  const handleSubscribe = async (planId: PlanId) => {
    setSelectedPlan(planId)
    setLoading(true)
    setLoadingAction('subscribe')

    try {
      const response = await fetch('/api/setup/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planId,
          isAnnual: billingInterval === 'annual'
        })
      })

      if (response.ok) {
        const { checkoutUrl } = await response.json()
        window.location.href = checkoutUrl
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      // Log to system logs
      logClientError('checkout_error', errorMsg, { 
        planId, 
        billingInterval,
        step: 'pricing'
      })
      
      toast.error('Error processing request. Please try again.')
      setLoading(false)
      setLoadingAction(null)
    }
  }

  // Handle starting a free trial (14 days Pro features via Stripe)
  const handleStartTrial = async () => {
    setLoading(true)
    setLoadingAction('trial')

    try {
      const response = await fetch('/api/setup/start-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        // Trial started successfully, proceed to next step
        onComplete({ subscriptionPlan: 'PRO' })
      } else {
        const data = await response.json()
        throw new Error(data.message || 'Failed to start trial')
      }
    } catch (error) {
      console.error('Error starting trial:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      
      // Log to system logs for SuperAdmin visibility
      logClientError('trial_start_error', errorMsg, { 
        step: 'pricing',
        action: 'start_trial'
      })
      
      toast.error('Error starting trial. Please try again.')
      setLoading(false)
      setLoadingAction(null)
    }
  }

  const getDisplayPrice = (plan: typeof plans[0]) => {
    return billingInterval === 'annual' ? plan.yearlyPrice : plan.monthlyPrice
  }

  const getYearlySavings = (plan: typeof plans[0]) => {
    return (plan.monthlyPrice - plan.yearlyPrice) * 12
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Toaster position="top-center" />
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Choose your WaveOrder plan
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          Select the plan that best fits your business needs
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex bg-gray-100 rounded-lg p-1 mb-4">
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
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors relative ${
              billingInterval === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs text-emerald-600 font-semibold">(Save 17%)</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
        {plans.map((plan) => {
          const IconComponent = plan.icon
          const price = getDisplayPrice(plan)
          const savings = getYearlySavings(plan)

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${
                selectedPlan === plan.id
                  ? 'border-teal-500 ring-2 ring-teal-200'
                  : 'border-gray-200 hover:border-teal-300'
              } ${plan.popular ? 'ring-2 ring-teal-600 md:scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                  plan.popular 
                    ? 'bg-teal-100 text-teal-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">${price}</span>
                  <span className="text-gray-600 ml-1">/mo</span>
                </div>
                {billingInterval === 'annual' && (
                  <p className="text-sm text-gray-500">
                    Billed yearly (${plan.yearlyPrice * 12}/yr)
                  </p>
                )}
                {billingInterval === 'annual' && savings > 0 && (
                  <p className="text-sm text-emerald-600 font-medium mt-1">
                    Save ${savings} per year
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-700 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  plan.popular
                    ? 'bg-teal-600 text-white hover:bg-teal-700'
                    : 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50'
                }`}
              >
                {loading && loadingAction === 'subscribe' && selectedPlan === plan.id 
                  ? 'Processing...' 
                  : plan.buttonText}
              </button>
            </div>
          )
        })}
      </div>

      {/* Free Trial Option */}
      <div className="max-w-2xl mx-auto mb-8">
        {trialAlreadyUsed ? (
          /* Trial Already Active - Show proceed message */
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 p-6 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <CheckCircle className="w-4 h-4" />
              Free Trial Already Active
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              You already have a free trial!
            </h3>
            <p className="text-gray-600 mb-4">
              Your Pro trial is active. Continue to the next step to complete your setup.
            </p>
            <button
              onClick={() => onComplete({ subscriptionPlan: 'PRO' })}
              disabled={loading}
              className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Next Step →
            </button>
          </div>
        ) : (
          /* Normal Trial Option */
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 p-6 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              14-Day Free Trial - No Credit Card Required
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Not ready to commit? Try Pro features free
            </h3>
            <p className="text-gray-600 mb-4">
              Get full access to all Pro features for 14 days. No credit card needed.
              After the trial, you'll be downgraded to Starter limits unless you subscribe.
            </p>
            <button
              onClick={handleStartTrial}
              disabled={loading || checkingTrialStatus}
              className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingTrialStatus
                ? 'Checking...'
                : loading && loadingAction === 'trial' 
                  ? 'Starting Trial...' 
                  : 'Skip - Start 14-Day Free Trial'}
            </button>
          </div>
        )}
      </div>

      {/* Back button */}
      <div className="flex justify-start max-w-6xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
      </div>
    </div>
  )
}