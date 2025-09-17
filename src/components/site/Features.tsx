// src/components/site/Features.tsx
'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare, Upload, ShoppingCart, BarChart, Smartphone, Zap, Check, Clock, CreditCard, Users, Globe, Settings, Target, Truck, Shield, ChevronRight, Star, Award, TrendingUp, Package, Palette, Database } from 'lucide-react'

export default function Features() {
  const mainFeatures = [
    {
      icon: MessageSquare,
      title: "Direct WhatsApp Orders",
      description: "Orders come straight to your existing WhatsApp number with all customer details formatted perfectly. No expensive API required.",
      benefits: ["Use your current WhatsApp", "No monthly API fees", "Instant notifications", "Formatted order messages"],
      highlight: "Save $50-200/month on API costs"
    },
    {
      icon: Upload,
      title: "Flexible Menu Setup",
      description: "Choose how you want to build your catalog - manual entry, CSV upload, or API integration for advanced users.",
      benefits: ["Manual product entry", "Bulk CSV import", "API integration option", "Live preview as you build"],
      highlight: "3 ways to get started"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Catalogs",
      description: "Beautiful, fast-loading catalogs optimized for mobile devices where your customers actually shop.",
      benefits: ["Sub-2 second load times", "Mobile-optimized design", "Works on all devices", "Professional appearance"],
      highlight: "Lightning fast performance"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Invite team members with different access levels to help manage orders, inventory, and customer service.",
      benefits: ["Multiple user accounts", "Role-based permissions", "Owner/Manager/Staff roles", "Team invitations"],
      highlight: "Built for restaurants"
    },
    {
      icon: BarChart,
      title: "Analytics & Insights",
      description: "Track your best-selling items, peak order times, and customer patterns to optimize your business.",
      benefits: ["Order analytics", "Revenue tracking", "Customer insights", "Performance metrics"],
      highlight: "Data-driven decisions"
    },
    {
      icon: Palette,
      title: "Custom Branding",
      description: "Customize your catalog with your business's colors, logo, and branding to create a professional experience.",
      benefits: ["Brand colors", "Logo upload", "Custom themes", "Professional look"],
      highlight: "Your brand, your way"
    }
  ]

  const additionalFeatures = [
    {
      icon: Package,
      title: "Inventory Management",
      description: "Track stock levels and toggle items on/off when out of stock",
      category: "Management"
    },
    {
      icon: Globe,
      title: "Multi-language Support",
      description: "Serve customers in their preferred language",
      category: "Localization"
    },
    {
      icon: CreditCard,
      title: "Payment Flexibility",
      description: "Cash on delivery, bank transfers, and regional payment methods",
      category: "Payments"
    },
    {
      icon: Target,
      title: "Customer Tiers",
      description: "VIP pricing and wholesale options for bulk buyers",
      category: "Customer Management"
    },
    {
      icon: Truck,
      title: "Delivery Management",
      description: "Delivery zones, fees, and estimated delivery times",
      category: "Operations"
    },
    {
      icon: Database,
      title: "Order History",
      description: "Complete order tracking and customer relationship management",
      category: "Management"
    },
    {
      icon: Shield,
      title: "Business Types",
      description: "Optimized for restaurants, cafes, retail, grocery, and more",
      category: "Flexibility"
    },
    {
      icon: Settings,
      title: "Custom Domains",
      description: "Professional URLs with your own domain name",
      category: "Branding"
    }
  ]

  const comparisonData = [
    {
      feature: "Setup Time",
      waveorder: "5 minutes",
      competitors: "Days to weeks",
      advantage: true
    },
    {
      feature: "WhatsApp API Cost",
      waveorder: "$0/month",
      competitors: "$50-200/month",
      advantage: true
    },
    {
      feature: "Team Members",
      waveorder: "Unlimited",
      competitors: "Limited or extra cost",
      advantage: true
    },
    {
      feature: "Custom Branding",
      waveorder: "Full customization",
      competitors: "Basic themes only",
      advantage: true
    },
    {
      feature: "Mobile Performance",
      waveorder: "Sub-2 seconds",
      competitors: "3-5 seconds",
      advantage: true
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need for WhatsApp Orders
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              WaveOrder combines simplicity with powerful features to help restaurants and businesses 
              manage WhatsApp orders efficiently. No technical expertise required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/auth/register"
                className="px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center justify-center"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                href="/demo"
                className="px-8 py-4 border-2 border-teal-600 text-teal-600 text-lg font-semibold rounded-lg hover:bg-teal-50 transition-colors inline-flex items-center justify-center"
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
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built specifically for restaurants and food businesses that want to leverage WhatsApp
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {mainFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-teal-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
                        <span className="px-3 py-1 bg-teal-100 text-teal-700 text-sm font-medium rounded-full">
                          {feature.highlight}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                      <ul className="space-y-3">
                        {feature.benefits.map((benefit, benefitIndex) => (
                          <li key={benefitIndex} className="flex items-center">
                            <Check className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0" />
                            <span className="text-gray-700">{benefit}</span>
                          </li>
                        ))}
                      </ul>
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
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every tool you need to run a successful WhatsApp ordering business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {additionalFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="mb-2">
                    <span className="text-xs font-medium text-teal-600 uppercase tracking-wide">
                      {feature.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose WaveOrder?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              See how we compare to other WhatsApp ordering solutions
            </p>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-teal-600">WaveOrder</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-500">Competitors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comparisonData.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.feature}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-semibold text-teal-600">{item.waveorder}</span>
                          {item.advantage && <Star className="w-4 h-4 text-yellow-400 ml-2" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500">{item.competitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Business Types Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perfect for Any Business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              While optimized for restaurants, WaveOrder works great for many business types
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Restaurants", icon: "🍽️", description: "Full menu management with modifiers and variants" },
              { name: "Cafes", icon: "☕", description: "Perfect for coffee shops and quick service" },
              { name: "Retail Stores", icon: "🛍️", description: "Product catalogs with inventory tracking" },
              { name: "Grocery Stores", icon: "🛒", description: "Large product catalogs with categories" },
              { name: "Jewelry Stores", icon: "💎", description: "High-value items with detailed descriptions" },
              { name: "Florists", icon: "🌸", description: "Seasonal products and custom arrangements" }
            ].map((business, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{business.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{business.name}</h3>
                <p className="text-gray-600">{business.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your WhatsApp Orders?
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses already using WaveOrder to streamline their operations and grow their revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-white text-teal-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-lg hover:bg-white hover:text-teal-600 transition-colors"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}