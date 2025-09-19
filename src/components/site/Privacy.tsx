// src/components/site/Privacy.tsx
'use client'

import Link from 'next/link'
import { Shield, Mail, Eye, Lock, Users, FileText, Globe, Heart } from 'lucide-react'

export default function Privacy() {
  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: FileText
    },
    {
      id: 'information-we-collect',
      title: 'Information We Collect',
      icon: Eye
    },
    {
      id: 'how-we-use',
      title: 'How We Use Your Information',
      icon: Users
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing',
      icon: Globe
    },
    {
      id: 'data-security',
      title: 'Data Security',
      icon: Lock
    },
    {
      id: 'your-rights',
      title: 'Your Privacy Rights',
      icon: Heart
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Shield className="w-10 h-10" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto leading-relaxed">
              Your privacy matters to us. Learn how WaveOrder collects, uses, and protects your data 
              while helping you build amazing WhatsApp ordering experiences.
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
                  className="flex items-center p-4 bg-white rounded-lg hover:bg-teal-50 hover:border-teal-200 border-2 border-gray-100 transition-all group"
                >
                  <div className="w-10 h-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-teal-200">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900 group-hover:text-teal-700">{section.title}</span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Introduction */}
          <div id="introduction" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mr-4">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Introduction</h2>
            </div>
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-100">
              <p className="text-lg text-gray-700 leading-relaxed">
              Electral Shpk. ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our WhatsApp ordering platform service. We believe transparency builds trust, and we want you to understand exactly how we handle your data.
              </p>
            </div>
          </div>

          {/* Information We Collect */}
          <div id="information-we-collect" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mr-4">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Information We Collect</h2>
            </div>
            
            <div className="space-y-8">
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-blue-200 transition-colors">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="w-6 h-6 bg-blue-500 rounded-full mr-3"></div>
                  Information You Provide
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Account Information</h4>
                        <p className="text-gray-600 text-sm">Name, email address, business name, phone number, and WhatsApp number</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Business Information</h4>
                        <p className="text-gray-600 text-sm">Business type, address, logo, branding preferences, and catalog content</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Product Information</h4>
                        <p className="text-gray-600 text-sm">Menu items, prices, descriptions, and images you upload</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Payment Information</h4>
                        <p className="text-gray-600 text-sm">Billing details and subscription information (securely processed through third-party providers)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-purple-200 transition-colors">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <div className="w-6 h-6 bg-purple-500 rounded-full mr-3"></div>
                  Information Automatically Collected
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Usage Data</h4>
                        <p className="text-gray-600 text-sm">How you use our platform, features accessed, and time spent</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Device Information</h4>
                        <p className="text-gray-600 text-sm">IP address, browser type, operating system, and device identifiers</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Analytics Data</h4>
                        <p className="text-gray-600 text-sm">Order patterns, catalog performance, and business metrics</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Log Data</h4>
                        <p className="text-gray-600 text-sm">Server logs, error reports, and system activity</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How We Use Information */}
          <div id="how-we-use" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mr-4">
                <Users className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">How We Use Your Information</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Primary Uses</h3>
                <div className="space-y-4">
                  {[
                    'Provide and maintain our WhatsApp ordering platform service',
                    'Process orders and facilitate communication between you and your customers',
                    'Generate analytics and insights for your business',
                    'Provide customer support and technical assistance',
                    'Process payments and manage subscriptions'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Secondary Uses</h3>
                <div className="space-y-4">
                  {[
                    'Improve our platform and develop new features',
                    'Send important service updates and notifications',
                    'Detect and prevent fraud or security issues',
                    'Comply with legal obligations and enforce our terms',
                    'Send marketing communications (with your consent)'
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-700 text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Information Sharing */}
          <div id="information-sharing" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mr-4">
                <Globe className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Information Sharing and Disclosure</h2>
            </div>
            
            <div className="space-y-8">
              <div className="bg-orange-50 rounded-2xl p-8 border border-orange-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">We Share Information With:</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      title: 'Service Providers',
                      desc: 'Third-party companies that help us operate our platform (hosting, payment processing, analytics)'
                    },
                    {
                      title: 'Business Partners',
                      desc: 'Integration partners when you choose to connect third-party services'
                    },
                    {
                      title: 'Legal Requirements',
                      desc: 'When required by law, court order, or to protect our rights'
                    },
                    {
                      title: 'Business Transfers',
                      desc: 'In connection with mergers, acquisitions, or sale of assets'
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.title}</h4>
                        <p className="text-gray-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 rounded-2xl p-8 border border-red-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-red-600" />
                  We Do NOT:
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    'Sell your personal information to third parties',
                    'Share customer order data with other businesses',
                    'Use your data for advertising to your customers',
                    'Access your WhatsApp messages or conversations'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center bg-white rounded-lg p-4">
                      <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-xs font-bold">✗</span>
                      </div>
                      <p className="text-gray-700 text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Data Security */}
          <div id="data-security" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mr-4">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Data Security</h2>
            </div>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100">
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                We implement industry-standard security measures to protect your information:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  {
                    icon: '🔐',
                    title: 'Encryption',
                    desc: 'Data encrypted in transit and at rest'
                  },
                  {
                    icon: '🛡️',
                    title: 'Security Audits',
                    desc: 'Regular audits and penetration testing'
                  },
                  {
                    icon: '👥',
                    title: 'Access Controls',
                    desc: 'Strict access controls and employee training'
                  },
                  {
                    icon: '🏢',
                    title: 'Secure Infrastructure',
                    desc: 'Secure data centers with 99.9% uptime'
                  },
                  {
                    icon: '💾',
                    title: 'Backups',
                    desc: 'Regular backups and disaster recovery'
                  },
                  {
                    icon: '🔍',
                    title: 'Monitoring',
                    desc: '24/7 security monitoring and alerts'
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
          </div>

          {/* Your Rights */}
          <div id="your-rights" className="mb-20">
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center mr-4">
                <Heart className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Your Privacy Rights</h2>
            </div>
            
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-8 border border-pink-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-8">You Have the Right To:</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Access', desc: 'Request a copy of your personal information' },
                  { title: 'Correct', desc: 'Update or correct inaccurate information' },
                  { title: 'Delete', desc: 'Request deletion of your personal information' },
                  { title: 'Export', desc: 'Download your data in a portable format' },
                  { title: 'Restrict', desc: 'Limit how we process your information' },
                  { title: 'Object', desc: 'Opt out of certain types of processing' }
                ].map((right, index) => (
                  <div key={index} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-pink-200 transition-colors">
                    <h4 className="font-semibold text-gray-900 mb-2">{right.title}</h4>
                    <p className="text-gray-600 text-sm">{right.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Exercising Your Rights</h4>
                <p className="text-gray-700 leading-relaxed">
                  To exercise these rights, contact us at{' '}
                  <a href="mailto:privacy@waveorder.app" className="text-pink-600 hover:text-pink-700 font-medium">
                    privacy@waveorder.app
                  </a>{' '}
                  or through your account settings. We will respond to requests within 30 days.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Sections */}
          <div className="space-y-16">
            {/* Data Retention */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Retention</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { title: 'Active Accounts', desc: 'We retain your data while your account is active' },
                  { title: 'Closed Accounts', desc: 'Data is deleted within 90 days of account closure' },
                  { title: 'Legal Requirements', desc: 'Some data may be retained longer if required by law' },
                  { title: 'Analytics Data', desc: 'Aggregated, anonymized data may be retained for business insights' }
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-gray-500 rounded-full mt-2.5 mr-3 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* International Transfers */}
            <div className="border-l-4 border-teal-500 pl-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place and comply with applicable data protection laws.
              </p>
            </div>

            {/* Children's Privacy */}
            <div className="border-l-4 border-orange-500 pl-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our service is not intended for children under 13. We do not knowingly collect personal 
                information from children under 13. If you become aware that a child has provided us with 
                personal information, please contact us immediately.
              </p>
            </div>

            {/* Changes */}
            <div className="border-l-4 border-blue-500 pl-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of material changes via 
                email or platform notification. Your continued use of the service after changes indicates 
                acceptance of the updated policy.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-20 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <p className="text-gray-700 mb-6">
              For privacy-related questions or concerns, contact us:
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-teal-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Email</div>
                  <a href="mailto:privacy@waveorder.app" className="text-teal-600 hover:text-teal-700">
                    privacy@waveorder.app
                  </a>
                </div>
              </div>
              <div className="flex items-center">
                <Globe className="w-5 h-5 text-teal-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Address</div>
                  <div className="text-gray-600 text-sm">Sami Frashëri Sreet, Tiranë, Albania</div>
                </div>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-teal-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Company</div>
                  <div className="text-gray-600">Electral Shpk.</div>
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
              Questions About Our Privacy Practices?
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Our privacy team is here to help you understand how we protect your data and respect your privacy rights. 
              We're committed to transparency and building trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Mail className="w-5 h-5 mr-2" />
                Contact Privacy Team
              </Link>
              <Link
                href="/resources"
                className="inline-flex items-center px-8 py-4 border-2 border-teal-500 text-teal-600 font-semibold rounded-xl hover:bg-teal-50 transition-colors"
              >
                <FileText className="w-5 h-5 mr-2" />
                View More Resources
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}