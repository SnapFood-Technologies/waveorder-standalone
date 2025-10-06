// src/components/site/Resources.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Minus, BookOpen, HelpCircle, Search, MessageSquare, Zap, Shield, Users, Settings, ArrowRight } from 'lucide-react'

export default function Resources() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const faqs = [
    {
      category: "Getting Started",
      icon: Zap,
      questions: [
        {
          question: "How quickly can I set up my WhatsApp ordering system?",
          answer: "Most businesses have their catalog live within 30 minutes using our setup wizard. You can add products manually, upload via CSV, or integrate with existing systems. The platform guides you through each step with live previews."
        },
        {
          question: "Do I need WhatsApp Business API?",
          answer: "No! WaveOrder works with your regular WhatsApp or WhatsApp Business number. Orders come directly to your existing WhatsApp without any expensive API setup or monthly fees."
        },
        {
          question: "What's included in the free plan?",
          answer: "The free plan includes up to 30 products, 10 categories, basic WhatsApp orders, mobile catalog, manual product entry, basic branding, CSV import, and basic order analytics. Perfect for getting started."
        },
        {
          question: "Can I import my existing menu?",
          answer: "Yes! You can upload your menu via CSV file, add items manually through our dashboard, or use our API for advanced integrations. We also provide sample CSV templates to get you started quickly."
        }
      ]
    },
    {
      category: "Orders & Customers",
      icon: MessageSquare,
      questions: [
        {
          question: "How do customers place orders?",
          answer: "Customers browse your online catalog, select items, and click 'Order via WhatsApp'. This opens WhatsApp with a pre-formatted order message ready to send to your business number."
        },
        {
          question: "What information do I receive with each order?",
          answer: "You receive formatted WhatsApp messages with customer details, order items with quantities and prices, delivery preferences, payment method, special requests, and total amount."
        },
        {
          question: "Can I track order status?",
          answer: "Yes! Use your dashboard to update order status (confirmed, preparing, ready, delivered) and customers can see updates. You can also send status updates via WhatsApp to keep customers informed."
        },
        {
          question: "How do I handle delivery and pickup orders?",
          answer: "Configure delivery zones, fees, and estimated times in your settings. Customers can choose delivery or pickup when ordering. You'll receive all delivery details including addresses in the WhatsApp message."
        }
      ]
    },
    {
      category: "Team & Management",
      icon: Users,
      questions: [
        {
          question: "Can I invite team members to help manage orders?",
          answer: "Yes! WaveOrder supports multiple team members with different roles (Owner, Manager, Staff). Invite team members via email and assign appropriate permissions for order management and catalog updates."
        },
        {
          question: "What are the different user roles?",
          answer: "Owner has full access, Manager can manage products and orders but not billing/settings, and Staff can view and update order status. Each role is designed for restaurant team collaboration."
        },
        {
          question: "How do I manage inventory?",
          answer: "Toggle items on/off when out of stock, set stock levels for tracking, and get low stock alerts. Your team can update inventory in real-time through the dashboard or mobile app."
        }
      ]
    },
    {
      category: "Customization & Branding",
      icon: Settings,
      questions: [
        {
          question: "How can I customize my catalog's appearance?",
          answer: "Upload your logo, set brand colors, choose themes, customize the layout, and add your business information. Your catalog will maintain your brand identity across all customer touchpoints."
        },
        {
          question: "Can I use my own domain name?",
          answer: "Yes! Premium plans include custom domain support. You can use yourrestaurant.com instead of waveorder.app/yourrestaurant for a more professional appearance."
        },
        {
          question: "How do I organize my menu categories?",
          answer: "Create unlimited categories, set display order, add category descriptions and images, and organize products logically. Customers can easily browse through well-organized menus."
        }
      ]
    },
    {
      category: "Pricing & Billing",
      icon: Shield,
      questions: [
        {
          question: "What payment methods can I accept?",
          answer: "Configure cash on delivery, bank transfers, and integrate with payment gateways like Stripe and PayPal. Regional payment methods are supported based on your location."
        },
        {
          question: "Are there any commission fees?",
          answer: "No! WaveOrder doesn't charge commission on your orders. You pay only the subscription fee and keep 100% of your order revenue."
        },
        {
          question: "Can I change or cancel my plan anytime?",
          answer: "Yes, you can upgrade, downgrade, or cancel your subscription at any time from your account settings. Changes take effect at the next billing cycle."
        }
      ]
    }
  ]

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Help Center & Resources
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Find answers to common questions, learn best practices, and get the most out of your 
              WaveOrder WhatsApp ordering system.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search frequently asked questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Help Section */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/contact" className="group bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-teal-200 hover:shadow-md transition-all">
              <MessageSquare className="w-8 h-8 text-teal-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-teal-600">Contact Support</h3>
              <p className="text-gray-600 text-sm">Get personal help from our support team</p>
            </Link>
            
            <Link href="/demo" className="group bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-teal-200 hover:shadow-md transition-all">
              <Zap className="w-8 h-8 text-teal-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-teal-600">Try Demo</h3>
              <p className="text-gray-600 text-sm">See WaveOrder in action with live examples</p>
            </Link>
            
            <Link href="/auth/register" className="group bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-teal-200 hover:shadow-md transition-all">
              <ArrowRight className="w-8 h-8 text-teal-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-teal-600">Get Started</h3>
              <p className="text-gray-600 text-sm">Start free and set up in minutes</p>
            </Link>
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
              Find answers to the most common questions about WaveOrder
            </p>
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No results found</h3>
              <p className="text-gray-500">Try different search terms or browse all categories</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredFaqs.map((category, categoryIndex) => {
                const IconComponent = category.icon
                return (
                  <div key={categoryIndex} className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mr-3">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{category.category}</h3>
                        <span className="ml-auto text-sm text-gray-500">
                          {category.questions.length} questions
                        </span>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                      {category.questions.map((faq, faqIndex) => {
                        const globalIndex = categoryIndex * 100 + faqIndex
                        const isOpen = openFaq === globalIndex
                        
                        return (
                          <div key={faqIndex}>
                            <button
                              className="w-full px-6 py-6 text-left hover:bg-gray-50 transition-colors"
                              onClick={() => setOpenFaq(isOpen ? null : globalIndex)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                                  isOpen ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {isOpen ? (
                                    <Minus className="w-4 h-4" />
                                  ) : (
                                    <Plus className="w-4 h-4" />
                                  )}
                                </div>
                              </div>
                            </button>
                            
                            <div className={`overflow-hidden transition-all duration-200 ${
                              isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                            }`}>
                              <div className="px-6 pb-6">
                                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Blog Section Placeholder */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Guides & Best Practices
            </h2>
            <p className="text-xl text-gray-600">
              Coming soon: In-depth guides and best practices for WhatsApp ordering
            </p>
          </div>

          <div className="bg-white border-2 border-gray-200 border-dashed rounded-2xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Blog & Guides Coming Soon
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              We're working on comprehensive guides covering WhatsApp ordering best practices, 
              marketing strategies, and success stories from restaurant owners using WaveOrder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                Request a Guide Topic
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center px-6 py-3 border-2 border-teal-600 text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-colors"
              >
                Start Learning by Doing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Still Need Help?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Our support team is here to help you succeed with WhatsApp ordering. 
            Get personalized assistance and answers to your specific questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Contact Support Team
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center px-8 py-4 border-2 border-teal-600 text-teal-600 text-lg font-semibold rounded-lg hover:bg-teal-50 transition-colors"
            >
              Check our Video Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}