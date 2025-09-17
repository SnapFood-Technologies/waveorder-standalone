// src/components/site/FAQ.tsx
'use client'

import { useState } from 'react'
import { Plus, Minus, MessageSquare, CreditCard, Menu, Shield, Palette, Package } from 'lucide-react'

export default function FAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      question: "Do I need WhatsApp Business API?",
      answer: "No! WaveOrder works with your regular WhatsApp or WhatsApp Business number. Orders come directly to your existing WhatsApp without any expensive API setup.",
      icon: MessageSquare,
      iconColor: "bg-teal-100 text-teal-600"
    },
    {
      question: "How do customers place orders?",
      answer: "Customers browse your online catalog, select items, and click 'Order via WhatsApp'. This opens WhatsApp with a pre-formatted order message ready to send to you.",
      icon: MessageSquare,
      iconColor: "bg-emerald-100 text-emerald-600"
    },
    {
      question: "How do I add my menu items?",
      answer: "You can add products manually through our dashboard, upload your entire menu via CSV file, or integrate with your existing systems through our API (Upon Request).",
      icon: Menu,
      iconColor: "bg-blue-100 text-blue-600"
    },
    {
      question: "What payment methods are supported?",
      answer: "You can accept cash on delivery, bank transfers, or integrate with payment gateways like Stripe, PayPal, and Others depending on your region.",
      icon: CreditCard,
      iconColor: "bg-purple-100 text-purple-600"
    },
    {
      question: "Can I customize my catalog design?",
      answer: "Yes! You can customize your catalog with your business's colors, logo, and branding to create a professional experience that matches your brand.",
      icon: Palette,
      iconColor: "bg-orange-100 text-orange-600"
    },
    {
      question: "Is there inventory management?",
      answer: "Yes, you can track inventory levels and toggle items on/off when they're out of stock. Our dashboard shows you real-time inventory status.",
      icon: Package,
      iconColor: "bg-yellow-100 text-yellow-600"
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 text-teal-600 rounded-full mb-6">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about WhatsApp ordering
          </p>
        </div>

        <div className="space-y-6">
          {faqs.map((faq, index) => {
            const IconComponent = faq.icon
            const isOpen = openFaq === index
            
            return (
              <div 
                key={index} 
                className={`bg-white border-2 rounded-xl transition-all duration-200 ${
                  isOpen ? 'border-teal-200 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <button
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors rounded-xl"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${faq.iconColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-gray-900 text-lg">{faq.question}</span>
                  </div>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isOpen ? 'bg-teal-600 text-white rotate-180' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isOpen ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-6 pb-6 pl-22">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Contact section at bottom */}
        <div className="mt-16 text-center">
          <div className="bg-white p-8 rounded-xl border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Our support team is here to help you get started with WhatsApp ordering.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact"
                className="px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                Contact Support
              </a>
              <a 
                href="/demo"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Schedule Demo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}