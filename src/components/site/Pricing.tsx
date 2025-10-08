// src/components/site/Pricing.tsx
'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { useState } from 'react'

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      name: "Free",
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: "Perfect for getting started",
      features: [
        "Up to 30 products",
        "10 categories",
        "Basic WhatsApp orders",
        "Mobile catalog",
        "Manual product entry",
        "Basic branding",
        "CSV import",
        "Basic order analytics",
      ],
      buttonText: "Start Free",
      buttonStyle: "border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
    },
    {
      name: "Pro",
      monthlyPrice: 12,
      yearlyPrice: 10,
      description: "For growing businesses",
      features: [
        "Unlimited products",
        "Unlimited categories",
        "Advanced branding (colors, logo)",
        "Advanced order analytics",
        "Inventory management",
        "Custom domains",
        "Wholesale pricing",
        "Priority support"
      ],
      buttonText: "Get Started",
      buttonStyle: "bg-teal-600 text-white hover:bg-teal-700",
      popular: true
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Choose the plan that fits your business needs
          </p>
          
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
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
                    {plan.monthlyPrice === 0 ? 'forever' : `per month${billingCycle === 'yearly' ? ' (billed yearly)' : ''}`}
                  </span>
                </div>
                {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                  <p className="text-sm text-emerald-600 font-medium">
                    Save ${(plan.monthlyPrice * 12) - (plan.yearlyPrice * 12)} per year
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
                  href={plan.name === 'Free' ? '/auth/register' : '/auth/register'}
                  className={`block text-center px-6 py-3 rounded-lg font-semibold transition-colors ${plan.buttonStyle}`}
                >
                  {plan.buttonText}
                </Link>
                
                {plan.name === 'Free' && (
                  <p className="text-center text-sm text-gray-500">
                    No credit card required
                  </p>
                )}
                
                {plan.popular && (
                  <p className="text-center text-sm text-gray-500">
                    Cancel anytime, no questions asked
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}