'use client'

import { useState, useEffect, useRef } from 'react'
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
  PowerOff,
  Truck,
  TrendingUp,
  Sparkles,
  Link2
} from 'lucide-react'
import Link from 'next/link'
import { AuthMethodIcon } from '@/components/superadmin/AuthMethodIcon'
import toast from 'react-hot-toast'

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
  testMode?: boolean
  trialEndsAt?: string | null
  graceEndsAt?: string | null
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
  hideProductsWithoutPhotos?: boolean
  deliveryEnabled?: boolean
  pickupEnabled?: boolean
  dineInEnabled?: boolean
  deliveryFee?: number
  minimumOrder?: number
  deliveryRadius?: number
  estimatedDeliveryTime?: string
  estimatedPickupTime?: string
  deliveryTimeText?: string | null
  freeDeliveryText?: string | null
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
    productsWithoutPhotos?: number
    productsWithZeroPrice?: number
    productsOutOfStock?: number
    productsWithVariantsAllZeroStock?: number
    productsWithVariantsSomeZeroStock?: number
    productsWithVariantsAllNonZeroStock?: number
    inactiveProducts?: number
  }
  externalSystemName?: string | null
  externalSystemBaseUrl?: string | null
  externalSystemApiKey?: string | null
  externalSystemEndpoints?: any
  externalBrandIds?: any
  connectedBusinesses?: string[]
}

// Helper to check if business is on trial
function isOnTrial(business: BusinessDetails): boolean {
  if (!business.trialEndsAt) return false
  return new Date(business.trialEndsAt) > new Date()
}

// Helper to get trial days remaining
function getTrialDaysRemaining(business: BusinessDetails): number {
  if (!business.trialEndsAt) return 0
  const now = new Date()
  const trialEnd = new Date(business.trialEndsAt)
  if (trialEnd <= now) return 0
  return Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
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
  const [postals, setPostals] = useState<any[]>([])
  const [postalPricing, setPostalPricing] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'delivery' | 'postals' | 'pricing'>('delivery')
  const [marketplaceInfo, setMarketplaceInfo] = useState<{
    isOriginator: boolean
    isSupplier: boolean
    originator?: { id: string; name: string }
    suppliers?: Array<{ id: string; name: string; productCount: number }>
  } | null>(null)

  useEffect(() => {
    fetchBusinessDetails()
  }, [businessId])

  useEffect(() => {
    if (business && business.businessType === 'RETAIL') {
      fetchPostalData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.businessType, businessId])

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/superadmin/businesses/${businessId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch business details')
      }
      const data = await response.json()
      setBusiness(data.business)
      
      // Check marketplace status
      await fetchMarketplaceInfo(data.business)
    } catch (err: any) {
      setError(err.message || 'Failed to load business details')
    } finally {
      setLoading(false)
    }
  }

  const fetchMarketplaceInfo = async (businessData: BusinessDetails) => {
    try {
      // Check if business is originator (has connectedBusinesses)
      const isOriginator = !!(businessData.connectedBusinesses && businessData.connectedBusinesses.length > 0)
      
      // Check if business is supplier (find businesses that have this business in their connectedBusinesses)
      const originatorResponse = await fetch(`/api/superadmin/businesses/${businessId}/marketplace/originator`)
      const originatorData = originatorResponse.ok ? await originatorResponse.json() : null
      
      // If originator, get suppliers info
      let suppliers: Array<{ id: string; name: string; productCount: number }> = []
      if (isOriginator) {
        const suppliersResponse = await fetch(`/api/superadmin/businesses/${businessId}/marketplace/suppliers`)
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json()
          suppliers = suppliersData.suppliers || []
        }
      }
      
      setMarketplaceInfo({
        isOriginator,
        isSupplier: !!originatorData?.originator,
        originator: originatorData?.originator || undefined,
        suppliers: suppliers.length > 0 ? suppliers : undefined
      })
    } catch (err) {
      console.error('Error fetching marketplace info:', err)
    }
  }

  const fetchPostalData = async () => {
    try {
      const [postalsRes, pricingRes] = await Promise.all([
        fetch(`/api/superadmin/businesses/${businessId}/postals`),
        fetch(`/api/superadmin/businesses/${businessId}/postal-pricing`)
      ])

      if (postalsRes.ok) {
        const data = await postalsRes.json()
        setPostals(data.postals || [])
      }

      if (pricingRes.ok) {
        const data = await pricingRes.json()
        setPostalPricing(data.pricing || [])
      }
    } catch (err) {
      console.error('Error fetching postal data:', err)
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

  const toggleHideProductsWithoutPhotos = async () => {
    if (!business) return
    
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hideProductsWithoutPhotos: !business.hideProductsWithoutPhotos
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBusiness(data.business)
      } else {
        toast.error('Failed to update setting')
      }
    } catch (error) {
      console.error('Error toggling setting:', error)
      toast.error('Failed to update setting')
    }
  }

  const toggleTestMode = async () => {
    if (!business) return
    
    try {
      const response = await fetch(`/api/superadmin/businesses/${businessId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testMode: !business.testMode
        })
      })

      if (response.ok) {
        const data = await response.json()
        setBusiness(data.business)
      } else {
        toast.error('Failed to update test mode')
      }
    } catch (error) {
      console.error('Error toggling test mode:', error)
      toast.error('Failed to update test mode')
    }
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
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/superadmin/businesses"
            className="text-gray-400 hover:text-gray-600"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Logo & Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {getBusinessIcon(business)}
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Business Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {business.businessType.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Store URL</p>
                    <a
                      href={`/${business.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      /{business.slug}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status and Plan */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status & Subscription</h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                business.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {business.isActive ? 'Active' : 'Inactive'}
              </span>
              {isOnTrial(business) && (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-amber-100 text-amber-800">
                  Trial ({getTrialDaysRemaining(business)} days left)
                </span>
              )}
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                business.subscriptionPlan === 'BUSINESS'
                  ? 'bg-indigo-100 text-indigo-800'
                  : business.subscriptionPlan === 'PRO'
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
              {business.testMode && (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-orange-100 text-orange-800">
                  Test Mode
                </span>
              )}
            </div>
            
            {/* Test Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-900 mb-1">
                  Test Mode
                </h3>
                <p className="text-xs text-orange-700">
                  Test businesses are excluded from analytics and dashboard statistics
                </p>
              </div>
              <button
                onClick={toggleTestMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  business.testMode ? 'bg-orange-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    business.testMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Marketplace Card */}
          {marketplaceInfo && (marketplaceInfo.isOriginator === true || marketplaceInfo.isSupplier === true) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Marketplace</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {marketplaceInfo.isOriginator 
                      ? 'This business is an originator (marketplace owner)'
                      : 'This business is a supplier (connected to an originator)'}
                  </p>
                </div>
                <Link
                  href={`/superadmin/businesses/${businessId}/marketplace`}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium"
                >
                  View Marketplace
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              {marketplaceInfo.isSupplier && marketplaceInfo.originator && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-1">Originator</p>
                  <p className="text-sm text-blue-700">{marketplaceInfo.originator.name}</p>
                  <p className="text-xs text-blue-600 mt-1">This business's products are visible to the originator</p>
                </div>
              )}
              
              {marketplaceInfo.isOriginator && marketplaceInfo.suppliers && marketplaceInfo.suppliers.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-900 mb-2">Suppliers ({marketplaceInfo.suppliers.length})</p>
                  <div className="space-y-2">
                    {marketplaceInfo.suppliers.map((supplier) => (
                      <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <span className="text-sm text-gray-900">{supplier.name}</span>
                          <span className="text-sm text-gray-600 ml-2">{supplier.productCount} products</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Business Statistics</h2>
              <Link
                href={`/superadmin/businesses/${businessId}/orders`}
                className="inline-flex items-center px-3 py-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 mr-1" />
                Order Stats
              </Link>
            </div>
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
                <TrendingUp className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {business.currency} {business.stats.totalRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
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

          {/* Storefront Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              Storefront Settings
            </h2>
            <div className="space-y-4">
              {/* Product Filtering Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Products Without Photos Count Card */}
                {typeof business.stats.productsWithoutPhotos === 'number' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900">
                          {business.stats.productsWithoutPhotos} Product{business.stats.productsWithoutPhotos !== 1 ? 's' : ''} Without Photos
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          {business.stats.productsWithoutPhotos === 0 
                            ? 'All products have photos' 
                            : `${business.stats.productsWithoutPhotos} of ${business.stats.totalProducts} products are missing images`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products With Zero Price Count Card */}
                {typeof business.stats.productsWithZeroPrice === 'number' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900">
                          {business.stats.productsWithZeroPrice} Product{business.stats.productsWithZeroPrice !== 1 ? 's' : ''} With Zero Price
                        </p>
                        <p className="text-xs text-red-700 mt-1">
                          {business.stats.productsWithZeroPrice === 0 
                            ? 'All products have valid prices' 
                            : `${business.stats.productsWithZeroPrice} of ${business.stats.totalProducts} products have price ≤ 0`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products Out Of Stock (No Variants) Count Card */}
                {typeof business.stats.productsOutOfStock === 'number' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-orange-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-orange-900">
                          {business.stats.productsOutOfStock} Product{business.stats.productsOutOfStock !== 1 ? 's' : ''} Out Of Stock
                        </p>
                        <p className="text-xs text-orange-700 mt-1">
                          {business.stats.productsOutOfStock === 0 
                            ? 'All products (no variants) have stock' 
                            : `${business.stats.productsOutOfStock} products (no variants) have stock ≤ 0`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products With Variants - All Zero Stock Count Card */}
                {typeof business.stats.productsWithVariantsAllZeroStock === 'number' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-purple-900">
                          {business.stats.productsWithVariantsAllZeroStock} Product{business.stats.productsWithVariantsAllZeroStock !== 1 ? 's' : ''} With All Variants Zero Stock
                        </p>
                        <p className="text-xs text-purple-700 mt-1">
                          {business.stats.productsWithVariantsAllZeroStock === 0 
                            ? 'No products have all variants with stock = 0' 
                            : `${business.stats.productsWithVariantsAllZeroStock} products have all variants with stock = 0`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products With Variants - Some Zero Stock Count Card */}
                {typeof business.stats.productsWithVariantsSomeZeroStock === 'number' && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-indigo-900">
                          {business.stats.productsWithVariantsSomeZeroStock} Product{business.stats.productsWithVariantsSomeZeroStock !== 1 ? 's' : ''} With Some Variants Zero Stock
                        </p>
                        <p className="text-xs text-indigo-700 mt-1">
                          {business.stats.productsWithVariantsSomeZeroStock === 0 
                            ? 'No products have some variants with stock = 0' 
                            : `${business.stats.productsWithVariantsSomeZeroStock} products have some variants with stock = 0 (but not all)`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products With Variants - All Non-Zero Stock Count Card */}
                {typeof business.stats.productsWithVariantsAllNonZeroStock === 'number' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900">
                          {business.stats.productsWithVariantsAllNonZeroStock} Product{business.stats.productsWithVariantsAllNonZeroStock !== 1 ? 's' : ''} With All Variants In Stock
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          {business.stats.productsWithVariantsAllNonZeroStock === 0 
                            ? 'No products have all variants with stock &gt; 0' 
                            : `${business.stats.productsWithVariantsAllNonZeroStock} products have all variants with stock &gt; 0`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Inactive Products Count Card */}
                {typeof business.stats.inactiveProducts === 'number' && (
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <PowerOff className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {business.stats.inactiveProducts} Inactive Product{business.stats.inactiveProducts !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-700 mt-1">
                          {business.stats.inactiveProducts === 0 
                            ? 'All products are active' 
                            : `${business.stats.inactiveProducts} products are inactive and not shown on storefront`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hide Products Without Photos Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    Hide Products Without Photos
                  </h3>
                  <p className="text-xs text-gray-500">
                    Products without images will be excluded from storefront listings and filters
                  </p>
                </div>
                <button
                  onClick={toggleHideProductsWithoutPhotos}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    business.hideProductsWithoutPhotos ? 'bg-teal-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      business.hideProductsWithoutPhotos ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Settings */}
          {(business.deliveryEnabled || business.pickupEnabled || business.dineInEnabled) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Settings</h2>
              
              {/* Tabs for RETAIL businesses */}
              {business.businessType === 'RETAIL' ? (
                <>
                  {/* Tab Navigation */}
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                    <button
                      onClick={() => setActiveTab('delivery')}
                      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'delivery'
                          ? 'bg-white text-teal-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Delivery Methods
                    </button>
                    <button
                      onClick={() => setActiveTab('postals')}
                      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'postals'
                          ? 'bg-white text-teal-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Postal Services ({postals.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('pricing')}
                      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === 'pricing'
                          ? 'bg-white text-teal-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Postal Pricing ({postalPricing.length})
                    </button>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'delivery' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${business.deliveryEnabled ? 'text-green-500' : 'text-gray-300'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {business.deliveryEnabled ? 'Enabled' : 'Disabled'}
                          </p>
                          <p className="text-xs text-gray-500">Delivery</p>
                        </div>
                      </div>
                      
                      {/* Custom Texts for RETAIL */}
                      {(business.deliveryTimeText || business.freeDeliveryText) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Custom Display Texts</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {business.deliveryTimeText && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Custom Delivery Time Text</p>
                                <p className="text-sm font-medium text-gray-900">{business.deliveryTimeText}</p>
                              </div>
                            )}
                            {business.freeDeliveryText && (
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Custom Free Delivery Text</p>
                                <p className="text-sm font-medium text-gray-900">{business.freeDeliveryText}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'postals' && (
                    <div className="space-y-4">
                      {postals.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No postal services configured</p>
                      ) : (
                        postals.map((postal) => (
                          <div key={postal.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start gap-4">
                              {postal.logo && (
                                <img
                                  src={postal.logo}
                                  alt={postal.name}
                                  className="w-12 h-12 object-contain rounded flex-shrink-0"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-gray-900">{postal.name}</h3>
                                  {postal.nameAl && (
                                    <p className="text-sm text-gray-600">{postal.nameAl}</p>
                                  )}
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    postal.type === 'fast'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {postal.type === 'fast' ? 'Fast' : 'Normal'}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    postal.isActive
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {postal.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                {postal.description && (
                                  <p className="text-sm text-gray-600 mb-2">{postal.description}</p>
                                )}
                                {postal.deliveryTime && (
                                  <p className="text-sm text-gray-500">
                                    Delivery Time: {postal.deliveryTime}
                                  </p>
                                )}
                                {postal._count?.pricing !== undefined && (
                                  <p className="text-xs text-gray-500 mt-2">
                                    {postal._count.pricing} pricing rule{postal._count.pricing !== 1 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'pricing' && (
                    <div className="space-y-4">
                      {postalPricing.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">No postal pricing configured</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Postal Service</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Order</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Order</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delivery Time</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {postalPricing.map((pricing) => (
                                <tr key={pricing.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      {pricing.postal?.logo && (
                                        <img
                                          src={pricing.postal.logo}
                                          alt={pricing.postal.name}
                                          className="w-6 h-6 object-contain rounded"
                                        />
                                      )}
                                      <span className="text-sm font-medium text-gray-900">
                                        {pricing.postal?.name || 'Unknown'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{pricing.cityName}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      pricing.type === 'fast'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {pricing.type === 'fast' ? 'Fast' : 'Normal'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900">
                                    {business.currency} {pricing.price.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {pricing.minOrderValue ? `${business.currency} ${pricing.minOrderValue.toFixed(2)}` : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {pricing.maxOrderValue ? `${business.currency} ${pricing.maxOrderValue.toFixed(2)}` : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-500">
                                    {pricing.deliveryTime || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Non-RETAIL businesses - show all delivery settings */
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
              )}
            </div>
          )}

          {/* External System Integration */}
          {(business.externalSystemName || business.externalSystemBaseUrl) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">External System Integration</h2>
                <Link
                  href={`/superadmin/businesses/${business.id}/external-syncs`}
                  className="inline-flex items-center px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
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
                        {business.externalBrandIds}
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

          {/* Anomalies CTA */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">Anomalies</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Detect and manage data quality issues
            </p>
            <Link
              href={`/superadmin/businesses/${business.id}/anomalies`}
              className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Manage Anomalies
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Custom Features CTA */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Custom Features</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enable advanced features like brands, collections, custom menus and filtering
            </p>
            <Link
              href={`/superadmin/businesses/${business.id}/custom-features`}
              className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Manage Custom Features
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Connected Businesses CTA */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Link2 className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Connected Businesses</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Manage business connections for marketplace and shared products
            </p>
            <Link
              href={`/superadmin/businesses/${business.id}/connections`}
              className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Manage Connections
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          {/* Quick Actions */}
          <QuickActionsSection business={business} onTrialReset={fetchBusinessDetails} />

          {/* Account Managers */}
          <AccountManagersSection businessId={businessId} />

          {/* Complete Setup Section - Show if setup incomplete */}
          {(!business.setupWizardCompleted || !business.onboardingCompleted) && (
            <CompleteSetupSection business={business} onUpdate={fetchBusinessDetails} />
          )}
        </div>
      </div>
    </div>
  )
}

// Quick Actions Section Component
function QuickActionsSection({ 
  business, 
  onTrialReset 
}: { 
  business: BusinessDetails
  onTrialReset: () => void 
}) {
  const [resettingTrial, setResettingTrial] = useState(false)

  const handleResetTrial = async () => {
    if (!confirm('Are you sure you want to reset the trial for this business? The owner will be able to start a new 14-day trial.')) {
      return
    }

    setResettingTrial(true)
    try {
      const res = await fetch(`/api/superadmin/businesses/${business.id}/reset-trial`, {
        method: 'POST'
      })
      
      if (res.ok) {
        toast.success('Trial reset successfully')
        onTrialReset()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to reset trial')
      }
    } catch (error) {
      toast.error('Error resetting trial')
    } finally {
      setResettingTrial(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-2">
        <button
          onClick={() => window.open(`/${business.slug}`, '_blank')}
          className="w-full flex items-center justify-between px-4 py-2 text-sm text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100"
        >
          <span className="flex items-center">
            <ExternalLink className="w-4 h-4 mr-2" />
            Visit Store
          </span>
        </button>
        <button
          onClick={() => window.open(`/admin/stores/${business.id}/dashboard?impersonate=true&businessId=${business.id}`, '_blank')}
          disabled={!business.setupWizardCompleted || !business.onboardingCompleted}
          className="w-full flex items-center justify-between px-4 py-2 text-sm rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center">
            <UserCheck className="w-4 h-4 mr-2" />
            Impersonate
          </span>
        </button>
        <button
          onClick={handleResetTrial}
          disabled={resettingTrial}
          className="w-full flex items-center justify-between px-4 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 disabled:opacity-50"
        >
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            {resettingTrial ? 'Resetting...' : 'Reset Trial'}
          </span>
        </button>
      </div>
    </div>
  )
}

// Account Managers Section Component
function AccountManagersSection({ businessId }: { businessId: string }) {
  const [accountManagers, setAccountManagers] = useState<Array<{
    id: string
    name: string
    email: string
    role: string
    avatar: string | null
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAccountManagers()
  }, [businessId])

  const fetchAccountManagers = async () => {
    try {
      const res = await fetch(`/api/superadmin/businesses/${businessId}/account-managers`)
      if (res.ok) {
        const data = await res.json()
        setAccountManagers(data.accountManagers || [])
      }
    } catch (error) {
      console.error('Error fetching account managers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2 text-purple-600" />
        Account Managers
      </h3>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : accountManagers.length === 0 ? (
        <p className="text-sm text-gray-500">No account manager assigned</p>
      ) : (
        <div className="space-y-2">
          {accountManagers.map(am => (
            <div key={am.id} className="flex items-center p-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                {am.avatar ? (
                  <img src={am.avatar} alt={am.name} className="w-8 h-8 rounded-full" />
                ) : (
                  <span className="text-purple-700 text-sm font-medium">
                    {am.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{am.name}</p>
                <p className="text-xs text-gray-500 truncate">{am.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <Link
        href="/superadmin/team"
        className="mt-3 text-xs text-teal-600 hover:underline inline-flex items-center"
      >
        Manage team assignments
        <ArrowRight className="w-3 h-3 ml-1" />
      </Link>
    </div>
  )
}

// Complete Setup Section Component
function CompleteSetupSection({ 
  business, 
  onUpdate 
}: { 
  business: BusinessDetails
  onUpdate: () => void 
}) {
  const [showModal, setShowModal] = useState(false)

  // Check what's missing
  const missingFields = []
  if (!business.whatsappNumber || business.whatsappNumber === 'Not provided') missingFields.push('WhatsApp Number')
  if (!business.address || business.address === 'Not set') missingFields.push('Address')
  if (!business.setupWizardCompleted) missingFields.push('Setup Wizard')
  if (!business.onboardingCompleted) missingFields.push('Onboarding')

  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-amber-800 mb-2 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Setup Incomplete
        </h3>
        <p className="text-sm text-amber-700 mb-3">
          This business hasn't completed the setup process.
        </p>
        {missingFields.length > 0 && (
          <ul className="text-sm text-amber-600 mb-4 space-y-1">
            {missingFields.map(field => (
              <li key={field}>• {field}</li>
            ))}
          </ul>
        )}
        <button
          onClick={() => setShowModal(true)}
          className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
        >
          Complete Setup
        </button>
      </div>

      {showModal && (
        <CompleteSetupModal
          business={business}
          onClose={() => setShowModal(false)}
          onUpdate={() => {
            onUpdate()
            setShowModal(false)
          }}
        />
      )}
    </>
  )
}

// Address Autocomplete Component for Complete Setup
function SetupAddressAutocomplete({ 
  value, 
  onChange, 
  onCoordinatesChange,
  onCountryChange 
}: { 
  value: string
  onChange: (value: string) => void
  onCoordinatesChange: (lat: number, lng: number) => void
  onCountryChange?: (country: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existingScript) {
      const checkGoogle = () => {
        if ((window as any).google?.maps?.places) {
          setIsLoaded(true)
        } else {
          setTimeout(checkGoogle, 100)
        }
      }
      checkGoogle()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setIsLoaded(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return

    const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
      types: ['address']
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      
      if (place.formatted_address && place.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        
        onChange(place.formatted_address)
        onCoordinatesChange(lat, lng)
        
        if (onCountryChange && place.address_components) {
          const countryComponent = place.address_components.find(
            (comp: any) => comp.types.includes('country')
          )
          if (countryComponent?.short_name) {
            onCountryChange(countryComponent.short_name)
          }
        }
      }
    })
  }, [isLoaded, onChange, onCoordinatesChange, onCountryChange])

  return (
    <input
      ref={inputRef}
      type="text"
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500"
      placeholder="Start typing address..."
    />
  )
}

// Complete Setup Modal Component
function CompleteSetupModal({ 
  business, 
  onClose, 
  onUpdate 
}: { 
  business: BusinessDetails
  onClose: () => void
  onUpdate: () => void 
}) {
  const [loading, setLoading] = useState(false)
  // Extract phone prefix from existing whatsapp number if possible
  const extractPhonePrefix = (number: string): { prefix: string, rest: string } => {
    if (!number) return { prefix: '+1', rest: '' }
    const prefixes = ['+1246', '+973', '+355', '+44', '+39', '+34', '+30', '+1']
    for (const p of prefixes) {
      if (number.startsWith(p)) {
        return { prefix: p, rest: number.slice(p.length).trim() }
      }
    }
    // If no known prefix, treat as OTHER
    if (number.startsWith('+')) {
      return { prefix: 'OTHER', rest: number }
    }
    return { prefix: '+1', rest: number }
  }

  const phoneData = extractPhonePrefix(business.whatsappNumber || '')

  const [formData, setFormData] = useState({
    name: business.name || '',
    slug: business.slug || '',
    phonePrefix: phoneData.prefix,
    whatsappNumber: phoneData.rest,
    address: business.address || '',
    country: '',
    storeLatitude: 0,
    storeLongitude: 0,
    email: business.email || '',
    phone: business.phone || '',
    currency: business.currency || 'USD',
    timezone: business.timezone || 'UTC',
    language: business.language || 'en',
    subscriptionPlan: business.subscriptionPlan || 'STARTER',
    billingType: (business as any).billingType || 'free' as 'monthly' | 'yearly' | 'free' | 'trial',
    deliveryEnabled: business.deliveryEnabled ?? true,
    pickupEnabled: business.pickupEnabled ?? true,
    deliveryFee: business.deliveryFee?.toString() || '0',
    minimumOrder: business.minimumOrder?.toString() || '0',
    markAsComplete: true,
    // Owner password (only for email auth)
    newPassword: '',
    confirmPassword: ''
  })

  const isOAuthUser = business.owner?.authMethod === 'google' || business.owner?.authMethod === 'oauth'
  
  // Check if business has existing Stripe subscription
  const hasStripeSubscription = !!(business as any).stripeSubscriptionId
  const isOnTrial = business.trialEndsAt && new Date(business.trialEndsAt) > new Date()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Business name is required')
      return
    }

    if (!formData.whatsappNumber.trim()) {
      toast.error('WhatsApp number is required')
      return
    }

    if (!formData.address.trim()) {
      toast.error('Business address is required')
      return
    }

    // Validate slug format
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error('Store URL can only contain lowercase letters, numbers, and hyphens')
      return
    }

    if (formData.slug && formData.slug.length < 3) {
      toast.error('Store URL must be at least 3 characters')
      return
    }

    // Validate password if provided
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Combine phone prefix with number
      const fullWhatsappNumber = formData.phonePrefix === 'OTHER' 
        ? formData.whatsappNumber 
        : `${formData.phonePrefix}${formData.whatsappNumber}`

      const res = await fetch(`/api/superadmin/businesses/${business.id}/complete-setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          whatsappNumber: fullWhatsappNumber,
          deliveryFee: parseFloat(formData.deliveryFee) || 0,
          minimumOrder: parseFloat(formData.minimumOrder) || 0,
          ownerId: business.owner?.id,
          newPassword: formData.newPassword || undefined,
          // Subscription fields
          subscriptionPlan: formData.subscriptionPlan,
          billingType: formData.billingType,
          // Address fields
          country: formData.country || undefined,
          storeLatitude: formData.storeLatitude || undefined,
          storeLongitude: formData.storeLongitude || undefined
        })
      })

      const result = await res.json()
      if (res.ok) {
        toast.success(result.passwordUpdated 
          ? 'Setup completed and password updated!' 
          : 'Setup completed successfully')
        onUpdate()
      } else {
        toast.error(result.message || 'Failed to complete setup')
      }
    } catch (error) {
      toast.error('Error completing setup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Complete Business Setup</h2>
            <p className="text-sm text-gray-500">{business.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Owner Information */}
          {business.owner && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Owner Account</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {/* Owner Info Display */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-700 font-semibold">
                      {business.owner.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{business.owner.name || 'No name'}</p>
                    <p className="text-sm text-gray-500">{business.owner.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AuthMethodIcon authMethod={business.owner.authMethod} />
                    <span className="text-xs text-gray-500 capitalize">
                      {business.owner.authMethod === 'google' ? 'Google' : 
                       business.owner.authMethod === 'magic-link' ? 'Magic Link' : 
                       business.owner.authMethod === 'oauth' ? 'OAuth' : 'Email'}
                    </span>
                  </div>
                </div>

                {/* Password Change - Only for email auth users */}
                {!isOAuthUser && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs text-amber-600 mb-2 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      This user registered with email/password. You can set a new password below.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
                        <input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          placeholder="Leave blank to keep current"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password</label>
                        <input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* OAuth user notice */}
                {isOAuthUser && (
                  <p className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                    This user signed up with {business.owner.authMethod === 'google' ? 'Google' : 'OAuth'}. No password management needed.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store URL (slug)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
            <div className="space-y-4">
              {/* WhatsApp with country selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number *</label>
                <div className="flex gap-2">
                  <select
                    value={formData.phonePrefix}
                    onChange={(e) => setFormData({ ...formData, phonePrefix: e.target.value })}
                    className="w-28 px-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                  >
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+30">🇬🇷 +30</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+34">🇪🇸 +34</option>
                    <option value="+355">🇦🇱 +355</option>
                    <option value="+973">🇧🇭 +973</option>
                    <option value="+1246">🇧🇧 +1246</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="OTHER">🌍 Other</option>
                  </select>
                  <input
                    type="tel"
                    value={formData.whatsappNumber}
                    onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    placeholder={formData.phonePrefix === 'OTHER' ? '+55 11 987654321' : '123456789'}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500"
                    required
                  />
                </div>
                {formData.phonePrefix === 'OTHER' && (
                  <p className="text-xs text-gray-500 mt-1">Enter full number with country code</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Address with autocomplete */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address *</label>
                <SetupAddressAutocomplete
                  value={formData.address}
                  onChange={(address) => setFormData({ ...formData, address })}
                  onCoordinatesChange={(lat, lng) => setFormData({ ...formData, storeLatitude: lat, storeLongitude: lng })}
                  onCountryChange={(country) => setFormData({ ...formData, country })}
                />
                {(formData.storeLatitude !== 0 || formData.country) && (
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    {formData.storeLatitude !== 0 && formData.storeLongitude !== 0 && (
                      <p>Coordinates: {formData.storeLatitude.toFixed(6)}, {formData.storeLongitude.toFixed(6)}</p>
                    )}
                    {formData.country && (
                      <p className="flex items-center gap-1">
                        <span>Country:</span>
                        <span className="font-medium">{formData.country}</span>
                        <span className="text-gray-400">(Auto-detected from address)</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Regional Settings</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="ALL">ALL (Lek)</option>
                  <option value="BHD">BHD (د.ب)</option>
                  <option value="BBD">BBD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="Europe/Tirane">Europe/Tirane</option>
                  <option value="Europe/Athens">Europe/Athens</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New York</option>
                  <option value="America/Barbados">America/Barbados</option>
                  <option value="Asia/Bahrain">Asia/Bahrain</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500"
                >
                  <option value="en">English</option>
                  <option value="al">Albanian</option>
                  <option value="el">Greek</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Subscription Plan</h3>
            
            {/* Show current status if exists */}
            {(hasStripeSubscription || isOnTrial) && (
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <Info className="w-4 h-4 inline mr-1" />
                  {hasStripeSubscription && 'This business has an existing Stripe subscription. '}
                  {isOnTrial && `Currently on trial (ends ${new Date(business.trialEndsAt!).toLocaleDateString()}). `}
                  Changes here will update the database only.
                </p>
              </div>
            )}
            
            {/* Plan Selection */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {['STARTER', 'PRO', 'BUSINESS'].map(plan => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setFormData({ ...formData, subscriptionPlan: plan })}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    formData.subscriptionPlan === plan
                      ? plan === 'BUSINESS' ? 'border-indigo-500 bg-indigo-50'
                        : plan === 'PRO' ? 'border-purple-500 bg-purple-50'
                        : 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{plan}</div>
                  <div className="text-xs text-gray-500">
                    {plan === 'STARTER' ? '$19/mo' : plan === 'PRO' ? '$39/mo' : '$79/mo'}
                  </div>
                </button>
              ))}
            </div>

            {/* Billing Type Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Billing Type</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, billingType: 'monthly' })}
                  className={`px-3 py-1.5 border-2 rounded-lg text-sm font-medium transition-all ${
                    formData.billingType === 'monthly'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, billingType: 'yearly' })}
                  className={`px-3 py-1.5 border-2 rounded-lg text-sm font-medium transition-all ${
                    formData.billingType === 'yearly'
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  Yearly
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, billingType: 'free' })}
                  className={`px-3 py-1.5 border-2 rounded-lg text-sm font-medium transition-all ${
                    formData.billingType === 'free'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  Free (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, billingType: 'trial' })}
                  className={`px-3 py-1.5 border-2 rounded-lg text-sm font-medium transition-all ${
                    formData.billingType === 'trial'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  Trial (14 days)
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.billingType === 'free' && 'No Stripe subscription - free access managed by admin.'}
                {formData.billingType === 'trial' && 'Sets 14-day trial period. User can upgrade anytime.'}
                {formData.billingType === 'monthly' && 'Standard monthly billing through Stripe.'}
                {formData.billingType === 'yearly' && 'Annual billing with discount through Stripe.'}
              </p>
            </div>
          </div>

          {/* Delivery Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Delivery Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.deliveryEnabled}
                    onChange={(e) => setFormData({ ...formData, deliveryEnabled: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Delivery</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.pickupEnabled}
                    onChange={(e) => setFormData({ ...formData, pickupEnabled: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Pickup</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Delivery Fee</label>
                  <input
                    type="number"
                    value={formData.deliveryFee}
                    onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 placeholder:text-gray-500"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Order</label>
                  <input
                    type="number"
                    value={formData.minimumOrder}
                    onChange={(e) => setFormData({ ...formData, minimumOrder: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 placeholder:text-gray-500"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mark as Complete */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={formData.markAsComplete}
                onChange={(e) => setFormData({ ...formData, markAsComplete: e.target.checked })}
                className="rounded border-gray-300 mt-1"
              />
              <div>
                <span className="text-sm font-medium text-teal-800">Mark setup as complete</span>
                <p className="text-xs text-teal-600">This will allow the business owner to access all features and impersonation will be enabled.</p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
