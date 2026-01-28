// src/components/site/Pricing.tsx
'use client'

import Link from 'next/link'
import { CheckCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      name: "Starter",
      monthlyPrice: 19,
      yearlyPrice: 16,
      description: "Perfect for getting started",
      features: [
        "Up to 50 products",
        "1 store/catalog",
        "Basic analytics",
        "WhatsApp ordering",
        "CSV import",
        "Email support",
      ],
      buttonText: "Start Free Trial",
      buttonStyle: "border-2 border-gray-300 text-gray-700 hover:bg-gray-50",
      planId: "STARTER"
    },
    {
      name: "Pro",
      monthlyPrice: 39,
      yearlyPrice: 32,
      description: "For growing businesses",
      features: [
        "Unlimited products",
        "Up to 5 stores/catalogs",
        "Full analytics & insights",
        "Delivery scheduling",
        "Customer insights",
        "Priority support",
      ],
      buttonText: "Start Free Trial",
      buttonStyle: "bg-teal-600 text-white hover:bg-teal-700",
      popular: true,
      planId: "PRO"
    },
    {
      name: "Business",
      monthlyPrice: 79,
      yearlyPrice: 66,
      description: "For teams & enterprises",
      features: [
        "Everything in Pro",
        "Unlimited stores/catalogs",
        "Team access (5 users)",
        "Custom domain",
        "API access",
        "Dedicated support",
      ],
      buttonText: "Start Free Trial",
      buttonStyle: "border-2 border-teal-600 text-teal-600 hover:bg-teal-50",
      planId: "BUSINESS"
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-4">
            Choose the plan that fits your business needs
          </p>
          
          {/* Free Trial Badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            14-day free trial on all plans - No credit card required
          </div>
          
          {/* Billing Toggle */}
          <div className="inline-flex bg-gray-200 rounded-lg p-1">
            <button
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setBillingCycle('yearly')}
            >
              Yearly (Save 17%)
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl shadow-lg p-8 relative ${
                plan.popular ? 'ring-2 ring-teal-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                  </span>
                  <span className="text-gray-600 ml-2">
                    {`/mo${billingCycle === 'yearly' ? ' (billed yearly)' : ''}`}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-emerald-600 font-medium">
                    Save ${(plan.monthlyPrice - plan.yearlyPrice) * 12} per year
                  </p>
                )}
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-teal-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="space-y-3">
                <Link
                  href={`/auth/register?plan=${plan.planId}`}
                  className={`block text-center px-6 py-3 rounded-lg font-semibold transition-colors ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </Link>
                
                <p className="text-center text-sm text-gray-500">
                  14 days free, then ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}/mo
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            All plans include WhatsApp ordering, mobile-optimized storefront, and basic support.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Need a custom solution?{' '}
            <Link href="/contact" className="text-teal-600 hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}