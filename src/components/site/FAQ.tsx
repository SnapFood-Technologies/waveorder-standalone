// src/components/site/FAQ.tsx
'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

export default function FAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      question: "Do I need WhatsApp Business API?",
      answer: "No! WaveOrder works with your regular WhatsApp or WhatsApp Business number. Orders come directly to your existing WhatsApp without any expensive API setup."
    },
    {
      question: "How do customers place orders?",
      answer: "Customers browse your online catalog, select items, and click 'Order via WhatsApp'. This opens WhatsApp with a pre-formatted order message ready to send to you."
    },
    {
      question: "How do I add my menu items?",
      answer: "You can add products manually through our dashboard, upload your entire menu via CSV file, or integrate with your existing systems through our API."
    },
    {
      question: "What payment methods are supported?",
      answer: "You can accept cash on delivery, bank transfers, or integrate with payment gateways like Stripe, PayPal, and BKT depending on your region."
    },
    {
      question: "Can I customize my catalog design?",
      answer: "Yes! You can customize your catalog with your business's colors, logo, and branding to create a professional experience that matches your brand."
    },
    {
      question: "Is there inventory management?",
      answer: "Yes, you can track inventory levels and toggle items on/off when they're out of stock. Our dashboard shows you real-time inventory status."
    }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about WhatsApp ordering
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-gray-200 rounded-lg">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                {openFaq === index ? (
                  <Minus className="w-5 h-5 text-gray-500" />
                ) : (
                  <Plus className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {openFaq === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}