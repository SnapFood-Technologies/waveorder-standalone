// src/app/(site)/restaurants/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, Utensils, Clock, DollarSign, CalendarClock, BarChart3, Users, Bell } from 'lucide-react'
import FAQ from '@/components/site/FAQ'

export const metadata: Metadata = {
  title: 'WaveOrder for Restaurants | WhatsApp Menu & Online Ordering',
  description: 'Create a digital menu, let customers order via WhatsApp, and stop paying 25-30% commissions to delivery apps. Perfect for restaurants, cafes, bakeries, and food businesses.',
  keywords: 'restaurant ordering, whatsapp menu, digital menu, food ordering, restaurant technology, delivery app alternative, online ordering',
  alternates: {
    canonical: 'https://waveorder.app/restaurants',
  },
  openGraph: {
    title: 'WaveOrder for Restaurants',
    description: 'Stop paying 25-30% commissions. Let customers order directly via WhatsApp with your own digital menu.',
    type: 'website',
    url: 'https://waveorder.app/restaurants',
  }
}

export default function RestaurantsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-orange-50 to-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-orange-200 px-4 py-2 rounded-full text-sm font-medium text-orange-700 shadow-sm mb-6">
              <Utensils className="w-4 h-4" />
              For Restaurants, Cafes & Food Businesses
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Stop Paying <span className="text-[#f97066]">30% Commission</span> on Every Order
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Create a beautiful digital menu, share the link, and receive orders directly on WhatsApp. Keep all your profits — no commissions, no middlemen.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link 
                href="/auth/register"
                className="px-8 py-4 bg-[#f97066] text-white text-lg font-semibold rounded-full hover:bg-[#e85c52] transition-all hover:-translate-y-0.5 hover:shadow-xl inline-flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              
              <Link 
                href="/demo" 
                className="px-8 py-4 border-2 border-gray-200 text-gray-700 text-lg font-semibold rounded-full hover:border-[#f97066] hover:text-[#f97066] transition-colors inline-flex items-center justify-center"
              >
                See Demo Menu
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-[#f97066] mr-3 flex-shrink-0" />
                <span>Digital menu with QR codes</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-[#f97066] mr-3 flex-shrink-0" />
                <span>Zero commissions on orders</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Check className="w-5 h-5 text-[#f97066] mr-3 flex-shrink-0" />
                <span>Pickup & delivery scheduling</span>
              </div>
            </div>
          </div>

          {/* Phone Mockup - Restaurant Style */}
          <div className="relative flex justify-center lg:justify-end">
            {/* New order received - top left of phone frame */}
            <div className="absolute left-0 top-0 bg-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-bounce z-10">
              <span className="text-green-500">✓</span> New order received!
            </div>

            <div className="w-[310px]">
              <div className="bg-gray-900 rounded-[40px] p-3 shadow-2xl">
                <div className="bg-white rounded-[32px] overflow-hidden">
                  {/* Phone Header */}
                  <div className="bg-[#f97066] p-4 text-white">
                    <div className="flex justify-between items-center text-xs mb-3">
                      <span>9:41 AM</span>
                      <div className="flex gap-2">
                        <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🔍</span>
                        <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🛒</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Pasta Paradise</h3>
                      <p className="text-sm text-white/90">Italian Restaurant</p>
                    </div>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span>🕐 Open until 10 PM</span>
                      <span>🚗 Delivery available</span>
                    </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex gap-2 p-3 border-b border-gray-100">
                    <span className="px-4 py-1.5 bg-[#f97066] text-white text-sm font-medium rounded-full">All</span>
                    <span className="px-4 py-1.5 text-gray-400 text-sm">Pasta</span>
                    <span className="px-4 py-1.5 text-gray-400 text-sm">Pizza</span>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="p-3 space-y-3">
                    <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center text-2xl">🍝</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">Spaghetti Carbonara</h4>
                        <p className="text-xs text-gray-500">Egg, parmesan, pancetta</p>
                        <span className="text-[#f97066] font-bold text-sm">$16.99</span>
                      </div>
                      <button className="w-7 h-7 bg-[#f97066] text-white rounded-full self-center text-lg">+</button>
                    </div>
                    <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-14 h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center text-2xl">🍕</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">Margherita Pizza</h4>
                        <p className="text-xs text-gray-500">Tomato, mozzarella, basil</p>
                        <span className="text-[#f97066] font-bold text-sm">$14.99</span>
                      </div>
                      <button className="w-7 h-7 bg-[#f97066] text-white rounded-full self-center text-lg">+</button>
                    </div>
                  </div>
                  
                  {/* Order Button */}
                  <div className="m-3 bg-[#f97066] text-white p-4 rounded-xl flex items-center justify-center gap-2 font-semibold">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                    Order via WhatsApp · $31.98
                  </div>
                </div>
              </div>
            </div>

            {/* $0 commission - bottom right of phone frame */}
            <div className="absolute right-0 bottom-0 bg-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 z-10">
              💰 $0 commission
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Commission Comparison */}
      <section className="py-20 bg-[#0d4f4f] text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The Math Is Simple</h2>
            <p className="text-xl text-white/70">See how much you save by switching from delivery apps to WaveOrder.</p>
          </div>
          
          {/* Comparison Table */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 pb-4 border-b-2 border-white/20 font-bold text-lg">
              <span>Monthly Orders ($10K)</span>
              <span className="text-center">Delivery Apps</span>
              <span className="text-center text-teal-400">WaveOrder</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-4 border-b border-white/10">
              <span className="text-white/70">Commission costs</span>
              <span className="text-center text-[#f97066]">-$2,500</span>
              <span className="text-center text-teal-400 font-semibold">$0</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-4 border-b border-white/10">
              <span className="text-white/70">Platform fees</span>
              <span className="text-center text-[#f97066]">-$100/month</span>
              <span className="text-center text-teal-400 font-semibold">-$39/month</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-4 border-b border-white/10">
              <span className="text-white/70">Customer data</span>
              <span className="text-center text-[#f97066]">They own it</span>
              <span className="text-center text-teal-400 font-semibold">You own it</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-4 font-bold text-xl">
              <span>You keep</span>
              <span className="text-center text-[#f97066]">$7,400</span>
              <span className="text-center text-teal-400">$9,961</span>
            </div>
          </div>
          
          {/* Highlight Box */}
          <div className="mt-12 bg-teal-400/10 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">Save $2,500+ per month</h3>
            <p className="text-white/80 text-lg">That&apos;s $30,000 per year back in your pocket.</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything a Restaurant Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for food businesses — from cafes to full-service restaurants.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-orange-100 text-[#f97066] rounded-xl flex items-center justify-center mb-6">
                <Utensils className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Digital Menu</h3>
              <p className="text-gray-600">Beautiful, mobile-friendly menu with categories, photos, descriptions, and real-time availability.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-6">
                <CalendarClock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Delivery Scheduling</h3>
              <p className="text-gray-600">Let customers choose pickup or delivery time slots. Manage capacity and avoid kitchen overload.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <DollarSign className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Menu Modifiers</h3>
              <p className="text-gray-600">Add-ons, customizations, and special instructions. Customers can personalize their orders.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sales Analytics</h3>
              <p className="text-gray-600">Track best-sellers, peak hours, and revenue trends. Make data-driven menu decisions.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer Database</h3>
              <p className="text-gray-600">Build your own customer list. See order history, preferences, and identify regulars.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mb-6">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Instant Notifications</h3>
              <p className="text-gray-600">Orders arrive directly on WhatsApp. No tablets, no printer dependencies, no missed orders.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perfect for Every Food Business
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl mb-3">🍕</div>
              <h3 className="font-semibold text-gray-900">Pizzerias</h3>
              <p className="text-sm text-gray-500 mt-2">Pizza customizations, toppings, sizes</p>
            </div>
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl mb-3">☕</div>
              <h3 className="font-semibold text-gray-900">Cafes</h3>
              <p className="text-sm text-gray-500 mt-2">Coffee orders, pastries, quick pickup</p>
            </div>
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl mb-3">🍰</div>
              <h3 className="font-semibold text-gray-900">Bakeries</h3>
              <p className="text-sm text-gray-500 mt-2">Pre-orders, scheduling, custom cakes</p>
            </div>
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl mb-3">🍔</div>
              <h3 className="font-semibold text-gray-900">Fast Food</h3>
              <p className="text-sm text-gray-500 mt-2">Quick combos, meal deals, delivery</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-[#f97066] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-6 text-3xl">
            🍝
          </div>
          <blockquote className="text-2xl md:text-3xl font-medium mb-6 leading-relaxed">
            &ldquo;We were paying Glovo 28% commission on every order. Now we pay $39/month and keep everything. Setup took 20 minutes.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold">AT</div>
            <div className="text-left">
              <div className="font-semibold">Antonio T.</div>
              <div className="text-white/80 text-sm">Restaurant Owner, Barcelona</div>
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
            Ready to Keep More of Your Revenue?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join restaurants saving thousands by switching to WaveOrder. Set up in 5 minutes.
          </p>
          <Link 
            href="/auth/register"
            className="inline-flex items-center px-8 py-4 bg-[#f97066] text-white text-lg font-semibold rounded-full hover:bg-[#e85c52] transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Start Your 14-Day Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <p className="text-gray-500 mt-4 text-sm">No credit card required · No commissions ever</p>
        </div>
      </section>
    </div>
  )
}
