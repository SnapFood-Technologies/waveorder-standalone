'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Play, Smartphone, MessageSquare, ShoppingCart, Eye, Users, BarChart, Settings, ExternalLink, X } from 'lucide-react'

export default function Demo() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentDemoUrl, setCurrentDemoUrl] = useState('')
  const [currentDemoTitle, setCurrentDemoTitle] = useState('')

  const openModal = (url: string, title: string) => {
    setCurrentDemoUrl(url)
    setCurrentDemoTitle(title)
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden' // Prevent background scrolling
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentDemoUrl('')
    setCurrentDemoTitle('')
    document.body.style.overflow = 'unset' // Restore scrolling
  }

  const demoCards = [
    {
      title: "Catalog Setup",
      description: "Learn how easy it is to create a professional catalog using manual entry, CSV import, or API integration.",
      type: "Setup Process",
      icon: Settings,
      preview: "Complete setup wizard",
      features: ["Manual entry", "CSV import", "API integration", "Live preview"],
      demoUrl: "https://app.supademo.com/embed/cmg2kihqg88ri10k8t15kzoiw?embed_v=2&utm_source=embed",
      color: "indigo"
    },
    {
      title: "WhatsApp Ordering",
      description: "Experience the complete customer journey from browsing products to placing an order via WhatsApp.",
      type: "Customer Flow",
      icon: MessageSquare,
      preview: "Complete ordering experience",
      features: ["Browse catalog", "Add to cart", "WhatsApp integration", "Order confirmation"],
      demoUrl: "https://app.supademo.com/embed/cmg2o5mwe8ahm10k899keti1k?embed_v=2&utm_source=embed",
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
    // {
    //   title: "Team Management",
    //   description: "See how restaurants can invite staff members and manage different user roles and permissions.",
    //   type: "Business Feature",
    //   icon: Users,
    //   preview: "Multi-user collaboration",
    //   features: ["User invitations", "Role management", "Permission settings", "Team workflow"],
    //   demoUrl: "#",
    //   color: "purple"
    // },
    {
      title: "Order Processing",
      description: "Watch how orders flow from customer to business owner's WhatsApp with all details formatted perfectly.",
      type: "Business Flow",
      icon: ShoppingCart,
      preview: "End-to-end order flow",
      features: ["Order reception", "Status updates", "Customer communication", "Order tracking"],
      demoUrl: "https://app.supademo.com/embed/cmg2v47jq8atm10k8lrueelr3?embed_v=2&utm_source=embed",
      color: "orange"
    }
    // {
    //   title: "Restaurant Catalog",
    //   description: "See how a pizza restaurant showcases their menu with categories, variants, and beautiful product images.",
    //   type: "Customer View",
    //   icon: Smartphone,
    //   preview: "Mobile catalog with 25+ menu items",
    //   features: ["Product categories", "Item variants", "Beautiful images", "Mobile optimized"],
    //   demoUrl: "https://app.supademo.com/embed/cmg2kihqg88ri10k8t15kzoiw?embed_v=2&utm_source=embed",
    //   color: "teal"
    // },
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
                href="/auth/register"
                className="px-8 py-4 bg-teal-600 text-white text-lg font-semibold rounded-lg hover:bg-teal-700 transition-colors inline-flex items-center justify-center"
              >
                Start Free
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

          <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
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
                  
                  <button 
                    onClick={() => openModal(demo.demoUrl, demo.title)}
                    className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center group"
                    disabled={demo.demoUrl === '#'}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Play Interactive Demo
                    <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              )
            })}
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
                features: ["Unique URL", "Advanced Analytics", "Social sharing"]
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
              href="/auth/register"
              className="inline-flex items-center px-8 py-4 bg-white text-teal-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Free
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

      {/* Demo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-80"
            onClick={closeModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">{currentDemoTitle}</h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 p-4 overflow-hidden">
              <iframe 
                src={currentDemoUrl}
                loading="lazy" 
                title={currentDemoTitle}
                allow="clipboard-write" 
                frameBorder="0" 
                className="w-full h-full rounded-lg"
                style={{ 
                  height: '60vh'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}