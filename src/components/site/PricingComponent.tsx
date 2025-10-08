// src/components/site/PricingComponent.tsx
'use client'

import Link from 'next/link'
import { CheckCircle, ArrowRight, Star, Zap, Shield, Users, Globe, CreditCard, MessageSquare, HelpCircle, Award } from 'lucide-react'
import { useState } from 'react'

export default function PricingComponent() {
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
      buttonStyle: "border-2 border-gray-300 text-gray-700 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50",
      icon: MessageSquare,
      highlight: "Always Free",
      popular: false
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
      buttonStyle: "bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:from-teal-600 hover:to-emerald-600 shadow-lg hover:shadow-xl",
      icon: Zap,
      highlight: "Most Popular",
      popular: true
    }
  ]

  const features = [
    {
      icon: Shield,
      title: "No Setup Fees",
      description: "Get started immediately without any upfront costs"
    },
    {
      icon: CreditCard,
      title: "Cancel Anytime",
      description: "No long-term contracts or cancellation fees"
    },
    {
      icon: Users,
      title: "Unlimited Team",
      description: "Add as many team members as you need"
    },
    {
      icon: Globe,
      title: "Works Worldwide",
      description: "Available in all countries with WhatsApp"
    }
  ]

  const faqs = [
    {
      question: "Is the Free plan really free forever?",
      answer: "Yes! Our Free plan includes core WhatsApp ordering features for up to 30 products and will always be free. It's perfect for small businesses getting started."
    },
    {
      question: "Can I upgrade or downgrade anytime?",
      answer: "Absolutely! You can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at your next billing cycle."
    },
    {
      question: "Do you charge transaction fees?",
      answer: "No, we never charge transaction fees or commissions on your orders. You keep 100% of your revenue."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards and payments are processed securely through Stripe."
    }
  ]

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return 0
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
  }

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return 0
    return (plan.monthlyPrice * 12) - (plan.yearlyPrice * 12)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Choose the plan that fits your business needs. Start free and upgrade when you're ready. 
              No hidden fees, no setup costs, no transaction fees.
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex bg-white rounded-xl p-1 shadow-lg border border-gray-200">
              <button
                className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-8 py-3 rounded-lg text-sm font-semibold transition-all relative ${
                  billingCycle === 'yearly'
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setBillingCycle('yearly')}
              >
                Yearly
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 17%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon
              const price = getPrice(plan)
              const savings = getSavings(plan)
              
              return (
                <div
                  key={index}
                  className={`relative bg-white rounded-3xl shadow-xl border-2 p-8 ${
                    plan.popular 
                      ? 'border-teal-200 ring-4 ring-teal-100 lg:scale-105' 
                      : 'border-gray-200'
                  } hover:shadow-2xl transition-all duration-300`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center">
                        <Star className="w-4 h-4 mr-1" />
                        {plan.highlight}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    
                    <div className="mb-6">
                      <div className="flex items-baseline justify-center">
                        <span className="text-5xl font-bold text-gray-900">
                          ${price}
                        </span>
                        <span className="text-gray-600 ml-2">
                          {price === 0 ? 'forever' : `per month${billingCycle === 'yearly' ? ' (billed yearly)' : ''}`}
                        </span>
                      </div>
                      {billingCycle === 'yearly' && savings > 0 && (
                        <p className="text-sm text-emerald-600 font-medium mt-2">
                          Save ${savings} per year
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="space-y-4">
                    <Link
                      href="/auth/register"
                      className={`block text-center px-6 py-4 rounded-xl font-semibold transition-all transform hover:-translate-y-0.5 ${plan.buttonStyle}`}
                    >
                      {plan.buttonText}
                      <ArrowRight className="w-5 h-5 ml-2 inline" />
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
              )
            })}
          </div>

          {/* Feature Highlights */}
          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-200">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Need Something Custom?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Large businesses, franchises, or unique requirements? We offer custom solutions 
              with dedicated support, advanced integrations, and tailored features.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg"
              >
                Contact Sales
              </Link>
              <Link
                href="/demo"
                className="px-8 py-4 border-2 border-purple-500 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-colors"
              >
                Schedule Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <HelpCircle className="w-6 h-6 text-teal-600 mr-3" />
                  {faq.question}
                </h3>
                <p className="text-gray-700 leading-relaxed pl-9">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Still have questions?</p>
            <Link
              href="/contact"
              className="inline-flex items-center text-teal-600 font-semibold hover:text-teal-700"
            >
              Contact our support team
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your WhatsApp Orders?
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Join businesses worldwide who are streamlining their operations and growing their revenue with WaveOrder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-white text-teal-600 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-xl hover:bg-white hover:text-teal-600 transition-colors"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}