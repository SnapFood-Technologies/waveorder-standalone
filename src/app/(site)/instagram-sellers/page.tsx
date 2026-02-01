// src/app/(site)/instagram-sellers/page.tsx
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, Check, Camera, ShoppingBag, MessageSquare, BarChart3, Clock, Instagram } from 'lucide-react'
import FAQ from '@/components/site/FAQ'

export const metadata: Metadata = {
  title: 'WaveOrder for Instagram Sellers | Turn Your Bio Link Into a Store',
  description: 'Transform your Instagram profile into a selling machine. Create a professional product catalog, share in your bio, and receive orders directly via WhatsApp. No website needed.',
  keywords: 'instagram seller, link in bio store, instagram shop, whatsapp ordering, social selling, instagram business, bio link shop',
  alternates: {
    canonical: 'https://waveorder.app/instagram-sellers',
  },
  openGraph: {
    title: 'WaveOrder for Instagram Sellers',
    description: 'Turn your bio link into a professional store. Let followers browse, select, and order via WhatsApp.',
    type: 'website',
    url: 'https://waveorder.app/instagram-sellers',
  }
}

export default function InstagramSellersPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-pink-50 bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white border border-purple-200 px-4 py-2 rounded-full text-sm font-medium text-purple-700 shadow-sm mb-6">
                <Instagram className="w-4 h-4" />
                Perfect for Instagram & Social Sellers
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Turn Your Bio Link Into a <span className="text-pink-600 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text [-webkit-background-clip:text] text-transparent">Professional Store</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Stop losing sales in DMs. Create a beautiful product catalog your followers can browse, and let them order directly via WhatsApp. No website needed, no coding required.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link 
                  href="/auth/register"
                  className="px-8 py-4 bg-pink-500 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white text-lg font-semibold rounded-full hover:opacity-90 transition-all hover:-translate-y-0.5 hover:shadow-xl inline-flex items-center justify-center"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                
                <Link 
                  href="/demo" 
                  className="px-8 py-4 border-2 border-gray-200 text-gray-700 text-lg font-semibold rounded-full hover:border-purple-500 hover:text-purple-600 transition-colors inline-flex items-center justify-center"
                >
                  See Demo Store
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span>Mobile-first catalog that looks amazing</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span>Orders go straight to your WhatsApp</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Check className="w-5 h-5 text-purple-500 mr-3 flex-shrink-0" />
                  <span>No DM chaos — organized order messages</span>
                </div>
              </div>
            </div>

            {/* Phone Mockup - Instagram Style */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-[310px]">
                <div className="bg-gray-900 rounded-[40px] p-3 shadow-2xl">
                  <div className="bg-white rounded-[32px] overflow-hidden">
                    {/* Phone Header */}
                    <div className="bg-pink-500 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 p-4 text-white">
                      <div className="flex justify-between items-center text-xs mb-3">
                        <span>9:41 AM</span>
                        <div className="flex gap-2">
                          <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🔍</span>
                          <span className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">🛒</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">@StyleByEmma</h3>
                        <p className="text-sm text-white/90">Handmade Jewelry</p>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span>✨ 12.5K followers</span>
                        <span>📦 Free shipping $50+</span>
                      </div>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex gap-2 p-3 border-b border-gray-100">
                      <span className="px-4 py-1.5 bg-pink-500 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium rounded-full">All</span>
                      <span className="px-4 py-1.5 text-gray-400 text-sm">Rings</span>
                      <span className="px-4 py-1.5 text-gray-400 text-sm">Necklaces</span>
                    </div>
                    
                    {/* Products */}
                    <div className="p-3 space-y-3">
                      <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-14 h-14 bg-amber-100 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center text-2xl">💍</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">Gold Moon Ring</h4>
                          <p className="text-xs text-gray-500">Adjustable, 18K plated</p>
                          <span className="text-pink-600 font-bold text-sm">$34.99</span>
                        </div>
                        <button className="w-7 h-7 bg-pink-500 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full self-center text-lg">+</button>
                      </div>
                      <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-14 h-14 bg-purple-100 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center text-2xl">📿</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">Crystal Pendant</h4>
                          <p className="text-xs text-gray-500">Amethyst, silver chain</p>
                          <span className="text-pink-600 font-bold text-sm">$45.00</span>
                        </div>
                        <button className="w-7 h-7 bg-pink-500 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full self-center text-lg">+</button>
                      </div>
                    </div>
                    
                    {/* Cart Button */}
                    <div className="m-3 bg-pink-500 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-semibold">
                      <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                      Order via WhatsApp
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute right-0 top-0 bg-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-bounce z-10">
                <span className="text-pink-500">💕</span> New follower order!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Tired of DM Order Chaos?
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            You know the drill: followers ask &ldquo;How much?&rdquo;, &ldquo;What sizes?&rdquo;, &ldquo;Still available?&rdquo; — over and over. 
            Meanwhile, real buyers get lost in the noise.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                😫
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Repetitive Questions</h3>
              <p className="text-gray-600 text-sm">Answering the same price/size/availability questions 50 times a day</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                📱
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Lost in DMs</h3>
              <p className="text-gray-600 text-sm">Orders scattered across Instagram, WhatsApp, and comments</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                💸
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Missed Sales</h3>
              <p className="text-gray-600 text-sm">Followers leave when they can&apos;t find info or can&apos;t order easily</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              One Link. Complete Store. Easy Orders.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              WaveOrder gives you a professional storefront that works perfectly as your Instagram bio link.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-pink-100 bg-gradient-to-r from-orange-100 to-pink-100 text-pink-600 rounded-xl flex items-center justify-center mb-6">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Stunning Product Pages</h3>
              <p className="text-gray-600">Upload photos, add descriptions, set prices. Your products look professional on any device.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-purple-100 bg-gradient-to-r from-pink-100 to-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Size & Variant Options</h3>
              <p className="text-gray-600">Let customers select size, color, quantity before ordering. No more back-and-forth messages.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">WhatsApp Checkout</h3>
              <p className="text-gray-600">One tap opens WhatsApp with a formatted order ready to send. You reply to close the sale.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">See What&apos;s Working</h3>
              <p className="text-gray-600">Track which products get the most views and orders. Double down on your winners.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Quick Product Updates</h3>
              <p className="text-gray-600">Mark items as sold out in seconds. Add new drops instantly. Always stay current.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl hover:-translate-y-1 transition-all hover:shadow-lg">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-6">
                <Instagram className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Perfect Bio Link</h3>
              <p className="text-gray-600">Clean, professional URL that looks great in your Instagram bio and stories.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Instagram Sellers Use WaveOrder
            </h2>
          </div>
          
          <div className="space-y-12">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-pink-500 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Products</h3>
                <p className="text-gray-600">Add photos, prices, sizes, and descriptions. Takes minutes, not hours.</p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-purple-500 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Add Link to Bio</h3>
                <p className="text-gray-600">Put your WaveOrder link in your Instagram bio. Share in stories when you post new items.</p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-violet-500 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Receive Orders on WhatsApp</h3>
                <p className="text-gray-600">Customers browse your store, select items, and tap to order. You get a clean, formatted message with everything you need.</p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-indigo-500 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">4</div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirm & Ship</h3>
                <p className="text-gray-600">Reply to confirm payment method and shipping. No more lost orders or confusion.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-pink-500 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-6 text-3xl">
            💕
          </div>
          <blockquote className="text-2xl md:text-3xl font-medium mb-6 leading-relaxed">
            &ldquo;I went from spending 3 hours a day answering DMs to getting clean, ready-to-ship orders. My followers love how easy it is to browse and buy.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold">MK</div>
            <div className="text-left">
              <div className="font-semibold">Maria K.</div>
              <div className="text-white/80 text-sm">@StyleByEmma · 15K followers</div>
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
           Ready to Turn Followers Into Customers?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of Instagram sellers using WaveOrder to sell smarter. Set up takes 5 minutes.
          </p>
          <Link 
            href="/auth/register"
            className="inline-flex items-center px-8 py-4 bg-pink-500 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white text-lg font-semibold rounded-full hover:opacity-90 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            Start Your 14-Day Free Trial
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <p className="text-gray-500 mt-4 text-sm">No credit card required</p>
        </div>
      </section>
    </div>
  )
}
