// src/components/site/Demo.tsx
'use client'

import Link from 'next/link'
import { ArrowRight, Play, Smartphone, MessageSquare, ShoppingCart, Eye, Users, BarChart, Settings, ExternalLink } from 'lucide-react'

export default function Demo() {
  const demoCards = [
    {
      title: "Restaurant Catalog",
      description: "See how a pizza restaurant showcases their menu with categories, variants, and beautiful product images.",
      type: "Customer View",
      icon: Smartphone,
      preview: "Mobile catalog with 25+ menu items",
      features: ["Product categories", "Item variants", "Beautiful images", "Mobile optimized"],
      demoUrl: "#", // Will be replaced with actual SupaDemo links
      color: "teal"
    },
    {
      title: "WhatsApp Ordering",
      description: "Experience the complete customer journey from browsing products to placing an order via WhatsApp.",
      type: "Customer Flow",
      icon: MessageSquare,
      preview: "Complete ordering experience",
      features: ["Browse catalog", "Add to cart", "WhatsApp integration", "Order confirmation"],
      demoUrl: "#",
      color: "emerald"
    },
    {
      title: "Business Dashboard",
      description: "Explore the business owner's view with order management, product setup, and analytics.",
      type: "Business View",
      icon: BarChart,
      preview: "Full admin dashboard",
      features: ["Order management", "Product setup", "Team collaboration", "Analytics"],
      demoUrl: "#",
      color: "blue"
    },
    {
      title: "Team Management",
      description: "See how restaurants can invite staff members and manage different user roles and permissions.",
      type: "Business Feature",
      icon: Users,
      preview: "Multi-user collaboration",
      features: ["User invitations", "Role management", "Permission settings", "Team workflow"],
      demoUrl: "#",
      color: "purple"
    },
    {
      title: "Order Processing",
      description: "Watch how orders flow from customer to business owner's WhatsApp with all details formatted perfectly.",
      type: "Business Flow",
      icon: ShoppingCart,
      preview: "End-to-end order flow",
      features: ["Order reception", "Status updates", "Customer communication", "Order tracking"],
      demoUrl: "#",
      color: "orange"
    },
    {
      title: "Catalog Setup",
      description: "Learn how easy it is to create a professional catalog using manual entry, CSV import, or API integration.",
      type: "Setup Process",
      icon: Settings,
      preview: "Complete setup wizard",
      features: ["Manual entry", "CSV import", "API integration", "Live preview"],
      demoUrl: "#",
      color: "indigo"
    }
  ]

  const businessTypes = [
    {
      name: "Mario's Pizza",
      type: "Restaurant",
      description: "Full-service Italian restaurant with delivery and pickup options",
      image: "/images/demo-pizza.jpg",
      highlights: ["40+ menu items", "Custom modifiers", "Delivery zones"]
    },
    {
      name: "Brew & Beans",
      type: "Cafe",
      description: "Specialty coffee shop with pastries and light meals",
      image: "/images/demo-cafe.jpg",
      highlights: ["Seasonal menu", "Custom drinks", "Quick ordering"]
    },
    {
      name: "Fresh Market",
      type: "Grocery",
      description: "Local grocery store with fresh produce and household items",
      image: "/images/demo-grocery.jpg",
      highlights: ["500+ products", "Category organization", "Bulk ordering"]
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      teal: "bg-teal-100 text-teal-600 border-teal-200",
      emerald: "bg-emerald-100 text-emerald-600 border-emerald-200",
      blue: "bg-blue-100 text-blue-600 border-blue-200",
      purple: "bg-purple-100 text-purple-600 border-purple-200",
      orange: "bg-orange-100 text-orange-600 border-orange-200",
      indigo: "bg-indigo-100 text-indigo-600 border-indigo-200"
    }
    return colors[color as keyof typeof colors] || colors.teal
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              See WaveOrder in Action
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Explore interactive demos showcasing real restaurant catalogs, customer ordering experiences, 
              and business management features. No signup required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register"
                className="px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center justify-center"
              >
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                href="/contact"
                className="px-8 py-4 border-2 border-teal-600 text-teal-600 text-lg font-semibold rounded-lg hover:bg-teal-50 transition-colors inline-flex items-center justify-center"
              >
                Schedule Live Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demos Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Interactive Demos
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Try WaveOrder features hands-on with these live, interactive demonstrations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {demoCards.map((demo, index) => {
              const IconComponent = demo.icon
              const colorClasses = getColorClasses(demo.color)
              
              return (
                <div key={index} className="bg-white border-2 border-gray-100 rounded-2xl p-6 hover:border-teal-200 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${colorClasses} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {demo.type}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{demo.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{demo.description}</p>
                  
                  <div className="mb-6">
                    <div className="text-sm font-medium text-gray-700 mb-2">{demo.preview}</div>
                    <ul className="space-y-1">
                      {demo.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="text-sm text-gray-600 flex items-center">
                          <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center group">
                    <Play className="w-4 h-4 mr-2" />
                    Try Interactive Demo
                    <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Sample Business Demos */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Business Examples
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Explore catalogs from different types of businesses to see how WaveOrder adapts to various industries
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {businessTypes.map((business, index) => (
              <div key={index} className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <Smartphone className="w-16 h-16 mx-auto mb-4" />
                    <p className="font-medium">{business.name} Demo</p>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{business.name}</h3>
                    <span className="px-3 py-1 bg-teal-100 text-teal-700 text-sm font-medium rounded-full">
                      {business.type}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{business.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    {business.highlights.map((highlight, highlightIndex) => (
                      <div key={highlightIndex} className="flex items-center text-sm text-gray-600">
                        <Eye className="w-4 h-4 text-teal-500 mr-2" />
                        {highlight}
                      </div>
                    ))}
                  </div>
                  
                  <button className="w-full bg-teal-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center">
                    <Play className="w-4 h-4 mr-2" />
                    View {business.type} Demo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How WaveOrder Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple 3-step process from catalog creation to receiving orders
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                title: "Create Your Catalog",
                description: "Add your products manually, upload via CSV, or integrate with your existing system. Customize with your branding and set up categories.",
                features: ["Product management", "Custom branding", "Mobile optimization"]
              },
              {
                step: "2", 
                title: "Share Your Link",
                description: "Get your unique catalog URL and share it with customers via social media, QR codes, or add it to your existing website.",
                features: ["Unique URL", "QR code generation", "Social sharing"]
              },
              {
                step: "3",
                title: "Receive Orders",
                description: "Customers browse your catalog and place orders that come directly to your WhatsApp with all details formatted perfectly.",
                features: ["WhatsApp integration", "Formatted messages", "Instant notifications"]
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.step}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{step.description}</p>
                <ul className="space-y-2">
                  {step.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-sm text-gray-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-teal-400 rounded-full mr-2"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Create Your Own Catalog?
          </h2>
          <p className="text-xl text-teal-100 mb-8 max-w-2xl mx-auto">
            Start with our free plan and have your WhatsApp ordering system ready in minutes. 
            No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="inline-flex items-center px-8 py-4 bg-white text-teal-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link 
              href="/contact"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white text-lg font-semibold rounded-lg hover:bg-white hover:text-teal-600 transition-colors"
            >
              Book a Demo Call
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}