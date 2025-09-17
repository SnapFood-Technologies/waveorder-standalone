// src/components/site/Home.tsx (updated)
'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare, Upload, ShoppingCart, BarChart, Smartphone, Zap } from 'lucide-react'
import Pricing from './Pricing'
import FAQ from './FAQ'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                WhatsApp Ordering for Restaurants
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Create beautiful product catalogs and receive orders directly on WhatsApp. 
                Perfect for restaurants, cafes, and food businesses. No expensive API required.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link 
                  href="/register"
                  className="px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center justify-center"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                
                <Link 
                  href="/demo" 
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center"
                >
                  View Demo
                </Link>
              </div>

              {/* Alternative to the gray box - Simple list */}
              <div className="text-gray-600">
                <p className="mb-2 font-medium">Why choose WaveOrder:</p>
                <div className="text-sm space-y-1">
                  <p>• Works with your existing WhatsApp number</p>
                  <p>• No expensive API fees required</p>
                  <p>• Set up your catalog in minutes</p>
                  <p>• Streamlined order management</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gray-200 rounded-2xl h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <Smartphone className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-medium">Restaurant Catalog Demo</p>
                  <p className="text-sm">Mobile-optimized ordering interface</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything for WhatsApp Orders
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamlined features designed specifically for restaurant operations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Direct WhatsApp Orders
              </h3>
              <p className="text-gray-600">
                Orders come straight to your existing WhatsApp number with all customer details formatted perfectly.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-6">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Flexible Menu Setup
              </h3>
              <p className="text-gray-600">
                Add items manually, upload via CSV, or integrate with your existing POS system through our API.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mb-6">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Order Management
              </h3>
              <p className="text-gray-600">
                Track order status, manage inventory, and keep customers updated through your dashboard.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Mobile-Optimized Catalogs
              </h3>
              <p className="text-gray-600">
                Beautiful, fast-loading catalogs that work perfectly on all devices with your restaurant branding.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-6">
                <BarChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Analytics & Insights
              </h3>
              <p className="text-gray-600">
                Track your best-selling items, peak order times, and customer patterns to optimize your business.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Custom Branding
              </h3>
              <p className="text-gray-600">
                Customize your catalog with your business's colors, logo, and branding to create a professional experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <Pricing />

      {/* CTA Section */}
      <section className="py-20 bg-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Taking Orders?
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Join restaurants using WaveOrder to streamline their WhatsApp orders. 
            Set up takes just minutes.
          </p>
          <Link 
            href="/register"
            className="inline-flex items-center px-8 py-4 bg-white text-teal-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* FAQ Section - After CTA */}
      <FAQ />
    </div>
  )
}