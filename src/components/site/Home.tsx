'use client'

import Link from 'next/link'
import { ArrowRight, Star, CheckCircle, Zap, Users, BarChart3, Smartphone, ShoppingBag, MessageSquare, Crown, TrendingUp, HelpCircle, ChevronRight, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-100 text-teal-800 text-sm font-medium mb-6">
                <TrendingUp className="w-4 h-4 mr-2" />
                Restaurant-First Platform
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Make WhatsApp Ordering{' '}
                <span className="text-teal-600">Super Easy</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Create beautiful catalogs and receive orders directly on WhatsApp. 
                Perfect for restaurants, cafes, and retail businesses. 
                <strong>No expensive WhatsApp Business API required.</strong>
              </p>
              
              {/* Demo CTA */}
              <div className="mb-8 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-white font-bold text-sm">W</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">See a live restaurant catalog</p>
                      <p className="text-xs text-gray-500">waveorder.app/pizza-palace</p>
                    </div>
                  </div>
                  <Link 
                    href="/pizza-palace"
                    className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors whitespace-nowrap ml-3 flex-shrink-0"
                  >
                    Demo
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                
                <Link href="/demo" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
                  View Demo
                </Link>
              </div>
              
              <div className="mt-8 flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-teal-500" />
                  No WhatsApp API Required
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-emerald-500" />
                  Multi-User Teams
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  Restaurant-Focused
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white p-8">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">🍕</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Pizza Palace</h3>
                  <p className="text-gray-600">Authentic Italian Cuisine</p>
                </div>
                
                <div className="space-y-3">
                  {[
                    { title: "Margherita Pizza", price: "$14.99", icon: "🍕" },
                    { title: "Caesar Salad", price: "$8.99", icon: "🥗" },
                    { title: "Garlic Bread", price: "$5.99", icon: "🍞" },
                    { title: "Coca Cola", price: "$2.99", icon: "🥤" },
                    { title: "Tiramisu", price: "$6.99", icon: "🍰" }
                  ].map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-teal-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="mr-3">{item.icon}</span>
                          <span className="font-medium text-gray-900">{item.title}</span>
                        </div>
                        <span className="font-bold text-teal-600">{item.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <button className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-teal-600 hover:to-emerald-600 transition-all">
                    Order via WhatsApp
                  </button>
                </div>
              </div>
              
              <div className="absolute -top-6 -right-6 bg-white rounded-xl p-4 shadow-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">45</div>
                  <div className="text-sm text-gray-600">Orders Today</div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-4 shadow-lg border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">98%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for WhatsApp Ordering
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features designed specifically for restaurants and businesses
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-teal-50 border border-teal-100">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                WhatsApp Native
              </h3>
              <p className="text-gray-600 mb-4">
                Orders flow directly to your WhatsApp. No expensive Business API required. Works with personal or business numbers.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Personal/Business WhatsApp</li>
                <li>• Custom message formats</li>
                <li>• Order notifications</li>
                <li>• Delivery tracking</li>
              </ul>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Multi-User Teams
              </h3>
              <p className="text-gray-600 mb-4">
                Invite team members with different roles. Perfect for restaurants with multiple staff managing orders and inventory.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Team collaboration</li>
                <li>• Role-based permissions</li>
                <li>• Multiple businesses</li>
                <li>• Staff management</li>
              </ul>
            </div>
            
            <div className="text-center p-6 rounded-2xl bg-yellow-50 border border-yellow-100">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Flexible Setup
              </h3>
              <p className="text-gray-600 mb-4">
                Add products manually, import via CSV, or connect your existing systems through our API integration.
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Manual product entry</li>
                <li>• CSV bulk import</li>
                <li>• API integration</li>
                <li>• Inventory management</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How WaveOrder Works
            </h2>
            <p className="text-xl text-gray-600">
              From catalog to WhatsApp order in seconds
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Catalog</h3>
              <p className="text-gray-600 text-sm">Set up your products with photos, prices, and variants. Customize with your brand colors.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Share Link</h3>
              <p className="text-gray-600 text-sm">Share your catalog URL on social media, QR codes, or direct messages to customers.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Orders</h3>
              <p className="text-gray-600 text-sm">Customers browse, select items, and click "Order via WhatsApp" with pre-filled message.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Receive & Fulfill</h3>
              <p className="text-gray-600 text-sm">Get formatted orders on WhatsApp. Manage and track everything from your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join restaurants and businesses already using WaveOrder to streamline their WhatsApp orders. 
            Start your free trial today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="inline-flex items-center justify-center px-12 py-4 text-lg font-semibold text-teal-600 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              href="/demo"
              className="inline-flex items-center justify-center px-12 py-4 text-lg font-semibold text-white bg-transparent border-2 border-white hover:bg-white hover:text-teal-600 rounded-lg transition-colors"
            >
              View Demo
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center space-x-8 text-sm opacity-75">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Free Trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              No Setup Fees
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Cancel Anytime
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}