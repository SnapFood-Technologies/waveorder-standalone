// src/components/site/Terms.tsx
'use client'

import Link from 'next/link'
import { FileText, Mail, AlertTriangle } from 'lucide-react'

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Terms of Service
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Legal agreement for using the WaveOrder platform
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
            
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing or using WaveOrder ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you disagree with any part of these terms, you may not access the Service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              WaveOrder is a WhatsApp ordering platform that enables businesses to create online catalogs and 
              receive orders directly through WhatsApp. Our Service includes:
            </p>
            <ul>
              <li>Online catalog creation and management tools</li>
              <li>WhatsApp integration for order processing</li>
              <li>Business dashboard and analytics</li>
              <li>Team collaboration features</li>
              <li>Customer relationship management tools</li>
              <li>Payment processing integration</li>
            </ul>

            <h2>3. User Accounts and Registration</h2>
            <h3>Account Creation</h3>
            <ul>
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account credentials</li>
              <li>You must be at least 18 years old or have legal capacity to enter into contracts</li>
              <li>One account per business entity is permitted</li>
            </ul>

            <h3>Account Responsibilities</h3>
            <ul>
              <li>You are responsible for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Keep your contact information current and accurate</li>
              <li>Comply with all applicable laws and regulations in your jurisdiction</li>
            </ul>

            <h2>4. Acceptable Use Policy</h2>
            <h3>Permitted Uses</h3>
            <ul>
              <li>Operating legitimate business activities through our platform</li>
              <li>Creating catalogs for legal products and services</li>
              <li>Processing customer orders in compliance with applicable laws</li>
              <li>Using analytics and reporting features for business purposes</li>
            </ul>

            <h3>Prohibited Uses</h3>
            <ul>
              <li>Selling illegal, harmful, or prohibited products or services</li>
              <li>Violating any local, state, national, or international laws</li>
              <li>Infringing on intellectual property rights of others</li>
              <li>Transmitting spam, malware, or malicious content</li>
              <li>Impersonating others or providing false information</li>
              <li>Interfering with or disrupting the Service</li>
              <li>Accessing other users' accounts or data without permission</li>
            </ul>

            <h2>5. Subscription and Payment Terms</h2>
            <h3>Billing</h3>
            <ul>
              <li>Subscription fees are billed in advance on a monthly or annual basis</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>You authorize automatic charging of your payment method</li>
              <li>Prices may change with 30 days notice to subscribers</li>
            </ul>

            <h3>Free Trial and Free Plan</h3>
            <ul>
              <li>Free trials are available for new customers only</li>
              <li>Free plan users have access to limited features</li>
              <li>We reserve the right to modify free plan limitations</li>
              <li>No payment information required for free plan usage</li>
            </ul>

            <h2>6. Intellectual Property Rights</h2>
            <h3>Our Rights</h3>
            <ul>
              <li>WaveOrder owns all rights to the Service, including software, design, and trademarks</li>
              <li>You receive a limited license to use the Service for business purposes</li>
              <li>You may not copy, modify, or redistribute our software or content</li>
            </ul>

            <h3>Your Content</h3>
            <ul>
              <li>You retain ownership of content you upload (products, images, descriptions)</li>
              <li>You grant us license to use your content to provide the Service</li>
              <li>You represent that you own or have rights to all content you upload</li>
              <li>You are responsible for ensuring your content doesn't infringe third-party rights</li>
            </ul>

            <h2>7. Privacy and Data Protection</h2>
            <p>
              Your privacy is important to us. Our collection and use of personal information is governed by our 
              <Link href="/privacy" className="text-teal-600 hover:text-teal-700">Privacy Policy</Link>, 
              which is incorporated into these Terms by reference.
            </p>

            <h2>8. Service Availability and Modifications</h2>
            <h3>Service Availability</h3>
            <ul>
              <li>We strive for 99.9% uptime but cannot guarantee uninterrupted service</li>
              <li>Scheduled maintenance will be announced in advance when possible</li>
              <li>We are not liable for service interruptions beyond our reasonable control</li>
            </ul>

            <h3>Service Modifications</h3>
            <ul>
              <li>We may modify, update, or discontinue features with reasonable notice</li>
              <li>Significant changes will be communicated to users in advance</li>
              <li>Continued use after modifications constitutes acceptance</li>
            </ul>

            <h2>9. Third-Party Integrations</h2>
            <ul>
              <li>The Service may integrate with third-party platforms (WhatsApp, payment processors)</li>
              <li>Third-party services are governed by their own terms and policies</li>
              <li>We are not responsible for third-party service availability or performance</li>
              <li>You are responsible for complying with third-party service terms</li>
            </ul>

            <h2>10. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WAVEORDER SHALL NOT BE LIABLE FOR:
            </p>
            <ul>
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Service interruptions or data loss</li>
              <li>Actions or omissions of third parties</li>
              <li>Your use or inability to use the Service</li>
            </ul>
            <p>
              Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.
            </p>

            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold WaveOrder harmless from any claims, damages, or expenses 
              arising from:
            </p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your content or business activities</li>
              <li>Your violation of any third-party rights</li>
            </ul>

            <h2>12. Termination</h2>
            <h3>Termination by You</h3>
            <ul>
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Cancellation takes effect at the end of your current billing period</li>
              <li>You remain responsible for all charges incurred before cancellation</li>
            </ul>

            <h3>Termination by Us</h3>
            <ul>
              <li>We may suspend or terminate accounts for violation of these Terms</li>
              <li>We may terminate the Service with 30 days notice</li>
              <li>Immediate termination may occur for serious violations</li>
            </ul>

            <h2>13. Dispute Resolution</h2>
            <h3>Governing Law</h3>
            <p>
              These Terms are governed by the laws of the State of California, United States, 
              without regard to conflict of law principles.
            </p>

            <h3>Dispute Process</h3>
            <ol>
              <li>Contact us first to try to resolve disputes informally</li>
              <li>If informal resolution fails, disputes will be resolved through binding arbitration</li>
              <li>Arbitration will be conducted under the rules of the American Arbitration Association</li>
              <li>Class action lawsuits are waived by both parties</li>
            </ol>

            <h2>14. General Provisions</h2>
            <h3>Entire Agreement</h3>
            <p>
              These Terms, along with our Privacy Policy, constitute the entire agreement between 
              you and WaveOrder regarding the Service.
            </p>

            <h3>Severability</h3>
            <p>
              If any provision of these Terms is found unenforceable, the remaining provisions 
              will remain in full force and effect.
            </p>

            <h3>Waiver</h3>
            <p>
              Failure to enforce any provision does not constitute a waiver of our rights under these Terms.
            </p>

            <h2>15. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. Material changes will be communicated via:
            </p>
            <ul>
              <li>Email notification to account holders</li>
              <li>Prominent notice on our website</li>
              <li>In-app notification upon login</li>
            </ul>
            <p>
              Continued use of the Service after changes constitutes acceptance of modified Terms.
            </p>

            <h2>16. Contact Information</h2>
            <p>
              For questions about these Terms, contact us:
            </p>
            <ul>
              <li>Email: legal@waveorder.app</li>
              <li>Address: WaveOrder Inc., 123 Legal Street, San Francisco, CA 94105</li>
              <li>Phone: +1 (555) 123-WAVE</li>
            </ul>

          </div>

          {/* Important Notice */}
          <div className="mt-16 bg-amber-50 border border-amber-200 rounded-2xl p-8">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-amber-600 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-amber-900 mb-2">
                  Important Legal Notice
                </h3>
                <p className="text-amber-800 leading-relaxed">
                  These Terms of Service constitute a legally binding agreement. Please read them carefully. 
                  By using WaveOrder, you acknowledge that you have read, understood, and agree to be bound by these terms.
                </p>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="mt-12 bg-gray-50 rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Questions About These Terms?
            </h3>
            <p className="text-gray-600 mb-6">
              Our legal team is available to clarify any aspect of our Terms of Service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Legal Team
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