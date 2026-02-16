'use client'

import { useState, useEffect } from 'react'
import { SetupData } from '../Setup'
import { Check, ArrowLeft, Sparkles, Zap, Building2, CheckCircle, HelpCircle, ArrowRight, X } from 'lucide-react'
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

const getPlans = (businessType?: string) => {
  const isSalon = businessType === 'SALON'
  
  return [
    {
      id: 'STARTER' as PlanId,
      name: 'Starter',
      monthlyPrice: 19,
      yearlyPrice: 16,
      description: 'Perfect for getting started',
      features: isSalon ? [
        'Up to 50 services',
        '1 store/catalog',
        'Basic analytics',
        'WhatsApp booking',
        'Appointment management',
        'Email support',
      ] : [
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
      features: isSalon ? [
        'Unlimited services',
        'Up to 5 stores/catalogs',
        'Full analytics & insights',
        'Appointment calendar view',
        'Staff assignment',
        'Customer insights',
        'Priority support',
      ] : [
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
      features: isSalon ? [
        'Everything in Pro',
        'Unlimited stores/catalogs',
        'Team access (5 users)',
        'Staff availability management',
        'Custom domain',
        'API access',
        'Dedicated support',
      ] : [
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
}

export default function PricingStep({ data, onComplete, onBack }: PricingStepProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingAction, setLoadingAction] = useState<'subscribe' | 'trial' | null>(null)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [trialAlreadyUsed, setTrialAlreadyUsed] = useState(false)
  const [checkingTrialStatus, setCheckingTrialStatus] = useState(true)
  const [showSalonModal, setShowSalonModal] = useState(false)
  const [salonModalBillingCycle, setSalonModalBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  
  const plans = getPlans(data.businessType)
  const isSalon = data.businessType === 'SALON'

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

      {/* Glossary Section - Only show for non-salon businesses */}
      {!isSalon && (
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Same Pricing for All Business Types
              </h3>
              <p className="text-gray-600">
                Whether you offer products or services, our pricing stays the same
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <HelpCircle className="w-6 h-6 text-blue-600 mt-0.5" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Don't Offer Products? Offering Services Instead?
                  </h4>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    If your business offers <strong>services</strong> (like salons, spas, beauty studios, or professional services) instead of physical products, the same pricing plans apply. Simply think of:
                  </p>
                  <ul className="mt-4 space-y-2 text-gray-700">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span><strong>"Services"</strong> instead of "Products"</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span><strong>"WhatsApp Booking"</strong> instead of "WhatsApp Ordering"</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span><strong>"Appointments"</strong> instead of "Orders"</span>
                    </li>
                  </ul>
                  <p className="mt-4 text-gray-700 leading-relaxed">
                    All features, limits, and pricing remain exactly the same. The platform adapts to your business type automatically.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowSalonModal(true)}
                      className="text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center"
                    >
                      Learn more about how pricing works for salons
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salon Pricing Modal */}
      {showSalonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowSalonModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-emerald-50">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Pricing for Salons & Beauty Businesses</h3>
                <p className="text-gray-600 mt-1">Specialized features designed specifically for salons, spas, and beauty studios</p>
              </div>
              <button
                onClick={() => setShowSalonModal(false)}
                className="p-2 hover:bg-white hover:bg-opacity-80 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Billing Toggle */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex bg-gray-200 rounded-lg p-1">
                  <button
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      salonModalBillingCycle === 'monthly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setSalonModalBillingCycle('monthly')}
                  >
                    Monthly
                  </button>
                  <button
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                      salonModalBillingCycle === 'yearly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setSalonModalBillingCycle('yearly')}
                  >
                    Yearly (Save 17%)
                  </button>
                </div>
              </div>

              {/* Salon Plans */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Starter Plan */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                  <div className="text-center mb-6">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">Starter</h4>
                    <p className="text-gray-600 mb-4">Perfect for getting started</p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        ${salonModalBillingCycle === 'monthly' ? 19 : 16}
                      </span>
                      <span className="text-gray-600 ml-2">
                        {`/mo${salonModalBillingCycle === 'yearly' ? ' (billed yearly)' : ''}`}
                      </span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Up to 50 services</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">1 store/catalog</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Appointment management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">WhatsApp booking</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Basic analytics</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Email support</span>
                    </li>
                  </ul>
                </div>

                {/* Pro Plan */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-teal-200 ring-4 ring-teal-100 p-6 relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                  
                  <div className="text-center mb-6">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">Pro</h4>
                    <p className="text-gray-600 mb-4">For growing businesses</p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        ${salonModalBillingCycle === 'monthly' ? 39 : 32}
                      </span>
                      <span className="text-gray-600 ml-2">
                        {`/mo${salonModalBillingCycle === 'yearly' ? ' (billed yearly)' : ''}`}
                      </span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Unlimited services</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Up to 5 stores/catalogs</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Appointment calendar view</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Staff assignment</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Advanced analytics & insights</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Discount codes</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Customer insights</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Priority support</span>
                    </li>
                  </ul>
                </div>

                {/* Business Plan */}
                <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
                  <div className="text-center mb-6">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">Business</h4>
                    <p className="text-gray-600 mb-4">For teams & enterprises</p>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        ${salonModalBillingCycle === 'monthly' ? 79 : 66}
                      </span>
                      <span className="text-gray-600 ml-2">
                        {`/mo${salonModalBillingCycle === 'yearly' ? ' (billed yearly)' : ''}`}
                      </span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Everything in Pro</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Unlimited stores/catalogs</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Team access (5 users)</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Staff availability management</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Custom domain</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">API access</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">Dedicated support</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="mt-8 grid md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h5 className="font-semibold text-gray-900 mb-2">Service Management</h5>
                  <p className="text-gray-600 text-sm">List your services with duration, pricing, and add-ons. Organize by categories like Hair, Nails, Spa, and more.</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h5 className="font-semibold text-gray-900 mb-2">Appointment Booking</h5>
                  <p className="text-gray-600 text-sm">Clients can book appointments directly through your storefront. Manage appointments, track status, and view calendar (Pro+).</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h5 className="font-semibold text-gray-900 mb-2">Staff Management</h5>
                  <p className="text-gray-600 text-sm">Assign staff to services and appointments. Manage working hours and availability (Business plan).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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