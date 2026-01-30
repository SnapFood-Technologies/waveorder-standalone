// src/components/site/FAQ.tsx
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Plus, MessageSquare } from 'lucide-react'

interface FAQProps {
  showContactSection?: boolean
}

export default function FAQ({ showContactSection = true }: FAQProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0) // First one open by default
  const pathname = usePathname()
  
  // Don't show contact section if we're on the contact page or if explicitly disabled
  const shouldShowContact = showContactSection && pathname !== '/contact'

  const faqs = [
    {
      question: "Do I need WhatsApp Business API?",
      answer: "No! WaveOrder works with your regular WhatsApp or WhatsApp Business app. Orders come directly to your existing number without any API setup, verification, or per-message fees."
    },
    {
      question: "How do customers place orders?",
      answer: "Customers browse your online catalog, select items, and click 'Order via WhatsApp'. This opens WhatsApp with a pre-formatted order message ready to send to you. Simple and familiar for everyone."
    },
    {
      question: "Can I use this with my Instagram bio link?",
      answer: "Absolutely! WaveOrder is perfect as a link-in-bio store. Share your catalog link in your Instagram bio, stories, or posts. Followers can browse your products and order directly through WhatsApp."
    },
    {
      question: "What payment methods are supported?",
      answer: "You can accept cash on delivery, bank transfers, or integrate with payment gateways like Stripe and PayPal. You handle payments directly with your customers — we don't take any cut."
    },
    {
      question: "How quickly can I get started?",
      answer: "Most businesses have their catalog live within 5 minutes. Just sign up, add your products (manually or via CSV import), connect your WhatsApp number, and share your link. No technical knowledge required."
    },
    {
      question: "Can I manage multiple stores?",
      answer: "Yes! Pro and Business plans support multiple catalogs. Create separate catalogs for different locations, brands, or product lines — each with its own link and settings."
    }
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about WaveOrder.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index
            
            return (
              <div 
                key={index} 
                className="bg-white rounded-2xl overflow-hidden"
              >
                <button
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isOpen ? 'bg-teal-600 text-white rotate-45' : 'bg-gray-100 text-teal-600'
                  }`}>
                    <Plus className="w-5 h-5" />
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Contact section - only show if not on contact page */}
        {shouldShowContact && (
          <div className="mt-12 text-center">
            <div className="bg-white p-8 rounded-2xl border border-gray-200">
              <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Still have questions?
              </h3>
              <p className="text-gray-600 mb-6">
                Our support team is here to help you get started with WhatsApp ordering.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/contact"
                  className="px-6 py-3 bg-teal-600 text-white font-medium rounded-full hover:bg-teal-700 transition-colors"
                >
                  Contact Support
                </Link>
                <Link 
                  href="/demo"
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-colors"
                >
                  Schedule Demo
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
