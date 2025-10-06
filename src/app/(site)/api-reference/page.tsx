'use client'

import { useState } from 'react'
import { Code, Lock, Shield, Zap, CheckCircle } from 'lucide-react'

export default function ProtectedScalarPage() {
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
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-teal-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Interactive API Reference
            </h1>
            <p className="text-lg text-gray-600">
              Test WaveOrder API endpoints in real-time with Scalar
            </p>
          </div>

          {/* 4-Block Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Block 1: Interactive Testing */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Code className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Interactive Testing</h3>
              <p className="text-gray-600 mb-4">
                Make actual API calls directly from your browser with instant responses. Test authentication, parameters, and see live results.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-teal-600 mr-2 flex-shrink-0" />
                  Live endpoint testing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-teal-600 mr-2 flex-shrink-0" />
                  Pre-filled examples
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-teal-600 mr-2 flex-shrink-0" />
                  Request/response inspection
                </li>
              </ul>
            </div>

            {/* Block 2: Full API Coverage */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Full API Coverage</h3>
              <p className="text-gray-600 mb-4">
                Access comprehensive documentation for all WaveOrder endpoints including authentication and error handling.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                  Products & Categories
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                  Orders & Customers
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                  Inventory Management
                </li>
              </ul>
            </div>

            {/* Block 3: OmniStack Gateway */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-lg border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">OmniStack Gateway</h3>
              <p className="text-gray-600 mb-4">
                All WaveOrder APIs available as third-party integrations through OmniStack Gateway with secure API key authentication.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-teal-600 rounded-full mr-2"></span>
                  <span className="font-semibold text-gray-900">VenueBoost</span>
                  <span className="text-gray-600 ml-1">integration</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-2 h-2 bg-orange-600 rounded-full mr-2"></span>
                  <span className="font-semibold text-gray-900">SnapFood</span>
                  <span className="text-gray-600 ml-1">integration</span>
                </div>
              </div>
            </div>

            {/* Block 4: Login Form */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Access Required</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    autoFocus
                  />
                </div>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 font-semibold transition-colors"
                >
                  Access Documentation
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  Need access?{' '}
                  <a href="/contact" className="text-teal-600 hover:text-teal-700 font-medium">
                    Request credentials
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              <strong className="text-gray-900">Note:</strong> This documentation is for authorized developers only. 
              All API requests are logged and monitored for security purposes.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <iframe
      src="/api/reference-view"
      className="w-full h-screen border-0"
    />
  )
}