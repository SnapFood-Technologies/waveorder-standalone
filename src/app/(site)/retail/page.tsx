// src/app/(site)/retail/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, Store, Package, Truck, Tags, BarChart3, Users, Layers } from 'lucide-react'
import FAQ from '@/components/site/FAQ'

export const metadata: Metadata = {
  title: 'WaveOrder for Retail | Online Store with WhatsApp Ordering',
  description: 'Create a professional online store, manage inventory, and receive orders via WhatsApp. Perfect for retail stores, boutiques, and e-commerce businesses.',
  keywords: 'retail ordering, online store, whatsapp shop, e-commerce, product catalog, inventory management, retail technology',
  alternates: {
    canonical: 'https://waveorder.app/retail',
  },
  openGraph: {
    title: 'WaveOrder for Retail Stores',
    description: 'Professional online catalog with WhatsApp ordering. Manage products, track inventory, and grow your retail business.',
    type: 'website',
    url: 'https://waveorder.app/retail',
  }
}

export default function RetailPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 md:pt-24 bg-violet-50 bg-gradient-to-b from-violet-50 to-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white border border-violet-200 px-4 py-2 rounded-full text-sm font-medium text-violet-700 shadow-sm mb-6">
                <Store className="w-4 h-4" />
                For Retail Stores & E-commerce
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Store, Online in <span className="text-violet-600">5 Minutes</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Create a professional product catalog with categories, variants, and inventory tracking. Customers browse and order via WhatsApp — no complex e-commerce setup needed.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link 
                  href="/auth/register"
                  className="px-8 py-4 bg-violet-600 text-white text-lg font-semibold rounded-full hover:bg-violet-700 transition-all hover:-translate-y-0.5 hover:shadow-xl inline-flex items-center justify-center"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                
                <Link 
                  href="/demo" 
                  className="px-8 py-4 border-2 border-gray-200 text-gray-700 text-lg font-semibold rounded-full hover:border-violet-600 hover:text-violet-600 transition-colors inline-flex items-center justify-center"
                >
                  See Demo Store
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-violet-500 mr-3 flex-shrink-0" />
                  <span>Unlimited products on Pro & Business plans</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-violet-500 mr-3 flex-shrink-0" />
                  <span>Categories, sizes, colors, variants</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-violet-500 mr-3 flex-shrink-0" />
                  <span>CSV import for bulk upload</span>
                </div>
              </div>
            </div>

            {/* Phone Mockup - Retail Style */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-[310px]">
                <div className="bg-gray-900 rounded-[40px] p-3 shadow-2xl">
                  <div className="bg-white rounded-[32px] overflow-hidden">
                    {/* Phone Header */}
                    <div className="bg-violet-600 p-4 text-white">
                      <div className="flex justify-between items-center text-xs mb-3">
                        <span>9:41 AM</span>
                        <div className="flex gap-2">
                          <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🔍</span>
                          <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🛒</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">TechGear Store</h3>
                        <p className="text-sm text-white/90">Electronics & Gadgets</p>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span>🚚 Free shipping $100+</span>
                        <span>✓ In stock</span>
                      </div>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex gap-2 p-3 border-b border-gray-100 overflow-x-auto">
                      <span className="px-4 py-1.5 bg-violet-600 text-white text-sm font-medium rounded-full whitespace-nowrap">All</span>
                      <span className="px-4 py-1.5 text-gray-400 text-sm whitespace-nowrap">Audio</span>
                      <span className="px-4 py-1.5 text-gray-400 text-sm whitespace-nowrap">Wearables</span>
                    </div>
                    
                    {/* Products */}
                    <div className="p-3 space-y-3">
                      <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-14 h-14 bg-violet-100 bg-gradient-to-br from-violet-100 to-violet-200 rounded-lg flex items-center justify-center text-2xl">🎧</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">Wireless Headphones</h4>
                          <p className="text-xs text-gray-500">Black · Noise cancelling</p>
                          <span className="text-violet-600 font-bold text-sm">$129.99</span>
                        </div>
                        <button className="w-7 h-7 bg-violet-600 text-white rounded-full self-center text-lg">+</button>
                      </div>
                      <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-14 h-14 bg-blue-100 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center text-2xl">⌚</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">Smart Watch Pro</h4>
                          <p className="text-xs text-gray-500">Silver · 45mm</p>
                          <span className="text-violet-600 font-bold text-sm">$249.00</span>
                        </div>
                        <button className="w-7 h-7 bg-violet-600 text-white rounded-full self-center text-lg">+</button>
                      </div>
                    </div>
                    
                    {/* Cart Button */}
                    <div className="m-3 bg-violet-600 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-semibold">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                      Order via WhatsApp · $378.99
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 2 items in cart - top left of phone frame */}
              <div className="absolute left-0 lg:left-[140px] top-0 bg-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-bounce z-10 text-gray-900">
                <span className="text-violet-500">📦</span> 2 items in cart
              </div>
              
              {/* Multi-store support - bottom right of phone frame */}
              <div className="absolute right-0 bottom-0 bg-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 z-10 text-gray-900">
                🏪 Multi-store support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Retail Complexity
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From simple shops to large catalogs — WaveOrder handles it all.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mb-6">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Product Variants</h3>
              <p className="text-gray-600">Sizes, colors, materials — let customers select exactly what they want before ordering.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                <Tags className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Categories & Collections</h3>
              <p className="text-gray-600">Organize products into categories. Create seasonal collections or sale sections.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">CSV Import</h3>
              <p className="text-gray-600">Upload hundreds of products at once. Migrate from any platform in minutes.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Delivery Options</h3>
              <p className="text-gray-600">Pickup, local delivery, or shipping. Set delivery zones and fees per area.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sales Analytics</h3>
              <p className="text-gray-600">Track best sellers, revenue trends, and product performance over time.</p>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Customer Insights</h3>
              <p className="text-gray-600">Build your customer database. See order history and identify repeat buyers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Store Section */}
      <section className="py-20 bg-violet-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Multiple Stores, One Account
              </h2>
              <p className="text-xl text-white/90 mb-8">
                Running multiple locations or brands? Manage all your stores from a single dashboard.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Separate catalogs for each store</h4>
                    <p className="text-white/70 text-sm">Different products, prices, and settings per location.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Unique links for each brand</h4>
                    <p className="text-white/70 text-sm">yourstore.waveorder.app or use your custom domain.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Centralized analytics</h4>
                    <p className="text-white/70 text-sm">See performance across all stores in one place.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 rounded-3xl p-8">
              <div className="space-y-4">
                <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center text-xl">👗</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Downtown Boutique</h4>
                    <p className="text-white/70 text-sm">234 products · 45 orders today</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center text-xl">👠</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Mall Location</h4>
                    <p className="text-white/70 text-sm">189 products · 32 orders today</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-xl">👜</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">Online Exclusive</h4>
                    <p className="text-white/70 text-sm">567 products · 78 orders today</p>
                  </div>
                </div>
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
              Works for Every Type of Retail
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl mb-3">👗</div>
              <h3 className="font-semibold text-gray-900">Fashion Boutiques</h3>
              <p className="text-sm text-gray-500 mt-2">Clothing, accessories, seasonal collections</p>
            </div>
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="font-semibold text-gray-900">Electronics</h3>
              <p className="text-sm text-gray-500 mt-2">Gadgets, accessories, tech products</p>
            </div>
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl mb-3">🏠</div>
              <h3 className="font-semibold text-gray-900">Home & Garden</h3>
              <p className="text-sm text-gray-500 mt-2">Decor, furniture, plants</p>
            </div>
            <div className="bg-white p-6 rounded-2xl text-center">
              <div className="text-4xl mb-3">💄</div>
              <h3 className="font-semibold text-gray-900">Beauty & Cosmetics</h3>
              <p className="text-sm text-gray-500 mt-2">Skincare, makeup, fragrances</p>
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
            Ready to Put Your Store Online?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of retail businesses selling on WhatsApp. Set up takes 5 minutes.
          </p>
          <Link 
            href="/auth/register"
            className="inline-flex items-center px-8 py-4 bg-violet-600 text-white text-lg font-semibold rounded-full hover:bg-violet-700 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Start Your 14-Day Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <p className="text-gray-500 mt-4 text-sm">No credit card required · Unlimited products on Pro</p>
        </div>
      </section>
    </div>
  )
}
