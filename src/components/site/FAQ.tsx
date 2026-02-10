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
      question: "What industries does WaveOrder support?",
      answer: "WaveOrder is built for restaurants, cafes, retail stores, grocery shops, jewelry stores, florists, salons & beauty studios, and Instagram sellers. Each business type gets a tailored storefront experience with features designed for their specific needs."
    },
    {
      question: "Do I need WhatsApp Business API?",
      answer: "No! WaveOrder works with your regular WhatsApp or WhatsApp Business app. Orders come directly to your existing number without any API setup, verification, or per-message fees."
    },
    {
      question: "How do customers place orders?",
      answer: "Customers browse your mobile-optimized storefront, add items to their cart, and place an order via WhatsApp or directly through your store. You receive the order instantly and can manage it from your admin dashboard."
    },
    {
      question: "What are the plans and pricing?",
      answer: "We offer three plans: Starter ($19/mo or $16/mo yearly) with up to 50 products and 1 store, Pro ($39/mo or $32/mo yearly) with unlimited products, up to 5 stores, and full analytics, and Business ($79/mo or $66/mo yearly) with unlimited stores, team access, custom domains, and API access. All plans include a free trial."
    },
    {
      question: "Can I use this with my Instagram bio link?",
      answer: "Absolutely! WaveOrder is perfect as a link-in-bio store. Share your catalog link in your Instagram bio, stories, or posts. Followers can browse your products and order directly through WhatsApp."
    },
    {
      question: "What payment methods are supported?",
      answer: "You can accept cash on delivery, bank transfers, or integrate with payment gateways like Stripe. You handle payments directly with your customers — we don't take any commission or cut from your sales."
    },
    {
      question: "Can I manage multiple stores?",
      answer: "Yes! Pro plan supports up to 5 stores and Business plan offers unlimited stores. Create separate catalogs for different locations, brands, or product lines — each with its own link, branding, and settings."
    },
    {
      question: "What features are included?",
      answer: "All plans include WhatsApp ordering, mobile-optimized storefronts, custom branding, CSV product import, multi-language support, and analytics. Higher plans add delivery scheduling, inventory management, team collaboration, custom domains, and REST API access."
    },
    {
      question: "How quickly can I get started?",
      answer: "Most businesses have their storefront live within 5 minutes. Just sign up, add your products (manually or via CSV import), connect your WhatsApp number, customize your branding, and share your link. No technical knowledge required."
    },
    {
      question: "Do you support multiple languages?",
      answer: "Yes! WaveOrder supports multiple languages for your storefront including English, Albanian, Greek, Spanish, Italian, French, German, Portuguese, and more. Your customers can browse your store in their preferred language."
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
                  isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
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
