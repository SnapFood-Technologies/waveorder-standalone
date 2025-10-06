'use client'

import { useState } from 'react'
import { Code, BookOpen, Lock, Download, ArrowRight, Check, Shield, Zap } from 'lucide-react'

export default function ProtectedApiDocsLanding() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const response = await fetch('/api/verify-docs-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })

    if (response.ok) {
      setAuthenticated(true)
      setError('')
    } else {
      setError('Invalid password')
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              WaveOrder API Hub
            </h1>
            <p className="text-lg text-gray-600">
              Complete developer resources and documentation
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Interactive Testing</h3>
              <p className="text-gray-600 mb-4">
                Test API endpoints live with Scalar's interactive interface
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-teal-600 mr-2" />
                  Real-time endpoint testing
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-teal-600 mr-2" />
                  Pre-filled code examples
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Reference</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive documentation with Redoc's clean layout
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2" />
                  Detailed schema docs
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-600 mr-2" />
                  Easy navigation
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">OmniStack Gateway</h3>
              <p className="text-gray-600 mb-4">
                Third-party integrations via secure API keys
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-teal-600 rounded-full mr-2"></span>
                  <span className="font-semibold text-gray-900">VenueBoost</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mr-2"></span>
                  <span className="font-semibold text-gray-900">SnapFood</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Access Required</h3>
              
              <form onSubmit={handleSubmit}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  autoFocus
                />
                {error && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 font-semibold transition-colors"
                >
                  Access Documentation
                </button>
              </form>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  Need credentials?{' '}
                  <a href="/contact" className="text-teal-600 hover:text-teal-700 font-medium">
                    Contact us
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              <strong className="text-gray-900">Authorized access only.</strong> All requests are logged for security.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <section className="pt-16 pb-12 bg-gradient-to-br from-teal-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              WaveOrder API Documentation
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Build powerful integrations with our RESTful API
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <a href="/api-reference" className="block">
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-teal-500">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mb-4">
                  <Code className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Interactive Reference
                </h2>
                <p className="text-gray-600 mb-4">
                  Test endpoints in your browser with Scalar
                </p>
                <div className="flex items-center text-teal-600 font-semibold">
                  Open Scalar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </a>

            <a href="/documentation" className="block">
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-emerald-500">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Read Documentation
                </h2>
                <p className="text-gray-600 mb-4">
                  Comprehensive API guide with Redoc
                </p>
                <div className="flex items-center text-emerald-600 font-semibold">
                  Open Redoc
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </a>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  OpenAPI Specification
                </h3>
                <p className="text-gray-600 text-sm">
                  Download the complete API spec
                </p>
              </div>
              <a
                href="/api/openapi"
                target="_blank"
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold inline-flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download JSON
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Quick Start
          </h2>
          
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Get API Key</h3>
                  <p className="text-gray-600 text-sm">Contact support for credentials</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">Make First Request</h3>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-xs">
{`curl -H "X-API-Key: your-key" \\
  https://yourdomain.com/api/admin/stores/ID/products`}
                  </pre>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Explore</h3>
                  <p className="text-gray-600 text-sm">Use interactive docs to test endpoints</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}