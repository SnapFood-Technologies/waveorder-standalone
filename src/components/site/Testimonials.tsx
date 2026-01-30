// src/components/site/Testimonials.tsx
'use client'

import { Star } from 'lucide-react'

interface Testimonial {
  quote: string
  author: string
  role: string
  avatarColor: string
  initials: string
}

const testimonials: Testimonial[] = [
  {
    quote: "I run my entire clothing business from Instagram. WaveOrder turned my DM chaos into organized orders. My customers love the catalog!",
    author: "Maria K.",
    role: "Instagram Boutique Owner",
    avatarColor: "bg-teal-500",
    initials: "MK"
  },
  {
    quote: "We were paying Glovo 28% commission. Now we pay $39/month and keep all our profits. Setup took 20 minutes.",
    author: "Antonio T.",
    role: "Restaurant Owner, Barcelona",
    avatarColor: "bg-[#f97066]",
    initials: "AT"
  },
  {
    quote: "The scheduling feature is perfect for our bakery. Customers can order today for tomorrow's pickup. No phone calls, no confusion.",
    author: "Linda S.",
    role: "Bakery Owner, Dubai",
    avatarColor: "bg-violet-500",
    initials: "LS"
  }
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Loved by Businesses Worldwide
          </h2>
          <p className="text-xl text-gray-600">
            Join thousands of businesses selling smarter with WaveOrder.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 p-8 rounded-2xl">
              {/* Stars */}
              <div className="flex gap-1 mb-4 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              
              {/* Quote */}
              <p className="text-gray-700 mb-6 leading-relaxed italic text-lg">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${testimonial.avatarColor} rounded-full flex items-center justify-center text-white font-bold`}>
                  {testimonial.initials}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.author}</h4>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
