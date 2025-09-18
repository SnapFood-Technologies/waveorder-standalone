// src/components/site/Terms.tsx
'use client'

import Link from 'next/link'
import { FileText, Mail, AlertTriangle, Shield, Users, CreditCard, Globe, Scale, Gavel } from 'lucide-react'

export default function Terms() {
  const sections = [
    {
      id: 'agreement',
      title: 'Agreement to Terms',
      icon: FileText
    },
    {
      id: 'service-description',
      title: 'Service Description',
      icon: Globe
    },
    {
      id: 'user-accounts',
      title: 'User Accounts',
      icon: Users
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable Use',
      icon: Shield
    },
    {
      id: 'payment-terms',
      title: 'Payment Terms',
      icon: CreditCard
    },
    {
      id: 'dispute-resolution',
      title: 'Dispute Resolution',
      icon: Scale
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <FileText className="w-10 h-10" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
              Legal agreement governing your use of WaveOrder's WhatsApp ordering platform. 
              Please read these terms carefully before using our service.
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
                  className="flex items-center p-4 bg-white rounded-lg hover:bg-blue-50 hover:border-blue-200 border-2 border-gray-100 transition-all group"
                >
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900 group-hover:text-blue-700">{section.title}</span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Agreement to Terms */}
          <div id="agreement" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mr-4">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Agreement to Terms</h2>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
              <p className="text-lg text-gray-700 leading-relaxed">
                By accessing or using WaveOrder ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
                If you disagree with any part of these terms, you may not access the Service. These terms create a 
                legally binding agreement between you and WaveOrder Inc.
              </p>
            </div>
          </div>

          {/* Service Description */}
          <div id="service-description" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mr-4">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Description of Service</h2>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100 mb-8">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                WaveOrder is a WhatsApp ordering platform that enables businesses to create online catalogs and 
                receive orders directly through WhatsApp. Our Service includes:
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: '📱',
                  title: 'Online Catalog Creation',
                  desc: 'Easy-to-use tools for building and managing your product catalogs'
                },
                {
                  icon: '💬',
                  title: 'WhatsApp Integration',
                  desc: 'Seamless integration for receiving orders through WhatsApp'
                },
                {
                  icon: '📊',
                  title: 'Business Dashboard',
                  desc: 'Comprehensive analytics and business performance insights'
                },
                {
                  icon: '👥',
                  title: 'Team Collaboration',
                  desc: 'Multi-user support and team management features'
                },
                {
                  icon: '🤝',
                  title: 'Customer Management',
                  desc: 'CRM tools for building customer relationships'
                },
                {
                  icon: '💳',
                  title: 'Payment Processing',
                  desc: 'Integration with popular payment gateways and methods'
                }
              ].map((feature, index) => (
                <div key={index} className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-green-200 transition-colors">
                  <div className="text-2xl mb-3">{feature.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* User Accounts */}
          <div id="user-accounts" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mr-4">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">User Accounts and Registration</h2>
            </div>
            
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="w-6 h-6 bg-purple-500 rounded-full mr-3"></div>
                  Account Creation Requirements
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    'Provide accurate and complete information during registration',
                    'Maintain security of your account credentials and passwords',
                    'Be at least 18 years old or have legal capacity to enter contracts',
                    'Limit one account per business entity unless approved otherwise'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border-2 border-gray-100 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-orange-600" />
                  Account Responsibilities
                </h3>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Account Security',
                      desc: 'You are responsible for all activities under your account and must protect your login credentials'
                    },
                    {
                      title: 'Unauthorized Access',
                      desc: 'Notify us immediately if you suspect unauthorized use of your account'
                    },
                    {
                      title: 'Contact Information',
                      desc: 'Keep your contact information current and accurate for important communications'
                    },
                    {
                      title: 'Legal Compliance',
                      desc: 'Comply with all applicable laws and regulations in your jurisdiction'
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start bg-gray-50 rounded-lg p-4">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Acceptable Use */}
          <div id="acceptable-use" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mr-4">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Acceptable Use Policy</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border border-emerald-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold">✓</span>
                  </div>
                  Permitted Uses
                </h3>
                <div className="space-y-4">
                  {[
                    'Operating legitimate business activities through our platform',
                    'Creating catalogs for legal products and services',
                    'Processing customer orders in compliance with applicable laws',
                    'Using analytics and reporting features for business purposes'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start bg-white rounded-lg p-4">
                      <div className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-xs font-bold">✓</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-8 border border-red-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center mr-3">
                    <span className="text-xs font-bold">✗</span>
                  </div>
                  Prohibited Uses
                </h3>
                <div className="space-y-4">
                  {[
                    'Selling illegal, harmful, or prohibited products or services',
                    'Violating any local, state, national, or international laws',
                    'Infringing on intellectual property rights of others',
                    'Transmitting spam, malware, or malicious content',
                    'Impersonating others or providing false information',
                    'Interfering with or disrupting the Service',
                    'Accessing other users\' accounts or data without permission'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start bg-white rounded-lg p-3">
                      <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-xs font-bold">✗</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div id="payment-terms" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center mr-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Subscription and Payment Terms</h2>
            </div>
            
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border border-yellow-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Billing Terms</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      icon: '📅',
                      title: 'Billing Cycle',
                      desc: 'Subscription fees are billed in advance on monthly or annual basis'
                    },
                    {
                      icon: '💳',
                      title: 'Payment Method',
                      desc: 'You authorize automatic charging of your selected payment method'
                    },
                    {
                      icon: '🚫',
                      title: 'Refund Policy',
                      desc: 'All fees are non-refundable except as required by applicable law'
                    },
                    {
                      icon: '📈',
                      title: 'Price Changes',
                      desc: 'Prices may change with 30 days advance notice to subscribers'
                    }
                  ].map((item, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 border border-gray-200">
                      <div className="text-2xl mb-3">{item.icon}</div>
                      <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Free Trial and Free Plan</h3>
                <div className="space-y-4">
                  {[
                    'Free trials are available for new customers only, one per business',
                    'Free plan users have access to limited features and usage quotas',
                    'We reserve the right to modify free plan limitations with notice',
                    'No payment information required for free plan usage and evaluation'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Intellectual Property */}
          <div className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mr-4">
                <Gavel className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Intellectual Property Rights</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Our Rights</h3>
                <div className="space-y-4">
                  {[
                    'WaveOrder owns all rights to the Service, including software, design, and trademarks',
                    'You receive a limited license to use the Service for business purposes only',
                    'You may not copy, modify, or redistribute our software or proprietary content'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Content</h3>
                <div className="space-y-4">
                  {[
                    'You retain ownership of content you upload (products, images, descriptions)',
                    'You grant us license to use your content to provide the Service',
                    'You represent that you own or have rights to all content you upload',
                    'You are responsible for ensuring content doesn\'t infringe third-party rights'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Reference */}
          <div className="mb-20">
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-3 text-teal-600" />
                Privacy and Data Protection
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Our collection and use of personal information is governed by our{' '}
                <Link href="/privacy" className="text-teal-600 hover:text-teal-700 font-semibold underline">
                  Privacy Policy
                </Link>, which is incorporated into these Terms by reference and forms part of this agreement.
              </p>
            </div>
          </div>

          {/* Service Availability */}
          <div className="mb-20">
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Availability and Modifications</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Availability</h3>
                  <div className="space-y-3">
                    {[
                      'We strive for 99.9% uptime but cannot guarantee uninterrupted service',
                      'Scheduled maintenance will be announced in advance when possible',
                      'We are not liable for service interruptions beyond our reasonable control'
                    ].map((item, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-gray-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                        <p className="text-gray-700 text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Modifications</h3>
                  <div className="space-y-3">
                    {[
                      'We may modify, update, or discontinue features with reasonable notice',
                      'Significant changes will be communicated to users in advance',
                      'Continued use after modifications constitutes acceptance'
                    ].map((item, index) => (
                      <div key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-gray-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                        <p className="text-gray-700 text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div className="mb-20">
            <div className="bg-red-50 rounded-2xl p-8 border border-red-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <AlertTriangle className="w-6 h-6 mr-3 text-red-600" />
                Limitation of Liability
              </h2>
              <div className="bg-white rounded-xl p-6 border border-red-100 mb-6">
                <p className="text-gray-700 font-medium mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WAVEORDER SHALL NOT BE LIABLE FOR:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    'Indirect, incidental, special, consequential, or punitive damages',
                    'Loss of profits, revenue, data, or business opportunities',
                    'Service interruptions or data loss beyond our control',
                    'Actions or omissions of third parties or integrations',
                    'Your use or inability to use the Service as intended'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-gray-700 font-medium">
                Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.
              </p>
            </div>
          </div>

          {/* Dispute Resolution */}
          <div id="dispute-resolution" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mr-4">
                <Scale className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Dispute Resolution</h2>
            </div>
            
            <div className="space-y-8">
              <div className="bg-orange-50 rounded-2xl p-8 border border-orange-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Governing Law</h3>
                <p className="text-gray-700 leading-relaxed">
                  These Terms are governed by the laws of the State of California, United States, 
                  without regard to conflict of law principles.
                </p>
              </div>

              <div className="bg-white border-2 border-gray-100 rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Dispute Resolution Process</h3>
                <div className="space-y-4">
                  {[
                    {
                      step: '1',
                      title: 'Informal Resolution',
                      desc: 'Contact us first to try to resolve disputes informally through discussion'
                    },
                    {
                      step: '2',
                      title: 'Formal Arbitration',
                      desc: 'If informal resolution fails, disputes will be resolved through binding arbitration'
                    },
                    {
                      step: '3',
                      title: 'Arbitration Rules',
                      desc: 'Arbitration conducted under rules of the American Arbitration Association'
                    },
                    {
                      step: '4',
                      title: 'Class Action Waiver',
                      desc: 'Class action lawsuits are waived by both parties in favor of individual arbitration'
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start bg-gray-50 rounded-lg p-4">
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold text-sm">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-20 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <p className="text-gray-700 mb-6">
              For questions about these Terms, contact our legal team:
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Email</div>
                  <a href="mailto:legal@waveorder.app" className="text-blue-600 hover:text-blue-700">
                    legal@waveorder.app
                  </a>
                </div>
              </div>
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Address</div>
                  <div className="text-gray-600 text-sm">123 Legal Street, San Francisco, CA 94105</div>
                </div>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Phone</div>
                  <div className="text-gray-600">+1 (555) 123-WAVE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-12 bg-amber-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 border border-amber-200 shadow-sm">
            <div className="flex items-start">
              <AlertTriangle className="w-8 h-8 text-amber-600 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-semibold text-amber-900 mb-3">
                  Important Legal Notice
                </h3>
                <p className="text-amber-800 leading-relaxed mb-4">
                  These Terms of Service constitute a legally binding agreement between you and WaveOrder Inc. 
                  Please read them carefully and ensure you understand all provisions before using our service.
                </p>
                <p className="text-amber-700 text-sm">
                  By creating an account or using WaveOrder, you acknowledge that you have read, understood, 
                  and agree to be bound by these terms and all applicable laws and regulations.
                </p>
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
              Questions About These Terms?
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Our legal team is available to clarify any aspect of our Terms of Service and help you 
              understand your rights and obligations when using WaveOrder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Mail className="w-5 h-5 mr-2" />
                Contact Legal Team
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center px-8 py-4 border-2 border-blue-500 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                View Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}