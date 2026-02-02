// src/components/site/Cookies.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Cookie, Settings, Check, X, Shield, BarChart3, Palette, Target, Eye, Globe, Smartphone } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function Cookies() {
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: true,
    marketing: false,
    functional: true
  })

  const [showPreferences, setShowPreferences] = useState(false)

  const handlePreferenceChange = (category: keyof typeof preferences) => {
    if (category === 'essential') return // Essential cookies cannot be disabled
    
    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const savePreferences = () => {
    // In a real implementation, this would save to localStorage or send to server
    setShowPreferences(false)
    toast.success('Cookie preferences saved successfully!')
  }

  const sections = [
    {
      id: 'what-are-cookies',
      title: 'What Are Cookies',
      icon: Cookie
    },
    {
      id: 'how-we-use-cookies',
      title: 'How We Use Cookies',
      icon: Settings
    },
    {
      id: 'third-party-cookies',
      title: 'Third-Party Cookies',
      icon: Globe
    },
    {
      id: 'managing-preferences',
      title: 'Managing Preferences',
      icon: Palette
    },
    {
      id: 'mobile-apps',
      title: 'Mobile Apps',
      icon: Smartphone
    }
  ]

  const cookieCategories = [
    {
      name: 'Essential Cookies',
      key: 'essential' as const,
      required: true,
      description: 'These cookies are necessary for the website to function and cannot be disabled.',
      examples: ['Session management', 'Security tokens', 'Load balancing'],
      duration: 'Session or up to 1 year',
      icon: Shield,
      color: 'bg-red-100 text-red-600'
    },
    {
      name: 'Analytics Cookies',
      key: 'analytics' as const,
      required: false,
      description: 'Help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      examples: ['Google Analytics', 'Page view tracking', 'User behavior analysis'],
      duration: 'Up to 2 years',
      icon: BarChart3,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      name: 'Functional Cookies',
      key: 'functional' as const,
      required: false,
      description: 'Enable enhanced functionality and personalization, such as remembering your preferences.',
      examples: ['Language preferences', 'User interface settings', 'Form data'],
      duration: 'Up to 1 year',
      icon: Palette,
      color: 'bg-green-100 text-green-600'
    },
    {
      name: 'Marketing Cookies',
      key: 'marketing' as const,
      required: false,
      description: 'Used to track visitors across websites to display relevant advertisements.',
      examples: ['Ad targeting', 'Conversion tracking', 'Social media pixels'],
      duration: 'Up to 1 year',
      icon: Target,
      color: 'bg-purple-100 text-purple-600'
    }
  ]

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Cookie className="w-10 h-10" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Cookie Policy
            </h1>
            <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
              Learn how WaveOrder uses cookies and tracking technologies to improve your experience 
              and provide personalized services.
            </p>
            <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 inline-block border border-white/20">
              <p className="text-sm text-gray-500">
                Last updated: <span className="font-semibold text-gray-700">September 18, 2025</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-12 bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Quick Navigation</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sections.map((section) => {
              const IconComponent = section.icon
              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center p-4 bg-white rounded-lg hover:bg-orange-50 hover:border-orange-200 border-2 border-gray-100 transition-all group"
                >
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-orange-200">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900 group-hover:text-orange-700">{section.title}</span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* Cookie Preferences Manager */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-100 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3 flex items-center">
                  <Settings className="w-8 h-8 mr-3 text-orange-600" />
                  Manage Cookie Preferences
                </h2>
                <p className="text-gray-600 text-lg">
                  Control which cookies you allow WaveOrder to use on your device
                </p>
              </div>
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg font-semibold"
              >
                <Settings className="w-5 h-5 mr-2" />
                {showPreferences ? 'Hide' : 'Show'} Preferences
              </button>
            </div>

            {showPreferences && (
              <div className="space-y-6">
                <div className="grid gap-6">
                  {cookieCategories.map((category) => {
                    const IconComponent = category.icon
                    return (
                      <div key={category.key} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-200 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center mr-4`}>
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                                {category.name}
                                {category.required && (
                                  <span className="ml-3 text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-medium">
                                    Required
                                  </span>
                                )}
                              </h3>
                              <p className="text-gray-600 mt-1">{category.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handlePreferenceChange(category.key)}
                            disabled={category.required}
                            className={`w-14 h-7 rounded-full transition-all relative ${
                              preferences[category.key]
                                ? 'bg-orange-500 shadow-lg'
                                : 'bg-gray-300'
                            } ${category.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                          >
                            <div
                              className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
                                preferences[category.key] ? 'translate-x-8' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Examples:</h4>
                            <ul className="text-gray-600 space-y-1">
                              {category.examples.map((example, index) => (
                                <li key={index} className="flex items-center">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                                  {example}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Duration:</h4>
                            <p className="text-gray-600">{category.duration}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <button
                    onClick={savePreferences}
                    className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all flex items-center font-semibold shadow-lg"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* What Are Cookies */}
          <div id="what-are-cookies" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mr-4">
                <Cookie className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">What Are Cookies?</h2>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-100">
              <p className="text-lg text-gray-700 leading-relaxed">
                Cookies are small text files that are stored on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences, 
                analyzing how you use our service, and enabling essential functionality. Think of them 
                as helpful digital notes that make your experience smoother and more personalized.
              </p>
            </div>
          </div>

          {/* How We Use Cookies */}
          <div id="how-we-use-cookies" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mr-4">
                <Settings className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">How We Use Cookies</h2>
            </div>
            
            <div className="space-y-8">
              {[
                {
                  title: 'Essential Cookies',
                  subtitle: 'Always Active',
                  icon: Shield,
                  color: 'from-red-50 to-pink-50 border-red-100',
                  iconColor: 'bg-red-100 text-red-600',
                  items: [
                    { title: 'Authentication', desc: 'Keep you logged in to your account securely' },
                    { title: 'Security', desc: 'Protect against fraud and unauthorized access' },
                    { title: 'Session Management', desc: 'Maintain your session state across pages' },
                    { title: 'Load Balancing', desc: 'Distribute traffic efficiently across our servers' }
                  ]
                },
                {
                  title: 'Analytics Cookies',
                  subtitle: 'Optional',
                  icon: BarChart3,
                  color: 'from-blue-50 to-indigo-50 border-blue-100',
                  iconColor: 'bg-blue-100 text-blue-600',
                  items: [
                    { title: 'Usage Analytics', desc: 'Understand how visitors use our website' },
                    { title: 'Performance Monitoring', desc: 'Identify and fix technical issues' },
                    { title: 'Feature Usage', desc: 'See which features are most popular' },
                    { title: 'Error Tracking', desc: 'Monitor and resolve bugs quickly' }
                  ]
                },
                {
                  title: 'Functional Cookies',
                  subtitle: 'Optional',
                  icon: Palette,
                  color: 'from-green-50 to-emerald-50 border-green-100',
                  iconColor: 'bg-green-100 text-green-600',
                  items: [
                    { title: 'Preferences', desc: 'Remember your language and display settings' },
                    { title: 'Form Data', desc: 'Save form inputs to improve user experience' },
                    { title: 'UI State', desc: 'Remember your dashboard layout preferences' },
                    { title: 'Feature Toggles', desc: 'Enable beta features you\'ve opted into' }
                  ]
                },
                {
                  title: 'Marketing Cookies',
                  subtitle: 'Optional',
                  icon: Target,
                  color: 'from-purple-50 to-pink-50 border-purple-100',
                  iconColor: 'bg-purple-100 text-purple-600',
                  items: [
                    { title: 'Conversion Tracking', desc: 'Measure the effectiveness of our marketing' },
                    { title: 'Retargeting', desc: 'Show relevant ads on other websites' },
                    { title: 'Social Media', desc: 'Enable social sharing functionality' },
                    { title: 'Campaign Attribution', desc: 'Track which marketing efforts bring users' }
                  ]
                }
              ].map((category, index) => {
                const IconComponent = category.icon
                return (
                  <div key={index} className={`bg-gradient-to-r ${category.color} rounded-2xl p-8 border`}>
                    <div className="flex items-center mb-6">
                      <div className={`w-12 h-12 ${category.iconColor} rounded-xl flex items-center justify-center mr-4`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>
                        <span className="text-sm text-gray-600 font-medium">({category.subtitle})</span>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="bg-white rounded-lg p-4 border border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                          <p className="text-gray-600 text-sm">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Third-Party Cookies */}
          <div id="third-party-cookies" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mr-4">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Third-Party Cookies</h2>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100 mb-8">
              <p className="text-lg text-gray-700 leading-relaxed">
                We work with trusted third-party service providers who may also set cookies on your device 
                to help us deliver our services effectively:
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Analytics Services',
                  icon: '📊',
                  services: [
                    'Google Analytics - Website traffic and user behavior analysis',
                    'Microsoft Clarity - User session recordings and heatmaps'
                  ]
                },
                {
                  title: 'Email Communication',
                  icon: '📧',
                  services: [
                    'Resend - Transactional email delivery',
                    'Email notifications - Account and order updates'
                  ]
                },
                {
                  title: 'Payment Processing',
                  icon: '💳',
                  services: [
                    'Stripe - Secure payment processing and billing',
                    'Payment security - PCI DSS compliant transactions'
                  ]
                }
              ].map((category, index) => (
                <div key={index} className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-indigo-200 transition-colors">
                  <div className="text-3xl mb-4">{category.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{category.title}</h3>
                  <div className="space-y-3">
                    {category.services.map((service, serviceIndex) => (
                      <div key={serviceIndex} className="flex items-start">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <p className="text-gray-600 text-sm">{service}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Managing Preferences */}
          <div id="managing-preferences" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mr-4">
                <Palette className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Managing Your Cookie Preferences</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Through Our Website</h3>
                <div className="space-y-4">
                  {[
                    'Use the cookie preference center above to enable/disable categories',
                    'Your preferences are saved and applied across all visits',
                    'You can change your preferences at any time',
                    'Settings are remembered for future visits'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Browser Controls</h3>
                <div className="space-y-4">
                  {[
                    { browser: 'Chrome', path: 'Settings → Privacy and Security → Cookies' },
                    { browser: 'Firefox', path: 'Preferences → Privacy & Security → Cookies' },
                    { browser: 'Safari', path: 'Preferences → Privacy → Cookies' },
                    { browser: 'Edge', path: 'Settings → Cookies and Site Permissions' }
                  ].map((item, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-gray-100">
                      <h4 className="font-semibold text-gray-900">{item.browser}</h4>
                      <p className="text-gray-600 text-sm">{item.path}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Apps */}
          <div id="mobile-apps" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mr-4">
                <Smartphone className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Mobile Apps and Device Information</h2>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Our mobile applications may collect device information to provide optimal performance:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  'Device type and operating system version',
                  'App version and usage statistics',
                  'Push notification tokens for messaging',
                  'Crash reports and error logs for debugging'
                ].map((item, index) => (
                  <div key={index} className="flex items-start bg-white rounded-lg p-4">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Do Not Track */}
          <div className="mb-20">
            <div className="border-l-4 border-orange-500 pl-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Do Not Track</h2>
              <p className="text-gray-700 leading-relaxed">
                Some browsers include a "Do Not Track" feature that signals websites not to track users. 
                Currently, there is no industry standard for how to respond to these signals. WaveOrder 
                respects your cookie preferences set through our preference center above.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-20 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-8 border border-orange-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Us About Cookies</h2>
            <p className="text-gray-700 mb-6">
              If you have questions about our use of cookies or this Cookie Policy:
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <Cookie className="w-5 h-5 text-orange-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Email</div>
                  <a href="mailto:privacy@waveorder.app" className="text-orange-600 hover:text-orange-700">
                    privacy@waveorder.app
                  </a>
                </div>
              </div>
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-orange-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Subject Line</div>
                  <div className="text-gray-600 text-sm">"Cookie Policy Question"</div>
                </div>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-orange-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Address</div>
                  <div className="text-gray-600 text-sm">Sami Frashëri Sreet, Tiranë, Albania</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Questions About Cookies?
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Our privacy team is happy to explain our cookie practices and help you manage your preferences. 
              We believe in transparency and putting you in control.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Cookie className="w-5 h-5 mr-2" />
                Contact Privacy Team
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center px-8 py-4 border-2 border-orange-500 text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition-colors"
              >
                <Eye className="w-5 h-5 mr-2" />
                View Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
      </div>
    </>
  )
}