// components/superadmin/SuperAdminSettings.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  Settings,
  Shield,
  Crown,
  Check,
  AlertTriangle,
  Calendar,
  Mail,
  Trash2,
  UserPlus,
  Info,
  UserCheck,
  ShoppingCart,
  Package,
  TrendingUp,
  BarChart3,
  Sparkles
} from 'lucide-react'
import { AuthMethodIcon } from './AuthMethodIcon'

interface SuperAdmin {
  id: string
  name: string
  email: string
  authMethod: 'google' | 'email' | 'magic-link' | 'oauth'
  createdAt: string
  businessCount: number
}

export function SuperAdminSettings() {
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSuperAdmins()
  }, [])

  const fetchSuperAdmins = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/superadmin/settings/admins')
      
      if (!response.ok) {
        throw new Error('Failed to fetch super admins')
      }

      const data = await response.json()
      setSuperAdmins(data.admins)
    } catch (error) {
      console.error('Error fetching super admins:', error)
      setError(error instanceof Error ? error.message : 'Failed to load super admins')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-600 mt-1">Manage subscription plans and platform administrators</p>
      </div>

      {/* Subscription Plans Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
            <Crown className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Subscription Plans</h2>
            <p className="text-sm text-gray-600">Current available plans on the platform</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Starter Plan */}
          <div className="border-2 border-teal-500 rounded-lg p-6 relative bg-gradient-to-br from-teal-50 to-white">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="px-3 py-1 bg-teal-500 text-white text-xs font-bold rounded-full">
                MOST POPULAR
              </span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Free</h3>
              </div>
              <span className="px-3 py-1 bg-teal-100 text-teal-700 text-sm font-semibold rounded-full">
                Default
              </span>
            </div>

            <div className="mb-6">
              <p className="text-3xl font-bold text-gray-900">$6</p>
              <p className="text-sm text-gray-600">per month</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Up to 30 products</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">10 categories</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Basic WhatsApp orders</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Mobile catalog</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Basic branding</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">CSV import</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Basic order analytics</span>
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-purple-200 rounded-lg p-6 hover:border-purple-300 transition-colors bg-gradient-to-br from-purple-50 to-white relative">
            <div className="absolute -top-3 right-4">
              <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                PREMIUM
              </span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Pro</h3>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                Premium
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">$12</p>
                <span className="text-sm text-gray-600">per month</span>
              </div>
              <p className="text-sm text-emerald-600 font-medium mt-1">
                Save $24/year with annual billing ($10/mo)
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">Everything in Free, plus:</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Unlimited products</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Unlimited categories</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Advanced branding (colors, logo)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Advanced order analytics</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Inventory management</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Custom domains</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Wholesale pricing</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Priority support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Comparison Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">30 vs ∞</p>
                <p className="text-sm text-blue-700">Product Limit</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-900">17%</p>
                <p className="text-sm text-emerald-700">Annual Savings</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">Advanced</p>
                <p className="text-sm text-purple-700">Analytics & Features</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-teal-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-teal-900 mb-1">
                Subscription Information
              </h4>
              <p className="text-sm text-teal-700">
                All businesses start with the Starter plan ($6/month) by default. Pro plan is available at $12/month 
                or $10/month with annual billing (save $24/year). Payment processing is handled securely 
                through Stripe. Users can upgrade, downgrade, or cancel anytime from their dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Super Admins Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Super Administrators</h2>
                <p className="text-sm text-gray-600">
                  Users with full platform access ({superAdmins.length} total)
                </p>
              </div>
            </div>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              disabled
            >
              <UserPlus className="w-4 h-4" />
              Add Admin
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error loading admins</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={fetchSuperAdmins}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : superAdmins.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No super administrators found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Administrator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added at
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {superAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-700 font-medium">
                            {admin.name[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{admin.name}</span>
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded">
                              SUPER ADMIN
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">{admin.email}</span>
                            <AuthMethodIcon authMethod={admin.authMethod} />
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(admin.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Remove Admin"
                        disabled
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Warning Note */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-yellow-900 mb-1">
              Important Security Notice
            </h4>
            <p className="text-sm text-yellow-700">
              Super administrators have complete access to all platform data, including all businesses, 
              users, orders, and the ability to impersonate any business owner. Only grant this role to 
              trusted team members. The ability to add or remove super admins will be implemented in a 
              future update with proper security measures.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}