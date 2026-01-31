// src/components/superadmin/SuperAdminUserDetails.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { 
  User,
  Mail, 
  Building2, 
  Calendar,
  ChevronLeft,
  AlertTriangle,
  CreditCard,
  Package,
  ShoppingBag,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react'
import { AuthMethodIcon } from './AuthMethodIcon'
import Link from 'next/link'

interface Business {
  id: string
  name: string
  slug: string
  businessType: string
  role: string
  subscriptionPlan: string
  subscriptionStatus: string
  isActive: boolean
  createdAt: string
  ordersCount: number
  productsCount: number
}

interface TrialInfo {
  status: 'TRIAL_ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'PAID'
  trialEndsAt: string | null
  graceEndsAt: string | null
  daysRemaining: number
  trialUsed: boolean
}

interface Subscription {
  id: string
  stripeId: string
  status: string
  priceId: string
  plan: string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
}

interface UserData {
  id: string
  name: string
  email: string
  role: string
  authMethod: 'google' | 'email' | 'magic-link' | 'oauth'
  createdAt: string
  emailVerified: string | null
  plan: string
  stripeCustomerId: string | null
  subscription: Subscription | null
  trialInfo: TrialInfo | null
  businesses: Business[]
  stats: {
    totalBusinesses: number
    totalOrders: number
    totalProducts: number
  }
}

interface SuperAdminUserDetailsProps {
  userId: string
}

export function SuperAdminUserDetails({ userId }: SuperAdminUserDetailsProps) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState(false)

  useEffect(() => {
    fetchUserDetails()
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/superadmin/users/${userId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('User not found')
        }
        throw new Error('Failed to fetch user details')
      }

      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error('Error fetching user details:', error)
      setError(error instanceof Error ? error.message : 'Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const getTrialStatusBadge = (status: string) => {
    switch (status) {
      case 'TRIAL_ACTIVE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Clock className="w-3 h-3 mr-1" />
            Trial Active
          </span>
        )
      case 'GRACE_PERIOD':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            Grace Period
          </span>
        )
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Trial Expired
          </span>
        )
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </span>
        )
      default:
        return null
    }
  }

  const getPlanBadge = (plan: string) => {
    const styles: Record<string, string> = {
      BUSINESS: 'bg-indigo-100 text-indigo-800',
      PRO: 'bg-purple-100 text-purple-800',
      STARTER: 'bg-gray-100 text-gray-800'
    }
    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[plan] || styles.STARTER}`}>
        {plan}
      </span>
    )
  }

  const getSubscriptionStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      canceled: 'bg-red-100 text-red-800',
      incomplete: 'bg-gray-100 text-gray-800',
      paused: 'bg-orange-100 text-orange-800'
    }
    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.incomplete}`}>
        {status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Link
          href="/superadmin/users"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Users
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading user</h3>
              <p className="text-sm text-red-700 mt-1">{error || 'User not found'}</p>
            </div>
          </div>
          <button
            onClick={fetchUserDetails}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link
            href="/superadmin/users"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 font-semibold text-lg">
                {user.name[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-600">{user.email}</span>
                <AuthMethodIcon authMethod={user.authMethod} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Account Info & Businesses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-400" />
                Account Information
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</label>
                  <p className="mt-1 text-sm font-medium text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</label>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                    {user.emailVerified && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Authentication</label>
                  <div className="mt-1 flex items-center gap-2">
                    <AuthMethodIcon authMethod={user.authMethod} />
                    <p className="text-sm text-gray-900 capitalize">{user.authMethod.replace('-', ' ')}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
                      {user.id}
                    </code>
                    <button
                      onClick={() => copyToClipboard(user.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy ID"
                    >
                      {copiedId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Businesses */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-gray-400" />
                Businesses ({user.businesses.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {user.businesses.length === 0 ? (
                <div className="p-6 text-center">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No businesses associated with this account</p>
                </div>
              ) : (
                user.businesses.map((business) => (
                  <div key={business.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-900">{business.name}</h3>
                          {getPlanBadge(business.subscriptionPlan)}
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            business.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {business.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                          <span className="capitalize">{business.businessType.toLowerCase().replace('_', ' ')}</span>
                          <span>•</span>
                          <span>Role: {business.role}</span>
                          <span>•</span>
                          <span>{business.ordersCount} orders</span>
                          <span>•</span>
                          <span>{business.productsCount} products</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          Created {formatShortDate(business.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/superadmin/businesses/${business.id}`}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                        >
                          View Details
                          <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Subscription & Stats */}
        <div className="space-y-6">
          {/* Subscription Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-gray-400" />
                Subscription
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</label>
                <div className="mt-1">
                  {getPlanBadge(user.plan || 'STARTER')}
                </div>
              </div>

              {user.trialInfo && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Trial Status</label>
                  <div className="mt-1 space-y-2">
                    {getTrialStatusBadge(user.trialInfo.status)}
                    {user.trialInfo.status === 'TRIAL_ACTIVE' && (
                      <p className="text-sm text-blue-600">
                        {user.trialInfo.daysRemaining} days remaining
                      </p>
                    )}
                    {user.trialInfo.status === 'GRACE_PERIOD' && (
                      <p className="text-sm text-yellow-600">
                        {user.trialInfo.daysRemaining} days of grace period remaining
                      </p>
                    )}
                    {user.trialInfo.trialEndsAt && (
                      <p className="text-xs text-gray-500">
                        Trial {user.trialInfo.status === 'TRIAL_ACTIVE' ? 'ends' : 'ended'}: {formatShortDate(user.trialInfo.trialEndsAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {user.subscription && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription Status</label>
                    <div className="mt-1">
                      {getSubscriptionStatusBadge(user.subscription.status)}
                    </div>
                  </div>

                  {user.subscription.currentPeriodEnd && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Period</label>
                      <p className="mt-1 text-sm text-gray-900">
                        Ends {formatShortDate(user.subscription.currentPeriodEnd)}
                      </p>
                    </div>
                  )}

                  {user.subscription.cancelAtPeriodEnd && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        Subscription will cancel at period end
                      </p>
                    </div>
                  )}
                </>
              )}

              {user.stripeCustomerId && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Stripe Customer</label>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono truncate max-w-[150px]">
                      {user.stripeCustomerId}
                    </code>
                    <a
                      href={`https://dashboard.stripe.com/customers/${user.stripeCustomerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 text-xs font-medium"
                    >
                      View in Stripe →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm">Businesses</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{user.stats.totalBusinesses}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <Package className="w-4 h-4" />
                  <span className="text-sm">Total Orders</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{user.stats.totalOrders}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <ShoppingBag className="w-4 h-4" />
                  <span className="text-sm">Total Products</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">{user.stats.totalProducts}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
