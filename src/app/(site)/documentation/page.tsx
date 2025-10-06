'use client'

import { useState } from 'react'
import { BookOpen, Lock, Shield, CheckCircle } from 'lucide-react'

export default function ProtectedRedocPage() {
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              API Documentation
            </h1>
            <p className="text-lg text-gray-600">
              Complete Wave Order API reference with Redoc
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Complete Reference</h3>
              <p className="text-gray-600 mb-4">
                Comprehensive documentation with detailed descriptions, request/response examples, and data models.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                  Three-panel layout
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                  Schema documentation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                  Easy navigation
                </li>
              </ul>
            </div>

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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-semibold transition-colors"
                >
                  Access Documentation
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                  Need access?{' '}
                  <a href="/contact" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Request credentials
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              <strong className="text-gray-900">Note:</strong> Read-only documentation for authorized developers.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <iframe
      src="/docs-view"
      className="w-full h-screen border-0"
    />
  )
}