// src/components/site/About.tsx
'use client'

import Link from 'next/link'
import { ArrowRight, Heart, Target, Shield, Users, Globe, Zap, Award, TrendingUp, Smartphone, QrCode, Settings, BarChart3, CreditCard, Upload } from 'lucide-react'

export default function About() {
  const values = [
    {
      icon: Heart,
      title: "Customer-First",
      description: "Every feature we build starts with understanding what restaurants and their customers need for a seamless ordering experience."
    },
    {
      icon: Zap,
      title: "Simplicity",
      description: "We believe powerful tools should be easy to use. Complex features hidden behind simple, intuitive interfaces."
    },
    {
      icon: Shield,
      title: "Reliability",
      description: "Your business depends on orders flowing smoothly. We build robust systems that work when you need them most."
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "WhatsApp ordering should be available to every business, regardless of size or technical expertise."
    }
  ]

  const platforms = [
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Beautiful catalogs optimized for smartphones where most orders happen"
    },
    {
      icon: Globe,
      title: "No App Required",
      description: "Customers use WhatsApp they already have - no downloads needed"
    },
    {
      icon: Zap,
      title: "Instant Setup",
      description: "Get your WhatsApp ordering catalog live in under 5 minutes"
    }
  ]

  const setupOptions = [
    {
      icon: Settings,
      title: "Manual Setup",
      description: "Add products directly through our intuitive dashboard interface",
      time: "Start immediately"
    },
    {
      icon: Upload,
      title: "CSV Import",
      description: "Bulk upload your entire menu using CSV file import",
      time: "5-10 minutes"
    },
    {
      icon: Target,
      title: "API Integration",
      description: "Connect existing systems through custom API integrations",
      time: "Upon request"
    }
  ]

  const businessTypes = [
    {
      category: "Primary Focus",
      types: ["Restaurants & Cafes", "Food Delivery Services", "Quick Service Restaurants"]
    },
    {
      category: "Secondary Markets",
      types: ["Retail Stores", "Home-based Food Businesses", "Jewelry Stores", "Florists", "Any Product-based Business"]
    }
  ]

  const dashboardFeatures = [
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track order patterns, popular items, and business performance"
    },
    {
      icon: Users,
      title: "Customer Management",
      description: "CRM features with customer contact info and order history"
    },
    {
      icon: CreditCard,
      title: "Flexible Payments",
      description: "Cash on delivery, local payments, and wholesale pricing options"
    },
    {
      icon: Settings,
      title: "Team Collaboration",
      description: "Multi-user access with customizable permissions for your team"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Making WhatsApp Ordering Super Easy
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We believe every restaurant and business should be able to leverage WhatsApp for orders 
              without technical complexity or expensive setup costs. WaveOrder makes this vision a reality.
            </p>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 inline-block border border-white/20">
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">5 min</div>
                  <div className="text-sm text-gray-600">Setup Time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">$0</div>
                  <div className="text-sm text-gray-600">API Costs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">24/7</div>
                  <div className="text-sm text-gray-600">Order Processing</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                To democratize WhatsApp ordering by providing powerful, affordable tools that help 
                businesses of all sizes create professional ordering experiences for their customers.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We started WaveOrder after seeing countless restaurant owners struggling with manual WhatsApp 
                order management - losing orders in chat threads, spending hours creating digital menus, 
                and missing out on the convenience their customers wanted.
              </p>
            </div>
            <div className="bg-gradient-to-br from-teal-100 to-emerald-100 p-8 rounded-2xl">
              <div className="text-center">
                <Target className="w-16 h-16 text-teal-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Built for Restaurant Success
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Every feature is designed with restaurant operations in mind - from handling 
                  rush hour orders to managing complex menu variations and team collaboration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we build and every decision we make
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon
              return (
                <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 text-center hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              WhatsApp-Native Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Leveraging the platform customers already use, without requiring expensive API integrations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {platforms.map((platform, index) => {
              const IconComponent = platform.icon
              return (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100 text-center">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{platform.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{platform.description}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-12 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Customer Journey</h3>
            <div className="grid md:grid-cols-5 gap-4 text-center">
              {[
                "Customer clicks catalog link",
                "Browses beautiful web catalog", 
                "Selects items & clicks 'Order via WhatsApp'",
                "Formatted message opens in WhatsApp",
                "Business receives order on WhatsApp"
              ].map((step, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Setup Options */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Flexible Setup Options
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the setup method that works best for your business and technical comfort level
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {setupOptions.map((option, index) => {
              const IconComponent = option.icon
              return (
                <div key={index} className="bg-white p-8 rounded-xl border border-gray-200 hover:border-orange-200 transition-colors">
                  <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-6">
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{option.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{option.description}</p>
                  <div className="text-sm font-medium text-orange-600">{option.time}</div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Business Dashboard */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Business Dashboard
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your WhatsApp orders, track performance, and grow your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {dashboardFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100 text-center">
                  <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Target Markets */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Who We Serve
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From restaurants to retail, WaveOrder adapts to any product-based business
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {businessTypes.map((group, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{group.category}</h3>
                <div className="space-y-4">
                  {group.types.map((type, typeIndex) => (
                    <div key={typeIndex} className="flex items-center bg-gray-50 rounded-lg p-4">
                      <div className="w-3 h-3 bg-teal-500 rounded-full mr-4"></div>
                      <span className="text-gray-700 font-medium">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Value Propositions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose WaveOrder?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Easy Setup",
                description: "Get started in minutes without technical expertise",
                highlight: "5-minute setup"
              },
              {
                title: "WhatsApp Native",
                description: "Leverages the platform customers already use daily",
                highlight: "No new apps needed"
              },
              {
                title: "No Website Required",
                description: "Complete solution without needing separate website development",
                highlight: "Instant online presence"
              },
              {
                title: "Mobile Optimized",
                description: "Perfect experience on all devices, especially smartphones",
                highlight: "Sub-2 second load times"
              },
              {
                title: "Customizable Branding",
                description: "Maintain your brand identity with custom colors and logos",
                highlight: "Your brand, your way"
              },
              {
                title: "Scalable Solution",
                description: "Grows with your business from startup to enterprise",
                highlight: "No commission fees"
              }
            ].map((prop, index) => (
              <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{prop.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{prop.description}</p>
                <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  {prop.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-50 to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your WhatsApp Orders?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join businesses worldwide who are already streamlining their WhatsApp ordering with WaveOrder. 
            Start free today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-lg font-semibold rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Start Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              href="/demo"
              className="inline-flex items-center px-8 py-4 border-2 border-teal-500 text-teal-600 text-lg font-semibold rounded-xl hover:bg-teal-50 transition-colors"
            >
              View Live Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}