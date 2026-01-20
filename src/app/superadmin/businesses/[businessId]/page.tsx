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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-4 mb-2">
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
            <p className="text-gray-600 mt-1">
              {business.businessType.toLowerCase().replace('_', ' ')} • Store URL: {business.slug}
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
            className="inline-flex items-center px-4 py-2 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Impersonate
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status and Plan */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
            </div>
          </div>

          {/* Owner Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
            </div>
          </div>

          {/* Business Statistics */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* External Syncs CTA */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-6 h-6 text-teal-600" />
              <h3 className="text-lg font-semibold text-gray-900">External Syncs</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Manage product synchronization with external systems
            </p>
            <Link
              href={`/superadmin/businesses/${business.id}/external-syncs`}
              className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Manage External Syncs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                className="w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100"
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
  )
}
