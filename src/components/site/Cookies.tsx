// src/components/site/Cookies.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Cookie, Settings, Check, X } from 'lucide-react'

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
    console.log('Saving cookie preferences:', preferences)
    setShowPreferences(false)
    alert('Cookie preferences saved successfully!')
  }

  const cookieCategories = [
    {
      name: 'Essential Cookies',
      key: 'essential' as const,
      required: true,
      description: 'These cookies are necessary for the website to function and cannot be disabled.',
      examples: ['Session management', 'Security tokens', 'Load balancing'],
      duration: 'Session or up to 1 year'
    },
    {
      name: 'Analytics Cookies',
      key: 'analytics' as const,
      required: false,
      description: 'Help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      examples: ['Google Analytics', 'Page view tracking', 'User behavior analysis'],
      duration: 'Up to 2 years'
    },
    {
      name: 'Functional Cookies',
      key: 'functional' as const,
      required: false,
      description: 'Enable enhanced functionality and personalization, such as remembering your preferences.',
      examples: ['Language preferences', 'User interface settings', 'Form data'],
      duration: 'Up to 1 year'
    },
    {
      name: 'Marketing Cookies',
      key: 'marketing' as const,
      required: false,
      description: 'Used to track visitors across websites to display relevant advertisements.',
      examples: ['Ad targeting', 'Conversion tracking', 'Social media pixels'],
      duration: 'Up to 1 year'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Cookie className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Cookie Policy
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              How WaveOrder uses cookies and tracking technologies
            </p>
            <p className="text-gray-500">
              Last updated: January 15, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Cookie Preferences */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Manage Cookie Preferences
                </h2>
                <p className="text-gray-600">
                  Control which cookies you allow WaveOrder to use
                </p>
              </div>
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                {showPreferences ? 'Hide' : 'Show'} Preferences
              </button>
            </div>

            {showPreferences && (
              <div className="space-y-4">
                {cookieCategories.map((category) => (
                  <div key={category.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                        {category.required && (
                          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Required
                          </span>
                        )}
                      </h3>
                      <button
                        onClick={() => handlePreferenceChange(category.key)}
                        disabled={category.required}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          preferences[category.key]
                            ? 'bg-teal-600'
                            : 'bg-gray-300'
                        } ${category.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                            preferences[category.key] ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong className="text-gray-700">Examples:</strong>
                        <ul className="text-gray-600 mt-1">
                          {category.examples.map((example, index) => (
                            <li key={index}>• {example}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <strong className="text-gray-700">Duration:</strong>
                        <p className="text-gray-600 mt-1">{category.duration}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-end pt-4">
                  <button
                    onClick={savePreferences}
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center"
                  >
                    <Check className="w-4 h-4 mr-2" />
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
          <div className="prose prose-lg prose-gray max-w-none">
            
            <h2>What Are Cookies?</h2>
            <p>
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              analyzing how you use our service.
            </p>

            <h2>How We Use Cookies</h2>
            <p>
              WaveOrder uses cookies and similar tracking technologies for the following purposes:
            </p>

            <h3>Essential Cookies (Always Active)</h3>
            <ul>
              <li><strong>Authentication:</strong> Keep you logged in to your account</li>
              <li><strong>Security:</strong> Protect against fraud and unauthorized access</li>
              <li><strong>Session Management:</strong> Maintain your session state across pages</li>
              <li><strong>Load Balancing:</strong> Distribute traffic efficiently across our servers</li>
            </ul>

            <h3>Analytics Cookies (Optional)</h3>
            <ul>
              <li><strong>Usage Analytics:</strong> Understand how visitors use our website</li>
              <li><strong>Performance Monitoring:</strong> Identify and fix technical issues</li>
              <li><strong>Feature Usage:</strong> See which features are most popular</li>
              <li><strong>Error Tracking:</strong> Monitor and resolve bugs</li>
            </ul>

            <h3>Functional Cookies (Optional)</h3>
            <ul>
              <li><strong>Preferences:</strong> Remember your language and display settings</li>
              <li><strong>Form Data:</strong> Save form inputs to improve user experience</li>
              <li><strong>UI State:</strong> Remember your dashboard layout preferences</li>
              <li><strong>Feature Toggles:</strong> Enable beta features you've opted into</li>
            </ul>

            <h3>Marketing Cookies (Optional)</h3>
            <ul>
              <li><strong>Conversion Tracking:</strong> Measure the effectiveness of our marketing</li>
              <li><strong>Retargeting:</strong> Show relevant ads on other websites</li>
              <li><strong>Social Media:</strong> Enable social sharing functionality</li>
              <li><strong>Campaign Attribution:</strong> Track which marketing efforts bring users</li>
            </ul>

            <h2>Third-Party Cookies</h2>
            <p>
              We work with trusted third-party service providers who may also set cookies on your device:
            </p>

            <h3>Analytics Services</h3>
            <ul>
              <li><strong>Google Analytics:</strong> Website traffic and user behavior analysis</li>
              <li><strong>Mixpanel:</strong> Product usage analytics and user journey tracking</li>
              <li><strong>Hotjar:</strong> User session recordings and heatmap analysis</li>
            </ul>

            <h3>Support and Communication</h3>
            <ul>
              <li><strong>Intercom:</strong> Customer support chat functionality</li>
              <li><strong>Zendesk:</strong> Help desk and ticket management</li>
            </ul>

            <h3>Payment Processing</h3>
            <ul>
              <li><strong>Stripe:</strong> Secure payment processing</li>
              <li><strong>PayPal:</strong> Alternative payment options</li>
            </ul>

            <h2>Cookie Duration and Storage</h2>
            <p>
              Cookies have different lifespans depending on their purpose:
            </p>
            <ul>
              <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Remain for a set period (up to 2 years)</li>
              <li><strong>First-Party Cookies:</strong> Set directly by WaveOrder</li>
              <li><strong>Third-Party Cookies:</strong> Set by our service providers</li>
            </ul>

            <h2>Managing Your Cookie Preferences</h2>
            <p>
              You have several options for controlling cookies:
            </p>

            <h3>Through Our Website</h3>
            <ul>
              <li>Use the cookie preference center above to enable/disable specific categories</li>
              <li>Your preferences are saved and applied across all your visits</li>
              <li>You can change your preferences at any time</li>
            </ul>

            <h3>Through Your Browser</h3>
            <ul>
              <li>Most browsers allow you to control cookies through settings</li>
              <li>You can block all cookies, allow only first-party cookies, or delete existing cookies</li>
              <li>Note that disabling cookies may affect website functionality</li>
            </ul>

            <h3>Browser-Specific Instructions</h3>
            <ul>
              <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
              <li><strong>Firefox:</strong> Preferences → Privacy & Security → Cookies</li>
              <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
              <li><strong>Edge:</strong> Settings → Cookies and Site Permissions</li>
            </ul>

            <h2>Do Not Track</h2>
            <p>
              Some browsers include a "Do Not Track" feature that signals websites not to track users. 
              Currently, there is no industry standard for how to respond to these signals. WaveOrder 
              respects your cookie preferences set through our preference center.
            </p>

            <h2>Mobile Apps and Device Information</h2>
            <p>
              Our mobile applications may collect device information such as:
            </p>
            <ul>
              <li>Device type and operating system</li>
              <li>App version and usage statistics</li>
              <li>Push notification tokens</li>
              <li>Crash reports and error logs</li>
            </ul>

            <h2>Changes to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy periodically to reflect changes in our practices or 
              legal requirements. We will notify you of material changes via:
            </p>
            <ul>
              <li>Email notification to account holders</li>
              <li>Prominent notice on our website</li>
              <li>Updated "Last Modified" date at the top of this policy</li>
            </ul>

            <h2>Contact Us About Cookies</h2>
            <p>
              If you have questions about our use of cookies or this Cookie Policy, please contact us:
            </p>
            <ul>
              <li>Email: privacy@waveorder.app</li>
              <li>Subject line: "Cookie Policy Question"</li>
              <li>Address: WaveOrder Inc., 123 Cookie Street, San Francisco, CA 94105</li>
            </ul>

          </div>

          {/* Contact CTA */}
          <div className="mt-16 bg-gray-50 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Questions About Cookies?
            </h3>
            <p className="text-gray-600 mb-6">
              Our privacy team is happy to explain our cookie practices and help you manage your preferences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                Contact Privacy Team
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center px-6 py-3 border-2 border-teal-600 text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-colors"
              >
                View Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}