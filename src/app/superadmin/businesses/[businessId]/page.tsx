'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Building2,
  ChevronLeft,
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin,
  Package,
  UserCheck,
  CheckCircle,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Settings,
  ArrowRight,
  ShoppingBag,
  Users,
  DollarSign,
  Clock,
  Info,
  X,
  Edit,
  Trash2,
  Power,
  PowerOff
} from 'lucide-react'
import Link from 'next/link'
import { AuthMethodIcon } from '@/components/superadmin/AuthMethodIcon'

interface BusinessDetails {
  id: string
  name: string
  slug: string
  description?: string
  businessType: string
  subscriptionPlan: string
  billingType?: 'monthly' | 'yearly' | 'free' | null
  subscriptionStatus: string
  isActive: boolean
  deactivatedAt?: string | null
  deactivationReason?: string | null
  currency: string
  whatsappNumber: string
  address?: string
  email?: string
  phone?: string
  website?: string
  logo?: string
  createdAt: string
  updatedAt: string
  onboardingCompleted: boolean
  setupWizardCompleted: boolean
  createdByAdmin: boolean
  timezone?: string
  language?: string
  storefrontLanguage?: string
  deliveryEnabled?: boolean
  pickupEnabled?: boolean
  dineInEnabled?: boolean
  deliveryFee?: number
  minimumOrder?: number
  deliveryRadius?: number
  estimatedDeliveryTime?: string
  estimatedPickupTime?: string
  owner: {
    id: string
    name: string
    email: string
    createdAt: string
    authMethod: 'google' | 'email' | 'magic-link' | 'oauth'
  } | null
  stats: {
    totalOrders: number
    totalRevenue: number
    totalCustomers: number
    totalProducts: number
  }
  externalSystemName?: string | null
  externalSystemBaseUrl?: string | null
  externalSystemApiKey?: string | null
  externalSystemEndpoints?: any
  externalBrandIds?: any
}

const businessTypeIcons: Record<string, any> = {
  RESTAURANT: '🍽️',
  CAFE: '☕',
  RETAIL: '🛍️',
  GROCERY: '🛒',
  BEAUTY: '💄',
  FITNESS: '💪',
  OTHER: '🏢'
}

export default function BusinessDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string
  
  const [business, setBusiness] = useState<BusinessDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBusinessDetails()
  }, [businessId])

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/superadmin/businesses/${businessId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch business details')
      }
      const data = await response.json()
      setBusiness(data.business)
    } catch (err: any) {
      setError(err.message || 'Failed to load business details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getBusinessIcon = (business: BusinessDetails) => {
    if (business.logo) {
      return (
        <img
          src={business.logo}
          alt={`${business.name} logo`}
          className="w-full h-full object-contain rounded-lg"
        />
      )
    }
    return <Building2 className="w-8 h-8 text-gray-600" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading business details...</p>
        </div>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-900 font-medium mb-2">Error loading business</p>
          <p className="text-gray-600 mb-4">{error || 'Business not found'}</p>
          <Link
            href="/superadmin/businesses"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Businesses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/superadmin/businesses"
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                {getBusinessIcon(business)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
                <p className="text-sm text-gray-600 capitalize">
                  {business.businessType.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/${business.slug}`}
                target="_blank"
                className="inline-flex items-center px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Store
              </Link>
              <button
                onClick={() => window.open(`/admin/stores/${business.id}/dashboard?impersonate=true&businessId=${business.id}`, '_blank')}
                disabled={!business.setupWizardCompleted || !business.onboardingCompleted}
                className={`inline-flex items-center px-4 py-2 text-sm rounded-lg ${
                  business.setupWizardCompleted && business.onboardingCompleted
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Impersonate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status and Plan */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Subscription</h2>
              <div className="flex flex-wrap gap-3">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  business.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {business.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  business.subscriptionPlan === 'PRO'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {business.subscriptionPlan} Plan
                  {business.billingType && (
                    <span className="ml-1.5 text-xs font-normal opacity-75">
                      ({business.billingType === 'free' ? 'Free' : business.billingType === 'yearly' ? 'Yearly' : 'Monthly'})
                    </span>
                  )}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  business.subscriptionStatus === 'ACTIVE'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {business.subscriptionStatus}
                </span>
                {!business.setupWizardCompleted && (
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Setup Incomplete
                  </span>
                )}
                {!business.onboardingCompleted && (
                  <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Onboarding Incomplete
                  </span>
                )}
              </div>
              {business.deactivatedAt && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900">Deactivated</p>
                  <p className="text-xs text-red-700 mt-1">
                    {formatDate(business.deactivatedAt)}
                  </p>
                  {business.deactivationReason && (
                    <p className="text-xs text-red-700 mt-1">{business.deactivationReason}</p>
                  )}
                </div>
              )}
            </div>

            {/* Owner Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Owner Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{business.owner?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">Owner Name</p>
                  </div>
                  {business.owner && <AuthMethodIcon authMethod={business.owner.authMethod} />}
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{business.owner?.email || 'No email'}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {business.createdByAdmin ? 'Created by Admin' : 'Self Registered'}
                    </p>
                    <p className="text-xs text-gray-500">Registration Type</p>
                  </div>
                </div>
                {business.owner && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(business.owner.createdAt)}</p>
                      <p className="text-xs text-gray-500">Owner Since</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{business.whatsappNumber || 'Not provided'}</p>
                    <p className="text-xs text-gray-500">WhatsApp</p>
                  </div>
                </div>
                {business.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{business.phone}</p>
                      <p className="text-xs text-gray-500">Phone</p>
                    </div>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{business.email}</p>
                      <p className="text-xs text-gray-500">Business Email</p>
                    </div>
                  </div>
                )}
                {business.address && (
                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{business.address}</p>
                      <p className="text-xs text-gray-500">Business Address</p>
                    </div>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        {business.website}
                      </a>
                      <p className="text-xs text-gray-500">Website</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Business Statistics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Package className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{business.stats.totalOrders}</p>
                  <p className="text-xs text-gray-500">Total Orders</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Users className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{business.stats.totalCustomers || 0}</p>
                  <p className="text-xs text-gray-500">Customers</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <ShoppingBag className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{business.stats.totalProducts || 0}</p>
                  <p className="text-xs text-gray-500">Products</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <DollarSign className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {business.currency} {business.stats.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDate(business.createdAt)}</p>
                    <p className="text-xs text-gray-500">Created</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{formatDate(business.updatedAt)}</p>
                    <p className="text-xs text-gray-500">Last Updated</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <a
                      href={`/${business.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      /{business.slug}
                    </a>
                    <p className="text-xs text-gray-500">Store URL</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{business.currency}</p>
                    <p className="text-xs text-gray-500">Currency</p>
                  </div>
                </div>
                {business.timezone && (
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{business.timezone}</p>
                      <p className="text-xs text-gray-500">Timezone</p>
                    </div>
                  </div>
                )}
                {business.language && (
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{business.language}</p>
                      <p className="text-xs text-gray-500">Language</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {business.onboardingCompleted ? 'Completed' : 'Pending'}
                    </p>
                    <p className="text-xs text-gray-500">Onboarding</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {business.setupWizardCompleted ? 'Completed' : 'Pending'}
                    </p>
                    <p className="text-xs text-gray-500">Setup Wizard</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Settings */}
            {(business.deliveryEnabled || business.pickupEnabled || business.dineInEnabled) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`w-5 h-5 ${business.deliveryEnabled ? 'text-green-500' : 'text-gray-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {business.deliveryEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                      <p className="text-xs text-gray-500">Delivery</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`w-5 h-5 ${business.pickupEnabled ? 'text-green-500' : 'text-gray-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {business.pickupEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                      <p className="text-xs text-gray-500">Pickup</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className={`w-5 h-5 ${business.dineInEnabled ? 'text-green-500' : 'text-gray-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {business.dineInEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                      <p className="text-xs text-gray-500">Dine In</p>
                    </div>
                  </div>
                  {business.deliveryFee !== undefined && (
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {business.currency} {business.deliveryFee.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Delivery Fee</p>
                      </div>
                    </div>
                  )}
                  {business.minimumOrder !== undefined && (
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {business.currency} {business.minimumOrder.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">Minimum Order</p>
                      </div>
                    </div>
                  )}
                  {business.deliveryRadius !== undefined && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{business.deliveryRadius} km</p>
                        <p className="text-xs text-gray-500">Delivery Radius</p>
                      </div>
                    </div>
                  )}
                  {business.estimatedDeliveryTime && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{business.estimatedDeliveryTime}</p>
                        <p className="text-xs text-gray-500">Estimated Delivery Time</p>
                      </div>
                    </div>
                  )}
                  {business.estimatedPickupTime && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{business.estimatedPickupTime}</p>
                        <p className="text-xs text-gray-500">Estimated Pickup Time</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* External System Integration */}
            {(business.externalSystemName || business.externalSystemBaseUrl) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">External System Integration</h2>
                  <Link
                    href={`/superadmin/businesses/${business.id}/external-syncs`}
                    className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Manage Syncs
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {business.externalSystemName && (
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{business.externalSystemName}</p>
                        <p className="text-xs text-gray-500">System Name</p>
                      </div>
                    </div>
                  )}
                  {business.externalSystemBaseUrl && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 break-all">{business.externalSystemBaseUrl}</p>
                        <p className="text-xs text-gray-500">Base URL</p>
                      </div>
                    </div>
                  )}
                  {business.externalSystemApiKey && (
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {business.externalSystemApiKey.substring(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500">API Key</p>
                      </div>
                    </div>
                  )}
                  {business.externalBrandIds && (
                    <div className="flex items-start gap-3 md:col-span-2">
                      <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {Array.isArray(business.externalBrandIds)
                            ? business.externalBrandIds.join(', ')
                            : String(business.externalBrandIds)}
                        </p>
                        <p className="text-xs text-gray-500">Brand IDs</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* External Syncs CTA */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">External Syncs</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Manage product synchronization with external systems
              </p>
              <Link
                href={`/superadmin/businesses/${business.id}/external-syncs`}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage External Syncs
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => window.open(`/${business.slug}`, '_blank')}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <span className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Store
                  </span>
                </button>
                <button
                  onClick={() => window.open(`/admin/stores/${business.id}/dashboard?impersonate=true&businessId=${business.id}`, '_blank')}
                  disabled={!business.setupWizardCompleted || !business.onboardingCompleted}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg ${
                    business.setupWizardCompleted && business.onboardingCompleted
                      ? 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                      : 'text-gray-400 bg-gray-50 cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Impersonate
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
