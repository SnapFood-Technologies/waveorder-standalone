// src/app/(site)/salons/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, Scissors, Calendar, Clock, Users, BarChart3, Bell, Sparkles } from 'lucide-react'
import FAQ from '@/components/site/FAQ'

export const metadata: Metadata = {
  title: 'WaveOrder for Salons | Online Booking & Service Menu',
  description: 'Create a professional service menu, let clients book appointments via WhatsApp, and manage your salon business effortlessly. Perfect for hair salons, beauty studios, and spas.',
  keywords: 'salon booking, beauty salon, hair salon, spa booking, whatsapp booking, service menu, appointment scheduling, salon management',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://waveorder.app/salons',
  },
  openGraph: {
    title: 'WaveOrder for Salons & Beauty Studios',
    description: 'Professional service menu with WhatsApp booking. Let clients browse services and request appointments easily.',
    type: 'website',
    url: 'https://waveorder.app/salons',
  }
}

export default function SalonsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 md:pt-24 bg-rose-50 bg-gradient-to-b from-rose-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white border border-rose-200 px-4 py-2 rounded-full text-sm font-medium text-rose-700 shadow-sm mb-6">
                <Scissors className="w-4 h-4" />
                For Salons, Spas & Beauty Studios
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Services, <span className="text-rose-500">Beautifully Presented</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Create a stunning service menu your clients can browse anytime. They select what they want and request appointments directly via WhatsApp — no more phone tag.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link 
                  href="/auth/register"
                  className="px-8 py-4 bg-rose-500 text-white text-lg font-semibold rounded-full hover:bg-rose-600 transition-all hover:-translate-y-0.5 hover:shadow-xl inline-flex items-center justify-center"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                
                <Link 
                  href="/demo" 
                  className="px-8 py-4 border-2 border-gray-200 text-gray-700 text-lg font-semibold rounded-full hover:border-rose-500 hover:text-rose-500 transition-colors inline-flex items-center justify-center"
                >
                  See Demo Menu
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-rose-500 mr-3 flex-shrink-0" />
                  <span>Beautiful service catalog with prices</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-rose-500 mr-3 flex-shrink-0" />
                  <span>Appointment requests via WhatsApp</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-rose-500 mr-3 flex-shrink-0" />
                  <span>Service durations & add-ons</span>
                </div>
              </div>
            </div>

            {/* Phone Mockup - Salon Style */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Booking notification - top left of phone frame */}
              <div className="absolute left-0 lg:left-[100px] top-0 bg-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-bounce z-10 text-gray-900">
                <span className="text-rose-500">✨</span> New booking request!
              </div>

              <div className="w-[310px]">
                <div className="bg-gray-900 rounded-[40px] p-3 shadow-2xl">
                  <div className="bg-white rounded-[32px] overflow-hidden">
                    {/* Phone Header */}
                    <div className="bg-rose-500 p-4 text-white">
                      <div className="flex justify-between items-center text-xs mb-3">
                        <span>9:41 AM</span>
                        <div className="flex gap-2">
                          <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🔍</span>
                          <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">📅</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Glow Beauty Studio</h3>
                        <p className="text-sm text-white/90">Hair · Nails · Spa</p>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span>🕐 Open until 8 PM</span>
                        <span>📍 Downtown</span>
                      </div>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex gap-2 p-3 border-b border-gray-100">
                      <span className="px-4 py-1.5 bg-rose-500 text-white text-sm font-medium rounded-full">All</span>
                      <span className="px-4 py-1.5 text-gray-400 text-sm">Hair</span>
                      <span className="px-4 py-1.5 text-gray-400 text-sm">Nails</span>
                    </div>
                    
                    {/* Services */}
                    <div className="p-3 space-y-3">
                      <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-14 h-14 bg-rose-100 bg-gradient-to-br from-rose-100 to-rose-200 rounded-lg flex items-center justify-center text-2xl">💇‍♀️</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">Haircut & Style</h4>
                          <p className="text-xs text-gray-500">45 min · Wash included</p>
                          <span className="text-rose-500 font-bold text-sm">$65.00</span>
                        </div>
                        <button className="w-7 h-7 bg-rose-500 text-white rounded-full self-center text-lg">+</button>
                      </div>
                      <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-14 h-14 bg-pink-100 bg-gradient-to-br from-pink-100 to-pink-200 rounded-lg flex items-center justify-center text-2xl">💅</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">Gel Manicure</h4>
                          <p className="text-xs text-gray-500">60 min · Long lasting</p>
                          <span className="text-rose-500 font-bold text-sm">$45.00</span>
                        </div>
                        <button className="w-7 h-7 bg-rose-500 text-white rounded-full self-center text-lg">+</button>
                      </div>
                    </div>
                    
                    {/* Booking Button */}
                    <div className="m-3 bg-rose-500 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-semibold">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                      Book via WhatsApp · $110.00
                    </div>
                  </div>
                </div>
              </div>

              {/* No phone tag - bottom right of phone frame */}
              <div className="absolute right-0 bottom-0 bg-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 z-10">
                📱 No more phone tag
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Stop Playing Phone Tag
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Clients call during appointments. You miss calls. They leave voicemails you can&apos;t return until closing time. 
            Meanwhile, they&apos;ve already booked somewhere else.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                📞
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Missed Calls</h3>
              <p className="text-gray-600 text-sm">Can&apos;t answer during appointments, lose potential bookings</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                💬
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Price Questions</h3>
              <p className="text-gray-600 text-sm">&ldquo;How much for highlights?&rdquo; — answering the same questions daily</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                📋
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Scattered Info</h3>
              <p className="text-gray-600 text-sm">Bookings in texts, calls, DMs — nothing organized</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything Your Salon Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for salons, spas, and beauty professionals.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Beautiful Service Menu</h3>
              <p className="text-gray-600">Showcase all your services with photos, descriptions, durations, and prices. Clients see everything upfront.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Appointment Requests</h3>
              <p className="text-gray-600">Clients select services and request appointments via WhatsApp. You confirm when it works for your schedule.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Duration</h3>
              <p className="text-gray-600">Set how long each service takes. Clients understand time commitments before booking.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Track Popular Services</h3>
              <p className="text-gray-600">See which services are most requested. Optimize your menu based on real data.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Client Database</h3>
              <p className="text-gray-600">Build your client list automatically. See booking history and identify your regulars.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mb-6">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Instant Notifications</h3>
              <p className="text-gray-600">Get booking requests on WhatsApp in real-time. Respond between appointments.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
          </div>
          
          <div className="space-y-12">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Create Your Service Menu</h3>
                <p className="text-gray-600">Add your services with prices, descriptions, and duration. Group by category (Hair, Nails, Spa).</p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Your Link</h3>
                <p className="text-gray-600">Post on Instagram, add to Google listing, share via text. Clients can browse 24/7.</p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Receive Booking Requests</h3>
                <p className="text-gray-600">Clients select services and send a booking request via WhatsApp with all details included.</p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirm & Book</h3>
                <p className="text-gray-600">Reply with available times. Done — no back-and-forth phone calls needed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perfect for Every Beauty Business
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl mb-3">💇‍♀️</div>
              <h3 className="font-semibold text-gray-900">Hair Salons</h3>
              <p className="text-sm text-gray-500 mt-2">Cuts, color, styling, treatments</p>
            </div>
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl mb-3">💅</div>
              <h3 className="font-semibold text-gray-900">Nail Studios</h3>
              <p className="text-sm text-gray-500 mt-2">Manicure, pedicure, nail art</p>
            </div>
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl mb-3">🧖‍♀️</div>
              <h3 className="font-semibold text-gray-900">Spas</h3>
              <p className="text-sm text-gray-500 mt-2">Massages, facials, body treatments</p>
            </div>
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl mb-3">💄</div>
              <h3 className="font-semibold text-gray-900">Beauty Studios</h3>
              <p className="text-sm text-gray-500 mt-2">Makeup, lashes, brows</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-rose-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-6 text-3xl">
            ✨
          </div>
          <blockquote className="text-2xl md:text-3xl font-medium mb-6 leading-relaxed">
            &ldquo;I used to miss so many calls during appointments. Now clients book via WhatsApp and I confirm between clients. My bookings are up 40% since switching.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold">SL</div>
            <div className="text-left">
              <div className="font-semibold">Sofia L.</div>
              <div className="text-white/80 text-sm">Salon Owner, Miami</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-semibold text-gray-900 md:text-4xl mb-4">
            Ready to Simplify Your Bookings?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join salons saving hours every week with WaveOrder. Set up in 5 minutes.
          </p>
          <Link 
            href="/auth/register"
            className="inline-flex items-center px-8 py-4 bg-rose-500 text-white text-lg font-semibold rounded-full hover:bg-rose-600 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Start Your 14-Day Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <p className="text-gray-500 mt-4 text-sm">No credit card required · Cancel anytime</p>
        </div>
      </section>
    </div>
  )
}
