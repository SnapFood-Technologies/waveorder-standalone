// src/components/site/Home.tsx
'use client'

import Link from 'next/link'
import { ArrowRight, Check, Clock, DollarSign, Bell, ShoppingCart, BarChart3, FolderOpen, CalendarClock, Users, FileSpreadsheet, Camera, Utensils, Store, Sparkles, Scissors } from 'lucide-react'
import Pricing from './Pricing'
import FAQ from './FAQ'
import Testimonials from './Testimonials'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 md:pt-24 bg-teal-50 bg-gradient-to-b from-teal-50 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-teal-100/50 bg-gradient-to-l from-teal-100/50 to-transparent opacity-50 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white border border-teal-200 px-4 py-2 rounded-full text-sm font-medium text-teal-700 shadow-sm mb-6">
                <Sparkles className="w-4 h-4" />
                No API required · Set up in 5 minutes
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Sell on WhatsApp <span className="text-teal-600">Without the Complexity</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Create a beautiful product catalog, share the link anywhere, and receive orders directly on your WhatsApp. Perfect for Instagram sellers, restaurants, retail stores, and any business that wants to sell online.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link 
                  href="/auth/register"
                  className="px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-full hover:bg-teal-700 transition-all hover:-translate-y-0.5 hover:shadow-xl inline-flex items-center justify-center"
                >
                  Start 14-Day Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                
                <Link 
                  href="/demo" 
                  className="px-8 py-4 border-2 border-gray-200 text-gray-700 text-lg font-semibold rounded-full hover:border-teal-600 hover:text-teal-600 transition-colors inline-flex items-center justify-center"
                >
                  View Demo
                </Link>
              </div>

              {/* Feature checklist */}
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-teal-500 mr-3 flex-shrink-0" />
                  <span>Use your existing WhatsApp number</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-teal-500 mr-3 flex-shrink-0" />
                  <span>Keep 100% of your sales — zero commissions</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-teal-500 mr-3 flex-shrink-0" />
                  <span>Orders arrive formatted and ready to fulfill</span>
                </div>
              </div>
            </div>

            {/* Right - Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              {/* New order received - top left of phone frame */}
              <div className="absolute left-0 lg:left-[100px] top-0 bg-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-bounce z-10 text-gray-900">
                <span className="text-teal-500">✓</span> New order received!
              </div>
              
              {/* Works on any device - bottom right of phone frame */}
              <div className="absolute right-0 bottom-0 bg-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 z-10 text-gray-900">
                📱 Works on any device
              </div>
              
              {/* Phone Frame */}
              <div className="w-[310px]">
                <div className="bg-gray-900 rounded-[40px] p-3 shadow-2xl">
                  <div className="bg-white rounded-[32px] overflow-hidden">
                    {/* Phone Header */}
                    <div className="bg-teal-600 p-4 text-white">
                      <div className="flex justify-between items-center text-xs mb-3">
                        <span>9:41 AM</span>
                        <div className="flex gap-2">
                          <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🔍</span>
                          <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">⚙</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Sofia&apos;s Boutique</h3>
                        <p className="text-sm text-white/90">Fashion & Accessories</p>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span>📍 Online Store</span>
                        <span>🚚 Free Shipping</span>
                      </div>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex gap-2 p-3 border-b border-gray-100">
                      <span className="px-4 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-full">All</span>
                      <span className="px-4 py-1.5 text-gray-400 text-sm">Dresses</span>
                      <span className="px-4 py-1.5 text-gray-400 text-sm">Bags</span>
                    </div>
                    
                    {/* Products */}
                    <div className="p-3 space-y-3">
                      <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-14 h-14 bg-teal-100 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center text-2xl">👗</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">Summer Dress</h4>
                          <p className="text-xs text-gray-500">Floral print, sizes S-L</p>
                          <span className="text-teal-600 font-bold text-sm">$49.99</span>
                        </div>
                        <button className="w-7 h-7 bg-teal-600 text-white rounded-full self-center text-lg">+</button>
                      </div>
                      <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-14 h-14 bg-teal-100 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex items-center justify-center text-2xl">👜</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">Leather Handbag</h4>
                          <p className="text-xs text-gray-500">Brown, premium quality</p>
                          <span className="text-teal-600 font-bold text-sm">$89.00</span>
                        </div>
                        <button className="w-7 h-7 bg-teal-600 text-white rounded-full self-center text-lg">+</button>
                      </div>
                    </div>
                    
                    {/* Cart Button */}
                    <div className="m-3 bg-teal-600 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-semibold">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                      Order via WhatsApp · $138.99
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">No WhatsApp API</div>
                <div className="text-sm text-gray-500">Use your existing number</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">5-Minute Setup</div>
                <div className="text-sm text-gray-500">Go live today</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Zero Commissions</div>
                <div className="text-sm text-gray-500">Keep all your revenue</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Instant Notifications</div>
                <div className="text-sm text-gray-500">Never miss an order</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases / Industries Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Every Business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you sell on Instagram, run a restaurant, operate a salon, or offer services — WaveOrder adapts to how you work.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/instagram-sellers" className="bg-white p-6 rounded-2xl text-center border-2 border-transparent hover:border-teal-500 hover:-translate-y-1 transition-all hover:shadow-xl group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl bg-pink-500 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Instagram Sellers</h3>
              <p className="text-sm text-gray-500">Turn your bio link into a store. Let followers browse and order without leaving WhatsApp.</p>
            </Link>
            
            <Link href="/restaurants" className="bg-white p-6 rounded-2xl text-center border-2 border-transparent hover:border-teal-500 hover:-translate-y-1 transition-all hover:shadow-xl group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl bg-[#f97066]">
                <Utensils className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Restaurants & Cafes</h3>
              <p className="text-sm text-gray-500">Digital menus with ordering. Customers browse, select, and send orders straight to your phone.</p>
            </Link>
            
            <Link href="/retail" className="bg-white p-6 rounded-2xl text-center border-2 border-transparent hover:border-teal-500 hover:-translate-y-1 transition-all hover:shadow-xl group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl bg-violet-500">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Retail & E-commerce</h3>
              <p className="text-sm text-gray-500">Full product catalogs with categories, variants, and scheduling for pickup or delivery.</p>
            </Link>
            
            <Link href="/salons" className="bg-white p-6 rounded-2xl text-center border-2 border-transparent hover:border-teal-500 hover:-translate-y-1 transition-all hover:shadow-xl group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl bg-pink-500">
                <Scissors className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Salons & Beauty</h3>
              <p className="text-sm text-gray-500">Service booking and appointment management. Let clients book services and send requests via WhatsApp.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Sell
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you sell more while keeping things simple.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-6">
                <ShoppingCart className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Beautiful Catalogs</h3>
              <p className="text-gray-600">Mobile-optimized product pages that load fast and look professional on any device.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Product Analytics</h3>
              <p className="text-gray-600">See which products get viewed, track popular items, and understand customer patterns.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Multi-Catalog Support</h3>
              <p className="text-gray-600">Manage multiple stores, locations, or brands — each with its own catalog and link.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-6">
                <CalendarClock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Delivery Scheduling</h3>
              <p className="text-gray-600">Let customers choose pickup or delivery time slots that work for your operations.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer Insights</h3>
              <p className="text-gray-600">Track order history, identify repeat buyers, and see customer favorites.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">CSV Import</h3>
              <p className="text-gray-600">Upload your entire product list at once. Migrate from any platform in minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-[#0d4f4f] text-white relative overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Stop Paying Commissions</h2>
            <p className="text-xl text-white/70">Delivery apps take up to 30% of every order. WaveOrder lets you keep your margins.</p>
          </div>
          
          {/* Comparison Table */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 pb-4 border-b-2 border-white/20 font-bold text-lg">
              <span></span>
              <span className="text-center">Delivery Apps</span>
              <span className="text-center text-teal-400">WaveOrder</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-4 border-b border-white/10">
              <span className="text-white/70">Commission per order</span>
              <span className="text-center text-[#f97066]">25-30%</span>
              <span className="text-center text-teal-400 font-semibold">$0</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-4 border-b border-white/10">
              <span className="text-white/70">Monthly fees</span>
              <span className="text-center text-[#f97066]">$0-50+</span>
              <span className="text-center text-teal-400 font-semibold">From $19</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-4 border-b border-white/10">
              <span className="text-white/70">Customer data ownership</span>
              <span className="text-center text-[#f97066]">They keep it</span>
              <span className="text-center text-teal-400 font-semibold">You own it</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-4 border-b border-white/10">
              <span className="text-white/70">Direct customer relationship</span>
              <span className="text-center text-[#f97066]">No</span>
              <span className="text-center text-teal-400 font-semibold">Yes</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 py-4">
              <span className="text-white/70">Setup complexity</span>
              <span className="text-center text-[#f97066]">Contracts, approval</span>
              <span className="text-center text-teal-400 font-semibold">5 minutes</span>
            </div>
          </div>
          
          {/* Highlight Box */}
          <div className="mt-12 bg-teal-400/10 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-2">A restaurant doing $10,000/month saves $2,500+ with WaveOrder</h3>
            <p className="text-white/80 text-lg">That&apos;s $30,000 per year back in your pocket.</p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Know Your Business Better
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                WaveOrder gives you the insights you need to grow — without complicated dashboards or data overload.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Real-time order tracking</h4>
                    <p className="text-gray-600 text-sm">See orders as they come in, update status, and keep customers informed.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Best-selling products</h4>
                    <p className="text-gray-600 text-sm">Identify your winners and optimize your catalog for what customers actually want.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Peak order times</h4>
                    <p className="text-gray-600 text-sm">Know when customers are most active so you can prepare accordingly.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Repeat customer tracking</h4>
                    <p className="text-gray-600 text-sm">Recognize your loyal customers and reward them for coming back.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dashboard Mockup */}
            <div className="bg-gray-50 rounded-3xl p-8">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                {/* Browser header */}
                <div className="bg-gray-900 px-4 py-3 flex gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                </div>
                
                {/* Dashboard content */}
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <span className="text-xs text-gray-500 block mb-1">Orders Today</span>
                      <strong className="text-2xl text-gray-900">24</strong>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <span className="text-xs text-gray-500 block mb-1">Revenue</span>
                      <strong className="text-2xl text-gray-900">$847</strong>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <span className="text-xs text-gray-500 block mb-1">Avg. Order</span>
                      <strong className="text-2xl text-gray-900">$35</strong>
                    </div>
                  </div>
                  
                  {/* Chart placeholder */}
                  <div className="h-32 bg-teal-100 bg-gradient-to-t from-teal-100 to-transparent rounded-xl relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-teal-500/30 bg-gradient-to-t from-teal-500/30 to-transparent" 
                      style={{
                        clipPath: 'polygon(0 100%, 5% 80%, 15% 60%, 25% 70%, 35% 40%, 45% 50%, 55% 30%, 65% 45%, 75% 20%, 85% 35%, 95% 10%, 100% 25%, 100% 100%)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <Pricing />

      {/* Testimonials Section */}
      <Testimonials />

      {/* FAQ Section */}
      <FAQ />

      {/* CTA Section */}
      <section className="py-20 bg-teal-600 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-radial from-white/10 to-transparent opacity-50" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Sell Smarter?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using WaveOrder to sell on WhatsApp without the complexity.
          </p>
          <Link 
            href="/auth/register"
            className="inline-flex items-center px-8 py-4 bg-white text-teal-700 text-lg font-semibold rounded-full hover:bg-gray-50 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Start Your 14-Day Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          
          {/* Trust points */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 mt-8 text-white/90">
            <div className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5 text-teal-200" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5 text-teal-200" />
              <span>Set up in 5 minutes</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5 text-teal-200" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
