import Link from 'next/link'
import { ArrowRight, Code, BookOpen, Download, Check } from 'lucide-react'

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation - WaveOrder (Internal)',
  robots: {
    index: false,
    follow: false,
  }
}

export default function ApiDocsLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-16 pb-12 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Wave Order API Documentation
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Build powerful integrations with our RESTful API
            </p>
          </div>
        </div>
      </section>

      {/* Documentation Options */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Scalar */}
            <Link href="/api/reference">
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-teal-500 cursor-pointer">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mb-4">
                  <Code className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Interactive Reference
                </h2>
                <p className="text-gray-600 mb-4">
                  Test endpoints in your browser
                </p>
                <div className="flex items-center text-teal-600 font-semibold">
                  Open Scalar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>

            {/* Redoc */}
            <Link href="/docs">
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-emerald-500 cursor-pointer">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Read Documentation
                </h2>
                <p className="text-gray-600 mb-4">
                  Comprehensive API guide
                </p>
                <div className="flex items-center text-emerald-600 font-semibold">
                  Open Redoc
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
          </div>

          {/* OpenAPI Download */}
          <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  OpenAPI Specification
                </h3>
                <p className="text-gray-600 text-sm">
                  Download the complete API spec in JSON format
                </p>
              </div>
              <a
                href="/api/openapi"
                target="_blank"
                className="flex-shrink-0 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold inline-flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Getting Started
          </h2>
          
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200">
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold mr-4">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Get API Key</h3>
                  <p className="text-gray-600 text-sm">Contact support to request API access credentials</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold mr-4">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Make Your First Request</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
{`curl -H "X-API-Key: your-api-key" \\
  https://yourdomain.com/api/admin/stores/BUSINESS_ID/products`}
                  </pre>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold mr-4">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Explore Endpoints</h3>
                  <p className="text-gray-600 text-sm">Use the interactive docs to test all available endpoints</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            API Features
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <Check className="w-5 h-5 text-teal-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">RESTful Design</h3>
                <p className="text-gray-600 text-sm">Standard HTTP methods and status codes</p>
              </div>
            </div>

            <div className="flex items-start">
              <Check className="w-5 h-5 text-teal-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">JSON Responses</h3>
                <p className="text-gray-600 text-sm">All responses in JSON format</p>
              </div>
            </div>

            <div className="flex items-start">
              <Check className="w-5 h-5 text-teal-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Authentication</h3>
                <p className="text-gray-600 text-sm">Secure API key authentication</p>
              </div>
            </div>

            <div className="flex items-start">
              <Check className="w-5 h-5 text-teal-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">CORS Enabled</h3>
                <p className="text-gray-600 text-sm">Call from any domain</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-teal-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Need Help Getting Started?
          </h2>
          <p className="text-lg text-teal-100 mb-6">
            Our team is here to help you integrate successfully
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Contact Support
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  )
}