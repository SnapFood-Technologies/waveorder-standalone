// src/app/admin/stores/[businessId]/all-stores/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Store,
  Plus,
  Crown,
  ExternalLink,
  Settings,
  BarChart3,
  Clock,
  AlertTriangle,
  Loader2,
  ArrowRight,
  LayoutDashboard,
  PieChart,
  ShoppingBag,
  Boxes,
  TrendingUp,
  Users,
  Package,
  Star,
  CheckCircle
} from 'lucide-react'
import { StoreComparison } from '@/components/admin/stores/StoreComparison'
import { QuickCreateStoreModal } from '@/components/admin/stores/QuickCreateStoreModal'

interface StoreData {
  id: string
  name: string
  slug: string
  logo: string | null
  coverImage: string | null
  subscriptionPlan: 'STARTER' | 'PRO' | 'BUSINESS'
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED'
  trialEndsAt: string | null
  graceEndsAt: string | null
  createdAt: string
  role: 'OWNER' | 'MANAGER' | 'STAFF'
}

interface StoreLimits {
  canCreate: boolean
  currentCount: number
  limit: number
  limitReached: boolean
  suggestedUpgrade?: 'PRO' | 'BUSINESS'
  planName: string
  isUnlimited: boolean
}

export default function AllStoresPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const currentBusinessId = params.businessId as string
  
  const [stores, setStores] = useState<StoreData[]>([])
  const [storeLimits, setStoreLimits] = useState<StoreLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [defaultStoreId, setDefaultStoreId] = useState<string | null>(null)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)
  const [showQuickCreate, setShowQuickCreate] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    if (status === 'authenticated') {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      const [storesRes, limitsRes, defaultRes] = await Promise.all([
        fetch('/api/user/businesses'),
        fetch('/api/user/store-limits'),
        fetch('/api/user/default-store')
      ])

      if (limitsRes.ok) {
        const limitsData = await limitsRes.json()
        setStoreLimits(limitsData)
      }

      if (storesRes.ok) {
        const storesData = await storesRes.json()
        setStores(storesData.businesses || [])
      }

      if (defaultRes.ok) {
        const defaultData = await defaultRes.json()
        setDefaultStoreId(defaultData.defaultBusinessId)
      }
    } catch (err) {
      setError('An error occurred while loading data')
    } finally {
      setLoading(false)
    }
  }

  const setAsDefaultStore = async (businessId: string) => {
    try {
      setSettingDefault(businessId)
      const response = await fetch('/api/user/default-store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId })
      })

      if (response.ok) {
        setDefaultStoreId(businessId)
      }
    } catch (err) {
      console.error('Error setting default store:', err)
    } finally {
      setSettingDefault(null)
    }
  }

  const getTrialStatus = (store: StoreData) => {
    if (!store.trialEndsAt) return null

    const now = new Date()
    const trialEnd = new Date(store.trialEndsAt)
    const graceEnd = store.graceEndsAt ? new Date(store.graceEndsAt) : null

    if (now < trialEnd) {
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { type: 'trial', daysLeft }
    } else if (graceEnd && now < graceEnd) {
      const daysLeft = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { type: 'grace', daysLeft }
    } else if (graceEnd && now >= graceEnd) {
      return { type: 'expired', daysLeft: 0 }
    }

    return null
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'BUSINESS':
        return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' }
      case 'PRO':
        return { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your stores...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Stores</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const currentStore = stores.find(s => s.id === currentBusinessId)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Stores</h1>
          <p className="text-gray-600 mt-1">
            Manage and switch between your stores
          </p>
        </div>
        
        {storeLimits?.canCreate && (
          <button
            onClick={() => setShowQuickCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Store</span>
          </button>
        )}
      </div>

      {/* Plan & Limits Summary */}
      {storeLimits && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                storeLimits.planName === 'BUSINESS' ? 'bg-purple-100' :
                storeLimits.planName === 'PRO' ? 'bg-teal-100' : 'bg-gray-100'
              }`}>
                <Store className={`w-6 h-6 ${
                  storeLimits.planName === 'BUSINESS' ? 'text-purple-600' :
                  storeLimits.planName === 'PRO' ? 'text-teal-600' : 'text-gray-600'
                }`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{storeLimits.planName} Plan</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    storeLimits.planName === 'BUSINESS' ? 'bg-purple-100 text-purple-700' :
                    storeLimits.planName === 'PRO' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {storeLimits.isUnlimited ? 'Unlimited' : `${storeLimits.limit} stores`}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {storeLimits.isUnlimited
                    ? `You have ${storeLimits.currentCount} store${storeLimits.currentCount !== 1 ? 's' : ''}`
                    : `${storeLimits.currentCount} of ${storeLimits.limit} stores used`
                  }
                </p>
              </div>
            </div>
            
            {/* Progress bar for non-unlimited plans */}
            {!storeLimits.isUnlimited && (
              <div className="w-full sm:w-48">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Usage</span>
                  <span>{Math.round((storeLimits.currentCount / storeLimits.limit) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      storeLimits.limitReached ? 'bg-amber-500' : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.min((storeLimits.currentCount / storeLimits.limit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {storeLimits.limitReached && storeLimits.suggestedUpgrade && (
              <Link
                href={`/admin/stores/${currentBusinessId}/settings/billing`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium"
              >
                <Crown className="w-4 h-4" />
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Cross-Store Tools - Only for 2+ stores */}
      {stores.length >= 2 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Cross-Store Tools</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage all your stores from one place</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Link
                href={`/admin/stores/${currentBusinessId}/unified/dashboard`}
                className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all group"
              >
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <LayoutDashboard className="w-5 h-5 text-teal-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">Unified Dashboard</span>
              </Link>
              
              <Link
                href={`/admin/stores/${currentBusinessId}/unified/analytics`}
                className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <PieChart className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">Analytics</span>
              </Link>
              
              <Link
                href={`/admin/stores/${currentBusinessId}/unified/orders`}
                className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">All Orders</span>
              </Link>
              
              <Link
                href={`/admin/stores/${currentBusinessId}/unified/inventory`}
                className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Boxes className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-900 text-center">Inventory</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Store Comparison */}
      {stores.length >= 2 && (
        <StoreComparison className="" showQuickActions={false} businessId={currentBusinessId} />
      )}

      {/* Stores List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Your Stores</h2>
            <p className="text-sm text-gray-500 mt-0.5">{stores.length} store{stores.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {stores.map((store) => {
            const trialStatus = getTrialStatus(store)
            const isDefault = defaultStoreId === store.id || (!defaultStoreId && stores[0]?.id === store.id)
            const isCurrent = store.id === currentBusinessId
            const planColors = getPlanColor(store.subscriptionPlan)
            
            return (
              <div
                key={store.id}
                className={`p-4 sm:p-6 ${isCurrent ? 'bg-teal-50/50' : 'hover:bg-gray-50'} transition-colors`}
              >
                {/* Trial/Grace Warning */}
                {trialStatus && (
                  <div className={`mb-3 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                    trialStatus.type === 'trial' ? 'bg-blue-100 text-blue-700' :
                    trialStatus.type === 'grace' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {trialStatus.type === 'expired' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    {trialStatus.type === 'trial' && `${trialStatus.daysLeft} days left in trial`}
                    {trialStatus.type === 'grace' && `Grace period: ${trialStatus.daysLeft} days remaining`}
                    {trialStatus.type === 'expired' && 'Trial expired - Add payment to continue'}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Store Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {store.logo ? (
                        <img src={store.logo} alt={store.name} className="w-full h-full object-contain" />
                      ) : store.coverImage ? (
                        <img src={store.coverImage} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{store.name}</h3>
                        {isCurrent && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 flex-shrink-0">
                            Current
                          </span>
                        )}
                        {isDefault && !isCurrent && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex-shrink-0">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-sm text-gray-500">/{store.slug}</span>
                        <span className="text-gray-300">•</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${planColors.bg} ${planColors.text}`}>
                          {store.subscriptionPlan}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          store.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {store.subscriptionStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isCurrent && (
                      <Link
                        href={`/admin/stores/${store.id}/dashboard`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span className="hidden sm:inline">Switch</span>
                      </Link>
                    )}
                    <Link
                      href={`/${store.slug}`}
                      target="_blank"
                      className="p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View storefront"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/stores/${store.id}/settings/business`}
                      className="p-2 text-gray-500 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                    {stores.length > 1 && !isDefault && (
                      <button
                        onClick={() => setAsDefaultStore(store.id)}
                        disabled={settingDefault === store.id}
                        className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Set as default"
                      >
                        {settingDefault === store.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Star className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Create Store CTA */}
        {storeLimits?.canCreate && (
          <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Create another store</p>
                  <p className="text-sm text-gray-500">
                    {storeLimits.isUnlimited 
                      ? 'You can create unlimited stores'
                      : `${storeLimits.limit - storeLimits.currentCount} more store${storeLimits.limit - storeLimits.currentCount !== 1 ? 's' : ''} available`
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQuickCreate(true)}
                className="w-full sm:w-auto px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
              >
                Create Store
              </button>
            </div>
          </div>
        )}

        {/* Upgrade CTA when at limit */}
        {storeLimits?.limitReached && storeLimits.suggestedUpgrade && (
          <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Need more stores?</p>
                  <p className="text-sm text-gray-600">
                    Upgrade to {storeLimits.suggestedUpgrade} for {
                      storeLimits.suggestedUpgrade === 'PRO' ? 'up to 5 stores' : 'unlimited stores'
                    }
                  </p>
                </div>
              </div>
              <Link
                href={`/admin/stores/${currentBusinessId}/settings/billing`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Crown className="w-4 h-4" />
                Upgrade Plan
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {stores.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No stores yet</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first store to start selling with WaveOrder
          </p>
          <Link
            href="/setup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Store
          </Link>
        </div>
      )}

      {/* Quick Create Modal */}
      <QuickCreateStoreModal
        isOpen={showQuickCreate}
        onClose={() => setShowQuickCreate(false)}
      />
    </div>
  )
}
