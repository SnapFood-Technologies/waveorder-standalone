'use client'

import { useState, useEffect } from 'react'
import { 
  Check, 
  Crown, 
  Loader2,
  Sparkles,
  X,
  CreditCard,
  Package,
  AlertCircle,
  AlertTriangle
} from 'lucide-react'

type Plan = 'STARTER' | 'PRO'

interface UserSubscription {
  plan: Plan
  isActive: boolean
  status: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  stripeCustomerId?: string
  subscriptionId?: string
  billingType?: 'monthly' | 'yearly' | 'free' | null
}

const PLANS = {
  STARTER: {
    name: 'Starter',
    price: 6,
    annualPrice: 5,
    description: 'Perfect for getting started',
    icon: Package,
    features: [
      'Up to 30 products',
      '10 categories',
      'Basic WhatsApp orders',
      'Mobile catalog',
      'Manual product entry',
      'Basic branding',
      'CSV import',
      'Basic order analytics',
    ]
  },
  PRO: {
    name: 'Pro',
    price: 12,
    annualPrice: 10,
    description: 'For growing businesses',
    icon: Crown,
    features: [
      'Unlimited products',
      'Unlimited categories',
      'Advanced branding (colors, logo)',
      'Advanced order analytics',
      'Inventory management',
      'Custom domains',
      'Wholesale pricing',
      'Priority support'
    ]
  }
}

interface BillingPanelProps {
  businessId: string
}

export function BillingPanel({ businessId }: BillingPanelProps) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpgrading, setIsUpgrading] = useState<Plan | null>(null)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [showDowngradeModal, setShowDowngradeModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      } else {
        setError('Failed to load subscription information')
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
      setError('Failed to load subscription information')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgrade = async (planId: Plan) => {
    if (!subscription) return

    if (planId === 'STARTER') {
      // Show downgrade confirmation modal
      setShowDowngradeModal(true)
      return
    }

    // Upgrade to PRO
    setIsUpgrading(planId)
    setError(null)
    
    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          isAnnual: billingInterval === 'annual',
          businessId: businessId
        })
      })

      if (response.ok) {
        const { checkoutUrl } = await response.json()
        window.location.href = checkoutUrl
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error upgrading plan:', error)
      setError(error instanceof Error ? error.message : 'Error processing request. Please try again.')
    } finally {
      setIsUpgrading(null)
    }
  }

  const confirmDowngrade = async () => {
    setIsUpgrading('STARTER')
    setError(null)
    setShowDowngradeModal(false)
    
    try {
      const response = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
      })

      if (response.ok) {
        await fetchSubscription()
        setShowSuccessModal(true)
      } else {
        throw new Error('Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      setError(error instanceof Error ? error.message : 'Failed to cancel subscription. Please try again.')
    } finally {
      setIsUpgrading(null)
    }
  }

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/billing/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessId })
      })

      if (response.ok) {
        const { portalUrl } = await response.json()
        window.open(portalUrl, '_blank')
      } else {
        throw new Error('Failed to create portal session')
      }
    } catch (error) {
      console.error('Error creating portal session:', error)
      setError('Error opening billing portal. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 rounded-lg h-64"></div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">Error loading subscription</h3>
            <p className="text-sm text-red-700 mt-1">
              {error || 'Unable to load subscription information. Please refresh the page.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const currentPlan = PLANS[subscription.plan]
  const price = billingInterval === 'annual' ? (PLANS.PRO.annualPrice || 12) : PLANS.PRO.price
  const savings = (PLANS.PRO.price * 12) - ((PLANS.PRO.annualPrice || 10) * 12)
  const isFreePlan = subscription.billingType === 'free'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-1">
          Manage your subscription plan and billing information
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Current Plan Status */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <currentPlan.icon className="w-6 h-6" />
              <h2 className="text-xl font-semibold">
                Current Plan: {currentPlan.name}
              </h2>
            </div>
            <p className="text-teal-100">
              {isFreePlan
                ? 'You are currently on a special free plan'
                : subscription.plan === 'STARTER' 
                ? 'You are currently on the Starter plan'
                : subscription.cancelAtPeriodEnd
                ? `Your PRO plan will end on ${subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}`
                : `Your PRO plan is active${subscription.currentPeriodEnd ? ` until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}` : ''}`
              }
            </p>
            {isFreePlan && (
              <p className="text-teal-100 text-sm mt-2">
                To change your plan, please contact our support team through the Help & Support module.
              </p>
            )}
          </div>
          {subscription.plan !== 'STARTER' && !isFreePlan && (
            <button
              onClick={handleManageBilling}
              className="bg-white/20 hover:bg-white/30 rounded-lg px-4 py-2 flex items-center gap-2 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Billing Interval Toggle */}
      {!isFreePlan && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Billing cycle:</span>
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
                billingInterval === 'annual'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs text-green-600">(Save ${savings}/year)</span>
            </button>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(PLANS).map(([key, plan]) => {
          const planKey = key as Plan
          const isCurrentPlan = subscription.plan === planKey
          const PlanIcon = plan.icon
          const displayPrice = planKey === 'PRO' 
            ? (billingInterval === 'annual' ? plan.annualPrice : plan.price)
            : (billingInterval === 'annual' ? (plan.annualPrice || plan.price) : plan.price)
          
          return (
            <div
              key={planKey}
              className={`bg-white rounded-lg border-2 p-6 ${
                isCurrentPlan ? 'border-teal-500 ring-2 ring-teal-100' : 'border-gray-200'
              }`}
            >
              {isCurrentPlan && (
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium mb-4">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Current Plan
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  planKey === 'PRO' ? 'bg-purple-100' : 'bg-gray-100'
                }`}>
                  <PlanIcon className={`w-6 h-6 ${
                    planKey === 'PRO' ? 'text-purple-600' : 'text-gray-600'
                  }`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600">{plan.description}</p>
                </div>
              </div>

              <div className="mb-6">
                {isCurrentPlan && isFreePlan ? (
                  <>
                    <span className="text-3xl font-bold text-gray-900">$0</span>
                    <span className="text-gray-600">/month</span>
                    <p className="text-sm text-gray-600 font-medium mt-1">
                      Free Plan
                    </p>
                  </>
                ) : isFreePlan ? (
                  <>
                    <span className="text-3xl font-bold text-gray-900">—</span>
                    <p className="text-sm text-gray-600 font-medium mt-1">
                      Paid pricing (contact support)
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-gray-900">${displayPrice}</span>
                    <span className="text-gray-600">/month</span>
                    {billingInterval === 'annual' && planKey === 'PRO' && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        Billed annually (${displayPrice * 12}/year)
                      </p>
                    )}
                    {billingInterval === 'annual' && planKey === 'STARTER' && (
                      <p className="text-sm text-green-600 font-medium mt-1">
                        Billed annually (${displayPrice * 12}/year) - Save $12/year
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="space-y-2.5 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {isFreePlan ? (
                <div className="w-full py-2.5 px-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-800 text-center font-medium">
                    Contact Support to Change Plan
                  </p>
                  <p className="text-xs text-blue-600 text-center mt-1">
                    Available in Help & Support
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(planKey)}
                  disabled={isCurrentPlan || isUpgrading === planKey}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    isCurrentPlan
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : planKey === 'PRO'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  } ${isUpgrading === planKey ? 'opacity-50' : ''}`}
                >
                  {isUpgrading === planKey ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : planKey === 'PRO' ? (
                    'Upgrade to PRO'
                  ) : (
                    'Downgrade to Starter'
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Feature Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feature</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Starter</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pro</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { feature: 'Products', starter: '30', pro: 'Unlimited' },
                { feature: 'Categories', starter: '10', pro: 'Unlimited' },
                { feature: 'WhatsApp Orders', starter: '✅', pro: '✅' },
                { feature: 'Basic Branding', starter: '✅', pro: '✅' },
                { feature: 'CSV Import', starter: '✅', pro: '✅' },
                { feature: 'Basic Analytics', starter: '✅', pro: '✅' },
                { feature: 'Advanced Branding', starter: '❌', pro: '✅' },
                { feature: 'Advanced Analytics', starter: '❌', pro: '✅' },
                { feature: 'Inventory Management', starter: '❌', pro: '✅' },
                { feature: 'Custom Domains', starter: '❌', pro: '✅' },
                { feature: 'Priority Support', starter: '❌', pro: '✅' },
              ].map((row, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{row.starter}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Downgrade Confirmation Modal */}
      {showDowngradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Downgrade to Starter Plan?
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              You will lose access to PRO features at the end of your billing period 
              ({subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}):
            </p>
            
            <ul className="space-y-2 mb-6">
              {['Unlimited products', 'Advanced analytics', 'Inventory management', 'Custom domains', 'Priority support'].map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDowngradeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDowngrade}
                disabled={isUpgrading === 'STARTER'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {isUpgrading === 'STARTER' ? 'Processing...' : 'Confirm Downgrade'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Subscription Canceled
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Your subscription has been canceled. You will keep access to PRO features until {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'the end of your billing period'}.
            </p>
            
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}