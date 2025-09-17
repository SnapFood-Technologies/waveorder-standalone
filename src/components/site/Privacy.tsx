// src/components/site/Privacy.tsx
'use client'

import Link from 'next/link'
import { Shield, Mail, Calendar } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Privacy Policy
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              How WaveOrder collects, uses, and protects your data
            </p>
            <p className="text-gray-500">
              Last updated: January 15, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg prose-gray max-w-none">
            
            <h2>Introduction</h2>
            <p>
              WaveOrder Inc. ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our WhatsApp ordering platform service.
            </p>

            <h2>Information We Collect</h2>
            
            <h3>Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, business name, phone number, and WhatsApp number</li>
              <li><strong>Business Information:</strong> Business type, address, logo, branding preferences, and catalog content</li>
              <li><strong>Product Information:</strong> Menu items, prices, descriptions, and images you upload</li>
              <li><strong>Customer Data:</strong> Order information and customer contact details processed through your catalogs</li>
              <li><strong>Payment Information:</strong> Billing details and subscription information (processed securely through third-party payment providers)</li>
            </ul>

            <h3>Information Automatically Collected</h3>
            <ul>
              <li><strong>Usage Data:</strong> How you use our platform, features accessed, and time spent</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
              <li><strong>Analytics Data:</strong> Order patterns, catalog performance, and business metrics</li>
              <li><strong>Log Data:</strong> Server logs, error reports, and system activity</li>
            </ul>

            <h2>How We Use Your Information</h2>
            
            <h3>Primary Uses</h3>
            <ul>
              <li>Provide and maintain our WhatsApp ordering platform service</li>
              <li>Process orders and facilitate communication between you and your customers</li>
              <li>Generate analytics and insights for your business</li>
              <li>Provide customer support and technical assistance</li>
              <li>Process payments and manage subscriptions</li>
            </ul>

            <h3>Secondary Uses</h3>
            <ul>
              <li>Improve our platform and develop new features</li>
              <li>Send important service updates and notifications</li>
              <li>Detect and prevent fraud or security issues</li>
              <li>Comply with legal obligations and enforce our terms</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>

            <h2>Information Sharing and Disclosure</h2>
            
            <h3>We Share Information With:</h3>
            <ul>
              <li><strong>Service Providers:</strong> Third-party companies that help us operate our platform (hosting, payment processing, analytics)</li>
              <li><strong>Business Partners:</strong> Integration partners when you choose to connect third-party services</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or sale of assets</li>
            </ul>

            <h3>We Do NOT:</h3>
            <ul>
              <li>Sell your personal information to third parties</li>
              <li>Share customer order data with other businesses</li>
              <li>Use your data for advertising to your customers</li>
              <li>Access your WhatsApp messages or conversations</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul>
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and employee training</li>
              <li>Secure data centers with 99.9% uptime</li>
              <li>Regular backups and disaster recovery plans</li>
            </ul>

            <h2>Your Privacy Rights</h2>
            
            <h3>You Have the Right To:</h3>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correct:</strong> Update or correct inaccurate information</li>
              <li><strong>Delete:</strong> Request deletion of your personal information</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
              <li><strong>Restrict:</strong> Limit how we process your information</li>
              <li><strong>Object:</strong> Opt out of certain types of processing</li>
            </ul>

            <h3>Exercising Your Rights</h3>
            <p>
              To exercise these rights, contact us at privacy@waveorder.app or through your account settings. 
              We will respond to requests within 30 days.
            </p>

            <h2>Data Retention</h2>
            <ul>
              <li><strong>Active Accounts:</strong> We retain your data while your account is active</li>
              <li><strong>Closed Accounts:</strong> Data is deleted within 90 days of account closure</li>
              <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law</li>
              <li><strong>Analytics Data:</strong> Aggregated, anonymized data may be retained for business insights</li>
            </ul>

            <h2>International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place and comply with applicable data protection laws.
            </p>

            <h2>Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13. We do not knowingly collect personal 
              information from children under 13. If you become aware that a child has provided us with 
              personal information, please contact us immediately.
            </p>

            <h2>Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience. See our 
              <Link href="/cookies" className="text-teal-600 hover:text-teal-700">Cookie Policy</Link> for detailed information.
            </p>

            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of material changes via 
              email or platform notification. Your continued use of the service after changes indicates 
              acceptance of the updated policy.
            </p>

            <h2>Contact Information</h2>
            <p>
              For privacy-related questions or concerns, contact us:
            </p>
            <ul>
              <li>Email: privacy@waveorder.app</li>
              <li>Address: WaveOrder Inc., 123 Privacy Street, San Francisco, CA 94105</li>
              <li>Phone: +1 (555) 123-WAVE</li>
            </ul>

          </div>

          {/* Contact CTA */}
          <div className="mt-16 bg-gray-50 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Questions About Our Privacy Practices?
            </h3>
            <p className="text-gray-600 mb-6">
              Our team is happy to explain how we protect your data and respect your privacy rights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Privacy Team
              </Link>
              <Link
                href="/resources"
                className="inline-flex items-center px-6 py-3 border-2 border-teal-600 text-teal-600 font-semibold rounded-lg hover:bg-teal-50 transition-colors"
              >
                View More Resources
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}