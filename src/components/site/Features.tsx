// src/components/site/Features.tsx
'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare, Upload, ShoppingCart, BarChart, Smartphone, Zap, Check, Clock, CreditCard, Users, Globe, Settings, Target, Truck, Shield, ChevronRight, Star, Award, TrendingUp, Package, Palette, Database, Bell } from 'lucide-react'

export default function Features() {
  const mainFeatures = [
    {
      icon: MessageSquare,
      title: "Direct WhatsApp Orders",
      description: "Orders come straight to your existing WhatsApp number with all customer details formatted perfectly. No expensive API required.",
      benefits: ["Use your current WhatsApp", "No monthly API fees", "Instant notifications", "Formatted order messages"],
      highlight: "API-free solution",
      gradient: "from-blue-50 to-indigo-50",
      iconColor: "bg-blue-100 text-blue-600"
    },
    {
      icon: Upload,
      title: "Flexible Menu Setup",
      description: "Choose how you want to build your catalog - manual entry, CSV upload, or API integration for advanced users.",
      benefits: ["Manual product entry", "Bulk CSV import", "API integration option", "Live preview as you build"],
      highlight: "3 setup methods",
      gradient: "from-green-50 to-emerald-50",
      iconColor: "bg-green-100 text-green-600"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Catalogs",
      description: "Beautiful, fast-loading catalogs optimized for mobile devices where your customers actually shop.",
      benefits: ["Sub-2 second load times", "Mobile-optimized design", "Works on all devices", "Professional appearance"],
      highlight: "Lightning fast",
      gradient: "from-purple-50 to-pink-50",
      iconColor: "bg-purple-100 text-purple-600"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite team members with different access levels to help manage orders, inventory, and customer service.",
      benefits: ["Multiple user accounts", "Role-based permissions", "Owner/Manager/Staff roles", "Team invitations"],
      highlight: "Multi-user ready",
      gradient: "from-orange-50 to-amber-50",
      iconColor: "bg-orange-100 text-orange-600"
    },
    {
      icon: BarChart,
      title: "Analytics & Insights",
      description: "Track your best-selling items, peak order times, and customer patterns to optimize your business.",
      benefits: ["Order analytics", "Revenue tracking", "Customer insights", "Performance metrics"],
      highlight: "Data-driven decisions",
      gradient: "from-teal-50 to-cyan-50",
      iconColor: "bg-teal-100 text-teal-600"
    },
    {
      icon: Palette,
      title: "Custom Branding",
      description: "Customize your catalog with your business's colors, logo, and branding to create a professional experience.",
      benefits: ["Brand colors", "Logo upload", "Custom themes", "Professional look"],
      highlight: "Your brand identity",
      gradient: "from-rose-50 to-pink-50",
      iconColor: "bg-rose-100 text-rose-600"
    }
  ]

  const additionalFeatures = [
    {
      icon: Package,
      title: "Inventory Management",
      description: "Track stock levels and toggle items on/off when out of stock",
      category: "Management",
      color: "bg-blue-50 border-blue-100 text-blue-700"
    },
    {
      icon: Globe,
      title: "Multi-language Support",
      description: "Serve customers in their preferred language",
      category: "Localization",
      color: "bg-green-50 border-green-100 text-green-700"
    },
    {
      icon: CreditCard,
      title: "Payment Flexibility",
      description: "Cash on delivery, bank transfers, and regional payment methods",
      category: "Payments",
      color: "bg-purple-50 border-purple-100 text-purple-700"
    },
    {
      icon: Bell,
      title: "Order Notifications",
      description: "Real-time alerts and automated status updates for customers",
      category: "Communication",
      color: "bg-orange-50 border-orange-100 text-orange-700"
    },
    {
      icon: Truck,
      title: "Delivery Management",
      description: "Delivery zones, fees, and estimated delivery times",
      category: "Operations",
      color: "bg-teal-50 border-teal-100 text-teal-700"
    },
    {
      icon: Database,
      title: "Order History",
      description: "Complete order tracking and customer relationship management",
      category: "Management",
      color: "bg-rose-50 border-rose-100 text-rose-700"
    },
    {
      icon: Shield,
      title: "Business Types",
      description: "Optimized for restaurants, cafes, retail, grocery, and more",
      category: "Flexibility",
      color: "bg-indigo-50 border-indigo-100 text-indigo-700"
    },
    {
      icon: Settings,
      title: "Custom Domains",
      description: "Professional URLs with your own domain name",
      category: "Branding",
      color: "bg-amber-50 border-amber-100 text-amber-700"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-6 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Everything You Need for WhatsApp Orders
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              WaveOrder combines simplicity with powerful features to help businesses 
              manage WhatsApp orders efficiently. No technical expertise required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-lg font-semibold rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 inline-flex items-center justify-center"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                href="/demo"
                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-teal-500 text-teal-600 text-lg font-semibold rounded-xl hover:bg-teal-50 transition-colors inline-flex items-center justify-center"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Core Features
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Built for businesses that want to leverage WhatsApp for seamless ordering
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {mainFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className={`bg-gradient-to-br ${feature.gradient} rounded-2xl p-6 sm:p-8 border-2 border-white/50 hover:border-gray-200 hover:shadow-xl transition-all duration-300`}>
                  {/* Mobile-first: Stacked layout */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-6">
                    {/* Icon and Title Section */}
                    <div className="flex items-center justify-between mb-4 sm:mb-0 sm:flex-col sm:items-center sm:space-y-4">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 ${feature.iconColor} rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />
                      </div>
                      <span className="sm:hidden px-3 py-1.5 bg-white/80 backdrop-blur-sm text-gray-700 text-sm font-semibold rounded-full border border-gray-200">
                        {feature.highlight}
                      </span>
                    </div>
                    
                    {/* Content Section */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4 sm:mb-4">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{feature.title}</h3>
                        <span className="hidden sm:inline-block px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 text-sm font-semibold rounded-full border border-gray-200">
                          {feature.highlight}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-6 leading-relaxed text-base sm:text-lg">{feature.description}</p>
                      
                      {/* Benefits Grid - Mobile optimized */}
                      <div className="grid grid-cols-1 gap-2 sm:gap-3">
                        {feature.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center bg-white/60 rounded-lg p-2.5 sm:p-3 backdrop-blur-sm">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mr-2 sm:mr-3 flex-shrink-0" />
                            <span className="text-gray-800 font-medium text-sm sm:text-base">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Additional Features
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Every tool you need to run a successful WhatsApp ordering business
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className={`bg-white rounded-2xl p-6 border-2 ${feature.color} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-4">
                    <IconComponent className="w-7 h-7 text-gray-600" />
                  </div>
                  <div className="mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${feature.color}`}>
                      {feature.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Business Types Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perfect for Any Business
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              While optimized for food businesses, WaveOrder works great for many business types
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { name: "Restaurants", icon: "🍽️", description: "Full menu management with modifiers and variants", color: "from-red-50 to-orange-50 border-red-100" },
              { name: "Cafes", icon: "☕", description: "Perfect for coffee shops and quick service", color: "from-amber-50 to-yellow-50 border-amber-100" },
              { name: "Retail Stores", icon: "🛍️", description: "Product catalogs with inventory tracking", color: "from-blue-50 to-indigo-50 border-blue-100" },
              { name: "Grocery Stores", icon: "🛒", description: "Large product catalogs with categories", color: "from-green-50 to-emerald-50 border-green-100" },
              { name: "Jewelry Stores", icon: "💎", description: "High-value items with detailed descriptions", color: "from-purple-50 to-pink-50 border-purple-100" },
              { name: "Florists", icon: "🌸", description: "Seasonal products and custom arrangements", color: "from-rose-50 to-pink-50 border-rose-100" }
            ].map((business, index) => (
              <div key={index} className={`bg-gradient-to-br ${business.color} p-6 sm:p-8 rounded-2xl border-2 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                <div className="text-4xl sm:text-5xl mb-4 sm:mb-6">{business.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{business.name}</h3>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{business.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Businesses Choose WaveOrder
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              The advantages that make WaveOrder the preferred WhatsApp ordering solution
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Zap,
                title: "5-Minute Setup",
                description: "Get your WhatsApp ordering system live in minutes, not days or weeks",
                highlight: "Instant deployment"
              },
              {
                icon: Shield,
                title: "No API Costs",
                description: "Use your existing WhatsApp without expensive API integrations",
                highlight: "Zero monthly fees"
              },
              {
                icon: Users,
                title: "Unlimited Team",
                description: "Add as many team members as you need without extra charges",
                highlight: "Scale freely"
              },
              {
                icon: Smartphone,
                title: "Mobile Performance",
                description: "Lightning-fast catalogs that load in under 2 seconds",
                highlight: "Speed optimized"
              },
              {
                icon: Palette,
                title: "Full Customization",
                description: "Complete control over branding, colors, and appearance",
                highlight: "Your unique style"
              },
              {
                icon: Globe,
                title: "Works Everywhere",
                description: "Perfect for businesses in any country with WhatsApp",
                highlight: "Global ready"
              }
            ].map((benefit, index) => {
              const IconComponent = benefit.icon
              return (
                <div key={index} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-500 to-emerald-500 text-white rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                    <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed text-sm sm:text-base">{benefit.description}</p>
                  <div className="inline-block bg-teal-100 text-teal-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold">
                    {benefit.highlight}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your WhatsApp Orders?
          </h2>
          <p className="text-lg sm:text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Join businesses worldwide who are already streamlining their operations and growing their revenue with WaveOrder.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-teal-600 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 border-2 border-white text-white text-lg font-semibold rounded-xl hover:bg-white hover:text-teal-600 transition-colors"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}