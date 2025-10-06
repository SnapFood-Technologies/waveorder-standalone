import Link from 'next/link'
import { ArrowRight, Code, BookOpen, Download } from 'lucide-react'

export default function ApiDocsLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-teal-50 via-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              WaveOrder API
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete API documentation for developers building integrations with WaveOrder Platform
            </p>
          </div>
        </div>
      </section>

      {/* Documentation Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Scalar Card */}
            <Link href="/api/reference">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-teal-500">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mb-6">
                  <Code className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Interactive API Reference
                </h2>
                <p className="text-gray-600 mb-6">
                  Test API endpoints directly in your browser with our interactive documentation powered by Scalar
                </p>
                <div className="flex items-center text-teal-600 font-semibold">
                  Open Interactive Docs
                  <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              </div>
            </Link>

            {/* Redoc Card */}
            <Link href="/docs">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-emerald-500">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-6">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  API Documentation
                </h2>
                <p className="text-gray-600 mb-6">
                  Comprehensive read-only documentation with detailed endpoint descriptions and examples
                </p>
                <div className="flex items-center text-emerald-600 font-semibold">
                  View Documentation
                  <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              </div>
            </Link>
          </div>

          {/* OpenAPI Spec */}
          <div className="mt-12 bg-gray-50 rounded-xl p-8 border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">OpenAPI Specification</h3>
                <p className="text-gray-600 mb-4">
                  Download the OpenAPI 3.1 specification for use with your development tools
                </p>
              </div>
              <a
                href="/api/openapi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Download JSON
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Integrate?
          </h2>
          <p className="text-xl text-teal-100 mb-8">
            Contact us to get your API credentials and start building
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-4 bg-white text-teal-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Contact Support
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  )
}